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

export const mechanicsRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)

  // Public: list available mechanics
  .get("/", async (c) => {
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
      })
      .from(schema.mechanics)
      .leftJoin(schema.users, eq(schema.mechanics.userId, schema.users.id))
      .where(eq(schema.mechanics.isAvailable, true));
    return c.json(rows, 200);
  })

  // All mechanics (admin)
  .get("/all", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden" }, 403);
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
      })
      .from(schema.mechanics)
      .leftJoin(schema.users, eq(schema.mechanics.userId, schema.users.id));
    return c.json(rows, 200);
  })

  // Get mechanic profile for current user
  .get("/me", requireAuth, async (c) => {
    const user = c.get("user")!;
    const [mechanic] = await db.select().from(schema.mechanics).where(eq(schema.mechanics.userId, user.id));
    return c.json(mechanic ?? null, 200);
  })

  // Mechanic: read a customer's full info (no delete permission enforced here — delete is denied at customer routes)
  .get("/customer/:customerId", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const customerId = c.req.param("customerId");
    const [customer] = await db.select().from(schema.users).where(eq(schema.users.id, customerId));
    if (!customer) return c.json({ message: "Not found" }, 404);
    const vehicles = await db.select().from(schema.vehicles).where(eq(schema.vehicles.userId, customerId));
    const appointments = await db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.customerId, customerId))
      .orderBy(desc(schema.appointments.scheduledAt));
    return c.json({ customer, vehicles, appointments }, 200);
  })

  // Mechanic: update customer info (name, phone, address) — no delete
  .put("/customer/:customerId", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const customerId = c.req.param("customerId");
    const body = await c.req.json();
    // Only allow safe fields
    const allowed = ["name", "phone", "address"] as const;
    const updates: any = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const [updated] = await db.update(schema.users).set(updates).where(eq(schema.users.id, customerId)).returning();
    return c.json(updated, 200);
  })

  // Create mechanic profile (admin only)
  .post("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const body = await c.req.json();
    // Promote user to mechanic role
    await db.update(schema.users).set({ role: "mechanic" }).where(eq(schema.users.id, body.userId));
    const [mechanic] = await db.insert(schema.mechanics).values({
      userId: body.userId,
      specializations: body.specializations ?? null,
      bio: body.bio ?? null,
      isAvailable: true,
    }).returning();
    return c.json(mechanic, 201);
  })

  // Toggle availability
  .put("/:id/availability", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin" && role !== "mechanic") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [updated] = await db.update(schema.mechanics)
      .set({ isAvailable: body.isAvailable })
      .where(eq(schema.mechanics.id, id))
      .returning();
    return c.json(updated, 200);
  });

// --- Mechanic self-service routes ---

// GET /my-jobs — mechanic sees their assigned appointments
export const mechanicSelfRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)

  .get("/my-jobs", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const [mechanic] = await db.select().from(schema.mechanics).where(eq(schema.mechanics.userId, user.id));
    if (!mechanic) return c.json({ appointments: [] }, 200);
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
        mechanicId: schema.appointments.mechanicId,
        serviceId: schema.appointments.serviceId,
        serviceName: schema.services.name,
        serviceType: schema.appointments.serviceType,
        status: schema.appointments.status,
        scheduledAt: schema.appointments.scheduledAt,
        completedAt: schema.appointments.completedAt,
        notes: schema.appointments.notes,
        mechanicNotes: schema.appointments.mechanicNotes,
        totalCost: schema.appointments.totalCost,
        bookingFee: schema.appointments.bookingFee,
        createdAt: schema.appointments.createdAt,
      })
      .from(schema.appointments)
      .leftJoin(schema.users, eq(schema.appointments.customerId, schema.users.id))
      .leftJoin(schema.vehicles, eq(schema.appointments.vehicleId, schema.vehicles.id))
      .leftJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .where(eq(schema.appointments.mechanicId, mechanic.id))
      .orderBy(desc(schema.appointments.scheduledAt));
    // reshape vehicle
    const appointments = rows.map((r: any) => ({
      ...r,
      vehicle: r.vehicleMake ? { make: r.vehicleMake, model: r.vehicleModel, year: r.vehicleYear, licensePlate: r.vehiclePlate, vin: r.vehicleVin } : null,
    }));
    return c.json({ appointments }, 200);
  })

  // PATCH status
  .patch("/appointments/:id/status", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    const { status } = await c.req.json();
    const [updated] = await db.update(schema.appointments)
      .set({ status, updatedAt: new Date(), ...(status === "completed" ? { completedAt: new Date() } : {}) })
      .where(eq(schema.appointments.id, id)).returning();
    if (updated) {
      await db.insert(schema.notifications).values({
        userId: updated.customerId,
        title: "Appointment Update",
        message: `Your appointment #${id} status changed to: ${status}.`,
        type: "appointment",
      });
    }
    return c.json(updated, 200);
  })

  // POST note
  .post("/appointments/:id/notes", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    const { content } = await c.req.json();
    const [apt] = await db.select({ mechanicNotes: schema.appointments.mechanicNotes })
      .from(schema.appointments).where(eq(schema.appointments.id, id));
    const existing = apt?.mechanicNotes ? JSON.parse(apt.mechanicNotes as string) : [];
    const newNotes = [...existing, { content, mechanicId: user.id, createdAt: new Date().toISOString() }];
    const [updated] = await db.update(schema.appointments)
      .set({ mechanicNotes: JSON.stringify(newNotes), updatedAt: new Date() })
      .where(eq(schema.appointments.id, id)).returning();
    return c.json({ success: true }, 200);
  })

  // PATCH customer info on appointment (name, phone, email stored on user record)
  .patch("/appointments/:id/customer", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    const [apt] = await db.select({ customerId: schema.appointments.customerId }).from(schema.appointments).where(eq(schema.appointments.id, id));
    if (!apt) return c.json({ message: "Not found" }, 404);
    const body = await c.req.json();
    const updates: any = {};
    if (body.name  !== undefined) updates.name  = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.email !== undefined) updates.email = body.email;
    const [updated] = await db.update(schema.users).set(updates).where(eq(schema.users.id, apt.customerId)).returning();
    return c.json(updated, 200);
  })

  // PATCH vehicle info on appointment
  .patch("/appointments/:id/vehicle", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    const [apt] = await db.select({ vehicleId: schema.appointments.vehicleId }).from(schema.appointments).where(eq(schema.appointments.id, id));
    if (!apt?.vehicleId) return c.json({ message: "No vehicle linked to this appointment" }, 404);
    const body = await c.req.json();
    const updates: any = {};
    if (body.make !== undefined)         updates.make         = body.make;
    if (body.model !== undefined)        updates.model        = body.model;
    if (body.year !== undefined)         updates.year         = parseInt(body.year);
    if (body.licensePlate !== undefined) updates.licensePlate = body.licensePlate;
    if (body.vin !== undefined)          updates.vin          = body.vin;
    const [updated] = await db.update(schema.vehicles).set(updates).where(eq(schema.vehicles.id, apt.vehicleId)).returning();
    return c.json(updated, 200);
  });
