import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { db } from "./database";
import * as schema from "./database/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

function getMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_PORT ?? "465") === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.WEBSITE_URL,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const frontendUrl = process.env.VITE_FRONTEND_URL ?? "https://www.librepair.com";
      // Rewrite the backend reset URL → frontend /reset-password?token=...
      const tokenMatch = url.match(/[?&]token=([^&]+)/) ?? url.match(/reset-password\/([^?&/]+)/);
      const token = tokenMatch?.[1] ?? url.split("/").pop()?.split("?")[0] ?? "";
      const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

      const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #e5e5e5; padding: 40px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: #111; border-radius: 12px; padding: 36px; border: 1px solid rgba(255,255,255,0.08);">
    <div style="text-align: center; margin-bottom: 28px;">
      <span style="font-size: 28px; font-weight: 800; color: #e02020; letter-spacing: 2px;">LIB</span><span style="font-size: 28px; font-weight: 800; color: #fff;">repair</span>
    </div>
    <h2 style="color: #fff; font-size: 20px; margin-bottom: 8px;">Set Your Password</h2>
    <p style="color: #aaa; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
      Hi ${user.name || user.email},<br/><br/>
      Your LIBrepair account has been created. Click the button below to set your password and access your account.
    </p>
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${resetLink}" style="display: inline-block; background: #e02020; color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
        Set My Password →
      </a>
    </div>
    <p style="color: #555; font-size: 12px; margin-top: 24px; line-height: 1.6;">
      This link expires in <strong style="color:#888;">1 hour</strong>. If you didn't expect this email, you can safely ignore it.<br/><br/>
      If the button doesn't work, copy and paste this link:<br/>
      <a href="${resetLink}" style="color: #e02020; word-break: break-all;">${resetLink}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
    <p style="color: #444; font-size: 11px; text-align: center;">LIBrepair — Professional Auto Repair Services</p>
  </div>
</body>
</html>`;

      try {
        const transporter = getMailTransporter();
        await transporter.sendMail({
          from: `"LIBrepair" <${process.env.SMTP_USER ?? "libsupport@librepair.com"}>`,
          to: user.email,
          subject: "Set Your LIBrepair Password",
          html: htmlBody,
        });
        console.log(`[auth] Password reset email sent to ${user.email}`);
      } catch (e) {
        console.error("[auth] Failed to send password reset email:", e);
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
          // Mirror every new sign-up (email OR social/Google) into our custom users table
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              await db
                .insert(schema.users)
                .values({
                  id: user.id,
                  name: user.name || user.email,
                  email: user.email,
                  profilePhoto: (user as any).image ?? null,
                  role: "customer",
                  isActive: true,
                })
                .onConflictDoNothing();
              break; // success
            } catch (err) {
              console.error(`[auth hook] attempt ${attempt + 1} failed:`, err);
              if (attempt < 2) await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
            }
          }
        },
      },
      update: {
        after: async (user) => {
          // Keep name/email/photo in sync if user updates their profile
          try {
            const updates: Record<string, any> = { updatedAt: new Date() };
            if (user.name) updates.name = user.name;
            if (user.email) updates.email = user.email;
            if ((user as any).image !== undefined) updates.profilePhoto = (user as any).image ?? null;
            await db.update(schema.users).set(updates).where(eq(schema.users.id, user.id)).catch(() => {});
          } catch { /* ignore */ }
        },
      },
    },
  },
});
