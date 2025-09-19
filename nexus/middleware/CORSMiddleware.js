// middleware/CORSMiddleware.js
class CORSMiddleware {
   constructor(options = {}) {
      this.allowedOrigins = options.allowedOrigins || ["*"];
      this.allowedMethods = options.allowedMethods || ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
      this.allowedHeaders = options.allowedHeaders || ["Content-Type", "Authorization", "X-Requested-With"];
      this.exposedHeaders = options.exposedHeaders || ["Content-Length", "X-Request-ID"];
      this.credentials = options.credentials || true;
      this.maxAge = options.maxAge || 86400; // 24 hours
      this.logErrors = options.logErrors !== false;
   }

   // CORS middleware handler
   cors() {
      return (req, res, next) => {
         const origin = req.headers.origin;

         // Set CORS headers
         if (this.isOriginAllowed(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
         }

         res.setHeader("Access-Control-Allow-Methods", this.allowedMethods.join(","));
         res.setHeader("Access-Control-Allow-Headers", this.allowedHeaders.join(","));
         res.setHeader("Access-Control-Expose-Headers", this.exposedHeaders.join(","));
         res.setHeader("Access-Control-Allow-Credentials", this.credentials.toString());
         res.setHeader("Access-Control-Max-Age", this.maxAge.toString());

         // Handle preflight requests
         if (req.method === "OPTIONS") {
            return res.status(204).end();
         }

         next();
      };
   }

   // Check if origin is allowed
   isOriginAllowed(origin) {
      if (this.allowedOrigins.includes("*")) {
         return true;
      }
      if (!origin) {
         return false;
      }
      return this.allowedOrigins.some((allowedOrigin) => {
         if (typeof allowedOrigin === "string") {
            return allowedOrigin === origin;
         }
         if (allowedOrigin instanceof RegExp) {
            return allowedOrigin.test(origin);
         }
         return false;
      });
   }

   // Dynamic CORS configuration based on route
   dynamicCors(routeConfigs) {
      return (req, res, next) => {
         const routeConfig = this.findRouteConfig(req.path, routeConfigs);
         const corsOptions = routeConfig ? routeConfig.cors : {};

         const dynamicMiddleware = new CORSMiddleware({ ...this, ...corsOptions });
         return dynamicMiddleware.cors()(req, res, next);
      };
   }

   // Find route-specific CORS configuration
   findRouteConfig(path, routeConfigs) {
      for (const route in routeConfigs) {
         const pattern = new RegExp(`^${route.replace(/:[^\s/]+/g, "([\\w-]+)")}$`);
         if (pattern.test(path)) {
            return routeConfigs[route];
         }
      }
      return null;
   }

   // Error handler for CORS issues
   handleCorsError(err, req, res, next) {
      if (this.logErrors) {
         console.error("CORS Error:", err.message);
      }
      res.status(403).json({
         error: {
            code: "CORS_ERROR",
            message: "Cross-Origin Request Blocked",
         },
      });
   }

   // Add new allowed origin
   addOrigin(origin) {
      if (!this.allowedOrigins.includes(origin)) {
         this.allowedOrigins.push(origin);
      }
   }

   // Remove allowed origin
   removeOrigin(origin) {
      this.allowedOrigins = this.allowedOrigins.filter((o) => o !== origin);
   }

   // Set allowed methods
   setMethods(methods) {
      this.allowedMethods = methods;
   }

   // Set allowed headers
   setHeaders(headers) {
      this.allowedHeaders = headers;
   }
}

const corsMiddleware = new CORSMiddleware({
   allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(",") : ["*"],
   allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
   allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
   credentials: true,
   maxAge: 7200, // 2 hours
});

export default corsMiddleware;

// Export individual middleware functions
export const cors = corsMiddleware.cors.bind(corsMiddleware);
export const dynamicCors = corsMiddleware.dynamicCors.bind(corsMiddleware);
export const handleCorsError = corsMiddleware.handleCorsError.bind(corsMiddleware);
