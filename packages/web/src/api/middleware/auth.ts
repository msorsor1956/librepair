import { createMiddleware } from "hono/factory";
import type { HonoVariables } from "../types";
import { verifyBearerToken } from "../firebase-admin";
import { canAccessProtectedContent } from "../authorization";
import { findOrCreateApplicationUser } from "../user-access";

export const authMiddleware = createMiddleware<{ Variables: HonoVariables }>(async (c, next) => {
  const token = await verifyBearerToken(c.req.header("Authorization"));
  if (!token) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  const { user } = await findOrCreateApplicationUser(token);
  c.set("user", user);
  c.set("session", token);
  return next();
});

export const requireAuth = createMiddleware<{ Variables: HonoVariables }>(async (c, next) => {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  if (!user.isActive) return c.json({ message: "Account is disabled", status: "rejected" }, 403);
  if (!canAccessProtectedContent(user)) {
    const message = user.approvalStatus === "rejected"
      ? "Your account request was rejected. Contact LIBrepair support if you believe this is an error."
      : "Your account is pending administrator approval.";
    return c.json({ message, status: user.approvalStatus }, 403);
  }
  return next();
});
