// app/api/dashboard/orders/[id]/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { orderService } from "@/lib/orderService";

/**
 * Get a specific order by ID
 * @param {Request} request - The request object
 * @param {Object} params - URL parameters
 * @returns {Promise<NextResponse>} - JSON response with order
 */
export async function GET(request, { params }) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const id = params.id;

      // Get the order
      const order = await orderService.getOrderById(id);

      if (!order) {
         return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Check if user has permission to view this order
      if (!isAdmin && !hasRole(user, "order_manager") && user._id.toString() !== order.userId.toString()) {
         return NextResponse.json({ error: "You don't have permission to view this order" }, { status: 403 });
      }

      return NextResponse.json({ data: order });
   } catch (error) {
      console.error("Error getting order:", error);
      return NextResponse.json({ error: "Failed to retrieve order" }, { status: 500 });
   }
}

/**
 * Update an order
 * @param {Request} request - The request object
 * @param {Object} params - URL parameters
 * @returns {Promise<NextResponse>} - JSON response with updated order
 */
export async function PUT(request, { params }) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const id = params.id;

      // Only allow admin users or order managers to update orders
      if (!isAdmin && !hasRole(user, "order_manager")) {
         return NextResponse.json({ error: "You don't have permission to update orders" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Update the order
      try {
         const updatedOrder = await orderService.updateOrder(id, body);

         if (!updatedOrder) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
         }

         return NextResponse.json({ data: updatedOrder });
      } catch (updateError) {
         if (updateError.message.includes("not found")) {
            return NextResponse.json({ error: updateError.message }, { status: 404 });
         }

         throw updateError;
      }
   } catch (error) {
      console.error("Error updating order:", error);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
   }
}

/**
 * Delete an order
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

      // Only allow admin users to delete orders
      if (!isAdmin) {
         return NextResponse.json({ error: "You don't have permission to delete orders" }, { status: 403 });
      }

      const id = params.id;

      // Delete the order
      try {
         const result = await orderService.deleteOrder(id);

         if (!result) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
         }

         return NextResponse.json({ success: true, message: "Order deleted successfully" });
      } catch (deleteError) {
         if (deleteError.message.includes("not found")) {
            return NextResponse.json({ error: deleteError.message }, { status: 404 });
         }

         throw deleteError;
      }
   } catch (error) {
      console.error("Error deleting order:", error);
      return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
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
