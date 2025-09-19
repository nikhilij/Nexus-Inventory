// services/FeatureFlagService.js
import { FeatureFlag, FeatureRollout, UserFeatureOverride } from "../models/index.js";

class FeatureFlagService {
   // Check if feature is enabled for user
   async isEnabled(flagName, userId, context = {}) {
      // Check user-specific override first
      const userOverride = await UserFeatureOverride.findOne({
         user: userId,
         featureFlag: flagName,
      });

      if (userOverride) {
         return userOverride.enabled;
      }

      // Check feature flag
      const featureFlag = await FeatureFlag.findOne({ name: flagName });
      if (!featureFlag || !featureFlag.enabled) {
         return false;
      }

      // Check rollout rules
      const rollout = await FeatureRollout.findOne({
         featureFlag: flagName,
         isActive: true,
      }).sort({ createdAt: -1 });

      if (!rollout) {
         return featureFlag.enabled;
      }

      // Evaluate rollout conditions
      return this.evaluateRolloutConditions(rollout, userId, context);
   }

   // Create feature rollout
   async rollouts(flagName, rolloutConfig) {
      const { percentage, conditions, startDate, endDate } = rolloutConfig;

      // Get or create feature flag
      let featureFlag = await FeatureFlag.findOne({ name: flagName });
      if (!featureFlag) {
         featureFlag = new FeatureFlag({
            name: flagName,
            description: `Auto-created for rollout: ${flagName}`,
            enabled: true,
         });
         await featureFlag.save();
      }

      // Create rollout
      const rollout = new FeatureRollout({
         featureFlag: flagName,
         percentage,
         conditions: conditions || [],
         startDate: startDate || new Date(),
         endDate,
         isActive: true,
      });

      await rollout.save();

      return {
         rolloutId: rollout._id,
         featureFlag: flagName,
         percentage,
         conditions: rollout.conditions,
      };
   }

   // Set targeting conditions for feature
   async targeting(flagName, conditions) {
      const featureFlag = await FeatureFlag.findOne({ name: flagName });
      if (!featureFlag) {
         throw new Error("Feature flag not found");
      }

      // Update feature flag with targeting conditions
      featureFlag.targetingConditions = conditions;
      await featureFlag.save();

      return {
         flagName,
         conditions: featureFlag.targetingConditions,
      };
   }

   // Create or update feature flag
   async createFeatureFlag(flagData) {
      const { name, description, enabled = false, targetingConditions = [] } = flagData;

      let featureFlag = await FeatureFlag.findOne({ name });

      if (!featureFlag) {
         featureFlag = new FeatureFlag({
            name,
            description,
            enabled,
            targetingConditions,
         });
      } else {
         featureFlag.description = description;
         featureFlag.enabled = enabled;
         featureFlag.targetingConditions = targetingConditions;
      }

      await featureFlag.save();

      return featureFlag;
   }

   // Override feature for specific user
   async setUserOverride(flagName, userId, enabled, reason = "") {
      let override = await UserFeatureOverride.findOne({
         user: userId,
         featureFlag: flagName,
      });

      if (!override) {
         override = new UserFeatureOverride({
            user: userId,
            featureFlag: flagName,
            enabled,
            reason,
         });
      } else {
         override.enabled = enabled;
         override.reason = reason;
         override.updatedAt = new Date();
      }

      await override.save();

      return override;
   }

   // Remove user override
   async removeUserOverride(flagName, userId) {
      const result = await UserFeatureOverride.findOneAndDelete({
         user: userId,
         featureFlag: flagName,
      });

      return { success: !!result };
   }

   // Get all feature flags
   async getFeatureFlags() {
      const flags = await FeatureFlag.find().sort({ name: 1 });

      return flags.map((flag) => ({
         name: flag.name,
         description: flag.description,
         enabled: flag.enabled,
         targetingConditions: flag.targetingConditions,
         createdAt: flag.createdAt,
         updatedAt: flag.updatedAt,
      }));
   }

   // Get feature flag details
   async getFeatureFlagDetails(flagName) {
      const flag = await FeatureFlag.findOne({ name: flagName });
      if (!flag) {
         throw new Error("Feature flag not found");
      }

      const rollouts = await FeatureRollout.find({
         featureFlag: flagName,
      }).sort({ createdAt: -1 });

      const userOverrides = await UserFeatureOverride.find({
         featureFlag: flagName,
      }).populate("user", "name email");

      return {
         flag: {
            name: flag.name,
            description: flag.description,
            enabled: flag.enabled,
            targetingConditions: flag.targetingConditions,
            createdAt: flag.createdAt,
            updatedAt: flag.updatedAt,
         },
         rollouts: rollouts.map((rollout) => ({
            id: rollout._id,
            percentage: rollout.percentage,
            conditions: rollout.conditions,
            startDate: rollout.startDate,
            endDate: rollout.endDate,
            isActive: rollout.isActive,
         })),
         userOverrides: userOverrides.map((override) => ({
            userId: override.user._id,
            userName: override.user.name,
            userEmail: override.user.email,
            enabled: override.enabled,
            reason: override.reason,
            createdAt: override.createdAt,
         })),
      };
   }

   // Evaluate rollout conditions
   evaluateRolloutConditions(rollout, userId, context) {
      // Check date range
      const now = new Date();
      if (rollout.startDate && now < rollout.startDate) {
         return false;
      }
      if (rollout.endDate && now > rollout.endDate) {
         return false;
      }

      // Check percentage rollout
      if (rollout.percentage < 100) {
         const userHash = this.hashUserId(userId);
         const userPercentage = (userHash % 100) + 1;
         if (userPercentage > rollout.percentage) {
            return false;
         }
      }

      // Check targeting conditions
      if (rollout.conditions && rollout.conditions.length > 0) {
         for (const condition of rollout.conditions) {
            if (!this.evaluateCondition(condition, userId, context)) {
               return false;
            }
         }
      }

      return true;
   }

   // Evaluate single condition
   evaluateCondition(condition, userId, context) {
      const { type, field, operator, value } = condition;

      let fieldValue;

      switch (type) {
         case "user":
            fieldValue = context.user ? context.user[field] : null;
            break;
         case "context":
            fieldValue = context[field];
            break;
         case "custom":
            // Custom condition evaluation logic
            return this.evaluateCustomCondition(condition, userId, context);
         default:
            return false;
      }

      return this.compareValues(fieldValue, operator, value);
   }

   // Compare values based on operator
   compareValues(fieldValue, operator, targetValue) {
      switch (operator) {
         case "equals":
            return fieldValue === targetValue;
         case "not_equals":
            return fieldValue !== targetValue;
         case "contains":
            return fieldValue && fieldValue.includes(targetValue);
         case "not_contains":
            return !fieldValue || !fieldValue.includes(targetValue);
         case "greater_than":
            return fieldValue > targetValue;
         case "less_than":
            return fieldValue < targetValue;
         case "in":
            return Array.isArray(targetValue) && targetValue.includes(fieldValue);
         case "not_in":
            return !Array.isArray(targetValue) || !targetValue.includes(fieldValue);
         default:
            return false;
      }
   }

   // Evaluate custom condition
   evaluateCustomCondition(condition, userId, context) {
      // Implement custom condition logic here
      // For example, check user role, subscription tier, etc.
      return true; // Placeholder
   }

   // Hash user ID for percentage rollouts
   hashUserId(userId) {
      let hash = 0;
      const str = userId.toString();

      for (let i = 0; i < str.length; i++) {
         const char = str.charCodeAt(i);
         hash = (hash << 5) - hash + char;
         hash = hash & hash; // Convert to 32-bit integer
      }

      return Math.abs(hash);
   }

   // Deactivate rollout
   async deactivateRollout(rolloutId) {
      const rollout = await FeatureRollout.findByIdAndUpdate(rolloutId, { isActive: false }, { new: true });

      if (!rollout) {
         throw new Error("Rollout not found");
      }

      return rollout;
   }

   // Get feature flag analytics
   async getFeatureAnalytics(flagName, dateRange) {
      // In a real implementation, track feature usage
      // For now, return mock analytics
      return {
         flagName,
         dateRange,
         usage: {
            totalUsers: 1250,
            enabledUsers: 750,
            disabledUsers: 500,
            conversionRate: 60,
         },
         trends: [
            { date: "2024-01-01", enabledUsers: 700 },
            { date: "2024-01-02", enabledUsers: 720 },
            // ... more data
         ],
      };
   }
}

const featureFlagService = new FeatureFlagService();
export default featureFlagService;
