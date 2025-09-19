// app/api/dashboard/help/route.js
import { NextResponse } from "next/server";

export async function GET() {
   return NextResponse.json({ message: "Help API" });
}

export async function POST() {
   return NextResponse.json({ message: "Help API POST" });
}
