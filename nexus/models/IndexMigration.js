// models/IndexMigration.js
import mongoose from "mongoose";

const indexMigrationSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         unique: true,
         trim: true,
         maxlength: 255,
         validate: {
            validator: function (v) {
               return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(v);
            },
            message:
               "Migration name must start with a letter and contain only letters, numbers, hyphens, and underscores",
         },
      },
      version: {
         type: String,
         required: true,
         trim: true,
         maxlength: 50,
         validate: {
            validator: function (v) {
               return /^\d{4}_\d{2}_\d{2}_\d{6}_[a-zA-Z0-9_-]+$/.test(v);
            },
            message: "Version must follow format: YYYY_MM_DD_HHMMSS_description",
         },
      },
      type: {
         type: String,
         required: true,
         enum: ["index", "migration", "data_migration", "schema_change", "performance"],
         default: "index",
      },
      status: {
         type: String,
         enum: ["pending", "running", "completed", "failed", "rolled_back"],
         default: "pending",
      },
      description: {
         type: String,
         trim: true,
         maxlength: 1000,
      },
      collection: {
         type: String,
         required: true,
         trim: true,
         maxlength: 100,
      },
      indexDefinition: {
         keys: {
            type: Map,
            of: Number, // 1 for ascending, -1 for descending
         },
         options: {
            unique: Boolean,
            sparse: Boolean,
            background: { type: Boolean, default: true },
            name: String,
            expireAfterSeconds: Number,
            partialFilterExpression: mongoose.Schema.Types.Mixed,
            collation: mongoose.Schema.Types.Mixed,
            wildcardProjection: mongoose.Schema.Types.Mixed,
         },
      },
      migrationScript: {
         type: String,
         trim: true,
      },
      dependencies: [
         {
            type: String,
            trim: true,
         },
      ],
      rollbackScript: {
         type: String,
         trim: true,
      },
      executionDetails: {
         startedAt: Date,
         completedAt: Date,
         duration: Number, // in milliseconds
         errorMessage: String,
         errorStack: String,
         affectedDocuments: Number,
         indexSize: Number, // in bytes
         performanceImpact: {
            before: {
               queryTime: Number, // in milliseconds
               indexUsage: Number, // percentage
            },
            after: {
               queryTime: Number,
               indexUsage: Number,
            },
         },
      },
      metadata: {
         type: Map,
         of: mongoose.Schema.Types.Mixed,
      },
      tags: [
         {
            type: String,
            trim: true,
            lowercase: true,
         },
      ],
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      executedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      environment: {
         type: String,
         enum: ["development", "staging", "production", "testing"],
         default: "development",
      },
      checksum: {
         type: String,
         trim: true,
      },
      isReversible: {
         type: Boolean,
         default: true,
      },
      priority: {
         type: Number,
         min: 1,
         max: 100,
         default: 50,
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
      suppressReservedKeysWarning: true,
   }
);

// Indexes
indexMigrationSchema.index({ version: 1 }, { unique: true });
indexMigrationSchema.index({ status: 1 });
indexMigrationSchema.index({ type: 1 });
indexMigrationSchema.index({ collection: 1 });
indexMigrationSchema.index({ createdAt: -1 });
indexMigrationSchema.index({ "executionDetails.startedAt": -1 });
indexMigrationSchema.index({ environment: 1 });
indexMigrationSchema.index({ priority: -1 });

// Compound indexes
indexMigrationSchema.index({ status: 1, type: 1 });
indexMigrationSchema.index({ collection: 1, status: 1 });
indexMigrationSchema.index({ environment: 1, status: 1 });
indexMigrationSchema.index({ type: 1, priority: -1 });

// Virtuals
indexMigrationSchema.virtual("isPending").get(function () {
   return this.status === "pending";
});

indexMigrationSchema.virtual("isRunning").get(function () {
   return this.status === "running";
});

indexMigrationSchema.virtual("isCompleted").get(function () {
   return this.status === "completed";
});

indexMigrationSchema.virtual("isFailed").get(function () {
   return this.status === "failed";
});

indexMigrationSchema.virtual("isRolledBack").get(function () {
   return this.status === "rolled_back";
});

indexMigrationSchema.virtual("executionTime").get(function () {
   if (this.executionDetails.startedAt && this.executionDetails.completedAt) {
      return this.executionDetails.completedAt - this.executionDetails.startedAt;
   }
   return null;
});

indexMigrationSchema.virtual("hasPerformanceData").get(function () {
   return (
      this.executionDetails.performanceImpact &&
      this.executionDetails.performanceImpact.before &&
      this.executionDetails.performanceImpact.after
   );
});

indexMigrationSchema.virtual("performanceImprovement").get(function () {
   if (!this.hasPerformanceData) return null;

   const before = this.executionDetails.performanceImpact.before.queryTime;
   const after = this.executionDetails.performanceImpact.after.queryTime;

   if (before === 0) return null;

   return ((before - after) / before) * 100; // percentage improvement
});

indexMigrationSchema.virtual("canRollback").get(function () {
   return this.isReversible && this.isCompleted && this.rollbackScript;
});

indexMigrationSchema.virtual("isHighPriority").get(function () {
   return this.priority >= 80;
});

indexMigrationSchema.virtual("isLowPriority").get(function () {
   return this.priority <= 20;
});

// Pre-save middleware
indexMigrationSchema.pre("save", function (next) {
   // Generate checksum for migration script if present
   if (this.migrationScript && !this.checksum) {
      this.checksum = this.generateChecksum(this.migrationScript);
   }

   // Set execution details timestamps
   if (this.status === "running" && !this.executionDetails.startedAt) {
      this.executionDetails.startedAt = new Date();
   }

   if ((this.status === "completed" || this.status === "failed") && !this.executionDetails.completedAt) {
      this.executionDetails.completedAt = new Date();

      if (this.executionDetails.startedAt) {
         this.executionDetails.duration = this.executionDetails.completedAt - this.executionDetails.startedAt;
      }
   }

   next();
});

// Instance methods
indexMigrationSchema.methods.startExecution = function (userId) {
   if (this.status !== "pending") {
      throw new Error("Migration is not in pending status");
   }

   this.status = "running";
   this.executedBy = userId;
   this.executionDetails.startedAt = new Date();

   return this.save();
};

indexMigrationSchema.methods.completeExecution = function (affectedDocuments = 0, indexSize = 0) {
   if (this.status !== "running") {
      throw new Error("Migration is not currently running");
   }

   this.status = "completed";
   this.executionDetails.completedAt = new Date();
   this.executionDetails.affectedDocuments = affectedDocuments;
   this.executionDetails.indexSize = indexSize;

   if (this.executionDetails.startedAt) {
      this.executionDetails.duration = this.executionDetails.completedAt - this.executionDetails.startedAt;
   }

   return this.save();
};

indexMigrationSchema.methods.failExecution = function (errorMessage, errorStack = null) {
   if (this.status !== "running") {
      throw new Error("Migration is not currently running");
   }

   this.status = "failed";
   this.executionDetails.completedAt = new Date();
   this.executionDetails.errorMessage = errorMessage;
   this.executionDetails.errorStack = errorStack;

   if (this.executionDetails.startedAt) {
      this.executionDetails.duration = this.executionDetails.completedAt - this.executionDetails.startedAt;
   }

   return this.save();
};

indexMigrationSchema.methods.rollback = function (userId) {
   if (!this.canRollback) {
      throw new Error("Migration cannot be rolled back");
   }

   this.status = "rolled_back";
   this.executedBy = userId;

   return this.save();
};

indexMigrationSchema.methods.updatePerformanceData = function (beforeData, afterData) {
   this.executionDetails.performanceImpact = {
      before: beforeData,
      after: afterData,
   };

   return this.save();
};

indexMigrationSchema.methods.generateChecksum = function (content) {
   let hash = 0;
   if (content.length === 0) return hash.toString();

   for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
   }

   return Math.abs(hash).toString();
};

indexMigrationSchema.methods.validateDependencies = async function () {
   if (this.dependencies.length === 0) return true;

   const IndexMigration = mongoose.model("IndexMigration");

   for (const depName of this.dependencies) {
      const dep = await IndexMigration.findOne({ name: depName });
      if (!dep || !dep.isCompleted) {
         return false;
      }
   }

   return true;
};

indexMigrationSchema.methods.getDependentMigrations = async function () {
   const IndexMigration = mongoose.model("IndexMigration");
   return IndexMigration.find({
      dependencies: this.name,
      status: { $ne: "completed" },
   });
};

// Static methods
indexMigrationSchema.statics.findPending = function (environment = null) {
   const query = { status: "pending" };
   if (environment) {
      query.environment = environment;
   }

   return this.find(query).sort({ priority: -1, createdAt: 1 });
};

indexMigrationSchema.statics.findRunning = function (environment = null) {
   const query = { status: "running" };
   if (environment) {
      query.environment = environment;
   }

   return this.find(query).sort({ "executionDetails.startedAt": 1 });
};

indexMigrationSchema.statics.findFailed = function (environment = null) {
   const query = { status: "failed" };
   if (environment) {
      query.environment = environment;
   }

   return this.find(query).sort({ "executionDetails.completedAt": -1 });
};

indexMigrationSchema.statics.findCompleted = function (environment = null) {
   const query = { status: "completed" };
   if (environment) {
      query.environment = environment;
   }

   return this.find(query).sort({ "executionDetails.completedAt": -1 });
};

indexMigrationSchema.statics.findByCollection = function (collectionName, environment = null) {
   const query = { collection: collectionName };
   if (environment) {
      query.environment = environment;
   }

   return this.find(query).sort({ createdAt: -1 });
};

indexMigrationSchema.statics.findByType = function (migrationType, environment = null) {
   const query = { type: migrationType };
   if (environment) {
      query.environment = environment;
   }

   return this.find(query).sort({ createdAt: -1 });
};

indexMigrationSchema.statics.getMigrationStats = async function (environment = null) {
   const matchStage = {};
   if (environment) {
      matchStage.environment = environment;
   }

   const stats = await this.aggregate([
      { $match: matchStage },
      {
         $group: {
            _id: null,
            totalMigrations: { $sum: 1 },
            pendingMigrations: {
               $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            runningMigrations: {
               $sum: { $cond: [{ $eq: ["$status", "running"] }, 1, 0] },
            },
            completedMigrations: {
               $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            failedMigrations: {
               $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            rolledBackMigrations: {
               $sum: { $cond: [{ $eq: ["$status", "rolled_back"] }, 1, 0] },
            },
            byType: {
               $push: "$type",
            },
            byCollection: {
               $push: "$collection",
            },
            totalExecutionTime: {
               $sum: { $ifNull: ["$executionDetails.duration", 0] },
            },
            averageExecutionTime: {
               $avg: { $ifNull: ["$executionDetails.duration", 0] },
            },
         },
      },
   ]);

   if (stats.length === 0) {
      return {
         totalMigrations: 0,
         pendingMigrations: 0,
         runningMigrations: 0,
         completedMigrations: 0,
         failedMigrations: 0,
         rolledBackMigrations: 0,
         types: {},
         collections: {},
         totalExecutionTime: 0,
         averageExecutionTime: 0,
      };
   }

   const result = stats[0];

   // Count types
   result.types = result.byType.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
   }, {});

   // Count collections
   result.collections = result.byCollection.reduce((acc, collection) => {
      acc[collection] = (acc[collection] || 0) + 1;
      return acc;
   }, {});

   delete result.byType;
   delete result.byCollection;

   return result;
};

indexMigrationSchema.statics.getNextPendingMigration = function (environment = null) {
   const query = { status: "pending" };
   if (environment) {
      query.environment = environment;
   }

   return this.findOne(query).sort({ priority: -1, createdAt: 1 });
};

indexMigrationSchema.statics.validateMigrationOrder = async function () {
   const pendingMigrations = await this.find({ status: "pending" }).sort({ priority: -1 });

   for (const migration of pendingMigrations) {
      if (!(await migration.validateDependencies())) {
         return {
            valid: false,
            migration: migration.name,
            reason: "Dependencies not satisfied",
         };
      }
   }

   return { valid: true };
};

const IndexMigration = mongoose.model("IndexMigration", indexMigrationSchema);

export default IndexMigration;
