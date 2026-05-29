import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

export const vehiclesRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)
  .get("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const vehicles = await db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.userId, user.id));
    return c.json(vehicles, 200);
  })
  .post("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();
    const [vehicle] = await db.insert(schema.vehicles).values({
      userId: user.id,
      make: body.make,
      model: body.model,
      year: body.year,
      vin: body.vin,
      licensePlate: body.licensePlate,
      color: body.color,
      mileage: body.mileage ?? 0,
    }).returning();
    return c.json(vehicle, 201);
  })
  .put("/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [existing] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
    if (!existing || existing.userId !== user.id) return c.json({ message: "Not found" }, 404);
    const [updated] = await db.update(schema.vehicles).set(body).where(eq(schema.vehicles.id, id)).returning();
    return c.json(updated, 200);
  })
  .delete("/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const [existing] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
    if (!existing || existing.userId !== user.id) return c.json({ message: "Not found" }, 404);
    await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));
    return c.json({ success: true }, 200);
  });
