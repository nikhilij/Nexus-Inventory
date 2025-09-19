// middleware/ErrorHandlingMiddleware.js
import { AuditLog } from "../models/index.js";

class ErrorHandlingMiddleware {
   constructor(options = {}) {
      this.logErrors = options.logErrors !== false;
      this.includeStackTrace = options.includeStackTrace || process.env.NODE_ENV === "development";
      this.errorLogLevel = options.errorLogLevel || "error";
      this.maxRetries = options.maxRetries || 3;
      this.retryDelay = options.retryDelay || 1000; // 1 second
      this.alertThreshold = options.alertThreshold || 10; // Alert after 10 errors in 5 minutes
      this.errorCounts = new Map();
      this.errorCleanupInterval = setInterval(() => this.cleanupErrorCounts(), 300000); // 5 minutes
   }

   // Main error handling middleware
   errorHandler(options = {}) {
      return async (err, req, res, next) => {
         try {
            // Don't process if headers already sent
            if (res.headersSent) {
               return next(err);
            }

            // Create error context
            const errorContext = this.createErrorContext(err, req, res);

            // Log the error
            if (this.logErrors) {
               await this.logError(errorContext);
            }

            // Track error frequency for alerting
            this.trackErrorFrequency(errorContext);

            // Determine error response
            const errorResponse = this.createErrorResponse(errorContext, options);

            // Send error response
            res.status(errorResponse.statusCode).json(errorResponse.body);

            // Trigger error alerts if needed
            await this.checkErrorAlerts(errorContext);
         } catch (handlerError) {
            // Fallback error handling
            console.error("Error in error handler:", handlerError);
            res.status(500).json({
               error: "Internal server error",
               code: "INTERNAL_ERROR",
               message: "An unexpected error occurred while processing the request",
            });
         }
      };
   }

   // Async error wrapper for routes
   asyncErrorHandler(fn) {
      return (req, res, next) => {
         const result = fn(req, res, next);
         if (result && typeof result.catch === "function") {
            result.catch(next);
         }
      };
   }

   // Retry middleware for failed operations
   retryMiddleware(options = {}) {
      const config = {
         maxRetries: options.maxRetries || this.maxRetries,
         retryDelay: options.retryDelay || this.retryDelay,
         retryCondition: options.retryCondition || this.defaultRetryCondition,
         backoffStrategy: options.backoffStrategy || "exponential",
         ...options,
      };

      return async (req, res, next) => {
         let lastError;
         let attempt = 0;

         while (attempt <= config.maxRetries) {
            try {
               // Store original response methods
               const originalSend = res.send;
               const originalJson = res.json;
               let operationCompleted = false;

               // Override response methods to track completion
               res.send = function (data) {
                  operationCompleted = true;
                  return originalSend.call(this, data);
               };

               res.json = function (data) {
                  operationCompleted = true;
                  return originalJson.call(this, data);
               };

               // Execute the operation
               await config.operation(req, res, next);

               if (operationCompleted) {
                  return; // Success, exit retry loop
               }
            } catch (error) {
               lastError = error;
               attempt++;

               if (attempt <= config.maxRetries && config.retryCondition(error, attempt)) {
                  const delay = this.calculateDelay(config.backoffStrategy, attempt, config.retryDelay);
                  await this.delay(delay);
                  continue;
               }

               // Max retries reached or non-retryable error
               break;
            }
         }

         // If we get here, all retries failed
         if (lastError) {
            next(lastError);
         }
      };
   }

   // Circuit breaker middleware
   circuitBreaker(options = {}) {
      const config = {
         failureThreshold: options.failureThreshold || 5,
         recoveryTimeout: options.recoveryTimeout || 60000, // 1 minute
         monitoringPeriod: options.monitoringPeriod || 60000, // 1 minute
         ...options,
      };

      const circuitState = {
         failures: 0,
         lastFailureTime: null,
         state: "CLOSED", // CLOSED, OPEN, HALF_OPEN
      };

      return async (req, res, next) => {
         // Check circuit state
         if (circuitState.state === "OPEN") {
            if (Date.now() - circuitState.lastFailureTime < config.recoveryTimeout) {
               return res.status(503).json({
                  error: "Service temporarily unavailable",
                  code: "CIRCUIT_OPEN",
                  retryAfter: Math.ceil((config.recoveryTimeout - (Date.now() - circuitState.lastFailureTime)) / 1000),
               });
            } else {
               // Transition to half-open
               circuitState.state = "HALF_OPEN";
            }
         }

         try {
            // Store original response methods
            const originalSend = res.send;
            const originalJson = res.json;
            let operationFailed = false;

            res.send = function (data) {
               if (res.statusCode >= 500) {
                  operationFailed = true;
               }
               return originalSend.call(this, data);
            };

            res.json = function (data) {
               if (res.statusCode >= 500) {
                  operationFailed = true;
               }
               return originalJson.call(this, data);
            };

            await next();

            // Reset circuit on success
            if (!operationFailed && circuitState.state === "HALF_OPEN") {
               circuitState.state = "CLOSED";
               circuitState.failures = 0;
            }
         } catch (error) {
            circuitState.failures++;
            circuitState.lastFailureTime = Date.now();

            if (circuitState.failures >= config.failureThreshold) {
               circuitState.state = "OPEN";
            }

            throw error;
         }
      };
   }

   // Graceful degradation middleware
   gracefulDegradation(options = {}) {
      const config = {
         fallbackResponse: options.fallbackResponse || { message: "Service temporarily degraded" },
         degradationCondition: options.degradationCondition || (() => false),
         ...options,
      };

      return async (req, res, next) => {
         if (config.degradationCondition(req)) {
            return res.status(503).json({
               ...config.fallbackResponse,
               code: "SERVICE_DEGRADED",
               degraded: true,
            });
         }

         try {
            await next();
         } catch (error) {
            // Check if we should degrade gracefully
            if (config.shouldDegrade && config.shouldDegrade(error)) {
               return res.status(503).json({
                  ...config.fallbackResponse,
                  code: "SERVICE_DEGRADED",
                  originalError: this.includeStackTrace ? error.message : undefined,
               });
            }

            throw error;
         }
      };
   }

   // Error boundary middleware
   errorBoundary(options = {}) {
      return async (req, res, next) => {
         try {
            await next();
         } catch (error) {
            // Create error context
            const errorContext = this.createErrorContext(error, req, res);

            // Check if this is a known error type
            if (this.isKnownErrorType(error)) {
               return this.handleKnownError(error, errorContext, res);
            }

            // Handle unknown errors
            await this.handleUnknownError(error, errorContext, res);
         }
      };
   }

   // Validation error handler
   validationErrorHandler(options = {}) {
      return (err, req, res, next) => {
         if (err.name === "ValidationError") {
            const errors = {};

            // Format Mongoose validation errors
            if (err.errors) {
               for (const [field, error] of Object.entries(err.errors)) {
                  errors[field] = {
                     message: error.message,
                     value: error.value,
                     kind: error.kind,
                  };
               }
            }

            return res.status(400).json({
               error: "Validation failed",
               code: "VALIDATION_ERROR",
               details: errors,
            });
         }

         next(err);
      };
   }

   // Database error handler
   databaseErrorHandler(options = {}) {
      return (err, req, res, next) => {
         if (err.name === "MongoError" || err.name === "MongoServerError") {
            let statusCode = 500;
            let errorCode = "DATABASE_ERROR";
            let message = "Database operation failed";

            // Handle specific MongoDB errors
            switch (err.code) {
               case 11000: // Duplicate key error
                  statusCode = 409;
                  errorCode = "DUPLICATE_KEY";
                  message = "Resource already exists";
                  break;
               case 121: // Document validation error
                  statusCode = 400;
                  errorCode = "VALIDATION_ERROR";
                  message = "Document validation failed";
                  break;
               default:
                  break;
            }

            return res.status(statusCode).json({
               error: message,
               code: errorCode,
               details: this.includeStackTrace ? err.message : undefined,
            });
         }

         next(err);
      };
   }

   // Authentication error handler
   authErrorHandler(options = {}) {
      return (err, req, res, next) => {
         if (err.name === "JsonWebTokenError") {
            return res.status(401).json({
               error: "Invalid token",
               code: "INVALID_TOKEN",
            });
         }

         if (err.name === "TokenExpiredError") {
            return res.status(401).json({
               error: "Token expired",
               code: "TOKEN_EXPIRED",
            });
         }

         if (err.name === "UnauthorizedError") {
            return res.status(401).json({
               error: "Unauthorized",
               code: "UNAUTHORIZED",
            });
         }

         next(err);
      };
   }

   // File upload error handler
   fileUploadErrorHandler(options = {}) {
      return (err, req, res, next) => {
         if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
               error: "File too large",
               code: "FILE_TOO_LARGE",
               maxSize: options.maxFileSize || "10MB",
            });
         }

         if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
               error: "Unexpected file field",
               code: "UNEXPECTED_FILE",
            });
         }

         next(err);
      };
   }

   // Helper methods
   createErrorContext(err, req, res) {
      return {
         error: err,
         request: {
            method: req.method,
            url: req.originalUrl,
            headers: req.headers,
            userAgent: req.get("User-Agent"),
            ip: req.ip || req.connection?.remoteAddress,
            user: req.user ? { id: req.user._id, email: req.user.email } : null,
            body: req.method !== "GET" ? req.body : undefined,
            query: req.query,
            params: req.params,
         },
         response: {
            statusCode: res.statusCode,
         },
         timestamp: new Date(),
         environment: process.env.NODE_ENV || "development",
         stack: this.includeStackTrace ? err.stack : undefined,
      };
   }

   async logError(errorContext) {
      try {
         // Log to console
         console.error("Error occurred:", {
            message: errorContext.error.message,
            stack: errorContext.stack,
            request: {
               method: errorContext.request.method,
               url: errorContext.request.url,
               ip: errorContext.request.ip,
            },
            user: errorContext.request.user,
            timestamp: errorContext.timestamp,
         });

         // Log to database if user is authenticated
         if (errorContext.request.user) {
            await AuditLog.create({
               action: "error_occurred",
               entityType: "system",
               entityId: null,
               user: errorContext.request.user.id,
               details: {
                  error: errorContext.error.message,
                  url: errorContext.request.url,
                  method: errorContext.request.method,
                  ip: errorContext.request.ip,
               },
               ipAddress: errorContext.request.ip,
               userAgent: errorContext.request.userAgent,
            });
         }
      } catch (logError) {
         console.error("Error logging failed:", logError);
      }
   }

   trackErrorFrequency(errorContext) {
      const errorKey = `${errorContext.error.name}:${errorContext.request.url}`;
      const currentCount = this.errorCounts.get(errorKey) || 0;
      this.errorCounts.set(errorKey, currentCount + 1);
   }

   cleanupErrorCounts() {
      // Reset error counts periodically
      this.errorCounts.clear();
   }

   async checkErrorAlerts(errorContext) {
      const errorKey = `${errorContext.error.name}:${errorContext.request.url}`;
      const errorCount = this.errorCounts.get(errorKey) || 0;

      if (errorCount >= this.alertThreshold) {
         // In a real implementation, this would send alerts via email, Slack, etc.
         console.warn(`ALERT: High error frequency detected for ${errorKey} (${errorCount} errors in 5 minutes)`);

         // Reset count after alerting
         this.errorCounts.delete(errorKey);
      }
   }

   createErrorResponse(errorContext, options) {
      const err = errorContext.error;
      let statusCode = 500;
      let errorCode = "INTERNAL_ERROR";
      let message = "An unexpected error occurred";

      // Determine status code and message based on error type
      if (err.name === "ValidationError") {
         statusCode = 400;
         errorCode = "VALIDATION_ERROR";
         message = "Validation failed";
      } else if (err.name === "CastError") {
         statusCode = 400;
         errorCode = "INVALID_ID";
         message = "Invalid ID format";
      } else if (err.name === "MongoError" && err.code === 11000) {
         statusCode = 409;
         errorCode = "DUPLICATE_ERROR";
         message = "Resource already exists";
      } else if (err.statusCode) {
         statusCode = err.statusCode;
         errorCode = err.code || "CUSTOM_ERROR";
         message = err.message;
      }

      const response = {
         statusCode,
         body: {
            error: message,
            code: errorCode,
            timestamp: errorContext.timestamp,
            requestId: this.generateRequestId(),
         },
      };

      // Include additional details in development
      if (this.includeStackTrace && errorContext.environment === "development") {
         response.body.details = {
            message: err.message,
            stack: err.stack,
            name: err.name,
         };
      }

      return response;
   }

   isKnownErrorType(error) {
      const knownTypes = [
         "ValidationError",
         "CastError",
         "MongoError",
         "JsonWebTokenError",
         "TokenExpiredError",
         "UnauthorizedError",
      ];

      return knownTypes.includes(error.name);
   }

   handleKnownError(error, errorContext, res) {
      const response = this.createErrorResponse(errorContext, {});
      res.status(response.statusCode).json(response.body);
   }

   async handleUnknownError(error, errorContext, res) {
      await this.logError(errorContext);
      const response = this.createErrorResponse(errorContext, {});
      res.status(response.statusCode).json(response.body);
   }

   defaultRetryCondition(error, attempt) {
      // Retry on network errors, timeouts, and 5xx errors
      const retryableErrors = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"];
      const retryableStatusCodes = [500, 502, 503, 504];

      return (
         retryableErrors.includes(error.code) ||
         (error.response && retryableStatusCodes.includes(error.response.status))
      );
   }

   calculateDelay(strategy, attempt, baseDelay) {
      switch (strategy) {
         case "exponential":
            return baseDelay * Math.pow(2, attempt - 1);
         case "linear":
            return baseDelay * attempt;
         case "fixed":
         default:
            return baseDelay;
      }
   }

   delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
   }

   generateRequestId() {
      return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
   }

   // Cleanup method
   destroy() {
      if (this.errorCleanupInterval) {
         clearInterval(this.errorCleanupInterval);
      }
      this.errorCounts.clear();
   }
}

const errorHandlingMiddleware = new ErrorHandlingMiddleware();

export default errorHandlingMiddleware;

// Export individual middleware functions
export const errorHandler = errorHandlingMiddleware.errorHandler.bind(errorHandlingMiddleware);
export const asyncErrorHandler = errorHandlingMiddleware.asyncErrorHandler.bind(errorHandlingMiddleware);
export const retryMiddleware = errorHandlingMiddleware.retryMiddleware.bind(errorHandlingMiddleware);
export const circuitBreaker = errorHandlingMiddleware.circuitBreaker.bind(errorHandlingMiddleware);
export const gracefulDegradation = errorHandlingMiddleware.gracefulDegradation.bind(errorHandlingMiddleware);
export const errorBoundary = errorHandlingMiddleware.errorBoundary.bind(errorHandlingMiddleware);
export const validationErrorHandler = errorHandlingMiddleware.validationErrorHandler.bind(errorHandlingMiddleware);
export const databaseErrorHandler = errorHandlingMiddleware.databaseErrorHandler.bind(errorHandlingMiddleware);
export const authErrorHandler = errorHandlingMiddleware.authErrorHandler.bind(errorHandlingMiddleware);
export const fileUploadErrorHandler = errorHandlingMiddleware.fileUploadErrorHandler.bind(errorHandlingMiddleware);
