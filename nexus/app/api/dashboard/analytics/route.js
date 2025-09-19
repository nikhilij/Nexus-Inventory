// app/api/dashboard/analytics/route.js
import { NextResponse } from "next/server";

export async function GET() {
   return NextResponse.json({ message: "Analytics API" });
}

export async function POST() {
   return NextResponse.json({ message: "Analytics API POST" });
}
