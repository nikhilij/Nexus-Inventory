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

      if (!/^\d{6}$/.test(pin)) {
         return NextResponse.json({ ok: false, error: "PIN must be exactly 6 digits" }, { status: 400 });
      }

      const user = await userService.getUserByEmail(email);
      if (!user) {
         return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
      }

      const updated = await userService.updateUser(user._id, { pin });

      return NextResponse.json({
         ok: true,
         message: "PIN set",
         user: { id: updated._id, email: updated.email, hasPin: !!updated.pin },
      });
   } catch (error) {
      console.error("/api/dev/set-pin error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
   }
}
