// app/api/dashboard/users/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { userService } from "@/lib/userService";

/**
 * Get all users with pagination
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with users and pagination metadata
 */
export async function GET(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users to list all users
      if (!isAdmin) {
         return NextResponse.json({ error: "You don't have permission to view all users" }, { status: 403 });
      }

      // Get query parameters
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const limit = parseInt(url.searchParams.get("limit") || "10", 10);

      // Get users with pagination
      const { users, pagination } = await userService.getUsers({ page, limit });

      return NextResponse.json({
         data: users,
         pagination,
      });
   } catch (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
   }
}

/**
 * Create a new user
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with created user
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only allow admin users to create users
      if (!isAdmin) {
         return NextResponse.json({ error: "You don't have permission to create users" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Validate required fields
      if (!body.email) {
         return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      if (!body.password && !body.passwordHash) {
         return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }

      // Create the user
      try {
         const user = await userService.createUser(body);

         return NextResponse.json({ data: user }, { status: 201 });
      } catch (createError) {
         if (createError.message.includes("duplicate") || createError.code === 11000) {
            return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
         }

         throw createError;
      }
   } catch (error) {
      console.error("Error creating user:", error);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
   }
}
