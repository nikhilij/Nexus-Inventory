import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { User, Role } from "@/models/index";

/**
 * Create a test user for debugging PIN functionality
 * This should be removed in production
 */
export async function POST(request) {
   try {
      console.log("=== CREATE TEST USER API CALLED ===");

      await dbConnect();

      const body = await request.json();
      const { email, name } = body || {};

      if (!email || !name) {
         return NextResponse.json(
            {
               ok: false,
               error: "Email and name are required",
            },
            { status: 400 }
         );
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
         return NextResponse.json({
            ok: true,
            message: "User already exists",
            user: {
               id: existingUser._id,
               email: existingUser.email,
               name: existingUser.name,
               hasPin: !!existingUser.pin,
            },
         });
      }

      // Find or create default role
      let defaultRole = await Role.findOne({ name: "user" });
      if (!defaultRole) {
         defaultRole = new Role({
            name: "user",
            description: "Default user role",
            permissions: [],
            isSystemRole: true,
         });
         await defaultRole.save();
         console.log("Created default role:", defaultRole);
      }

      // Create test user
      const newUser = new User({
         name,
         email,
         password: "test123", // In real app, this should be hashed
         emailVerified: true,
         status: "active",
         role: defaultRole._id,
      });

      const savedUser = await newUser.save();
      console.log("Created test user:", { id: savedUser._id, email: savedUser.email });

      return NextResponse.json({
         ok: true,
         message: "Test user created successfully",
         user: {
            id: savedUser._id,
            email: savedUser.email,
            name: savedUser.name,
            hasPin: !!savedUser.pin,
         },
      });
   } catch (error) {
      console.error("Create test user error:", error);
      return NextResponse.json(
         {
            ok: false,
            error: "Failed to create test user",
            message: error.message,
         },
         { status: 500 }
      );
   }
}
