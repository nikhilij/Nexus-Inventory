// app/api/dashboard/products/[id]/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { productService } from "@/lib/productService";

/**
 * Get a specific product by ID
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Product ID
 * @returns {Promise<NextResponse>} - JSON response with product data
 */
export async function GET(request, { params }) {
   try {
      const { id } = params;

      // Verify authentication
      const { isAuthenticated } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Get the product
      const product = await productService.getProductById(id);

      if (!product) {
         return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json({ data: product });
   } catch (error) {
      console.error(`Error fetching product ${params.id}:`, error);
      return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
   }
}

/**
 * Update a specific product
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Product ID
 * @returns {Promise<NextResponse>} - JSON response with updated product data
 */
export async function PUT(request, { params }) {
   try {
      const { id } = params;

      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users or inventory managers to update products
      if (!isAdmin && !hasRole(user, "inventory_manager")) {
         return NextResponse.json({ error: "You don't have permission to update products" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Update the product
      try {
         const updatedProduct = await productService.updateProduct(id, body);

         if (!updatedProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
         }

         return NextResponse.json({ data: updatedProduct });
      } catch (updateError) {
         if (updateError.message.includes("SKU already exists")) {
            return NextResponse.json({ error: updateError.message }, { status: 409 });
         }

         if (updateError.message.includes("not found")) {
            return NextResponse.json({ error: updateError.message }, { status: 400 });
         }

         throw updateError;
      }
   } catch (error) {
      console.error(`Error updating product ${params.id}:`, error);
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
   }
}

/**
 * Delete a specific product
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Product ID
 * @returns {Promise<NextResponse>} - JSON response confirming deletion
 */
export async function DELETE(request, { params }) {
   try {
      const { id } = params;

      // Verify authentication
      const { isAuthenticated, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users to delete products
      if (!isAdmin) {
         return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }

      // Delete the product
      const success = await productService.deleteProduct(id);

      if (!success) {
         return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
   } catch (error) {
      console.error(`Error deleting product ${params.id}:`, error);
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
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
