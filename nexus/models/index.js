// models/index.js - Comprehensive Mongoose Model Registry
import mongoose from "mongoose";

// Import all models
import User from "./User.js";
import Role from "./Role.js";
import Permission from "./Permission.js";
import Organization from "./Organization.js";
import Product from "./Product.js";
import Category from "./Category.js";
import Warehouse from "./Warehouse.js";
import InventoryItem from "./InventoryItem.js";
import Order from "./Order.js";
import Team from "./Team.js";
import Invite from "./Invite.js";
import ApiKey from "./ApiKey.js";
import OAuthClient from "./OAuthClient.js";
import Session from "./Session.js";
import ProductVariant from "./ProductVariant.js";
import Tag from "./Tag.js";
import Batch from "./Batch.js";
import Supplier from "./Supplier.js";
import OrderLine from "./OrderLine.js";
import Transaction from "./Transaction.js";
import AuditLog from "./AuditLog.js";
import Attachment from "./Attachment.js";
import Invoice from "./Invoice.js";
import Subscription from "./Subscription.js";
import WebhookEvent from "./WebhookEvent.js";
import ScheduledJob from "./ScheduledJob.js";
import JobExecution from "./JobExecution.js";
import JobHistory from "./JobHistory.js";
import FeatureFlag from "./FeatureFlag.js";
import IndexMigration from "./IndexMigration.js";

// Model registry with metadata
const models = {
   // Core Authentication & Authorization
   User,
   Role,
   Permission,
   Session,
   ApiKey,
   OAuthClient,

   // Organization & Team Management
   Organization,
   Team,
   Invite,

   // Product & Inventory Management
   Product,
   Category,
   ProductVariant,
   Warehouse,
   InventoryItem,
   Batch,
   Supplier,
   Tag,

   // Order & Transaction Management
   Order,
   OrderLine,
   Transaction,
   Invoice,

   // System & Infrastructure
   AuditLog,
   Attachment,
   Subscription,
   WebhookEvent,
   ScheduledJob,
   JobExecution,
   JobHistory,
   FeatureFlag,
   IndexMigration,
};

// Model metadata for advanced operations
const modelMetadata = {
   User: {
      collection: "users",
      searchableFields: ["email", "firstName", "lastName", "username"],
      sortableFields: ["createdAt", "updatedAt", "lastLoginAt"],
      relationships: ["organization", "role", "teams"],
   },
   Role: {
      collection: "roles",
      searchableFields: ["name", "description"],
      sortableFields: ["createdAt", "updatedAt", "priority"],
      relationships: ["permissions", "users"],
   },
   Permission: {
      collection: "permissions",
      searchableFields: ["name", "resource", "action"],
      sortableFields: ["createdAt", "updatedAt"],
      relationships: ["roles"],
   },
   Organization: {
      collection: "organizations",
      searchableFields: ["name", "domain", "description"],
      sortableFields: ["createdAt", "updatedAt"],
      relationships: ["owner", "members", "teams", "warehouses"],
   },
   Product: {
      collection: "products",
      searchableFields: ["name", "sku", "description", "brand"],
      sortableFields: ["createdAt", "updatedAt", "price", "stockQuantity"],
      relationships: ["category", "variants", "supplier", "organization"],
   },
   Category: {
      collection: "categories",
      searchableFields: ["name", "description"],
      sortableFields: ["createdAt", "updatedAt", "sortOrder"],
      relationships: ["parent", "children", "products"],
   },
   Warehouse: {
      collection: "warehouses",
      searchableFields: ["name", "location", "address"],
      sortableFields: ["createdAt", "updatedAt"],
      relationships: ["organization", "inventoryItems"],
   },
   InventoryItem: {
      collection: "inventoryitems",
      searchableFields: ["sku", "productName"],
      sortableFields: ["createdAt", "updatedAt", "quantity", "reservedQuantity"],
      relationships: ["product", "warehouse", "batch"],
   },
   Order: {
      collection: "orders",
      searchableFields: ["orderNumber", "customerName", "customerEmail"],
      sortableFields: ["createdAt", "updatedAt", "totalAmount", "orderDate"],
      relationships: ["customer", "organization", "orderLines", "warehouse"],
   },
   Team: {
      collection: "teams",
      searchableFields: ["name", "description"],
      sortableFields: ["createdAt", "updatedAt"],
      relationships: ["organization", "members", "leader"],
   },
   Invite: {
      collection: "invites",
      searchableFields: ["email", "token"],
      sortableFields: ["createdAt", "updatedAt", "expiresAt"],
      relationships: ["organization", "team", "invitedBy", "acceptedBy"],
   },
   ApiKey: {
      collection: "apikeys",
      searchableFields: ["name", "key"],
      sortableFields: ["createdAt", "updatedAt", "lastUsedAt"],
      relationships: ["organization", "createdBy"],
   },
   OAuthClient: {
      collection: "oauthclients",
      searchableFields: ["name", "clientId"],
      sortableFields: ["createdAt", "updatedAt"],
      relationships: ["organization", "createdBy"],
   },
   Session: {
      collection: "sessions",
      searchableFields: ["sessionId"],
      sortableFields: ["createdAt", "updatedAt", "expiresAt"],
      relationships: ["user"],
   },
   ProductVariant: {
      collection: "productvariants",
      searchableFields: ["sku", "name"],
      sortableFields: ["createdAt", "updatedAt", "price", "stockQuantity"],
      relationships: ["product", "attributes"],
   },
   Tag: {
      collection: "tags",
      searchableFields: ["name", "description"],
      sortableFields: ["createdAt", "updatedAt"],
      relationships: ["products", "categories"],
   },
   Batch: {
      collection: "batches",
      searchableFields: ["batchNumber", "lotNumber"],
      sortableFields: ["createdAt", "updatedAt", "expiryDate", "manufactureDate"],
      relationships: ["product", "supplier", "inventoryItems"],
   },
   Supplier: {
      collection: "suppliers",
      searchableFields: ["name", "email", "company"],
      sortableFields: ["createdAt", "updatedAt"],
      relationships: ["organization", "products", "batches"],
   },
   OrderLine: {
      collection: "orderlines",
      searchableFields: ["productName", "sku"],
      sortableFields: ["createdAt", "updatedAt", "quantity", "unitPrice"],
      relationships: ["order", "product", "productVariant"],
   },
   Transaction: {
      collection: "transactions",
      searchableFields: ["transactionId", "reference"],
      sortableFields: ["createdAt", "updatedAt", "amount"],
      relationships: ["order", "organization", "processedBy"],
   },
   AuditLog: {
      collection: "auditlogs",
      searchableFields: ["action", "entityType", "entityId"],
      sortableFields: ["createdAt", "updatedAt"],
      relationships: ["user", "organization"],
   },
   Attachment: {
      collection: "attachments",
      searchableFields: ["filename", "originalName"],
      sortableFields: ["createdAt", "updatedAt", "fileSize"],
      relationships: ["uploadedBy", "entity"],
   },
   Invoice: {
      collection: "invoices",
      searchableFields: ["invoiceNumber", "customerName"],
      sortableFields: ["createdAt", "updatedAt", "totalAmount", "dueDate"],
      relationships: ["order", "organization", "customer"],
   },
   Subscription: {
      collection: "subscriptions",
      searchableFields: ["subscriptionId", "planName"],
      sortableFields: ["createdAt", "updatedAt", "startDate", "endDate"],
      relationships: ["organization", "user"],
   },
   WebhookEvent: {
      collection: "webhookevents",
      searchableFields: ["eventType", "webhookUrl"],
      sortableFields: ["createdAt", "updatedAt"],
      relationships: ["organization"],
   },
   ScheduledJob: {
      collection: "scheduledjobs",
      searchableFields: ["name", "jobType"],
      sortableFields: ["createdAt", "updatedAt", "nextRunAt", "lastRunAt"],
      relationships: ["organization", "createdBy"],
   },
   FeatureFlag: {
      collection: "featureflags",
      searchableFields: ["name", "key", "description"],
      sortableFields: ["createdAt", "updatedAt"],
      relationships: ["organization", "createdBy"],
   },
   IndexMigration: {
      collection: "indexmigrations",
      searchableFields: ["name", "collection", "type"],
      sortableFields: ["createdAt", "updatedAt", "priority"],
      relationships: ["createdBy", "executedBy"],
   },
};

// Utility functions for model operations
class ModelRegistry {
   constructor() {
      this.models = models;
      this.metadata = modelMetadata;
   }

   // Get model by name
   getModel(name) {
      return this.models[name];
   }

   // Get all models
   getAllModels() {
      return this.models;
   }

   // Get model metadata
   getModelMetadata(name) {
      return this.metadata[name];
   }

   // Get searchable fields for a model
   getSearchableFields(name) {
      return this.metadata[name]?.searchableFields || [];
   }

   // Get sortable fields for a model
   getSortableFields(name) {
      return this.metadata[name]?.sortableFields || [];
   }

   // Get relationships for a model
   getRelationships(name) {
      return this.metadata[name]?.relationships || [];
   }

   // Get collection name for a model
   getCollectionName(name) {
      return this.metadata[name]?.collection;
   }

   // Build search query for a model
   buildSearchQuery(modelName, searchTerm, fields = null) {
      const searchableFields = fields || this.getSearchableFields(modelName);
      if (!searchableFields.length || !searchTerm) return {};

      const searchRegex = new RegExp(searchTerm, "i");
      const searchConditions = searchableFields.map((field) => ({
         [field]: searchRegex,
      }));

      return { $or: searchConditions };
   }

   // Build sort query for a model
   buildSortQuery(modelName, sortField, sortOrder = "asc") {
      const sortableFields = this.getSortableFields(modelName);
      if (!sortableFields.includes(sortField)) {
         throw new Error(`Field '${sortField}' is not sortable for model '${modelName}'`);
      }

      return { [sortField]: sortOrder === "desc" ? -1 : 1 };
   }

   // Build population query for relationships
   buildPopulationQuery(modelName, populateFields = null) {
      const relationships = populateFields || this.getRelationships(modelName);
      return relationships.map((rel) => ({
         path: rel,
         select: "-__v",
      }));
   }

   // Validate model exists
   validateModel(name) {
      if (!this.models[name]) {
         throw new Error(`Model '${name}' not found in registry`);
      }
      return true;
   }

   // Get model names
   getModelNames() {
      return Object.keys(this.models);
   }

   // Get models by category
   getModelsByCategory(category) {
      const categories = {
         auth: ["User", "Role", "Permission", "Session", "ApiKey", "OAuthClient"],
         organization: ["Organization", "Team", "Invite"],
         product: ["Product", "Category", "ProductVariant", "Tag"],
         inventory: ["Warehouse", "InventoryItem", "Batch", "Supplier"],
         order: ["Order", "OrderLine", "Transaction", "Invoice"],
         system: [
            "AuditLog",
            "Attachment",
            "Subscription",
            "WebhookEvent",
            "ScheduledJob",
            "FeatureFlag",
            "IndexMigration",
         ],
      };

      return categories[category] || [];
   }

   // Initialize all models (for database setup)
   async initializeModels() {
      const modelNames = this.getModelNames();
      const results = {};

      for (const modelName of modelNames) {
         try {
            const model = this.getModel(modelName);
            // Ensure model is compiled
            if (model && typeof model.ensureIndexes === "function") {
               await model.ensureIndexes();
            }
            results[modelName] = "initialized";
         } catch (error) {
            results[modelName] = `error: ${error.message}`;
         }
      }

      return results;
   }

   // Get model statistics
   async getModelStats() {
      const stats = {};
      const modelNames = this.getModelNames();

      for (const modelName of modelNames) {
         try {
            const model = this.getModel(modelName);
            const count = await model.countDocuments();
            stats[modelName] = {
               count,
               collection: this.getCollectionName(modelName),
            };
         } catch (error) {
            stats[modelName] = { error: error.message };
         }
      }

      return stats;
   }
}

// Create and export registry instance
const modelRegistry = new ModelRegistry();

// Export individual models for direct import
export {
   User,
   Role,
   Permission,
   Organization,
   Product,
   Category,
   Warehouse,
   InventoryItem,
   Order,
   Team,
   Invite,
   ApiKey,
   OAuthClient,
   Session,
   ProductVariant,
   Tag,
   Batch,
   Supplier,
   OrderLine,
   Transaction,
   AuditLog,
   Attachment,
   Invoice,
   Subscription,
   WebhookEvent,
   ScheduledJob,
   FeatureFlag,
   IndexMigration,
};

// Export registry and utilities
export { modelRegistry, modelMetadata };
export default models;
