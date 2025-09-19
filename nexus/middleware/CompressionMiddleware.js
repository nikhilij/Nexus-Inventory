// middleware/CompressionMiddleware.js
import compression from "compression";

class CompressionMiddleware {
   constructor(options = {}) {
      this.compressionOptions = {
         level: options.level || 6, // Compression level (0-9)
         threshold: options.threshold || "1kb", // Minimum size to compress
         filter: this.shouldCompress,
         ...options,
      };
   }

   // Middleware to apply compression
   compress() {
      return compression(this.compressionOptions);
   }

   // Default filter function to determine if a response should be compressed
   shouldCompress(req, res) {
      if (req.headers["x-no-compression"]) {
         // Don't compress responses with this header
         return false;
      }

      // Fallback to standard filter function
      return compression.filter(req, res);
   }

   // Update compression level dynamically
   setLevel(level) {
      if (level >= 0 && level <= 9) {
         this.compressionOptions.level = level;
      }
   }

   // Update compression threshold dynamically
   setThreshold(threshold) {
      this.compressionOptions.threshold = threshold;
   }
}

const compressionMiddleware = new CompressionMiddleware({
   level: 7,
   threshold: "512b",
   brotli: {
      enabled: true,
      zlib: {},
   },
});

export default compressionMiddleware;

// Export individual middleware function
export const compress = compressionMiddleware.compress.bind(compressionMiddleware);
