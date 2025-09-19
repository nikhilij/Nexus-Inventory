// middleware/LoggingMiddleware.js
import { AuditLog } from "../models/index.js";

class LoggingMiddleware {
   constructor(options = {}) {
      this.logLevel = options.logLevel || "info";
      this.includeHeaders = options.includeHeaders !== false;
      this.includeBody = options.includeBody || false;
      this.maxBodySize = options.maxBodySize || 1024; // 1KB max for body logging
      this.sensitiveFields = options.sensitiveFields || ["password", "token", "secret", "key", "authorization"];
      this.performanceThreshold = options.performanceThreshold || 1000; // Log slow requests > 1s
      this.logToDatabase = options.logToDatabase !== false;
      this.logToConsole = options.logToConsole !== false;
      this.requestId = 0;
   }

   // Request logging middleware
   requestLogger(options = {}) {
      const config = {
         level: options.level || "info",
         includeQuery: options.includeQuery !== false,
         includeParams: options.includeParams !== false,
         includeUser: options.includeUser !== false,
         format: options.format || "json",
         ...options,
      };

      return (req, res, next) => {
         // Generate unique request ID
         req.requestId = this.generateRequestId();
         req.startTime = Date.now();

         // Add request ID to response headers
         res.set("X-Request-ID", req.requestId);

         const logData = {
            requestId: req.requestId,
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            ip: this.getClientIP(req),
            userAgent: req.get("User-Agent"),
            referer: req.get("Referer"),
            contentType: req.get("Content-Type"),
            contentLength: req.get("Content-Length"),
         };

         // Add optional data based on config
         if (config.includeQuery && Object.keys(req.query).length > 0) {
            logData.query = this.sanitizeObject(req.query);
         }

         if (config.includeParams && Object.keys(req.params).length > 0) {
            logData.params = req.params;
         }

         if (config.includeUser && req.user) {
            logData.user = {
               id: req.user._id,
               email: req.user.email,
               role: req.user.role?.name,
            };
         }

         if (this.includeHeaders) {
            logData.headers = this.sanitizeHeaders(req.headers);
         }

         if (this.includeBody && req.body && Object.keys(req.body).length > 0) {
            logData.body = this.sanitizeObject(req.body);
         }

         // Log the request
         this.log(config.level, "REQUEST", logData, config.format);

         // Store log data for response logging
         req._logData = logData;

         next();
      };
   }

   // Response logging middleware
   responseLogger(options = {}) {
      const config = {
         level: options.level || "info",
         includeResponseBody: options.includeResponseBody || false,
         logSuccessful: options.logSuccessful !== false,
         logErrors: options.logErrors !== false,
         format: options.format || "json",
         ...options,
      };

      return (req, res, next) => {
         // Intercept response to log it
         const originalSend = res.send;
         const originalJson = res.json;
         const originalEnd = res.end;

         const logResponse = (data, isJson = false) => {
            const duration = Date.now() - req.startTime;
            const logData = {
               ...req._logData,
               duration,
               statusCode: res.statusCode,
               responseSize: data ? data.length : 0,
               performance: {
                  duration,
                  isSlow: duration > this.performanceThreshold,
               },
            };

            // Add response body if configured
            if (config.includeResponseBody && data) {
               logData.response = isJson ? JSON.parse(data) : data;
            }

            // Determine log level based on response
            let logLevel = config.level;
            if (res.statusCode >= 500) {
               logLevel = "error";
            } else if (res.statusCode >= 400) {
               logLevel = "warn";
            }

            // Log based on conditions
            const shouldLog =
               (config.logSuccessful && res.statusCode < 400) || (config.logErrors && res.statusCode >= 400);

            if (shouldLog) {
               this.log(logLevel, "RESPONSE", logData, config.format);

               // Log performance issues
               if (logData.performance.isSlow) {
                  this.log(
                     "warn",
                     "PERFORMANCE",
                     {
                        ...logData,
                        message: `Slow request detected: ${duration}ms`,
                     },
                     config.format
                  );
               }
            }

            // Log to database for audit purposes
            if (this.logToDatabase && req.user) {
               this.logToDatabaseAsync(logData);
            }
         };

         res.send = function (data) {
            logResponse(data, false);
            return originalSend.call(this, data);
         };

         res.json = function (data) {
            logResponse(JSON.stringify(data), true);
            return originalJson.call(this, data);
         };

         res.end = function (data) {
            if (data && !res._responseLogged) {
               logResponse(data, false);
               res._responseLogged = true;
            }
            return originalEnd.call(this, data);
         };

         next();
      };
   }

   // Combined request/response logger
   logger(options = {}) {
      return [this.requestLogger(options), this.responseLogger(options)];
   }

   // Security event logger
   securityLogger(options = {}) {
      const config = {
         logAuthAttempts: options.logAuthAttempts !== false,
         logPermissionChecks: options.logPermissionChecks !== false,
         logSuspiciousActivity: options.logSuspiciousActivity !== false,
         ...options,
      };

      return (req, res, next) => {
         // Log authentication attempts
         if (config.logAuthAttempts && req.originalUrl.includes("/auth")) {
            this.log("info", "AUTH_ATTEMPT", {
               requestId: req.requestId,
               ip: this.getClientIP(req),
               userAgent: req.get("User-Agent"),
               endpoint: req.originalUrl,
               method: req.method,
            });
         }

         // Log permission checks
         if (config.logPermissionChecks && req.user) {
            this.log("debug", "PERMISSION_CHECK", {
               requestId: req.requestId,
               userId: req.user._id,
               userRole: req.user.role?.name,
               endpoint: req.originalUrl,
               method: req.method,
            });
         }

         // Detect suspicious activity
         if (config.logSuspiciousActivity) {
            this.detectSuspiciousActivity(req, res);
         }

         next();
      };
   }

   // Database operation logger
   databaseLogger(options = {}) {
      const config = {
         logQueries: options.logQueries !== false,
         logSlowQueries: options.logSlowQueries !== false,
         slowQueryThreshold: options.slowQueryThreshold || 100, // ms
         includeQueryData: options.includeQueryData || false,
         ...options,
      };

      return (req, res, next) => {
         // Monkey patch Mongoose for query logging
         const originalExec = require("mongoose").Query.prototype.exec;

         require("mongoose").Query.prototype.exec = function (callback) {
            const startTime = Date.now();
            const query = this;

            return originalExec.call(this, (err, result) => {
               const duration = Date.now() - startTime;

               if (config.logQueries || (config.logSlowQueries && duration > config.slowQueryThreshold)) {
                  const logData = {
                     requestId: req.requestId,
                     collection: query.model?.collection?.name,
                     operation: query.op,
                     duration,
                     isSlow: duration > config.slowQueryThreshold,
                  };

                  if (config.includeQueryData) {
                     logData.query = query.getQuery();
                     logData.options = query.getOptions();
                  }

                  if (err) {
                     logData.error = err.message;
                     this.log("error", "DB_ERROR", logData);
                  } else {
                     this.log(
                        config.logSlowQueries && duration > config.slowQueryThreshold ? "warn" : "debug",
                        "DB_QUERY",
                        logData
                     );
                  }
               }

               if (callback) callback(err, result);
            });
         };

         next();
      };
   }

   // Performance monitoring logger
   performanceLogger(options = {}) {
      const config = {
         logSlowRequests: options.logSlowRequests !== false,
         slowRequestThreshold: options.slowRequestThreshold || 1000,
         logMemoryUsage: options.logMemoryUsage || false,
         memoryCheckInterval: options.memoryCheckInterval || 60000, // 1 minute
         ...options,
      };

      // Memory monitoring
      if (config.logMemoryUsage) {
         setInterval(() => {
            const memUsage = process.memoryUsage();
            this.log("info", "MEMORY_USAGE", {
               rss: Math.round(memUsage.rss / 1024 / 1024), // MB
               heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
               heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
               external: Math.round(memUsage.external / 1024 / 1024),
            });
         }, config.memoryCheckInterval);
      }

      return (req, res, next) => {
         const startTime = Date.now();
         const startMemory = process.memoryUsage();

         // Intercept response
         const originalSend = res.send;
         const originalJson = res.json;

         const logPerformance = () => {
            const duration = Date.now() - startTime;
            const endMemory = process.memoryUsage();

            if (config.logSlowRequests && duration > config.slowRequestThreshold) {
               const memoryDelta = {
                  rss: endMemory.rss - startMemory.rss,
                  heapUsed: endMemory.heapUsed - startMemory.heapUsed,
               };

               this.log("warn", "SLOW_REQUEST", {
                  requestId: req.requestId,
                  method: req.method,
                  url: req.originalUrl,
                  duration,
                  memoryDelta,
                  statusCode: res.statusCode,
               });
            }
         };

         res.send = function (data) {
            logPerformance();
            return originalSend.call(this, data);
         };

         res.json = function (data) {
            logPerformance();
            return originalJson.call(this, data);
         };

         next();
      };
   }

   // Audit logger for sensitive operations
   auditLogger(options = {}) {
      const config = {
         logUserActions: options.logUserActions !== false,
         logAdminActions: options.logAdminActions !== false,
         sensitiveEndpoints: options.sensitiveEndpoints || [
            "/api/users",
            "/api/organizations",
            "/api/settings",
            "/api/admin",
         ],
         ...options,
      };

      return async (req, res, next) => {
         const isSensitive = config.sensitiveEndpoints.some((endpoint) => req.originalUrl.includes(endpoint));

         if (isSensitive && req.user) {
            const originalSend = res.send;
            const originalJson = res.json;

            const logAudit = async () => {
               try {
                  await AuditLog.create({
                     action: `${req.method.toLowerCase()}_${req.originalUrl.split("/").pop()}`,
                     entityType: this.detectEntityType(req.originalUrl),
                     entityId: req.params.id || null,
                     user: req.user._id,
                     details: {
                        method: req.method,
                        url: req.originalUrl,
                        params: req.params,
                        query: req.query,
                        statusCode: res.statusCode,
                     },
                     ipAddress: this.getClientIP(req),
                     userAgent: req.get("User-Agent"),
                     organization: req.organization?._id,
                  });
               } catch (error) {
                  console.error("Audit logging failed:", error);
               }
            };

            res.send = function (data) {
               logAudit();
               return originalSend.call(this, data);
            };

            res.json = function (data) {
               logAudit();
               return originalJson.call(this, data);
            };
         }

         next();
      };
   }

   // Error logger
   errorLogger(options = {}) {
      const config = {
         logErrors: options.logErrors !== false,
         includeStackTrace: options.includeStackTrace || process.env.NODE_ENV === "development",
         ...options,
      };

      return (err, req, res, next) => {
         if (config.logErrors) {
            this.log("error", "ERROR", {
               requestId: req.requestId,
               message: err.message,
               stack: config.includeStackTrace ? err.stack : undefined,
               url: req.originalUrl,
               method: req.method,
               ip: this.getClientIP(req),
               user: req.user ? req.user._id : null,
               statusCode: res.statusCode || 500,
            });
         }

         next(err);
      };
   }

   // Helper methods
   log(level, type, data, format = "json") {
      if (!this.shouldLog(level)) return;

      const logEntry = {
         timestamp: new Date().toISOString(),
         level: level.toUpperCase(),
         type,
         ...data,
      };

      if (this.logToConsole) {
         if (format === "json") {
            console.log(JSON.stringify(logEntry, null, 2));
         } else {
            console.log(`[${logEntry.timestamp}] ${logEntry.level} ${logEntry.type}:`, logEntry);
         }
      }
   }

   shouldLog(level) {
      const levels = ["error", "warn", "info", "debug"];
      const currentLevelIndex = levels.indexOf(this.logLevel);
      const messageLevelIndex = levels.indexOf(level);

      return messageLevelIndex <= currentLevelIndex;
   }

   generateRequestId() {
      return `req_${++this.requestId}_${Date.now()}`;
   }

   getClientIP(req) {
      return (
         req.ip ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         "unknown"
      );
   }

   sanitizeObject(obj) {
      const sanitized = { ...obj };

      for (const field of this.sensitiveFields) {
         if (sanitized[field]) {
            sanitized[field] = "[REDACTED]";
         }
      }

      // Limit body size
      if (this.includeBody && JSON.stringify(sanitized).length > this.maxBodySize) {
         return { _truncated: true, size: JSON.stringify(sanitized).length };
      }

      return sanitized;
   }

   sanitizeHeaders(headers) {
      const sanitized = { ...headers };

      // Remove sensitive headers
      const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];
      for (const header of sensitiveHeaders) {
         if (sanitized[header]) {
            sanitized[header] = "[REDACTED]";
         }
      }

      return sanitized;
   }

   detectEntityType(url) {
      const urlParts = url.split("/").filter((part) => part);
      const entityMap = {
         users: "user",
         organizations: "organization",
         products: "product",
         orders: "order",
         warehouses: "warehouse",
         inventory: "inventory_item",
         teams: "team",
         apikeys: "api_key",
         sessions: "session",
      };

      for (const part of urlParts) {
         if (entityMap[part]) {
            return entityMap[part];
         }
      }

      return "unknown";
   }

   detectSuspiciousActivity(req, res) {
      const suspiciousPatterns = [
         { pattern: /union.*select/i, type: "SQL_INJECTION" },
         { pattern: /<script/i, type: "XSS_ATTEMPT" },
         { pattern: /\.\./, type: "PATH_TRAVERSAL" },
         { pattern: /eval\(/i, type: "CODE_INJECTION" },
      ];

      const checkString = `${req.originalUrl} ${JSON.stringify(req.query)} ${JSON.stringify(req.body || {})}`;

      for (const { pattern, type } of suspiciousPatterns) {
         if (pattern.test(checkString)) {
            this.log("warn", "SECURITY", {
               requestId: req.requestId,
               type,
               ip: this.getClientIP(req),
               url: req.originalUrl,
               userAgent: req.get("User-Agent"),
               user: req.user ? req.user._id : null,
            });
            break;
         }
      }
   }

   async logToDatabaseAsync(logData) {
      try {
         // Log to database asynchronously to avoid blocking response
         setImmediate(async () => {
            try {
               // This would be implemented based on your audit logging requirements
               console.log("Database logging:", logData);
            } catch (error) {
               console.error("Database logging failed:", error);
            }
         });
      } catch (error) {
         console.error("Async logging setup failed:", error);
      }
   }

   // Analytics methods
   getRequestStats(timeRange = 3600000) {
      // 1 hour default
      // In a real implementation, this would query logs for analytics
      return {
         totalRequests: 0,
         averageResponseTime: 0,
         errorRate: 0,
         topEndpoints: [],
         slowRequests: [],
      };
   }

   getErrorStats(timeRange = 3600000) {
      // In a real implementation, this would query error logs
      return {
         totalErrors: 0,
         errorRate: 0,
         topErrors: [],
         recentErrors: [],
      };
   }

   getPerformanceStats(timeRange = 3600000) {
      // In a real implementation, this would query performance logs
      return {
         averageResponseTime: 0,
         percentile95: 0,
         percentile99: 0,
         slowRequestsCount: 0,
      };
   }
}

const loggingMiddleware = new LoggingMiddleware();

export default loggingMiddleware;

// Export individual middleware functions
export const requestLogger = loggingMiddleware.requestLogger.bind(loggingMiddleware);
export const responseLogger = loggingMiddleware.responseLogger.bind(loggingMiddleware);
export const logger = loggingMiddleware.logger.bind(loggingMiddleware);
export const securityLogger = loggingMiddleware.securityLogger.bind(loggingMiddleware);
export const databaseLogger = loggingMiddleware.databaseLogger.bind(loggingMiddleware);
export const performanceLogger = loggingMiddleware.performanceLogger.bind(loggingMiddleware);
export const auditLogger = loggingMiddleware.auditLogger.bind(loggingMiddleware);
export const errorLogger = loggingMiddleware.errorLogger.bind(loggingMiddleware);
