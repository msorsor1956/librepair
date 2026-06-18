import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";
import { auth } from "../auth";
import Stripe from "stripe";
import { execSync } from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", { apiVersion: "2025-05-28.basil" });

const SUPER_ADMIN_EMAILS = ["m.sorsor@sonnietech.com", "sonnietechnologyllc@gmail.com"];

// ── Super Admin Guard ──────────────────────────────────────────────────────
async function requireSuperAdmin(c: any, next: any) {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  const [dbUser] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!dbUser) return c.json({ message: "Unauthorized" }, 401);
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(dbUser.email) || dbUser.role === "admin";
  if (!isSuperAdmin) return c.json({ message: "Super admin only" }, 403);
  return next();
}

export const superAdminRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)

  /* ══════════════════════════════════════════════════
     SYNC AUTH USERS → CUSTOM USERS TABLE
     Call this anytime to fix missing Google/social signups
  ══════════════════════════════════════════════════ */
  .post("/sync-users", requireAuth, requireSuperAdmin, async (c) => {
    // Grab all better-auth users via raw SQL
    const { sql } = await import("drizzle-orm");
    const baUsers = await db.run(sql`SELECT id, name, email, image FROM user`);
    const rows = (baUsers as any).rows ?? [];
    const existingUsers = await db.select({ id: schema.users.id }).from(schema.users);
    const existingIds = new Set(existingUsers.map(u => u.id));
    let synced = 0;
    for (const row of rows) {
      const id = row.id ?? row[0];
      const name = row.name ?? row[1] ?? "";
      const email = row.email ?? row[2] ?? "";
      const image = row.image ?? row[3] ?? null;
      if (!existingIds.has(id)) {
        try {
          await db.insert(schema.users).values({ id, name: name || email, email, profilePhoto: image, role: "customer", isActive: true }).onConflictDoNothing();
          synced++;
        } catch { /* ignore */ }
      }
    }
    const total = await db.select({ id: schema.users.id }).from(schema.users);
    return c.json({ synced, total: total.length, message: `Synced ${synced} missing users. Total users: ${total.length}` }, 200);
  })

  /* ══════════════════════════════════════════════════
     STATS DASHBOARD
  ══════════════════════════════════════════════════ */
  .get("/stats", requireAuth, requireSuperAdmin, async (c) => {
    const [users, vehicles, appointments, payments, inventory, announcements] = await Promise.all([
      db.select().from(schema.users),
      db.select().from(schema.vehicles),
      db.select().from(schema.appointments),
      db.select().from(schema.payments),
      db.select().from(schema.carInventory),
      db.select().from(schema.announcements),
    ]);

    const totalRevenue = payments
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);

    const pendingRevenue = payments
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);

    return c.json({
      users: {
        total: users.length,
        customers: users.filter(u => u.role === "customer").length,
        mechanics: users.filter(u => u.role === "mechanic").length,
        admins: users.filter(u => u.role === "admin").length,
        dispatchers: users.filter(u => u.role === "dispatcher").length,
        active: users.filter(u => u.isActive).length,
      },
      appointments: {
        total: appointments.length,
        pending: appointments.filter(a => a.status === "pending").length,
        confirmed: appointments.filter(a => a.status === "confirmed").length,
        inProgress: appointments.filter(a => a.status === "in-progress").length,
        completed: appointments.filter(a => a.status === "completed").length,
        cancelled: appointments.filter(a => a.status === "cancelled").length,
      },
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
        payments: payments.length,
      },
      inventory: {
        total: inventory.length,
        available: inventory.filter(i => i.status === "available").length,
        sold: inventory.filter(i => i.status === "sold").length,
        reserved: inventory.filter(i => i.status === "reserved").length,
        featured: inventory.filter(i => i.featured).length,
      },
      vehicles: vehicles.length,
      announcements: {
        total: announcements.length,
        active: announcements.filter(a => a.active).length,
      },
    }, 200);
  })

  /* ══════════════════════════════════════════════════
     USER MANAGEMENT
  ══════════════════════════════════════════════════ */

  // Get all users with optional role filter
  .get("/users", requireAuth, requireSuperAdmin, async (c) => {
    const role = c.req.query("role");
    let query = db.select().from(schema.users);
    const rows = role
      ? await db.select().from(schema.users).where(eq(schema.users.role, role as any))
      : await db.select().from(schema.users);
    return c.json({ users: rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)) }, 200);
  })

  // Get single user
  .get("/users/:id", requireAuth, requireSuperAdmin, async (c) => {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, c.req.param("id")));
    if (!user) return c.json({ message: "Not found" }, 404);
    return c.json(user, 200);
  })

  // Create user with role
  .post("/users", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.email || !body.name) return c.json({ message: "name and email required" }, 400);

    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, body.email));
    if (existing) return c.json({ message: "Email already registered" }, 409);

    const role = body.role ?? "customer";

    // Generate a secure random temp password (user will be prompted to change it)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    const tempPassword = Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

    const signupResult = await auth.api.signUpEmail({
      body: { email: body.email, password: tempPassword, name: body.name },
    });
    if (!signupResult?.user?.id) return c.json({ message: "Failed to create auth user" }, 500);

    const [updated] = await db.update(schema.users).set({
      phone: body.phone ?? null,
      address: body.address ?? null,
      role: role,
      updatedAt: new Date(),
    }).where(eq(schema.users.id, signupResult.user.id)).returning();

    // Save in-app notification
    await db.insert(schema.notifications).values({
      userId: signupResult.user.id,
      title: "Welcome to LIBrepair!",
      message: `Your account has been created as ${role}. Please check your email to set your password.`,
      type: "system",
    });

    const frontendUrl = process.env.VITE_FRONTEND_URL ?? "https://librepair.wasmer.app";
    const sendEmail = body.sendEmail !== false; // default true
    const sendSms = body.sendSms === true && !!body.phone;
    let emailSent = false;
    let smsSent = false;

    // --- Send password-set email via better-auth reset flow ---
    if (sendEmail) {
      try {
        await auth.api.requestPasswordReset({
          body: {
            email: body.email,
            redirectTo: `${frontendUrl}/reset-password`,
          },
        });
        emailSent = true;
      } catch (e) {
        console.error("Failed to send password reset email:", e);
      }
    }

    // --- Send SMS via connector (Twilio) ---
    if (sendSms && body.phone) {
      try {
        const phone = body.phone.replace(/\D/g, "");
        const e164 = phone.startsWith("1") ? `+${phone}` : `+1${phone}`;
        execSync(
          `connector run twilio send_sms --to ${JSON.stringify(e164)} --body ${JSON.stringify(
            `Hi ${body.name}! Your LIBrepair account has been created. Check your email (${body.email}) for a link to set your password. Questions? Reply STOP to opt out.`
          )}`,
          { stdio: "ignore", timeout: 15000 }
        );
        smsSent = true;
      } catch (e) {
        console.error("Failed to send SMS:", e);
      }
    }

    return c.json({
      user: updated,
      emailSent,
      smsSent,
      message: emailSent
        ? "User created. Password-set email sent."
        : "User created. Email delivery skipped.",
    }, 201);
  })

  // Send password reset email to existing user
  .post("/users/:id/reset-password", requireAuth, requireSuperAdmin, async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    if (!user) return c.json({ message: "User not found" }, 404);

    const frontendUrl = process.env.VITE_FRONTEND_URL ?? "https://librepair.wasmer.app";
    let emailSent = false;
    let smsSent = false;

    // Send email
    try {
      await auth.api.requestPasswordReset({
        body: {
          email: user.email,
          redirectTo: `${frontendUrl}/reset-password`,
        },
      });
      emailSent = true;
    } catch (e) {
      console.error("Failed to send reset email:", e);
    }

    // Send SMS if requested
    if (body.sendSms && user.phone) {
      try {
        const phone = user.phone.replace(/\D/g, "");
        const e164 = phone.startsWith("1") ? `+${phone}` : `+1${phone}`;
        execSync(
          `connector run twilio send_sms --to ${JSON.stringify(e164)} --body ${JSON.stringify(
            `Hi ${user.name}! A password reset link has been sent to ${user.email}. Check your email to set a new password.`
          )}`,
          { stdio: "ignore", timeout: 15000 }
        );
        smsSent = true;
      } catch (e) {
        console.error("Failed to send SMS:", e);
      }
    }

    return c.json({ emailSent, smsSent, message: emailSent ? "Password reset email sent." : "Failed to send email." }, 200);
  })

  // Update user (role, profile, activate/deactivate)
  .patch("/users/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const allowed = ["name", "phone", "address", "role", "isActive"] as const;
    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const [updated] = await db.update(schema.users).set(updates).where(eq(schema.users.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  // Delete / hard delete user
  .delete("/users/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = c.req.param("id");
    await db.update(schema.users).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.users.id, id));
    return c.json({ success: true }, 200);
  })

  // Change user role
  .post("/users/:id/role", requireAuth, requireSuperAdmin, async (c) => {
    const id = c.req.param("id");
    const { role } = await c.req.json<{ role: string }>();
    const validRoles = ["customer", "mechanic", "admin", "dispatcher"];
    if (!validRoles.includes(role)) return c.json({ message: "Invalid role" }, 400);
    const [updated] = await db.update(schema.users).set({ role: role as any, updatedAt: new Date() }).where(eq(schema.users.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);

    await db.insert(schema.notifications).values({
      userId: id,
      title: "Account Role Updated",
      message: `Your account role has been updated to: ${role}.`,
      type: "system",
    });

    return c.json(updated, 200);
  })

  /* ══════════════════════════════════════════════════
     PAYMENTS MANAGEMENT
  ══════════════════════════════════════════════════ */

  // Get all payments (with customer info)
  .get("/payments", requireAuth, requireSuperAdmin, async (c) => {
    const rows = await db
      .select({
        id: schema.payments.id,
        appointmentId: schema.payments.appointmentId,
        customerId: schema.payments.customerId,
        customerName: schema.users.name,
        customerEmail: schema.users.email,
        amount: schema.payments.amount,
        method: schema.payments.method,
        status: schema.payments.status,
        type: schema.payments.type,
        transactionId: schema.payments.transactionId,
        notes: schema.payments.notes,
        createdAt: schema.payments.createdAt,
        serviceName: schema.services.name,
        appointmentStatus: schema.appointments.status,
        scheduledAt: schema.appointments.scheduledAt,
      })
      .from(schema.payments)
      .leftJoin(schema.users, eq(schema.payments.customerId, schema.users.id))
      .leftJoin(schema.appointments, eq(schema.payments.appointmentId, schema.appointments.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .orderBy(desc(schema.payments.createdAt));
    return c.json({ payments: rows }, 200);
  })

  // Add manual payment
  .post("/payments", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.customerId || !body.amount || !body.method) {
      return c.json({ message: "customerId, amount, method required" }, 400);
    }
    const [payment] = await db.insert(schema.payments).values({
      appointmentId: body.appointmentId ? Number(body.appointmentId) : null,
      customerId: body.customerId,
      amount: Number(body.amount),
      method: body.method,
      status: body.status ?? "pending",
      type: body.type ?? "full",
      transactionId: body.transactionId ?? null,
      notes: body.notes ?? null,
    }).returning();

    await db.insert(schema.notifications).values({
      userId: body.customerId,
      title: "Payment Recorded",
      message: `A payment of $${Number(body.amount).toFixed(2)} has been recorded for your account.`,
      type: "payment",
    });

    return c.json(payment, 201);
  })

  // Update payment
  .patch("/payments/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.method !== undefined) updates.method = body.method;
    if (body.transactionId !== undefined) updates.transactionId = body.transactionId;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.amount !== undefined) updates.amount = Number(body.amount);

    const [updated] = await db.update(schema.payments).set(updates).where(eq(schema.payments.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);

    await db.insert(schema.notifications).values({
      userId: updated.customerId,
      title: "Payment Status Updated",
      message: `Your payment of $${updated.amount.toFixed(2)} is now ${updated.status}.`,
      type: "payment",
    });

    return c.json(updated, 200);
  })

  // Delete payment
  .delete("/payments/:id", requireAuth, requireSuperAdmin, async (c) => {
    await db.delete(schema.payments).where(eq(schema.payments.id, Number(c.req.param("id"))));
    return c.json({ success: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     NOTIFICATIONS — SEND TO CUSTOMERS
  ══════════════════════════════════════════════════ */

  // Broadcast: all users, specific role, or specific userId
  .post("/notify", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json<{
      title: string;
      message: string;
      type?: string;
      target: "all" | "role" | "user";
      role?: string;
      userId?: string;
    }>();

    if (!body.title || !body.message || !body.target) {
      return c.json({ message: "title, message, target required" }, 400);
    }

    let targetUsers: { id: string }[] = [];

    if (body.target === "all") {
      targetUsers = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.isActive, true));
    } else if (body.target === "role" && body.role) {
      targetUsers = await db.select({ id: schema.users.id }).from(schema.users)
        .where(and(eq(schema.users.role, body.role as any), eq(schema.users.isActive, true)));
    } else if (body.target === "user" && body.userId) {
      targetUsers = [{ id: body.userId }];
    } else {
      return c.json({ message: "Invalid target configuration" }, 400);
    }

    if (targetUsers.length === 0) return c.json({ message: "No users matched", sent: 0 }, 200);

    const notifType = (["appointment", "payment", "reminder", "system", "promotion"].includes(body.type ?? ""))
      ? body.type as any
      : "system";

    await db.insert(schema.notifications).values(
      targetUsers.map(u => ({
        userId: u.id,
        title: body.title,
        message: body.message,
        type: notifType,
      }))
    );

    return c.json({ success: true, sent: targetUsers.length }, 200);
  })

  /* ══════════════════════════════════════════════════
     INVENTORY MANAGEMENT (proxy / full access)
  ══════════════════════════════════════════════════ */

  /* ══════════════════════════════════════════════════
     INVENTORY IMAGE UPLOAD → Cloudflare R2
  ══════════════════════════════════════════════════ */
  .post("/inventory/upload-image", requireAuth, requireSuperAdmin, async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return c.json({ message: "No file provided" }, 400);

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ message: "Only JPG, PNG, and WebP images are allowed" }, 400);
    }
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ message: "File too large. Max 10MB." }, 400);
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const key = `inventory/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
      // ACL not supported on R2
    }));

    // Build public URL
    // S3_PUBLIC_URL can be a custom domain or the R2 public bucket URL
    const base = (process.env.S3_PUBLIC_URL ?? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}`).replace(/\/$/, "");
    const publicUrl = `${base}/${key}`;

    return c.json({ url: publicUrl, key }, 200);
  })

  .get("/inventory", requireAuth, requireSuperAdmin, async (c) => {
    const rows = await db.select().from(schema.carInventory).orderBy(desc(schema.carInventory.createdAt));
    return c.json({ listings: rows.map(parsePhotos) }, 200);
  })

  .post("/inventory", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.title || !body.make || !body.model || !body.year || !body.price) {
      return c.json({ message: "title, make, model, year, price required" }, 400);
    }
    // Auto-generate 6-digit stock number: "LR" + 4 random digits  e.g. LR8472
    const stockNumber = "LR" + Math.floor(1000 + Math.random() * 9000).toString();
    // Auto-generate 9-char inventory ID: "LR-" + 6 random digits  e.g. LR-482930
    const inventoryId = "LR-" + Math.floor(100000 + Math.random() * 900000).toString();
    const [created] = await db.insert(schema.carInventory).values({
      stockNumber,
      inventoryId,
      title: body.title,
      make: body.make,
      model: body.model,
      year: Number(body.year),
      price: Number(body.price),
      mileage: body.mileage ? Number(body.mileage) : 0,
      color: body.color ?? null,
      condition: body.condition ?? "good",
      description: body.description ?? null,
      videoUrl: body.videoUrl ?? null,
      photos: Array.isArray(body.photos) ? JSON.stringify(body.photos) : "[]",
      contactPhone: body.contactPhone ?? null,
      contactEmail: body.contactEmail ?? null,
      status: body.status ?? "available",
      featured: body.featured ?? false,
    }).returning();
    return c.json(parsePhotos(created), 201);
  })

  .patch("/inventory/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = { updatedAt: new Date() };
    const fields = ["title","make","model","color","condition","description","videoUrl","contactPhone","contactEmail","status"] as const;
    for (const f of fields) if (body[f] !== undefined) updates[f] = body[f];
    if (body.year !== undefined) updates.year = Number(body.year);
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.mileage !== undefined) updates.mileage = Number(body.mileage);
    if (body.featured !== undefined) updates.featured = body.featured;
    if (body.published !== undefined) updates.published = body.published;
    if (body.photos !== undefined) updates.photos = Array.isArray(body.photos) ? JSON.stringify(body.photos) : body.photos;
    const [updated] = await db.update(schema.carInventory).set(updates).where(eq(schema.carInventory.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(parsePhotos(updated), 200);
  })

  .delete("/inventory/:id", requireAuth, requireSuperAdmin, async (c) => {
    const [deleted] = await db.delete(schema.carInventory).where(eq(schema.carInventory.id, Number(c.req.param("id")))).returning();
    if (!deleted) return c.json({ message: "Not found" }, 404);
    return c.json({ success: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     ANNOUNCEMENTS — PUSH TO FRONTEND
  ══════════════════════════════════════════════════ */

  .get("/announcements", requireAuth, requireSuperAdmin, async (c) => {
    const rows = await db.select().from(schema.announcements).orderBy(desc(schema.announcements.createdAt));
    return c.json({ announcements: rows }, 200);
  })

  .post("/announcements", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.title || !body.message) return c.json({ message: "title and message required" }, 400);
    const [created] = await db.insert(schema.announcements).values({
      title: body.title,
      message: body.message,
      type: body.type ?? "info",
      active: body.active ?? true,
      link: body.link ?? null,
      linkLabel: body.linkLabel ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    }).returning();
    return c.json(created, 201);
  })

  .patch("/announcements/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = {};
    ["title","message","type","active","link","linkLabel"].forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    if (body.expiresAt !== undefined) updates.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const [updated] = await db.update(schema.announcements).set(updates).where(eq(schema.announcements.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  .delete("/announcements/:id", requireAuth, requireSuperAdmin, async (c) => {
    await db.delete(schema.announcements).where(eq(schema.announcements.id, Number(c.req.param("id"))));
    return c.json({ success: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     APPOINTMENTS READ (for overview)
  ══════════════════════════════════════════════════ */

  .get("/appointments", requireAuth, requireSuperAdmin, async (c) => {
    const rows = await db
      .select({
        id: schema.appointments.id,
        status: schema.appointments.status,
        serviceType: schema.appointments.serviceType,
        scheduledAt: schema.appointments.scheduledAt,
        completedAt: schema.appointments.completedAt,
        totalCost: schema.appointments.totalCost,
        notes: schema.appointments.notes,
        stripePaymentLinkId: schema.appointments.stripePaymentLinkId,
        stripePaymentUrl: schema.appointments.stripePaymentUrl,
        calendarEventId: schema.appointments.calendarEventId,
        calendarEventUrl: schema.appointments.calendarEventUrl,
        customerName: schema.users.name,
        customerEmail: schema.users.email,
        customerId: schema.appointments.customerId,
        serviceName: schema.services.name,
        vehicleMake: schema.vehicles.make,
        vehicleModel: schema.vehicles.model,
        vehicleYear: schema.vehicles.year,
      })
      .from(schema.appointments)
      .leftJoin(schema.users, eq(schema.appointments.customerId, schema.users.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .leftJoin(schema.vehicles, eq(schema.appointments.vehicleId, schema.vehicles.id))
      .orderBy(desc(schema.appointments.scheduledAt))
      .limit(200);
    return c.json({ appointments: rows }, 200);
  })

  /* ══════════════════════════════════════════════════
     VEHICLES — FULL CRUD
  ══════════════════════════════════════════════════ */
  .get("/vehicles", requireAuth, requireSuperAdmin, async (c) => {
    const userId = c.req.query("userId");
    const rows = await db
      .select({
        id: schema.vehicles.id,
        userId: schema.vehicles.userId,
        ownerName: schema.users.name,
        ownerEmail: schema.users.email,
        make: schema.vehicles.make,
        model: schema.vehicles.model,
        year: schema.vehicles.year,
        vin: schema.vehicles.vin,
        licensePlate: schema.vehicles.licensePlate,
        color: schema.vehicles.color,
        mileage: schema.vehicles.mileage,
        lastServiceDate: schema.vehicles.lastServiceDate,
        createdAt: schema.vehicles.createdAt,
      })
      .from(schema.vehicles)
      .leftJoin(schema.users, eq(schema.vehicles.userId, schema.users.id))
      .where(userId ? eq(schema.vehicles.userId, userId) : undefined as any)
      .orderBy(desc(schema.vehicles.createdAt));
    return c.json({ vehicles: rows }, 200);
  })

  .post("/vehicles", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.userId || !body.make || !body.model || !body.year) {
      return c.json({ message: "userId, make, model, year required" }, 400);
    }
    const [created] = await db.insert(schema.vehicles).values({
      userId: body.userId,
      make: body.make,
      model: body.model,
      year: Number(body.year),
      vin: body.vin ?? null,
      licensePlate: body.licensePlate ?? null,
      color: body.color ?? null,
      mileage: body.mileage ? Number(body.mileage) : 0,
    }).returning();
    return c.json(created, 201);
  })

  .patch("/vehicles/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = {};
    ["make","model","vin","licensePlate","color"].forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    if (body.year !== undefined) updates.year = Number(body.year);
    if (body.mileage !== undefined) updates.mileage = Number(body.mileage);
    if (body.lastServiceDate !== undefined) updates.lastServiceDate = body.lastServiceDate ? new Date(body.lastServiceDate) : null;
    const [updated] = await db.update(schema.vehicles).set(updates).where(eq(schema.vehicles.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  .delete("/vehicles/:id", requireAuth, requireSuperAdmin, async (c) => {
    await db.delete(schema.vehicles).where(eq(schema.vehicles.id, Number(c.req.param("id"))));
    return c.json({ success: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     SERVICES — FULL CRUD
  ══════════════════════════════════════════════════ */
  .get("/services", requireAuth, requireSuperAdmin, async (c) => {
    const rows = await db.select().from(schema.services).orderBy(schema.services.category, schema.services.name);
    return c.json({ services: rows }, 200);
  })

  .post("/services", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.name || !body.category || body.basePrice === undefined) {
      return c.json({ message: "name, category, basePrice required" }, 400);
    }
    const [created] = await db.insert(schema.services).values({
      name: body.name,
      description: body.description ?? null,
      category: body.category,
      basePrice: Number(body.basePrice),
      durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : 60,
      isActive: body.isActive !== false,
    }).returning();
    return c.json(created, 201);
  })

  .patch("/services/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = {};
    ["name","description","category"].forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    if (body.basePrice !== undefined) updates.basePrice = Number(body.basePrice);
    if (body.durationMinutes !== undefined) updates.durationMinutes = Number(body.durationMinutes);
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    const [updated] = await db.update(schema.services).set(updates).where(eq(schema.services.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  .delete("/services/:id", requireAuth, requireSuperAdmin, async (c) => {
    await db.delete(schema.services).where(eq(schema.services.id, Number(c.req.param("id"))));
    return c.json({ success: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     MECHANICS — FULL CRUD
  ══════════════════════════════════════════════════ */
  .get("/mechanics", requireAuth, requireSuperAdmin, async (c) => {
    const rows = await db
      .select({
        id: schema.mechanics.id,
        userId: schema.mechanics.userId,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        specializations: schema.mechanics.specializations,
        rating: schema.mechanics.rating,
        totalJobs: schema.mechanics.totalJobs,
        isAvailable: schema.mechanics.isAvailable,
        bio: schema.mechanics.bio,
        createdAt: schema.mechanics.createdAt,
      })
      .from(schema.mechanics)
      .leftJoin(schema.users, eq(schema.mechanics.userId, schema.users.id))
      .orderBy(desc(schema.mechanics.createdAt));
    return c.json({ mechanics: rows }, 200);
  })

  .post("/mechanics", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.userId) return c.json({ message: "userId required" }, 400);
    // Ensure user exists and has mechanic role
    await db.update(schema.users).set({ role: "mechanic", updatedAt: new Date() }).where(eq(schema.users.id, body.userId));
    const [created] = await db.insert(schema.mechanics).values({
      userId: body.userId,
      specializations: body.specializations ?? null,
      rating: body.rating ? Number(body.rating) : 5.0,
      totalJobs: 0,
      isAvailable: body.isAvailable !== false,
      bio: body.bio ?? null,
    }).returning();
    return c.json(created, 201);
  })

  .patch("/mechanics/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = {};
    ["specializations","bio"].forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    if (body.rating !== undefined) updates.rating = Number(body.rating);
    if (body.totalJobs !== undefined) updates.totalJobs = Number(body.totalJobs);
    if (body.isAvailable !== undefined) updates.isAvailable = body.isAvailable;
    const [updated] = await db.update(schema.mechanics).set(updates).where(eq(schema.mechanics.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  .delete("/mechanics/:id", requireAuth, requireSuperAdmin, async (c) => {
    await db.delete(schema.mechanics).where(eq(schema.mechanics.id, Number(c.req.param("id"))));
    return c.json({ success: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     REVIEWS — VIEW + DELETE
  ══════════════════════════════════════════════════ */
  .get("/reviews", requireAuth, requireSuperAdmin, async (c) => {
    const rows = await db
      .select({
        id: schema.reviews.id,
        rating: schema.reviews.rating,
        comment: schema.reviews.comment,
        createdAt: schema.reviews.createdAt,
        appointmentId: schema.reviews.appointmentId,
        customerId: schema.reviews.customerId,
        customerName: schema.users.name,
        mechanicId: schema.reviews.mechanicId,
      })
      .from(schema.reviews)
      .leftJoin(schema.users, eq(schema.reviews.customerId, schema.users.id))
      .orderBy(desc(schema.reviews.createdAt));
    return c.json({ reviews: rows }, 200);
  })

  .delete("/reviews/:id", requireAuth, requireSuperAdmin, async (c) => {
    await db.delete(schema.reviews).where(eq(schema.reviews.id, Number(c.req.param("id"))));
    return c.json({ success: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     REMINDERS — VIEW + EDIT
  ══════════════════════════════════════════════════ */
  .get("/reminders", requireAuth, requireSuperAdmin, async (c) => {
    const rows = await db
      .select({
        id: schema.reminders.id,
        type: schema.reminders.type,
        dueDate: schema.reminders.dueDate,
        dueMileage: schema.reminders.dueMileage,
        isCompleted: schema.reminders.isCompleted,
        message: schema.reminders.message,
        createdAt: schema.reminders.createdAt,
        userId: schema.reminders.userId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        vehicleId: schema.reminders.vehicleId,
        vehicleMake: schema.vehicles.make,
        vehicleModel: schema.vehicles.model,
        vehicleYear: schema.vehicles.year,
      })
      .from(schema.reminders)
      .leftJoin(schema.users, eq(schema.reminders.userId, schema.users.id))
      .leftJoin(schema.vehicles, eq(schema.reminders.vehicleId, schema.vehicles.id))
      .orderBy(desc(schema.reminders.createdAt));
    return c.json({ reminders: rows }, 200);
  })

  .post("/reminders", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.userId || !body.type) return c.json({ message: "userId and type required" }, 400);
    const [created] = await db.insert(schema.reminders).values({
      userId: body.userId,
      vehicleId: body.vehicleId ? Number(body.vehicleId) : null,
      type: body.type,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      dueMileage: body.dueMileage ? Number(body.dueMileage) : null,
      isCompleted: false,
      message: body.message ?? null,
    }).returning();
    return c.json(created, 201);
  })

  .patch("/reminders/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = {};
    ["type","message"].forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.dueMileage !== undefined) updates.dueMileage = body.dueMileage ? Number(body.dueMileage) : null;
    if (body.isCompleted !== undefined) updates.isCompleted = body.isCompleted;
    const [updated] = await db.update(schema.reminders).set(updates).where(eq(schema.reminders.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  .delete("/reminders/:id", requireAuth, requireSuperAdmin, async (c) => {
    await db.delete(schema.reminders).where(eq(schema.reminders.id, Number(c.req.param("id"))));
    return c.json({ success: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     INVOICES — VIEW + EDIT
  ══════════════════════════════════════════════════ */
  .get("/invoices", requireAuth, requireSuperAdmin, async (c) => {
    const rows = await db
      .select({
        id: schema.invoices.id,
        invoiceNumber: schema.invoices.invoiceNumber,
        subtotal: schema.invoices.subtotal,
        tax: schema.invoices.tax,
        total: schema.invoices.total,
        status: schema.invoices.status,
        dueDate: schema.invoices.dueDate,
        paidAt: schema.invoices.paidAt,
        notes: schema.invoices.notes,
        createdAt: schema.invoices.createdAt,
        appointmentId: schema.invoices.appointmentId,
        customerId: schema.invoices.customerId,
        customerName: schema.users.name,
        customerEmail: schema.users.email,
      })
      .from(schema.invoices)
      .leftJoin(schema.users, eq(schema.invoices.customerId, schema.users.id))
      .orderBy(desc(schema.invoices.createdAt));
    return c.json({ invoices: rows }, 200);
  })

  .post("/invoices", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.customerId || body.subtotal === undefined || body.total === undefined) {
      return c.json({ message: "customerId, subtotal, total required" }, 400);
    }
    const invNum = `INV-${Date.now()}`;
    const [created] = await db.insert(schema.invoices).values({
      appointmentId: body.appointmentId ? Number(body.appointmentId) : null,
      customerId: body.customerId,
      invoiceNumber: invNum,
      subtotal: Number(body.subtotal),
      tax: body.tax ? Number(body.tax) : 0,
      total: Number(body.total),
      status: body.status ?? "draft",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes ?? null,
    }).returning();
    return c.json(created, 201);
  })

  .patch("/invoices/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = {};
    ["status","notes"].forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    if (body.subtotal !== undefined) updates.subtotal = Number(body.subtotal);
    if (body.tax !== undefined) updates.tax = Number(body.tax);
    if (body.total !== undefined) updates.total = Number(body.total);
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.paidAt !== undefined) updates.paidAt = body.paidAt ? new Date(body.paidAt) : null;
    const [updated] = await db.update(schema.invoices).set(updates).where(eq(schema.invoices.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  .delete("/invoices/:id", requireAuth, requireSuperAdmin, async (c) => {
    await db.delete(schema.invoices).where(eq(schema.invoices.id, Number(c.req.param("id"))));
    return c.json({ success: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     APPOINTMENTS
  ══════════════════════════════════════════════════ */
  .post("/appointments", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.customerId || !body.scheduledAt) {
      return c.json({ message: "customerId and scheduledAt required" }, 400);
    }
    const [created] = await db.insert(schema.appointments).values({
      customerId: body.customerId,
      vehicleId: body.vehicleId ? Number(body.vehicleId) : null,
      serviceId: body.serviceId ? Number(body.serviceId) : null,
      mechanicId: body.mechanicId ? Number(body.mechanicId) : null,
      serviceType: body.serviceType ?? "in-shop",
      status: body.status ?? "pending",
      scheduledAt: new Date(body.scheduledAt),
      notes: body.notes ?? null,
      mechanicNotes: body.mechanicNotes ?? null,
      customerAddress: body.customerAddress ?? null,
      totalCost: body.totalCost ? Number(body.totalCost) : null,
      bookingFee: body.bookingFee ? Number(body.bookingFee) : 25,
    }).returning();
    // notify customer
    await db.insert(schema.notifications).values({
      userId: body.customerId,
      title: "Appointment Scheduled",
      message: `Your appointment has been scheduled for ${new Date(body.scheduledAt).toLocaleDateString()}. ${body.notes ? "Note: " + body.notes : ""}`,
      type: "system",
    }).catch(() => {});
    return c.json(created, 201);
  })

  .patch("/appointments/:id", requireAuth, requireSuperAdmin, async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const updates: Record<string, any> = { updatedAt: new Date() };
    ["status","notes","mechanicNotes","serviceType","customerAddress"].forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });
    if (body.scheduledAt !== undefined) updates.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (body.completedAt !== undefined) updates.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    if (body.totalCost !== undefined) updates.totalCost = body.totalCost !== "" ? Number(body.totalCost) : null;
    if (body.bookingFee !== undefined) updates.bookingFee = Number(body.bookingFee);
    if (body.vehicleId !== undefined) updates.vehicleId = body.vehicleId ? Number(body.vehicleId) : null;
    if (body.mechanicId !== undefined) updates.mechanicId = body.mechanicId ? Number(body.mechanicId) : null;
    if (body.serviceId !== undefined) updates.serviceId = body.serviceId ? Number(body.serviceId) : null;
    const [updated] = await db.update(schema.appointments).set(updates).where(eq(schema.appointments.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  .delete("/appointments/:id", requireAuth, requireSuperAdmin, async (c) => {
    await db.delete(schema.appointments).where(eq(schema.appointments.id, Number(c.req.param("id"))));
    return c.json({ success: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     STRIPE — Create Payment Link for Appointment
  ══════════════════════════════════════════════════ */
  .post("/appointments/:id/payment", requireAuth, requireSuperAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const [appt] = await db.select().from(schema.appointments)
      .leftJoin(schema.users, eq(schema.appointments.customerId, schema.users.id))
      .where(eq(schema.appointments.id, id));
    if (!appt) return c.json({ message: "Appointment not found" }, 404);

    const appointment = appt.appointments;
    const customer = appt.users;
    const amount = appointment.totalCost ?? appointment.bookingFee ?? 25;

    // Create a Stripe Price on-the-fly
    const price = await getStripe().prices.create({
      currency: "usd",
      unit_amount: Math.round(amount * 100),
      product_data: {
        name: `LibRepair Service – Appointment #${id}`,
      },
    });

    // Create Stripe Payment Link
    const paymentLink = await getStripe().paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { appointmentId: String(id) },
      after_completion: { type: "hosted_confirmation", hosted_confirmation: { custom_message: "Thank you! Your appointment is confirmed." } },
    });

    // Store in DB
    await db.update(schema.appointments).set({
      stripePaymentLinkId: paymentLink.id,
      stripePaymentUrl: paymentLink.url,
    }).where(eq(schema.appointments.id, id));

    // Also create a pending payment record
    await db.insert(schema.payments).values({
      appointmentId: id,
      customerId: appointment.customerId,
      amount,
      method: "stripe",
      status: "pending",
      transactionId: paymentLink.id,
      type: appointment.bookingFee && !appointment.totalCost ? "booking_fee" : "full",
    }).catch(() => {});

    return c.json({ paymentUrl: paymentLink.url, paymentLinkId: paymentLink.id }, 201);
  })

  /* ══════════════════════════════════════════════════
     STRIPE — Webhook (payment confirmed → update DB)
  ══════════════════════════════════════════════════ */
  .post("/stripe/webhook", async (c) => {
    const rawBody = await c.req.text();
    const sig = c.req.header("stripe-signature") ?? "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

    let event: Stripe.Event;
    try {
      if (webhookSecret) {
        event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
      } else {
        event = JSON.parse(rawBody) as Stripe.Event;
      }
    } catch (err: any) {
      return c.json({ message: `Webhook error: ${err.message}` }, 400);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const appointmentId = session.metadata?.appointmentId;
      if (appointmentId) {
        const apptId = Number(appointmentId);
        await db.update(schema.appointments)
          .set({ status: "confirmed", updatedAt: new Date() })
          .where(eq(schema.appointments.id, apptId));
        await db.update(schema.payments)
          .set({ status: "paid" })
          .where(eq(schema.payments.appointmentId, apptId));
      }
    }
    return c.json({ received: true }, 200);
  })

  /* ══════════════════════════════════════════════════
     GOOGLE CALENDAR — Create Event for Appointment
  ══════════════════════════════════════════════════ */
  .post("/appointments/:id/calendar", requireAuth, requireSuperAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const rows = await db
      .select({
        appointment: schema.appointments,
        customer: schema.users,
        service: schema.services,
        vehicle: schema.vehicles,
      })
      .from(schema.appointments)
      .leftJoin(schema.users, eq(schema.appointments.customerId, schema.users.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .leftJoin(schema.vehicles, eq(schema.appointments.vehicleId, schema.vehicles.id))
      .where(eq(schema.appointments.id, id));

    if (!rows.length) return c.json({ message: "Appointment not found" }, 404);
    const { appointment, customer, service, vehicle } = rows[0];

    const start = new Date(appointment.scheduledAt);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
    const fmt = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "-05:00").replace("Z", "").slice(0, 19) + "-05:00";

    const summary = `LibRepair: ${service?.name ?? "Service"} – ${customer?.name ?? "Customer"}`;
    const description = [
      `Customer: ${customer?.name ?? "N/A"} (${customer?.email ?? ""})`,
      vehicle ? `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}` : "",
      appointment.notes ? `Notes: ${appointment.notes}` : "",
      appointment.customerAddress ? `Address: ${appointment.customerAddress}` : "",
    ].filter(Boolean).join("\n");

    const props = JSON.stringify({
      summary,
      eventStartDate: fmt(start),
      eventEndDate: fmt(end),
      description,
      ...(customer?.email ? { attendees: [customer.email] } : {}),
    });

    let result: any;
    try {
      const out = execSync(`connector run google_calendar google_calendar-create-event '${props.replace(/'/g, "'\\''")}'`, {
        timeout: 30000,
        encoding: "utf8",
      });
      result = JSON.parse(out);
    } catch (err: any) {
      console.error("Google Calendar error:", err.message);
      return c.json({ message: "Failed to create calendar event", error: err.message }, 500);
    }

    const eventId = result?.id ?? result?.eventId ?? null;
    const eventUrl = result?.htmlLink ?? null;

    await db.update(schema.appointments).set({
      calendarEventId: eventId,
      calendarEventUrl: eventUrl,
    }).where(eq(schema.appointments.id, id));

    return c.json({ eventId, eventUrl }, 201);
  });

function parsePhotos(listing: any) {
  try {
    listing.photos = typeof listing.photos === "string" ? JSON.parse(listing.photos) : listing.photos ?? [];
  } catch { listing.photos = []; }
  return listing;
}
