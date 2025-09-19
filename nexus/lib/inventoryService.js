// lib/inventoryService.js
import { dbConnect } from "./dbConnect";
import { InventoryItem, Product, Warehouse } from "../models/index";

/**
 * Service for inventory management operations
 */
export const inventoryService = {
   /**
    * Get all inventory items with optional pagination and filtering
    * @param {Object} options - Query options
    * @param {Number} options.page - Page number (starts at 1)
    * @param {Number} options.limit - Number of items per page
    * @param {Object} options.filter - Filter criteria
    * @returns {Promise<Object>} - Inventory items and pagination metadata
    */
   async getInventory({ page = 1, limit = 10, filter = {} } = {}) {
      await dbConnect();

      const skip = (page - 1) * limit;
      const countPromise = InventoryItem.countDocuments(filter);
      const itemsPromise = InventoryItem.find(filter)
         .populate("product", "name sku price")
         .populate("warehouse", "name location")
         .sort({ updatedAt: -1 })
         .skip(skip)
         .limit(limit);

      const [total, items] = await Promise.all([countPromise, itemsPromise]);

      return {
         items,
         pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
         },
      };
   },

   /**
    * Get inventory item by ID
    * @param {String} id - Inventory item ID
    * @returns {Promise<Object>} - Inventory item document
    */
   async getInventoryItemById(id) {
      await dbConnect();
      return InventoryItem.findById(id)
         .populate("product", "name sku price description category")
         .populate("warehouse", "name location capacity");
   },

   /**
    * Create a new inventory item
    * @param {Object} itemData - Inventory item data
    * @returns {Promise<Object>} - Created inventory item
    */
   async createInventoryItem(itemData) {
      await dbConnect();

      // Verify product and warehouse exist
      const [product, warehouse] = await Promise.all([
         Product.findById(itemData.product),
         Warehouse.findById(itemData.warehouse),
      ]);

      if (!product || !warehouse) {
         throw new Error("Product or warehouse not found");
      }

      const item = new InventoryItem(itemData);
      await item.save();

      return InventoryItem.findById(item._id)
         .populate("product", "name sku price")
         .populate("warehouse", "name location");
   },

   /**
    * Update an inventory item
    * @param {String} id - Inventory item ID
    * @param {Object} itemData - Updated inventory item data
    * @returns {Promise<Object>} - Updated inventory item
    */
   async updateInventoryItem(id, itemData) {
      await dbConnect();

      // If changing product or warehouse, verify they exist
      if (itemData.product || itemData.warehouse) {
         const checks = [];

         if (itemData.product) {
            checks.push(Product.findById(itemData.product));
         }

         if (itemData.warehouse) {
            checks.push(Warehouse.findById(itemData.warehouse));
         }

         const results = await Promise.all(checks);
         if (results.some((result) => !result)) {
            throw new Error("Product or warehouse not found");
         }
      }

      const updatedItem = await InventoryItem.findByIdAndUpdate(id, { $set: itemData }, { new: true })
         .populate("product", "name sku price")
         .populate("warehouse", "name location");

      return updatedItem;
   },

   /**
    * Delete an inventory item
    * @param {String} id - Inventory item ID
    * @returns {Promise<Boolean>} - Success status
    */
   async deleteInventoryItem(id) {
      await dbConnect();
      const result = await InventoryItem.findByIdAndDelete(id);
      return !!result;
   },

   /**
    * Adjust inventory quantity
    * @param {String} id - Inventory item ID
    * @param {Number} change - Quantity change (positive for increase, negative for decrease)
    * @param {String} reason - Reason for adjustment
    * @returns {Promise<Object>} - Updated inventory item
    */
   async adjustQuantity(id, change, reason) {
      await dbConnect();

      const item = await InventoryItem.findById(id);
      if (!item) {
         throw new Error("Inventory item not found");
      }

      const newQuantity = item.quantity + change;
      if (newQuantity < 0) {
         throw new Error("Insufficient inventory");
      }

      // Record the adjustment in history
      item.history.push({
         date: new Date(),
         change,
         reason,
         previousQuantity: item.quantity,
         newQuantity,
      });

      item.quantity = newQuantity;
      await item.save();

      return InventoryItem.findById(id).populate("product", "name sku price").populate("warehouse", "name location");
   },

   /**
    * Get inventory levels across all warehouses for a specific product
    * @param {String} productId - Product ID
    * @returns {Promise<Array>} - Inventory items for the product
    */
   async getProductInventory(productId) {
      await dbConnect();
      return InventoryItem.find({ product: productId })
         .populate("warehouse", "name location")
         .select("quantity minimumQuantity status lastUpdated");
   },

   /**
    * Get all inventory items in a specific warehouse
    * @param {String} warehouseId - Warehouse ID
    * @param {Object} options - Query options
    * @returns {Promise<Object>} - Inventory items and pagination metadata
    */
   async getWarehouseInventory(warehouseId, { page = 1, limit = 10 } = {}) {
      await dbConnect();

      const skip = (page - 1) * limit;
      const filter = { warehouse: warehouseId };

      const countPromise = InventoryItem.countDocuments(filter);
      const itemsPromise = InventoryItem.find(filter)
         .populate("product", "name sku price")
         .sort({ updatedAt: -1 })
         .skip(skip)
         .limit(limit);

      const [total, items] = await Promise.all([countPromise, itemsPromise]);

      return {
         items,
         pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
         },
      };
   },

   /**
    * Get low stock items (below minimum quantity)
    * @returns {Promise<Array>} - Low stock inventory items
    */
   async getLowStockItems() {
      await dbConnect();

      return InventoryItem.find({
         $expr: { $lt: ["$quantity", "$minimumQuantity"] },
      })
         .populate("product", "name sku price")
         .populate("warehouse", "name location")
         .sort({ quantity: 1 });
   },
};
