// app/api/dashboard/suppliers/[id]/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { inventoryService } from "@/lib/inventoryService";

/**
 * Get a specific supplier by ID
 * @param {Request} request - The request object
 * @param {Object} params - URL parameters
 * @returns {Promise<NextResponse>} - JSON response with supplier
 */
export async function GET(request, { params }) {
   try {
      // Verify authentication
      const { isAuthenticated } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const id = params.id;

      // Get the supplier
      const supplier = await inventoryService.getSupplierById(id);

      if (!supplier) {
         return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }

      return NextResponse.json({ data: supplier });
   } catch (error) {
      console.error("Error getting supplier:", error);
      return NextResponse.json({ error: "Failed to retrieve supplier" }, { status: 500 });
   }
}

/**
 * Update a supplier
 * @param {Request} request - The request object
 * @param {Object} params - URL parameters
 * @returns {Promise<NextResponse>} - JSON response with updated supplier
 */
export async function PUT(request, { params }) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users to update suppliers
      if (!isAdmin) {
         return NextResponse.json({ error: "You don't have permission to update suppliers" }, { status: 403 });
      }

      const id = params.id;

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Update the supplier
      try {
         const updatedSupplier = await inventoryService.updateSupplier(id, body);

         if (!updatedSupplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
         }

         return NextResponse.json({ data: updatedSupplier });
      } catch (updateError) {
         if (updateError.message.includes("not found")) {
            return NextResponse.json({ error: updateError.message }, { status: 404 });
         }

         if (updateError.message.includes("duplicate")) {
            return NextResponse.json({ error: "A supplier with this name already exists" }, { status: 400 });
         }

         throw updateError;
      }
   } catch (error) {
      console.error("Error updating supplier:", error);
      return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
   }
}

/**
 * Delete a supplier
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

      // Only allow admin users to delete suppliers
      if (!isAdmin) {
         return NextResponse.json({ error: "You don't have permission to delete suppliers" }, { status: 403 });
      }

      const id = params.id;

      // Delete the supplier
      try {
         const result = await inventoryService.deleteSupplier(id);

         if (!result) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
         }

         return NextResponse.json({ success: true, message: "Supplier deleted successfully" });
      } catch (deleteError) {
         if (deleteError.message.includes("not found")) {
            return NextResponse.json({ error: deleteError.message }, { status: 404 });
         }

         if (deleteError.message.includes("in use")) {
            return NextResponse.json({ error: "Cannot delete supplier that is in use by products" }, { status: 400 });
         }

         throw deleteError;
      }
   } catch (error) {
      console.error("Error deleting supplier:", error);
      return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
   }
}
