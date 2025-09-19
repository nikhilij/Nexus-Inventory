// models/ApiKey.js
import mongoose from "mongoose";
import crypto from "crypto";

const apiKeySchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
         maxlength: 100,
      },
      description: {
         type: String,
         trim: true,
         maxlength: 500,
      },
      key: {
         type: String,
         required: true,
         unique: true,
         trim: true,
      },
      keyHash: {
         type: String,
         required: true,
      },
      keyPrefix: {
         type: String,
         required: true,
         trim: true,
      },
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
         required: true,
      },
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      permissions: [
         {
            resource: {
               type: String,
               required: true,
               enum: ["users", "products", "orders", "inventory", "warehouses", "reports", "settings"],
            },
            actions: [
               {
                  type: String,
                  enum: ["create", "read", "update", "delete", "manage"],
                  required: true,
               },
            ],
         },
      ],
      scopes: [
         {
            type: String,
            enum: ["read", "write", "admin", "analytics"],
            trim: true,
         },
      ],
      rateLimit: {
         requests: {
            type: Number,
            default: 1000,
            min: 1,
         },
         windowMs: {
            type: Number,
            default: 15 * 60 * 1000, // 15 minutes
            min: 1000,
         },
      },
      usage: {
         totalRequests: {
            type: Number,
            default: 0,
            min: 0,
         },
         lastUsed: Date,
         lastUsedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
      },
      expiresAt: Date,
      isActive: {
         type: Boolean,
         default: true,
      },
      environment: {
         type: String,
         enum: ["development", "staging", "production"],
         default: "development",
      },
      ipWhitelist: [
         {
            type: String,
            validate: {
               validator: function (v) {
                  return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(v);
               },
               message: "Invalid IP address format",
            },
         },
      ],
      metadata: {
         userAgent: String,
         createdFrom: String,
         tags: [String],
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
apiKeySchema.index({ keyHash: 1 });
apiKeySchema.index({ keyPrefix: 1 });
apiKeySchema.index({ organization: 1 });
apiKeySchema.index({ createdBy: 1 });
apiKeySchema.index({ isActive: 1 });
apiKeySchema.index({ expiresAt: 1 });
apiKeySchema.index({ environment: 1 });

// Compound indexes
apiKeySchema.index({ organization: 1, isActive: 1 });
apiKeySchema.index({ organization: 1, environment: 1 });
apiKeySchema.index({ organization: 1, keyPrefix: 1 });

// Virtuals
apiKeySchema.virtual("isExpired").get(function () {
   return this.expiresAt && this.expiresAt < new Date();
});

apiKeySchema.virtual("isValid").get(function () {
   return this.isActive && !this.isExpired;
});

apiKeySchema.virtual("daysUntilExpiry").get(function () {
   if (!this.expiresAt) return null;
   if (this.isExpired) return 0;
   const diffTime = this.expiresAt - new Date();
   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
apiKeySchema.pre("save", function (next) {
   if (this.isModified("key")) {
      // Generate key prefix for easier identification
      this.keyPrefix = this.key.substring(0, 8);

      // In a real app, you'd hash the key properly
      this.keyHash = crypto.createHash("sha256").update(this.key).digest("hex");
   }
   next();
});

// Instance methods
apiKeySchema.methods.hasPermission = function (resource, action) {
   const permission = this.permissions.find((p) => p.resource === resource);
   return permission && permission.actions.includes(action);
};

apiKeySchema.methods.hasScope = function (scope) {
   return this.scopes.includes(scope);
};

apiKeySchema.methods.recordUsage = function (userId = null) {
   this.usage.totalRequests += 1;
   this.usage.lastUsed = new Date();
   if (userId) {
      this.usage.lastUsedBy = userId;
   }
   return this.save();
};

apiKeySchema.methods.regenerate = function () {
   // Generate a new API key
   const newKey = "nexus_" + crypto.randomBytes(32).toString("hex");
   this.key = newKey;
   this.usage.totalRequests = 0;
   this.usage.lastUsed = null;
   return this.save();
};

apiKeySchema.methods.deactivate = function () {
   this.isActive = false;
   return this.save();
};

apiKeySchema.methods.reactivate = function () {
   this.isActive = true;
   return this.save();
};

apiKeySchema.methods.extendExpiry = function (days = 30) {
   this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
   return this.save();
};

// Static methods
apiKeySchema.statics.findByKeyPrefix = function (prefix, organizationId) {
   return this.findOne({
      keyPrefix: prefix,
      organization: organizationId,
      isActive: true,
   });
};

apiKeySchema.statics.findActiveKeys = function (organizationId) {
   return this.find({
      organization: organizationId,
      isActive: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
   }).populate("createdBy", "name email");
};

apiKeySchema.statics.findExpiredKeys = function (organizationId) {
   return this.find({
      organization: organizationId,
      expiresAt: { $lt: new Date() },
   });
};

apiKeySchema.statics.findByEnvironment = function (organizationId, environment) {
   return this.find({
      organization: organizationId,
      environment: environment,
      isActive: true,
   });
};

apiKeySchema.statics.validateKey = function (key, organizationId) {
   const keyHash = crypto.createHash("sha256").update(key).digest("hex");
   return this.findOne({
      keyHash: keyHash,
      organization: organizationId,
      isActive: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
   }).populate("organization permissions");
};

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

export default ApiKey;
