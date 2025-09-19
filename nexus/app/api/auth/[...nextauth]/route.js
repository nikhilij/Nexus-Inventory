import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // Keep profile information minimal in the JWT for demo purposes
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.user = { name: profile.name, email: profile.email, picture: profile.picture };
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user || session.user;
      // For demo: mark users as subscribed=false by default; integrate with your DB to read real subscription status
      session.subscribed = false;
      return session;
    }
  }
});

export { handler as GET, handler as POST };
