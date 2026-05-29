import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { db } from "./database";
import * as schema from "./database/schema";

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.WEBSITE_URL,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: (request) => {
    const origin = request?.headers.get("origin");
    return origin ? [origin] : ["*"];
  },
  plugins: [bearer(), expo()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Sync auth user into our custom users table
          try {
            await db.insert(schema.users).values({
              id: user.id,
              name: user.name,
              email: user.email,
              role: "customer",
            }).onConflictDoNothing();
          } catch {
            // ignore — row may already exist
          }
        },
      },
    },
  },
});
