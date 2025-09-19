// app/api/dashboard/search/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { productService } from "@/lib/productService";
import { inventoryService } from "@/lib/inventoryService";
import { orderService } from "@/lib/orderService";
import { userService } from "@/lib/userService";

/**
 * Search across multiple data types in the system
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with search results
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
      const query = url.searchParams.get("q");
      const types = url.searchParams.get("types") || "all"; // all, products, inventory, orders, users
      const limit = parseInt(url.searchParams.get("limit") || "10", 10);

      // Validate query
      if (!query || query.trim().length < 2) {
         return NextResponse.json({ error: "Search query must be at least 2 characters" }, { status: 400 });
      }

      // Parse search types
      const searchTypes = types === "all" ? ["products", "inventory", "orders", "users"] : types.split(",");

      // Prepare response
      const results = {};

      // Check if we should search products
      if (searchTypes.includes("products")) {
         const productResults = await productService.searchProducts(query, limit);
         results.products = productResults;
      }

      // Check if we should search inventory
      if (searchTypes.includes("inventory")) {
         const inventoryResults = await inventoryService.searchInventory(query, limit);

         // Enhance inventory results with product names
         const enhancedInventory = await Promise.all(
            inventoryResults.map(async (item) => {
               const product = await productService.getProductById(item.productId);
               const warehouse = await inventoryService.getWarehouseById(item.warehouseId);

               return {
                  ...item,
                  productName: product ? product.name : "Unknown Product",
                  warehouseName: warehouse ? warehouse.name : "Unknown Warehouse",
               };
            })
         );

         results.inventory = enhancedInventory;
      }

      // Check if we should search orders
      if (searchTypes.includes("orders")) {
         const orderResults = await orderService.searchOrders(query, limit);
         results.orders = orderResults;
      }

      // Check if we should search users (admin only)
      if (searchTypes.includes("users") && isAdmin) {
         const userResults = await userService.searchUsers(query, limit);
         results.users = userResults;
      }

      // Count total results
      const totalResults = Object.values(results).reduce((sum, array) => sum + array.length, 0);

      return NextResponse.json({
         data: results,
         query,
         totalResults,
      });
   } catch (error) {
      console.error("Error searching:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
   }
}
