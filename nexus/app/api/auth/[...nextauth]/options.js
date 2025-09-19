// app/api/auth/[...nextauth]/options.js
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/index";
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
