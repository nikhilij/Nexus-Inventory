// lib/analyticsService.js
import { dbConnect } from "./dbConnect";
import { Order, Product, InventoryItem, User } from "../models/index";

/**
 * Service for analytics and business intelligence
 */
export const analyticsService = {
   /**
    * Get dashboard analytics data
    * @param {Object} options - Analytics options
    * @param {Date} options.startDate - Start date for analytics
    * @param {Date} options.endDate - End date for analytics
    * @returns {Promise<Object>} - Analytics data
    */
   async getDashboardAnalytics({ startDate, endDate } = {}) {
      await dbConnect();

      const dateFilter = {};
      if (startDate || endDate) {
         dateFilter.createdAt = {};
         if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
         if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Get order analytics
      const orderStats = await Order.aggregate([
         { $match: dateFilter },
         {
            $group: {
               _id: null,
               totalOrders: { $sum: 1 },
               totalRevenue: { $sum: "$total" },
               averageOrderValue: { $avg: "$total" },
               totalItems: { $sum: { $size: "$items" } },
            },
         },
      ]);

      // Get product analytics
      const productStats = await Product.aggregate([
         {
            $group: {
               _id: null,
               totalProducts: { $sum: 1 },
               averagePrice: { $avg: "$price" },
               totalCategories: { $addToSet: "$category" },
            },
         },
         {
            $project: {
               totalProducts: 1,
               averagePrice: 1,
               totalCategories: { $size: "$totalCategories" },
            },
         },
      ]);

      // Get inventory analytics
      const inventoryStats = await InventoryItem.aggregate([
         {
            $group: {
               _id: null,
               totalItems: { $sum: 1 },
               totalValue: { $sum: { $multiply: ["$quantity", "$productData.price"] } },
               lowStockItems: {
                  $sum: {
                     $cond: [{ $lt: ["$quantity", "$minimumQuantity"] }, 1, 0],
                  },
               },
            },
         },
         {
            $lookup: {
               from: "products",
               localField: "product",
               foreignField: "_id",
               as: "productData",
            },
         },
         { $unwind: "$productData" },
         {
            $group: {
               _id: null,
               totalItems: { $sum: 1 },
               totalValue: { $sum: { $multiply: ["$quantity", "$productData.price"] } },
               lowStockItems: { $sum: "$lowStockItems" },
            },
         },
      ]);

      // Get user analytics
      const userStats = await User.aggregate([
         {
            $group: {
               _id: null,
               totalUsers: { $sum: 1 },
               activeUsers: {
                  $sum: {
                     $cond: [{ $gte: ["$lastLogin", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }, 1, 0],
                  },
               },
            },
         },
      ]);

      return {
         orders: orderStats[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            totalItems: 0,
         },
         products: productStats[0] || {
            totalProducts: 0,
            averagePrice: 0,
            totalCategories: 0,
         },
         inventory: inventoryStats[0] || {
            totalItems: 0,
            totalValue: 0,
            lowStockItems: 0,
         },
         users: userStats[0] || {
            totalUsers: 0,
            activeUsers: 0,
         },
         generatedAt: new Date(),
      };
   },

   /**
    * Get sales trends over time
    * @param {Object} options - Trend options
    * @param {String} options.period - Period for grouping (day, week, month)
    * @param {Date} options.startDate - Start date
    * @param {Date} options.endDate - End date
    * @returns {Promise<Array>} - Sales trend data
    */
   async getSalesTrends({ period = "month", startDate, endDate } = {}) {
      await dbConnect();

      const dateFilter = {};
      if (startDate || endDate) {
         dateFilter.createdAt = {};
         if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
         if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      const format = period === "day" ? "%Y-%m-%d" : period === "week" ? "%Y-W%V" : "%Y-%m";

      const trends = await Order.aggregate([
         { $match: dateFilter },
         {
            $group: {
               _id: {
                  $dateToString: {
                     format: format,
                     date: "$createdAt",
                  },
               },
               orders: { $sum: 1 },
               revenue: { $sum: "$total" },
               items: { $sum: { $size: "$items" } },
            },
         },
         { $sort: { _id: 1 } },
      ]);

      return trends;
   },

   /**
    * Get top performing products
    * @param {Object} options - Options
    * @param {Number} options.limit - Number of products to return
    * @param {Date} options.startDate - Start date
    * @param {Date} options.endDate - End date
    * @returns {Promise<Array>} - Top products data
    */
   async getTopProducts({ limit = 10, startDate, endDate } = {}) {
      await dbConnect();

      const dateFilter = {};
      if (startDate || endDate) {
         dateFilter.createdAt = {};
         if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
         if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      const topProducts = await Order.aggregate([
         { $match: dateFilter },
         { $unwind: "$items" },
         {
            $lookup: {
               from: "products",
               localField: "items.product",
               foreignField: "_id",
               as: "product",
            },
         },
         { $unwind: "$product" },
         {
            $group: {
               _id: "$product._id",
               name: { $first: "$product.name" },
               sku: { $first: "$product.sku" },
               totalSold: { $sum: "$items.quantity" },
               totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
               orderCount: { $sum: 1 },
            },
         },
         { $sort: { totalRevenue: -1 } },
         { $limit: limit },
      ]);

      return topProducts;
   },

   /**
    * Get inventory turnover analysis
    * @returns {Promise<Object>} - Inventory turnover data
    */
   async getInventoryTurnover() {
      await dbConnect();

      // This would require more complex analysis of sales vs inventory
      // For now, return basic inventory status
      const inventoryStatus = await InventoryItem.aggregate([
         {
            $lookup: {
               from: "products",
               localField: "product",
               foreignField: "_id",
               as: "product",
            },
         },
         { $unwind: "$product" },
         {
            $group: {
               _id: null,
               totalItems: { $sum: 1 },
               inStock: {
                  $sum: {
                     $cond: [{ $gt: ["$quantity", 0] }, 1, 0],
                  },
               },
               lowStock: {
                  $sum: {
                     $cond: [{ $lt: ["$quantity", "$minimumQuantity"] }, 1, 0],
                  },
               },
               outOfStock: {
                  $sum: {
                     $cond: [{ $eq: ["$quantity", 0] }, 1, 0],
                  },
               },
            },
         },
      ]);

      return (
         inventoryStatus[0] || {
            totalItems: 0,
            inStock: 0,
            lowStock: 0,
            outOfStock: 0,
         }
      );
   },
};
