import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

export const remindersRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)
  .get("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const reminders = await db
      .select()
      .from(schema.reminders)
      .where(eq(schema.reminders.userId, user.id));
    return c.json(reminders, 200);
  })
  .post("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();
    const [reminder] = await db.insert(schema.reminders).values({
      userId: user.id,
      vehicleId: body.vehicleId ? parseInt(body.vehicleId) : null,
      type: body.type,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      dueMileage: body.dueMileage ?? null,
      message: body.message ?? null,
    }).returning();
    return c.json(reminder, 201);
  })
  .delete("/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const [existing] = await db.select().from(schema.reminders).where(eq(schema.reminders.id, id));
    if (!existing || existing.userId !== user.id) return c.json({ message: "Not found" }, 404);
    await db.delete(schema.reminders).where(eq(schema.reminders.id, id));
    return c.json({ success: true }, 200);
  });
