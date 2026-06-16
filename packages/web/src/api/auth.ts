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
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // set to true once email provider configured
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
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
          try {
            await db
              .insert(schema.users)
              .values({
                id: user.id,
                name: user.name,
                email: user.email,
                profilePhoto: user.image ?? null,
                role: "customer",
              })
              .onConflictDoNothing();
          } catch {
            // ignore — row may already exist
          }
        },
      },
    },
  },
});
