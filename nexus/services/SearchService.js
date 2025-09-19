// services/SearchService.js
import { Product, SearchIndex, SearchQuery } from "../models/index.js";

class SearchService {
   // Index a product for search
   async indexProduct(productData) {
      const { productId, searchableFields, tags, categories } = productData;

      // Get product details
      const product = await Product.findById(productId).populate("category variants");
      if (!product) {
         throw new Error("Product not found");
      }

      // Create searchable content
      const searchableContent = this.buildSearchableContent(product, searchableFields);

      // Create or update search index
      let searchIndex = await SearchIndex.findOne({ product: productId });

      if (!searchIndex) {
         searchIndex = new SearchIndex({
            product: productId,
            content: searchableContent,
            tags: tags || [],
            categories: categories || product.category,
            variants: product.variants?.map((v) => v._id) || [],
            metadata: {
               price: product.basePrice,
               inStock: product.variants?.some((v) => v.stockQuantity > 0) || false,
               averageRating: product.averageRating || 0,
            },
         });
      } else {
         searchIndex.content = searchableContent;
         searchIndex.tags = tags || searchIndex.tags;
         searchIndex.categories = categories || searchIndex.categories;
         searchIndex.variants = product.variants?.map((v) => v._id) || [];
         searchIndex.metadata = {
            price: product.basePrice,
            inStock: product.variants?.some((v) => v.stockQuantity > 0) || false,
            averageRating: product.averageRating || 0,
         };
         searchIndex.lastIndexedAt = new Date();
      }

      await searchIndex.save();

      return {
         indexId: searchIndex._id,
         productId,
         indexedAt: searchIndex.lastIndexedAt,
      };
   }

   // Search products
   async searchProducts(query, options = {}) {
      const { filters = {}, sort = "relevance", page = 1, limit = 20, includeFacets = false } = options;

      // Log search query
      const searchQuery = new SearchQuery({
         query,
         filters,
         userId: options.userId,
         sessionId: options.sessionId,
      });
      await searchQuery.save();

      // Build search query
      const searchQueryObj = this.buildSearchQuery(query, filters);

      // Execute search
      const results = await SearchIndex.find(searchQueryObj)
         .populate("product")
         .sort(this.buildSortCriteria(sort))
         .skip((page - 1) * limit)
         .limit(limit);

      // Get total count
      const total = await SearchIndex.countDocuments(searchQueryObj);

      // Build facets if requested
      let facets = null;
      if (includeFacets) {
         facets = await this.buildFacets(query, filters);
      }

      // Update search query with results
      searchQuery.resultCount = results.length;
      searchQuery.completedAt = new Date();
      await searchQuery.save();

      return {
         query,
         results: results.map((result) => ({
            product: result.product,
            score: this.calculateRelevanceScore(result, query),
            highlights: this.generateHighlights(result, query),
         })),
         pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
         },
         facets,
         searchId: searchQuery._id,
      };
   }

   // Get search suggestions
   async suggest(query, options = {}) {
      const { limit = 10, includeCategories = true, includeTags = true } = options;

      if (!query || query.length < 2) {
         return { suggestions: [] };
      }

      const suggestions = [];

      // Product name suggestions
      if (includeCategories) {
         const productSuggestions = await SearchIndex.find({
            content: { $regex: query, $options: "i" },
         })
            .populate("product", "name")
            .limit(limit)
            .sort({ "metadata.averageRating": -1 });

         suggestions.push(
            ...productSuggestions.map((item) => ({
               type: "product",
               text: item.product.name,
               productId: item.product._id,
               category: "Products",
            }))
         );
      }

      // Category suggestions
      if (includeTags) {
         const categorySuggestions = await SearchIndex.distinct("categories", {
            categories: { $regex: query, $options: "i" },
         });

         for (const category of categorySuggestions.slice(0, 5)) {
            suggestions.push({
               type: "category",
               text: category,
               category: "Categories",
            });
         }
      }

      // Tag suggestions
      const tagSuggestions = await SearchIndex.distinct("tags", {
         tags: { $regex: query, $options: "i" },
      });

      for (const tag of tagSuggestions.slice(0, 5)) {
         suggestions.push({
            type: "tag",
            text: tag,
            category: "Tags",
         });
      }

      return {
         query,
         suggestions: suggestions.slice(0, limit),
      };
   }

   // Faceted search
   async facetedSearch(query, facets, options = {}) {
      const { page = 1, limit = 20 } = options;

      // Build base query
      const baseQuery = this.buildSearchQuery(query, {});

      // Apply facet filters
      const facetQuery = this.applyFacetFilters(baseQuery, facets);

      // Execute search
      const results = await SearchIndex.find(facetQuery)
         .populate("product")
         .sort({ "metadata.averageRating": -1 })
         .skip((page - 1) * limit)
         .limit(limit);

      // Get facet counts
      const facetCounts = await this.buildFacets(query, facets);

      return {
         query,
         facets: facetCounts,
         results: results.map((result) => ({
            product: result.product,
            score: this.calculateRelevanceScore(result, query),
         })),
         pagination: {
            page,
            limit,
            total: results.length,
         },
      };
   }

   // Build searchable content from product
   buildSearchableContent(product, additionalFields = []) {
      const content = [product.name, product.description, product.sku, product.barcode];

      // Add category names
      if (product.category && Array.isArray(product.category)) {
         content.push(...product.category.map((cat) => cat.name));
      }

      // Add variant information
      if (product.variants) {
         for (const variant of product.variants) {
            content.push(variant.name, variant.sku);
            if (variant.attributes) {
               content.push(...Object.values(variant.attributes));
            }
         }
      }

      // Add additional searchable fields
      content.push(...additionalFields);

      return content.join(" ").toLowerCase();
   }

   // Build search query
   buildSearchQuery(query, filters) {
      const searchQuery = {};

      // Text search
      if (query) {
         searchQuery.$or = [{ content: { $regex: query, $options: "i" } }, { tags: { $in: [new RegExp(query, "i")] } }];
      }

      // Apply filters
      if (filters.category) {
         searchQuery.categories = { $in: [filters.category] };
      }

      if (filters.tags && filters.tags.length > 0) {
         searchQuery.tags = { $in: filters.tags };
      }

      if (filters.priceRange) {
         searchQuery["metadata.price"] = {
            $gte: filters.priceRange.min || 0,
            $lte: filters.priceRange.max || Number.MAX_VALUE,
         };
      }

      if (filters.inStock !== undefined) {
         searchQuery["metadata.inStock"] = filters.inStock;
      }

      if (filters.rating) {
         searchQuery["metadata.averageRating"] = { $gte: filters.rating };
      }

      return searchQuery;
   }

   // Build sort criteria
   buildSortCriteria(sort) {
      switch (sort) {
         case "price_asc":
            return { "metadata.price": 1 };
         case "price_desc":
            return { "metadata.price": -1 };
         case "rating":
            return { "metadata.averageRating": -1 };
         case "newest":
            return { createdAt: -1 };
         case "relevance":
         default:
            return { "metadata.averageRating": -1, createdAt: -1 };
      }
   }

   // Calculate relevance score
   calculateRelevanceScore(searchIndex, query) {
      if (!query) return 0;

      const queryLower = query.toLowerCase();
      const content = searchIndex.content || "";

      // Simple scoring based on matches
      let score = 0;

      // Exact matches get higher score
      if (content.includes(queryLower)) {
         score += 10;
      }

      // Word matches
      const queryWords = queryLower.split(" ");
      for (const word of queryWords) {
         if (content.includes(word)) {
            score += 5;
         }
      }

      // Boost for in-stock items
      if (searchIndex.metadata?.inStock) {
         score += 2;
      }

      // Boost for higher ratings
      if (searchIndex.metadata?.averageRating) {
         score += searchIndex.metadata.averageRating;
      }

      return score;
   }

   // Generate highlights for search results
   generateHighlights(searchIndex, query) {
      if (!query) return [];

      const highlights = [];
      const content = searchIndex.content || "";
      const queryWords = query.toLowerCase().split(" ");

      for (const word of queryWords) {
         const index = content.indexOf(word);
         if (index !== -1) {
            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + word.length + 50);
            highlights.push({
               field: "content",
               snippet: content.substring(start, end),
               highlighted: word,
            });
         }
      }

      return highlights;
   }

   // Build facets
   async buildFacets(query, filters) {
      const baseQuery = this.buildSearchQuery(query, {});

      const facets = {
         categories: {},
         tags: {},
         priceRanges: {},
         inStock: { true: 0, false: 0 },
      };

      // Category facets
      const categoryFacets = await SearchIndex.aggregate([
         { $match: baseQuery },
         { $unwind: "$categories" },
         { $group: { _id: "$categories", count: { $sum: 1 } } },
      ]);

      categoryFacets.forEach((facet) => {
         facets.categories[facet._id] = facet.count;
      });

      // Tag facets
      const tagFacets = await SearchIndex.aggregate([
         { $match: baseQuery },
         { $unwind: "$tags" },
         { $group: { _id: "$tags", count: { $sum: 1 } } },
      ]);

      tagFacets.forEach((facet) => {
         facets.tags[facet._id] = facet.count;
      });

      // Price range facets
      const priceRanges = [
         { min: 0, max: 50, label: "$0 - $50" },
         { min: 50, max: 100, label: "$50 - $100" },
         { min: 100, max: 500, label: "$100 - $500" },
         { min: 500, max: Number.MAX_VALUE, label: "$500+" },
      ];

      for (const range of priceRanges) {
         const count = await SearchIndex.countDocuments({
            ...baseQuery,
            "metadata.price": { $gte: range.min, $lt: range.max },
         });
         facets.priceRanges[range.label] = count;
      }

      // In stock facets
      facets.inStock.true = await SearchIndex.countDocuments({
         ...baseQuery,
         "metadata.inStock": true,
      });

      facets.inStock.false = await SearchIndex.countDocuments({
         ...baseQuery,
         "metadata.inStock": false,
      });

      return facets;
   }

   // Apply facet filters
   applyFacetFilters(baseQuery, facets) {
      const query = { ...baseQuery };

      if (facets.categories && facets.categories.length > 0) {
         query.categories = { $in: facets.categories };
      }

      if (facets.tags && facets.tags.length > 0) {
         query.tags = { $in: facets.tags };
      }

      if (facets.priceRange) {
         query["metadata.price"] = {
            $gte: facets.priceRange.min || 0,
            $lte: facets.priceRange.max || Number.MAX_VALUE,
         };
      }

      if (facets.inStock !== undefined) {
         query["metadata.inStock"] = facets.inStock;
      }

      return query;
   }
}

const searchService = new SearchService();
export default searchService;
