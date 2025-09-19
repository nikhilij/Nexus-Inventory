// middleware/CacheMiddleware.js
import crypto from "crypto";

// In-memory cache store
class MemoryCacheStore {
   constructor() {
      this.store = new Map();
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
   }

   async get(key) {
      const item = this.store.get(key);
      if (!item) return null;

      if (Date.now() > item.expiresAt) {
         this.store.delete(key);
         return null;
      }

      return item.value;
   }

   async set(key, value, ttlMs) {
      this.store.set(key, {
         value,
         expiresAt: Date.now() + ttlMs,
         createdAt: Date.now(),
      });
   }

   async delete(key) {
      return this.store.delete(key);
   }

   async clear() {
      this.store.clear();
   }

   async has(key) {
      const item = this.store.get(key);
      return item && Date.now() <= item.expiresAt;
   }

   async getStats() {
      const now = Date.now();
      let totalItems = 0;
      let expiredItems = 0;
      let totalSize = 0;

      for (const [key, item] of this.store.entries()) {
         totalItems++;
         if (now > item.expiresAt) {
            expiredItems++;
         }
         totalSize += JSON.stringify(item).length;
      }

      return {
         totalItems,
         expiredItems,
         activeItems: totalItems - expiredItems,
         totalSize,
         hitRate: 0, // Would need to track hits/misses separately
      };
   }

   cleanup() {
      const now = Date.now();
      for (const [key, item] of this.store.entries()) {
         if (now > item.expiresAt) {
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

// Redis-like cache store interface (for future Redis implementation)
class RedisCacheStore {
   constructor(redisClient) {
      this.client = redisClient;
   }

   async get(key) {
      try {
         const value = await this.client.get(key);
         return value ? JSON.parse(value) : null;
      } catch (error) {
         console.error("Redis get error:", error);
         return null;
      }
   }

   async set(key, value, ttlMs) {
      try {
         await this.client.setex(key, Math.ceil(ttlMs / 1000), JSON.stringify(value));
      } catch (error) {
         console.error("Redis set error:", error);
      }
   }

   async delete(key) {
      try {
         await this.client.del(key);
      } catch (error) {
         console.error("Redis delete error:", error);
      }
   }

   async clear() {
      try {
         await this.client.flushdb();
      } catch (error) {
         console.error("Redis clear error:", error);
      }
   }

   async has(key) {
      try {
         return (await this.client.exists(key)) === 1;
      } catch (error) {
         console.error("Redis exists error:", error);
         return false;
      }
   }
}

class CacheMiddleware {
   constructor(options = {}) {
      this.store = options.store || new MemoryCacheStore();
      this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
      this.keyPrefix = options.keyPrefix || "cache:";
      this.compressThreshold = options.compressThreshold || 1024; // Compress responses > 1KB

      // Cache strategies
      this.strategies = {
         lru: new LRUCache(1000),
         lfu: new LFUCache(1000),
         ttl: new TTLBasedCache(),
         adaptive: new AdaptiveCache(),
      };
   }

   // Response caching middleware
   cache(options = {}) {
      const config = {
         ttl: options.ttl || this.defaultTTL,
         keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
         condition: options.condition || (() => true),
         compress: options.compress !== false,
         strategy: options.strategy || "ttl",
         headers: options.headers || ["Cache-Control", "ETag", "Last-Modified"],
         ...options,
      };

      return async (req, res, next) => {
         try {
            // Check if caching should be applied
            if (!config.condition(req)) {
               return next();
            }

            // Generate cache key
            const cacheKey = this.keyPrefix + config.keyGenerator(req);

            // Try to get cached response
            const cachedResponse = await this.store.get(cacheKey);
            if (cachedResponse) {
               // Check if cache is still valid
               if (this.isCacheValid(cachedResponse, req)) {
                  this.sendCachedResponse(res, cachedResponse);
                  this.updateCacheStats("hit", cacheKey);
                  return;
               } else {
                  // Cache expired, remove it
                  await this.store.delete(cacheKey);
               }
            }

            // Cache miss - intercept response
            this.interceptResponse(res, cacheKey, config);
            this.updateCacheStats("miss", cacheKey);

            next();
         } catch (error) {
            console.error("Cache middleware error:", error);
            next(); // Continue without caching on error
         }
      };
   }

   // Cache invalidation middleware
   invalidateCache(patterns = []) {
      return async (req, res, next) => {
         try {
            // Store original response methods
            const originalSend = res.send;
            const originalJson = res.json;
            const originalEnd = res.end;

            // Override response methods to invalidate cache after successful response
            const invalidateAfterResponse = async () => {
               if (res.statusCode >= 200 && res.statusCode < 300) {
                  await this.invalidateByPatterns(patterns, req);
               }
            };

            res.send = function (data) {
               invalidateAfterResponse();
               return originalSend.call(this, data);
            };

            res.json = function (data) {
               invalidateAfterResponse();
               return originalJson.call(this, data);
            };

            res.end = function (data) {
               invalidateAfterResponse();
               return originalEnd.call(this, data);
            };

            next();
         } catch (error) {
            console.error("Cache invalidation error:", error);
            next();
         }
      };
   }

   // Conditional caching based on request headers
   conditionalCache(options = {}) {
      const config = {
         ttl: options.ttl || this.defaultTTL,
         checkETag: options.checkETag !== false,
         checkLastModified: options.checkLastModified !== false,
         ...options,
      };

      return (req, res, next) => {
         // Check If-None-Match header (ETag)
         if (config.checkETag && req.headers["if-none-match"]) {
            const cacheKey = this.keyPrefix + this.defaultKeyGenerator(req);
            // Implementation would check ETag against cached version
         }

         // Check If-Modified-Since header
         if (config.checkLastModified && req.headers["if-modified-since"]) {
            const cacheKey = this.keyPrefix + this.defaultKeyGenerator(req);
            // Implementation would check Last-Modified against cached version
         }

         this.cache(config)(req, res, next);
      };
   }

   // API response caching
   apiCache(options = {}) {
      const config = {
         ttl: options.ttl || 300000, // 5 minutes for API responses
         keyGenerator: (req) => `api:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`,
         condition: (req) => req.method === "GET" && !req.user, // Only cache GET requests for anonymous users
         ...options,
      };

      return this.cache(config);
   }

   // User-specific caching
   userCache(options = {}) {
      const config = {
         ttl: options.ttl || 180000, // 3 minutes for user data
         keyGenerator: (req) => `user:${req.user?._id || "anonymous"}:${req.originalUrl}`,
         condition: (req) => !!req.user,
         ...options,
      };

      return this.cache(config);
   }

   // Database query result caching
   queryCache(options = {}) {
      const config = {
         ttl: options.ttl || 600000, // 10 minutes for query results
         keyGenerator: options.keyGenerator || ((req) => `query:${JSON.stringify(req.query)}`),
         ...options,
      };

      return this.cache(config);
   }

   // Static asset caching
   staticCache(options = {}) {
      const config = {
         ttl: options.ttl || 86400000, // 24 hours for static assets
         keyGenerator: (req) => `static:${req.originalUrl}`,
         headers: ["Cache-Control", "ETag", "Last-Modified", "Content-Type"],
         ...options,
      };

      return this.cache(config);
   }

   // Multi-level caching (memory + persistent)
   multiLevelCache(options = {}) {
      const memoryStore = new MemoryCacheStore();
      const persistentStore = options.persistentStore || this.store;

      return async (req, res, next) => {
         const cacheKey = this.keyPrefix + this.defaultKeyGenerator(req);

         // Try memory cache first
         let cachedResponse = await memoryStore.get(cacheKey);

         if (!cachedResponse) {
            // Try persistent cache
            cachedResponse = await persistentStore.get(cacheKey);

            if (cachedResponse) {
               // Populate memory cache
               await memoryStore.set(cacheKey, cachedResponse, options.memoryTTL || 300000);
            }
         }

         if (cachedResponse) {
            this.sendCachedResponse(res, cachedResponse);
            return;
         }

         // Cache miss - intercept and cache in both levels
         this.interceptResponse(res, cacheKey, {
            ...options,
            store: memoryStore,
            persistentStore,
         });

         next();
      };
   }

   // Cache warming middleware
   cacheWarmer(urls = [], options = {}) {
      return async (req, res, next) => {
         // Warm cache in background
         setImmediate(async () => {
            try {
               for (const url of urls) {
                  const cacheKey = this.keyPrefix + `warm:${url}`;
                  const exists = await this.store.has(cacheKey);

                  if (!exists) {
                     // Simulate request to warm cache
                     // In a real implementation, this would make HTTP requests
                     console.log(`Warming cache for: ${url}`);
                  }
               }
            } catch (error) {
               console.error("Cache warming error:", error);
            }
         });

         next();
      };
   }

   // Cache analytics middleware
   cacheAnalytics(options = {}) {
      return (req, res, next) => {
         const startTime = Date.now();
         const cacheKey = this.keyPrefix + this.defaultKeyGenerator(req);

         // Store original response methods
         const originalSend = res.send;
         const originalJson = res.json;

         res.send = function (data) {
            const duration = Date.now() - startTime;
            this.set("X-Cache-Duration", duration);

            // Log cache analytics
            console.log(`Cache analytics: ${cacheKey}, duration: ${duration}ms`);

            return originalSend.call(this, data);
         };

         res.json = function (data) {
            const duration = Date.now() - startTime;
            this.set("X-Cache-Duration", duration);

            return originalJson.call(this, data);
         };

         next();
      };
   }

   // Helper methods
   defaultKeyGenerator(req) {
      const parts = [
         req.method,
         req.originalUrl,
         req.user?._id || "anonymous",
         crypto.createHash("md5").update(JSON.stringify(req.query)).digest("hex").substring(0, 8),
      ];

      return parts.join(":");
   }

   interceptResponse(res, cacheKey, config) {
      const originalSend = res.send;
      const originalJson = res.json;

      const cacheResponse = (data, isJson = false) => {
         const responseData = {
            data: isJson ? JSON.parse(data) : data,
            headers: { ...res.getHeaders() },
            statusCode: res.statusCode,
            cachedAt: Date.now(),
            ttl: config.ttl,
         };

         // Cache the response
         this.store.set(cacheKey, responseData, config.ttl);

         // Add cache headers
         res.set({
            "X-Cache-Status": "miss",
            "X-Cache-Key": cacheKey,
            "Cache-Control": `public, max-age=${Math.floor(config.ttl / 1000)}`,
         });
      };

      res.send = function (data) {
         cacheResponse(data, false);
         return originalSend.call(this, data);
      };

      res.json = function (data) {
         cacheResponse(JSON.stringify(data), true);
         return originalJson.call(this, data);
      };
   }

   sendCachedResponse(res, cachedResponse) {
      // Restore headers
      Object.entries(cachedResponse.headers).forEach(([key, value]) => {
         res.set(key, value);
      });

      // Add cache headers
      res.set({
         "X-Cache-Status": "hit",
         "X-Cached-At": new Date(cachedResponse.cachedAt).toISOString(),
         Age: Math.floor((Date.now() - cachedResponse.cachedAt) / 1000),
      });

      // Send cached data
      res.status(cachedResponse.statusCode).send(cachedResponse.data);
   }

   isCacheValid(cachedResponse, req) {
      // Check if cache has expired
      if (Date.now() > cachedResponse.cachedAt + cachedResponse.ttl) {
         return false;
      }

      // Check cache control headers
      const cacheControl = req.headers["cache-control"];
      if (cacheControl && cacheControl.includes("no-cache")) {
         return false;
      }

      return true;
   }

   async invalidateByPatterns(patterns, req) {
      for (const pattern of patterns) {
         if (typeof pattern === "string") {
            // Simple string matching
            const keysToDelete = await this.findKeysByPattern(pattern);
            for (const key of keysToDelete) {
               await this.store.delete(key);
            }
         } else if (typeof pattern === "function") {
            // Custom invalidation function
            await pattern(req, this.store);
         }
      }
   }

   async findKeysByPattern(pattern) {
      // In a real implementation, this would query the cache store
      // For memory store, we'd need to iterate through all keys
      const keys = [];

      if (this.store instanceof MemoryCacheStore) {
         for (const key of this.store.store.keys()) {
            if (key.includes(pattern)) {
               keys.push(key);
            }
         }
      }

      return keys;
   }

   updateCacheStats(type, key) {
      // In a real implementation, this would update cache statistics
      // Could track hits, misses, hit rate, etc.
      if (type === "hit") {
         console.log(`Cache hit for key: ${key}`);
      } else {
         console.log(`Cache miss for key: ${key}`);
      }
   }

   // Administrative methods
   async getCacheStats() {
      return await this.store.getStats();
   }

   async clearCache(pattern = null) {
      if (pattern) {
         const keys = await this.findKeysByPattern(pattern);
         for (const key of keys) {
            await this.store.delete(key);
         }
      } else {
         await this.store.clear();
      }
   }

   async getCacheKey(key) {
      return await this.store.get(key);
   }

   async setCacheKey(key, value, ttl = this.defaultTTL) {
      await this.store.set(key, value, ttl);
   }

   async deleteCacheKey(key) {
      await this.store.delete(key);
   }

   // Cache warming for specific endpoints
   async warmCache(urls) {
      // Implementation would make requests to warm the cache
      console.log("Warming cache for URLs:", urls);
   }

   // Cleanup method
   destroy() {
      if (this.store.destroy) {
         this.store.destroy();
      }
   }
}

// Simple LRU Cache implementation
class LRUCache {
   constructor(maxSize) {
      this.maxSize = maxSize;
      this.cache = new Map();
   }

   get(key) {
      if (this.cache.has(key)) {
         const value = this.cache.get(key);
         this.cache.delete(key);
         this.cache.set(key, value);
         return value;
      }
      return null;
   }

   set(key, value) {
      if (this.cache.has(key)) {
         this.cache.delete(key);
      } else if (this.cache.size >= this.maxSize) {
         const firstKey = this.cache.keys().next().value;
         this.cache.delete(firstKey);
      }
      this.cache.set(key, value);
   }
}

// Simple LFU Cache implementation
class LFUCache {
   constructor(maxSize) {
      this.maxSize = maxSize;
      this.cache = new Map();
      this.frequency = new Map();
   }

   get(key) {
      if (this.cache.has(key)) {
         this.frequency.set(key, (this.frequency.get(key) || 0) + 1);
         return this.cache.get(key);
      }
      return null;
   }

   set(key, value) {
      if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
         let minFreq = Infinity;
         let keyToDelete = null;

         for (const [k, freq] of this.frequency) {
            if (freq < minFreq) {
               minFreq = freq;
               keyToDelete = k;
            }
         }

         if (keyToDelete) {
            this.cache.delete(keyToDelete);
            this.frequency.delete(keyToDelete);
         }
      }

      this.cache.set(key, value);
      this.frequency.set(key, 1);
   }
}

// TTL-based Cache
class TTLBasedCache {
   constructor() {
      this.cache = new Map();
   }

   get(key) {
      const item = this.cache.get(key);
      if (item && Date.now() < item.expiresAt) {
         return item.value;
      }
      this.cache.delete(key);
      return null;
   }

   set(key, value, ttl) {
      this.cache.set(key, {
         value,
         expiresAt: Date.now() + ttl,
      });
   }
}

// Adaptive Cache (combines multiple strategies)
class AdaptiveCache {
   constructor() {
      this.lru = new LRUCache(500);
      this.lfu = new LFUCache(500);
      this.ttl = new TTLBasedCache();
   }

   get(key) {
      return this.lru.get(key) || this.lfu.get(key) || this.ttl.get(key);
   }

   set(key, value, ttl) {
      this.lru.set(key, value);
      this.lfu.set(key, value);
      this.ttl.set(key, value, ttl);
   }
}

const cacheMiddleware = new CacheMiddleware();

export default cacheMiddleware;

// Export individual middleware functions
export const cache = cacheMiddleware.cache.bind(cacheMiddleware);
export const invalidateCache = cacheMiddleware.invalidateCache.bind(cacheMiddleware);
export const conditionalCache = cacheMiddleware.conditionalCache.bind(cacheMiddleware);
export const apiCache = cacheMiddleware.apiCache.bind(cacheMiddleware);
export const userCache = cacheMiddleware.userCache.bind(cacheMiddleware);
export const queryCache = cacheMiddleware.queryCache.bind(cacheMiddleware);
export const staticCache = cacheMiddleware.staticCache.bind(cacheMiddleware);
export const multiLevelCache = cacheMiddleware.multiLevelCache.bind(cacheMiddleware);
export const cacheWarmer = cacheMiddleware.cacheWarmer.bind(cacheMiddleware);
export const cacheAnalytics = cacheMiddleware.cacheAnalytics.bind(cacheMiddleware);
