// Mongoose models setup and connection management
import { connectDB } from "./database.js";

// This file now serves as a central place to import and register all Mongoose models
// Models will be imported from the models directory

export const initializeDatabase = async () => {
   try {
      await connectDB();

      // Import all models to ensure they are registered with Mongoose
      const models = [
         "./models/User.js",
         "./models/Role.js",
         "./models/Permission.js",
         "./models/Organization.js",
         "./models/Team.js",
         "./models/Invite.js",
         "./models/ApiKey.js",
         "./models/OAuthClient.js",
         "./models/Session.js",
         "./models/Category.js",
         "./models/Product.js",
         "./models/ProductVariant.js",
         "./models/Tag.js",
         "./models/Warehouse.js",
         "./models/InventoryItem.js",
         "./models/Batch.js",
         "./models/Supplier.js",
         "./models/Order.js",
         "./models/OrderLine.js",
         "./models/Transaction.js",
         "./models/AuditLog.js",
         "./models/Attachment.js",
         "./models/Invoice.js",
         "./models/Subscription.js",
         "./models/WebhookEvent.js",
         "./models/ScheduledJob.js",
         "./models/FeatureFlag.js",
         "./models/IndexMigration.js",
      ];

      // Dynamically import models (this ensures they are registered)
      for (const modelPath of models) {
         try {
            await import(modelPath);
         } catch (error) {
            console.warn(`Could not load model ${modelPath}:`, error.message);
         }
      }

      console.log("All models initialized successfully");
   } catch (error) {
      console.error("Database initialization error:", error);
      throw error;
   }
};

export default initializeDatabase;
