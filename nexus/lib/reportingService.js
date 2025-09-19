// lib/reportingService.js
import { dbConnect } from "./dbConnect";
import { Order, Product, InventoryItem, User, Supplier } from "../models/index";

/**
 * Service for generating reports and analytics
 */
export const reportingService = {
   /**
    * Generate sales report
    * @param {Object} options - Report options
    * @param {Date} options.startDate - Start date for the report
    * @param {Date} options.endDate - End date for the report
    * @param {String} options.groupBy - Group by period (day, week, month)
    * @returns {Promise<Object>} - Sales report data
    */
   async generateSalesReport({ startDate, endDate, groupBy = "month" } = {}) {
      await dbConnect();

      const matchStage = {};
      if (startDate || endDate) {
         matchStage.createdAt = {};
         if (startDate) matchStage.createdAt.$gte = new Date(startDate);
         if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      const groupStage = {
         _id: {
            $dateToString: {
               format: groupBy === "day" ? "%Y-%m-%d" : groupBy === "week" ? "%Y-W%V" : "%Y-%m",
               date: "$createdAt",
            },
         },
         totalOrders: { $sum: 1 },
         totalRevenue: { $sum: "$total" },
         totalItems: { $sum: { $size: "$items" } },
      };

      const pipeline = [{ $match: matchStage }, { $group: groupStage }, { $sort: { _id: 1 } }];

      const results = await Order.aggregate(pipeline);

      return {
         period: groupBy,
         data: results,
         summary: {
            totalRevenue: results.reduce((sum, item) => sum + item.totalRevenue, 0),
            totalOrders: results.reduce((sum, item) => sum + item.totalOrders, 0),
            totalItems: results.reduce((sum, item) => sum + item.totalItems, 0),
         },
      };
   },

   /**
    * Generate inventory report
    * @param {Object} options - Report options
    * @param {String} options.warehouseId - Filter by warehouse
    * @param {String} options.categoryId - Filter by category
    * @returns {Promise<Object>} - Inventory report data
    */
   async generateInventoryReport({ warehouseId, categoryId } = {}) {
      await dbConnect();

      const matchStage = {};
      if (warehouseId) matchStage.warehouse = warehouseId;

      const pipeline = [
         { $match: matchStage },
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
            $lookup: {
               from: "warehouses",
               localField: "warehouse",
               foreignField: "_id",
               as: "warehouseData",
            },
         },
         { $unwind: "$warehouseData" },
      ];

      if (categoryId) {
         pipeline.push({
            $match: { "productData.category": categoryId },
         });
      }

      pipeline.push(
         {
            $group: {
               _id: "$warehouseData.name",
               totalItems: { $sum: 1 },
               totalValue: { $sum: { $multiply: ["$quantity", "$productData.price"] } },
               lowStockItems: {
                  $sum: {
                     $cond: [{ $lt: ["$quantity", "$minimumQuantity"] }, 1, 0],
                  },
               },
            },
         },
         { $sort: { totalValue: -1 } }
      );

      const results = await InventoryItem.aggregate(pipeline);

      return {
         data: results,
         summary: {
            totalWarehouses: results.length,
            totalValue: results.reduce((sum, item) => sum + item.totalValue, 0),
            totalLowStock: results.reduce((sum, item) => sum + item.lowStockItems, 0),
         },
      };
   },

   /**
    * Generate product performance report
    * @param {Object} options - Report options
    * @param {Date} options.startDate - Start date for the report
    * @param {Date} options.endDate - End date for the report
    * @returns {Promise<Object>} - Product performance data
    */
   async generateProductPerformanceReport({ startDate, endDate } = {}) {
      await dbConnect();

      const matchStage = {};
      if (startDate || endDate) {
         matchStage.createdAt = {};
         if (startDate) matchStage.createdAt.$gte = new Date(startDate);
         if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      const pipeline = [
         { $match: matchStage },
         { $unwind: "$items" },
         {
            $lookup: {
               from: "products",
               localField: "items.product",
               foreignField: "_id",
               as: "productData",
            },
         },
         { $unwind: "$productData" },
         {
            $group: {
               _id: "$productData._id",
               productName: { $first: "$productData.name" },
               sku: { $first: "$productData.sku" },
               totalSold: { $sum: "$items.quantity" },
               totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
               orderCount: { $sum: 1 },
            },
         },
         { $sort: { totalRevenue: -1 } },
         { $limit: 20 },
      ];

      const results = await Order.aggregate(pipeline);

      return {
         data: results,
         summary: {
            totalProducts: results.length,
            totalRevenue: results.reduce((sum, item) => sum + item.totalRevenue, 0),
            totalSold: results.reduce((sum, item) => sum + item.totalSold, 0),
         },
      };
   },

   /**
    * Get all available reports
    * @returns {Promise<Array>} - List of available reports
    */
   async getAvailableReports() {
      return [
         {
            id: "sales",
            name: "Sales Report",
            description: "Revenue and order statistics over time",
            parameters: ["startDate", "endDate", "groupBy"],
         },
         {
            id: "inventory",
            name: "Inventory Report",
            description: "Stock levels and values by warehouse",
            parameters: ["warehouseId", "categoryId"],
         },
         {
            id: "product-performance",
            name: "Product Performance",
            description: "Top-selling products and their performance",
            parameters: ["startDate", "endDate"],
         },
      ];
   },

   /**
    * Generate a specific report by ID
    * @param {String} reportId - The report ID
    * @param {Object} parameters - Report parameters
    * @returns {Promise<Object>} - Report data
    */
   async generateReport(reportId, parameters = {}) {
      switch (reportId) {
         case "sales":
            return this.generateSalesReport(parameters);
         case "inventory":
            return this.generateInventoryReport(parameters);
         case "product-performance":
            return this.generateProductPerformanceReport(parameters);
         default:
            throw new Error(`Unknown report type: ${reportId}`);
      }
   },
};
