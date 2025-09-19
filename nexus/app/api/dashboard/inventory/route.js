// app/api/dashboard/inventory/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { inventoryService } from "@/lib/inventoryService";

/**
 * Get all inventory items with optional filtering and pagination
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with inventory items and pagination metadata
 */
export async function GET(request) {
   try {
      // Verify authentication
      const { isAuthenticated } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "10", 10);
      const warehouseId = searchParams.get("warehouse");
      const productId = searchParams.get("product");
      const lowStock = searchParams.get("lowStock") === "true";

      // Handle low stock filter separately
      if (lowStock) {
         const lowStockItems = await inventoryService.getLowStockItems();

         return NextResponse.json({
            data: lowStockItems,
            pagination: {
               total: lowStockItems.length,
               page: 1,
               limit: lowStockItems.length,
               pages: 1,
            },
         });
      }

      // Build filter
      const filter = {};

      if (warehouseId) {
         filter.warehouse = warehouseId;
      }

      if (productId) {
         filter.product = productId;
      }

      // Get inventory with pagination
      const { items, pagination } = await inventoryService.getInventory({
         page,
         limit,
         filter,
      });

      return NextResponse.json({
         data: items,
         pagination,
      });
   } catch (error) {
      console.error("Error fetching inventory:", error);
      return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
   }
}

/**
 * Create a new inventory item
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with the created inventory item
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users or inventory managers to create inventory items
      if (!isAdmin && !hasRole(user, "inventory_manager")) {
         return NextResponse.json({ error: "You don't have permission to create inventory items" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Validate required fields
      if (!body.product || !body.warehouse) {
         return NextResponse.json({ error: "Product and warehouse are required" }, { status: 400 });
      }

      // Default quantity to 0 if not provided
      if (body.quantity === undefined) {
         body.quantity = 0;
      }

      // Create the inventory item
      try {
         const item = await inventoryService.createInventoryItem(body);

         return NextResponse.json({ data: item }, { status: 201 });
      } catch (createError) {
         if (createError.message.includes("not found")) {
            return NextResponse.json({ error: createError.message }, { status: 400 });
         }

         throw createError;
      }
   } catch (error) {
      console.error("Error creating inventory item:", error);
      return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
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
