import { Hono } from "hono";
import type { HonoVariables } from "../types";
import { authMiddleware } from "../middleware/auth";

export const firebaseAuthRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)
  .get("/status", (c) => {
    const user = c.get("user");
    const session = c.get("session");
    if (!user || !session) return c.json({ message: "Unauthorized" }, 401);
    return c.json({
      user,
      session: { uid: session.uid, issuedAt: session.iat, expiresAt: session.exp },
      approvalStatus: user.role === "admin" ? "approved" : user.approvalStatus,
    }, 200);
  })
  .post("/register", (c) => {
    const user = c.get("user");
    const session = c.get("session");
    if (!user || !session) return c.json({ message: "Unauthorized" }, 401);
    return c.json({ user, approvalStatus: user.role === "admin" ? "approved" : user.approvalStatus }, 200);
  });
