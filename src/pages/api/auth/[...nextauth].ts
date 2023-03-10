import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import Auth0Provider from "next-auth/providers/auth0";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
};

export default NextAuth(authOptions);
