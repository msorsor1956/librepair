import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

async function getDbRole(userId: string): Promise<string> {
  const [u] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, userId));
  return u?.role ?? "customer";
}

export const paymentsRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)

  // Customer: my payments
  .get("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const rows = await db
      .select({
        id: schema.payments.id,
        appointmentId: schema.payments.appointmentId,
        amount: schema.payments.amount,
        method: schema.payments.method,
        status: schema.payments.status,
        type: schema.payments.type,
        transactionId: schema.payments.transactionId,
        notes: schema.payments.notes,
        createdAt: schema.payments.createdAt,
        serviceName: schema.services.name,
        vehicleMake: schema.vehicles.make,
        vehicleModel: schema.vehicles.model,
        vehicleYear: schema.vehicles.year,
        appointmentStatus: schema.appointments.status,
        scheduledAt: schema.appointments.scheduledAt,
      })
      .from(schema.payments)
      .leftJoin(schema.appointments, eq(schema.payments.appointmentId, schema.appointments.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .leftJoin(schema.vehicles, eq(schema.appointments.vehicleId, schema.vehicles.id))
      .where(eq(schema.payments.customerId, user.id))
      .orderBy(desc(schema.payments.createdAt));
    return c.json(rows, 200);
  })

  // Alias for customer payments
  .get("/mine", requireAuth, async (c) => {
    const user = c.get("user")!;
    const rows = await db
      .select({
        id: schema.payments.id,
        appointmentId: schema.payments.appointmentId,
        amount: schema.payments.amount,
        method: schema.payments.method,
        status: schema.payments.status,
        type: schema.payments.type,
        description: schema.services.name,
        createdAt: schema.payments.createdAt,
      })
      .from(schema.payments)
      .leftJoin(schema.appointments, eq(schema.payments.appointmentId, schema.appointments.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .where(eq(schema.payments.customerId, user.id))
      .orderBy(desc(schema.payments.createdAt));
    return c.json({ payments: rows }, 200);
  })

  // Admin: all payments
  .get("/all", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden" }, 403);
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
    return c.json(rows, 200);
  })

  // Record / update payment (admin only)
  .post("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const body = await c.req.json();
    const [payment] = await db.insert(schema.payments).values({
      appointmentId: body.appointmentId ? parseInt(body.appointmentId) : null,
      customerId: body.customerId,
      amount: parseFloat(body.amount),
      method: body.method,
      status: body.status ?? "pending",
      type: body.type ?? "full",
      transactionId: body.transactionId ?? null,
      notes: body.notes ?? null,
    }).returning();

    // Notify customer
    await db.insert(schema.notifications).values({
      userId: body.customerId,
      title: "Payment Update",
      message: `Payment of $${body.amount} recorded as ${body.status}.`,
      type: "payment",
    });

    return c.json(payment, 201);
  })

  // Update payment status (admin)
  .put("/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [updated] = await db.update(schema.payments)
      .set({
        status: body.status,
        method: body.method,
        transactionId: body.transactionId ?? null,
        notes: body.notes ?? null,
      })
      .where(eq(schema.payments.id, id))
      .returning();
    if (updated) {
      await db.insert(schema.notifications).values({
        userId: updated.customerId,
        title: "Payment Status Updated",
        message: `Your payment of $${updated.amount} is now ${updated.status}.`,
        type: "payment",
      });
    }
    return c.json(updated, 200);
  });
