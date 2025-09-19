// app/api/dashboard/reports/route.js
import { NextResponse } from "next/server";
import { getAuthServerSession } from "@/lib/apiAuth";
import { reportingService } from "@/lib/reportingService";

/**
 * Get available reports or generate a specific report
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with reports data
 */
export async function GET(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, isManager } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only admin and managers can access reports
      if (!isAdmin && !isManager) {
         return NextResponse.json({ error: "You don't have permission to access reports" }, { status: 403 });
      }

      // Parse query parameters
      const url = new URL(request.url);
      const reportId = url.searchParams.get("reportId");

      if (reportId) {
         // Generate specific report
         const parameters = {};
         for (const [key, value] of url.searchParams.entries()) {
            if (key !== "reportId") {
               parameters[key] = value;
            }
         }

         const report = await reportingService.generateReport(reportId, parameters);
         return NextResponse.json({ data: report });
      } else {
         // Get list of available reports
         const reports = await reportingService.getAvailableReports();
         return NextResponse.json({ data: reports });
      }
   } catch (error) {
      console.error("Error fetching reports:", error);
      return NextResponse.json({ error: error.message || "Failed to fetch reports" }, { status: 500 });
   }
}

/**
 * Generate a custom report
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} - JSON response with generated report
 */
export async function POST(request) {
   try {
      // Verify authentication
      const { isAuthenticated, isAdmin, isManager } = await getAuthServerSession();

      if (!isAuthenticated) {
         return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Only admin and managers can generate reports
      if (!isAdmin && !isManager) {
         return NextResponse.json({ error: "You don't have permission to generate reports" }, { status: 403 });
      }

      // Get request body
      const body = await request.json().catch(() => ({}));

      // Validate required fields
      if (!body.reportId) {
         return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
      }

      // Generate report
      const report = await reportingService.generateReport(body.reportId, body.parameters || {});

      return NextResponse.json({ data: report }, { status: 201 });
   } catch (error) {
      console.error("Error generating report:", error);
      return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
   }
}
