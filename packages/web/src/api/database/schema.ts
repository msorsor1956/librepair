import { pgTable, text, integer, doublePrecision, serial, timestamp, boolean } from "drizzle-orm/pg-core";

// Users table (customers, mechanics, admins)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  // Keep the application id stable for existing domain relationships while
  // linking it to Firebase Authentication's uid.
  firebaseUid: text("firebase_uid").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role", { enum: ["customer", "mechanic", "admin", "dispatcher"] }).notNull().default("customer"),
  address: text("address"),
  profilePhoto: text("profile_photo"),
  isActive: boolean("is_active").notNull().default(true),
  approvalStatus: text("approval_status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  approvalNotes: text("approval_notes"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Vehicles
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  vin: text("vin"),
  licensePlate: text("license_plate"),
  color: text("color"),
  mileage: integer("mileage").default(0),
  lastServiceDate: timestamp("last_service_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  basePrice: doublePrecision("base_price").notNull(),
  durationMinutes: integer("duration_minutes").default(60),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Mechanics
export const mechanics = pgTable("mechanics", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  specializations: text("specializations"),
  rating: doublePrecision("rating").default(5.0),
  totalJobs: integer("total_jobs").default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  mechanicId: integer("mechanic_id").references(() => mechanics.id),
  serviceId: integer("service_id").references(() => services.id),
  serviceType: text("service_type", { enum: ["in-shop", "home-service"] }).notNull().default("in-shop"),
  status: text("status", { enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"] }).notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes"),
  mechanicNotes: text("mechanic_notes"),
  customerAddress: text("customer_address"),
  totalCost: doublePrecision("total_cost"),
  bookingFee: doublePrecision("booking_fee").default(25),
  stripePaymentLinkId: text("stripe_payment_link_id"),
  stripePaymentUrl: text("stripe_payment_url"),
  calendarEventId: text("calendar_event_id"),
  calendarEventUrl: text("calendar_event_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Parts used in an appointment
export const appointmentParts = pgTable("appointment_parts", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id),
  name: text("name").notNull(),
  partNumber: text("part_number"),
  quantity: integer("quantity").notNull().default(1),
  unitCost: doublePrecision("unit_cost").notNull(),
  totalCost: doublePrecision("total_cost").notNull(),
  supplier: text("supplier"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  customerId: text("customer_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  method: text("method", { enum: ["stripe", "paypal", "cash", "zelle", "cashapp"] }).notNull(),
  status: text("status", { enum: ["pending", "paid", "failed", "refunded"] }).notNull().default("pending"),
  transactionId: text("transaction_id"),
  type: text("type", { enum: ["booking_fee", "deposit", "full", "invoice"] }).notNull().default("full"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  customerId: text("customer_id").notNull().references(() => users.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  subtotal: doublePrecision("subtotal").notNull(),
  tax: doublePrecision("tax").default(0),
  total: doublePrecision("total").notNull(),
  status: text("status", { enum: ["draft", "sent", "paid", "overdue"] }).notNull().default("draft"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  customerId: text("customer_id").notNull().references(() => users.id),
  mechanicId: integer("mechanic_id").references(() => mechanics.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Maintenance Reminders
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  type: text("type").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  dueMileage: integer("due_mileage"),
  isCompleted: boolean("is_completed").default(false),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["appointment", "payment", "reminder", "system", "promotion", "rental", "support"] }).notNull().default("system"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Car Inventory (Vehicles for Sale)
export const carInventory = pgTable("car_inventory", {
  id: serial("id").primaryKey(),
  stockNumber: text("stock_number").unique(),
  inventoryId: text("inventory_id").unique(),
  title: text("title").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: doublePrecision("price").notNull(),
  mileage: integer("mileage").default(0),
  color: text("color"),
  condition: text("condition", { enum: ["excellent", "good", "fair"] }).notNull().default("good"),
  description: text("description"),
  videoUrl: text("video_url"),
  photos: text("photos").default("[]"),
  videos: text("videos").default("[]"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  status: text("status", { enum: ["available", "sold", "reserved"] }).notNull().default("available"),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── RENTAL VEHICLES ──────────────────────────────────────────────────────────
export const rentalVehicles = pgTable("rental_vehicles", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color"),
  licensePlate: text("license_plate"),
  vin: text("vin"),
  mileage: integer("mileage").default(0),
  fuelType: text("fuel_type", { enum: ["gasoline", "diesel", "electric", "hybrid"] }).notNull().default("gasoline"),
  transmission: text("transmission", { enum: ["automatic", "manual"] }).notNull().default("automatic"),
  seats: integer("seats").default(5),
  dailyRate: doublePrecision("daily_rate").notNull().default(100),
  depositAmount: doublePrecision("deposit_amount").notNull().default(25),
  description: text("description"),
  photos: text("photos").default("[]"), // JSON array of photo URLs
  isAvailable: boolean("is_available").notNull().default(true),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── RENTAL BOOKINGS ──────────────────────────────────────────────────────────
export const rentalBookings = pgTable("rental_bookings", {
  id: serial("id").primaryKey(),
  bookingRef: text("booking_ref").notNull().unique(), // e.g. "LR-RNT-001234"
  customerId: text("customer_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").notNull().references(() => rentalVehicles.id),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  totalDays: integer("total_days").notNull(),
  dailyRate: doublePrecision("daily_rate").notNull(),
  depositAmount: doublePrecision("deposit_amount").notNull().default(25),
  totalAmount: doublePrecision("total_amount").notNull(), // dailyRate * totalDays
  depositPaid: boolean("deposit_paid").notNull().default(false),
  balanceDue: doublePrecision("balance_due").notNull().default(0),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "cancelled", "active", "completed", "no_show"]
  }).notNull().default("pending"),
  paymentMethod: text("payment_method", {
    enum: ["credit_card", "debit_card", "cashapp", "zelle", "paypal", "cash"]
  }),
  depositTransactionId: text("deposit_transaction_id"),
  pickupAt: timestamp("pickup_at", { withTimezone: true }),
  returnAt: timestamp("return_at", { withTimezone: true }),
  pickupMileage: integer("pickup_mileage"),
  returnMileage: integer("return_mileage"),
  pickupNotes: text("pickup_notes"),
  returnNotes: text("return_notes"),
  customerNotes: text("customer_notes"),
  adminNotes: text("admin_notes"),
  agreementUrl: text("agreement_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── RENTAL PAYMENTS ──────────────────────────────────────────────────────────
export const rentalPayments = pgTable("rental_payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => rentalBookings.id),
  customerId: text("customer_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  type: text("type", { enum: ["deposit", "balance", "full", "refund"] }).notNull(),
  method: text("method", { enum: ["credit_card", "debit_card", "cashapp", "zelle", "paypal", "cash"] }).notNull(),
  status: text("status", { enum: ["pending", "paid", "failed", "refunded"] }).notNull().default("pending"),
  transactionId: text("transaction_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Site-wide Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["info", "warning", "promo", "alert"] }).notNull().default("info"),
  active: boolean("active").notNull().default(true),
  link: text("link"),
  linkLabel: text("link_label"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export * from "./auth-schema";
