import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
    ],
    // This ensures the session data is stored securely in an encrypted cookie
    session: {
        strategy: "jwt",
    },
    callbacks: {
        // This adds the user's ID to the session token so we can use it in our DB queries later
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
            }
            return session;
        },
    },
});

export { handler as GET, handler as POST };