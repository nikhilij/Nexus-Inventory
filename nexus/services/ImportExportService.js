// services/ImportExportService.js
import { Product, Category, Supplier, ImportJob, ExportJob } from "../models/index.js";
import * as ProductService from "./ProductService.js";
import * as MediaService from "./MediaService.js";
import * as NotificationService from "./NotificationService.js";

class ImportExportService {
   // Import data from CSV
   async importCSV(file, options = {}) {
      const { type, userId, validateOnly = false } = options;

      // Parse CSV content
      const csvData = await this.parseCSV(file);

      // Validate schema
      const validation = await this.validateSchema(csvData, type);
      if (!validation.valid) {
         throw new Error(`Schema validation failed: ${validation.errors.join(", ")}`);
      }

      if (validateOnly) {
         return { valid: true, rowCount: csvData.length, validation };
      }

      // Create import job
      const importJob = new ImportJob({
         type,
         filename: file.originalname,
         totalRows: csvData.length,
         status: "processing",
         createdBy: userId,
      });

      await importJob.save();

      // Process import asynchronously
      setImmediate(() => this.processImport(importJob._id, csvData, type));

      return {
         jobId: importJob._id,
         status: "processing",
         totalRows: csvData.length,
      };
   }

   // Import images
   async importImages(images, options = {}) {
      const { productId, userId } = options;

      const results = { successful: [], failed: [] };

      for (const image of images) {
         try {
            // Upload image
            const uploadResult = await MediaService.upload(image, {
               userId,
               folder: "product-images",
               tags: ["product", productId],
            });

            // Associate with product if specified
            if (productId) {
               const product = await Product.findById(productId);
               if (product) {
                  product.images = product.images || [];
                  product.images.push(uploadResult.mediaId);
                  await product.save();
               }
            }

            results.successful.push({
               filename: image.originalname,
               mediaId: uploadResult.mediaId,
               url: uploadResult.url,
            });
         } catch (error) {
            results.failed.push({
               filename: image.originalname,
               error: error.message,
            });
         }
      }

      return {
         total: images.length,
         successful: results.successful.length,
         failed: results.failed.length,
         results,
      };
   }

   // Validate data schema
   async validateSchema(data, type) {
      const errors = [];
      const schema = this.getSchemaForType(type);

      for (let i = 0; i < data.length; i++) {
         const row = data[i];
         const rowErrors = this.validateRow(row, schema);

         if (rowErrors.length > 0) {
            errors.push(`Row ${i + 1}: ${rowErrors.join(", ")}`);
         }
      }

      return {
         valid: errors.length === 0,
         errors,
         totalRows: data.length,
         validRows: data.length - errors.length,
      };
   }

   // Export data
   async exportData(filters) {
      const { type, format = "csv", userId } = filters;

      // Create export job
      const exportJob = new ExportJob({
         type,
         format,
         filters,
         status: "processing",
         createdBy: userId,
      });

      await exportJob.save();

      // Process export asynchronously
      setImmediate(() => this.processExport(exportJob._id, filters));

      return {
         jobId: exportJob._id,
         status: "processing",
         type,
         format,
      };
   }

   // Process import job
   async processImport(jobId, data, type) {
      const job = await ImportJob.findById(jobId);
      if (!job) return;

      let processed = 0;
      let successful = 0;
      let failed = 0;
      const errors = [];

      try {
         for (const row of data) {
            try {
               await this.importRow(row, type);
               successful++;
            } catch (error) {
               failed++;
               errors.push(`Row ${processed + 1}: ${error.message}`);
            }

            processed++;

            // Update progress
            job.processedRows = processed;
            job.successfulRows = successful;
            job.failedRows = failed;
            await job.save();
         }

         job.status = "completed";
         job.completedAt = new Date();
      } catch (error) {
         job.status = "failed";
         job.error = error.message;
      }

      await job.save();

      // Send notification
      await NotificationService.sendEmail(
         "user@example.com", // In real implementation, get from user
         "Import Job Completed",
         `Your ${type} import job has completed. Successful: ${successful}, Failed: ${failed}`
      );
   }

   // Process export job
   async processExport(jobId, filters) {
      const job = await ExportJob.findById(jobId);
      if (!job) return;

      try {
         // Get data based on type
         const data = await this.getExportData(filters);

         // Format data
         let formattedData;
         if (filters.format === "csv") {
            formattedData = this.convertToCSV(data);
         } else if (filters.format === "json") {
            formattedData = JSON.stringify(data, null, 2);
         }

         // Save export result
         job.status = "completed";
         job.fileSize = Buffer.byteLength(formattedData, "utf8");
         job.downloadUrl = await this.saveExportFile(formattedData, filters);
         job.completedAt = new Date();
      } catch (error) {
         job.status = "failed";
         job.error = error.message;
      }

      await job.save();

      // Send notification
      await NotificationService.sendEmail(
         "user@example.com",
         "Export Job Completed",
         `Your ${filters.type} export job has completed.`
      );
   }

   // Import single row
   async importRow(row, type) {
      switch (type) {
         case "products":
            await ProductService.createProduct(row);
            break;
         case "categories":
            await this.importCategory(row);
            break;
         case "suppliers":
            await this.importSupplier(row);
            break;
         default:
            throw new Error(`Unsupported import type: ${type}`);
      }
   }

   // Import category
   async importCategory(row) {
      const category = new Category({
         name: row.name,
         description: row.description,
         parent: row.parentId,
      });

      await category.save();
      return category;
   }

   // Import supplier
   async importSupplier(row) {
      const supplier = new Supplier({
         name: row.name,
         contactInfo: {
            email: row.email,
            phone: row.phone,
         },
         address: {
            street: row.street,
            city: row.city,
            state: row.state,
            zipCode: row.zipCode,
            country: row.country,
         },
      });

      await supplier.save();
      return supplier;
   }

   // Get export data
   async getExportData(filters) {
      const { type, dateRange, status } = filters;

      let query = {};
      if (dateRange) {
         query.createdAt = {
            $gte: new Date(dateRange.start),
            $lte: new Date(dateRange.end),
         };
      }
      if (status) query.status = status;

      switch (type) {
         case "products":
            return await Product.find(query).populate("category variants");
         case "categories":
            return await Category.find(query);
         case "suppliers":
            return await Supplier.find(query);
         default:
            throw new Error(`Unsupported export type: ${type}`);
      }
   }

   // Parse CSV content
   async parseCSV(file) {
      // In a real implementation, use csv-parser library
      // For now, simulate CSV parsing
      const content = file.buffer.toString("utf8");
      const lines = content.split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());

      const data = [];
      for (let i = 1; i < lines.length; i++) {
         if (!lines[i].trim()) continue;

         const values = lines[i].split(",");
         const row = {};

         headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || "";
         });

         data.push(row);
      }

      return data;
   }

   // Get schema for type
   getSchemaForType(type) {
      const schemas = {
         products: {
            name: { required: true, type: "string" },
            sku: { required: true, type: "string" },
            description: { required: false, type: "string" },
            price: { required: true, type: "number" },
            category: { required: false, type: "string" },
         },
         categories: {
            name: { required: true, type: "string" },
            description: { required: false, type: "string" },
            parentId: { required: false, type: "string" },
         },
         suppliers: {
            name: { required: true, type: "string" },
            email: { required: true, type: "email" },
            phone: { required: false, type: "string" },
         },
      };

      return schemas[type] || {};
   }

   // Validate single row
   validateRow(row, schema) {
      const errors = [];

      for (const [field, rules] of Object.entries(schema)) {
         const value = row[field];

         if (rules.required && (!value || value === "")) {
            errors.push(`${field} is required`);
         }

         if (value && rules.type === "number" && isNaN(Number(value))) {
            errors.push(`${field} must be a number`);
         }

         if (value && rules.type === "email" && !this.isValidEmail(value)) {
            errors.push(`${field} must be a valid email`);
         }
      }

      return errors;
   }

   // Convert to CSV
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
            // Handle nested objects and arrays
            if (typeof value === "object") {
               return JSON.stringify(value);
            }
            // Escape commas and quotes
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
               return `"${value.replace(/"/g, '""')}"`;
            }
            return value || "";
         });
         csvRows.push(values.join(","));
      }

      return csvRows.join("\n");
   }

   // Save export file to cloud storage
   async saveExportFile(content, filters) {
      const { type, format, userId } = filters;
      const fileName = `${type}_${Date.now()}.${format}`;
      const filePath = `exports/${fileName}`;

      try {
         // Use MediaService for file upload if available
         if (MediaService && MediaService.uploadFile) {
            const uploadResult = await MediaService.uploadFile({
               buffer: Buffer.from(content, "utf8"),
               fileName,
               path: "exports",
               mimeType:
                  format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
               userId,
            });

            return uploadResult.url || uploadResult.publicUrl;
         }

         // Fallback: Use direct cloud storage (AWS S3, Azure Blob, etc.)
         // This would need to be configured with actual cloud credentials
         const cloudStorageUrl = await this.uploadToCloudStorage(content, filePath, format);

         // Create export job record
         const exportJob = new ExportJob({
            fileName,
            filePath,
            fileUrl: cloudStorageUrl,
            format,
            type,
            status: "completed",
            userId,
            filters,
            fileSize: Buffer.byteLength(content, "utf8"),
            createdAt: new Date(),
         });

         await exportJob.save();

         return cloudStorageUrl;
      } catch (error) {
         console.error("Failed to save export file:", error);

         // Create failed export job record
         const exportJob = new ExportJob({
            fileName,
            filePath,
            format,
            type,
            status: "failed",
            userId,
            filters,
            error: error.message,
            createdAt: new Date(),
         });

         await exportJob.save();

         throw new Error(`Failed to save export file: ${error.message}`);
      }
   }

   // Upload to cloud storage (placeholder for actual implementation)
   async uploadToCloudStorage(content, filePath, format) {
      // In a real implementation, this would upload to AWS S3, Azure Blob Storage, etc.
      // For now, return a placeholder URL structure
      const storageBaseUrl = process.env.CLOUD_STORAGE_BASE_URL || "https://storage.nexus-inventory.com";
      return `${storageBaseUrl}/${filePath}`;
   }

   // Validate email
   isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
   }

   // Get import job status
   async getImportJobStatus(jobId) {
      const job = await ImportJob.findById(jobId);
      if (!job) {
         throw new Error("Import job not found");
      }

      return {
         id: job._id,
         type: job.type,
         status: job.status,
         totalRows: job.totalRows,
         processedRows: job.processedRows,
         successfulRows: job.successfulRows,
         failedRows: job.failedRows,
         createdAt: job.createdAt,
         completedAt: job.completedAt,
         error: job.error,
      };
   }

   // Get export job status
   async getExportJobStatus(jobId) {
      const job = await ExportJob.findById(jobId);
      if (!job) {
         throw new Error("Export job not found");
      }

      return {
         id: job._id,
         type: job.type,
         format: job.format,
         status: job.status,
         fileSize: job.fileSize,
         downloadUrl: job.downloadUrl,
         createdAt: job.createdAt,
         completedAt: job.completedAt,
         error: job.error,
      };
   }
}

const importExportService = new ImportExportService();
export default importExportService;
