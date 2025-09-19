// app/api/dashboard/warehouses/[id]/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { inventoryService } from "@/lib/inventoryService";

/**
 * Get a specific warehouse by ID
 * @param {Request} request - The request object
 * @param {Object} params - URL parameters
 * @returns {Promise<NextResponse>} - JSON response with warehouse
 */
export async function GET(request, { params }) {
   try {
      // Verify authentication
      const { isAuthenticated } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const id = params.id;

      // Get the warehouse
      const warehouse = await inventoryService.getWarehouseById(id);

      if (!warehouse) {
         return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
      }

      return NextResponse.json({ data: warehouse });
   } catch (error) {
      console.error("Error getting warehouse:", error);
      return NextResponse.json({ error: "Failed to retrieve warehouse" }, { status: 500 });
   }
}

/**
 * Update a warehouse
 * @param {Request} request - The request object
 * @param {Object} params - URL parameters
 * @returns {Promise<NextResponse>} - JSON response with updated warehouse
 */
export async function PUT(request, { params }) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users to update warehouses
      if (!isAdmin) {
         return NextResponse.json({ error: "You don't have permission to update warehouses" }, { status: 403 });
      }

      const id = params.id;

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Update the warehouse
      try {
         const updatedWarehouse = await inventoryService.updateWarehouse(id, body);

         if (!updatedWarehouse) {
            return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
         }

         return NextResponse.json({ data: updatedWarehouse });
      } catch (updateError) {
         if (updateError.message.includes("not found")) {
            return NextResponse.json({ error: updateError.message }, { status: 404 });
         }

         if (updateError.message.includes("duplicate")) {
            return NextResponse.json({ error: "A warehouse with this name or code already exists" }, { status: 400 });
         }

         throw updateError;
      }
   } catch (error) {
      console.error("Error updating warehouse:", error);
      return NextResponse.json({ error: "Failed to update warehouse" }, { status: 500 });
   }
}

/**
 * Delete a warehouse
 * @param {Request} request - The request object
 * @param {Object} params - URL parameters
 * @returns {Promise<NextResponse>} - JSON response with success status
 */
export async function DELETE(request, { params }) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users to delete warehouses
      if (!isAdmin) {
         return NextResponse.json({ error: "You don't have permission to delete warehouses" }, { status: 403 });
      }

      const id = params.id;

      // Delete the warehouse
      try {
         const result = await inventoryService.deleteWarehouse(id);

         if (!result) {
            return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
         }

         return NextResponse.json({ success: true, message: "Warehouse deleted successfully" });
      } catch (deleteError) {
         if (deleteError.message.includes("not found")) {
            return NextResponse.json({ error: deleteError.message }, { status: 404 });
         }

         if (deleteError.message.includes("in use")) {
            return NextResponse.json({ error: "Cannot delete warehouse that has inventory items" }, { status: 400 });
         }

         throw deleteError;
      }
   } catch (error) {
      console.error("Error deleting warehouse:", error);
      return NextResponse.json({ error: "Failed to delete warehouse" }, { status: 500 });
   }
}
