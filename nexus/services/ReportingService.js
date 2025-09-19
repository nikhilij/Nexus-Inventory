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
   async generateSalesReport(dateRange, parameters) {
      // In a real implementation, query sales data from database
      // For now, return mock data
      return {
         summary: {
            totalSales: 125000,
            totalOrders: 1250,
            averageOrderValue: 100,
            period: dateRange,
         },
         data: [
            { date: "2024-01-01", sales: 8500, orders: 85 },
            { date: "2024-01-02", sales: 9200, orders: 92 },
            // ... more data
         ],
         charts: {
            salesTrend: "url_to_chart_image",
            topProducts: "url_to_chart_image",
         },
      };
   }

   // Generate inventory report
   async generateInventoryReport(dateRange, parameters) {
      return {
         summary: {
            totalProducts: 5000,
            lowStockItems: 150,
            outOfStockItems: 25,
            totalValue: 250000,
            period: dateRange,
         },
         data: [
            { product: "Product A", stock: 150, value: 7500, status: "normal" },
            { product: "Product B", stock: 5, value: 250, status: "low" },
            // ... more data
         ],
         alerts: [
            { product: "Product C", message: "Out of stock" },
            { product: "Product D", message: "Low stock alert" },
         ],
      };
   }

   // Generate customer report
   async generateCustomerReport(dateRange, parameters) {
      return {
         summary: {
            totalCustomers: 2500,
            newCustomers: 150,
            activeCustomers: 1800,
            churnRate: 5.2,
            period: dateRange,
         },
         data: [
            { segment: "New", count: 150, percentage: 6 },
            { segment: "Regular", count: 1200, percentage: 48 },
            { segment: "VIP", count: 450, percentage: 18 },
            // ... more data
         ],
         metrics: {
            averageOrderFrequency: 2.3,
            customerLifetimeValue: 450,
            retentionRate: 78.5,
         },
      };
   }

   // Generate financial report
   async generateFinancialReport(dateRange, parameters) {
      return {
         summary: {
            totalRevenue: 125000,
            totalCosts: 75000,
            grossProfit: 50000,
            netProfit: 35000,
            period: dateRange,
         },
         breakdown: {
            revenue: {
               productSales: 100000,
               services: 25000,
            },
            costs: {
               costOfGoods: 45000,
               operatingExpenses: 30000,
            },
         },
         trends: [
            { month: "Jan", revenue: 95000, profit: 28000 },
            { month: "Feb", revenue: 105000, profit: 32000 },
            // ... more data
         ],
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

   // Generate XLSX file (simulated)
   async generateXLSX(data) {
      // In a real implementation, use exceljs or similar library
      // For now, return a mock buffer
      const mockXlsxContent = JSON.stringify({
         worksheets: [
            {
               name: "Report",
               data: data,
            },
         ],
      });

      return Buffer.from(mockXlsxContent, "utf8");
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
