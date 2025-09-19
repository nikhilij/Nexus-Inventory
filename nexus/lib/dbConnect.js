// lib/dbConnect.js
import { connectDB, disconnectDB, mongoose } from "../config/database";

// Global is used here to maintain a cached connection across hot reloads
// in development. This prevents connections growing exponentially
// during API Route usage.
let cached = global.mongoose;

if (!cached) {
   cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
   if (cached.conn) {
      return cached.conn;
   }

   if (!cached.promise) {
      cached.promise = connectDB().catch((err) => {
         console.error("MongoDB connection error:", err);
         cached.promise = null;
         throw err;
      });
   }

   try {
      cached.conn = await cached.promise;
   } catch (e) {
      cached.promise = null;
      throw e;
   }

   return cached.conn;
}

// Function to check if the connection is established
function isConnected() {
   return mongoose.connection.readyState === 1;
}

// Export mongoose for direct use when needed
export { dbConnect, isConnected, mongoose };
