// app/api/auth/[...nextauth]/options.js
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { dbConnect } from "@/lib/dbConnect";
import { User, Role } from "@/models/index";
import bcrypt from "bcrypt";

export const authOptions = {
   providers: [
      CredentialsProvider({
         name: "Credentials",
         credentials: {
            email: { label: "Email", type: "email", placeholder: "your@email.com" },
            password: { label: "Password", type: "password" },
         },
         async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
               return null;
            }

            try {
               await dbConnect();
               const user = await User.findOne({ email: credentials.email });

               if (!user) {
                  return null;
               }

               // Check password
               const isValidPassword = await bcrypt.compare(credentials.password, user.password);

               if (!isValidPassword) {
                  return null;
               }

               // Convert to plain object and remove sensitive fields
               const userObject = user.toObject();
               delete userObject.password;

               return userObject;
            } catch (error) {
               console.error("Authentication error:", error);
               return null;
            }
         },
      }),
      GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID || "",
         clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      }),
   ],
   callbacks: {
      async signIn({ user, account, profile }) {
         // For OAuth providers, ensure user exists in database
         if (account?.provider === "google" && user?.email) {
            try {
               await dbConnect();

               // Check if user already exists
               let existingUser = await User.findOne({ email: user.email });

               if (!existingUser) {
                  // Find default role or create one
                  let defaultRole = await Role.findOne({ name: "user" });

                  if (!defaultRole) {
                     // Create default user role if it doesn't exist
                     defaultRole = new Role({
                        name: "user",
                        description: "Default user role",
                        permissions: [], // Will be empty for now
                        isSystemRole: true,
                     });
                     await defaultRole.save();
                  }

                  // Create new user for OAuth login
                  // Generate a random temporary password and hash it so Mongoose validation passes
                  const tempPassword = Math.random().toString(36).slice(-12);
                  const hashedPassword = await bcrypt.hash(tempPassword, 10);

                  const newUser = new User({
                     name: user.name,
                     email: user.email,
                     password: hashedPassword,
                     emailVerified: true, // OAuth users are pre-verified
                     status: "active",
                     role: defaultRole._id,
                     // Note: organization will need to be set up separately
                  });

                  console.log("Creating new OAuth user:", {
                     email: user.email,
                     name: user.name,
                     roleId: defaultRole?._id?.toString(),
                     hashedPasswordPresent: !!hashedPassword,
                  });

                  existingUser = await newUser.save();
                  console.log("Created new user from OAuth:", user.email, "id:", existingUser._id.toString());
               } // Update user object with database ID
               user.id = existingUser._id.toString();
               user.role = existingUser.role;
            } catch (error) {
               console.error(
                  "Error creating OAuth user:",
                  error && error.message,
                  "details:",
                  error && error.errors ? error.errors : error
               );
               return false; // Deny sign in if user creation fails
            }
         }

         return true;
      },
      async jwt({ token, user }) {
         if (user) {
            token.id = user._id || user.id;
            token.role = user.role;
            token.roles = user.roles;
            token.name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();
         }
         return token;
      },
      async session({ session, token }) {
         if (token) {
            session.user.id = token.id;
            session.user.role = token.role;
            session.user.roles = token.roles;
         }
         return session;
      },
   },
   pages: {
      signIn: "/login",
      error: "/login",
   },
   session: {
      strategy: "jwt",
      maxAge: 24 * 60 * 60, // 24 hours
   },
   secret: process.env.NEXTAUTH_SECRET || "nexus-inventory-secret-key",
};
