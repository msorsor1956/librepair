import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

export const mechanicsRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)
  // Public: list available mechanics
  .get("/", async (c) => {
    const mechanics = await db
      .select()
      .from(schema.mechanics)
      .where(eq(schema.mechanics.isAvailable, true));
    return c.json(mechanics, 200);
  })
  // Get mechanic profile for current user
  .get("/me", requireAuth, async (c) => {
    const user = c.get("user")!;
    const [mechanic] = await db.select().from(schema.mechanics).where(eq(schema.mechanics.userId, user.id));
    return c.json(mechanic ?? null, 200);
  })
  // Admin: toggle availability
  .put("/:id/availability", requireAuth, async (c) => {
    const user = c.get("user")!;
    if ((user as any).role !== "admin" && (user as any).role !== "mechanic") {
      return c.json({ message: "Forbidden" }, 403);
    }
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const [updated] = await db.update(schema.mechanics)
      .set({ isAvailable: body.isAvailable })
      .where(eq(schema.mechanics.id, id))
      .returning();
    return c.json(updated, 200);
  });
