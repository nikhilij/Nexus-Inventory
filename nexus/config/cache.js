// Cache namespaces, TTLs, invalidation strategies
export const cacheConfig = {
   namespaces: {
      products: "products:",
      users: "users:",
      orders: "orders:",
   },
   ttl: {
      default: 60 * 5, // 5 minutes
      long: 60 * 60, // 1 hour
   },
};
