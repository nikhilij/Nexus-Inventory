// app/api/dashboard/orders/cancel/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { orderService } from "@/lib/orderService";

/**
 * Cancel an order
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

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Validate required fields
      if (!body.orderId) {
         return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
      }

      // Get the order first to check permissions
      const order = await orderService.getOrderById(body.orderId);

      if (!order) {
         return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Check if user has permission to cancel this order
      const isOrderOwner = user._id.toString() === order.userId.toString();
      const canManageOrders = isAdmin || hasRole(user, "order_manager");

      if (!isOrderOwner && !canManageOrders) {
         return NextResponse.json({ error: "You don't have permission to cancel this order" }, { status: 403 });
      }

      // Add user information for tracking
      const cancelledBy = user ? user.name || user.email : "unknown";

      // Cancel the order
      try {
         const updatedOrder = await orderService.cancelOrder(
            body.orderId,
            body.reason || "Cancelled by user",
            cancelledBy
         );

         return NextResponse.json({
            data: updatedOrder,
            message: "Order cancelled successfully",
         });
      } catch (cancelError) {
         if (cancelError.message.includes("not found")) {
            return NextResponse.json({ error: cancelError.message }, { status: 404 });
         }

         if (cancelError.message.includes("already fulfilled") || cancelError.message.includes("already cancelled")) {
            return NextResponse.json({ error: cancelError.message }, { status: 400 });
         }

         throw cancelError;
      }
   } catch (error) {
      console.error("Error cancelling order:", error);
      return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
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
