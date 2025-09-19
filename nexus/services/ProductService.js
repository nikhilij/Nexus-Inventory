// services/ProductService.js
import { Product, ProductVariant, Category } from "../models/index.js";
import * as NotificationService from "./NotificationService.js";

class ProductService {
   // Create a new product
   async createProduct(productData) {
      const { name, description, category, basePrice, sku, barcode } = productData;

      const existingProduct = await Product.findOne({ $or: [{ sku }, { barcode }] });
      if (existingProduct) {
         throw new Error("Product with this SKU or barcode already exists");
      }

      const product = new Product({
         name,
         description,
         category,
         basePrice,
         sku,
         barcode,
      });

      await product.save();
      return product;
   }

   // Update product details
   async updateProduct(productId, updateData) {
      const product = await Product.findByIdAndUpdate(productId, updateData, { new: true });
      if (!product) {
         throw new Error("Product not found");
      }
      return product;
   }

   // Create a product variant
   async createVariant(productId, variantData) {
      const { name, sku, price, attributes, stockQuantity } = variantData;

      const product = await Product.findById(productId);
      if (!product) {
         throw new Error("Product not found");
      }

      const variant = new ProductVariant({
         product: productId,
         name,
         sku,
         price,
         attributes,
         stockQuantity,
      });

      await variant.save();

      // Add variant to product's variants array
      product.variants.push(variant._id);
      await product.save();

      return variant;
   }

   // Bulk import products
   async bulkImportProducts(productsData) {
      const results = { success: [], errors: [] };

      for (const productData of productsData) {
         try {
            const product = await this.createProduct(productData);
            results.success.push(product);
         } catch (error) {
            results.errors.push({ data: productData, error: error.message });
         }
      }

      return results;
   }

   // Enrich product from NLP (Natural Language Processing)
   async enrichFromNLP(productId, nlpData) {
      const product = await Product.findById(productId);
      if (!product) {
         throw new Error("Product not found");
      }

      // Extract information from NLP data
      const { categories, attributes, description } = nlpData;

      // Update product with enriched data
      if (categories && categories.length > 0) {
         const categoryDocs = await Category.find({ name: { $in: categories } });
         product.category = categoryDocs.map((c) => c._id);
      }

      if (attributes) {
         product.attributes = { ...product.attributes, ...attributes };
      }

      if (description) {
         product.description = description;
      }

      await product.save();
      return product;
   }
}

const productService = new ProductService();
export default productService;
