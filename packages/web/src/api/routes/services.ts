import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

async function requireAdmin(c: any, next: any) {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  const [dbUser] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, user.id));
  if (dbUser?.role !== "admin") return c.json({ message: "Forbidden" }, 403);
  return next();
}

export const servicesRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)

  // List all services (admin sees inactive too via ?all=true)
  .get("/", async (c) => {
    const all = c.req.query("all") === "true";
    const services = all
      ? await db.select().from(schema.services)
      : await db.select().from(schema.services).where(eq(schema.services.isActive, true));
    return c.json(services, 200);
  })

  // Seed default services
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
  .post("/", requireAuth, requireAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.name || !body.category || body.basePrice == null) {
      return c.json({ message: "name, category, basePrice required" }, 400);
    }
    const [service] = await db.insert(schema.services).values({
      name: body.name,
      description: body.description ?? null,
      category: body.category,
      basePrice: parseFloat(body.basePrice),
      durationMinutes: body.durationMinutes ? parseInt(body.durationMinutes) : 60,
      isActive: true,
    }).returning();
    return c.json(service, 201);
  })

  // Admin: update service (name, price, category, description, duration, isActive)
  .patch("/:id", requireAuth, requireAdmin, async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const allowed = ["name", "description", "category", "basePrice", "durationMinutes", "isActive"] as const;
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "basePrice") updates[key] = parseFloat(body[key]);
        else if (key === "durationMinutes") updates[key] = parseInt(body[key]);
        else updates[key] = body[key];
      }
    }
    const [updated] = await db.update(schema.services).set(updates).where(eq(schema.services.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  // Keep PUT for backwards compat (book.tsx etc.)
  .put("/:id", requireAuth, requireAdmin, async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [updated] = await db.update(schema.services).set(body).where(eq(schema.services.id, id)).returning();
    return c.json(updated, 200);
  })

  // Admin: hard-delete service
  .delete("/:id", requireAuth, requireAdmin, async (c) => {
    const id = parseInt(c.req.param("id"));
    await db.delete(schema.services).where(eq(schema.services.id, id));
    return c.json({ success: true }, 200);
  });
