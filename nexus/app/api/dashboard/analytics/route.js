// app/api/dashboard/analytics/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { analyticsService } from "@/lib/analyticsService";

/**
 * Get analytics data
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with analytics data
 */
export async function GET(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, isManager } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only admin and managers can access analytics
      if (!isAdmin && !isManager) {
         return NextResponse.json({ error: "You don't have permission to access analytics" }, { status: 403 });
      }

      // Parse query parameters
      const url = new URL(request.url);
      const type = url.searchParams.get("type") || "dashboard";
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const period = url.searchParams.get("period");
      const limit = parseInt(url.searchParams.get("limit") || "10");

      const options = {};
      if (startDate) options.startDate = startDate;
      if (endDate) options.endDate = endDate;
      if (period) options.period = period;
      if (limit) options.limit = limit;

      let data;

      switch (type) {
         case "dashboard":
            data = await analyticsService.getDashboardAnalytics(options);
            break;
         case "sales-trends":
            data = await analyticsService.getSalesTrends(options);
            break;
         case "top-products":
            data = await analyticsService.getTopProducts(options);
            break;
         case "inventory-turnover":
            data = await analyticsService.getInventoryTurnover();
            break;
         default:
            return NextResponse.json({ error: "Invalid analytics type" }, { status: 400 });
      }

      return NextResponse.json({ data });
   } catch (error) {
      console.error("Error fetching analytics:", error);
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
   }
}

/**
 * Record analytics event
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response confirming event recording
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

      // Validate required fields
      if (!body.event || !body.data) {
         return NextResponse.json({ error: "Event type and data are required" }, { status: 400 });
      }

      // For now, just acknowledge the event
      // In a real implementation, you might store this in a database
      const eventData = {
         event: body.event,
         data: body.data,
         userId: user.id || user._id,
         timestamp: new Date(),
         userAgent: request.headers.get("user-agent"),
         ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      };

      // TODO: Store analytics event in database
      console.log("Analytics event recorded:", eventData);

      return NextResponse.json(
         {
            message: "Analytics event recorded",
            eventId: Date.now().toString(),
         },
         { status: 202 }
      );
   } catch (error) {
      console.error("Error recording analytics event:", error);
      return NextResponse.json({ error: "Failed to record analytics event" }, { status: 500 });
   }
}
