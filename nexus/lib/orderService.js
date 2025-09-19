// lib/orderService.js
import { dbConnect } from "./dbConnect";
import { Order, Product, InventoryItem } from "../models/index";
import { inventoryService } from "./inventoryService";

/**
 * Service for order management operations
 */
export const orderService = {
   /**
    * Get all orders with optional pagination and filtering
    * @param {Object} options - Query options
    * @param {Number} options.page - Page number (starts at 1)
    * @param {Number} options.limit - Number of orders per page
    * @param {Object} options.filter - Filter criteria
    * @returns {Promise<Object>} - Orders and pagination metadata
    */
   async getOrders({ page = 1, limit = 10, filter = {} } = {}) {
      await dbConnect();

      const skip = (page - 1) * limit;
      const countPromise = Order.countDocuments(filter);
      const ordersPromise = Order.find(filter)
         .populate("customer", "name email")
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit);

      const [total, orders] = await Promise.all([countPromise, ordersPromise]);

      return {
         orders,
         pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
         },
      };
   },

   /**
    * Get an order by ID
    * @param {String} id - Order ID
    * @returns {Promise<Object>} - Order document
    */
   async getOrderById(id) {
      await dbConnect();
      return Order.findById(id).populate("customer", "name email phone address").populate({
         path: "items.product",
         select: "name sku price",
      });
   },

   /**
    * Create a new order
    * @param {Object} orderData - Order data
    * @returns {Promise<Object>} - Created order
    */
   async createOrder(orderData) {
      await dbConnect();

      // Validate items and check inventory
      const { items } = orderData;
      if (!items || !items.length) {
         throw new Error("Order must contain at least one item");
      }

      // Verify all products exist and have sufficient inventory
      const productIds = items.map((item) => item.product);
      const products = await Product.find({ _id: { $in: productIds } });

      // Create a map for quick lookup
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      // Check if all products exist and calculate total
      let subtotal = 0;

      for (const item of items) {
         const productId = item.product.toString();
         const product = productMap.get(productId);

         if (!product) {
            throw new Error(`Product not found: ${productId}`);
         }

         // Check inventory availability
         const inventoryItems = await InventoryItem.find({ product: productId });
         const totalAvailable = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);

         if (totalAvailable < item.quantity) {
            throw new Error(`Insufficient inventory for product: ${product.name}`);
         }

         // Calculate line total
         const lineTotal = product.price * item.quantity;
         item.price = product.price;
         item.total = lineTotal;
         subtotal += lineTotal;
      }

      // Calculate order totals
      const tax = subtotal * (orderData.taxRate || 0);
      const shipping = orderData.shippingCost || 0;
      const total = subtotal + tax + shipping;

      // Create order with calculated values
      const orderToCreate = {
         ...orderData,
         subtotal,
         tax,
         shipping,
         total,
         status: orderData.status || "pending",
      };

      const order = new Order(orderToCreate);
      await order.save();

      // Update inventory quantities
      await this._updateInventoryForOrder(order);

      return Order.findById(order._id).populate("customer", "name email").populate({
         path: "items.product",
         select: "name sku price",
      });
   },

   /**
    * Update an order
    * @param {String} id - Order ID
    * @param {Object} orderData - Updated order data
    * @returns {Promise<Object>} - Updated order
    */
   async updateOrder(id, orderData) {
      await dbConnect();

      const order = await Order.findById(id);
      if (!order) {
         throw new Error("Order not found");
      }

      // If changing items, we need to recalculate totals
      if (orderData.items) {
         // TODO: Implement logic to handle inventory adjustments for changed items
         // This is complex and would need to compare old vs new items
         throw new Error("Changing order items not yet implemented");
      }

      // Handle status changes
      if (orderData.status && orderData.status !== order.status) {
         // Record status change history
         if (!order.statusHistory) {
            order.statusHistory = [];
         }

         order.statusHistory.push({
            from: order.status,
            to: orderData.status,
            date: new Date(),
            note: orderData.statusNote || "Status updated",
         });

         // If fulfilling the order now, adjust inventory
         if (orderData.status === "fulfilled" && order.status !== "fulfilled") {
            // Inventory already adjusted when order created
            // This is just to record fulfillment
         }

         // If cancelling an order, restore inventory
         if (orderData.status === "cancelled" && order.status !== "cancelled" && order.status !== "returned") {
            await this._restoreInventoryForOrder(order);
         }
      }

      const updatedOrder = await Order.findByIdAndUpdate(id, { $set: orderData }, { new: true })
         .populate("customer", "name email")
         .populate({
            path: "items.product",
            select: "name sku price",
         });

      return updatedOrder;
   },

   /**
    * Delete an order (only allowed for pending orders)
    * @param {String} id - Order ID
    * @returns {Promise<Boolean>} - Success status
    */
   async deleteOrder(id) {
      await dbConnect();

      const order = await Order.findById(id);
      if (!order) {
         return false;
      }

      // Only allow deletion of pending orders
      if (order.status !== "pending") {
         throw new Error("Only pending orders can be deleted");
      }

      // Restore inventory
      await this._restoreInventoryForOrder(order);

      const result = await Order.findByIdAndDelete(id);
      return !!result;
   },

   /**
    * Get orders by customer
    * @param {String} customerId - Customer ID
    * @param {Object} options - Query options
    * @returns {Promise<Object>} - Orders and pagination metadata
    */
   async getCustomerOrders(customerId, { page = 1, limit = 10 } = {}) {
      return this.getOrders({
         page,
         limit,
         filter: { customer: customerId },
      });
   },

   /**
    * Get order statistics
    * @param {Object} timeframe - Time range for stats
    * @returns {Promise<Object>} - Order statistics
    */
   async getOrderStats(timeframe = {}) {
      await dbConnect();

      // Build the date filter
      const dateFilter = {};
      if (timeframe.start) {
         dateFilter.$gte = new Date(timeframe.start);
      }
      if (timeframe.end) {
         dateFilter.$lte = new Date(timeframe.end);
      }

      const filter = {};
      if (Object.keys(dateFilter).length > 0) {
         filter.createdAt = dateFilter;
      }

      // Aggregation pipeline for order stats
      const stats = await Order.aggregate([
         { $match: filter },
         {
            $group: {
               _id: "$status",
               count: { $sum: 1 },
               total: { $sum: "$total" },
            },
         },
      ]);

      // Process results into a more useful format
      const result = {
         totalOrders: 0,
         totalRevenue: 0,
         byStatus: {},
      };

      stats.forEach((stat) => {
         result.totalOrders += stat.count;
         result.totalRevenue += stat.total;
         result.byStatus[stat._id] = {
            count: stat.count,
            total: stat.total,
         };
      });

      return result;
   },

   /**
    * Update inventory quantities based on order items
    * @private
    * @param {Object} order - Order document
    * @returns {Promise<void>}
    */
   async _updateInventoryForOrder(order) {
      // For each order item, reduce inventory
      for (const item of order.items) {
         const productId = item.product.toString();
         const quantityNeeded = item.quantity;

         // Get all inventory items for this product, sorted by oldest first
         const inventoryItems = await InventoryItem.find({ product: productId }).sort({ createdAt: 1 });

         let remainingToFulfill = quantityNeeded;

         // Take inventory from each location until fulfilled
         for (const invItem of inventoryItems) {
            if (remainingToFulfill <= 0) break;

            const quantityToTake = Math.min(invItem.quantity, remainingToFulfill);

            if (quantityToTake > 0) {
               await inventoryService.adjustQuantity(invItem._id, -quantityToTake, `Order #${order._id}`);

               remainingToFulfill -= quantityToTake;
            }
         }

         if (remainingToFulfill > 0) {
            // This should never happen as we checked inventory earlier
            console.error(`Failed to fulfill order: insufficient inventory for product ${productId}`);
         }
      }
   },

   /**
    * Restore inventory quantities for cancelled/deleted orders
    * @private
    * @param {Object} order - Order document
    * @returns {Promise<void>}
    */
   async _restoreInventoryForOrder(order) {
      // For each order item, increase inventory (in first available location)
      for (const item of order.items) {
         const productId = item.product.toString();
         const quantityToRestore = item.quantity;

         // Get first inventory item for this product
         const inventoryItem = await InventoryItem.findOne({ product: productId });

         if (inventoryItem) {
            await inventoryService.adjustQuantity(
               inventoryItem._id,
               quantityToRestore,
               `Cancelled Order #${order._id}`
            );
         } else {
            // If no inventory location exists, create one
            const product = await Product.findById(productId);
            if (product) {
               // This would require warehouse ID, so would need additional logic
               console.warn(`No inventory location found for product ${productId} to restore cancelled order`);
            }
         }
      }
   },
};
