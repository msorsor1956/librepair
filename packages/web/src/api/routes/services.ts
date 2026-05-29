import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

export const servicesRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)
  // List all active services
  .get("/", async (c) => {
    const services = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.isActive, true));
    return c.json(services, 200);
  })
  // Seed default services (call once after deploy)
  .post("/seed", async (c) => {
    const defaults = [
      { name: "Oil Change", description: "Full synthetic or conventional oil change with filter replacement", category: "Maintenance", basePrice: 49.99, durationMinutes: 45 },
      { name: "Brake Repair", description: "Brake pad replacement, rotor inspection and resurfacing", category: "Brakes", basePrice: 149.99, durationMinutes: 90 },
      { name: "Engine Diagnostics", description: "Full OBD-II scan and engine diagnostic report", category: "Diagnostics", basePrice: 79.99, durationMinutes: 60 },
      { name: "Tire Rotation", description: "Rotate and balance all four tires", category: "Tires", basePrice: 39.99, durationMinutes: 45 },
      { name: "Tire Replacement", description: "Tire swap, balance, and alignment check", category: "Tires", basePrice: 99.99, durationMinutes: 60 },
      { name: "Battery Service", description: "Battery test, replacement, and terminal cleaning", category: "Electrical", basePrice: 89.99, durationMinutes: 30 },
      { name: "Transmission Repair", description: "Fluid flush, filter change, and transmission inspection", category: "Transmission", basePrice: 299.99, durationMinutes: 180 },
      { name: "AC Repair", description: "Refrigerant recharge, leak inspection, and compressor check", category: "HVAC", basePrice: 129.99, durationMinutes: 90 },
      { name: "Suspension Repair", description: "Shock/strut replacement, alignment, and steering inspection", category: "Suspension", basePrice: 199.99, durationMinutes: 120 },
      { name: "Air Filter Replacement", description: "Engine and cabin air filter replacement", category: "Maintenance", basePrice: 29.99, durationMinutes: 20 },
      { name: "Coolant Flush", description: "Full cooling system flush and refill", category: "Maintenance", basePrice: 79.99, durationMinutes: 60 },
      { name: "Full Inspection", description: "Comprehensive 150-point vehicle inspection", category: "Inspection", basePrice: 59.99, durationMinutes: 60 },
    ];
    await db.insert(schema.services).values(defaults).onConflictDoNothing();
    const services = await db.select().from(schema.services);
    return c.json(services, 200);
  })
  // Admin: create service
  .post("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    if ((user as any).role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const body = await c.req.json();
    const [service] = await db.insert(schema.services).values({
      name: body.name,
      description: body.description,
      category: body.category,
      basePrice: body.basePrice,
      durationMinutes: body.durationMinutes ?? 60,
      isActive: true,
    }).returning();
    return c.json(service, 201);
  })
  // Admin: toggle service active
  .put("/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    if ((user as any).role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [updated] = await db.update(schema.services)
      .set(body)
      .where(eq(schema.services.id, id))
      .returning();
    return c.json(updated, 200);
  });
