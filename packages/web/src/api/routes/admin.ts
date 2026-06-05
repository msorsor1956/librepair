import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";
import { auth } from "../auth";

const SUPER_ADMIN_EMAIL = "m.sorsor@sonnietech.com";

async function getDbUser(userId: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  return u;
}

// Middleware: must be admin role in DB
async function requireAdmin(c: any, next: any) {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  const dbUser = await getDbUser(user.id);
  if (!dbUser || dbUser.role !== "admin") return c.json({ message: "Forbidden" }, 403);
  return next();
}

// Middleware: must be the designated super admin
async function requireSuperAdmin(c: any, next: any) {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  const dbUser = await getDbUser(user.id);
  if (!dbUser || dbUser.email !== SUPER_ADMIN_EMAIL) return c.json({ message: "Forbidden — super admin only" }, 403);
  return next();
}

export const adminRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)

  /* ─────────────────────────────────────────
     USER MANAGEMENT
  ───────────────────────────────────────── */

  // Get all users (admin+)
  .get("/users", requireAuth, requireAdmin, async (c) => {
    const users = await db.select().from(schema.users);
    return c.json({ users }, 200);
  })

  // Get single user (admin+)
  .get("/users/:id", requireAuth, requireAdmin, async (c) => {
    const id = c.req.param("id");
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    if (!user) return c.json({ message: "Not found" }, 404);
    return c.json(user, 200);
  })

  // Create a new customer (admin adds them manually)
  .post("/customers", requireAuth, requireAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.email || !body.name) return c.json({ message: "name and email required" }, 400);
    // Check if user with email already exists
    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, body.email));
    if (existing) return c.json({ message: "Email already registered" }, 409);
    // Create auth account
    const signupResult = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password ?? "TempPass123!",
        name: body.name,
      },
    });
    if (!signupResult?.user?.id) return c.json({ message: "Failed to create user" }, 500);
    // Update extra fields in DB
    const [updated] = await db
      .update(schema.users)
      .set({
        phone: body.phone ?? null,
        address: body.address ?? null,
        role: "customer",
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, signupResult.user.id))
      .returning();
    return c.json(updated, 201);
  })

  // Update any customer's profile (admin+)
  .patch("/customers/:id", requireAuth, requireAdmin, async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const allowed = ["name", "phone", "address", "email"] as const;
    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const [updated] = await db.update(schema.users).set(updates).where(eq(schema.users.id, id)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  // Delete customer (admin+)
  .delete("/customers/:id", requireAuth, requireAdmin, async (c) => {
    const id = c.req.param("id");
    await db.update(schema.users).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.users.id, id));
    return c.json({ success: true }, 200);
  })

  /* ─────────────────────────────────────────
     VEHICLE MANAGEMENT
  ───────────────────────────────────────── */

  // Get vehicles for a specific user (admin+)
  .get("/customers/:id/vehicles", requireAuth, requireAdmin, async (c) => {
    const userId = c.req.param("id");
    const vehicles = await db.select().from(schema.vehicles).where(eq(schema.vehicles.userId, userId));
    return c.json({ vehicles }, 200);
  })

  // Add vehicle for any customer (admin+)
  .post("/customers/:id/vehicles", requireAuth, requireAdmin, async (c) => {
    const userId = c.req.param("id");
    const body = await c.req.json();
    if (!body.make || !body.model || !body.year) return c.json({ message: "make, model, year required" }, 400);
    const [vehicle] = await db.insert(schema.vehicles).values({
      userId,
      make: body.make,
      model: body.model,
      year: parseInt(body.year),
      vin: body.vin ?? null,
      licensePlate: body.licensePlate ?? null,
      color: body.color ?? null,
      mileage: body.mileage ? parseInt(body.mileage) : 0,
    }).returning();
    return c.json(vehicle, 201);
  })

  // Update vehicle (admin+)
  .patch("/customers/:userId/vehicles/:vehicleId", requireAuth, requireAdmin, async (c) => {
    const vehicleId = parseInt(c.req.param("vehicleId"));
    const body = await c.req.json();
    const allowed = ["make", "model", "year", "vin", "licensePlate", "color", "mileage"] as const;
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const [updated] = await db.update(schema.vehicles).set(updates).where(eq(schema.vehicles.id, vehicleId)).returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(updated, 200);
  })

  // Delete vehicle (admin+)
  .delete("/customers/:userId/vehicles/:vehicleId", requireAuth, requireAdmin, async (c) => {
    const vehicleId = parseInt(c.req.param("vehicleId"));
    await db.delete(schema.vehicles).where(eq(schema.vehicles.id, vehicleId));
    return c.json({ success: true }, 200);
  })

  /* ─────────────────────────────────────────
     SUPER ADMIN: CREATE NEW ADMIN
  ───────────────────────────────────────── */

  // Create a new admin account (super admin only)
  .post("/create-admin", requireAuth, requireSuperAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.email || !body.name) return c.json({ message: "name and email required" }, 400);

    const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, body.email));
    if (existing) {
      // If already exists, promote them to admin
      const [updated] = await db.update(schema.users)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(schema.users.email, body.email))
        .returning();
      return c.json({ message: "Existing user promoted to admin", user: updated }, 200);
    }

    // Create new auth account
    const signupResult = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password ?? "AdminPass123!",
        name: body.name,
      },
    });
    if (!signupResult?.user?.id) return c.json({ message: "Failed to create user" }, 500);

    // Set role to admin
    const [updated] = await db
      .update(schema.users)
      .set({ role: "admin", phone: body.phone ?? null, updatedAt: new Date() })
      .where(eq(schema.users.id, signupResult.user.id))
      .returning();

    return c.json({ message: "Admin created", user: updated }, 201);
  })

  /* ─────────────────────────────────────────
     EXISTING ENDPOINTS
  ───────────────────────────────────────── */

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
    const [allUsers, allVehicles, allAppointments, allMechanics] = await Promise.all([
      db.select().from(schema.users),
      db.select().from(schema.vehicles),
      db.select().from(schema.appointments),
      db.select().from(schema.mechanics),
    ]);
    return c.json({
      totalUsers: allUsers.length,
      totalVehicles: allVehicles.length,
      totalAppointments: allAppointments.length,
      totalMechanics: allMechanics.length,
      admins: allUsers.filter((u) => u.role === "admin").length,
      customers: allUsers.filter((u) => u.role === "customer").length,
      dispatchers: allUsers.filter((u) => u.role === "dispatcher").length,
    }, 200);
  });
