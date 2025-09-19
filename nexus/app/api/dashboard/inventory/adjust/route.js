// app/api/dashboard/inventory/adjust/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { inventoryService } from "@/lib/inventoryService";

/**
 * Adjust inventory quantity
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with updated inventory item
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users or inventory managers to adjust inventory
      if (!isAdmin && !hasRole(user, "inventory_manager")) {
         return NextResponse.json({ error: "You don't have permission to adjust inventory" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Validate required fields
      if (!body.id || body.change === undefined || !body.reason) {
         return NextResponse.json(
            { error: "Inventory item ID, quantity change, and reason are required" },
            { status: 400 }
         );
      }

      // Ensure change is a number
      const change = Number(body.change);
      if (isNaN(change)) {
         return NextResponse.json({ error: "Quantity change must be a number" }, { status: 400 });
      }

      // Add user information to reason if available
      let reason = body.reason;
      if (user) {
         reason = `${reason} (by ${user.name || user.email})`;
      }

      // Adjust the inventory
      try {
         const updatedItem = await inventoryService.adjustQuantity(body.id, change, reason);

         return NextResponse.json({ data: updatedItem });
      } catch (adjustError) {
         if (adjustError.message.includes("not found")) {
            return NextResponse.json({ error: adjustError.message }, { status: 404 });
         }

         if (adjustError.message.includes("Insufficient inventory")) {
            return NextResponse.json({ error: adjustError.message }, { status: 400 });
         }

         throw adjustError;
      }
   } catch (error) {
      console.error("Error adjusting inventory:", error);
      return NextResponse.json({ error: "Failed to adjust inventory" }, { status: 500 });
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
