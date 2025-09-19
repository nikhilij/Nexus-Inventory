// app/api/dashboard/stats/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { inventoryService } from "@/lib/inventoryService";
import { productService } from "@/lib/productService";
import { orderService } from "@/lib/orderService";
import { userService } from "@/lib/userService";

/**
 * Get dashboard statistics
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with dashboard statistics
 */
export async function GET(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Get query parameters
      const url = new URL(request.url);
      const period = url.searchParams.get("period") || "month"; // day, week, month, year

      // Prepare response data
      const stats = {
         summary: {},
         inventory: {},
         orders: {},
         users: {},
      };

      // Calculate date range based on period
      const now = new Date();
      let startDate;

      switch (period) {
         case "day":
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
         case "week":
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
         case "year":
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
         case "month":
         default:
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
      }

      // Get summary statistics (available to all authenticated users)
      const inventoryCount = await inventoryService.getInventoryCount();
      const lowStockItems = await inventoryService.getLowStockItems();

      stats.summary = {
         totalProducts: await productService.getProductCount(),
         totalInventory: inventoryCount,
         lowStockItemsCount: lowStockItems.length,
      };

      // Only provide detailed statistics to admins and managers
      if (isAdmin || hasRole(user, "inventory_manager") || hasRole(user, "order_manager")) {
         // Get inventory statistics
         stats.inventory = {
            totalValue: await inventoryService.getTotalInventoryValue(),
            byWarehouse: await inventoryService.getInventoryByWarehouse(),
            lowStockItems: lowStockItems.slice(0, 5), // Top 5 low stock items
            recentActivity: await inventoryService.getRecentInventoryActivity(startDate),
         };

         // Get order statistics
         const ordersByStatus = await orderService.getOrdersByStatus(startDate);
         const recentOrders = await orderService.getRecentOrders(5);

         stats.orders = {
            totalOrders: await orderService.getOrderCount(startDate),
            totalValue: await orderService.getTotalOrderValue(startDate),
            ordersByStatus: ordersByStatus,
            recentOrders: recentOrders,
         };
      }

      // Only provide user statistics to admins
      if (isAdmin) {
         stats.users = {
            totalUsers: await userService.getUserCount(),
            newUsers: await userService.getNewUserCount(startDate),
            activeUsers: await userService.getActiveUserCount(startDate),
         };
      }

      return NextResponse.json({ data: stats });
   } catch (error) {
      console.error("Error getting dashboard statistics:", error);
      return NextResponse.json({ error: "Failed to retrieve dashboard statistics" }, { status: 500 });
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
