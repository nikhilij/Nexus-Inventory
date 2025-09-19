// services/PaymentService.js
import { Payment, Refund, PaymentMethod } from "../models/index.js";
import * as NotificationService from "./NotificationService.js";

class PaymentService {
   // Charge a payment
   async charge(amount, paymentMethod, orderId, customerId) {
      // Validate payment method
      const method = await PaymentMethod.findById(paymentMethod);
      if (!method || !method.isActive) {
         throw new Error("Invalid or inactive payment method");
      }

      // In a real implementation, integrate with payment processor (Stripe, PayPal, etc.)
      // For now, simulate payment processing
      const paymentResult = await this.simulatePaymentProcessing(amount, method);

      if (!paymentResult.success) {
         throw new Error("Payment processing failed");
      }

      // Create payment record
      const payment = new Payment({
         order: orderId,
         customer: customerId,
         amount,
         paymentMethod,
         status: "completed",
         transactionId: paymentResult.transactionId,
         processedAt: new Date(),
      });

      await payment.save();

      // Send payment confirmation
      await NotificationService.sendEmail(
         "customer@example.com", // In real implementation, get from customer
         "Payment Confirmation",
         `Your payment of $${amount.toFixed(2)} has been processed successfully. Transaction ID: ${payment.transactionId}`
      );

      return payment;
   }

   // Process a refund
   async refund(paymentId, amount, reason) {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
         throw new Error("Payment not found");
      }

      if (payment.status !== "completed") {
         throw new Error("Payment is not in a refundable state");
      }

      // Check refund amount doesn't exceed original payment
      const existingRefunds = await Refund.find({ payment: paymentId });
      const totalRefunded = existingRefunds.reduce((sum, refund) => sum + refund.amount, 0);

      if (totalRefunded + amount > payment.amount) {
         throw new Error("Refund amount exceeds available balance");
      }

      // In a real implementation, process refund with payment processor
      const refundResult = await this.simulateRefundProcessing(amount, payment.transactionId);

      if (!refundResult.success) {
         throw new Error("Refund processing failed");
      }

      // Create refund record
      const refund = new Refund({
         payment: paymentId,
         amount,
         reason,
         status: "completed",
         transactionId: refundResult.transactionId,
         processedAt: new Date(),
      });

      await refund.save();

      // Update payment status if fully refunded
      if (totalRefunded + amount >= payment.amount) {
         payment.status = "refunded";
         await payment.save();
      }

      // Send refund notification
      await NotificationService.sendEmail(
         "customer@example.com",
         "Refund Processed",
         `Your refund of $${amount.toFixed(2)} has been processed. Transaction ID: ${refund.transactionId}`
      );

      return refund;
   }

   // Handle payment webhooks
   async webhookHandler(event) {
      const { type, data } = event;

      switch (type) {
         case "payment.succeeded":
            await this.handlePaymentSuccess(data);
            break;

         case "payment.failed":
            await this.handlePaymentFailure(data);
            break;

         case "refund.succeeded":
            await this.handleRefundSuccess(data);
            break;

         case "dispute.created":
            await this.handleDisputeCreated(data);
            break;

         default:
            console.log(`Unhandled webhook event: ${type}`);
      }

      return { received: true, type };
   }

   // Reconcile payments with external systems
   async reconcilePayments(startDate, endDate) {
      const payments = await Payment.find({
         createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
         status: "completed",
      });

      const reconciliation = {
         period: { startDate, endDate },
         totalPayments: payments.length,
         totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
         discrepancies: [],
         summary: {},
      };

      // In a real implementation, compare with external payment processor data
      // For now, simulate reconciliation
      for (const payment of payments) {
         const externalRecord = await this.getExternalPaymentRecord(payment.transactionId);

         if (!externalRecord) {
            reconciliation.discrepancies.push({
               paymentId: payment._id,
               issue: "Payment not found in external system",
               amount: payment.amount,
            });
         } else if (externalRecord.amount !== payment.amount) {
            reconciliation.discrepancies.push({
               paymentId: payment._id,
               issue: "Amount mismatch",
               localAmount: payment.amount,
               externalAmount: externalRecord.amount,
            });
         }
      }

      reconciliation.summary = {
         matched: payments.length - reconciliation.discrepancies.length,
         discrepancies: reconciliation.discrepancies.length,
         successRate: ((payments.length - reconciliation.discrepancies.length) / payments.length) * 100,
      };

      return reconciliation;
   }

   // Add payment method
   async addPaymentMethod(customerId, methodData) {
      const { type, details } = methodData;

      // In a real implementation, tokenize the payment method with payment processor
      const tokenizedMethod = await this.tokenizePaymentMethod(details);

      const paymentMethod = new PaymentMethod({
         customer: customerId,
         type,
         token: tokenizedMethod.token,
         lastFour: tokenizedMethod.lastFour,
         expiryMonth: tokenizedMethod.expiryMonth,
         expiryYear: tokenizedMethod.expiryYear,
         isActive: true,
         isDefault: false,
      });

      await paymentMethod.save();

      return paymentMethod;
   }

   // Get payment methods for customer
   async getPaymentMethods(customerId) {
      const methods = await PaymentMethod.find({
         customer: customerId,
         isActive: true,
      }).sort({ isDefault: -1, createdAt: -1 });

      return methods.map((method) => ({
         id: method._id,
         type: method.type,
         lastFour: method.lastFour,
         expiryMonth: method.expiryMonth,
         expiryYear: method.expiryYear,
         isDefault: method.isDefault,
      }));
   }

   // Set default payment method
   async setDefaultPaymentMethod(customerId, methodId) {
      // Remove default from all methods
      await PaymentMethod.updateMany({ customer: customerId }, { isDefault: false });

      // Set new default
      const method = await PaymentMethod.findOneAndUpdate(
         { _id: methodId, customer: customerId },
         { isDefault: true },
         { new: true }
      );

      if (!method) {
         throw new Error("Payment method not found");
      }

      return method;
   }

   // Simulate payment processing (for demo purposes)
   async simulatePaymentProcessing(amount, method) {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate success/failure (90% success rate)
      const success = Math.random() > 0.1;

      return {
         success,
         transactionId: success ? `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
         error: success ? null : "Payment declined",
      };
   }

   // Simulate refund processing
   async simulateRefundProcessing(amount, originalTransactionId) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const success = Math.random() > 0.05; // 95% success rate

      return {
         success,
         transactionId: success ? `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
         error: success ? null : "Refund failed",
      };
   }

   // Get external payment record (simulated)
   async getExternalPaymentRecord(transactionId) {
      // Simulate external system lookup
      return {
         amount: Math.random() * 1000,
         status: "completed",
      };
   }

   // Tokenize payment method (simulated)
   async tokenizePaymentMethod(details) {
      return {
         token: `tok_${Date.now()}`,
         lastFour: details.number.slice(-4),
         expiryMonth: details.expiryMonth,
         expiryYear: details.expiryYear,
      };
   }

   // Handle payment success webhook
   async handlePaymentSuccess(data) {
      const payment = await Payment.findOneAndUpdate(
         { transactionId: data.transactionId },
         { status: "completed", processedAt: new Date() },
         { new: true }
      );

      if (payment) {
         await NotificationService.sendEmail(
            "customer@example.com",
            "Payment Successful",
            `Your payment of $${payment.amount.toFixed(2)} was successful.`
         );
      }
   }

   // Handle payment failure webhook
   async handlePaymentFailure(data) {
      const payment = await Payment.findOneAndUpdate(
         { transactionId: data.transactionId },
         { status: "failed", failureReason: data.reason },
         { new: true }
      );

      if (payment) {
         await NotificationService.sendEmail(
            "customer@example.com",
            "Payment Failed",
            `Your payment of $${payment.amount.toFixed(2)} failed. Reason: ${data.reason}`
         );
      }
   }

   // Handle refund success webhook
   async handleRefundSuccess(data) {
      const refund = await Refund.findOneAndUpdate(
         { transactionId: data.transactionId },
         { status: "completed", processedAt: new Date() },
         { new: true }
      );

      if (refund) {
         await NotificationService.sendEmail(
            "customer@example.com",
            "Refund Processed",
            `Your refund of $${refund.amount.toFixed(2)} has been processed.`
         );
      }
   }

   // Handle dispute created webhook
   async handleDisputeCreated(data) {
      // Create dispute record and notify admin
      await NotificationService.sendEmail(
         "admin@example.com",
         "Payment Dispute Created",
         `A dispute has been created for transaction ${data.transactionId}. Amount: $${data.amount}`
      );
   }
}

const paymentService = new PaymentService();
export default paymentService;
