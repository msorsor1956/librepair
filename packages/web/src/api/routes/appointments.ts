import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, and } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

async function getDbRole(userId: string): Promise<string> {
  const [u] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, userId));
  return u?.role ?? "customer";
}

export const appointmentsRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)

  // Customer: my appointments with full details
  .get("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const rows = await db
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
        mechanicNotes: schema.appointments.mechanicNotes,
        customerAddress: schema.appointments.customerAddress,
        totalCost: schema.appointments.totalCost,
        bookingFee: schema.appointments.bookingFee,
        createdAt: schema.appointments.createdAt,
        updatedAt: schema.appointments.updatedAt,
        vehicleMake: schema.vehicles.make,
        vehicleModel: schema.vehicles.model,
        vehicleYear: schema.vehicles.year,
        vehiclePlate: schema.vehicles.licensePlate,
        serviceName: schema.services.name,
        serviceCategory: schema.services.category,
        servicePrice: schema.services.basePrice,
      })
      .from(schema.appointments)
      .leftJoin(schema.vehicles, eq(schema.appointments.vehicleId, schema.vehicles.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .where(eq(schema.appointments.customerId, user.id))
      .orderBy(desc(schema.appointments.scheduledAt));
    return c.json(rows, 200);
  })

  // Mechanic: their assigned appointments with customer + vehicle info
  .get("/mechanic", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const [mechanic] = await db.select().from(schema.mechanics).where(eq(schema.mechanics.userId, user.id));
    if (!mechanic) return c.json([], 200);
    const rows = await db
      .select({
        id: schema.appointments.id,
        customerId: schema.appointments.customerId,
        customerName: schema.users.name,
        customerEmail: schema.users.email,
        customerPhone: schema.users.phone,
        customerAddress: schema.appointments.customerAddress,
        vehicleId: schema.appointments.vehicleId,
        vehicleMake: schema.vehicles.make,
        vehicleModel: schema.vehicles.model,
        vehicleYear: schema.vehicles.year,
        vehiclePlate: schema.vehicles.licensePlate,
        vehicleVin: schema.vehicles.vin,
        vehicleColor: schema.vehicles.color,
        vehicleMileage: schema.vehicles.mileage,
        mechanicId: schema.appointments.mechanicId,
        serviceId: schema.appointments.serviceId,
        serviceName: schema.services.name,
        serviceCategory: schema.services.category,
        serviceType: schema.appointments.serviceType,
        status: schema.appointments.status,
        scheduledAt: schema.appointments.scheduledAt,
        completedAt: schema.appointments.completedAt,
        notes: schema.appointments.notes,
        mechanicNotes: schema.appointments.mechanicNotes,
        totalCost: schema.appointments.totalCost,
        bookingFee: schema.appointments.bookingFee,
        createdAt: schema.appointments.createdAt,
        updatedAt: schema.appointments.updatedAt,
      })
      .from(schema.appointments)
      .leftJoin(schema.users, eq(schema.appointments.customerId, schema.users.id))
      .leftJoin(schema.vehicles, eq(schema.appointments.vehicleId, schema.vehicles.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .where(eq(schema.appointments.mechanicId, mechanic.id))
      .orderBy(desc(schema.appointments.scheduledAt));
    return c.json(rows, 200);
  })

  // Admin: all appointments with full details
  .get("/all", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const rows = await db
      .select({
        id: schema.appointments.id,
        customerId: schema.appointments.customerId,
        customerName: schema.users.name,
        customerEmail: schema.users.email,
        customerPhone: schema.users.phone,
        vehicleId: schema.appointments.vehicleId,
        vehicleMake: schema.vehicles.make,
        vehicleModel: schema.vehicles.model,
        vehicleYear: schema.vehicles.year,
        vehiclePlate: schema.vehicles.licensePlate,
        mechanicId: schema.appointments.mechanicId,
        serviceId: schema.appointments.serviceId,
        serviceName: schema.services.name,
        serviceCategory: schema.services.category,
        serviceType: schema.appointments.serviceType,
        status: schema.appointments.status,
        scheduledAt: schema.appointments.scheduledAt,
        completedAt: schema.appointments.completedAt,
        notes: schema.appointments.notes,
        mechanicNotes: schema.appointments.mechanicNotes,
        customerAddress: schema.appointments.customerAddress,
        totalCost: schema.appointments.totalCost,
        bookingFee: schema.appointments.bookingFee,
        createdAt: schema.appointments.createdAt,
        updatedAt: schema.appointments.updatedAt,
        mechanicName: alias(schema.users, "mechanic_user").name,
      })
      .from(schema.appointments)
      .leftJoin(schema.users, eq(schema.appointments.customerId, schema.users.id))
      .leftJoin(schema.vehicles, eq(schema.appointments.vehicleId, schema.vehicles.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .leftJoin(schema.mechanics, eq(schema.appointments.mechanicId, schema.mechanics.id))
      .leftJoin(alias(schema.users, "mechanic_user"), eq(schema.mechanics.userId, alias(schema.users, "mechanic_user").id))
      .orderBy(desc(schema.appointments.scheduledAt));
    return c.json({ appointments: rows }, 200);
  })

  // Book appointment
  .post("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();
    const serviceType = body.serviceType === "home_service" ? "home-service" : (body.serviceType ?? "in-shop");
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

    // Record booking fee payment as pending
    await db.insert(schema.payments).values({
      appointmentId: appointment.id,
      customerId: user.id,
      amount: bookingFee,
      method: body.paymentMethod ?? "cash",
      status: "pending",
      type: "booking_fee",
    });

    await db.insert(schema.notifications).values({
      userId: user.id,
      title: "Appointment Booked",
      message: `Your appointment has been scheduled for ${new Date(body.scheduledDate ?? body.scheduledAt).toLocaleDateString()}.`,
      type: "appointment",
    });
    return c.json(appointment, 201);
  })

  // Get single appointment with parts
  .get("/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const role = await getDbRole(user.id);
    const [apt] = await db
      .select({
        id: schema.appointments.id,
        customerId: schema.appointments.customerId,
        customerName: schema.users.name,
        customerEmail: schema.users.email,
        customerPhone: schema.users.phone,
        vehicleId: schema.appointments.vehicleId,
        vehicleMake: schema.vehicles.make,
        vehicleModel: schema.vehicles.model,
        vehicleYear: schema.vehicles.year,
        vehiclePlate: schema.vehicles.licensePlate,
        vehicleVin: schema.vehicles.vin,
        vehicleColor: schema.vehicles.color,
        vehicleMileage: schema.vehicles.mileage,
        mechanicId: schema.appointments.mechanicId,
        serviceId: schema.appointments.serviceId,
        serviceName: schema.services.name,
        serviceCategory: schema.services.category,
        servicePrice: schema.services.basePrice,
        serviceType: schema.appointments.serviceType,
        status: schema.appointments.status,
        scheduledAt: schema.appointments.scheduledAt,
        completedAt: schema.appointments.completedAt,
        notes: schema.appointments.notes,
        mechanicNotes: schema.appointments.mechanicNotes,
        customerAddress: schema.appointments.customerAddress,
        totalCost: schema.appointments.totalCost,
        bookingFee: schema.appointments.bookingFee,
        createdAt: schema.appointments.createdAt,
        updatedAt: schema.appointments.updatedAt,
      })
      .from(schema.appointments)
      .leftJoin(schema.users, eq(schema.appointments.customerId, schema.users.id))
      .leftJoin(schema.vehicles, eq(schema.appointments.vehicleId, schema.vehicles.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .where(eq(schema.appointments.id, id));

    if (!apt) return c.json({ message: "Not found" }, 404);
    // Only owner, mechanic assigned, or admin can view
    if (apt.customerId !== user.id && role !== "admin" && role !== "mechanic") {
      return c.json({ message: "Forbidden" }, 403);
    }

    const parts = await db.select().from(schema.appointmentParts).where(eq(schema.appointmentParts.appointmentId, id));
    const payments = await db.select().from(schema.payments).where(eq(schema.payments.appointmentId, id));

    return c.json({ ...apt, parts, payments }, 200);
  })

  // Update status (mechanic/admin)
  .put("/:id/status", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const role = await getDbRole(user.id);
    if (role !== "admin" && role !== "mechanic") return c.json({ message: "Forbidden" }, 403);
    const body = await c.req.json();
    const [updated] = await db.update(schema.appointments).set({
      status: body.status,
      updatedAt: new Date(),
      ...(body.status === "completed" ? { completedAt: new Date() } : {}),
    }).where(eq(schema.appointments.id, id)).returning();

    // Notify customer on status change
    if (updated) {
      await db.insert(schema.notifications).values({
        userId: updated.customerId,
        title: "Appointment Update",
        message: `Your appointment #${id} status changed to: ${body.status}.`,
        type: "appointment",
      });
    }
    return c.json(updated, 200);
  })

  // Mechanic: update notes + total cost (no delete)
  .put("/:id/mechanic-update", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const body = await c.req.json();
    const allowed: any = { updatedAt: new Date() };
    if (body.mechanicNotes !== undefined) allowed.mechanicNotes = body.mechanicNotes;
    if (body.totalCost !== undefined) allowed.totalCost = parseFloat(body.totalCost);
    if (body.status !== undefined) allowed.status = body.status;
    const [updated] = await db.update(schema.appointments).set(allowed).where(eq(schema.appointments.id, id)).returning();
    return c.json(updated, 200);
  })

  // Assign mechanic (admin only)
  .put("/:id/assign", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    const { mechanicId } = await c.req.json();
    const [updated] = await db.update(schema.appointments)
      .set({ mechanicId: parseInt(mechanicId), status: "confirmed", updatedAt: new Date() })
      .where(eq(schema.appointments.id, id))
      .returning();
    if (updated) {
      await db.insert(schema.notifications).values({
        userId: updated.customerId,
        title: "Mechanic Assigned",
        message: `A mechanic has been assigned to your appointment #${id}.`,
        type: "appointment",
      });
    }
    return c.json(updated, 200);
  })

  // PATCH aliases for status and assign (used by admin UI)
  .patch("/:id/status", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const role = await getDbRole(user.id);
    if (role !== "admin" && role !== "mechanic") return c.json({ message: "Forbidden" }, 403);
    const body = await c.req.json();
    const [updated] = await db.update(schema.appointments).set({
      status: body.status, updatedAt: new Date(),
      ...(body.status === "completed" ? { completedAt: new Date() } : {}),
    }).where(eq(schema.appointments.id, id)).returning();
    return c.json(updated, 200);
  })

  .patch("/:id/assign", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    const { mechanicId } = await c.req.json();
    const [updated] = await db.update(schema.appointments)
      .set({ mechanicId: mechanicId ? parseInt(mechanicId) : null, status: "confirmed", updatedAt: new Date() })
      .where(eq(schema.appointments.id, id)).returning();
    if (updated && mechanicId) {
      await db.insert(schema.notifications).values({
        userId: updated.customerId,
        title: "Mechanic Assigned",
        message: `A mechanic has been assigned to your appointment #${id}.`,
        type: "appointment",
      });
    }
    return c.json(updated, 200);
  })

  // Admin: full update of any appointment (status, date, service, price, notes, etc.)
  .patch("/:id/admin-update", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const allowed = [
      "status", "scheduledAt", "serviceId", "serviceType", "vehicleId",
      "totalCost", "bookingFee", "notes", "mechanicNotes", "customerAddress",
    ] as const;
    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "scheduledAt") updates[key] = new Date(body[key]);
        else if (key === "totalCost" || key === "bookingFee") updates[key] = parseFloat(body[key]);
        else if (key === "serviceId" || key === "vehicleId") updates[key] = body[key] ? parseInt(body[key]) : null;
        else updates[key] = body[key];
      }
    }
    if (updates.status === "completed") updates.completedAt = new Date();
    const [updated] = await db.update(schema.appointments).set(updates).where(eq(schema.appointments.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  // Admin: hard-delete appointment
  .delete("/:id/admin-delete", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.appointments).where(eq(schema.appointments.id, id));
    return c.json({ success: true }, 200);
  })

  // Cancel appointment (customer only, or admin can use admin-delete)
  .delete("/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const role = await getDbRole(user.id);
    const [appt] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id));
    if (!appt) return c.json({ message: "Not found" }, 404);
    // Admin can cancel any appointment
    if (role === "admin") {
      const [updated] = await db.update(schema.appointments).set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(schema.appointments.id, id)).returning();
      return c.json(updated, 200);
    }
    if (appt.customerId !== user.id) return c.json({ message: "Not found" }, 404);
    if (appt.status === "completed" || appt.status === "in-progress") {
      return c.json({ message: "Cannot cancel an in-progress or completed appointment" }, 400);
    }
    const [updated] = await db.update(schema.appointments).set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(schema.appointments.id, id)).returning();
    return c.json(updated, 200);
  });
