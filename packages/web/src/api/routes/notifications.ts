import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

export const notificationsRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)
  .get("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, user.id))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(50);
    return c.json(notifications, 200);
  })
  .put("/:id/read", requireAuth, async (c) => {
    const id = parseInt(c.req.param("id"));
    const [updated] = await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.id, id))
      .returning();
    return c.json(updated, 200);
  })
  // Mark all read
  .put("/read-all", requireAuth, async (c) => {
    const user = c.get("user")!;
    await db.update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.userId, user.id));
    return c.json({ success: true }, 200);
  });
