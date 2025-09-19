// app/api/dashboard/categories/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { productService } from "@/lib/productService";

/**
 * Get all product categories
 * @returns {Promise<NextResponse>} - JSON response with categories
 */
export async function GET() {
   try {
      // Verify authentication
      const { isAuthenticated, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Get all categories
      const categories = await productService.getCategories();

      return NextResponse.json({ data: categories });
   } catch (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
   }
}

/**
 * Create a new product category
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with created category
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, user, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users to create categories
      if (!isAdmin) {
         return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      if (!body.name) {
         return NextResponse.json({ error: "Category name is required" }, { status: 400 });
      }

      // Create the category
      const category = await productService.createCategory(body);

      return NextResponse.json({ data: category }, { status: 201 });
   } catch (error) {
      console.error("Error creating category:", error);

      // Handle duplicate name error
      if (error.message && error.message.includes("already exists")) {
         return NextResponse.json({ error: error.message }, { status: 409 });
      }

      return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
   }
}
