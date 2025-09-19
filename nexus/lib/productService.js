// lib/productService.js
import { dbConnect } from "./dbConnect";
import { Product, Category, Supplier } from "../models/index";

/**
 * Service for product management operations
 */
export const productService = {
   /**
    * Get all products with optional pagination and filtering
    * @param {Object} options - Query options
    * @param {Number} options.page - Page number (starts at 1)
    * @param {Number} options.limit - Number of products per page
    * @param {Object} options.filter - Filter criteria
    * @returns {Promise<Object>} - Products and pagination metadata
    */
   async getProducts({ page = 1, limit = 10, filter = {} } = {}) {
      await dbConnect();

      const skip = (page - 1) * limit;
      const countPromise = Product.countDocuments(filter);
      const productsPromise = Product.find(filter)
         .populate("category", "name")
         .populate("supplier", "name")
         .sort({ updatedAt: -1 })
         .skip(skip)
         .limit(limit);

      const [total, products] = await Promise.all([countPromise, productsPromise]);

      return {
         products,
         pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
         },
      };
   },

   /**
    * Get a product by ID
    * @param {String} id - Product ID
    * @returns {Promise<Object>} - Product document
    */
   async getProductById(id) {
      await dbConnect();
      return Product.findById(id)
         .populate("category", "name")
         .populate("supplier", "name contactName contactEmail contactPhone");
   },

   /**
    * Get a product by SKU
    * @param {String} sku - Product SKU
    * @returns {Promise<Object>} - Product document
    */
   async getProductBySku(sku) {
      await dbConnect();
      return Product.findOne({ sku }).populate("category", "name").populate("supplier", "name");
   },

   /**
    * Create a new product
    * @param {Object} productData - Product data
    * @returns {Promise<Object>} - Created product
    */
   async createProduct(productData) {
      await dbConnect();

      // Verify category and supplier exist if provided
      if (productData.category) {
         const category = await Category.findById(productData.category);
         if (!category) {
            throw new Error("Category not found");
         }
      }

      if (productData.supplier) {
         const supplier = await Supplier.findById(productData.supplier);
         if (!supplier) {
            throw new Error("Supplier not found");
         }
      }

      // Ensure SKU is unique
      if (productData.sku) {
         const existingProduct = await Product.findOne({ sku: productData.sku });
         if (existingProduct) {
            throw new Error("A product with this SKU already exists");
         }
      }

      const product = new Product(productData);
      await product.save();

      return Product.findById(product._id).populate("category", "name").populate("supplier", "name");
   },

   /**
    * Update a product
    * @param {String} id - Product ID
    * @param {Object} productData - Updated product data
    * @returns {Promise<Object>} - Updated product
    */
   async updateProduct(id, productData) {
      await dbConnect();

      // Verify category and supplier exist if provided
      if (productData.category) {
         const category = await Category.findById(productData.category);
         if (!category) {
            throw new Error("Category not found");
         }
      }

      if (productData.supplier) {
         const supplier = await Supplier.findById(productData.supplier);
         if (!supplier) {
            throw new Error("Supplier not found");
         }
      }

      // Ensure SKU is unique if changing it
      if (productData.sku) {
         const existingProduct = await Product.findOne({
            sku: productData.sku,
            _id: { $ne: id },
         });

         if (existingProduct) {
            throw new Error("A product with this SKU already exists");
         }
      }

      const updatedProduct = await Product.findByIdAndUpdate(id, { $set: productData }, { new: true })
         .populate("category", "name")
         .populate("supplier", "name");

      return updatedProduct;
   },

   /**
    * Delete a product
    * @param {String} id - Product ID
    * @returns {Promise<Boolean>} - Success status
    */
   async deleteProduct(id) {
      await dbConnect();
      const result = await Product.findByIdAndDelete(id);
      return !!result;
   },

   /**
    * Get all product categories
    * @returns {Promise<Array>} - Array of category documents
    */
   async getCategories() {
      await dbConnect();
      return Category.find().sort({ name: 1 });
   },

   /**
    * Create a new product category
    * @param {Object} categoryData - Category data
    * @returns {Promise<Object>} - Created category
    */
   async createCategory(categoryData) {
      await dbConnect();

      // Check if category with same name already exists
      const existingCategory = await Category.findOne({
         name: categoryData.name,
      });

      if (existingCategory) {
         throw new Error("A category with this name already exists");
      }

      const category = new Category(categoryData);
      await category.save();

      return category;
   },

   /**
    * Update a product category
    * @param {String} id - Category ID
    * @param {Object} categoryData - Updated category data
    * @returns {Promise<Object>} - Updated category
    */
   async updateCategory(id, categoryData) {
      await dbConnect();

      // Check if category with same name already exists
      if (categoryData.name) {
         const existingCategory = await Category.findOne({
            name: categoryData.name,
            _id: { $ne: id },
         });

         if (existingCategory) {
            throw new Error("A category with this name already exists");
         }
      }

      return Category.findByIdAndUpdate(id, { $set: categoryData }, { new: true });
   },

   /**
    * Delete a product category
    * @param {String} id - Category ID
    * @returns {Promise<Boolean>} - Success status
    */
   async deleteCategory(id) {
      await dbConnect();

      // Check if any products are using this category
      const productsWithCategory = await Product.countDocuments({ category: id });

      if (productsWithCategory > 0) {
         throw new Error(`Cannot delete category. It is used by ${productsWithCategory} products.`);
      }

      const result = await Category.findByIdAndDelete(id);
      return !!result;
   },

   /**
    * Search products by name, description, or SKU
    * @param {String} query - Search query
    * @returns {Promise<Array>} - Array of matching product documents
    */
   async searchProducts(query) {
      await dbConnect();

      if (!query || query.trim() === "") {
         return [];
      }

      const searchRegex = new RegExp(query, "i");

      return Product.find({
         $or: [{ name: searchRegex }, { description: searchRegex }, { sku: searchRegex }],
      })
         .populate("category", "name")
         .limit(20);
   },
};
