// app/api/dashboard/warehouses/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "../../../../lib/dbConnect";
import serviceProvider from "../../../../lib/serviceProvider";
import { apiMiddleware } from "../../../../lib/apiMiddleware";

// Get all warehouses with optional filtering
export const GET = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const warehouseService = serviceProvider.getWarehouseService();
      const warehouses = await warehouseService.listWarehouses();
      return NextResponse.json({ data: warehouses });
   } catch (error) {
      console.error("Error fetching warehouses:", error);
      return NextResponse.json({ error: error.message || "Failed to fetch warehouses" }, { status: 500 });
   }
});

// Create a new warehouse
export const POST = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const body = await request.json().catch(() => ({}));
      const warehouseService = serviceProvider.getWarehouseService();
      const warehouse = await warehouseService.createWarehouse(body);
      return NextResponse.json({ data: warehouse }, { status: 201 });
   } catch (error) {
      console.error("Error creating warehouse:", error);
      return NextResponse.json({ error: error.message || "Failed to create warehouse" }, { status: 500 });
   }
});

// Update a warehouse
export const PUT = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const body = await request.json().catch(() => ({}));
      const { id, ...updateData } = body;

      if (!id) {
         return NextResponse.json({ error: "Warehouse ID is required" }, { status: 400 });
      }

      const warehouseService = serviceProvider.getWarehouseService();
      const warehouse = await warehouseService.updateWarehouse(id, updateData);

      if (!warehouse) {
         return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
      }

      return NextResponse.json({ data: warehouse });
   } catch (error) {
      console.error("Error updating warehouse:", error);
      return NextResponse.json({ error: error.message || "Failed to update warehouse" }, { status: 500 });
   }
});

// Delete a warehouse
export const DELETE = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const url = new URL(request.url);
      const id = url.searchParams.get("id");

      if (!id) {
         return NextResponse.json({ error: "Warehouse ID is required" }, { status: 400 });
      }

      const warehouseService = serviceProvider.getWarehouseService();
      const result = await warehouseService.deleteWarehouse(id);

      if (!result) {
         return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error deleting warehouse:", error);
      return NextResponse.json({ error: error.message || "Failed to delete warehouse" }, { status: 500 });
   }
});
