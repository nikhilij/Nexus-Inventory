import { NextResponse } from "next/server";

export async function POST(request) {
   try {
      // Create response
      const response = NextResponse.json({
         ok: true,
         message: "PIN verification cleared",
      });

      // Clear PIN verification cookies
      response.cookies.set("pinVerified", "", {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 0,
         path: "/",
      });

      response.cookies.set("pinVerifiedAt", "", {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 0,
         path: "/",
      });

      return response;
   } catch (e) {
      console.error("PIN clear error:", e);
      return NextResponse.json({ ok: false, error: "Failed to clear PIN verification" }, { status: 500 });
   }
}
