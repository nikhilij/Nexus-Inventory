// app/api/dashboard/inventory/[id]/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { inventoryService } from "@/lib/inventoryService";

/**
 * Get a specific inventory item by ID
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Inventory item ID
 * @returns {Promise<NextResponse>} - JSON response with inventory item data
 */
export async function GET(request, { params }) {
   try {
      const { id } = params;

      // Verify authentication
      const { isAuthenticated } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Get the inventory item
      const item = await inventoryService.getInventoryItemById(id);

      if (!item) {
         return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
      }

      return NextResponse.json({ data: item });
   } catch (error) {
      console.error(`Error fetching inventory item ${params.id}:`, error);
      return NextResponse.json({ error: "Failed to fetch inventory item" }, { status: 500 });
   }
}

/**
 * Update a specific inventory item
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Inventory item ID
 * @returns {Promise<NextResponse>} - JSON response with updated inventory item data
 */
export async function PUT(request, { params }) {
   try {
      const { id } = params;

      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users or inventory managers to update inventory items
      if (!isAdmin && !hasRole(user, "inventory_manager")) {
         return NextResponse.json({ error: "You don't have permission to update inventory items" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Update the inventory item
      try {
         const updatedItem = await inventoryService.updateInventoryItem(id, body);

         if (!updatedItem) {
            return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
         }

         return NextResponse.json({ data: updatedItem });
      } catch (updateError) {
         if (updateError.message.includes("not found")) {
            return NextResponse.json({ error: updateError.message }, { status: 400 });
         }

         throw updateError;
      }
   } catch (error) {
      console.error(`Error updating inventory item ${params.id}:`, error);
      return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 });
   }
}

/**
 * Delete a specific inventory item
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Inventory item ID
 * @returns {Promise<NextResponse>} - JSON response confirming deletion
 */
export async function DELETE(request, { params }) {
   try {
      const { id } = params;

      // Verify authentication
      const { isAuthenticated, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users to delete inventory items
      if (!isAdmin) {
         return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }

      // Delete the inventory item
      const success = await inventoryService.deleteInventoryItem(id);

      if (!success) {
         return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Inventory item deleted successfully" }, { status: 200 });
   } catch (error) {
      console.error(`Error deleting inventory item ${params.id}:`, error);
      return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 });
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
