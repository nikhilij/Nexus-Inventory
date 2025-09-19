// app/api/dashboard/warehouses/route.js
import { NextResponse } from "next/server";

export async function GET() {
   return NextResponse.json({ message: "Warehouses API" });
}

export async function POST() {
   return NextResponse.json({ message: "Warehouses API POST" });
}
