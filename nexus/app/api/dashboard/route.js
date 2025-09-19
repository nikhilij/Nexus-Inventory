// app/api/dashboard/route.js
import { NextResponse } from "next/server";

export async function GET() {
   return NextResponse.json({ message: "Dashboard API" });
}

export async function POST() {
   return NextResponse.json({ message: "Dashboard API POST" });
}
