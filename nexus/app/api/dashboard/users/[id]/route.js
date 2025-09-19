// app/api/dashboard/users/[id]/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { userService } from "@/lib/userService";

/**
 * Get a specific user by ID
 * @param {Request} request - The request object
 * @param {Object} context - The context object with params
 * @returns {Promise<NextResponse>} - JSON response with user data
 */
export async function GET(request, { params }) {
   try {
      const id = params.id;

      // Verify authentication
      const { isAuthenticated, isAdmin, user: currentUser } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Allow admin access or self-access
      const isSelfAccess = currentUser && (currentUser._id === id || currentUser.id === id);

      if (!isAdmin && !isSelfAccess) {
         return NextResponse.json({ error: "You don't have permission to access this user" }, { status: 403 });
      }

      // Get user by ID
      const user = await userService.getUserById(id);

      if (!user) {
         return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ data: user });
   } catch (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
   }
}

/**
 * Update a specific user
 * @param {Request} request - The request object
 * @param {Object} context - The context object with params
 * @returns {Promise<NextResponse>} - JSON response with updated user
 */
export async function PUT(request, { params }) {
   try {
      const id = params.id;

      // Verify authentication
      const { isAuthenticated, isAdmin, user: currentUser } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Allow admin access or self-access
      const isSelfAccess = currentUser && (currentUser._id === id || currentUser.id === id);

      if (!isAdmin && !isSelfAccess) {
         return NextResponse.json({ error: "You don't have permission to update this user" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // If not admin, restrict fields that can be updated
      if (!isAdmin && isSelfAccess) {
         // Only allow updates to non-sensitive fields
         const allowedFields = ["firstName", "lastName", "phone", "avatar"];
         const sanitizedBody = {};

         for (const field of allowedFields) {
            if (body[field] !== undefined) {
               sanitizedBody[field] = body[field];
            }
         }

         const updatedUser = await userService.updateUser(id, sanitizedBody);

         return NextResponse.json({ data: updatedUser });
      }

      // Admin can update all fields
      const updatedUser = await userService.updateUser(id, body);

      return NextResponse.json({ data: updatedUser });
   } catch (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
   }
}

/**
 * Delete a specific user
 * @param {Request} request - The request object
 * @param {Object} context - The context object with params
 * @returns {Promise<NextResponse>} - JSON response with success status
 */
export async function DELETE(request, { params }) {
   try {
      const id = params.id;

      // Verify authentication
      const { isAuthenticated, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users to delete users
      if (!isAdmin) {
         return NextResponse.json({ error: "You don't have permission to delete users" }, { status: 403 });
      }

      // Delete the user
      const success = await userService.deleteUser(id);

      if (!success) {
         return NextResponse.json({ error: "User not found or already deleted" }, { status: 404 });
      }

      return NextResponse.json({ message: "User deleted successfully" });
   } catch (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
   }
}
