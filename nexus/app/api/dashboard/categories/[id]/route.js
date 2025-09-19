// app/api/dashboard/categories/[id]/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { productService } from "@/lib/productService";

/**
 * Get a specific category by ID
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Category ID
 * @returns {Promise<NextResponse>} - JSON response with category data
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Verify authentication
    const { isAuthenticated } = await getAuthServerSession();
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get all categories since we don't have a getCategoryById method
    const categories = await productService.getCategories();
    const category = categories.find(cat => cat._id.toString() === id);
    
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: category });
  } catch (error) {
    console.error(`Error fetching category ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

/**
 * Update a specific category
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Category ID
 * @returns {Promise<NextResponse>} - JSON response with updated category data
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Verify authentication
    const { isAuthenticated, isAdmin } = await getAuthServerSession();
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Only allow admin users to update categories
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json().catch(() => ({}));
    
    if (!body.name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    
    // Update the category
    const updatedCategory = await productService.updateCategory(id, body);
    
    if (!updatedCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: updatedCategory });
  } catch (error) {
    console.error(`Error updating category ${params.id}:`, error);
    
    // Handle duplicate name error
    if (error.message && error.message.includes("already exists")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

/**
 * Delete a specific category
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Category ID
 * @returns {Promise<NextResponse>} - JSON response confirming deletion
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Verify authentication
    const { isAuthenticated, isAdmin } = await getAuthServerSession();
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Only allow admin users to delete categories
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    // Delete the category
    try {
      const success = await productService.deleteCategory(id);
      
      if (!success) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { message: "Category deleted successfully" },
        { status: 200 }
      );
    } catch (deleteError) {
      // Handle case where category is in use
      if (deleteError.message && deleteError.message.includes("Cannot delete category")) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 409 }
        );
      }
      throw deleteError;
    }
  } catch (error) {
    console.error(`Error deleting category ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}