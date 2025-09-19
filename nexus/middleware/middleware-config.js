// middleware/index.js
// Comprehensive middleware configuration and setup guide

import middlewareComposer from "./MiddlewareComposer.js";
import authMiddleware from "./AuthMiddleware.js";
import validationMiddleware from "./ValidationMiddleware.js";
import rateLimitMiddleware from "./RateLimitMiddleware.js";
import cacheMiddleware from "./CacheMiddleware.js";
import errorHandlingMiddleware from "./ErrorHandlingMiddleware.js";
import loggingMiddleware from "./LoggingMiddleware.js";

// Configuration presets for different environments
const middlewareConfig = {
   development: {
      logging: {
         level: "debug",
         includeBody: true,
         includeHeaders: true,
         logToDatabase: false,
      },
      rateLimit: {
         enabled: true,
         strict: false,
      },
      cache: {
         enabled: false, // Disable caching in development
      },
      error: {
         includeStackTrace: true,
         detailedErrors: true,
      },
   },

   production: {
      logging: {
         level: "info",
         includeBody: false,
         includeHeaders: false,
         logToDatabase: true,
      },
      rateLimit: {
         enabled: true,
         strict: true,
      },
      cache: {
         enabled: true,
         ttl: 300,
      },
      error: {
         includeStackTrace: false,
         detailedErrors: false,
      },
   },

   test: {
      logging: {
         level: "error",
         logToConsole: false,
         logToDatabase: false,
      },
      rateLimit: {
         enabled: false,
      },
      cache: {
         enabled: false,
      },
      error: {
         includeStackTrace: true,
         detailedErrors: true,
      },
   },
};

// Get current environment configuration
const currentEnv = process.env.NODE_ENV || "development";
const envConfig = middlewareConfig[currentEnv];

// Initialize middleware with environment-specific configuration
const initializeMiddleware = () => {
   // Configure logging middleware
   loggingMiddleware.logLevel = envConfig.logging.level;
   loggingMiddleware.includeBody = envConfig.logging.includeBody;
   loggingMiddleware.includeHeaders = envConfig.logging.includeHeaders;
   loggingMiddleware.logToDatabase = envConfig.logging.logToDatabase;
   loggingMiddleware.logToConsole = envConfig.logging.logToConsole !== false;

   // Configure rate limiting
   if (envConfig.rateLimit.enabled) {
      rateLimitMiddleware.strictMode = envConfig.rateLimit.strict;
   }

   // Configure caching
   if (envConfig.cache.enabled) {
      cacheMiddleware.defaultTtl = envConfig.cache.ttl;
   }

   // Configure error handling
   errorHandlingMiddleware.includeStackTrace = envConfig.error.includeStackTrace;
   errorHandlingMiddleware.detailedErrors = envConfig.error.detailedErrors;

   console.log(`Middleware initialized for ${currentEnv} environment`);
};

// Pre-configured middleware stacks for common use cases
const middlewareStacks = {
   // Public API endpoints (no authentication required)
   public: middlewareComposer.publicMiddleware({
      rateLimit: envConfig.rateLimit.enabled,
      logging: true,
      error: true,
   }),

   // Protected API endpoints (authentication required)
   protected: middlewareComposer.apiMiddleware({
      auth: true,
      validation: true,
      rateLimit: envConfig.rateLimit.enabled,
      cache: envConfig.cache.enabled ? { ttl: 300 } : false,
      logging: true,
      error: true,
   }),

   // Admin-only endpoints
   admin: middlewareComposer.adminMiddleware({
      auth: true,
      rateLimit: envConfig.rateLimit.enabled,
      logging: true,
      audit: true,
      error: true,
   }),

   // User-specific endpoints
   user: middlewareComposer.userMiddleware({
      auth: true,
      rateLimit: envConfig.rateLimit.enabled,
      cache: envConfig.cache.enabled ? { ttl: 600 } : false,
      logging: true,
      error: true,
   }),

   // File upload endpoints
   upload: middlewareComposer.createPipeline("upload", {
      rateLimit: envConfig.rateLimit.enabled ? { windowMs: 60 * 60 * 1000, max: 10 } : false,
      auth: true,
      validation: { maxFileSize: 10 * 1024 * 1024 },
      logging: true,
      error: true,
   }),

   // Search endpoints
   search: middlewareComposer.createPipeline("search", {
      rateLimit: envConfig.rateLimit.enabled ? { windowMs: 60 * 1000, max: 30 } : false,
      auth: true,
      cache: envConfig.cache.enabled ? { ttl: 60 } : false,
      logging: true,
      error: true,
   }),

   // High-security endpoints (financial, sensitive data)
   secure: middlewareComposer.customMiddleware(["logging", "audit", "rateLimit", "auth", "validation", "error"], {
      logging: {
         logger: {
            includeQuery: true,
            includeParams: true,
            includeUser: true,
            level: "info",
         },
         auditLogger: true,
      },
      audit: true,
      rateLimit: envConfig.rateLimit.enabled ? { windowMs: 15 * 60 * 1000, max: 25 } : false,
      auth: { roles: ["admin", "manager"] },
      validation: true,
      error: true,
   }),

   // API endpoints with custom configuration
   custom: (options) =>
      middlewareComposer.apiMiddleware({
         auth: options.auth || false,
         validation: options.validation || false,
         rateLimit: options.rateLimit !== false && envConfig.rateLimit.enabled,
         cache: options.cache && envConfig.cache.enabled ? options.cache : false,
         logging: options.logging !== false,
         error: options.error !== false,
         ...options,
      }),
};

// Middleware for specific HTTP methods
const methodMiddleware = {
   GET: middlewareComposer.apiMiddleware({
      auth: false, // Allow public reads
      rateLimit: envConfig.rateLimit.enabled,
      cache: envConfig.cache.enabled ? { ttl: 300 } : false,
      logging: true,
      error: true,
   }),

   POST: middlewareComposer.apiMiddleware({
      auth: true, // Require auth for creates
      validation: true,
      rateLimit: envConfig.rateLimit.enabled,
      logging: true,
      error: true,
   }),

   PUT: middlewareComposer.apiMiddleware({
      auth: true, // Require auth for updates
      validation: true,
      rateLimit: envConfig.rateLimit.enabled,
      logging: true,
      error: true,
   }),

   DELETE: middlewareComposer.apiMiddleware({
      auth: true, // Require auth for deletes
      rateLimit: envConfig.rateLimit.enabled,
      logging: true,
      audit: true,
      error: true,
   }),
};

// Route-specific middleware configurations
const routeMiddleware = {
   // User management routes
   "/api/users": {
      GET: middlewareStacks.user,
      POST: middlewareStacks.admin, // Only admins can create users
      PUT: middlewareStacks.user,
      DELETE: middlewareStacks.admin,
   },

   // Organization routes
   "/api/organizations": {
      GET: middlewareStacks.user,
      POST: middlewareStacks.admin,
      PUT: middlewareStacks.admin,
      DELETE: middlewareStacks.admin,
   },

   // Public routes (no auth required)
   "/api/public": {
      GET: middlewareStacks.public,
      POST: middlewareStacks.public,
   },

   // Search routes
   "/api/search": {
      GET: middlewareStacks.search,
   },

   // File upload routes
   "/api/upload": {
      POST: middlewareStacks.upload,
   },

   // Admin dashboard routes
   "/api/admin": {
      GET: middlewareStacks.admin,
      POST: middlewareStacks.admin,
      PUT: middlewareStacks.admin,
      DELETE: middlewareStacks.admin,
   },
};

// Utility functions for applying middleware
export const applyMiddleware = (middlewareStack) => {
   return (req, res, next) => {
      middlewareComposer.executeChain(middlewareStack, req, res, next).catch(next);
   };
};

export const applyRouteMiddleware = (route, method) => {
   const routeConfig = routeMiddleware[route];
   if (routeConfig && routeConfig[method]) {
      return applyMiddleware(routeConfig[method]);
   }
   return null;
};

export const applyMethodMiddleware = (method) => {
   return applyMiddleware(methodMiddleware[method] || middlewareStacks.protected);
};

// Conditional middleware application
export const conditionalMiddleware = (condition, middlewareStack, fallback = null) => {
   return middlewareComposer.conditionalMiddleware(condition, middlewareStack, fallback);
};

// Middleware for specific user roles
const roleMiddleware = {
   admin: middlewareComposer.adminMiddleware({
      auth: true,
      audit: true,
      error: true,
   }),

   manager: middlewareComposer.customMiddleware(["logging", "rateLimit", "auth", "error"], {
      logging: true,
      rateLimit: envConfig.rateLimit.enabled,
      auth: { roles: ["admin", "manager"] },
      error: true,
   }),

   user: middlewareStacks.user,

   public: middlewareStacks.public,
};

// Export individual middleware for direct use
export {
   authMiddleware,
   validationMiddleware,
   rateLimitMiddleware,
   cacheMiddleware,
   errorHandlingMiddleware,
   loggingMiddleware,
   middlewareComposer,
};

// Initialize middleware on module load
initializeMiddleware();

const middlewareExports = {
   stacks: middlewareStacks,
   methods: methodMiddleware,
   routes: routeMiddleware,
   roles: roleMiddleware,
   applyMiddleware,
   applyRouteMiddleware,
   applyMethodMiddleware,
   conditionalMiddleware,
   initializeMiddleware,
};

export default middlewareExports;
