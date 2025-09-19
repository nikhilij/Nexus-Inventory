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
            // TODO: Implement settings service
            return {};
         },
         updateSettings: async (data) => {
            // TODO: Implement settings service
            return data;
         },
      };
   },

   // Warehouse services
   getWarehouseService() {
      return {
         listWarehouses: async () => {
            // TODO: Implement warehouse service
            return [];
         },
         getWarehouse: async (id) => {
            // TODO: Implement warehouse service
            return null;
         },
         createWarehouse: async (data) => {
            // TODO: Implement warehouse service
            return data;
         },
         updateWarehouse: async (id, data) => {
            // TODO: Implement warehouse service
            return data;
         },
         deleteWarehouse: async (id) => {
            // TODO: Implement warehouse service
            return true;
         },
      };
   },

   // Profile services
   getProfileService() {
      return {
         getProfile: async () => {
            // TODO: Implement profile service
            return {};
         },
         updateProfile: async (data) => {
            // TODO: Implement profile service
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
