import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";
import { auth } from "../auth";
import Stripe from "stripe";
import { execSync } from "child_process";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2025-05-28.basil" });

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

  .get("/inventory", requireAuth, requireSuperAdmin, async (c) => {
    const rows = await db.select().from(schema.carInventory).orderBy(desc(schema.carInventory.createdAt));
    return c.json({ listings: rows.map(parsePhotos) }, 200);
  })

  .post("/inventory", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.title || !body.make || !body.model || !body.year || !body.price) {
      return c.json({ message: "title, make, model, year, price required" }, 400);
    }
    const [created] = await db.insert(schema.carInventory).values({
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
     VEHICLES
  ══════════════════════════════════════════════════ */
  .get("/vehicles", requireAuth, requireSuperAdmin, async (c) => {
    const userId = c.req.query("userId");
    const rows = userId
      ? await db.select().from(schema.vehicles).where(eq(schema.vehicles.userId, userId))
      : await db.select().from(schema.vehicles);
    return c.json({ vehicles: rows }, 200);
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
      serviceType: body.serviceType ?? "in-shop",
      status: body.status ?? "pending",
      scheduledAt: new Date(body.scheduledAt),
      notes: body.notes ?? null,
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
    const updates: Record<string, any> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.scheduledAt !== undefined) updates.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    const [updated] = await db.update(schema.appointments).set(updates).where(eq(schema.appointments.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
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
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: Math.round(amount * 100),
      product_data: {
        name: `LibRepair Service – Appointment #${id}`,
      },
    });

    // Create Stripe Payment Link
    const paymentLink = await stripe.paymentLinks.create({
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
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
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
