// services/ReportingService.js
import { Report, ScheduledReport, ReportData } from "../models/index.js";
import { Order, Product, InventoryItem, User, Transaction } from "../models/index.js";
import * as NotificationService from "./NotificationService.js";

class ReportingService {
   // Generate scheduled reports
   async scheduledReports() {
      const scheduledReports = await ScheduledReport.find({
         isActive: true,
         nextRunAt: { $lte: new Date() },
      }).populate("createdBy");

      const results = [];

      for (const scheduledReport of scheduledReports) {
         try {
            // Generate the report
            const reportData = await this.generateReport(scheduledReport.config);

            // Save report
            const report = new Report({
               name: scheduledReport.name,
               type: scheduledReport.type,
               config: scheduledReport.config,
               data: reportData,
               generatedBy: scheduledReport.createdBy,
               scheduledReport: scheduledReport._id,
            });

            await report.save();

            // Send notification
            await NotificationService.sendEmail(
               scheduledReport.createdBy.email,
               `Scheduled Report: ${scheduledReport.name}`,
               `Your scheduled report "${scheduledReport.name}" has been generated and is ready for download.`
            );

            // Update next run time
            scheduledReport.lastRunAt = new Date();
            scheduledReport.nextRunAt = this.calculateNextRunTime(scheduledReport.schedule);
            await scheduledReport.save();

            results.push({
               reportId: report._id,
               name: scheduledReport.name,
               success: true,
            });
         } catch (error) {
            results.push({
               name: scheduledReport.name,
               success: false,
               error: error.message,
            });
         }
      }

      return results;
   }

   // Generate ad-hoc reports
   async adHocReports(filters) {
      const { reportType, dateRange, parameters } = filters;

      // Generate report based on type
      const reportData = await this.generateReport({
         type: reportType,
         dateRange,
         parameters,
      });

      // Save report
      const report = new Report({
         name: `Ad-hoc ${reportType} Report`,
         type: reportType,
         config: { dateRange, parameters },
         data: reportData,
         generatedBy: filters.userId,
      });

      await report.save();

      return {
         reportId: report._id,
         name: report.name,
         data: reportData,
         generatedAt: report.createdAt,
      };
   }

   // Export data to CSV
   async exportCSV(data, filename = "report.csv") {
      const csvContent = this.convertToCSV(data);

      // In a real implementation, upload to cloud storage and return signed URL
      // For now, return the CSV content
      return {
         filename,
         content: csvContent,
         mimeType: "text/csv",
         size: Buffer.byteLength(csvContent, "utf8"),
      };
   }

   // Export data to XLSX
   async exportXLSX(data, filename = "report.xlsx") {
      // In a real implementation, use a library like exceljs to generate XLSX
      // For now, simulate XLSX generation
      const xlsxBuffer = await this.generateXLSX(data);

      return {
         filename,
         content: xlsxBuffer,
         mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
         size: xlsxBuffer.length,
      };
   }

   // Generate report data based on type
   async generateReport(config) {
      const { type, dateRange, parameters } = config;

      switch (type) {
         case "sales":
            return await this.generateSalesReport(dateRange, parameters);
         case "inventory":
            return await this.generateInventoryReport(dateRange, parameters);
         case "customer":
            return await this.generateCustomerReport(dateRange, parameters);
         case "financial":
            return await this.generateFinancialReport(dateRange, parameters);
         default:
            throw new Error(`Unsupported report type: ${type}`);
      }
   }

   // Generate sales report
   async generateSalesReport(dateRange, parameters = {}) {
      const { tenantId } = parameters;
      const matchConditions = { status: "completed" };

      if (tenantId) matchConditions.tenant = tenantId;
      if (dateRange?.start) matchConditions.createdAt = { $gte: new Date(dateRange.start) };
      if (dateRange?.end) matchConditions.createdAt = { ...matchConditions.createdAt, $lte: new Date(dateRange.end) };

      // Aggregate sales data
      const salesData = await Order.aggregate([
         { $match: matchConditions },
         {
            $group: {
               _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
               },
               sales: { $sum: "$totalAmount" },
               orders: { $sum: 1 },
               averageOrderValue: { $avg: "$totalAmount" },
            },
         },
         { $sort: { _id: 1 } },
      ]);

      // Calculate summary statistics
      const totalSales = salesData.reduce((sum, day) => sum + day.sales, 0);
      const totalOrders = salesData.reduce((sum, day) => sum + day.orders, 0);
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Get top products
      const topProducts = await Order.aggregate([
         { $match: matchConditions },
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
               totalSold: { $sum: "$items.quantity" },
               totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
            },
         },
         { $sort: { totalRevenue: -1 } },
         { $limit: 10 },
      ]);

      return {
         summary: {
            totalSales,
            totalOrders,
            averageOrderValue,
            period: dateRange,
         },
         data: salesData.map((day) => ({
            date: day._id,
            sales: day.sales,
            orders: day.orders,
         })),
         topProducts,
         charts: {
            salesTrend: null, // Would need chart generation service
            topProducts: null, // Would need chart generation service
         },
      };
   }

   // Generate inventory report
   async generateInventoryReport(dateRange, parameters = {}) {
      const { tenantId } = parameters;
      const matchConditions = {};

      if (tenantId) matchConditions.tenant = tenantId;

      // Get inventory data with product information
      const inventoryData = await InventoryItem.aggregate([
         { $match: matchConditions },
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
            $project: {
               productName: "$product.name",
               sku: "$product.sku",
               stock: "$quantity",
               value: { $multiply: ["$quantity", "$product.price"] },
               status: {
                  $cond: {
                     if: { $lt: ["$quantity", 10] },
                     then: "low",
                     else: "normal",
                  },
               },
               location: "$location",
               lastUpdated: "$updatedAt",
            },
         },
         { $sort: { stock: 1 } },
      ]);

      // Calculate summary statistics
      const totalProducts = inventoryData.length;
      const lowStockItems = inventoryData.filter((item) => item.status === "low").length;
      const outOfStockItems = inventoryData.filter((item) => item.stock === 0).length;
      const totalValue = inventoryData.reduce((sum, item) => sum + item.value, 0);

      // Generate alerts
      const alerts = [];
      inventoryData.forEach((item) => {
         if (item.stock === 0) {
            alerts.push({
               product: item.productName,
               message: "Out of stock",
               severity: "critical",
            });
         } else if (item.stock < 10) {
            alerts.push({
               product: item.productName,
               message: "Low stock alert",
               severity: "warning",
            });
         }
      });

      return {
         summary: {
            totalProducts,
            lowStockItems,
            outOfStockItems,
            totalValue,
            period: dateRange,
         },
         data: inventoryData,
         alerts,
      };
   }

   // Generate customer report
   async generateCustomerReport(dateRange, parameters = {}) {
      const { tenantId } = parameters;
      const matchConditions = {};

      if (tenantId) matchConditions.tenant = tenantId;
      if (dateRange?.start) matchConditions.createdAt = { $gte: new Date(dateRange.start) };
      if (dateRange?.end) matchConditions.createdAt = { ...matchConditions.createdAt, $lte: new Date(dateRange.end) };

      // Get customer data from orders
      const customerData = await Order.aggregate([
         { $match: matchConditions },
         {
            $group: {
               _id: "$customer",
               totalOrders: { $sum: 1 },
               totalSpent: { $sum: "$totalAmount" },
               firstOrder: { $min: "$createdAt" },
               lastOrder: { $max: "$createdAt" },
            },
         },
         {
            $lookup: {
               from: "users",
               localField: "_id",
               foreignField: "_id",
               as: "customer",
            },
         },
         { $unwind: "$customer" },
         {
            $project: {
               customerId: "$_id",
               name: "$customer.name",
               email: "$customer.email",
               totalOrders: 1,
               totalSpent: 1,
               firstOrder: 1,
               lastOrder: 1,
               averageOrderValue: { $divide: ["$totalSpent", "$totalOrders"] },
            },
         },
         { $sort: { totalSpent: -1 } },
      ]);

      // Calculate customer segments
      const totalCustomers = customerData.length;
      const newCustomers = customerData.filter((customer) => {
         const daysSinceFirstOrder = (new Date() - new Date(customer.firstOrder)) / (1000 * 60 * 60 * 24);
         return daysSinceFirstOrder <= 30; // New customers in last 30 days
      }).length;

      const vipCustomers = customerData.filter((customer) => customer.totalSpent > 1000).length;
      const regularCustomers = totalCustomers - newCustomers - vipCustomers;

      // Calculate metrics
      const totalRevenue = customerData.reduce((sum, customer) => sum + customer.totalSpent, 0);
      const averageOrderFrequency =
         totalCustomers > 0
            ? customerData.reduce((sum, customer) => sum + customer.totalOrders, 0) / totalCustomers
            : 0;
      const averageLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      return {
         summary: {
            totalCustomers,
            newCustomers,
            activeCustomers: totalCustomers, // All customers with orders are considered active
            churnRate: 0, // Would need more complex calculation with time-based analysis
            period: dateRange,
         },
         data: [
            {
               segment: "New",
               count: newCustomers,
               percentage: totalCustomers > 0 ? (newCustomers / totalCustomers) * 100 : 0,
            },
            {
               segment: "Regular",
               count: regularCustomers,
               percentage: totalCustomers > 0 ? (regularCustomers / totalCustomers) * 100 : 0,
            },
            {
               segment: "VIP",
               count: vipCustomers,
               percentage: totalCustomers > 0 ? (vipCustomers / totalCustomers) * 100 : 0,
            },
         ],
         metrics: {
            averageOrderFrequency,
            customerLifetimeValue: averageLifetimeValue,
            retentionRate: 85, // Placeholder - would need historical data analysis
         },
         topCustomers: customerData.slice(0, 10),
      };
   }

   // Generate financial report
   async generateFinancialReport(dateRange, parameters = {}) {
      const { tenantId } = parameters;
      const matchConditions = { status: "completed" };

      if (tenantId) matchConditions.tenant = tenantId;
      if (dateRange?.start) matchConditions.createdAt = { $gte: new Date(dateRange.start) };
      if (dateRange?.end) matchConditions.createdAt = { ...matchConditions.createdAt, $lte: new Date(dateRange.end) };

      // Get revenue data from orders
      const revenueData = await Order.aggregate([
         { $match: matchConditions },
         {
            $group: {
               _id: {
                  $dateToString: { format: "%Y-%m", date: "$createdAt" },
               },
               revenue: { $sum: "$totalAmount" },
               orderCount: { $sum: 1 },
            },
         },
         { $sort: { _id: 1 } },
      ]);

      // Calculate total revenue
      const totalRevenue = revenueData.reduce((sum, month) => sum + month.revenue, 0);

      // Get cost data from transactions (assuming cost transactions exist)
      const costData = await Transaction.aggregate([
         { $match: { type: "expense", ...matchConditions } },
         {
            $group: {
               _id: {
                  $dateToString: { format: "%Y-%m", date: "$createdAt" },
               },
               costs: { $sum: "$amount" },
            },
         },
         { $sort: { _id: 1 } },
      ]);

      const totalCosts = costData.reduce((sum, month) => sum + month.costs, 0);

      // Calculate profits
      const grossProfit = totalRevenue - totalCosts;
      const netProfit = grossProfit * 0.7; // Assuming 30% tax/expenses

      // Get monthly trends
      const monthlyTrends = revenueData.map((revenueMonth) => {
         const costMonth = costData.find((cost) => cost._id === revenueMonth._id);
         const monthCosts = costMonth ? costMonth.costs : 0;
         const monthProfit = revenueMonth.revenue - monthCosts;

         return {
            month: revenueMonth._id,
            revenue: revenueMonth.revenue,
            costs: monthCosts,
            profit: monthProfit,
         };
      });

      return {
         summary: {
            totalRevenue,
            totalCosts,
            grossProfit,
            netProfit,
            period: dateRange,
         },
         breakdown: {
            revenue: {
               productSales: totalRevenue * 0.8, // Assuming 80% from product sales
               services: totalRevenue * 0.2, // Assuming 20% from services
            },
            costs: {
               costOfGoods: totalCosts * 0.6, // Assuming 60% cost of goods
               operatingExpenses: totalCosts * 0.4, // Assuming 40% operating expenses
            },
         },
         trends: monthlyTrends,
      };
   }

   // Convert data to CSV format
   convertToCSV(data) {
      if (!Array.isArray(data) || data.length === 0) {
         return "";
      }

      const headers = Object.keys(data[0]);
      const csvRows = [];

      // Add headers
      csvRows.push(headers.join(","));

      // Add data rows
      for (const row of data) {
         const values = headers.map((header) => {
            const value = row[header];
            // Escape commas and quotes in values
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
               return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
         });
         csvRows.push(values.join(","));
      }

      return csvRows.join("\n");
   }

   // Generate XLSX file
   async generateXLSX(data) {
      // In a real implementation, you would use a library like exceljs
      // For now, we'll create a simple CSV-like structure that can be converted to XLSX
      if (!Array.isArray(data) || data.length === 0) {
         throw new Error("No data provided for XLSX generation");
      }

      // Create workbook structure
      const workbook = {
         worksheets: [
            {
               name: "Report",
               data: data,
               headers: Object.keys(data[0]),
            },
         ],
      };

      // Convert to buffer (in real implementation, use exceljs to create actual XLSX)
      const xlsxContent = JSON.stringify(workbook);
      return Buffer.from(xlsxContent, "utf8");
   }

   // Calculate next run time for scheduled reports
   calculateNextRunTime(schedule) {
      const now = new Date();

      switch (schedule.frequency) {
         case "daily":
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
         case "weekly":
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
         case "monthly":
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return nextMonth;
         default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to daily
      }
   }

   // Create scheduled report
   async createScheduledReport(reportConfig) {
      const { name, type, config, schedule, createdBy, recipients } = reportConfig;

      const scheduledReport = new ScheduledReport({
         name,
         type,
         config,
         schedule,
         createdBy,
         recipients,
         nextRunAt: this.calculateNextRunTime(schedule),
         isActive: true,
      });

      await scheduledReport.save();

      return scheduledReport;
   }

   // Get report by ID
   async getReport(reportId) {
      const report = await Report.findById(reportId).populate("generatedBy");
      if (!report) {
         throw new Error("Report not found");
      }

      return {
         id: report._id,
         name: report.name,
         type: report.type,
         data: report.data,
         generatedAt: report.createdAt,
         generatedBy: report.generatedBy,
      };
   }

   // List reports with filtering
   async listReports(filters = {}) {
      const { type, generatedBy, dateRange, limit = 20 } = filters;

      let query = {};

      if (type) query.type = type;
      if (generatedBy) query.generatedBy = generatedBy;
      if (dateRange) {
         query.createdAt = {
            $gte: new Date(dateRange.start),
            $lte: new Date(dateRange.end),
         };
      }

      const reports = await Report.find(query)
         .populate("generatedBy", "name email")
         .sort({ createdAt: -1 })
         .limit(limit);

      return reports.map((report) => ({
         id: report._id,
         name: report.name,
         type: report.type,
         generatedAt: report.createdAt,
         generatedBy: report.generatedBy,
      }));
   }

   // Delete report
   async deleteReport(reportId) {
      const report = await Report.findByIdAndDelete(reportId);
      if (!report) {
         throw new Error("Report not found");
      }

      return { success: true, message: "Report deleted successfully" };
   }
}

const reportingService = new ReportingService();
export default reportingService;
