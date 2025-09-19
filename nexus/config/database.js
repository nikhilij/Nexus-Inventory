// MongoDB connection configuration using Mongoose
import mongoose from "mongoose";

export const connectDB = async () => {
   try {
      if (mongoose.connection.readyState >= 1) {
         return;
      }

      const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/nexusdb";

      await mongoose.connect(MONGODB_URI, {
         // Modern Mongoose doesn't need these options, but keeping for compatibility
         // useNewUrlParser: true,
         // useUnifiedTopology: true,
      });

      console.log("MongoDB connected successfully");
   } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
   }
};

export const disconnectDB = async () => {
   try {
      await mongoose.disconnect();
      console.log("MongoDB disconnected successfully");
   } catch (error) {
      console.error("MongoDB disconnection error:", error);
      throw error;
   }
};

// Export mongoose instance for direct access if needed
export { mongoose };
