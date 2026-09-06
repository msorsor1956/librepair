import type { DecodedIdToken } from "firebase-admin/auth";
import { and, eq, or } from "drizzle-orm";
import { db } from "./database";
import { notifications, users } from "./database/schema";

function tokenEmail(token: DecodedIdToken) {
  return typeof token.email === "string" ? token.email.toLowerCase() : undefined;
}

function tokenPhone(token: DecodedIdToken) {
  return typeof token.phone_number === "string" ? token.phone_number.replace(/[\s\-()]/g, "") : undefined;
}

export async function findOrCreateApplicationUser(token: DecodedIdToken) {
  const email = tokenEmail(token);
  const phone = tokenPhone(token);

  let [existing] = await db.select().from(users).where(eq(users.firebaseUid, token.uid)).limit(1);
  if (!existing && (email || phone)) {
    const candidates = [
      email ? eq(users.email, email) : undefined,
      phone ? eq(users.phone, phone) : undefined,
    ].filter(Boolean) as any[];
    [existing] = await db.select().from(users).where(candidates.length === 1 ? candidates[0] : or(...candidates)).limit(1);
  }

  if (existing) {
    const updates: Record<string, unknown> = { firebaseUid: token.uid, updatedAt: new Date() };
    if (token.name) updates.name = token.name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (token.picture) updates.profilePhoto = token.picture;
    if (existing.role === "admin") {
      updates.approvalStatus = "approved";
      updates.approvedAt = existing.approvedAt ?? new Date();
    }
    const [updated] = await db.update(users).set(updates).where(eq(users.id, existing.id)).returning();
    return { user: updated, created: false };
  }

  const fallbackEmail = email ?? `phone_${token.uid}@firebase.librepair.invalid`;
  const [created] = await db.insert(users).values({
    id: token.uid,
    firebaseUid: token.uid,
    name: token.name || phone || email || "LIBrepair Customer",
    email: fallbackEmail,
    phone: phone ?? null,
    profilePhoto: token.picture ?? null,
    role: "customer",
    isActive: true,
    approvalStatus: "pending",
  }).returning();

  const admins = await db.select({ id: users.id }).from(users).where(and(eq(users.role, "admin"), eq(users.isActive, true)));
  if (admins.length) {
    await db.insert(notifications).values(admins.map((admin) => ({
      userId: admin.id,
      title: "Account approval requested",
      message: `${created.name} (${email ?? phone ?? token.uid}) registered and is waiting for approval.`,
      type: "system" as const,
    })));
  }

  return { user: created, created: true };
}
