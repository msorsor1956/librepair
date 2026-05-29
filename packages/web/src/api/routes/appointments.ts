import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

export const appointmentsRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)
  // Customer: my appointments
  .get("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const appointments = await db
      .select({
        id: schema.appointments.id,
        customerId: schema.appointments.customerId,
        vehicleId: schema.appointments.vehicleId,
        mechanicId: schema.appointments.mechanicId,
        serviceId: schema.appointments.serviceId,
        serviceType: schema.appointments.serviceType,
        status: schema.appointments.status,
        scheduledAt: schema.appointments.scheduledAt,
        completedAt: schema.appointments.completedAt,
        notes: schema.appointments.notes,
        customerAddress: schema.appointments.customerAddress,
        totalCost: schema.appointments.totalCost,
        bookingFee: schema.appointments.bookingFee,
        createdAt: schema.appointments.createdAt,
        updatedAt: schema.appointments.updatedAt,
        vehicle: {
          make: schema.vehicles.make,
          model: schema.vehicles.model,
          year: schema.vehicles.year,
        },
        service: {
          name: schema.services.name,
          category: schema.services.category,
        },
      })
      .from(schema.appointments)
      .leftJoin(schema.vehicles, eq(schema.appointments.vehicleId, schema.vehicles.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .where(eq(schema.appointments.customerId, user.id))
      .orderBy(desc(schema.appointments.scheduledAt));
    return c.json(appointments, 200);
  })
  // Mechanic: their assigned appointments
  .get("/mechanic", requireAuth, async (c) => {
    const user = c.get("user")!;
    const [mechanic] = await db.select().from(schema.mechanics).where(eq(schema.mechanics.userId, user.id));
    if (!mechanic) return c.json([], 200);
    const appointments = await db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.mechanicId, mechanic.id))
      .orderBy(desc(schema.appointments.scheduledAt));
    return c.json(appointments, 200);
  })
  // Admin: all appointments
  .get("/all", requireAuth, async (c) => {
    const user = c.get("user")!;
    if ((user as any).role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const appointments = await db
      .select({
        id: schema.appointments.id,
        customerId: schema.appointments.customerId,
        vehicleId: schema.appointments.vehicleId,
        mechanicId: schema.appointments.mechanicId,
        serviceId: schema.appointments.serviceId,
        serviceType: schema.appointments.serviceType,
        status: schema.appointments.status,
        scheduledAt: schema.appointments.scheduledAt,
        completedAt: schema.appointments.completedAt,
        notes: schema.appointments.notes,
        customerAddress: schema.appointments.customerAddress,
        totalCost: schema.appointments.totalCost,
        bookingFee: schema.appointments.bookingFee,
        createdAt: schema.appointments.createdAt,
        vehicle: {
          make: schema.vehicles.make,
          model: schema.vehicles.model,
          year: schema.vehicles.year,
        },
        service: {
          name: schema.services.name,
        },
      })
      .from(schema.appointments)
      .leftJoin(schema.vehicles, eq(schema.appointments.vehicleId, schema.vehicles.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .orderBy(desc(schema.appointments.scheduledAt));
    return c.json(appointments, 200);
  })
  // Book appointment
  .post("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();
    const serviceType = body.serviceType === "home_service" ? "home-service" : "in-shop";
    const bookingFee = serviceType === "home-service" ? 35 : 25;
    const [appointment] = await db.insert(schema.appointments).values({
      customerId: user.id,
      vehicleId: body.vehicleId ? parseInt(body.vehicleId) : null,
      mechanicId: body.mechanicId ? parseInt(body.mechanicId) : null,
      serviceId: body.serviceId ? parseInt(body.serviceId) : null,
      serviceType,
      scheduledAt: new Date(body.scheduledDate ?? body.scheduledAt),
      notes: body.notes ?? null,
      customerAddress: body.address ?? body.customerAddress ?? null,
      bookingFee,
      status: "pending",
    }).returning();
    // Create booking notification
    await db.insert(schema.notifications).values({
      userId: user.id,
      title: "Appointment Booked",
      message: `Your appointment has been scheduled for ${new Date(body.scheduledDate ?? body.scheduledAt).toLocaleDateString()}.`,
      type: "appointment",
    });
    return c.json(appointment, 201);
  })
  // Update status (mechanic/admin)
  .put("/:id/status", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [updated] = await db.update(schema.appointments).set({
      status: body.status,
      updatedAt: new Date(),
      ...(body.status === "completed" ? { completedAt: new Date() } : {}),
    }).where(eq(schema.appointments.id, id)).returning();
    return c.json(updated, 200);
  })
  // Cancel appointment (customer)
  .delete("/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const [appt] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id));
    if (!appt || appt.customerId !== user.id) return c.json({ message: "Not found" }, 404);
    const [updated] = await db.update(schema.appointments).set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(schema.appointments.id, id)).returning();
    return c.json(updated, 200);
  })
  // Get single
  .get("/:id", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const [appointment] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id));
    if (!appointment) return c.json({ message: "Not found" }, 404);
    return c.json(appointment, 200);
  });
