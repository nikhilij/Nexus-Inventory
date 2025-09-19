// app/api/dashboard/users/route.js
import { NextResponse } from "next/server";

export async function GET() {
   return NextResponse.json({ message: "Users API" });
}

export async function POST() {
   return NextResponse.json({ message: "Users API POST" });
}
