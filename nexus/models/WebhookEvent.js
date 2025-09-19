// models/WebhookEvent.js
import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
   {
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      webhook: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Webhook",
         required: true,
      },
      event: {
         type: String,
         required: true,
         trim: true,
      },
      eventType: {
         type: String,
         required: true,
         enum: [
            "user.created",
            "user.updated",
            "user.deleted",
            "product.created",
            "product.updated",
            "product.deleted",
            "order.created",
            "order.updated",
            "order.fulfilled",
            "order.cancelled",
            "inventory.adjusted",
            "inventory.low_stock",
            "invoice.created",
            "invoice.paid",
            "invoice.overdue",
            "subscription.created",
            "subscription.updated",
            "subscription.cancelled",
            "warehouse.created",
            "warehouse.updated",
            "supplier.created",
            "supplier.updated",
         ],
      },
      payload: {
         type: mongoose.Schema.Types.Mixed,
         required: true,
      },
      headers: {
         type: Map,
         of: String,
      },
      status: {
         type: String,
         enum: ["pending", "processing", "succeeded", "failed", "retrying"],
         default: "pending",
      },
      attempts: {
         type: Number,
         default: 0,
         min: 0,
      },
      maxAttempts: {
         type: Number,
         default: 5,
         min: 1,
         max: 10,
      },
      lastAttemptAt: Date,
      nextAttemptAt: Date,
      succeededAt: Date,
      failedAt: Date,
      error: {
         message: String,
         code: String,
         details: mongoose.Schema.Types.Mixed,
      },
      response: {
         statusCode: Number,
         headers: {
            type: Map,
            of: String,
         },
         body: String,
         duration: Number, // in milliseconds
      },
      signature: String,
      idempotencyKey: {
         type: String,
         trim: true,
      },
      priority: {
         type: String,
         enum: ["low", "normal", "high", "critical"],
         default: "normal",
      },
      tags: [
         {
            type: String,
            trim: true,
            lowercase: true,
         },
      ],
      metadata: {
         type: Map,
         of: mongoose.Schema.Types.Mixed,
      },
      source: {
         type: String,
         enum: ["system", "user_action", "api", "import", "sync"],
         default: "system",
      },
      processedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
webhookEventSchema.index({ organization: 1 });
webhookEventSchema.index({ webhook: 1 });
webhookEventSchema.index({ event: 1 });
webhookEventSchema.index({ eventType: 1 });
webhookEventSchema.index({ status: 1 });
webhookEventSchema.index({ nextAttemptAt: 1 });
webhookEventSchema.index({ createdAt: -1 });
webhookEventSchema.index({ succeededAt: -1 });
webhookEventSchema.index({ failedAt: -1 });
webhookEventSchema.index({ idempotencyKey: 1 });

// Compound indexes
webhookEventSchema.index({ organization: 1, status: 1 });
webhookEventSchema.index({ organization: 1, eventType: 1 });
webhookEventSchema.index({ organization: 1, createdAt: -1 });
webhookEventSchema.index({ webhook: 1, status: 1 });
webhookEventSchema.index({ webhook: 1, createdAt: -1 });
webhookEventSchema.index({ status: 1, nextAttemptAt: 1 });
webhookEventSchema.index({ organization: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

// Virtuals
webhookEventSchema.virtual("isPending").get(function () {
   return this.status === "pending";
});

webhookEventSchema.virtual("isProcessing").get(function () {
   return this.status === "processing";
});

webhookEventSchema.virtual("isSucceeded").get(function () {
   return this.status === "succeeded";
});

webhookEventSchema.virtual("isFailed").get(function () {
   return this.status === "failed";
});

webhookEventSchema.virtual("isRetrying").get(function () {
   return this.status === "retrying";
});

webhookEventSchema.virtual("canRetry").get(function () {
   return this.attempts < this.maxAttempts && !this.isSucceeded;
});

webhookEventSchema.virtual("shouldRetry").get(function () {
   return this.isFailed && this.canRetry;
});

webhookEventSchema.virtual("isExpired").get(function () {
   if (!this.nextAttemptAt) return false;
   return new Date() > this.nextAttemptAt;
});

webhookEventSchema.virtual("processingTime").get(function () {
   if (!this.succeededAt || !this.createdAt) return null;
   return this.succeededAt - this.createdAt;
});

webhookEventSchema.virtual("attemptsRemaining").get(function () {
   return Math.max(0, this.maxAttempts - this.attempts);
});

// Pre-save middleware
webhookEventSchema.pre("save", function (next) {
   // Set next attempt time for retries
   if (this.shouldRetry && !this.nextAttemptAt) {
      const delayMinutes = Math.min(2 ** this.attempts, 60); // Exponential backoff, max 1 hour
      this.nextAttemptAt = new Date(Date.now() + delayMinutes * 60 * 1000);
   }

   // Set timestamps based on status
   if (this.status === "succeeded" && !this.succeededAt) {
      this.succeededAt = new Date();
   } else if (this.status === "failed" && !this.failedAt) {
      this.failedAt = new Date();
   }

   // Update last attempt time
   if (this.isModified("status") && (this.status === "processing" || this.status === "failed")) {
      this.lastAttemptAt = new Date();
   }

   next();
});

// Instance methods
webhookEventSchema.methods.markAsProcessing = function (processorId) {
   this.status = "processing";
   this.processedBy = processorId;
   this.attempts += 1;
   return this.save();
};

webhookEventSchema.methods.markAsSucceeded = function (response) {
   this.status = "succeeded";
   this.succeededAt = new Date();
   if (response) {
      this.response = {
         ...response,
         duration: response.duration || new Date() - this.lastAttemptAt,
      };
   }
   return this.save();
};

webhookEventSchema.methods.markAsFailed = function (error, response) {
   this.status = "failed";
   this.failedAt = new Date();
   this.error = {
      message: error.message,
      code: error.code,
      details: error.details,
   };

   if (response) {
      this.response = response;
   }

   if (this.canRetry) {
      this.status = "retrying";
   }

   return this.save();
};

webhookEventSchema.methods.retry = function () {
   if (!this.canRetry) {
      throw new Error("Cannot retry: maximum attempts reached");
   }

   this.status = "pending";
   this.nextAttemptAt = null; // Will be set by pre-save middleware
   return this.save();
};

webhookEventSchema.methods.reset = function () {
   this.status = "pending";
   this.attempts = 0;
   this.lastAttemptAt = null;
   this.nextAttemptAt = null;
   this.succeededAt = null;
   this.failedAt = null;
   this.error = null;
   this.response = null;
   return this.save();
};

webhookEventSchema.methods.addTag = function (tag) {
   if (!this.tags.includes(tag)) {
      this.tags.push(tag);
   }
   return this.save();
};

webhookEventSchema.methods.removeTag = function (tag) {
   this.tags = this.tags.filter((t) => t !== tag);
   return this.save();
};

webhookEventSchema.methods.getFormattedPayload = function () {
   return {
      id: this._id,
      event: this.event,
      eventType: this.eventType,
      payload: this.payload,
      metadata: this.metadata,
      timestamp: this.createdAt,
      attempt: this.attempts,
      source: this.source,
   };
};

// Static methods
webhookEventSchema.statics.findPending = function (organizationId, limit = 100) {
   return this.find({
      organization: organizationId,
      status: "pending",
   })
      .populate("webhook", "url name")
      .sort({ priority: -1, createdAt: 1 })
      .limit(limit);
};

webhookEventSchema.statics.findFailed = function (organizationId, limit = 50) {
   return this.find({
      organization: organizationId,
      status: "failed",
   })
      .populate("webhook", "url name")
      .sort({ createdAt: -1 })
      .limit(limit);
};

webhookEventSchema.statics.findRetrying = function (organizationId, limit = 50) {
   return this.find({
      organization: organizationId,
      status: "retrying",
   })
      .populate("webhook", "url name")
      .sort({ nextAttemptAt: 1 })
      .limit(limit);
};

webhookEventSchema.statics.findByEventType = function (eventType, organizationId, limit = 100) {
   return this.find({
      organization: organizationId,
      eventType: eventType,
   })
      .populate("webhook", "url name")
      .sort({ createdAt: -1 })
      .limit(limit);
};

webhookEventSchema.statics.findExpiredRetries = function () {
   return this.find({
      status: "retrying",
      nextAttemptAt: { $lt: new Date() },
   })
      .populate("webhook", "url name")
      .sort({ nextAttemptAt: 1 });
};

webhookEventSchema.statics.findByIdempotencyKey = function (idempotencyKey, organizationId) {
   return this.findOne({
      organization: organizationId,
      idempotencyKey: idempotencyKey,
   });
};

webhookEventSchema.statics.getWebhookStats = async function (organizationId, startDate, endDate) {
   const matchStage = { organization: mongoose.Types.ObjectId(organizationId) };

   if (startDate && endDate) {
      matchStage.createdAt = {
         $gte: new Date(startDate),
         $lte: new Date(endDate),
      };
   }

   const stats = await this.aggregate([
      { $match: matchStage },
      {
         $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            succeededEvents: {
               $sum: { $cond: [{ $eq: ["$status", "succeeded"] }, 1, 0] },
            },
            failedEvents: {
               $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            pendingEvents: {
               $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            retryingEvents: {
               $sum: { $cond: [{ $eq: ["$status", "retrying"] }, 1, 0] },
            },
            totalAttempts: { $sum: "$attempts" },
            averageProcessingTime: { $avg: "$processingTime" },
            byEventType: {
               $push: "$eventType",
            },
            byStatus: {
               $push: "$status",
            },
         },
      },
   ]);

   if (stats.length === 0) {
      return {
         totalEvents: 0,
         succeededEvents: 0,
         failedEvents: 0,
         pendingEvents: 0,
         retryingEvents: 0,
         totalAttempts: 0,
         averageProcessingTime: 0,
         eventTypes: {},
         statuses: {},
      };
   }

   const result = stats[0];

   // Count event types
   result.eventTypes = result.byEventType.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
   }, {});

   // Count statuses
   result.statuses = result.byStatus.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
   }, {});

   result.successRate = result.totalEvents > 0 ? (result.succeededEvents / result.totalEvents) * 100 : 0;

   delete result.byEventType;
   delete result.byStatus;

   return result;
};

webhookEventSchema.statics.cleanupOldEvents = function (organizationId, daysOld = 90) {
   const cutoffDate = new Date();
   cutoffDate.setDate(cutoffDate.getDate() - daysOld);

   return this.deleteMany({
      organization: organizationId,
      status: { $in: ["succeeded", "failed"] },
      createdAt: { $lt: cutoffDate },
   });
};

const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);

export default WebhookEvent;
