// app/api/dashboard/products/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { productService } from "@/lib/productService";

/**
 * Get all products with optional filtering and pagination
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with products and pagination metadata
 */
export async function GET(request) {
   try {
      // Verify authentication
      const { isAuthenticated } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "10", 10);
      const search = searchParams.get("search");
      const category = searchParams.get("category");
      const supplier = searchParams.get("supplier");

      // Build filter
      const filter = {};

      if (category) {
         filter.category = category;
      }

      if (supplier) {
         filter.supplier = supplier;
      }

      // If search query is provided, use search method
      if (search) {
         const searchResults = await productService.searchProducts(search);

         return NextResponse.json({
            data: searchResults,
            pagination: {
               total: searchResults.length,
               page: 1,
               limit: searchResults.length,
               pages: 1,
            },
         });
      }

      // Get products with pagination
      const { products, pagination } = await productService.getProducts({
         page,
         limit,
         filter,
      });

      return NextResponse.json({
         data: products,
         pagination,
      });
   } catch (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
   }
}

/**
 * Create a new product
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with the created product
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users or inventory managers to create products
      if (!isAdmin && !hasRole(user, "inventory_manager")) {
         return NextResponse.json({ error: "You don't have permission to create products" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Validate required fields
      if (!body.name || !body.sku) {
         return NextResponse.json({ error: "Product name and SKU are required" }, { status: 400 });
      }

      // Create the product
      try {
         const product = await productService.createProduct(body);

         return NextResponse.json({ data: product }, { status: 201 });
      } catch (createError) {
         if (createError.message.includes("SKU already exists")) {
            return NextResponse.json({ error: createError.message }, { status: 409 });
         }

         if (createError.message.includes("not found")) {
            return NextResponse.json({ error: createError.message }, { status: 400 });
         }

         throw createError;
      }
   } catch (error) {
      console.error("Error creating product:", error);
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
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
export const PUT = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const body = await request.json().catch(() => ({}));
      const { id, ...updateData } = body;

      if (!id) {
         return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
      }

      const productService = serviceProvider.getProductService();
      const product = await productService.updateProduct(id, updateData);

      if (!product) {
         return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json({ data: product });
   } catch (error) {
      console.error("Error updating product:", error);
      return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
   }
});

// Delete a product
export const DELETE = apiMiddleware.protected(async (request) => {
   try {
      await dbConnect();
      const url = new URL(request.url);
      const id = url.searchParams.get("id");

      if (!id) {
         return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
      }

      const productService = serviceProvider.getProductService();
      const result = await productService.deleteProduct(id);

      if (!result) {
         return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
   } catch (error) {
      console.error("Error deleting product:", error);
      return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
   }
});
