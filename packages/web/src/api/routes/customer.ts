import { Hono } from "hono";
import { db } from "../database";
import { users, vehicles, appointments, payments, invoices, notifications, reminders } from "../database/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export const customerRouter = new Hono()
  // ── Profile ────────────────────────────────────────────────
  .get("/profile", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!u) return c.json({ error: "User not found" }, 404);
    return c.json({ user: u }, 200);
  })

  .patch("/profile", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const body = await c.req.json<Partial<{ name: string; phone: string; address: string; profilePhoto: string }>>();
    await db.update(users).set({ ...body, updatedAt: new Date() }).where(eq(users.id, userId));
    const [updated] = await db.select().from(users).where(eq(users.id, userId));
    return c.json({ user: updated }, 200);
  })

  // ── Vehicles ────────────────────────────────────────────────
  .get("/vehicles", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const result = await db.select().from(vehicles).where(eq(vehicles.userId, userId)).orderBy(desc(vehicles.createdAt));
    return c.json({ vehicles: result }, 200);
  })

  .post("/vehicles", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const body = await c.req.json<{ make: string; model: string; year: number; vin?: string; licensePlate?: string; color?: string; mileage?: number }>();
    const [v] = await db.insert(vehicles).values({ ...body, userId }).returning();
    return c.json({ vehicle: v }, 201);
  })

  .delete("/vehicles/:id", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const id = parseInt(c.req.param("id"));
    await db.delete(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)));
    return c.json({ success: true }, 200);
  })

  // ── Appointments ────────────────────────────────────────────
  .get("/appointments", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const result = await db.select().from(appointments).where(eq(appointments.customerId, userId)).orderBy(desc(appointments.scheduledAt));
    return c.json({ appointments: result }, 200);
  })

  // ── Service History ─────────────────────────────────────────
  .get("/service-history", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const result = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.customerId, userId), eq(appointments.status, "completed")))
      .orderBy(desc(appointments.completedAt));
    return c.json({ history: result }, 200);
  })

  // ── Invoices ────────────────────────────────────────────────
  .get("/invoices", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const result = await db.select().from(invoices).where(eq(invoices.customerId, userId)).orderBy(desc(invoices.createdAt));
    return c.json({ invoices: result }, 200);
  })

  // ── Payments ────────────────────────────────────────────────
  .get("/payments", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const result = await db.select().from(payments).where(eq(payments.customerId, userId)).orderBy(desc(payments.createdAt));
    return c.json({ payments: result }, 200);
  })

  // ── Notifications ───────────────────────────────────────────
  .get("/notifications", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const result = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    return c.json({ notifications: result }, 200);
  })

  .patch("/notifications/:id/read", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return c.json({ success: true }, 200);
  })

  // ── Reminders ───────────────────────────────────────────────
  .get("/reminders", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const result = await db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(desc(reminders.createdAt));
    return c.json({ reminders: result }, 200);
  })

  // ── Support ─────────────────────────────────────────────────
  .post("/support", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const { subject, message } = await c.req.json<{ subject: string; message: string }>();
    if (!subject || !message) return c.json({ error: "subject and message are required" }, 400);
    // Store as notification for admin review (or hook into email here)
    await db.insert(notifications).values({
      userId,
      type: "support",
      title: `Support: ${subject}`,
      message,
      isRead: false,
      createdAt: new Date(),
    });
    return c.json({ success: true }, 200);
  });
