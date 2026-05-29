import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

export const usersRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)
  // Get current user profile (with custom DB fields)
  .get("/me", requireAuth, async (c) => {
    const user = c.get("user")!;
    const [dbUser] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
    return c.json(dbUser ?? null, 200);
  })
  // Update profile
  .put("/me", requireAuth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();
    const allowed = ["name", "phone", "address", "profilePhoto"] as const;
    const updates: Partial<typeof schema.users.$inferInsert> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) (updates as any)[key] = body[key];
    }
    (updates as any).updatedAt = new Date();
    const [updated] = await db.update(schema.users).set(updates).where(eq(schema.users.id, user.id)).returning();
    return c.json(updated, 200);
  })
  // Admin: list all users
  .get("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    if ((user as any).role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const users = await db.select().from(schema.users);
    return c.json(users, 200);
  });
