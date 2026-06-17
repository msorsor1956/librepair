import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { db } from "./database";
import * as schema from "./database/schema";
import { execSync } from "child_process";

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.WEBSITE_URL,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const frontendUrl = process.env.VITE_FRONTEND_URL ?? "https://librepair.wasmer.app";
      // The reset URL from better-auth points to the backend — we rewrite to frontend
      // Frontend should handle /reset-password?token=... and call the API
      const tokenMatch = url.match(/reset-password\/([^?]+)/);
      const token = tokenMatch?.[1] ?? "";
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;

      const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #e5e5e5; padding: 40px;">
  <div style="max-width: 520px; margin: 0 auto; background: #111; border-radius: 12px; padding: 36px; border: 1px solid rgba(255,255,255,0.08);">
    <div style="text-align: center; margin-bottom: 28px;">
      <span style="font-size: 28px; font-weight: 800; color: #e02020; letter-spacing: 2px;">LIB</span><span style="font-size: 28px; font-weight: 800; color: #fff;">repair</span>
    </div>
    <h2 style="color: #fff; font-size: 20px; margin-bottom: 8px;">Set Your Password</h2>
    <p style="color: #888; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
      Your account has been created on LIBrepair. Click the button below to set your secure password and access your account.
    </p>
    <a href="${resetLink}" style="display: inline-block; background: #e02020; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin-bottom: 24px;">
      Set My Password →
    </a>
    <p style="color: #555; font-size: 12px; margin-top: 24px; line-height: 1.5;">
      This link expires in 1 hour. If you didn't expect this email, you can safely ignore it.<br/>
      LIBrepair — Professional Auto Repair Services
    </p>
  </div>
</body>
</html>`;

      try {
        execSync(
          `send-email --to ${JSON.stringify(user.email)} --subject "Set Your LIBrepair Password" --html -`,
          { input: htmlBody, stdio: ["pipe", "ignore", "ignore"] }
        );
      } catch (e) {
        console.error("Failed to send password reset email:", e);
      }
    },
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
