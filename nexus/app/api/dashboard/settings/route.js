// app/api/dashboard/settings/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { settingsService } from "@/lib/settingsService";

/**
 * Get application settings
 * @returns {Promise<NextResponse>} - JSON response with settings data
 */
export async function GET() {
   try {
      // Verify authentication
      const { isAuthenticated } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Get all settings
      const settings = await settingsService.getSettings();

      return NextResponse.json({ data: settings });
   } catch (error) {
      console.error("Error fetching settings:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
   }
}

/**
 * Update application settings
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with updated settings
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only admin can update settings
      if (!isAdmin) {
         return NextResponse.json({ error: "You don't have permission to update settings" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Update settings
      const updatedSettings = await settingsService.updateSettings(body);

      return NextResponse.json({ data: updatedSettings });
   } catch (error) {
      console.error("Error updating settings:", error);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
   }
}
