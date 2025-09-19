// app/api/dashboard/suppliers/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "../../../../lib/dbConnect";
import serviceProvider from "../../../../lib/serviceProvider";
import { apiMiddleware } from "../../../../lib/apiMiddleware";

// Get all suppliers with optional filtering
export const GET = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const supplierService = serviceProvider.getSupplierService();
      const suppliers = await supplierService.listSuppliers();
      return NextResponse.json({ data: suppliers });
   } catch (error) {
      console.error("Error fetching suppliers:", error);
      return NextResponse.json({ error: error.message || "Failed to fetch suppliers" }, { status: 500 });
   }
});

// Create a new supplier
export const POST = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const body = await request.json().catch(() => ({}));
      const supplierService = serviceProvider.getSupplierService();
      const supplier = await supplierService.createSupplier(body);
      return NextResponse.json({ data: supplier }, { status: 201 });
   } catch (error) {
      console.error("Error creating supplier:", error);
      return NextResponse.json({ error: error.message || "Failed to create supplier" }, { status: 500 });
   }
});

// Update a supplier
export const PUT = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const body = await request.json().catch(() => ({}));
      const { id, ...updateData } = body;

      if (!id) {
         return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
      }

      const supplierService = serviceProvider.getSupplierService();
      const supplier = await supplierService.updateSupplier(id, updateData);

      if (!supplier) {
         return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }

      return NextResponse.json({ data: supplier });
   } catch (error) {
      console.error("Error updating supplier:", error);
      return NextResponse.json({ error: error.message || "Failed to update supplier" }, { status: 500 });
   }
});

// Delete a supplier
export const DELETE = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const url = new URL(request.url);
      const id = url.searchParams.get("id");

      if (!id) {
         return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
      }

      const supplierService = serviceProvider.getSupplierService();
      const result = await supplierService.deleteSupplier(id);

      if (!result) {
         return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error deleting supplier:", error);
      return NextResponse.json({ error: error.message || "Failed to delete supplier" }, { status: 500 });
   }
});
