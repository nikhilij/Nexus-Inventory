// models/AuditLog.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
   {
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      action: {
         type: String,
         required: true,
         enum: [
            // User actions
            "user_login",
            "user_logout",
            "user_created",
            "user_updated",
            "user_deleted",
            "user_password_changed",
            "user_role_changed",

            // Product actions
            "product_created",
            "product_updated",
            "product_deleted",
            "product_variant_created",
            "product_variant_updated",
            "product_variant_deleted",

            // Inventory actions
            "inventory_adjusted",
            "inventory_received",
            "inventory_shipped",
            "inventory_transferred",
            "inventory_counted",

            // Order actions
            "order_created",
            "order_updated",
            "order_cancelled",
            "order_fulfilled",
            "order_returned",

            // Warehouse actions
            "warehouse_created",
            "warehouse_updated",
            "warehouse_deleted",

            // Organization actions
            "organization_updated",
            "organization_settings_changed",

            // Security actions
            "permission_granted",
            "permission_revoked",
            "role_created",
            "role_updated",
            "role_deleted",

            // System actions
            "system_backup_created",
            "system_settings_changed",
            "api_key_created",
            "api_key_deleted",

            // Other actions
            "bulk_import",
            "bulk_export",
            "report_generated",
         ],
      },
      resourceType: {
         type: String,
         required: true,
         enum: [
            "user",
            "product",
            "inventory_item",
            "order",
            "warehouse",
            "organization",
            "role",
            "permission",
            "api_key",
            "system",
            "report",
         ],
      },
      resourceId: {
         type: mongoose.Schema.Types.ObjectId,
         required: true,
      },
      details: {
         type: mongoose.Schema.Types.Mixed,
         required: true,
      },
      changes: {
         before: mongoose.Schema.Types.Mixed,
         after: mongoose.Schema.Types.Mixed,
         fields: [String],
      },
      metadata: {
         type: Map,
         of: mongoose.Schema.Types.Mixed,
      },
      ipAddress: {
         type: String,
         trim: true,
      },
      userAgent: {
         type: String,
         trim: true,
      },
      sessionId: {
         type: String,
         trim: true,
      },
      timestamp: {
         type: Date,
         default: Date.now,
         required: true,
      },
      severity: {
         type: String,
         enum: ["low", "medium", "high", "critical"],
         default: "low",
      },
      source: {
         type: String,
         enum: ["web", "api", "mobile", "system", "import"],
         default: "web",
      },
      status: {
         type: String,
         enum: ["success", "failure", "warning"],
         default: "success",
      },
      errorMessage: String,
      duration: {
         type: Number,
         min: 0,
      },
      tags: [
         {
            type: String,
            trim: true,
         },
      ],
   },
   {
      timestamps: false, // We use custom timestamp field
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
auditLogSchema.index({ organization: 1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resourceType: 1 });
auditLogSchema.index({ resourceId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ source: 1 });
auditLogSchema.index({ status: 1 });

// Compound indexes
auditLogSchema.index({ organization: 1, timestamp: -1 });
auditLogSchema.index({ organization: 1, action: 1 });
auditLogSchema.index({ organization: 1, resourceType: 1, resourceId: 1 });
auditLogSchema.index({ organization: 1, user: 1, timestamp: -1 });
auditLogSchema.index({ organization: 1, severity: 1, timestamp: -1 });
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

// Virtuals
auditLogSchema.virtual("isSuccessful").get(function () {
   return this.status === "success";
});

auditLogSchema.virtual("isFailure").get(function () {
   return this.status === "failure";
});

auditLogSchema.virtual("hasChanges").get(function () {
   return this.changes && (this.changes.before || this.changes.after);
});

auditLogSchema.virtual("changedFieldsCount").get(function () {
   return this.changes && this.changes.fields ? this.changes.fields.length : 0;
});

auditLogSchema.virtual("isSecurityEvent").get(function () {
   return [
      "user_login",
      "user_logout",
      "permission_granted",
      "permission_revoked",
      "user_password_changed",
      "api_key_created",
      "api_key_deleted",
   ].includes(this.action);
});

auditLogSchema.virtual("isDataModification").get(function () {
   return ["_created", "_updated", "_deleted", "inventory_adjusted", "bulk_import"].some((suffix) =>
      this.action.endsWith(suffix)
   );
});

// Pre-save middleware
auditLogSchema.pre("save", function (next) {
   // Set severity based on action
   if (this.isSecurityEvent) {
      this.severity = this.status === "failure" ? "high" : "medium";
   } else if (this.isDataModification) {
      this.severity = "medium";
   }

   // Add relevant tags
   if (!this.tags) this.tags = [];

   if (this.isSecurityEvent) {
      this.tags.push("security");
   }

   if (this.isDataModification) {
      this.tags.push("data-modification");
   }

   if (this.status === "failure") {
      this.tags.push("error");
   }

   if (this.resourceType) {
      this.tags.push(this.resourceType);
   }

   // Remove duplicates
   this.tags = [...new Set(this.tags)];

   next();
});

// Instance methods
auditLogSchema.methods.getChangeSummary = function () {
   if (!this.hasChanges) {
      return "No changes recorded";
   }

   const changes = [];
   if (this.changes.fields && this.changes.fields.length > 0) {
      changes.push(`Fields changed: ${this.changes.fields.join(", ")}`);
   }

   return changes.length > 0 ? changes.join("; ") : "Changes recorded but fields not specified";
};

auditLogSchema.methods.getFormattedDetails = function () {
   return {
      id: this._id,
      timestamp: this.timestamp,
      user: this.user,
      action: this.action,
      resource: {
         type: this.resourceType,
         id: this.resourceId,
      },
      changes: this.getChangeSummary(),
      status: this.status,
      severity: this.severity,
      source: this.source,
      metadata: this.metadata,
      tags: this.tags,
   };
};

auditLogSchema.methods.isRelatedTo = function (resourceType, resourceId) {
   return this.resourceType === resourceType && this.resourceId.toString() === resourceId.toString();
};

// Static methods
auditLogSchema.statics.log = function (data) {
   const logEntry = new this(data);
   return logEntry.save();
};

auditLogSchema.statics.findByResource = function (resourceType, resourceId, limit = 50) {
   return this.find({
      resourceType: resourceType,
      resourceId: resourceId,
   })
      .populate("user", "name email")
      .populate("organization", "name")
      .sort({ timestamp: -1 })
      .limit(limit);
};

auditLogSchema.statics.findByUser = function (userId, limit = 100) {
   return this.find({ user: userId }).populate("organization", "name").sort({ timestamp: -1 }).limit(limit);
};

auditLogSchema.statics.findByAction = function (action, organizationId, limit = 50) {
   return this.find({
      action: action,
      organization: organizationId,
   })
      .populate("user", "name email")
      .sort({ timestamp: -1 })
      .limit(limit);
};

auditLogSchema.statics.findByDateRange = function (organizationId, startDate, endDate, limit = 1000) {
   return this.find({
      organization: organizationId,
      timestamp: {
         $gte: new Date(startDate),
         $lte: new Date(endDate),
      },
   })
      .populate("user", "name email")
      .sort({ timestamp: -1 })
      .limit(limit);
};

auditLogSchema.statics.findSecurityEvents = function (organizationId, limit = 100) {
   return this.find({
      organization: organizationId,
      action: {
         $in: [
            "user_login",
            "user_logout",
            "permission_granted",
            "permission_revoked",
            "user_password_changed",
            "api_key_created",
            "api_key_deleted",
         ],
      },
   })
      .populate("user", "name email")
      .sort({ timestamp: -1 })
      .limit(limit);
};

auditLogSchema.statics.findFailedActions = function (organizationId, limit = 50) {
   return this.find({
      organization: organizationId,
      status: "failure",
   })
      .populate("user", "name email")
      .sort({ timestamp: -1 })
      .limit(limit);
};

auditLogSchema.statics.getAuditSummary = async function (organizationId, startDate, endDate) {
   const matchStage = {
      organization: mongoose.Types.ObjectId(organizationId),
   };

   if (startDate && endDate) {
      matchStage.timestamp = {
         $gte: new Date(startDate),
         $lte: new Date(endDate),
      };
   }

   const summary = await this.aggregate([
      { $match: matchStage },
      {
         $group: {
            _id: {
               action: "$action",
               status: "$status",
               severity: "$severity",
            },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: "$user" },
            lastOccurrence: { $max: "$timestamp" },
         },
      },
      {
         $group: {
            _id: "$_id.action",
            action: { $first: "$_id.action" },
            totalCount: { $sum: "$count" },
            successCount: {
               $sum: {
                  $cond: [{ $eq: ["$_id.status", "success"] }, "$count", 0],
               },
            },
            failureCount: {
               $sum: {
                  $cond: [{ $eq: ["$_id.status", "failure"] }, "$count", 0],
               },
            },
            uniqueUsersCount: { $sum: { $size: "$uniqueUsers" } },
            severityBreakdown: {
               $push: {
                  severity: "$_id.severity",
                  count: "$count",
               },
            },
            lastOccurrence: { $max: "$lastOccurrence" },
         },
      },
      {
         $sort: { totalCount: -1 },
      },
   ]);

   return summary;
};

auditLogSchema.statics.getUserActivity = async function (userId, startDate, endDate) {
   const matchStage = { user: mongoose.Types.ObjectId(userId) };

   if (startDate && endDate) {
      matchStage.timestamp = {
         $gte: new Date(startDate),
         $lte: new Date(endDate),
      };
   }

   const activity = await this.aggregate([
      { $match: matchStage },
      {
         $group: {
            _id: {
               $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$timestamp",
               },
            },
            actions: { $sum: 1 },
            successfulActions: {
               $sum: {
                  $cond: [{ $eq: ["$status", "success"] }, 1, 0],
               },
            },
            failedActions: {
               $sum: {
                  $cond: [{ $eq: ["$status", "failure"] }, 1, 0],
               },
            },
            actionTypes: { $addToSet: "$action" },
         },
      },
      {
         $sort: { _id: 1 },
      },
   ]);

   return activity;
};

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
