import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { usersRouter } from "./routes/users";
import { vehiclesRouter } from "./routes/vehicles";
import { servicesRouter } from "./routes/services";
import { appointmentsRouter } from "./routes/appointments";
import { mechanicsRouter } from "./routes/mechanics";
import { notificationsRouter } from "./routes/notifications";
import { remindersRouter } from "./routes/reminders";

const app = new Hono()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath("api")
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/users", usersRouter)
  .route("/vehicles", vehiclesRouter)
  .route("/services", servicesRouter)
  .route("/appointments", appointmentsRouter)
  .route("/mechanics", mechanicsRouter)
  .route("/notifications", notificationsRouter)
  .route("/reminders", remindersRouter);

export type AppType = typeof app;
export default app;
