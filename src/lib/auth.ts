import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { db } from "../db";

import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "../db/schema/auth";

export const authOptions: NextAuthOptions = {
  debug: false,

  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      issuer: "https://discord.com",
    }),
  ],

  session: {
    strategy: "database",
  },

  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};