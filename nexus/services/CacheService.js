// services/CacheService.js
import { CacheEntry, CacheStats } from "../models/index.js";

class CacheService {
   constructor() {
      this.memoryCache = new Map();
      this.stats = {
         hits: 0,
         misses: 0,
         sets: 0,
         deletes: 0,
      };
   }

   // Get value from cache
   async get(key) {
      // Check memory cache first
      if (this.memoryCache.has(key)) {
         const entry = this.memoryCache.get(key);

         // Check if expired
         if (entry.expiresAt && new Date() > entry.expiresAt) {
            this.memoryCache.delete(key);
            this.stats.misses++;
            return null;
         }

         this.stats.hits++;
         entry.lastAccessed = new Date();
         return entry.value;
      }

      // Check persistent cache (database)
      const cacheEntry = await CacheEntry.findOne({ key });

      if (!cacheEntry) {
         this.stats.misses++;
         return null;
      }

      // Check if expired
      if (cacheEntry.expiresAt && new Date() > cacheEntry.expiresAt) {
         await CacheEntry.deleteOne({ key });
         this.stats.misses++;
         return null;
      }

      // Update memory cache
      this.memoryCache.set(key, {
         value: cacheEntry.value,
         expiresAt: cacheEntry.expiresAt,
         lastAccessed: new Date(),
      });

      this.stats.hits++;
      cacheEntry.lastAccessed = new Date();
      await cacheEntry.save();

      return cacheEntry.value;
   }

   // Set value in cache
   async set(key, value, ttl = 3600) {
      const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : null;

      // Set in memory cache
      this.memoryCache.set(key, {
         value,
         expiresAt,
         lastAccessed: new Date(),
      });

      // Set in persistent cache
      const cacheEntry = await CacheEntry.findOneAndUpdate(
         { key },
         {
            value,
            expiresAt,
            lastAccessed: new Date(),
         },
         { upsert: true, new: true }
      );

      this.stats.sets++;

      return cacheEntry;
   }

   // Invalidate cache entry
   async invalidate(key) {
      // Remove from memory cache
      this.memoryCache.delete(key);

      // Remove from persistent cache
      const result = await CacheEntry.deleteOne({ key });

      if (result.deletedCount > 0) {
         this.stats.deletes++;
      }

      return { success: result.deletedCount > 0 };
   }

   // Cache warmup - preload frequently accessed data
   async cacheWarmup() {
      const warmupData = [
         { key: "categories", ttl: 3600 },
         { key: "popular_products", ttl: 1800 },
         { key: "system_config", ttl: 7200 },
      ];

      const results = [];

      for (const item of warmupData) {
         try {
            // In a real implementation, fetch actual data
            const data = await this.fetchWarmupData(item.key);
            await this.set(item.key, data, item.ttl);
            results.push({ key: item.key, success: true });
         } catch (error) {
            results.push({ key: item.key, success: false, error: error.message });
         }
      }

      return results;
   }

   // Get or set (cache miss handler)
   async getOrSet(key, fetcher, ttl = 3600) {
      let value = await this.get(key);

      if (value === null) {
         value = await fetcher();
         await this.set(key, value, ttl);
      }

      return value;
   }

   // Invalidate by pattern
   async invalidatePattern(pattern) {
      // Remove from memory cache
      for (const [key] of this.memoryCache) {
         if (key.includes(pattern)) {
            this.memoryCache.delete(key);
         }
      }

      // Remove from persistent cache
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      const result = await CacheEntry.deleteMany({ key: regex });

      this.stats.deletes += result.deletedCount;

      return { deleted: result.deletedCount };
   }

   // Clear all cache
   async clearAll() {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear persistent cache
      const result = await CacheEntry.deleteMany({});

      this.stats.deletes += result.deletedCount;

      return { deleted: result.deletedCount };
   }

   // Get cache statistics
   async getStats() {
      const persistentEntries = await CacheEntry.countDocuments();
      const memoryEntries = this.memoryCache.size;

      const stats = {
         memory: {
            entries: memoryEntries,
            ...this.getMemoryStats(),
         },
         persistent: {
            entries: persistentEntries,
         },
         operations: {
            hits: this.stats.hits,
            misses: this.stats.misses,
            sets: this.stats.sets,
            deletes: this.stats.deletes,
            hitRate: (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100,
         },
      };

      return stats;
   }

   // Get memory cache statistics
   getMemoryStats() {
      let totalSize = 0;
      let expiredCount = 0;
      const now = new Date();

      for (const [key, entry] of this.memoryCache) {
         // Estimate size (rough approximation)
         totalSize += JSON.stringify(entry.value).length;

         if (entry.expiresAt && now > entry.expiresAt) {
            expiredCount++;
         }
      }

      return {
         size: totalSize,
         expiredEntries: expiredCount,
      };
   }

   // Set multiple values
   async setMultiple(keyValuePairs, ttl = 3600) {
      const results = [];

      for (const [key, value] of Object.entries(keyValuePairs)) {
         try {
            await this.set(key, value, ttl);
            results.push({ key, success: true });
         } catch (error) {
            results.push({ key, success: false, error: error.message });
         }
      }

      return results;
   }

   // Get multiple values
   async getMultiple(keys) {
      const results = {};

      for (const key of keys) {
         try {
            const value = await this.get(key);
            results[key] = value;
         } catch (error) {
            results[key] = null;
         }
      }

      return results;
   }

   // Check if key exists
   async exists(key) {
      // Check memory cache
      if (this.memoryCache.has(key)) {
         const entry = this.memoryCache.get(key);
         if (!entry.expiresAt || new Date() <= entry.expiresAt) {
            return true;
         }
         this.memoryCache.delete(key);
      }

      // Check persistent cache
      const count = await CacheEntry.countDocuments({
         key,
         $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      });

      return count > 0;
   }

   // Increment numeric value
   async increment(key, amount = 1) {
      const currentValue = (await this.get(key)) || 0;
      const newValue = currentValue + amount;
      await this.set(key, newValue);
      return newValue;
   }

   // Decrement numeric value
   async decrement(key, amount = 1) {
      const currentValue = (await this.get(key)) || 0;
      const newValue = currentValue - amount;
      await this.set(key, newValue);
      return newValue;
   }

   // Set expiration time for existing key
   async expire(key, ttl) {
      const expiresAt = new Date(Date.now() + ttl * 1000);

      // Update memory cache
      if (this.memoryCache.has(key)) {
         const entry = this.memoryCache.get(key);
         entry.expiresAt = expiresAt;
      }

      // Update persistent cache
      const result = await CacheEntry.updateOne({ key }, { expiresAt });

      return { success: result.modifiedCount > 0 };
   }

   // Get time to live for key
   async ttl(key) {
      // Check memory cache
      if (this.memoryCache.has(key)) {
         const entry = this.memoryCache.get(key);
         if (entry.expiresAt) {
            const remaining = Math.floor((entry.expiresAt - new Date()) / 1000);
            return Math.max(0, remaining);
         }
         return -1; // No expiration
      }

      // Check persistent cache
      const cacheEntry = await CacheEntry.findOne({ key });
      if (!cacheEntry) {
         return -2; // Key doesn't exist
      }

      if (!cacheEntry.expiresAt) {
         return -1; // No expiration
      }

      const remaining = Math.floor((cacheEntry.expiresAt - new Date()) / 1000);
      return Math.max(0, remaining);
   }

   // Clean expired entries
   async cleanExpired() {
      const now = new Date();

      // Clean memory cache
      let memoryCleaned = 0;
      for (const [key, entry] of this.memoryCache) {
         if (entry.expiresAt && now > entry.expiresAt) {
            this.memoryCache.delete(key);
            memoryCleaned++;
         }
      }

      // Clean persistent cache
      const result = await CacheEntry.deleteMany({
         expiresAt: { $lt: now },
      });

      return {
         memoryCleaned,
         persistentCleaned: result.deletedCount,
      };
   }

   // Fetch warmup data (simulated)
   async fetchWarmupData(key) {
      // In a real implementation, fetch actual data from database
      switch (key) {
         case "categories":
            return ["Electronics", "Clothing", "Books", "Home & Garden"];
         case "popular_products":
            return [
               { id: 1, name: "iPhone 15", price: 999 },
               { id: 2, name: "MacBook Pro", price: 1999 },
            ];
         case "system_config":
            return {
               version: "1.0.0",
               maintenance: false,
               features: ["inventory", "orders", "reporting"],
            };
         default:
            return null;
      }
   }
}

const cacheService = new CacheService();
export default cacheService;
