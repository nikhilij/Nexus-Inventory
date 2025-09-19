// app/api/dashboard/reports/inventory-summary/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { inventoryService } from "@/lib/inventoryService";
import { productService } from "@/lib/productService";

/**
 * Generate inventory summary report
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with inventory summary data
 */
export async function GET(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admins and inventory managers to access inventory reports
      const canAccessReports = isAdmin || hasRole(user, "inventory_manager");

      if (!canAccessReports) {
         return NextResponse.json({ error: "You don't have permission to access inventory reports" }, { status: 403 });
      }

      // Get query parameters
      const url = new URL(request.url);
      const warehouseId = url.searchParams.get("warehouseId");
      const categoryId = url.searchParams.get("categoryId");
      const format = url.searchParams.get("format") || "json"; // json or csv

      // Prepare filters
      const filters = {};
      if (warehouseId) filters.warehouseId = warehouseId;

      // Get product filter if category is specified
      let productIds = [];
      if (categoryId) {
         const products = await productService.getProductsByCategory(categoryId);
         productIds = products.map((product) => product._id.toString());

         if (productIds.length > 0) {
            filters.productId = { $in: productIds };
         }
      }

      // Generate the report
      const inventoryItems = await inventoryService.getInventory(filters);

      // Enhance inventory data with product details
      const enhancedData = await Promise.all(
         inventoryItems.map(async (item) => {
            const product = await productService.getProductById(item.productId);
            const warehouse = await inventoryService.getWarehouseById(item.warehouseId);

            return {
               inventoryId: item._id.toString(),
               productId: item.productId,
               productName: product ? product.name : "Unknown Product",
               sku: product ? product.sku : "N/A",
               category: product && product.category ? product.category.name : "Uncategorized",
               warehouseName: warehouse ? warehouse.name : "Unknown Warehouse",
               warehouseCode: warehouse ? warehouse.code : "N/A",
               quantity: item.quantity,
               minimumStockLevel: item.minimumStockLevel,
               lastUpdated: item.updatedAt,
               status: item.quantity <= item.minimumStockLevel ? "Low Stock" : "In Stock",
               value: (product ? product.price : 0) * item.quantity,
            };
         })
      );

      // Calculate summary statistics
      const totalItems = enhancedData.length;
      const totalQuantity = enhancedData.reduce((sum, item) => sum + item.quantity, 0);
      const totalValue = enhancedData.reduce((sum, item) => sum + item.value, 0);
      const lowStockCount = enhancedData.filter((item) => item.status === "Low Stock").length;

      // Group by warehouse
      const warehouseSummary = {};
      enhancedData.forEach((item) => {
         if (!warehouseSummary[item.warehouseName]) {
            warehouseSummary[item.warehouseName] = {
               totalItems: 0,
               totalQuantity: 0,
               totalValue: 0,
            };
         }

         warehouseSummary[item.warehouseName].totalItems++;
         warehouseSummary[item.warehouseName].totalQuantity += item.quantity;
         warehouseSummary[item.warehouseName].totalValue += item.value;
      });

      // Group by category
      const categorySummary = {};
      enhancedData.forEach((item) => {
         if (!categorySummary[item.category]) {
            categorySummary[item.category] = {
               totalItems: 0,
               totalQuantity: 0,
               totalValue: 0,
            };
         }

         categorySummary[item.category].totalItems++;
         categorySummary[item.category].totalQuantity += item.quantity;
         categorySummary[item.category].totalValue += item.value;
      });

      // Create the summary report
      const reportData = {
         generatedAt: new Date(),
         summary: {
            totalItems,
            totalQuantity,
            totalValue,
            lowStockCount,
            lowStockPercentage: totalItems > 0 ? ((lowStockCount / totalItems) * 100).toFixed(2) : 0,
         },
         warehouseSummary,
         categorySummary,
         items: enhancedData,
      };

      // Return data in requested format
      if (format === "csv") {
         // Convert to CSV string
         const csvData = convertToCSV(enhancedData);

         // Set headers for CSV download
         return new NextResponse(csvData, {
            headers: {
               "Content-Type": "text/csv",
               "Content-Disposition": "attachment; filename=inventory_summary_report.csv",
            },
         });
      }

      // Return as JSON
      return NextResponse.json({ data: reportData });
   } catch (error) {
      console.error("Error generating inventory summary report:", error);
      return NextResponse.json({ error: "Failed to generate inventory summary report" }, { status: 500 });
   }
}

/**
 * Helper function to check if user has a specific role
 * @param {Object} user - User object
 * @param {string} role - Role to check
 * @returns {boolean} - Whether user has the role
 */
function hasRole(user, role) {
   return user && user.roles && user.roles.includes(role);
}

/**
 * Convert JSON data to CSV format
 * @param {Array} data - Array of objects to convert
 * @returns {string} - CSV string
 */
function convertToCSV(data) {
   if (!data || !data.length) {
      return "";
   }

   // Get headers from first object
   const headers = Object.keys(data[0]);

   // Create CSV header row
   let csv = headers.join(",") + "\n";

   // Add data rows
   data.forEach((item) => {
      const row = headers
         .map((header) => {
            // Get value and handle special cases
            let value = item[header];

            // Format dates
            if (value instanceof Date) {
               value = value.toISOString();
            }

            // Format objects and arrays
            if (typeof value === "object" && value !== null) {
               value = JSON.stringify(value);
            }

            // Escape quotes and wrap in quotes if contains comma or quotes
            if (typeof value === "string") {
               if (value.includes('"') || value.includes(",")) {
                  value = '"' + value.replace(/"/g, '""') + '"';
               }
            }

            // Convert undefined or null to empty string
            if (value === undefined || value === null) {
               value = "";
            }

            return value;
         })
         .join(",");

      csv += row + "\n";
   });

   return csv;
}
