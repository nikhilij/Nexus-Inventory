import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { userService } from "@/lib/userService";
import { getAuthServerSession } from "@/lib/apiAuth";
import crypto from "crypto";

export async function POST(request) {
   try {
      await dbConnect();

      // For server-side routes, we expect the user to be authenticated. But
      // to keep this simple and dev-friendly we'll attempt to read session
      // info from cookies using userService's helpers or let the client
      // call this while authenticated. If no user is known, return 401.

      // If you later want to require auth, replace this with proper session check.

      const body = await request.json().catch(() => ({}));

      // Prefer authenticated session email; fall back to provided email in body
      const { isAuthenticated, user: sessionUser } = await getAuthServerSession();

      const email = (isAuthenticated && sessionUser && sessionUser.email) || body.email;

      if (!email) {
         return NextResponse.json({ ok: false, error: "Email required or authenticate first" }, { status: 401 });
      }

      const user = await userService.getUserByEmail(email);
      if (!user) {
         return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
      }

      // Generate a token and save to user's passwordResetToken field
      const token = crypto.randomBytes(20).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await userService.updateUser(user._id, {
         passwordResetToken: token,
         passwordResetExpires: expires,
      });

      const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-pin?token=${token}&email=${encodeURIComponent(
         user.email
      )}`;

      // In real app we'd email the link. For dev, return link in body.
      return NextResponse.json({ ok: true, message: "Reset token generated", resetLink });
   } catch (error) {
      console.error("forgot-pin error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
   }
}
