// middleware/MiddlewareComposer.js
import authMiddleware from "./AuthMiddleware.js";
import validationMiddleware from "./ValidationMiddleware.js";
import rateLimitMiddleware from "./RateLimitMiddleware.js";
import cacheMiddleware from "./CacheMiddleware.js";
import errorHandlingMiddleware from "./ErrorHandlingMiddleware.js";
import loggingMiddleware from "./LoggingMiddleware.js";

class MiddlewareComposer {
   constructor() {
      this.middlewares = {
         auth: authMiddleware,
         validation: validationMiddleware,
         rateLimit: rateLimitMiddleware,
         cache: cacheMiddleware,
         error: errorHandlingMiddleware,
         logging: loggingMiddleware,
      };
   }

   // Compose middleware for API routes
   apiMiddleware(options = {}) {
      const config = {
         auth: options.auth || false,
         validation: options.validation || false,
         rateLimit: options.rateLimit || false,
         cache: options.cache || false,
         logging: options.logging !== false,
         error: options.error !== false,
         ...options,
      };

      const middlewareStack = [];

      // Logging middleware (should be first)
      if (config.logging) {
         middlewareStack.push(
            loggingMiddleware.logger({
               includeQuery: true,
               includeParams: true,
               includeUser: true,
            })
         );
      }

      // Rate limiting
      if (config.rateLimit) {
         middlewareStack.push(
            rateLimitMiddleware.userLimiter({
               windowMs: 15 * 60 * 1000, // 15 minutes
               max: 100, // limit each IP to 100 requests per windowMs
            })
         );
      }

      // Authentication
      if (config.auth) {
         middlewareStack.push(authMiddleware.authenticate());
         if (config.auth === "strict") {
            middlewareStack.push(authMiddleware.authorize(["admin", "manager"]));
         }
      }

      // Validation
      if (config.validation) {
         middlewareStack.push(validationMiddleware.validateBody());
      }

      // Caching
      if (config.cache) {
         middlewareStack.push(
            cacheMiddleware.cache({
               ttl: config.cache.ttl || 300, // 5 minutes
               keyGenerator: config.cache.keyGenerator,
            })
         );
      }

      // Error handling (should be last)
      if (config.error) {
         middlewareStack.push(errorHandlingMiddleware.errorHandler());
      }

      return middlewareStack;
   }

   // Compose middleware for public routes
   publicMiddleware(options = {}) {
      const config = {
         rateLimit: options.rateLimit !== false,
         logging: options.logging !== false,
         error: options.error !== false,
         ...options,
      };

      const middlewareStack = [];

      if (config.logging) {
         middlewareStack.push(
            loggingMiddleware.logger({
               includeQuery: false,
               includeParams: false,
               includeUser: false,
            })
         );
      }

      if (config.rateLimit) {
         middlewareStack.push(
            rateLimitMiddleware.publicLimiter({
               windowMs: 15 * 60 * 1000,
               max: 1000,
            })
         );
      }

      if (config.error) {
         middlewareStack.push(errorHandlingMiddleware.errorHandler());
      }

      return middlewareStack;
   }

   // Compose middleware for admin routes
   adminMiddleware(options = {}) {
      const config = {
         auth: options.auth !== false,
         rateLimit: options.rateLimit !== false,
         logging: options.logging !== false,
         audit: options.audit !== false,
         error: options.error !== false,
         ...options,
      };

      const middlewareStack = [];

      if (config.logging) {
         middlewareStack.push(
            loggingMiddleware.logger({
               includeQuery: true,
               includeParams: true,
               includeUser: true,
            })
         );
      }

      if (config.audit) {
         middlewareStack.push(loggingMiddleware.auditLogger());
      }

      if (config.rateLimit) {
         middlewareStack.push(
            rateLimitMiddleware.adminLimiter({
               windowMs: 15 * 60 * 1000,
               max: 50,
            })
         );
      }

      if (config.auth) {
         middlewareStack.push(authMiddleware.authenticate());
         middlewareStack.push(authMiddleware.authorize(["admin"]));
      }

      if (config.error) {
         middlewareStack.push(errorHandlingMiddleware.errorHandler());
      }

      return middlewareStack;
   }

   // Compose middleware for authenticated user routes
   userMiddleware(options = {}) {
      const config = {
         auth: options.auth !== false,
         rateLimit: options.rateLimit !== false,
         logging: options.logging !== false,
         cache: options.cache || false,
         error: options.error !== false,
         ...options,
      };

      const middlewareStack = [];

      if (config.logging) {
         middlewareStack.push(
            loggingMiddleware.logger({
               includeQuery: true,
               includeParams: false,
               includeUser: true,
            })
         );
      }

      if (config.rateLimit) {
         middlewareStack.push(
            rateLimitMiddleware.userLimiter({
               windowMs: 15 * 60 * 1000,
               max: 200,
            })
         );
      }

      if (config.auth) {
         middlewareStack.push(authMiddleware.authenticate());
      }

      if (config.cache) {
         middlewareStack.push(
            cacheMiddleware.cache({
               ttl: config.cache.ttl || 600, // 10 minutes
               keyGenerator: config.cache.keyGenerator,
            })
         );
      }

      if (config.error) {
         middlewareStack.push(errorHandlingMiddleware.errorHandler());
      }

      return middlewareStack;
   }

   // Compose custom middleware stack
   customMiddleware(middlewareNames, options = {}) {
      const middlewareStack = [];

      for (const name of middlewareNames) {
         if (this.middlewares[name]) {
            const middlewareOptions = options[name] || {};
            const middleware = this.middlewares[name];

            // Apply middleware based on type
            switch (name) {
               case "auth":
                  if (middlewareOptions.authenticate) {
                     middlewareStack.push(middleware.authenticate());
                  }
                  if (middlewareOptions.authorize) {
                     middlewareStack.push(middleware.authorize(middlewareOptions.authorize));
                  }
                  break;
               case "validation":
                  if (middlewareOptions.validateBody) {
                     middlewareStack.push(middleware.validateBody(middlewareOptions.validateBody));
                  }
                  if (middlewareOptions.validateModel) {
                     middlewareStack.push(middleware.validateModel(middlewareOptions.validateModel));
                  }
                  break;
               case "rateLimit":
                  if (middlewareOptions.userLimiter) {
                     middlewareStack.push(middleware.userLimiter(middlewareOptions.userLimiter));
                  }
                  if (middlewareOptions.adminLimiter) {
                     middlewareStack.push(middleware.adminLimiter(middlewareOptions.adminLimiter));
                  }
                  break;
               case "cache":
                  if (middlewareOptions.cache) {
                     middlewareStack.push(middleware.cache(middlewareOptions.cache));
                  }
                  break;
               case "logging":
                  if (middlewareOptions.logger) {
                     middlewareStack.push(middleware.logger(middlewareOptions.logger));
                  }
                  if (middlewareOptions.auditLogger) {
                     middlewareStack.push(middleware.auditLogger(middlewareOptions.auditLogger));
                  }
                  break;
               case "error":
                  if (middlewareOptions.errorHandler) {
                     middlewareStack.push(middleware.errorHandler(middlewareOptions.errorHandler));
                  }
                  break;
            }
         }
      }

      return middlewareStack;
   }

   // Apply middleware to Express router
   applyToRouter(router, middlewareStack) {
      return (req, res, next) => {
         let index = 0;

         const executeMiddleware = () => {
            if (index < middlewareStack.length) {
               const middleware = middlewareStack[index++];
               middleware(req, res, () => executeMiddleware());
            } else {
               next();
            }
         };

         executeMiddleware();
      };
   }

   // Get middleware by name
   getMiddleware(name) {
      return this.middlewares[name];
   }

   // Add custom middleware
   addMiddleware(name, middleware) {
      this.middlewares[name] = middleware;
   }

   // Remove middleware
   removeMiddleware(name) {
      delete this.middlewares[name];
   }

   // List available middlewares
   listMiddlewares() {
      return Object.keys(this.middlewares);
   }

   // Create middleware pipeline for specific use cases
   createPipeline(useCase, customOptions = {}) {
      const pipelines = {
         // API endpoints
         api: {
            middlewares: ["logging", "rateLimit", "auth", "validation", "cache", "error"],
            defaultOptions: {
               logging: { includeQuery: true, includeParams: true, includeUser: true },
               rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
               auth: true,
               validation: true,
               cache: { ttl: 300 },
               error: true,
            },
         },

         // Public endpoints
         public: {
            middlewares: ["logging", "rateLimit", "error"],
            defaultOptions: {
               logging: { includeQuery: false, includeParams: false, includeUser: false },
               rateLimit: { windowMs: 15 * 60 * 1000, max: 1000 },
               error: true,
            },
         },

         // Admin endpoints
         admin: {
            middlewares: ["logging", "audit", "rateLimit", "auth", "error"],
            defaultOptions: {
               logging: { includeQuery: true, includeParams: true, includeUser: true },
               audit: true,
               rateLimit: { windowMs: 15 * 60 * 1000, max: 50 },
               auth: { roles: ["admin"] },
               error: true,
            },
         },

         // User endpoints
         user: {
            middlewares: ["logging", "rateLimit", "auth", "cache", "error"],
            defaultOptions: {
               logging: { includeQuery: true, includeParams: false, includeUser: true },
               rateLimit: { windowMs: 15 * 60 * 1000, max: 200 },
               auth: true,
               cache: { ttl: 600 },
               error: true,
            },
         },

         // File upload endpoints
         upload: {
            middlewares: ["logging", "rateLimit", "auth", "validation", "error"],
            defaultOptions: {
               logging: { includeQuery: false, includeParams: true, includeUser: true },
               rateLimit: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 uploads per hour
               auth: true,
               validation: { maxFileSize: 10 * 1024 * 1024 }, // 10MB
               error: true,
            },
         },

         // Search endpoints
         search: {
            middlewares: ["logging", "rateLimit", "auth", "cache", "error"],
            defaultOptions: {
               logging: { includeQuery: true, includeParams: false, includeUser: true },
               rateLimit: { windowMs: 60 * 1000, max: 30 }, // 30 searches per minute
               auth: true,
               cache: { ttl: 60 }, // 1 minute cache
               error: true,
            },
         },
      };

      const pipeline = pipelines[useCase];
      if (!pipeline) {
         throw new Error(`Unknown pipeline: ${useCase}`);
      }

      const options = { ...pipeline.defaultOptions, ...customOptions };
      return this.customMiddleware(pipeline.middlewares, options);
   }

   // Middleware chain executor with error handling
   executeChain(middlewareStack, req, res, finalHandler = () => {}) {
      return new Promise((resolve, reject) => {
         let index = 0;

         const next = (error) => {
            if (error) {
               reject(error);
               return;
            }

            if (index < middlewareStack.length) {
               try {
                  const middleware = middlewareStack[index++];
                  middleware(req, res, next);
               } catch (err) {
                  reject(err);
               }
            } else {
               try {
                  finalHandler(req, res);
                  resolve();
               } catch (err) {
                  reject(err);
               }
            }
         };

         next();
      });
   }

   // Conditional middleware application
   conditionalMiddleware(condition, middlewareStack, fallbackStack = []) {
      return (req, res, next) => {
         const shouldApply = typeof condition === "function" ? condition(req) : condition;

         if (shouldApply) {
            this.executeChain(middlewareStack, req, res, next).catch(next);
         } else if (fallbackStack.length > 0) {
            this.executeChain(fallbackStack, req, res, next).catch(next);
         } else {
            next();
         }
      };
   }

   // Middleware factory for dynamic configuration
   createMiddlewareFactory(config) {
      return (req, res, next) => {
         const middlewareStack = this.buildFromConfig(config, req);

         if (middlewareStack.length > 0) {
            this.executeChain(middlewareStack, req, res, next).catch(next);
         } else {
            next();
         }
      };
   }

   // Build middleware stack from configuration object
   buildFromConfig(config, req) {
      const middlewareStack = [];

      for (const [name, options] of Object.entries(config)) {
         if (this.middlewares[name] && options.enabled !== false) {
            const middleware = this.middlewares[name];

            // Apply conditional logic
            if (options.condition && !options.condition(req)) {
               continue;
            }

            // Apply middleware based on type
            switch (name) {
               case "auth":
                  if (options.authenticate) {
                     middlewareStack.push(middleware.authenticate(options.authenticate));
                  }
                  if (options.authorize) {
                     middlewareStack.push(middleware.authorize(options.authorize));
                  }
                  break;
               case "validation":
                  if (options.validateBody) {
                     middlewareStack.push(middleware.validateBody(options.validateBody));
                  }
                  break;
               case "rateLimit":
                  if (options.limiter) {
                     middlewareStack.push(middleware[options.limiter.type](options.limiter.config));
                  }
                  break;
               case "cache":
                  if (options.cache) {
                     middlewareStack.push(middleware.cache(options.cache));
                  }
                  break;
               case "logging":
                  if (options.logger) {
                     middlewareStack.push(middleware.logger(options.logger));
                  }
                  break;
               case "error":
                  if (options.errorHandler) {
                     middlewareStack.push(middleware.errorHandler(options.errorHandler));
                  }
                  break;
            }
         }
      }

      return middlewareStack;
   }
}

const middlewareComposer = new MiddlewareComposer();

export default middlewareComposer;

// Export factory functions
export const apiMiddleware = middlewareComposer.apiMiddleware.bind(middlewareComposer);
export const publicMiddleware = middlewareComposer.publicMiddleware.bind(middlewareComposer);
export const adminMiddleware = middlewareComposer.adminMiddleware.bind(middlewareComposer);
export const userMiddleware = middlewareComposer.userMiddleware.bind(middlewareComposer);
export const customMiddleware = middlewareComposer.customMiddleware.bind(middlewareComposer);
export const createPipeline = middlewareComposer.createPipeline.bind(middlewareComposer);
