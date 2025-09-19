// services/TenantService.js
import { Tenant, TenantConfig, TenantUser, TenantDomain } from "../models/index.js";
import * as NotificationService from "./NotificationService.js";

class TenantService {
   // Create a new tenant
   async createTenant(tenantData) {
      const { name, domain, adminEmail, plan = "basic", settings = {} } = tenantData;

      // Check if domain is available
      const existingTenant = await Tenant.findOne({ domain });
      if (existingTenant) {
         throw new Error("Domain is already taken");
      }

      // Create tenant
      const tenant = new Tenant({
         name,
         domain,
         plan,
         settings: {
            maxUsers: 10,
            maxStorage: 100, // MB
            features: ["basic_inventory", "basic_reporting"],
            ...settings,
         },
         status: "active",
      });

      await tenant.save();

      // Create tenant domain
      const tenantDomain = new TenantDomain({
         tenant: tenant._id,
         domain,
         isPrimary: true,
         verified: false,
      });

      await tenantDomain.save();

      // Configure default settings
      await this.configureDefaults(tenant._id);

      // Send welcome notification
      await NotificationService.sendEmail(
         adminEmail,
         "Tenant Created Successfully",
         `Your tenant "${name}" has been created successfully. Domain: ${domain}`
      );

      return {
         tenantId: tenant._id,
         name: tenant.name,
         domain: tenant.domain,
         plan: tenant.plan,
      };
   }

   // Configure tenant defaults
   async configureDefaults(tenantId) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
         throw new Error("Tenant not found");
      }

      // Create default configuration
      const defaultConfig = {
         theme: {
            primaryColor: "#007bff",
            logo: null,
         },
         notifications: {
            emailEnabled: true,
            smsEnabled: false,
            lowStockAlerts: true,
         },
         inventory: {
            defaultWarehouse: null,
            autoReorder: false,
            reorderThreshold: 10,
         },
         security: {
            passwordPolicy: "medium",
            sessionTimeout: 30, // minutes
            twoFactorRequired: false,
         },
      };

      const tenantConfig = new TenantConfig({
         tenant: tenantId,
         config: defaultConfig,
      });

      await tenantConfig.save();

      // Update tenant with config reference
      tenant.config = tenantConfig._id;
      await tenant.save();

      return tenantConfig;
   }

   // Handle data partitioning for tenant
   async dataPartitioning(tenantId) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
         throw new Error("Tenant not found");
      }

      // In a real implementation, this would set up database partitioning
      // For now, simulate partitioning setup
      const partitioning = {
         database: `tenant_${tenantId}`,
         collections: ["products", "orders", "users", "inventory"],
         indexes: [
            { collection: "products", field: "tenant", unique: false },
            { collection: "orders", field: "tenant", unique: false },
         ],
      };

      // Update tenant with partitioning info
      tenant.dataPartitioning = partitioning;
      await tenant.save();

      return partitioning;
   }

   // Add user to tenant
   async addUserToTenant(tenantId, userData) {
      const { userId, role = "user", permissions = [] } = userData;

      const tenantUser = new TenantUser({
         tenant: tenantId,
         user: userId,
         role,
         permissions,
         status: "active",
      });

      await tenantUser.save();

      return tenantUser;
   }

   // Remove user from tenant
   async removeUserFromTenant(tenantId, userId) {
      const result = await TenantUser.findOneAndDelete({
         tenant: tenantId,
         user: userId,
      });

      return { success: !!result };
   }

   // Update tenant settings
   async updateTenantSettings(tenantId, settings) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
         throw new Error("Tenant not found");
      }

      // Update settings
      tenant.settings = { ...tenant.settings, ...settings };
      await tenant.save();

      return tenant.settings;
   }

   // Get tenant configuration
   async getTenantConfig(tenantId) {
      const config = await TenantConfig.findOne({ tenant: tenantId });
      if (!config) {
         throw new Error("Tenant configuration not found");
      }

      return config.config;
   }

   // Update tenant configuration
   async updateTenantConfig(tenantId, newConfig) {
      const config = await TenantConfig.findOne({ tenant: tenantId });
      if (!config) {
         throw new Error("Tenant configuration not found");
      }

      // Merge new config with existing
      config.config = { ...config.config, ...newConfig };
      config.updatedAt = new Date();

      await config.save();

      return config.config;
   }

   // Get tenant users
   async getTenantUsers(tenantId, filters = {}) {
      const { role, status = "active" } = filters;

      let query = { tenant: tenantId };
      if (role) query.role = role;
      if (status) query.status = status;

      const users = await TenantUser.find(query).populate("user", "name email").sort({ createdAt: -1 });

      return users.map((tenantUser) => ({
         userId: tenantUser.user._id,
         name: tenantUser.user.name,
         email: tenantUser.user.email,
         role: tenantUser.role,
         permissions: tenantUser.permissions,
         status: tenantUser.status,
         joinedAt: tenantUser.createdAt,
      }));
   }

   // Update user role in tenant
   async updateUserRole(tenantId, userId, newRole, newPermissions = []) {
      const tenantUser = await TenantUser.findOneAndUpdate(
         { tenant: tenantId, user: userId },
         {
            role: newRole,
            permissions: newPermissions,
            updatedAt: new Date(),
         },
         { new: true }
      );

      if (!tenantUser) {
         throw new Error("User not found in tenant");
      }

      return tenantUser;
   }

   // Suspend tenant
   async suspendTenant(tenantId, reason) {
      const tenant = await Tenant.findByIdAndUpdate(
         tenantId,
         {
            status: "suspended",
            suspendedAt: new Date(),
            suspensionReason: reason,
         },
         { new: true }
      );

      if (!tenant) {
         throw new Error("Tenant not found");
      }

      // Suspend all tenant users
      await TenantUser.updateMany({ tenant: tenantId }, { status: "suspended" });

      return tenant;
   }

   // Reactivate tenant
   async reactivateTenant(tenantId) {
      const tenant = await Tenant.findByIdAndUpdate(
         tenantId,
         {
            status: "active",
            suspendedAt: null,
            suspensionReason: null,
            reactivatedAt: new Date(),
         },
         { new: true }
      );

      if (!tenant) {
         throw new Error("Tenant not found");
      }

      // Reactivate all tenant users
      await TenantUser.updateMany({ tenant: tenantId }, { status: "active" });

      return tenant;
   }

   // Get tenant statistics
   async getTenantStats(tenantId) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
         throw new Error("Tenant not found");
      }

      // In a real implementation, query actual tenant data
      // For now, return mock statistics
      const stats = {
         users: {
            total: 25,
            active: 22,
            suspended: 3,
         },
         products: {
            total: 1500,
            active: 1450,
            discontinued: 50,
         },
         orders: {
            total: 320,
            thisMonth: 45,
            pending: 12,
         },
         storage: {
            used: 45, // MB
            limit: tenant.settings.maxStorage,
            percentage: (45 / tenant.settings.maxStorage) * 100,
         },
      };

      return stats;
   }

   // Verify domain ownership
   async verifyDomain(tenantId, domainId) {
      const domain = await TenantDomain.findOne({
         _id: domainId,
         tenant: tenantId,
      });

      if (!domain) {
         throw new Error("Domain not found");
      }

      // In a real implementation, verify domain ownership
      // For now, simulate verification
      domain.verified = true;
      domain.verifiedAt = new Date();
      await domain.save();

      return domain;
   }

   // Add custom domain
   async addCustomDomain(tenantId, domainName) {
      // Check if domain is available
      const existingDomain = await TenantDomain.findOne({ domain: domainName });
      if (existingDomain) {
         throw new Error("Domain is already in use");
      }

      const domain = new TenantDomain({
         tenant: tenantId,
         domain: domainName,
         isPrimary: false,
         verified: false,
      });

      await domain.save();

      return domain;
   }

   // Upgrade tenant plan
   async upgradePlan(tenantId, newPlan) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
         throw new Error("Tenant not found");
      }

      const oldPlan = tenant.plan;
      tenant.plan = newPlan;
      tenant.upgradedAt = new Date();

      // Update plan-specific settings
      const planSettings = this.getPlanSettings(newPlan);
      tenant.settings = { ...tenant.settings, ...planSettings };

      await tenant.save();

      // Send upgrade notification
      await NotificationService.sendEmail(
         "admin@example.com",
         "Plan Upgraded",
         `Tenant "${tenant.name}" upgraded from ${oldPlan} to ${newPlan}`
      );

      return tenant;
   }

   // Get plan settings
   getPlanSettings(plan) {
      const plans = {
         basic: {
            maxUsers: 10,
            maxStorage: 100,
            features: ["basic_inventory", "basic_reporting"],
         },
         pro: {
            maxUsers: 50,
            maxStorage: 1000,
            features: ["advanced_inventory", "advanced_reporting", "api_access"],
         },
         enterprise: {
            maxUsers: 500,
            maxStorage: 10000,
            features: ["all_features", "custom_integrations", "priority_support"],
         },
      };

      return plans[plan] || plans.basic;
   }
}

const tenantService = new TenantService();
export default tenantService;
