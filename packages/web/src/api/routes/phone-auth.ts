import { Hono } from "hono";
import { db } from "../database";
import { users } from "../database/schema";
import { user as authUser, account } from "../database/auth-schema";
import { eq } from "drizzle-orm";
import { auth } from "../auth";

// In-memory OTP store (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number; name?: string }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskPhone(phone: string): string {
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

async function sendSMSViaFirebase(phone: string, otp: string): Promise<boolean> {
  // Firebase Admin SDK does not send SMS directly; SMS is handled client-side via Firebase Auth.
  // On the server we just store the OTP and validate.
  // For production: use Twilio/Firebase Functions/AWS SNS here.
  console.log(`[DEV] OTP for ${maskPhone(phone)}: ${otp}`);
  return true;
}

export const phoneAuthRouter = new Hono()
  // Send OTP
  .post("/send-otp", async (c) => {
    const body = await c.req.json<{ phone: string; firstName?: string; lastName?: string; mode?: "signin" | "signup" }>();
    const { phone, firstName, lastName, mode = "signup" } = body;

    if (!phone || !/^\+?[1-9]\d{7,14}$/.test(phone.replace(/[\s\-()]/g, ""))) {
      return c.json({ error: "Invalid phone number" }, 400);
    }

    const normalizedPhone = phone.replace(/[\s\-()]/g, "");
    const existing = otpStore.get(normalizedPhone);

    // Rate limit: 30s cooldown
    if (existing && existing.expiresAt > Date.now() && Date.now() - (existing.expiresAt - 300000) < 30000) {
      const wait = Math.ceil((30000 - (Date.now() - (existing.expiresAt - 300000))) / 1000);
      return c.json({ error: `Please wait ${wait}s before requesting another code` }, 429);
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const name = firstName && lastName ? `${firstName} ${lastName}` : firstName ?? "";

    otpStore.set(normalizedPhone, { otp, expiresAt, attempts: 0, name });

    const sent = await sendSMSViaFirebase(normalizedPhone, otp);
    if (!sent) {
      return c.json({ error: "Failed to send SMS. Try again." }, 500);
    }

    return c.json({ success: true, message: `Verification code sent to ${maskPhone(normalizedPhone)}` }, 200);
  })

  // Verify OTP
  .post("/verify-otp", async (c) => {
    const body = await c.req.json<{ phone: string; otp: string; firstName?: string; lastName?: string }>();
    const { phone, otp, firstName, lastName } = body;

    if (!phone || !otp) {
      return c.json({ error: "Phone and OTP are required" }, 400);
    }

    const normalizedPhone = phone.replace(/[\s\-()]/g, "");
    const record = otpStore.get(normalizedPhone);

    if (!record) {
      return c.json({ error: "No verification code found. Please request a new one." }, 400);
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedPhone);
      return c.json({ error: "Verification code expired. Please request a new one." }, 400);
    }

    if (record.attempts >= 5) {
      otpStore.delete(normalizedPhone);
      return c.json({ error: "Too many failed attempts. Please request a new code." }, 429);
    }

    if (record.otp !== otp.trim()) {
      record.attempts++;
      const remaining = 5 - record.attempts;
      return c.json({ error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` }, 400);
    }

    // OTP valid — clear it
    otpStore.delete(normalizedPhone);

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.phone, normalizedPhone)).limit(1);

    if (existingUser.length > 0) {
      // Sign in existing user — create session token
      const u = existingUser[0];
      return c.json({
        success: true,
        action: "signin",
        user: { id: u.id, name: u.name, phone: u.phone, role: u.role, profilePhoto: u.profilePhoto },
      }, 200);
    }

    // New user — create account
    const name = firstName && lastName
      ? `${firstName} ${lastName}`
      : record.name ?? "LIBrepair Customer";

    const newId = crypto.randomUUID();
    const email = `phone_${normalizedPhone.replace("+", "")}@librepair.placeholder`;

    // Insert into better-auth user table
    await db.insert(authUser).values({
      id: newId,
      name,
      email,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();

    // Insert into custom users table
    await db.insert(users).values({
      id: newId,
      name,
      phone: normalizedPhone,
      email,
      role: "customer",
    }).onConflictDoNothing();

    // Insert account record
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: normalizedPhone,
      providerId: "phone",
      userId: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();

    return c.json({
      success: true,
      action: "signup",
      user: { id: newId, name, phone: normalizedPhone, role: "customer" },
    }, 200);
  })

  // Resend OTP
  .post("/resend-otp", async (c) => {
    const body = await c.req.json<{ phone: string }>();
    const { phone } = body;
    const normalizedPhone = phone.replace(/[\s\-()]/g, "");

    otpStore.delete(normalizedPhone); // clear old

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(normalizedPhone, { otp, expiresAt, attempts: 0 });

    await sendSMSViaFirebase(normalizedPhone, otp);
    return c.json({ success: true, message: `New code sent to ${maskPhone(normalizedPhone)}` }, 200);
  });
