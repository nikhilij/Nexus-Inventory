// app/api/dashboard/orders/fulfill/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { orderService } from "@/lib/orderService";

/**
 * Fulfill an order
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with updated order
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users or inventory/order managers to fulfill orders
      if (!isAdmin && !hasRole(user, "inventory_manager") && !hasRole(user, "order_manager")) {
         return NextResponse.json({ error: "You don't have permission to fulfill orders" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Validate required fields
      if (!body.orderId) {
         return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
      }

      // Add user information for tracking
      const fulfilledBy = user ? user.name || user.email : "unknown";

      // Fulfill the order
      try {
         const updatedOrder = await orderService.fulfillOrder(body.orderId, fulfilledBy, body.notes);

         return NextResponse.json({
            data: updatedOrder,
            message: "Order fulfilled successfully",
         });
      } catch (fulfillError) {
         if (fulfillError.message.includes("not found")) {
            return NextResponse.json({ error: fulfillError.message }, { status: 404 });
         }

         if (fulfillError.message.includes("already fulfilled") || fulfillError.message.includes("cancelled")) {
            return NextResponse.json({ error: fulfillError.message }, { status: 400 });
         }

         if (fulfillError.message.includes("Insufficient inventory")) {
            return NextResponse.json({ error: fulfillError.message }, { status: 400 });
         }

         throw fulfillError;
      }
   } catch (error) {
      console.error("Error fulfilling order:", error);
      return NextResponse.json({ error: "Failed to fulfill order" }, { status: 500 });
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
