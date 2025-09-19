// app/api/dashboard/profile/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { userService } from "@/lib/userService";

/**
 * Get current user profile
 * @returns {Promise<NextResponse>} - JSON response with user profile data
 */
export async function GET() {
   try {
      // Verify authentication
      const { isAuthenticated, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Get user profile by ID
      const userId = user.id || user._id;
      const profile = await userService.getUserById(userId);

      if (!profile) {
         return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      return NextResponse.json({ data: profile });
   } catch (error) {
      console.error("Error fetching profile:", error);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
   }
}

/**
 * Update current user profile
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with updated profile
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, user } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Update user profile
      const userId = user.id || user._id;
      const updatedProfile = await userService.updateUser(userId, body);

      if (!updatedProfile) {
         return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      return NextResponse.json({ data: updatedProfile });
   } catch (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
   }
}
