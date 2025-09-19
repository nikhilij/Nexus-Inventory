// app/api/dashboard/reports/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Reports API' });
}

export async function POST() {
  return NextResponse.json({ message: 'Reports API POST' });
}