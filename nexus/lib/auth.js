import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

// Next.js App Router authentication helper
export async function getAuthSession() {
   try {
      return await getServerSession();
   } catch (error) {
      console.error("Error getting session:", error);
      return null;
   }
}

// Check if user is authenticated
export async function isAuthenticated(req) {
   const session = await getAuthSession();
   return !!session;
}

// Check if user has admin role
export async function isAdmin(req) {
   const session = await getAuthSession();
   return session && session.user && session.user.role === "admin";
}

// Get user from session
export async function getUser() {
   const session = await getAuthSession();
   return session?.user || null;
}

const handler = NextAuth({
   providers: [
      GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
   ],
   pages: {
      signIn: "/login",
   },
   callbacks: {
      async jwt({ token, account }) {
         if (account) token.accessToken = account.access_token;
         return token;
      },
      async session({ session, token }) {
         session.accessToken = token.accessToken;
         return session;
      },
      async redirect({ url, baseUrl }) {
         // After successful sign in, redirect to PIN verification
         if (url.startsWith(baseUrl)) {
            return `${baseUrl}/verify-pin`;
         }
         return url;
      },
   },
});

export { handler };
