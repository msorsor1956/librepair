import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";

async function getDbRole(userId: string): Promise<string> {
  const [u] = await db.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, userId));
  return u?.role ?? "customer";
}

export const partsRouter = new Hono<{ Variables: HonoVariables }>()
  .use("*", authMiddleware)

  // Get parts for an appointment
  .get("/:appointmentId", requireAuth, async (c) => {
    const user = c.get("user")!;
    const aptId = parseInt(c.req.param("appointmentId"));
    const role = await getDbRole(user.id);
    const [apt] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, aptId));
    if (!apt) return c.json({ message: "Not found" }, 404);
    if (apt.customerId !== user.id && role !== "admin" && role !== "mechanic") {
      return c.json({ message: "Forbidden" }, 403);
    }
    const parts = await db.select().from(schema.appointmentParts).where(eq(schema.appointmentParts.appointmentId, aptId));
    return c.json(parts, 200);
  })

  // Add part (mechanic/admin only)
  .post("/:appointmentId", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const aptId = parseInt(c.req.param("appointmentId"));
    const body = await c.req.json();
    const qty = parseInt(body.quantity ?? 1);
    const unitCost = parseFloat(body.unitCost);
    const [part] = await db.insert(schema.appointmentParts).values({
      appointmentId: aptId,
      name: body.name,
      partNumber: body.partNumber ?? null,
      quantity: qty,
      unitCost,
      totalCost: qty * unitCost,
      supplier: body.supplier ?? null,
    }).returning();

    // Recalculate total cost on appointment
    const parts = await db.select().from(schema.appointmentParts).where(eq(schema.appointmentParts.appointmentId, aptId));
    const partsTotal = parts.reduce((sum, p) => sum + p.totalCost, 0);
    const [apt] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, aptId));
    const serviceTotal = (apt?.bookingFee ?? 0);
    await db.update(schema.appointments).set({ totalCost: partsTotal + serviceTotal, updatedAt: new Date() }).where(eq(schema.appointments.id, aptId));

    return c.json(part, 201);
  })

  // Edit part (mechanic/admin only — NO delete for mechanics, only admin can delete)
  .put("/:appointmentId/:partId", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "mechanic" && role !== "admin") return c.json({ message: "Forbidden" }, 403);
    const aptId = parseInt(c.req.param("appointmentId"));
    const partId = parseInt(c.req.param("partId"));
    const body = await c.req.json();
    const qty = parseInt(body.quantity ?? 1);
    const unitCost = parseFloat(body.unitCost);
    const [updated] = await db.update(schema.appointmentParts).set({
      name: body.name,
      partNumber: body.partNumber ?? null,
      quantity: qty,
      unitCost,
      totalCost: qty * unitCost,
      supplier: body.supplier ?? null,
    }).where(eq(schema.appointmentParts.id, partId)).returning();

    // Recalculate
    const parts = await db.select().from(schema.appointmentParts).where(eq(schema.appointmentParts.appointmentId, aptId));
    const partsTotal = parts.reduce((sum, p) => sum + p.totalCost, 0);
    const [apt] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, aptId));
    await db.update(schema.appointments).set({ totalCost: partsTotal + (apt?.bookingFee ?? 0), updatedAt: new Date() }).where(eq(schema.appointments.id, aptId));

    return c.json(updated, 200);
  })

  // Delete part (admin only — mechanics cannot delete)
  .delete("/:appointmentId/:partId", requireAuth, async (c) => {
    const user = c.get("user")!;
    const role = await getDbRole(user.id);
    if (role !== "admin") return c.json({ message: "Forbidden — only admin can delete parts" }, 403);
    const aptId = parseInt(c.req.param("appointmentId"));
    const partId = parseInt(c.req.param("partId"));
    await db.delete(schema.appointmentParts).where(eq(schema.appointmentParts.id, partId));

    // Recalculate
    const parts = await db.select().from(schema.appointmentParts).where(eq(schema.appointmentParts.appointmentId, aptId));
    const partsTotal = parts.reduce((sum, p) => sum + p.totalCost, 0);
    const [apt] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, aptId));
    await db.update(schema.appointments).set({ totalCost: partsTotal + (apt?.bookingFee ?? 0), updatedAt: new Date() }).where(eq(schema.appointments.id, aptId));

    return c.json({ success: true }, 200);
  });
