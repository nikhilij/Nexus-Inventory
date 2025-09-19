// app/api/dashboard/orders/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "../../../../lib/dbConnect";
import serviceProvider from "../../../../lib/serviceProvider";
import { apiMiddleware } from "../../../../lib/apiMiddleware";

// Get all orders with optional filtering
export const GET = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const orderService = serviceProvider.getOrderService();
      const orders = await orderService.listOrders();
      return NextResponse.json({ data: orders });
   } catch (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
   }
});

// Create a new order
export const POST = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const body = await request.json().catch(() => ({}));
      const orderService = serviceProvider.getOrderService();
      const order = await orderService.createOrder(body);
      return NextResponse.json({ data: order }, { status: 201 });
   } catch (error) {
      console.error("Error creating order:", error);
      return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
   }
});

// Update an order
export const PUT = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const body = await request.json().catch(() => ({}));
      const { id, ...updateData } = body;

      if (!id) {
         return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
      }

      const orderService = serviceProvider.getOrderService();
      const order = await orderService.updateOrder(id, updateData);

      if (!order) {
         return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json({ data: order });
   } catch (error) {
      console.error("Error updating order:", error);
      return NextResponse.json({ error: error.message || "Failed to update order" }, { status: 500 });
   }
});

// Delete an order
export const DELETE = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const url = new URL(request.url);
      const id = url.searchParams.get("id");

      if (!id) {
         return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
      }

      const orderService = serviceProvider.getOrderService();
      const result = await orderService.deleteOrder(id);

      if (!result) {
         return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error deleting order:", error);
      return NextResponse.json({ error: error.message || "Failed to delete order" }, { status: 500 });
   }
});
