import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, and } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import type { HonoVariables } from "../types";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});
const R2_ENDPOINT = process.env.S3_ENDPOINT ?? "";
const R2_BUCKET = process.env.S3_BUCKET ?? "";

async function toPresignedUrl(url: string): Promise<string> {
  if (!url || !R2_ENDPOINT || !url.startsWith(R2_ENDPOINT)) return url;
  try {
    const bucketPrefix = `${R2_ENDPOINT}/${R2_BUCKET}/`;
    const key = url.startsWith(bucketPrefix) ? url.slice(bucketPrefix.length) : url.split("/").slice(-2).join("/");
    const cmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key });
    return await getSignedUrl(r2Client, cmd, { expiresIn: 3600 });
  } catch {
    return url;
  }
}

async function getDbUser(userId: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  return u;
}

async function requireAdmin(c: any, next: any) {
  const user = c.get("user");
  if (!user) return c.json({ message: "Unauthorized" }, 401);
  const dbUser = await getDbUser(user.id);
  if (!dbUser || dbUser.role !== "admin") return c.json({ message: "Forbidden" }, 403);
  return next();
}

export const inventoryRouter = new Hono<{ Variables: HonoVariables }>()

  // ── PUBLIC: get all published listings only ──
  .get("/", async (c) => {
    const listings = await db
      .select()
      .from(schema.carInventory)
      .where(eq(schema.carInventory.published, true))
      .orderBy(desc(schema.carInventory.createdAt));
    return c.json({ listings: await Promise.all(listings.map(parsePhotos)) }, 200);
  })

  // ── PUBLIC: get single listing ──
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const [listing] = await db
      .select()
      .from(schema.carInventory)
      .where(eq(schema.carInventory.id, id));
    if (!listing) return c.json({ message: "Not found" }, 404);
    return c.json(await parsePhotos(listing), 200);
  })

  // ── ADMIN: create listing ──
  .post("/", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const body = await c.req.json();
    if (!body.title || !body.make || !body.model || !body.year || !body.price) {
      return c.json({ message: "title, make, model, year, price required" }, 400);
    }
    const photos = Array.isArray(body.photos) ? JSON.stringify(body.photos) : "[]";
    const [created] = await db
      .insert(schema.carInventory)
      .values({
        title: body.title,
        make: body.make,
        model: body.model,
        year: Number(body.year),
        price: Number(body.price),
        mileage: body.mileage ? Number(body.mileage) : 0,
        color: body.color ?? null,
        condition: body.condition ?? "good",
        description: body.description ?? null,
        videoUrl: body.videoUrl ?? null,
        photos,
        contactPhone: body.contactPhone ?? null,
        contactEmail: body.contactEmail ?? null,
        status: body.status ?? "available",
        featured: body.featured ?? false,
      })
      .returning();
    return c.json(await parsePhotos(created), 201);
  })

  // ── ADMIN: update listing ──
  .patch("/:id", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.make !== undefined) updates.make = body.make;
    if (body.model !== undefined) updates.model = body.model;
    if (body.year !== undefined) updates.year = Number(body.year);
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.mileage !== undefined) updates.mileage = Number(body.mileage);
    if (body.color !== undefined) updates.color = body.color;
    if (body.condition !== undefined) updates.condition = body.condition;
    if (body.description !== undefined) updates.description = body.description;
    if (body.videoUrl !== undefined) updates.videoUrl = body.videoUrl;
    if (body.photos !== undefined) updates.photos = Array.isArray(body.photos) ? JSON.stringify(body.photos) : body.photos;
    if (body.contactPhone !== undefined) updates.contactPhone = body.contactPhone;
    if (body.contactEmail !== undefined) updates.contactEmail = body.contactEmail;
    if (body.status !== undefined) updates.status = body.status;
    if (body.featured !== undefined) updates.featured = body.featured;
    const [updated] = await db
      .update(schema.carInventory)
      .set(updates)
      .where(eq(schema.carInventory.id, id))
      .returning();
    if (!updated) return c.json({ message: "Not found" }, 404);
    return c.json(await parsePhotos(updated), 200);
  })

  // ── ADMIN: delete listing ──
  .delete("/:id", authMiddleware, requireAuth, requireAdmin, async (c) => {
    const id = Number(c.req.param("id"));
    const [deleted] = await db
      .delete(schema.carInventory)
      .where(eq(schema.carInventory.id, id))
      .returning();
    if (!deleted) return c.json({ message: "Not found" }, 404);
    return c.json({ message: "Deleted" }, 200);
  });

async function parsePhotos(listing: any) {
  try {
    listing.photos = typeof listing.photos === "string" ? JSON.parse(listing.photos) : listing.photos ?? [];
  } catch { listing.photos = []; }
  try {
    listing.videos = typeof listing.videos === "string" ? JSON.parse(listing.videos) : listing.videos ?? [];
  } catch { listing.videos = []; }
  listing.photos = await Promise.all((listing.photos as string[]).map(toPresignedUrl));
  listing.videos = await Promise.all((listing.videos as string[]).map(toPresignedUrl));
  return listing;
}
