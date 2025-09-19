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

// Mock DB for development
import * as mockDb from "../app/api/_mockDb";

// Environment configuration
const isDev = process.env.NODE_ENV === "development";
const useMockDb = isDev && (process.env.USE_MOCK_DB === "true" || !process.env.MONGODB_URI);

// Service provider - returns appropriate implementation based on environment
const serviceProvider = {
   // Authentication services
   getAuthService() {
      return AuthService;
   },

   // Product services
   getProductService() {
      if (useMockDb) {
         return {
            listProducts: () => mockDb.list("products"),
            getProduct: (id) => mockDb.find("products", id),
            createProduct: (data) => mockDb.create("products", data),
            updateProduct: (id, data) => mockDb.update("products", id, data),
            deleteProduct: (id) => mockDb.remove("products", id),
         };
      }
      return ProductService;
   },

   // Inventory services
   getInventoryService() {
      if (useMockDb) {
         return {
            listInventory: () => mockDb.list("inventory"),
            getInventoryItem: (id) => mockDb.find("inventory", id),
            createInventoryItem: (data) => mockDb.create("inventory", data),
            updateInventoryItem: (id, data) => mockDb.update("inventory", id, data),
            deleteInventoryItem: (id) => mockDb.remove("inventory", id),
         };
      }
      return InventoryService;
   },

   // Order services
   getOrderService() {
      if (useMockDb) {
         return {
            listOrders: () => mockDb.list("orders"),
            getOrder: (id) => mockDb.find("orders", id),
            createOrder: (data) => mockDb.create("orders", data),
            updateOrder: (id, data) => mockDb.update("orders", id, data),
            deleteOrder: (id) => mockDb.remove("orders", id),
         };
      }
      return OrderService;
   },

   // Supplier services
   getSupplierService() {
      if (useMockDb) {
         return {
            listSuppliers: () => mockDb.list("suppliers"),
            getSupplier: (id) => mockDb.find("suppliers", id),
            createSupplier: (data) => mockDb.create("suppliers", data),
            updateSupplier: (id, data) => mockDb.update("suppliers", id, data),
            deleteSupplier: (id) => mockDb.remove("suppliers", id),
         };
      }
      return SupplierService;
   },

   // User services
   getUserService() {
      if (useMockDb) {
         return {
            listUsers: () => mockDb.list("users"),
            getUser: (id) => mockDb.find("users", id),
            createUser: (data) => mockDb.create("users", data),
            updateUser: (id, data) => mockDb.update("users", id, data),
            deleteUser: (id) => mockDb.remove("users", id),
         };
      }
      return UserService;
   },

   // Notification services
   getNotificationService() {
      if (useMockDb) {
         return {
            listNotifications: () => mockDb.list("notifications"),
            getNotification: (id) => mockDb.find("notifications", id),
            createNotification: (data) => mockDb.create("notifications", data),
            updateNotification: (id, data) => mockDb.update("notifications", id, data),
            deleteNotification: (id) => mockDb.remove("notifications", id),
         };
      }
      return NotificationService;
   },

   // Reporting services
   getReportingService() {
      if (useMockDb) {
         return {
            listReports: () => mockDb.list("reports"),
            getReport: (id) => mockDb.find("reports", id),
            createReport: (data) => mockDb.create("reports", data),
            updateReport: (id, data) => mockDb.update("reports", id, data),
            deleteReport: (id) => mockDb.remove("reports", id),
         };
      }
      return ReportingService;
   },

   // Analytics services
   getAnalyticsService() {
      if (useMockDb) {
         return {
            getAnalytics: () => mockDb.list("analytics"),
            updateAnalytics: (data) => mockDb.update("analytics", null, data),
         };
      }
      return AnalyticsService;
   },

   // Settings services
   getSettingsService() {
      if (useMockDb) {
         return {
            getSettings: () => mockDb.list("settings"),
            updateSettings: (data) => mockDb.update("settings", null, data),
         };
      }
      // Fallback to direct DB access if no specific service
      return {
         getSettings: async () => {
            // Logic to get settings from real DB would go here
            return mockDb.list("settings");
         },
         updateSettings: async (data) => {
            // Logic to update settings in real DB would go here
            return mockDb.update("settings", null, data);
         },
      };
   },

   // Warehouse services
   getWarehouseService() {
      if (useMockDb) {
         return {
            listWarehouses: () => mockDb.list("warehouses"),
            getWarehouse: (id) => mockDb.find("warehouses", id),
            createWarehouse: (data) => mockDb.create("warehouses", data),
            updateWarehouse: (id, data) => mockDb.update("warehouses", id, data),
            deleteWarehouse: (id) => mockDb.remove("warehouses", id),
         };
      }
      // Fallback to direct DB access if no specific service
      return {
         listWarehouses: async () => {
            // Logic to list warehouses from real DB would go here
            return mockDb.list("warehouses");
         },
         getWarehouse: async (id) => {
            // Logic to get warehouse from real DB would go here
            return mockDb.find("warehouses", id);
         },
         createWarehouse: async (data) => {
            // Logic to create warehouse in real DB would go here
            return mockDb.create("warehouses", data);
         },
         updateWarehouse: async (id, data) => {
            // Logic to update warehouse in real DB would go here
            return mockDb.update("warehouses", id, data);
         },
         deleteWarehouse: async (id) => {
            // Logic to delete warehouse from real DB would go here
            return mockDb.remove("warehouses", id);
         },
      };
   },

   // Profile services
   getProfileService() {
      if (useMockDb) {
         return {
            getProfile: () => mockDb.list("profile"),
            updateProfile: (data) => mockDb.update("profile", null, data),
         };
      }
      // Fallback to direct DB access if no specific service
      return {
         getProfile: async () => {
            // Logic to get profile from real DB would go here
            return mockDb.list("profile");
         },
         updateProfile: async (data) => {
            // Logic to update profile in real DB would go here
            return mockDb.update("profile", null, data);
         },
      };
   },
};

export default serviceProvider;
