// middleware/RateLimitMiddleware.js
import mongoose from "mongoose";
import { User, ApiKey } from "../models/index.js";

// In-memory store for rate limiting (in production, use Redis)
class MemoryStore {
   constructor() {
      this.store = new Map();
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
   }

   async get(key) {
      const data = this.store.get(key);
      if (!data) return null;

      // Check if data has expired
      if (Date.now() > data.expiresAt) {
         this.store.delete(key);
         return null;
      }

      return data;
   }

   async set(key, value, ttlMs) {
      this.store.set(key, {
         value,
         expiresAt: Date.now() + ttlMs,
      });
   }

   async increment(key, ttlMs) {
      const existing = await this.get(key);
      const newValue = existing ? existing.value + 1 : 1;
      await this.set(key, newValue, ttlMs);
      return newValue;
   }

   async reset(key) {
      this.store.delete(key);
   }

   cleanup() {
      const now = Date.now();
      for (const [key, data] of this.store.entries()) {
         if (now > data.expiresAt) {
            this.store.delete(key);
         }
      }
   }

   destroy() {
      if (this.cleanupInterval) {
         clearInterval(this.cleanupInterval);
      }
      this.store.clear();
   }
}

class RateLimitMiddleware {
   constructor(options = {}) {
      this.store = options.store || new MemoryStore();
      this.defaultLimits = {
         windowMs: 15 * 60 * 1000, // 15 minutes
         maxRequests: 100, // requests per window
         skipSuccessfulRequests: false,
         skipFailedRequests: false,
         keyGenerator: (req) => this.getClientIdentifier(req),
         handler: (req, res) => this.defaultHandler(req, res),
         onLimitReached: (req, res) => this.onLimitReached(req, res),
      };

      // Predefined rate limit configurations
      this.presets = {
         strict: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
         normal: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
         lenient: { windowMs: 60 * 60 * 1000, maxRequests: 1000 }, // 1000 requests per hour
         api: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
         auth: { windowMs: 5 * 60 * 1000, maxRequests: 5 }, // 5 auth attempts per 5 minutes
         fileUpload: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 file uploads per hour
      };
   }

   // Main rate limiting middleware
   createLimiter(options = {}) {
      const config = { ...this.defaultLimits, ...options };

      return async (req, res, next) => {
         try {
            const key = config.keyGenerator(req);
            const now = Date.now();

            // Get current request count
            const record = await this.store.get(key);
            const currentCount = record ? record.value : 0;
            const resetTime = record ? record.expiresAt : now + config.windowMs;

            // Check if limit exceeded
            if (currentCount >= config.maxRequests) {
               const remainingTime = Math.ceil((resetTime - now) / 1000);

               res.set({
                  "X-RateLimit-Limit": config.maxRequests,
                  "X-RateLimit-Remaining": 0,
                  "X-RateLimit-Reset": resetTime,
                  "Retry-After": remainingTime,
               });

               return config.handler(req, res, {
                  statusCode: 429,
                  message: "Too many requests",
                  resetTime,
                  remainingTime,
               });
            }

            // Increment counter
            const newCount = await this.store.increment(key, config.windowMs);

            // Set response headers
            res.set({
               "X-RateLimit-Limit": config.maxRequests,
               "X-RateLimit-Remaining": Math.max(0, config.maxRequests - newCount),
               "X-RateLimit-Reset": resetTime,
            });

            // Add rate limit info to request
            req.rateLimit = {
               limit: config.maxRequests,
               current: newCount,
               remaining: Math.max(0, config.maxRequests - newCount),
               resetTime,
               isLimited: false,
            };

            // Handle successful/failed request skipping
            const originalSend = res.send;
            res.send = function (data) {
               const isSuccessful = res.statusCode >= 200 && res.statusCode < 300;
               const isFailed = res.statusCode >= 400;

               if ((config.skipSuccessfulRequests && isSuccessful) || (config.skipFailedRequests && isFailed)) {
                  // Don't count this request
                  this.store.reset(key);
               }

               originalSend.call(this, data);
            };

            next();
         } catch (error) {
            console.error("Rate limiting error:", error);
            // Don't block requests if rate limiting fails
            next();
         }
      };
   }

   // Preset rate limiters
   get strictLimiter() {
      return this.createLimiter(this.presets.strict);
   }

   get normalLimiter() {
      return this.createLimiter(this.presets.normal);
   }

   get lenientLimiter() {
      return this.createLimiter(this.presets.lenient);
   }

   get apiLimiter() {
      return this.createLimiter(this.presets.api);
   }

   get authLimiter() {
      return this.createLimiter(this.presets.auth);
   }

   get fileUploadLimiter() {
      return this.createLimiter(this.presets.fileUpload);
   }

   // User-based rate limiting
   userLimiter(options = {}) {
      const config = {
         ...this.presets.normal,
         ...options,
         keyGenerator: (req) => {
            const userId = req.user?._id || req.params.userId || "anonymous";
            return `user:${userId}`;
         },
      };

      return this.createLimiter(config);
   }

   // Organization-based rate limiting
   organizationLimiter(options = {}) {
      const config = {
         ...this.presets.api,
         ...options,
         keyGenerator: (req) => {
            const orgId = req.organization?._id || req.params.organizationId || "global";
            return `org:${orgId}`;
         },
      };

      return this.createLimiter(config);
   }

   // API key-based rate limiting
   apiKeyLimiter(options = {}) {
      const config = {
         ...this.presets.api,
         ...options,
         keyGenerator: async (req) => {
            if (req.apiKey) {
               return `apikey:${req.apiKey._id}`;
            }

            // Fallback to IP-based limiting
            return this.getClientIdentifier(req);
         },
      };

      return this.createLimiter(config);
   }

   // Endpoint-specific rate limiting
   endpointLimiter(endpoint, options = {}) {
      const config = {
         ...this.presets.normal,
         ...options,
         keyGenerator: (req) => {
            const clientId = this.getClientIdentifier(req);
            return `endpoint:${endpoint}:${clientId}`;
         },
      };

      return this.createLimiter(config);
   }

   // IP-based rate limiting with whitelist/blacklist
   ipLimiter(options = {}) {
      const config = {
         ...this.presets.normal,
         ...options,
         keyGenerator: (req) => {
            return `ip:${this.getClientIP(req)}`;
         },
         handler: (req, res, info) => {
            // Check whitelist
            if (options.whitelist && options.whitelist.includes(this.getClientIP(req))) {
               return next();
            }

            // Check blacklist
            if (options.blacklist && options.blacklist.includes(this.getClientIP(req))) {
               return res.status(403).json({
                  error: "IP address blocked",
                  code: "IP_BLOCKED",
               });
            }

            this.defaultHandler(req, res, info);
         },
      };

      return this.createLimiter(config);
   }

   // Burst rate limiting (allows short bursts)
   burstLimiter(options = {}) {
      const burstConfig = {
         windowMs: options.windowMs || 1000, // 1 second window
         maxRequests: options.burstLimit || 10, // Burst limit
         ...options,
      };

      const sustainedConfig = {
         windowMs: options.sustainedWindowMs || 60000, // 1 minute window
         maxRequests: options.sustainedLimit || 60, // Sustained limit
         ...options,
      };

      return [this.createLimiter(burstConfig), this.createLimiter(sustainedConfig)];
   }

   // Dynamic rate limiting based on user tier
   dynamicLimiter(tierExtractor = (req) => req.user?.tier || "free") {
      const tierLimits = {
         free: this.presets.strict,
         basic: this.presets.normal,
         premium: this.presets.lenient,
         enterprise: { windowMs: 60 * 60 * 1000, maxRequests: 10000 },
      };

      return (req, res, next) => {
         const tier = tierExtractor(req);
         const config = tierLimits[tier] || tierLimits.free;

         const limiter = this.createLimiter({
            ...config,
            keyGenerator: (req) => `tier:${tier}:${this.getClientIdentifier(req)}`,
         });

         limiter(req, res, next);
      };
   }

   // Time-based rate limiting (different limits for different times)
   timeBasedLimiter(timeRules = {}) {
      return (req, res, next) => {
         const now = new Date();
         const currentHour = now.getHours();
         const dayOfWeek = now.getDay();

         let applicableRule = timeRules.default || this.presets.normal;

         // Check for specific time rules
         for (const [condition, rule] of Object.entries(timeRules)) {
            if (condition === "default") continue;

            if (this.checkTimeCondition(condition, currentHour, dayOfWeek)) {
               applicableRule = rule;
               break;
            }
         }

         const limiter = this.createLimiter({
            ...applicableRule,
            keyGenerator: (req) => `time:${currentHour}:${this.getClientIdentifier(req)}`,
         });

         limiter(req, res, next);
      };
   }

   // Custom key generators
   keyGenerators = {
      ip: (req) => `ip:${this.getClientIP(req)}`,
      user: (req) => `user:${req.user?._id || "anonymous"}`,
      session: (req) => `session:${req.session?.id || "anonymous"}`,
      apiKey: (req) => `apikey:${req.apiKey?._id || "anonymous"}`,
      organization: (req) => `org:${req.organization?._id || "global"}`,
      endpoint: (req) => `endpoint:${req.originalUrl}`,
      method: (req) => `method:${req.method}:${this.getClientIP(req)}`,
      userAgent: (req) => `ua:${req.get("User-Agent") || "unknown"}:${this.getClientIP(req)}`,
   };

   // Helper methods
   getClientIdentifier(req) {
      // Priority: User ID > API Key > Session ID > IP Address
      if (req.user?._id) return `user:${req.user._id}`;
      if (req.apiKey?._id) return `apikey:${req.apiKey._id}`;
      if (req.session?.id) return `session:${req.session.id}`;

      return `ip:${this.getClientIP(req)}`;
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

   checkTimeCondition(condition, hour, dayOfWeek) {
      // Parse conditions like "weekdays-9-17", "weekends", "nights"
      const parts = condition.split("-");

      if (parts[0] === "weekdays" && dayOfWeek >= 1 && dayOfWeek <= 5) {
         if (parts[1] && parts[2]) {
            return hour >= parseInt(parts[1]) && hour <= parseInt(parts[2]);
         }
         return true;
      }

      if (parts[0] === "weekends" && (dayOfWeek === 0 || dayOfWeek === 6)) {
         return true;
      }

      if (parts[0] === "nights" && (hour < 6 || hour > 22)) {
         return true;
      }

      return false;
   }

   defaultHandler(req, res, info) {
      res.status(info.statusCode || 429).json({
         error: info.message || "Too many requests",
         code: "RATE_LIMIT_EXCEEDED",
         retryAfter: info.remainingTime || 60,
         resetTime: new Date(info.resetTime).toISOString(),
         limit: req.rateLimit?.limit || 100,
         remaining: req.rateLimit?.remaining || 0,
      });
   }

   onLimitReached(req, res) {
      // Log rate limit violations
      console.warn(`Rate limit exceeded for ${this.getClientIdentifier(req)} on ${req.originalUrl}`);

      // Could implement additional actions like:
      // - Send alerts
      // - Update user reputation
      // - Temporary IP blocking
   }

   // Administrative methods
   async getRateLimitStatus(key) {
      const record = await this.store.get(key);
      if (!record) return null;

      return {
         key,
         current: record.value,
         resetTime: new Date(record.expiresAt),
         remaining: Math.max(0, 100 - record.value), // Assuming default limit of 100
      };
   }

   async resetRateLimit(key) {
      await this.store.reset(key);
   }

   async getAllRateLimits() {
      const limits = {};
      for (const [key, data] of this.store.store.entries()) {
         limits[key] = {
            current: data.value,
            resetTime: new Date(data.expiresAt),
            expiresIn: Math.ceil((data.expiresAt - Date.now()) / 1000),
         };
      }
      return limits;
   }

   // Cleanup method
   destroy() {
      if (this.store.destroy) {
         this.store.destroy();
      }
   }
}

const rateLimitMiddleware = new RateLimitMiddleware();

export default rateLimitMiddleware;

// Export individual middleware functions
export const createLimiter = rateLimitMiddleware.createLimiter.bind(rateLimitMiddleware);
export const strictLimiter = rateLimitMiddleware.strictLimiter;
export const normalLimiter = rateLimitMiddleware.normalLimiter;
export const lenientLimiter = rateLimitMiddleware.lenientLimiter;
export const apiLimiter = rateLimitMiddleware.apiLimiter;
export const authLimiter = rateLimitMiddleware.authLimiter;
export const fileUploadLimiter = rateLimitMiddleware.fileUploadLimiter;
export const userLimiter = rateLimitMiddleware.userLimiter.bind(rateLimitMiddleware);
export const organizationLimiter = rateLimitMiddleware.organizationLimiter.bind(rateLimitMiddleware);
export const apiKeyLimiter = rateLimitMiddleware.apiKeyLimiter.bind(rateLimitMiddleware);
export const endpointLimiter = rateLimitMiddleware.endpointLimiter.bind(rateLimitMiddleware);
export const ipLimiter = rateLimitMiddleware.ipLimiter.bind(rateLimitMiddleware);
export const burstLimiter = rateLimitMiddleware.burstLimiter.bind(rateLimitMiddleware);
export const dynamicLimiter = rateLimitMiddleware.dynamicLimiter.bind(rateLimitMiddleware);
export const timeBasedLimiter = rateLimitMiddleware.timeBasedLimiter.bind(rateLimitMiddleware);
