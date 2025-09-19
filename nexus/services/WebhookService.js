// services/WebhookService.js
import { Webhook, WebhookEvent, WebhookDelivery } from "../models/index.js";

class WebhookService {
   // Queue webhook event for delivery
   async queueEvent(event, payload) {
      const { type, data, source, priority = "normal" } = event;

      // Find active webhooks for this event type
      const webhooks = await Webhook.find({
         events: type,
         isActive: true,
      });

      if (webhooks.length === 0) {
         return { queued: 0, message: "No active webhooks for this event type" };
      }

      const deliveries = [];

      for (const webhook of webhooks) {
         // Create webhook event
         const webhookEvent = new WebhookEvent({
            webhook: webhook._id,
            type,
            payload,
            source,
            priority,
         });

         await webhookEvent.save();

         // Create delivery attempt
         const delivery = new WebhookDelivery({
            webhook: webhook._id,
            event: webhookEvent._id,
            url: webhook.url,
            status: "queued",
            attemptNumber: 1,
         });

         await delivery.save();

         deliveries.push(delivery._id);

         // Queue for immediate delivery
         setImmediate(() => this.deliverWebhook(delivery._id));
      }

      return {
         queued: deliveries.length,
         eventId: webhookEvent._id,
         deliveries,
      };
   }

   // Deliver webhook (internal method)
   async deliverWebhook(deliveryId) {
      const delivery = await WebhookDelivery.findById(deliveryId).populate("event");
      if (!delivery) return;

      const webhook = await Webhook.findById(delivery.webhook);
      if (!webhook || !webhook.isActive) {
         delivery.status = "cancelled";
         await delivery.save();
         return;
      }

      try {
         // Attempt delivery
         const response = await this.sendWebhookRequest(delivery.url, delivery.event.payload, webhook.secret);

         // Update delivery status
         delivery.status = response.success ? "delivered" : "failed";
         delivery.responseStatus = response.statusCode;
         delivery.responseBody = response.body;
         delivery.deliveredAt = new Date();

         if (!response.success) {
            // Schedule retry if failed
            await this.scheduleRetry(delivery._id);
         }
      } catch (error) {
         delivery.status = "failed";
         delivery.error = error.message;

         // Schedule retry
         await this.scheduleRetry(delivery._id);
      }

      await delivery.save();
   }

   // Retry webhook delivery
   async deliveryRetry(eventId) {
      const deliveries = await WebhookDelivery.find({
         event: eventId,
         status: { $in: ["failed", "queued"] },
      }).sort({ attemptNumber: 1 });

      const results = [];

      for (const delivery of deliveries) {
         if (delivery.attemptNumber >= 5) {
            // Max 5 attempts
            delivery.status = "dead_letter";
            await delivery.save();
            results.push({ deliveryId: delivery._id, status: "max_retries_exceeded" });
            continue;
         }

         // Increment attempt number
         delivery.attemptNumber += 1;
         delivery.status = "retrying";
         await delivery.save();

         // Schedule retry with exponential backoff
         const delay = Math.pow(2, delivery.attemptNumber) * 1000; // 2, 4, 8, 16, 32 seconds
         setTimeout(() => this.deliverWebhook(delivery._id), delay);

         results.push({
            deliveryId: delivery._id,
            attemptNumber: delivery.attemptNumber,
            scheduledFor: new Date(Date.now() + delay),
         });
      }

      return results;
   }

   // Handle dead letter queue
   async deadLetterHandling(eventId) {
      const deadDeliveries = await WebhookDelivery.find({
         event: eventId,
         status: "dead_letter",
      }).populate("event webhook");

      const results = [];

      for (const delivery of deadDeliveries) {
         // Log dead letter for manual review
         console.log("Dead letter webhook delivery:", {
            webhookId: delivery.webhook._id,
            eventId: delivery.event._id,
            url: delivery.url,
            finalError: delivery.error,
            attempts: delivery.attemptNumber,
         });

         // Mark as processed
         delivery.status = "dead_letter_processed";
         await delivery.save();

         results.push({
            deliveryId: delivery._id,
            webhookUrl: delivery.url,
            finalStatus: "processed_in_dead_letter_queue",
         });
      }

      return results;
   }

   // Register webhook
   async registerWebhook(webhookData) {
      const { url, events, secret, name, description } = webhookData;

      const webhook = new Webhook({
         url,
         events,
         secret,
         name,
         description,
         isActive: true,
      });

      await webhook.save();

      return {
         webhookId: webhook._id,
         url: webhook.url,
         events: webhook.events,
         createdAt: webhook.createdAt,
      };
   }

   // Update webhook
   async updateWebhook(webhookId, updateData) {
      const webhook = await Webhook.findByIdAndUpdate(webhookId, updateData, { new: true });
      if (!webhook) {
         throw new Error("Webhook not found");
      }

      return webhook;
   }

   // Delete webhook
   async deleteWebhook(webhookId) {
      const webhook = await Webhook.findByIdAndDelete(webhookId);
      if (!webhook) {
         throw new Error("Webhook not found");
      }

      // Cancel pending deliveries
      await WebhookDelivery.updateMany(
         { webhook: webhookId, status: { $in: ["queued", "retrying"] } },
         { status: "cancelled" }
      );

      return { success: true, message: "Webhook deleted successfully" };
   }

   // Get webhook deliveries
   async getWebhookDeliveries(webhookId, filters = {}) {
      const { status, limit = 20 } = filters;

      let query = { webhook: webhookId };
      if (status) query.status = status;

      const deliveries = await WebhookDelivery.find(query).populate("event").sort({ createdAt: -1 }).limit(limit);

      return deliveries.map((delivery) => ({
         id: delivery._id,
         eventType: delivery.event.type,
         status: delivery.status,
         attemptNumber: delivery.attemptNumber,
         url: delivery.url,
         createdAt: delivery.createdAt,
         deliveredAt: delivery.deliveredAt,
         responseStatus: delivery.responseStatus,
         error: delivery.error,
      }));
   }

   // Send webhook request (simulated)
   async sendWebhookRequest(url, payload, secret) {
      // In a real implementation, use axios or fetch to send HTTP request
      // For now, simulate the request
      await new Promise((resolve) => setTimeout(resolve, 200));

      const success = Math.random() > 0.1; // 90% success rate

      return {
         success,
         statusCode: success ? 200 : 500,
         body: success ? "OK" : "Internal Server Error",
      };
   }

   // Schedule retry
   async scheduleRetry(deliveryId) {
      const delivery = await WebhookDelivery.findById(deliveryId);
      if (!delivery) return;

      // Schedule retry with exponential backoff
      const delay = Math.pow(2, delivery.attemptNumber) * 1000;
      setTimeout(() => this.deliverWebhook(deliveryId), delay);
   }

   // Get webhook statistics
   async getWebhookStats(webhookId, dateRange) {
      const deliveries = await WebhookDelivery.find({
         webhook: webhookId,
         createdAt: {
            $gte: new Date(dateRange.start),
            $lte: new Date(dateRange.end),
         },
      });

      const stats = {
         total: deliveries.length,
         delivered: deliveries.filter((d) => d.status === "delivered").length,
         failed: deliveries.filter((d) => d.status === "failed").length,
         retrying: deliveries.filter((d) => d.status === "retrying").length,
         deadLetter: deliveries.filter((d) => d.status === "dead_letter").length,
         averageResponseTime: 0,
         successRate: 0,
      };

      // Calculate success rate
      if (stats.total > 0) {
         stats.successRate = (stats.delivered / stats.total) * 100;
      }

      // Calculate average response time (simplified)
      const deliveredDeliveries = deliveries.filter((d) => d.deliveredAt);
      if (deliveredDeliveries.length > 0) {
         const totalResponseTime = deliveredDeliveries.reduce((sum, d) => {
            return sum + (d.deliveredAt - d.createdAt);
         }, 0);
         stats.averageResponseTime = totalResponseTime / deliveredDeliveries.length;
      }

      return stats;
   }

   // Test webhook
   async testWebhook(webhookId) {
      const webhook = await Webhook.findById(webhookId);
      if (!webhook) {
         throw new Error("Webhook not found");
      }

      // Send test payload
      const testPayload = {
         event: "test",
         timestamp: new Date(),
         data: { message: "This is a test webhook" },
      };

      const response = await this.sendWebhookRequest(webhook.url, testPayload, webhook.secret);

      return {
         success: response.success,
         statusCode: response.statusCode,
         response: response.body,
         timestamp: new Date(),
      };
   }
}

const webhookService = new WebhookService();
export default webhookService;
