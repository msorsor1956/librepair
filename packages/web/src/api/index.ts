import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { usersRouter } from "./routes/users";
import { vehiclesRouter } from "./routes/vehicles";
import { servicesRouter } from "./routes/services";
import { appointmentsRouter } from "./routes/appointments";
import { mechanicsRouter, mechanicSelfRouter } from "./routes/mechanics";
import { notificationsRouter } from "./routes/notifications";
import { remindersRouter } from "./routes/reminders";
import { adminRouter } from "./routes/admin";
import { partsRouter } from "./routes/parts";
import { paymentsRouter } from "./routes/payments";
import { phoneAuthRouter } from "./routes/phone-auth";
import { customerRouter } from "./routes/customer";
import { inventoryRouter } from "./routes/inventory";
import { superAdminRouter } from "./routes/superadmin";
import { db } from "./database";
import * as schema from "./database/schema";
import { eq, and, gt } from "drizzle-orm";

const ALLOWED_ORIGINS = [
  "https://librepair.wasmer.app",
  "https://librepair-sonnietechnologyllc.wasmer.app",
  "https://librepair-admin.wasmer.app",
  "https://librepair-admin-sonnietechnologyllc.wasmer.app",
];

const app = new Hono()
  .use(cors({
    origin: (origin) => (origin && ALLOWED_ORIGINS.some(a => origin.startsWith(a))) ? origin : (origin ?? "*"),
    credentials: true,
    exposeHeaders: ["set-auth-token"],
  }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath("api")
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/users", usersRouter)
  .route("/vehicles", vehiclesRouter)
  .route("/services", servicesRouter)
  .route("/appointments", appointmentsRouter)
  .route("/mechanics", mechanicsRouter)
  .route("/mechanics", mechanicSelfRouter)
  .route("/notifications", notificationsRouter)
  .route("/reminders", remindersRouter)
  .route("/admin", adminRouter)
  .route("/parts", partsRouter)
  .route("/payments", paymentsRouter)
  .route("/phone-auth", phoneAuthRouter)
  .route("/customer", customerRouter)
  .route("/inventory", inventoryRouter)
  .route("/superadmin", superAdminRouter)
  // Public: active announcements for frontend banner
  .get("/announcements", async (c) => {
    const now = new Date();
    const rows = await db.select().from(schema.announcements)
      .where(eq(schema.announcements.active, true));
    const active = rows.filter(a => !a.expiresAt || a.expiresAt > now);
    return c.json({ announcements: active }, 200);
  });

export type AppType = typeof app;
export default app;
