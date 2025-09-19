// app/api/dashboard/products/route.js
import { NextResponse } from "next/server";

export async function GET() {
   return NextResponse.json({ message: "Products API" });
}

export async function POST() {
   return NextResponse.json({ message: "Products API POST" });
}
