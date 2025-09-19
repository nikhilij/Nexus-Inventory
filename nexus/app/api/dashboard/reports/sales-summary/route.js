// app/api/dashboard/reports/sales-summary/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { orderService } from "@/lib/orderService";
import { productService } from "@/lib/productService";

/**
 * Generate sales summary report
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with sales summary data
 */
export async function GET(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admins and order managers to access sales reports
      const canAccessReports = isAdmin || hasRole(user, "order_manager");

      if (!canAccessReports) {
         return NextResponse.json({ error: "You don't have permission to access sales reports" }, { status: 403 });
      }

      // Get query parameters
      const url = new URL(request.url);
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const format = url.searchParams.get("format") || "json"; // json or csv

      // Prepare date filters
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
         const endDateTime = new Date(endDate);
         endDateTime.setHours(23, 59, 59, 999); // End of the day
         dateFilter.$lte = endDateTime;
      }

      // Default to last 30 days if no date range specified
      if (!startDate && !endDate) {
         const thirtyDaysAgo = new Date();
         thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
         dateFilter.$gte = thirtyDaysAgo;
      }

      // Get orders within date range
      const filters = { createdAt: dateFilter, status: { $ne: "Cancelled" } };
      const orders = await orderService.getOrders(filters);

      // Process orders to get sales data
      const salesData = [];
      const productSales = {};
      const dailySales = {};

      // Process each order
      for (const order of orders) {
         // Get order date (just the day, not time)
         const orderDate = new Date(order.createdAt);
         const dateString = orderDate.toISOString().split("T")[0];

         // Initialize daily sales entry if not exists
         if (!dailySales[dateString]) {
            dailySales[dateString] = {
               date: dateString,
               orderCount: 0,
               revenue: 0,
               itemsSold: 0,
            };
         }

         // Update daily sales data
         dailySales[dateString].orderCount++;

         // Process each item in the order
         for (const item of order.items) {
            // Get product details
            const product = await productService.getProductById(item.productId);
            const productName = product ? product.name : "Unknown Product";
            const productSku = product ? product.sku : "N/A";
            const categoryName = product && product.category ? product.category.name : "Uncategorized";

            // Calculate item revenue
            const itemPrice = item.price || (product ? product.price : 0);
            const itemRevenue = itemPrice * item.quantity;

            // Update daily sales revenue and item count
            dailySales[dateString].revenue += itemRevenue;
            dailySales[dateString].itemsSold += item.quantity;

            // Update product sales data
            const productKey = item.productId.toString();
            if (!productSales[productKey]) {
               productSales[productKey] = {
                  productId: item.productId,
                  productName,
                  sku: productSku,
                  category: categoryName,
                  quantity: 0,
                  revenue: 0,
                  orderCount: 0,
               };
            }

            productSales[productKey].quantity += item.quantity;
            productSales[productKey].revenue += itemRevenue;
            productSales[productKey].orderCount++;

            // Add to detailed sales data
            salesData.push({
               orderId: order._id.toString(),
               orderDate: orderDate,
               customerName: order.customerName || "N/A",
               productId: item.productId,
               productName,
               sku: productSku,
               category: categoryName,
               quantity: item.quantity,
               unitPrice: itemPrice,
               totalPrice: itemRevenue,
               status: order.status,
            });
         }
      }

      // Convert daily sales object to array and sort by date
      const dailySalesArray = Object.values(dailySales).sort((a, b) => new Date(a.date) - new Date(b.date));

      // Convert product sales object to array and sort by revenue (highest first)
      const productSalesArray = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

      // Calculate top-selling categories
      const categorySales = {};
      productSalesArray.forEach((product) => {
         if (!categorySales[product.category]) {
            categorySales[product.category] = {
               category: product.category,
               quantity: 0,
               revenue: 0,
               productCount: 0,
            };
         }

         categorySales[product.category].quantity += product.quantity;
         categorySales[product.category].revenue += product.revenue;
         categorySales[product.category].productCount++;
      });

      // Convert category sales to array and sort by revenue
      const categorySalesArray = Object.values(categorySales).sort((a, b) => b.revenue - a.revenue);

      // Calculate summary statistics
      const totalOrders = orders.length;
      const totalRevenue = dailySalesArray.reduce((sum, day) => sum + day.revenue, 0);
      const totalItemsSold = dailySalesArray.reduce((sum, day) => sum + day.itemsSold, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Create the summary report
      const reportData = {
         generatedAt: new Date(),
         dateRange: {
            startDate: dateFilter.$gte,
            endDate: dateFilter.$lte || new Date(),
         },
         summary: {
            totalOrders,
            totalRevenue,
            totalItemsSold,
            averageOrderValue,
            topSellingProducts: productSalesArray.slice(0, 5),
            topCategories: categorySalesArray.slice(0, 5),
         },
         dailySales: dailySalesArray,
         productSales: productSalesArray,
         categorySales: categorySalesArray,
         detailedSales: salesData,
      };

      // Return data in requested format
      if (format === "csv") {
         // Convert to CSV string
         const csvData = convertToCSV(salesData);

         // Set headers for CSV download
         return new NextResponse(csvData, {
            headers: {
               "Content-Type": "text/csv",
               "Content-Disposition": "attachment; filename=sales_summary_report.csv",
            },
         });
      }

      // Return as JSON
      return NextResponse.json({ data: reportData });
   } catch (error) {
      console.error("Error generating sales summary report:", error);
      return NextResponse.json({ error: "Failed to generate sales summary report" }, { status: 500 });
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
               value = value.toISOString().split("T")[0];
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
