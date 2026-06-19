import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, and, gte, lte, or, ne } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as firebaseAdmin from "firebase-admin";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});
const R2_BUCKET = process.env.S3_BUCKET ?? "";

function getAdminApp(): firebaseAdmin.app.App {
  if (firebaseAdmin.apps.length > 0) return firebaseAdmin.apps[0]!;
  return firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID ?? "librepair-77afa",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "librepair-77afa.appspot.com",
  });
}

async function toPresignedUrl(url: string): Promise<string> {
  if (!url || !R2_BUCKET) return url;
  if (url.includes("firebasestorage.googleapis.com") || url.includes("storage.googleapis.com")) return url;
  const isR2Host = process.env.S3_ENDPOINT && url.startsWith(process.env.S3_ENDPOINT!);
  const isCleanKey = !url.startsWith("http") && (url.startsWith("rental/") || url.startsWith("inventory/"));
  if (!isR2Host && !isCleanKey) return url;
  try {
    let key: string;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const u = new URL(url.split("?")[0]);
      key = u.pathname.replace(/^\//, "");
      if (key.startsWith(R2_BUCKET + "/")) key = key.slice(R2_BUCKET.length + 1);
    } else {
      key = url;
    }
    const cmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
    return await getSignedUrl(r2Client, cmd, { expiresIn: 7200 });
  } catch {
    return url;
  }
}

async function parseVehiclePhotos(v: any) {
  try { v.photos = typeof v.photos === "string" ? JSON.parse(v.photos) : v.photos ?? []; } catch { v.photos = []; }
  v.photos = await Promise.all((v.photos as string[]).map(toPresignedUrl));
  return v;
}

async function requireAdmin(c: any, next: any) {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  const [dbUser] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!dbUser || dbUser.role !== "admin") return c.json({ message: "Forbidden" }, 403);
  return next();
}

function genBookingRef() {
  return "LR-RNT-" + Math.floor(100000 + Math.random() * 900000).toString();
}

export const rentalsRouter = new Hono<{ Variables: HonoVariables }>()

  // ─── PUBLIC: list available rental vehicles ───────────────────────────────
  .get("/vehicles", async (c) => {
    const rows = await db
      .select()
      .from(schema.rentalVehicles)
      .where(and(eq(schema.rentalVehicles.published, true)))
      .orderBy(desc(schema.rentalVehicles.createdAt));
    return c.json({ vehicles: await Promise.all(rows.map(parseVehiclePhotos)) }, 200);
  })

  .get("/vehicles/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const [v] = await db.select().from(schema.rentalVehicles).where(eq(schema.rentalVehicles.id, id));
    if (!v) return c.json({ message: "Not found" }, 404);
    return c.json(await parseVehiclePhotos(v), 200);
  })

  // ─── PUBLIC: check availability for date range ────────────────────────────
  .get("/availability/:vehicleId", async (c) => {
    const vehicleId = Number(c.req.param("vehicleId"));
    const start = new Date(c.req.query("start") ?? "");
    const end = new Date(c.req.query("end") ?? "");
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return c.json({ available: false, message: "Invalid dates" }, 400);
    }
    const conflicts = await db
      .select()
      .from(schema.rentalBookings)
      .where(
        and(
          eq(schema.rentalBookings.vehicleId, vehicleId),
          or(
            eq(schema.rentalBookings.status, "approved"),
            eq(schema.rentalBookings.status, "active")
          ),
          lte(schema.rentalBookings.startDate, end),
          gte(schema.rentalBookings.endDate, start)
        )
      );
    return c.json({ available: conflicts.length === 0 }, 200);
  })

  // ─── CUSTOMER: book a rental ──────────────────────────────────────────────
  .post("/book", authMiddleware, requireAuth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();
    const { vehicleId, startDate, endDate, paymentMethod, customerNotes } = body;
    if (!vehicleId || !startDate || !endDate || !paymentMethod) {
      return c.json({ message: "vehicleId, startDate, endDate, paymentMethod required" }, 400);
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return c.json({ message: "Invalid date range" }, 400);
    }
    const [vehicle] = await db.select().from(schema.rentalVehicles).where(eq(schema.rentalVehicles.id, vehicleId));
    if (!vehicle || !vehicle.isAvailable || !vehicle.published) {
      return c.json({ message: "Vehicle not available" }, 400);
    }
    // check conflicts
    const conflicts = await db.select().from(schema.rentalBookings).where(
      and(
        eq(schema.rentalBookings.vehicleId, vehicleId),
        or(eq(schema.rentalBookings.status, "approved"), eq(schema.rentalBookings.status, "active")),
        lte(schema.rentalBookings.startDate, end),
        gte(schema.rentalBookings.endDate, start)
      )
    );
    if (conflicts.length > 0) return c.json({ message: "Vehicle already booked for those dates" }, 409);

    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const totalAmount = totalDays * vehicle.dailyRate;
    const deposit = vehicle.depositAmount;
    const bookingRef = genBookingRef();

    const [booking] = await db.insert(schema.rentalBookings).values({
      bookingRef,
      customerId: user.id,
      vehicleId,
      startDate: start,
      endDate: end,
      totalDays,
      dailyRate: vehicle.dailyRate,
      depositAmount: deposit,
      totalAmount,
      balanceDue: totalAmount - deposit,
      status: "pending",
      paymentMethod,
      customerNotes: customerNotes ?? null,
    }).returning();

    // notify customer
    await db.insert(schema.notifications).values({
      userId: user.id,
      type: "rental",
      title: "Rental Booking Received",
      message: `Booking ${bookingRef} received for ${vehicle.year} ${vehicle.make} ${vehicle.model}. Deposit: $${deposit.toFixed(2)}. We'll confirm shortly.`,
      isRead: false,
    });

    return c.json({ booking, vehicle }, 201);
  })

  // ─── CUSTOMER: my bookings ────────────────────────────────────────────────
  .get("/my-bookings", authMiddleware, requireAuth, async (c) => {
    const user = c.get("user")!;
    const bookings = await db
      .select()
      .from(schema.rentalBookings)
      .where(eq(schema.rentalBookings.customerId, user.id))
      .orderBy(desc(schema.rentalBookings.createdAt));
    // join vehicle info
    const result = await Promise.all(bookings.map(async (b) => {
      const [v] = await db.select().from(schema.rentalVehicles).where(eq(schema.rentalVehicles.id, b.vehicleId));
      return { ...b, vehicle: v ? await parseVehiclePhotos(v) : null };
    }));
    return c.json({ bookings: result }, 200);
  })

  // ─── CUSTOMER: cancel booking ─────────────────────────────────────────────
  .patch("/my-bookings/:id/cancel", authMiddleware, requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = Number(c.req.param("id"));
    const [booking] = await db.select().from(schema.rentalBookings)
      .where(and(eq(schema.rentalBookings.id, id), eq(schema.rentalBookings.customerId, user.id)));
    if (!booking) return c.json({ message: "Not found" }, 404);
    if (!["pending", "approved"].includes(booking.status)) {
      return c.json({ message: "Cannot cancel at this stage" }, 400);
    }
    const [updated] = await db.update(schema.rentalBookings)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(schema.rentalBookings.id, id))
      .returning();
    await db.insert(schema.notifications).values({
      userId: user.id,
      type: "rental",
      title: "Rental Booking Cancelled",
      message: `Your booking ${booking.bookingRef} has been cancelled. Note: the $${booking.depositAmount.toFixed(2)} deposit is non-refundable.`,
      isRead: false,
    });
    return c.json({ booking: updated }, 200);
  })

  // ─── CUSTOMER: my rental payments ────────────────────────────────────────
  .get("/my-payments", authMiddleware, requireAuth, async (c) => {
    const user = c.get("user")!;
    const rows = await db.select().from(schema.rentalPayments)
      .where(eq(schema.rentalPayments.customerId, user.id))
      .orderBy(desc(schema.rentalPayments.createdAt));
    return c.json({ payments: rows }, 200);
  })

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN ROUTES
  // ══════════════════════════════════════════════════════════════════════════

  // ─── ADMIN: upload vehicle photo ──────────────────────────────────────────
  .post("/admin/upload-photo", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return c.json({ message: "No file provided" }, 400);
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowedTypes.includes(file.type)) return c.json({ message: "Images only (JPG, PNG, WebP)" }, 400);
    if (file.size > 25 * 1024 * 1024) return c.json({ message: "Max 25MB" }, 400);
    const extMap: Record<string, string> = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "jpg", "image/heif": "jpg" };
    const ext = extMap[file.type] ?? "jpg";
    const key = `rental/photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    // Upload to Firebase Storage (public)
    const adminApp = getAdminApp();
    const bucket = firebaseAdmin.storage(adminApp).bucket();
    const fileRef = bucket.file(key);
    await fileRef.save(buf, { contentType: file.type, resumable: false });
    await fileRef.makePublic();
    const publicUrl = fileRef.publicUrl();
    return c.json({ url: publicUrl, key }, 200);
  })

  // ─── ADMIN: list all rental vehicles ─────────────────────────────────────
  .get("/admin/vehicles", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const rows = await db.select().from(schema.rentalVehicles).orderBy(desc(schema.rentalVehicles.createdAt));
    return c.json({ vehicles: await Promise.all(rows.map(parseVehiclePhotos)) }, 200);
  })

  // ─── ADMIN: create rental vehicle ────────────────────────────────────────
  .post("/admin/vehicles", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const body = await c.req.json();
    const { make, model, year, dailyRate, depositAmount } = body;
    if (!make || !model || !year || !dailyRate) return c.json({ message: "make, model, year, dailyRate required" }, 400);
    const photos = Array.isArray(body.photos) ? JSON.stringify(body.photos) : "[]";
    const [v] = await db.insert(schema.rentalVehicles).values({
      make, model,
      year: Number(year),
      color: body.color ?? null,
      licensePlate: body.licensePlate ?? null,
      vin: body.vin ?? null,
      mileage: body.mileage ? Number(body.mileage) : 0,
      fuelType: body.fuelType ?? "gasoline",
      transmission: body.transmission ?? "automatic",
      seats: body.seats ? Number(body.seats) : 5,
      dailyRate: Number(dailyRate),
      depositAmount: depositAmount ? Number(depositAmount) : 25,
      description: body.description ?? null,
      photos,
      isAvailable: body.isAvailable ?? true,
      published: body.published ?? true,
    }).returning();
    return c.json(await parseVehiclePhotos(v), 201);
  })

  // ─── ADMIN: update rental vehicle ────────────────────────────────────────
  .patch("/admin/vehicles/:id", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = { updatedAt: new Date() };
    const fields = ["make","model","year","color","licensePlate","vin","mileage","fuelType","transmission","seats","dailyRate","depositAmount","description","isAvailable","published"];
    for (const f of fields) if (body[f] !== undefined) updates[f] = body[f];
    if (body.photos !== undefined) updates.photos = Array.isArray(body.photos) ? JSON.stringify(body.photos) : body.photos;
    const [v] = await db.update(schema.rentalVehicles).set(updates).where(eq(schema.rentalVehicles.id, id)).returning();
    if (!v) return c.json({ message: "Not found" }, 404);
    return c.json(await parseVehiclePhotos(v), 200);
  })

  // ─── ADMIN: delete rental vehicle ────────────────────────────────────────
  .delete("/admin/vehicles/:id", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const [v] = await db.delete(schema.rentalVehicles).where(eq(schema.rentalVehicles.id, id)).returning();
    if (!v) return c.json({ message: "Not found" }, 404);
    return c.json({ message: "Deleted" }, 200);
  })

  // ─── ADMIN: all bookings ──────────────────────────────────────────────────
  .get("/admin/bookings", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const bookings = await db.select().from(schema.rentalBookings).orderBy(desc(schema.rentalBookings.createdAt));
    const result = await Promise.all(bookings.map(async (b) => {
      const [v] = await db.select().from(schema.rentalVehicles).where(eq(schema.rentalVehicles.id, b.vehicleId));
      const [u] = await db.select().from(schema.users).where(eq(schema.users.id, b.customerId));
      return { ...b, vehicle: v ? await parseVehiclePhotos(v) : null, customer: u ?? null };
    }));
    return c.json({ bookings: result }, 200);
  })

  // ─── ADMIN: update booking status ────────────────────────────────────────
  .patch("/admin/bookings/:id", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = { updatedAt: new Date() };
    const allowed = ["status","depositPaid","balanceDue","pickupAt","returnAt","pickupMileage","returnMileage","pickupNotes","returnNotes","adminNotes","depositTransactionId"];
    for (const f of allowed) if (body[f] !== undefined) updates[f] = body[f];
    // Convert date strings
    if (updates.pickupAt) updates.pickupAt = new Date(updates.pickupAt);
    if (updates.returnAt) updates.returnAt = new Date(updates.returnAt);
    const [booking] = await db.update(schema.rentalBookings).set(updates).where(eq(schema.rentalBookings.id, id)).returning();
    if (!booking) return c.json({ message: "Not found" }, 404);

    // Notify customer on status change
    if (body.status) {
      const messages: Record<string, string> = {
        approved: `Your rental booking ${booking.bookingRef} has been approved! Please pay the $${booking.depositAmount.toFixed(2)} deposit to secure your reservation.`,
        rejected: `Your rental booking ${booking.bookingRef} has been rejected. Please contact us for more information.`,
        cancelled: `Your rental booking ${booking.bookingRef} has been cancelled.`,
        active: `Your rental is now active. Vehicle picked up successfully. Enjoy your ride!`,
        completed: `Your rental ${booking.bookingRef} is complete. Thank you for renting with LibRepair!`,
        no_show: `Your rental booking ${booking.bookingRef} was marked as no-show. The deposit is non-refundable per our policy.`,
      };
      if (messages[body.status]) {
        await db.insert(schema.notifications).values({
          userId: booking.customerId,
          type: "rental",
          title: `Rental Update: ${body.status.charAt(0).toUpperCase() + body.status.slice(1).replace("_", " ")}`,
          message: messages[body.status],
          isRead: false,
        });
      }
    }
    return c.json({ booking }, 200);
  })

  // ─── ADMIN: record rental payment ────────────────────────────────────────
  .post("/admin/payments", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const body = await c.req.json();
    const { bookingId, amount, type, method, transactionId, notes } = body;
    if (!bookingId || !amount || !type || !method) return c.json({ message: "bookingId, amount, type, method required" }, 400);
    const [booking] = await db.select().from(schema.rentalBookings).where(eq(schema.rentalBookings.id, bookingId));
    if (!booking) return c.json({ message: "Booking not found" }, 404);
    const [payment] = await db.insert(schema.rentalPayments).values({
      bookingId,
      customerId: booking.customerId,
      amount: Number(amount),
      type, method,
      status: "paid",
      transactionId: transactionId ?? null,
      notes: notes ?? null,
    }).returning();
    // If deposit payment, mark depositPaid
    if (type === "deposit") {
      await db.update(schema.rentalBookings)
        .set({ depositPaid: true, depositTransactionId: transactionId ?? null, updatedAt: new Date() })
        .where(eq(schema.rentalBookings.id, bookingId));
    }
    await db.insert(schema.notifications).values({
      userId: booking.customerId,
      type: "rental",
      title: "Payment Received",
      message: `$${Number(amount).toFixed(2)} ${type} payment received for booking ${booking.bookingRef}.`,
      isRead: false,
    });
    return c.json({ payment }, 201);
  })

  // ─── ADMIN: all rental payments ──────────────────────────────────────────
  .get("/admin/payments", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const rows = await db.select().from(schema.rentalPayments).orderBy(desc(schema.rentalPayments.createdAt));
    return c.json({ payments: rows }, 200);
  })

  // ─── ADMIN: stats ─────────────────────────────────────────────────────────
  .get("/admin/stats", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const [vehicles, bookings, payments] = await Promise.all([
      db.select().from(schema.rentalVehicles),
      db.select().from(schema.rentalBookings),
      db.select().from(schema.rentalPayments),
    ]);
    const now = new Date();
    return c.json({
      totalVehicles: vehicles.length,
      availableVehicles: vehicles.filter(v => v.isAvailable && v.published).length,
      totalBookings: bookings.length,
      activeBookings: bookings.filter(b => b.status === "active").length,
      upcomingBookings: bookings.filter(b => b.status === "approved" && b.startDate > now).length,
      pendingBookings: bookings.filter(b => b.status === "pending").length,
      totalRevenue: payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0),
      depositCollected: payments.filter(p => p.status === "paid" && p.type === "deposit").reduce((s, p) => s + p.amount, 0),
    }, 200);
  });
