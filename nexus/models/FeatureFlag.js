// models/FeatureFlag.js
import mongoose from "mongoose";

const featureFlagSchema = new mongoose.Schema(
   {
      organization: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Organization",
      },
      name: {
         type: String,
         required: true,
         trim: true,
         unique: true,
         maxlength: 100,
         validate: {
            validator: function (v) {
               return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(v);
            },
            message:
               "Feature flag name must start with a letter and contain only letters, numbers, hyphens, and underscores",
         },
      },
      key: {
         type: String,
         required: true,
         trim: true,
         unique: true,
         maxlength: 100,
         validate: {
            validator: function (v) {
               return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(v);
            },
            message:
               "Feature flag key must start with a letter and contain only letters, numbers, hyphens, and underscores",
         },
      },
      description: {
         type: String,
         trim: true,
         maxlength: 500,
      },
      isEnabled: {
         type: Boolean,
         default: false,
      },
      rolloutStrategy: {
         type: {
            type: String,
            enum: ["percentage", "user_list", "organization_list", "environment", "custom"],
            default: "percentage",
         },
         percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
         },
         userIds: [
            {
               type: mongoose.Schema.Types.ObjectId,
               ref: "User",
            },
         ],
         organizationIds: [
            {
               type: mongoose.Schema.Types.ObjectId,
               ref: "Organization",
            },
         ],
         environments: [
            {
               type: String,
               enum: ["development", "staging", "production", "testing"],
            },
         ],
         customRules: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
         },
      },
      targetingRules: {
         userSegments: [
            {
               type: String,
               trim: true,
            },
         ],
         userProperties: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
         },
         organizationProperties: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
         },
         dateRange: {
            start: Date,
            end: Date,
         },
         timeRange: {
            start: String, // HH:MM format
            end: String,
         },
         geoLocation: {
            countries: [String],
            regions: [String],
         },
      },
      variants: [
         {
            name: {
               type: String,
               required: true,
               trim: true,
            },
            value: mongoose.Schema.Types.Mixed,
            weight: {
               type: Number,
               min: 0,
               max: 100,
               default: 0,
            },
            description: String,
         },
      ],
      dependencies: [
         {
            featureFlag: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "FeatureFlag",
            },
            requiredState: {
               type: Boolean,
               default: true,
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
      auditLog: [
         {
            timestamp: {
               type: Date,
               default: Date.now,
            },
            action: {
               type: String,
               enum: ["created", "enabled", "disabled", "updated", "deleted"],
            },
            user: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "User",
            },
            previousValue: mongoose.Schema.Types.Mixed,
            newValue: mongoose.Schema.Types.Mixed,
            reason: String,
         },
      ],
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      updatedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      expiresAt: Date,
      isExpired: {
         type: Boolean,
         default: false,
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes
featureFlagSchema.index({ name: 1 }, { unique: true });
featureFlagSchema.index({ key: 1 }, { unique: true });
featureFlagSchema.index({ organization: 1 });
featureFlagSchema.index({ isEnabled: 1 });
featureFlagSchema.index({ "rolloutStrategy.type": 1 });
featureFlagSchema.index({ expiresAt: 1 });
featureFlagSchema.index({ isExpired: 1 });
featureFlagSchema.index({ createdAt: -1 });

// Compound indexes
featureFlagSchema.index({ organization: 1, name: 1 }, { unique: true });
featureFlagSchema.index({ organization: 1, key: 1 }, { unique: true });
featureFlagSchema.index({ organization: 1, isEnabled: 1 });
featureFlagSchema.index({ organization: 1, "rolloutStrategy.type": 1 });
featureFlagSchema.index({ isEnabled: 1, expiresAt: 1 });

// Virtuals
featureFlagSchema.virtual("isActive").get(function () {
   return this.isEnabled && !this.isExpired;
});

featureFlagSchema.virtual("isPercentageRollout").get(function () {
   return this.rolloutStrategy.type === "percentage";
});

featureFlagSchema.virtual("isUserTargeted").get(function () {
   return this.rolloutStrategy.type === "user_list";
});

featureFlagSchema.virtual("isOrganizationTargeted").get(function () {
   return this.rolloutStrategy.type === "organization_list";
});

featureFlagSchema.virtual("hasVariants").get(function () {
   return this.variants && this.variants.length > 0;
});

featureFlagSchema.virtual("totalVariantWeight").get(function () {
   if (!this.hasVariants) return 0;
   return this.variants.reduce((sum, variant) => sum + variant.weight, 0);
});

featureFlagSchema.virtual("isExpiringSoon").get(function () {
   if (!this.expiresAt) return false;
   const now = new Date();
   const daysUntilExpiry = (this.expiresAt - now) / (1000 * 60 * 60 * 24);
   return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
});

featureFlagSchema.virtual("daysUntilExpiry").get(function () {
   if (!this.expiresAt) return null;
   const now = new Date();
   return Math.ceil((this.expiresAt - now) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
featureFlagSchema.pre("save", function (next) {
   // Set key from name if not provided
   if (!this.key && this.name) {
      this.key = this.name.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
   }

   // Check if expired
   if (this.expiresAt && new Date() > this.expiresAt) {
      this.isExpired = true;
      this.isEnabled = false; // Disable expired flags
   }

   // Validate variant weights
   if (this.hasVariants) {
      const totalWeight = this.totalVariantWeight;
      if (totalWeight > 100) {
         return next(new Error("Total variant weight cannot exceed 100%"));
      }
   }

   next();
});

// Instance methods
featureFlagSchema.methods.enable = function (userId, reason) {
   const previousValue = this.isEnabled;
   this.isEnabled = true;
   this.addAuditLog("enabled", userId, previousValue, true, reason);
   return this.save();
};

featureFlagSchema.methods.disable = function (userId, reason) {
   const previousValue = this.isEnabled;
   this.isEnabled = false;
   this.addAuditLog("disabled", userId, previousValue, false, reason);
   return this.save();
};

featureFlagSchema.methods.updateRollout = function (rolloutData, userId, reason) {
   const previousValue = { ...this.rolloutStrategy };
   Object.assign(this.rolloutStrategy, rolloutData);
   this.addAuditLog("updated", userId, previousValue, this.rolloutStrategy, reason);
   return this.save();
};

featureFlagSchema.methods.addVariant = function (variantData) {
   // Check if variant name already exists
   if (this.variants.some((v) => v.name === variantData.name)) {
      throw new Error("Variant name already exists");
   }

   this.variants.push(variantData);

   // Validate total weight
   if (this.totalVariantWeight > 100) {
      throw new Error("Total variant weight cannot exceed 100%");
   }

   return this.save();
};

featureFlagSchema.methods.removeVariant = function (variantName) {
   this.variants = this.variants.filter((v) => v.name !== variantName);
   return this.save();
};

featureFlagSchema.methods.addDependency = function (featureFlagId, requiredState = true) {
   // Check for circular dependencies
   if (this._id && featureFlagId.toString() === this._id.toString()) {
      throw new Error("Cannot add self as dependency");
   }

   this.dependencies.push({
      featureFlag: featureFlagId,
      requiredState,
   });
   return this.save();
};

featureFlagSchema.methods.removeDependency = function (featureFlagId) {
   this.dependencies = this.dependencies.filter((dep) => dep.featureFlag.toString() !== featureFlagId.toString());
   return this.save();
};

featureFlagSchema.methods.evaluateForUser = function (
   userId,
   userProperties = {},
   organizationId = null,
   organizationProperties = {}
) {
   // Check if flag is enabled and not expired
   if (!this.isActive) {
      return { enabled: false, variant: null };
   }

   // Check dependencies
   if (!this.checkDependencies()) {
      return { enabled: false, variant: null };
   }

   // Check targeting rules
   if (!this.checkTargetingRules(userId, userProperties, organizationId, organizationProperties)) {
      return { enabled: false, variant: null };
   }

   // Evaluate rollout strategy
   const rolloutResult = this.evaluateRolloutStrategy(userId, organizationId);

   if (!rolloutResult.enabled) {
      return { enabled: false, variant: null };
   }

   // Return variant if available
   const variant = this.selectVariant(userId);
   return {
      enabled: true,
      variant: variant,
   };
};

featureFlagSchema.methods.checkDependencies = async function () {
   if (this.dependencies.length === 0) return true;

   const FeatureFlag = mongoose.model("FeatureFlag");

   for (const dep of this.dependencies) {
      const depFlag = await FeatureFlag.findById(dep.featureFlag);
      if (!depFlag) continue;

      const isDepEnabled = depFlag.isActive;
      if (dep.requiredState !== isDepEnabled) {
         return false;
      }
   }

   return true;
};

featureFlagSchema.methods.checkTargetingRules = function (
   userId,
   userProperties,
   organizationId,
   organizationProperties
) {
   // Check user segments
   if (this.targetingRules.userSegments && this.targetingRules.userSegments.length > 0) {
      const userSegments = userProperties.segments || [];
      if (!this.targetingRules.userSegments.some((segment) => userSegments.includes(segment))) {
         return false;
      }
   }

   // Check user properties
   if (this.targetingRules.userProperties) {
      for (const [key, expectedValue] of this.targetingRules.userProperties) {
         const actualValue = userProperties[key];
         if (actualValue !== expectedValue) {
            return false;
         }
      }
   }

   // Check organization properties
   if (this.targetingRules.organizationProperties && organizationId) {
      for (const [key, expectedValue] of this.targetingRules.organizationProperties) {
         const actualValue = organizationProperties[key];
         if (actualValue !== expectedValue) {
            return false;
         }
      }
   }

   // Check date range
   if (this.targetingRules.dateRange) {
      const now = new Date();
      if (this.targetingRules.dateRange.start && now < this.targetingRules.dateRange.start) {
         return false;
      }
      if (this.targetingRules.dateRange.end && now > this.targetingRules.dateRange.end) {
         return false;
      }
   }

   // Check geo location
   if (this.targetingRules.geoLocation) {
      const userCountry = userProperties.country;
      const userRegion = userProperties.region;

      if (
         this.targetingRules.geoLocation.countries &&
         !this.targetingRules.geoLocation.countries.includes(userCountry)
      ) {
         return false;
      }

      if (this.targetingRules.geoLocation.regions && !this.targetingRules.geoLocation.regions.includes(userRegion)) {
         return false;
      }
   }

   return true;
};

featureFlagSchema.methods.evaluateRolloutStrategy = function (userId, organizationId) {
   switch (this.rolloutStrategy.type) {
      case "percentage":
         return this.evaluatePercentageRollout(userId);

      case "user_list":
         return {
            enabled: this.rolloutStrategy.userIds.some((id) => id.toString() === userId.toString()),
         };

      case "organization_list":
         return {
            enabled:
               organizationId &&
               this.rolloutStrategy.organizationIds.some((id) => id.toString() === organizationId.toString()),
         };

      case "environment":
         const currentEnv = process.env.NODE_ENV || "development";
         return {
            enabled: this.rolloutStrategy.environments.includes(currentEnv),
         };

      default:
         return { enabled: this.isEnabled };
   }
};

featureFlagSchema.methods.evaluatePercentageRollout = function (userId) {
   if (this.rolloutStrategy.percentage >= 100) {
      return { enabled: true };
   }

   if (this.rolloutStrategy.percentage <= 0) {
      return { enabled: false };
   }

   // Use user ID for consistent rollout
   const hash = this.simpleHash(userId.toString());
   const percentage = (hash % 100) + 1;

   return { enabled: percentage <= this.rolloutStrategy.percentage };
};

featureFlagSchema.methods.selectVariant = function (userId) {
   if (!this.hasVariants) return null;

   // Use user ID for consistent variant selection
   const hash = this.simpleHash(userId.toString());
   const randomValue = (hash % 100) + 1;

   let cumulativeWeight = 0;
   for (const variant of this.variants) {
      cumulativeWeight += variant.weight;
      if (randomValue <= cumulativeWeight) {
         return variant;
      }
   }

   return null;
};

featureFlagSchema.methods.simpleHash = function (str) {
   let hash = 0;
   for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
   }
   return Math.abs(hash);
};

featureFlagSchema.methods.addAuditLog = function (action, userId, previousValue, newValue, reason) {
   this.auditLog.push({
      action,
      user: userId,
      previousValue,
      newValue,
      reason,
      timestamp: new Date(),
   });

   // Keep only last 50 audit entries
   if (this.auditLog.length > 50) {
      this.auditLog = this.auditLog.slice(-50);
   }
};

featureFlagSchema.methods.extendExpiry = function (days) {
   if (!this.expiresAt) {
      this.expiresAt = new Date();
   }

   this.expiresAt.setDate(this.expiresAt.getDate() + days);
   this.isExpired = false;
   return this.save();
};

// Static methods
featureFlagSchema.statics.findEnabled = function (organizationId = null) {
   const query = { isEnabled: true, isExpired: false };
   if (organizationId) {
      query.organization = organizationId;
   }

   return this.find(query).sort({ name: 1 });
};

featureFlagSchema.statics.findByTag = function (tag, organizationId = null) {
   const query = { tags: tag };
   if (organizationId) {
      query.organization = organizationId;
   }

   return this.find(query).sort({ name: 1 });
};

featureFlagSchema.statics.findExpiringSoon = function (organizationId = null, days = 7) {
   const futureDate = new Date();
   futureDate.setDate(futureDate.getDate() + days);

   const query = {
      expiresAt: {
         $gte: new Date(),
         $lte: futureDate,
      },
      isExpired: false,
   };

   if (organizationId) {
      query.organization = organizationId;
   }

   return this.find(query).sort({ expiresAt: 1 });
};

featureFlagSchema.statics.findExpired = function (organizationId = null) {
   const query = { isExpired: true };
   if (organizationId) {
      query.organization = organizationId;
   }

   return this.find(query).sort({ expiresAt: -1 });
};

featureFlagSchema.statics.evaluateForUser = async function (
   flagKey,
   userId,
   userProperties = {},
   organizationId = null,
   organizationProperties = {}
) {
   const flag = await this.findOne({
      key: flagKey,
      $or: [
         { organization: organizationId },
         { organization: { $exists: false } }, // Global flags
      ],
   });

   if (!flag) {
      return { enabled: false, variant: null };
   }

   return flag.evaluateForUser(userId, userProperties, organizationId, organizationProperties);
};

featureFlagSchema.statics.getFeatureStats = async function (organizationId = null) {
   const matchStage = {};
   if (organizationId) {
      matchStage.organization = mongoose.Types.ObjectId(organizationId);
   }

   const stats = await this.aggregate([
      { $match: matchStage },
      {
         $group: {
            _id: null,
            totalFlags: { $sum: 1 },
            enabledFlags: {
               $sum: { $cond: [{ $eq: ["$isEnabled", true] }, 1, 0] },
            },
            disabledFlags: {
               $sum: { $cond: [{ $eq: ["$isEnabled", false] }, 1, 0] },
            },
            expiredFlags: {
               $sum: { $cond: [{ $eq: ["$isExpired", true] }, 1, 0] },
            },
            byRolloutType: {
               $push: "$rolloutStrategy.type",
            },
            byTag: {
               $push: "$tags",
            },
         },
      },
   ]);

   if (stats.length === 0) {
      return {
         totalFlags: 0,
         enabledFlags: 0,
         disabledFlags: 0,
         expiredFlags: 0,
         rolloutTypes: {},
         tags: {},
      };
   }

   const result = stats[0];

   // Count rollout types
   result.rolloutTypes = result.byRolloutType.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
   }, {});

   // Count tags
   const allTags = result.byTag.flat();
   result.tags = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
   }, {});

   delete result.byRolloutType;
   delete result.byTag;

   return result;
};

const FeatureFlag = mongoose.model("FeatureFlag", featureFlagSchema);

export default FeatureFlag;
