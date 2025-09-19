// lib/serviceProvider.js
import * as AuthService from "../services/AuthService";
import * as ProductService from "../services/ProductService";
import * as InventoryService from "../services/InventoryService";
import * as OrderService from "../services/OrderService";
import * as SupplierService from "../services/SupplierService";
import * as UserService from "../services/UserService";
import * as NotificationService from "../services/NotificationService";
import * as ReportingService from "../services/ReportingService";
import * as AnalyticsService from "../services/AnalyticsService";
import * as BillingService from "../services/BillingService";
import * as MediaService from "../services/MediaService";
import * as SearchService from "../services/SearchService";
import * as FeatureFlagService from "../services/FeatureFlagService";
import * as CacheService from "../services/CacheService";
import * as ImportExportService from "../services/ImportExportService";
import * as RoleService from "../services/RoleService";
import * as SecurityService from "../services/SecurityService";
import * as SchedulerService from "../services/SchedulerService";
import * as TenantService from "../services/TenantService";
import * as PaymentService from "../services/PaymentService";

// Service provider - returns appropriate service implementations
const serviceProvider = {
   // Authentication services
   getAuthService() {
      return AuthService;
   },

   // Product services
   getProductService() {
      return ProductService;
   },

   // Inventory services
   getInventoryService() {
      return InventoryService;
   },

   // Order services
   getOrderService() {
      return OrderService;
   },

   // Supplier services
   getSupplierService() {
      return SupplierService;
   },

   // User services
   getUserService() {
      return UserService;
   },

   // Notification services
   getNotificationService() {
      return NotificationService;
   },

   // Reporting services
   getReportingService() {
      return ReportingService;
   },

   // Analytics services
   getAnalyticsService() {
      return AnalyticsService;
   },

   // Settings services
   getSettingsService() {
      return {
         getSettings: async () => {
            const { settingsService } = await import("../lib/settingsService");
            return settingsService.getSettings();
         },
         updateSettings: async (data) => {
            const { settingsService } = await import("../lib/settingsService");
            return settingsService.updateSettings(data);
         },
      };
   },

   // Warehouse services
   getWarehouseService() {
      return {
         listWarehouses: async () => {
            const { WarehouseService } = await import("../services/WarehouseService");
            return WarehouseService.listWarehouses();
         },
         getWarehouse: async (id) => {
            const { WarehouseService } = await import("../services/WarehouseService");
            return WarehouseService.getWarehouse(id);
         },
         createWarehouse: async (data) => {
            const { WarehouseService } = await import("../services/WarehouseService");
            return WarehouseService.createWarehouse(data);
         },
         updateWarehouse: async (id, data) => {
            const { WarehouseService } = await import("../services/WarehouseService");
            return WarehouseService.updateWarehouse(id, data);
         },
         deleteWarehouse: async (id) => {
            const { WarehouseService } = await import("../services/WarehouseService");
            return WarehouseService.deleteWarehouse(id);
         },
      };
   },

   // Profile services
   getProfileService() {
      return {
         getProfile: async () => {
            const { userService } = await import("../lib/userService");
            // TODO: Implement proper profile service
            return {};
         },
         updateProfile: async (data) => {
            const { userService } = await import("../lib/userService");
            // TODO: Implement proper profile service
            return data;
         },
      };
   },

   // Additional services
   getBillingService() {
      return BillingService;
   },

   getMediaService() {
      return MediaService;
   },

   getSearchService() {
      return SearchService;
   },

   getFeatureFlagService() {
      return FeatureFlagService;
   },

   getCacheService() {
      return CacheService;
   },

   getImportExportService() {
      return ImportExportService;
   },

   getRoleService() {
      return RoleService;
   },

   getSecurityService() {
      return SecurityService;
   },

   getSchedulerService() {
      return SchedulerService;
   },

   getTenantService() {
      return TenantService;
   },

   getPaymentService() {
      return PaymentService;
   },
};

export default serviceProvider;
