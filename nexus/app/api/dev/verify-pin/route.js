import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { userService } from "@/lib/userService";

export async function POST(request) {
   try {
      if (process.env.NODE_ENV === "production") {
         return NextResponse.json({ ok: false, error: "Not allowed in production" }, { status: 403 });
      }

      await dbConnect();
      const body = await request.json();
      const { email, pin } = body || {};

      if (!email || !pin) {
         return NextResponse.json({ ok: false, error: "email and pin are required" }, { status: 400 });
      }

      const user = await userService.getUserByEmail(email);
      if (!user) {
         return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
      }

      const result = await userService.verifyPin(user._id, pin);

      return NextResponse.json({ ok: result.success, message: result.message, needsSetup: result.needsSetup || false });
   } catch (error) {
      console.error("/api/dev/verify-pin error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
   }
}
