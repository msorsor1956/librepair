import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { db } from "../database";
import { users } from "../database/schema";
import { user as authUser, account, session as authSession } from "../database/auth-schema";
import { eq } from "drizzle-orm";
import { auth } from "../auth";

// ---------------------------------------------------------------------------
// Firebase Admin – verify ID tokens issued after client-side phone sign-in
// ---------------------------------------------------------------------------
import * as admin from "firebase-admin";

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) return admin.apps[0]!;
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID ?? "librepair-77afa",
      // Service-account key fields – fall back to undefined so the SDK
      // initialises without SMS capabilities when not configured.
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key env var uses \n literals – replace them.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    } as admin.ServiceAccount),
  });
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const adminApp = getAdminApp();
    return await admin.auth(adminApp).verifyIdToken(idToken);
  } catch (e) {
    console.error("[firebase-admin] verifyIdToken failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper – create or fetch our user record from a verified phone number
// ---------------------------------------------------------------------------
async function upsertPhoneUser(
  phone: string,
  firebaseUid: string,
  displayName?: string
) {
  const normalizedPhone = phone.replace(/[\s\-()]/g, "");
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);

  if (existing.length > 0) {
    return { user: existing[0], action: "signin" as const };
  }

  const name = displayName ?? "LIBrepair Customer";
  const newId = crypto.randomUUID();
  const email = `phone_${normalizedPhone.replace("+", "")}@librepair.placeholder`;

  await db
    .insert(authUser)
    .values({
      id: newId,
      name,
      email,
      emailVerified: true, // phone-verified ≈ verified
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  await db
    .insert(users)
    .values({ id: newId, name, phone: normalizedPhone, email, role: "customer" })
    .onConflictDoNothing();

  await db
    .insert(account)
    .values({
      id: crypto.randomUUID(),
      accountId: firebaseUid,
      providerId: "firebase-phone",
      userId: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  const newUser = await db
    .select()
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);
  return { user: newUser[0], action: "signup" as const };
}

// ---------------------------------------------------------------------------
// Helper – create a Better Auth session manually
// ---------------------------------------------------------------------------
async function createBetterAuthSession(userId: string) {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(authSession).values({
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  }).onConflictDoNothing();

  return { token, expiresAt };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
export const phoneAuthRouter = new Hono()
  // ------------------------------------------------------------------
  // POST /api/phone-auth/firebase-verify
  // Called after the client completes Firebase phone sign-in and gets
  // a Firebase ID token. We verify it server-side and create a session.
  // ------------------------------------------------------------------
  .post("/firebase-verify", async (c) => {
    const body = await c.req.json<{
      idToken: string;
      phone: string;
      firstName?: string;
      lastName?: string;
    }>();

    const { idToken, phone, firstName, lastName } = body;

    if (!idToken || !phone) {
      return c.json({ error: "idToken and phone are required" }, 400);
    }

    // 1. Verify Firebase token
    const decoded = await verifyFirebaseIdToken(idToken);
    if (!decoded) {
      return c.json({ error: "Invalid or expired Firebase token" }, 401);
    }

    // 2. Upsert our user
    const displayName =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : firstName ?? undefined;
    const { user, action } = await upsertPhoneUser(phone, decoded.uid, displayName);

    // 3. Create Better Auth session
    const { token, expiresAt } = await createBetterAuthSession(user.id);

    // 4. Set session cookie (same name Better Auth uses)
    setCookie(c, "better-auth.session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      expires: expiresAt,
      path: "/",
    });

    return c.json({
      success: true,
      action,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
      sessionToken: token,
    });
  })

  // ------------------------------------------------------------------
  // Kept for backward-compat / dev fallback: returns 410 Gone
  // ------------------------------------------------------------------
  .post("/send-otp", (c) =>
    c.json({ error: "Server OTP deprecated. Use Firebase client-side auth." }, 410)
  )
  .post("/verify-otp", (c) =>
    c.json({ error: "Server OTP deprecated. Use /firebase-verify." }, 410)
  )
  .post("/resend-otp", (c) =>
    c.json({ error: "Server OTP deprecated. Use Firebase client-side auth." }, 410)
  );
