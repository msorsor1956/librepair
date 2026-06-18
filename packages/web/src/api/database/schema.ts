import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Users table (customers, mechanics, admins)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role", { enum: ["customer", "mechanic", "admin", "dispatcher"] }).notNull().default("customer"),
  address: text("address"),
  profilePhoto: text("profile_photo"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Vehicles
export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  vin: text("vin"),
  licensePlate: text("license_plate"),
  color: text("color"),
  mileage: integer("mileage").default(0),
  lastServiceDate: integer("last_service_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Services
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  basePrice: real("base_price").notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Mechanics
export const mechanics = sqliteTable("mechanics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  specializations: text("specializations"),
  rating: real("rating").default(5.0),
  totalJobs: integer("total_jobs").default(0),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  bio: text("bio"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Appointments
export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: text("customer_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  mechanicId: integer("mechanic_id").references(() => mechanics.id),
  serviceId: integer("service_id").references(() => services.id),
  serviceType: text("service_type", { enum: ["in-shop", "home-service"] }).notNull().default("in-shop"),
  status: text("status", { enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"] }).notNull().default("pending"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  notes: text("notes"),
  mechanicNotes: text("mechanic_notes"),
  customerAddress: text("customer_address"),
  totalCost: real("total_cost"),
  bookingFee: real("booking_fee").default(25),
  stripePaymentLinkId: text("stripe_payment_link_id"),
  stripePaymentUrl: text("stripe_payment_url"),
  calendarEventId: text("calendar_event_id"),
  calendarEventUrl: text("calendar_event_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Parts used in an appointment
export const appointmentParts = sqliteTable("appointment_parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id),
  name: text("name").notNull(),
  partNumber: text("part_number"),
  quantity: integer("quantity").notNull().default(1),
  unitCost: real("unit_cost").notNull(),
  totalCost: real("total_cost").notNull(),
  supplier: text("supplier"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Payments
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  customerId: text("customer_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  method: text("method", { enum: ["stripe", "paypal", "cash", "zelle", "cashapp"] }).notNull(),
  status: text("status", { enum: ["pending", "paid", "failed", "refunded"] }).notNull().default("pending"),
  transactionId: text("transaction_id"),
  type: text("type", { enum: ["booking_fee", "deposit", "full", "invoice"] }).notNull().default("full"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Invoices
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  customerId: text("customer_id").notNull().references(() => users.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").default(0),
  total: real("total").notNull(),
  status: text("status", { enum: ["draft", "sent", "paid", "overdue"] }).notNull().default("draft"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Reviews
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  customerId: text("customer_id").notNull().references(() => users.id),
  mechanicId: integer("mechanic_id").references(() => mechanics.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Maintenance Reminders
export const reminders = sqliteTable("reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  type: text("type").notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }),
  dueMileage: integer("due_mileage"),
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  message: text("message"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Notifications
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["appointment", "payment", "reminder", "system", "promotion"] }).notNull().default("system"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Car Inventory (Vehicles for Sale)
export const carInventory = sqliteTable("car_inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stockNumber: text("stock_number").unique(),   // 6-digit e.g. "LR8472"
  inventoryId: text("inventory_id").unique(),   // 9-digit e.g. "LR-482930-1"
  title: text("title").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: real("price").notNull(),
  mileage: integer("mileage").default(0),
  color: text("color"),
  condition: text("condition", { enum: ["excellent", "good", "fair"] }).notNull().default("good"),
  description: text("description"),
  videoUrl: text("video_url"),
  photos: text("photos").default("[]"), // JSON array of up to 9 photo URLs
  videos: text("videos").default("[]"), // JSON array of video URLs (mp4, mov, webm)
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  status: text("status", { enum: ["available", "sold", "reserved"] }).notNull().default("available"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Site-wide Announcements (pushed by super admin to frontend)
export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["info", "warning", "promo", "alert"] }).notNull().default("info"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  link: text("link"),           // optional CTA link
  linkLabel: text("link_label"), // e.g. "Browse Inventory"
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export * from "./auth-schema";
