// services/BillingService.js
import { Invoice, Subscription, UsageRecord, BillingCycle } from "../models/index.js";
import * as PaymentService from "./PaymentService.js";
import * as NotificationService from "./NotificationService.js";

class BillingService {
   // Generate invoice for subscription
   async invoiceGeneration(subscriptionId) {
      const subscription = await Subscription.findById(subscriptionId).populate("customer plan");
      if (!subscription) {
         throw new Error("Subscription not found");
      }

      // Calculate billing period
      const billingPeriod = this.calculateBillingPeriod(subscription);

      // Calculate usage charges
      const usageCharges = await this.calculateUsageCharges(subscriptionId, billingPeriod);

      // Calculate total amount
      const totalAmount = subscription.plan.basePrice + usageCharges.total;

      // Create invoice
      const invoice = new Invoice({
         subscription: subscriptionId,
         customer: subscription.customer,
         billingPeriod,
         items: [
            {
               description: `${subscription.plan.name} - Base Plan`,
               amount: subscription.plan.basePrice,
               type: "subscription",
            },
            ...usageCharges.items,
         ],
         totalAmount,
         status: "pending",
         dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      await invoice.save();

      // Send invoice notification
      await NotificationService.sendEmail(
         "customer@example.com", // In real implementation, get from customer
         "Invoice Generated",
         `Your invoice #${invoice._id} for $${totalAmount.toFixed(2)} is ready. Due date: ${invoice.dueDate.toDateString()}`
      );

      return invoice;
   }

   // Handle subscription billing cycle
   async subscriptionCycle(subscriptionId) {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
         throw new Error("Subscription not found");
      }

      // Check if billing cycle is due
      const now = new Date();
      const nextBillingDate = new Date(subscription.nextBillingDate);

      if (now < nextBillingDate) {
         return { message: "Billing cycle not yet due", nextBilling: nextBillingDate };
      }

      // Generate invoice
      const invoice = await this.invoiceGeneration(subscriptionId);

      // Attempt to charge payment method
      try {
         const payment = await PaymentService.charge(
            invoice.totalAmount,
            subscription.paymentMethod,
            null, // No specific order
            subscription.customer
         );

         // Update invoice with payment
         invoice.status = "paid";
         invoice.paidAt = new Date();
         invoice.payment = payment._id;
         await invoice.save();

         // Update subscription next billing date
         subscription.nextBillingDate = this.calculateNextBillingDate(subscription);
         subscription.lastBilledAt = new Date();
         await subscription.save();

         // Send payment confirmation
         await NotificationService.sendEmail(
            "customer@example.com",
            "Payment Processed",
            `Your subscription payment of $${invoice.totalAmount.toFixed(2)} has been processed successfully.`
         );

         return {
            success: true,
            invoice,
            payment,
            nextBilling: subscription.nextBillingDate,
         };
      } catch (error) {
         // Payment failed
         invoice.status = "payment_failed";
         await invoice.save();

         // Send payment failure notification
         await NotificationService.sendEmail(
            "customer@example.com",
            "Payment Failed",
            `Your subscription payment of $${invoice.totalAmount.toFixed(2)} failed. Please update your payment method.`
         );

         return {
            success: false,
            invoice,
            error: error.message,
         };
      }
   }

   // Handle usage-based billing
   async usageBilling(subscriptionId, usage) {
      const subscription = await Subscription.findById(subscriptionId).populate("plan");
      if (!subscription) {
         throw new Error("Subscription not found");
      }

      // Record usage
      const usageRecord = new UsageRecord({
         subscription: subscriptionId,
         type: usage.type,
         quantity: usage.quantity,
         unitPrice: usage.unitPrice,
         totalAmount: usage.quantity * usage.unitPrice,
         recordedAt: new Date(),
      });

      await usageRecord.save();

      // Check if usage exceeds plan limits
      const planLimits = subscription.plan.limits || {};
      if (planLimits[usage.type] && usage.quantity > planLimits[usage.type]) {
         // Calculate overage charges
         const overageQuantity = usage.quantity - planLimits[usage.type];
         const overageAmount = overageQuantity * usage.unitPrice;

         // Send overage notification
         await NotificationService.sendEmail(
            "customer@example.com",
            "Usage Limit Exceeded",
            `You have exceeded your ${usage.type} limit. Overage charges: $${overageAmount.toFixed(2)}`
         );

         return {
            usageRecord,
            overage: {
               quantity: overageQuantity,
               amount: overageAmount,
            },
         };
      }

      return { usageRecord, overage: null };
   }

   // Calculate billing period
   calculateBillingPeriod(subscription) {
      const now = new Date();
      let startDate, endDate;

      if (subscription.billingCycle === "monthly") {
         startDate = new Date(now.getFullYear(), now.getMonth(), 1);
         endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (subscription.billingCycle === "yearly") {
         startDate = new Date(now.getFullYear(), 0, 1);
         endDate = new Date(now.getFullYear(), 11, 31);
      } else {
         // Daily for demo
         startDate = new Date(now);
         startDate.setHours(0, 0, 0, 0);
         endDate = new Date(now);
         endDate.setHours(23, 59, 59, 999);
      }

      return { startDate, endDate };
   }

   // Calculate usage charges
   async calculateUsageCharges(subscriptionId, billingPeriod) {
      const usageRecords = await UsageRecord.find({
         subscription: subscriptionId,
         recordedAt: {
            $gte: billingPeriod.startDate,
            $lte: billingPeriod.endDate,
         },
      });

      const usageCharges = {
         total: 0,
         items: [],
      };

      // Group usage by type
      const usageByType = {};
      for (const record of usageRecords) {
         if (!usageByType[record.type]) {
            usageByType[record.type] = {
               quantity: 0,
               totalAmount: 0,
            };
         }
         usageByType[record.type].quantity += record.quantity;
         usageByType[record.type].totalAmount += record.totalAmount;
      }

      // Create charge items
      for (const [type, data] of Object.entries(usageByType)) {
         usageCharges.items.push({
            description: `${type} usage`,
            quantity: data.quantity,
            unitPrice: data.totalAmount / data.quantity,
            amount: data.totalAmount,
            type: "usage",
         });
         usageCharges.total += data.totalAmount;
      }

      return usageCharges;
   }

   // Calculate next billing date
   calculateNextBillingDate(subscription) {
      const now = new Date();

      if (subscription.billingCycle === "monthly") {
         return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      } else if (subscription.billingCycle === "yearly") {
         return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      } else {
         // Daily
         const tomorrow = new Date(now);
         tomorrow.setDate(tomorrow.getDate() + 1);
         return tomorrow;
      }
   }

   // Get billing history
   async getBillingHistory(customerId, limit = 10) {
      const invoices = await Invoice.find({ customer: customerId })
         .populate("subscription")
         .sort({ createdAt: -1 })
         .limit(limit);

      return invoices.map((invoice) => ({
         id: invoice._id,
         subscription: invoice.subscription?.name || "N/A",
         period: invoice.billingPeriod,
         totalAmount: invoice.totalAmount,
         status: invoice.status,
         dueDate: invoice.dueDate,
         paidAt: invoice.paidAt,
      }));
   }

   // Process payment for invoice
   async processInvoicePayment(invoiceId, paymentMethodId) {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
         throw new Error("Invoice not found");
      }

      if (invoice.status === "paid") {
         throw new Error("Invoice is already paid");
      }

      // Process payment
      const payment = await PaymentService.charge(invoice.totalAmount, paymentMethodId, null, invoice.customer);

      // Update invoice
      invoice.status = "paid";
      invoice.paidAt = new Date();
      invoice.payment = payment._id;
      await invoice.save();

      // Send confirmation
      await NotificationService.sendEmail(
         "customer@example.com",
         "Invoice Paid",
         `Your invoice #${invoice._id} has been paid successfully.`
      );

      return { invoice, payment };
   }

   // Generate billing report
   async generateBillingReport(startDate, endDate) {
      const invoices = await Invoice.find({
         createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      }).populate("customer subscription");

      const report = {
         period: { startDate, endDate },
         summary: {
            totalInvoices: invoices.length,
            totalRevenue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
            paidInvoices: invoices.filter((inv) => inv.status === "paid").length,
            pendingInvoices: invoices.filter((inv) => inv.status === "pending").length,
            failedPayments: invoices.filter((inv) => inv.status === "payment_failed").length,
         },
         invoices: invoices.map((inv) => ({
            id: inv._id,
            customer: inv.customer?.name || "N/A",
            subscription: inv.subscription?.name || "N/A",
            amount: inv.totalAmount,
            status: inv.status,
            dueDate: inv.dueDate,
            paidAt: inv.paidAt,
         })),
      };

      return report;
   }
}

const billingService = new BillingService();
export default billingService;
