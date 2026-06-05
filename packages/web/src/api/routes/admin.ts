import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

const SUPER_ADMIN_EMAIL = "m.sorsor@sonnietech.com";

// Middleware: must be admin role in DB
async function requireAdmin(c: any, next: any) {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  const [dbUser] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!dbUser || dbUser.role !== "admin") return c.json({ message: "Forbidden" }, 403);
  return next();
}

// Middleware: must be the designated super admin
async function requireSuperAdmin(c: any, next: any) {
  const user = c.get("user");
  if (!user || user.email !== SUPER_ADMIN_EMAIL) return c.json({ message: "Forbidden" }, 403);
  return next();
}

export const adminRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)

  // Get all users (admin+)
  .get("/users", requireAuth, requireAdmin, async (c) => {
    const users = await db.select().from(schema.users);
    return c.json(users, 200);
  })

  // Promote a user to a role (super admin only)
  .post("/promote", requireAuth, requireSuperAdmin, async (c) => {
    const { email, role } = await c.req.json<{ email: string; role: string }>();
    const validRoles = ["customer", "mechanic", "admin", "dispatcher"] as const;
    if (!email || !validRoles.includes(role as any)) {
      return c.json({ message: "Invalid email or role" }, 400);
    }
    const [updated] = await db
      .update(schema.users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(schema.users.email, email))
      .returning();
    if (!updated) return c.json({ message: "User not found" }, 404);
    return c.json({ message: "Role updated", user: updated }, 200);
  })

  // Deactivate a user (admin+)
  .post("/deactivate", requireAuth, requireAdmin, async (c) => {
    const { userId } = await c.req.json<{ userId: string }>();
    const [updated] = await db
      .update(schema.users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.users.id, userId))
      .returning();
    if (!updated) return c.json({ message: "User not found" }, 404);
    return c.json({ message: "User deactivated", user: updated }, 200);
  })

  // Stats overview (admin+)
  .get("/stats", requireAuth, requireAdmin, async (c) => {
    const [users, vehicles, appointments, mechanics] = await Promise.all([
      db.select().from(schema.users),
      db.select().from(schema.vehicles),
      db.select().from(schema.appointments),
      db.select().from(schema.mechanics),
    ]);
    return c.json({
      totalUsers: users.length,
      totalVehicles: vehicles.length,
      totalAppointments: appointments.length,
      totalMechanics: mechanics.length,
      admins: users.filter((u) => u.role === "admin").length,
      customers: users.filter((u) => u.role === "customer").length,
      dispatchers: users.filter((u) => u.role === "dispatcher").length,
    }, 200);
  });
