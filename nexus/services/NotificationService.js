// services/NotificationService.js
import { Notification, NotificationPreference, EmailLog, SmsLog } from "../models/index.js";

class NotificationService {
   // Send email notification
   async sendEmail(to, subject, body, options = {}) {
      const { priority = "normal", template = null, attachments = [] } = options;

      // In a real implementation, integrate with email service (SendGrid, AWS SES, etc.)
      // For now, simulate email sending
      const emailResult = await this.simulateEmailSending(to, subject, body);

      // Log email
      const emailLog = new EmailLog({
         to,
         subject,
         body,
         status: emailResult.success ? "sent" : "failed",
         providerResponse: emailResult.response,
         sentAt: new Date(),
      });

      await emailLog.save();

      // Create notification record
      const notification = new Notification({
         type: "email",
         recipient: to,
         subject,
         message: body,
         status: emailResult.success ? "sent" : "failed",
         priority,
         metadata: {
            template,
            attachments: attachments.length,
         },
      });

      await notification.save();

      if (!emailResult.success) {
         throw new Error(`Email sending failed: ${emailResult.error}`);
      }

      return {
         success: true,
         notificationId: notification._id,
         emailLogId: emailLog._id,
      };
   }

   // Send SMS notification
   async sendSms(to, message, options = {}) {
      const { priority = "normal" } = options;

      // In a real implementation, integrate with SMS service (Twilio, AWS SNS, etc.)
      const smsResult = await this.simulateSmsSending(to, message);

      // Log SMS
      const smsLog = new SmsLog({
         to,
         message,
         status: smsResult.success ? "sent" : "failed",
         providerResponse: smsResult.response,
         sentAt: new Date(),
      });

      await smsLog.save();

      // Create notification record
      const notification = new Notification({
         type: "sms",
         recipient: to,
         message,
         status: smsResult.success ? "sent" : "failed",
         priority,
      });

      await notification.save();

      if (!smsResult.success) {
         throw new Error(`SMS sending failed: ${smsResult.error}`);
      }

      return {
         success: true,
         notificationId: notification._id,
         smsLogId: smsLog._id,
      };
   }

   // Send push notification
   async sendPush(userId, message, options = {}) {
      const { title = "Notification", data = {}, priority = "normal" } = options;

      // Check user preferences
      const preferences = await NotificationPreference.findOne({ user: userId });
      if (preferences && !preferences.pushEnabled) {
         return { success: false, reason: "Push notifications disabled by user" };
      }

      // In a real implementation, integrate with push service (Firebase, OneSignal, etc.)
      const pushResult = await this.simulatePushSending(userId, title, message, data);

      // Create notification record
      const notification = new Notification({
         type: "push",
         recipient: userId,
         subject: title,
         message,
         status: pushResult.success ? "sent" : "failed",
         priority,
         metadata: data,
      });

      await notification.save();

      if (!pushResult.success) {
         throw new Error(`Push notification failed: ${pushResult.error}`);
      }

      return {
         success: true,
         notificationId: notification._id,
      };
   }

   // Send low stock alerts
   async sendLowStockAlerts(productId, warehouseId, currentStock) {
      // Find users who should receive low stock alerts
      const preferences = await NotificationPreference.find({
         lowStockAlerts: true,
      }).populate("user");

      const alerts = [];

      for (const preference of preferences) {
         const user = preference.user;

         // Send email alert
         try {
            await this.sendEmail(
               user.email,
               "Low Stock Alert",
               `Product ${productId} in warehouse ${warehouseId} is running low. Current stock: ${currentStock}`,
               { priority: "high" }
            );
            alerts.push({ user: user._id, method: "email", success: true });
         } catch (error) {
            alerts.push({ user: user._id, method: "email", success: false, error: error.message });
         }

         // Send push notification if enabled
         if (preference.pushEnabled) {
            try {
               await this.sendPush(user._id, `Low stock alert for product ${productId}`, {
                  title: "Low Stock Alert",
                  data: { productId, warehouseId, currentStock },
               });
               alerts.push({ user: user._id, method: "push", success: true });
            } catch (error) {
               alerts.push({ user: user._id, method: "push", success: false, error: error.message });
            }
         }
      }

      return {
         productId,
         warehouseId,
         currentStock,
         alertsSent: alerts.filter((a) => a.success).length,
         alertsFailed: alerts.filter((a) => !a.success).length,
         details: alerts,
      };
   }

   // Manage notification preferences
   async managePreferences(userId, preferences) {
      const {
         emailEnabled = true,
         smsEnabled = false,
         pushEnabled = true,
         lowStockAlerts = true,
         orderUpdates = true,
         marketingEmails = false,
      } = preferences;

      let userPreferences = await NotificationPreference.findOne({ user: userId });

      if (!userPreferences) {
         userPreferences = new NotificationPreference({ user: userId });
      }

      // Update preferences
      userPreferences.emailEnabled = emailEnabled;
      userPreferences.smsEnabled = smsEnabled;
      userPreferences.pushEnabled = pushEnabled;
      userPreferences.lowStockAlerts = lowStockAlerts;
      userPreferences.orderUpdates = orderUpdates;
      userPreferences.marketingEmails = marketingEmails;
      userPreferences.updatedAt = new Date();

      await userPreferences.save();

      return userPreferences;
   }

   // Get notification history
   async getNotificationHistory(userId, limit = 20) {
      const notifications = await Notification.find({
         $or: [
            { recipient: userId },
            { recipient: { $regex: userId, $options: "i" } }, // For email addresses
         ],
      })
         .sort({ createdAt: -1 })
         .limit(limit);

      return notifications.map((notification) => ({
         id: notification._id,
         type: notification.type,
         subject: notification.subject,
         message: notification.message,
         status: notification.status,
         priority: notification.priority,
         createdAt: notification.createdAt,
         readAt: notification.readAt,
      }));
   }

   // Mark notification as read
   async markAsRead(notificationId, userId) {
      const notification = await Notification.findOneAndUpdate(
         { _id: notificationId, recipient: userId },
         { readAt: new Date() },
         { new: true }
      );

      if (!notification) {
         throw new Error("Notification not found or access denied");
      }

      return notification;
   }

   // Send bulk notifications
   async sendBulkNotifications(recipients, notificationData) {
      const { type, subject, message, options = {} } = notificationData;

      const results = {
         total: recipients.length,
         successful: 0,
         failed: 0,
         details: [],
      };

      for (const recipient of recipients) {
         try {
            let result;

            switch (type) {
               case "email":
                  result = await this.sendEmail(recipient, subject, message, options);
                  break;
               case "sms":
                  result = await this.sendSms(recipient, message, options);
                  break;
               case "push":
                  result = await this.sendPush(recipient, message, options);
                  break;
               default:
                  throw new Error(`Unsupported notification type: ${type}`);
            }

            results.successful++;
            results.details.push({ recipient, success: true, result });
         } catch (error) {
            results.failed++;
            results.details.push({ recipient, success: false, error: error.message });
         }
      }

      return results;
   }

   // Simulate email sending (for demo purposes)
   async simulateEmailSending(to, subject, body) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Simulate success/failure (95% success rate)
      const success = Math.random() > 0.05;

      return {
         success,
         messageId: success ? `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
         response: success ? "Email sent successfully" : "SMTP server error",
         error: success ? null : "Failed to deliver email",
      };
   }

   // Simulate SMS sending
   async simulateSmsSending(to, message) {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const success = Math.random() > 0.03; // 97% success rate

      return {
         success,
         messageId: success ? `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
         response: success ? "SMS sent successfully" : "Gateway error",
         error: success ? null : "Failed to send SMS",
      };
   }

   // Simulate push notification sending
   async simulatePushSending(userId, title, message, data) {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const success = Math.random() > 0.02; // 98% success rate

      return {
         success,
         messageId: success ? `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
         response: success ? "Push notification sent" : "FCM error",
         error: success ? null : "Failed to send push notification",
      };
   }

   // Get notification statistics
   async getNotificationStats(startDate, endDate) {
      const stats = await Notification.aggregate([
         {
            $match: {
               createdAt: {
                  $gte: new Date(startDate),
                  $lte: new Date(endDate),
               },
            },
         },
         {
            $group: {
               _id: {
                  type: "$type",
                  status: "$status",
               },
               count: { $sum: 1 },
            },
         },
      ]);

      const summary = {
         period: { startDate, endDate },
         byType: {},
         byStatus: {},
         total: 0,
      };

      for (const stat of stats) {
         const { type, status } = stat._id;

         if (!summary.byType[type]) {
            summary.byType[type] = { sent: 0, failed: 0, total: 0 };
         }

         if (!summary.byStatus[status]) {
            summary.byStatus[status] = 0;
         }

         summary.byType[type][status === "sent" ? "sent" : "failed"] = stat.count;
         summary.byType[type].total += stat.count;
         summary.byStatus[status] += stat.count;
         summary.total += stat.count;
      }

      return summary;
   }
}

const notificationService = new NotificationService();
export default notificationService;
