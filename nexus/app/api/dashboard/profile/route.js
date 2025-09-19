// app/api/dashboard/profile/route.js
import { NextResponse } from "next/server";

export async function GET() {
   return NextResponse.json({ message: "Profile API" });
}

export async function POST() {
   return NextResponse.json({ message: "Profile API POST" });
}
