// Environment variable validation and management
import dotenv from "dotenv";
dotenv.config();

// Basic validation can be added here
const requiredEnv = ["NODE_ENV", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
requiredEnv.forEach((v) => {
   if (!process.env[v]) {
      throw new Error(`Missing required environment variable: ${v}`);
   }
});

export const environment = {
   nodeEnv: process.env.NODE_ENV || "development",
   port: process.env.PORT || 3000,
   jwtSecret: process.env.JWT_SECRET || "supersecret",
};
