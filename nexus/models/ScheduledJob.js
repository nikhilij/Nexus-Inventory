// models/ScheduledJob.js
import mongoose from "mongoose";

const scheduledJobSchema = new mongoose.Schema(
   {
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      jobName: {
         type: String,
         required: true,
         trim: true,
         maxlength: 100,
      },
      jobType: {
         type: String,
         required: true,
         enum: [
            "inventory_sync",
            "report_generation",
            "data_backup",
            "email_notification",
            "webhook_retry",
            "subscription_renewal",
            "invoice_generation",
            "low_stock_alert",
            "data_cleanup",
            "analytics_update",
            "custom",
         ],
      },
      status: {
         type: String,
         enum: ["scheduled", "queued", "running", "completed", "failed", "cancelled", "paused", "retrying"],
         default: "scheduled",
      },
      priority: {
         type: String,
         enum: ["low", "normal", "high", "critical"],
         default: "normal",
      },
      schedule: {
         type: {
            type: String,
            enum: ["once", "recurring"],
            default: "once",
         },
         cronExpression: String,
         interval: {
            value: Number,
            unit: {
               type: String,
               enum: ["minutes", "hours", "days", "weeks", "months"],
            },
         },
         timezone: {
            type: String,
            default: "UTC",
         },
      },
      runAt: {
         type: Date,
         required: true,
      },
      startedAt: Date,
      completedAt: Date,
      failedAt: Date,
      nextRunAt: Date,
      lastRunAt: Date,
      parameters: {
         type: Map,
         of: mongoose.Schema.Types.Mixed,
      },
      result: {
         success: Boolean,
         data: mongoose.Schema.Types.Mixed,
         error: {
            message: String,
            code: String,
            stack: String,
            details: mongoose.Schema.Types.Mixed,
         },
         duration: Number, // in milliseconds
         recordsProcessed: Number,
         recordsAffected: Number,
      },
      attempts: {
         type: Number,
         default: 0,
         min: 0,
      },
      maxAttempts: {
         type: Number,
         default: 3,
         min: 1,
         max: 10,
      },
      retryDelay: {
         type: Number,
         default: 300000, // 5 minutes in milliseconds
         min: 60000, // minimum 1 minute
      },
      timeout: {
         type: Number,
         default: 3600000, // 1 hour in milliseconds
         min: 60000, // minimum 1 minute
      },
      dependencies: [
         {
            jobId: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "ScheduledJob",
            },
            type: {
               type: String,
               enum: ["must_complete", "must_succeed"],
               default: "must_complete",
            },
         },
      ],
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
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      executedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      logs: [
         {
            timestamp: {
               type: Date,
               default: Date.now,
            },
            level: {
               type: String,
               enum: ["info", "warning", "error", "debug"],
               default: "info",
            },
            message: String,
            data: mongoose.Schema.Types.Mixed,
         },
      ],
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
scheduledJobSchema.index({ organization: 1 });
scheduledJobSchema.index({ jobName: 1 });
scheduledJobSchema.index({ jobType: 1 });
scheduledJobSchema.index({ status: 1 });
scheduledJobSchema.index({ priority: 1 });
scheduledJobSchema.index({ runAt: 1 });
scheduledJobSchema.index({ nextRunAt: 1 });
scheduledJobSchema.index({ createdAt: -1 });
scheduledJobSchema.index({ completedAt: -1 });
scheduledJobSchema.index({ failedAt: -1 });

// Compound indexes
scheduledJobSchema.index({ organization: 1, status: 1 });
scheduledJobSchema.index({ organization: 1, jobType: 1 });
scheduledJobSchema.index({ organization: 1, runAt: 1 });
scheduledJobSchema.index({ organization: 1, nextRunAt: 1 });
scheduledJobSchema.index({ status: 1, priority: -1 });
scheduledJobSchema.index({ status: 1, runAt: 1 });
scheduledJobSchema.index({ jobType: 1, status: 1 });

// Virtuals
scheduledJobSchema.virtual("isScheduled").get(function () {
   return this.status === "scheduled";
});

scheduledJobSchema.virtual("isRunning").get(function () {
   return this.status === "running";
});

scheduledJobSchema.virtual("isCompleted").get(function () {
   return this.status === "completed";
});

scheduledJobSchema.virtual("isFailed").get(function () {
   return this.status === "failed";
});

scheduledJobSchema.virtual("isRecurring").get(function () {
   return this.schedule.type === "recurring";
});

scheduledJobSchema.virtual("canRetry").get(function () {
   return this.attempts < this.maxAttempts && this.isFailed;
});

scheduledJobSchema.virtual("shouldRetry").get(function () {
   return this.isFailed && this.canRetry;
});

scheduledJobSchema.virtual("isOverdue").get(function () {
   return this.status === "scheduled" && new Date() > this.runAt;
});

scheduledJobSchema.virtual("executionTime").get(function () {
   if (!this.startedAt || !this.completedAt) return null;
   return this.completedAt - this.startedAt;
});

scheduledJobSchema.virtual("timeUntilRun").get(function () {
   const now = new Date();
   return Math.max(0, this.runAt - now);
});

scheduledJobSchema.virtual("attemptsRemaining").get(function () {
   return Math.max(0, this.maxAttempts - this.attempts);
});

// Pre-save middleware
scheduledJobSchema.pre("save", function (next) {
   // Set next run time for recurring jobs
   if (this.isRecurring && this.status === "completed" && !this.nextRunAt) {
      this.nextRunAt = this.calculateNextRunTime();
   }

   // Update timestamps based on status
   if (this.status === "running" && !this.startedAt) {
      this.startedAt = new Date();
   } else if (this.status === "completed" && !this.completedAt) {
      this.completedAt = new Date();
   } else if (this.status === "failed" && !this.failedAt) {
      this.failedAt = new Date();
   }

   next();
});

// Instance methods
scheduledJobSchema.methods.start = function (executorId) {
   this.status = "running";
   this.startedAt = new Date();
   this.executedBy = executorId;
   this.attempts += 1;

   this.addLog("info", "Job execution started");
   return this.save();
};

scheduledJobSchema.methods.complete = function (result = {}) {
   this.status = "completed";
   this.completedAt = new Date();
   this.result = {
      success: true,
      ...result,
      duration: this.executionTime,
   };

   // Set next run for recurring jobs
   if (this.isRecurring) {
      this.nextRunAt = this.calculateNextRunTime();
      this.status = "scheduled"; // Reset for next run
   }

   this.addLog("info", "Job completed successfully", result);
   return this.save();
};

scheduledJobSchema.methods.fail = function (error, result = {}) {
   this.status = "failed";
   this.failedAt = new Date();
   this.result = {
      success: false,
      error: {
         message: error.message,
         code: error.code,
         stack: error.stack,
         details: error.details,
      },
      ...result,
      duration: this.executionTime,
   };

   if (this.canRetry) {
      this.status = "retrying";
      this.runAt = new Date(Date.now() + this.retryDelay);
   }

   this.addLog("error", `Job failed: ${error.message}`, { error, result });
   return this.save();
};

scheduledJobSchema.methods.cancel = function (reason) {
   this.status = "cancelled";
   this.addLog("warning", `Job cancelled: ${reason || "No reason provided"}`);
   return this.save();
};

scheduledJobSchema.methods.pause = function (reason) {
   this.status = "paused";
   this.addLog("info", `Job paused: ${reason || "No reason provided"}`);
   return this.save();
};

scheduledJobSchema.methods.resume = function () {
   if (this.status === "paused") {
      this.status = "scheduled";
      this.addLog("info", "Job resumed");
   }
   return this.save();
};

scheduledJobSchema.methods.retry = function () {
   if (!this.canRetry) {
      throw new Error("Cannot retry: maximum attempts reached");
   }

   this.status = "scheduled";
   this.runAt = new Date(Date.now() + this.retryDelay);
   this.failedAt = null;
   this.result.error = null;

   this.addLog("info", `Job scheduled for retry (attempt ${this.attempts + 1}/${this.maxAttempts})`);
   return this.save();
};

scheduledJobSchema.methods.calculateNextRunTime = function () {
   if (!this.isRecurring) return null;

   const now = new Date();

   if (this.schedule.cronExpression) {
      // For cron expressions, you'd need a cron parser library
      // For now, return a simple interval-based calculation
      return new Date(now.getTime() + (this.schedule.interval?.value || 1) * this.getIntervalMultiplier());
   }

   if (this.schedule.interval) {
      const multiplier = this.getIntervalMultiplier();
      return new Date(now.getTime() + this.schedule.interval.value * multiplier);
   }

   return null;
};

scheduledJobSchema.methods.getIntervalMultiplier = function () {
   const multipliers = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
      months: 30 * 24 * 60 * 60 * 1000, // Approximate
   };

   return multipliers[this.schedule.interval?.unit] || multipliers.hours;
};

scheduledJobSchema.methods.addLog = function (level, message, data = null) {
   this.logs.push({
      level,
      message,
      data,
      timestamp: new Date(),
   });

   // Keep only last 100 log entries
   if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
   }

   return this.save();
};

scheduledJobSchema.methods.addDependency = function (jobId, type = "must_complete") {
   this.dependencies.push({
      jobId,
      type,
   });
   return this.save();
};

scheduledJobSchema.methods.checkDependencies = async function () {
   if (this.dependencies.length === 0) return true;

   const ScheduledJob = mongoose.model("ScheduledJob");

   for (const dep of this.dependencies) {
      const depJob = await ScheduledJob.findById(dep.jobId);
      if (!depJob) continue;

      if (dep.type === "must_complete" && !depJob.isCompleted) {
         return false;
      }

      if (dep.type === "must_succeed" && (!depJob.isCompleted || depJob.isFailed)) {
         return false;
      }
   }

   return true;
};

// Static methods
scheduledJobSchema.statics.findPending = function (organizationId, limit = 100) {
   return this.find({
      organization: organizationId,
      status: { $in: ["scheduled", "retrying"] },
      runAt: { $lte: new Date() },
   })
      .sort({ priority: -1, runAt: 1 })
      .limit(limit);
};

scheduledJobSchema.statics.findRunning = function (organizationId) {
   return this.find({
      organization: organizationId,
      status: "running",
   }).sort({ startedAt: 1 });
};

scheduledJobSchema.statics.findFailed = function (organizationId, limit = 50) {
   return this.find({
      organization: organizationId,
      status: "failed",
   })
      .sort({ failedAt: -1 })
      .limit(limit);
};

scheduledJobSchema.statics.findByType = function (jobType, organizationId, status = null) {
   const query = {
      organization: organizationId,
      jobType: jobType,
   };

   if (status) {
      query.status = status;
   }

   return this.find(query).sort({ createdAt: -1 });
};

scheduledJobSchema.statics.findRecurring = function (organizationId) {
   return this.find({
      organization: organizationId,
      "schedule.type": "recurring",
   }).sort({ nextRunAt: 1 });
};

scheduledJobSchema.statics.findOverdue = function (organizationId) {
   return this.find({
      organization: organizationId,
      status: { $in: ["scheduled", "retrying"] },
      runAt: { $lt: new Date() },
   }).sort({ runAt: 1 });
};

scheduledJobSchema.statics.getJobStats = async function (organizationId, startDate, endDate) {
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
            totalJobs: { $sum: 1 },
            completedJobs: {
               $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            failedJobs: {
               $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            runningJobs: {
               $sum: { $cond: [{ $eq: ["$status", "running"] }, 1, 0] },
            },
            scheduledJobs: {
               $sum: { $cond: [{ $in: ["$status", ["scheduled", "retrying"]] }, 1, 0] },
            },
            totalExecutionTime: { $sum: "$executionTime" },
            averageExecutionTime: { $avg: "$executionTime" },
            byType: {
               $push: "$jobType",
            },
            byStatus: {
               $push: "$status",
            },
         },
      },
   ]);

   if (stats.length === 0) {
      return {
         totalJobs: 0,
         completedJobs: 0,
         failedJobs: 0,
         runningJobs: 0,
         scheduledJobs: 0,
         totalExecutionTime: 0,
         averageExecutionTime: 0,
         successRate: 0,
         jobTypes: {},
         statuses: {},
      };
   }

   const result = stats[0];

   // Count job types
   result.jobTypes = result.byType.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
   }, {});

   // Count statuses
   result.statuses = result.byStatus.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
   }, {});

   result.successRate = result.totalJobs > 0 ? (result.completedJobs / result.totalJobs) * 100 : 0;

   delete result.byType;
   delete result.byStatus;

   return result;
};

scheduledJobSchema.statics.cleanupOldJobs = function (organizationId, daysOld = 30) {
   const cutoffDate = new Date();
   cutoffDate.setDate(cutoffDate.getDate() - daysOld);

   return this.deleteMany({
      organization: organizationId,
      status: { $in: ["completed", "failed", "cancelled"] },
      completedAt: { $lt: cutoffDate },
   });
};

const ScheduledJob = mongoose.model("ScheduledJob", scheduledJobSchema);

export default ScheduledJob;
