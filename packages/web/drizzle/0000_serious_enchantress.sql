CREATE TABLE IF NOT EXISTS "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"link" text,
	"link_label" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointment_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointment_id" integer NOT NULL,
	"name" text NOT NULL,
	"part_number" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_cost" double precision NOT NULL,
	"total_cost" double precision NOT NULL,
	"supplier" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"vehicle_id" integer,
	"mechanic_id" integer,
	"service_id" integer,
	"service_type" text DEFAULT 'in-shop' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"notes" text,
	"mechanic_notes" text,
	"customer_address" text,
	"total_cost" double precision,
	"booking_fee" double precision DEFAULT 25,
	"stripe_payment_link_id" text,
	"stripe_payment_url" text,
	"calendar_event_id" text,
	"calendar_event_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "car_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_number" text,
	"inventory_id" text,
	"title" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"price" double precision NOT NULL,
	"mileage" integer DEFAULT 0,
	"color" text,
	"condition" text DEFAULT 'good' NOT NULL,
	"description" text,
	"video_url" text,
	"photos" text DEFAULT '[]',
	"videos" text DEFAULT '[]',
	"contact_phone" text,
	"contact_email" text,
	"status" text DEFAULT 'available' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "car_inventory_stock_number_unique" UNIQUE("stock_number"),
	CONSTRAINT "car_inventory_inventory_id_unique" UNIQUE("inventory_id")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointment_id" integer,
	"customer_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"subtotal" double precision NOT NULL,
	"tax" double precision DEFAULT 0,
	"total" double precision NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"due_date" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "mechanics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"specializations" text,
	"rating" double precision DEFAULT 5,
	"total_jobs" integer DEFAULT 0,
	"is_available" boolean DEFAULT true NOT NULL,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'system' NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointment_id" integer,
	"customer_id" text NOT NULL,
	"amount" double precision NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_id" text,
	"type" text DEFAULT 'full' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vehicle_id" integer,
	"type" text NOT NULL,
	"due_date" timestamp with time zone,
	"due_mileage" integer,
	"is_completed" boolean DEFAULT false,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rental_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_ref" text NOT NULL,
	"customer_id" text NOT NULL,
	"vehicle_id" integer NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"total_days" integer NOT NULL,
	"daily_rate" double precision NOT NULL,
	"deposit_amount" double precision DEFAULT 25 NOT NULL,
	"total_amount" double precision NOT NULL,
	"deposit_paid" boolean DEFAULT false NOT NULL,
	"balance_due" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"deposit_transaction_id" text,
	"pickup_at" timestamp with time zone,
	"return_at" timestamp with time zone,
	"pickup_mileage" integer,
	"return_mileage" integer,
	"pickup_notes" text,
	"return_notes" text,
	"customer_notes" text,
	"admin_notes" text,
	"agreement_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "rental_bookings_booking_ref_unique" UNIQUE("booking_ref")
);
--> statement-breakpoint
CREATE TABLE "rental_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"customer_id" text NOT NULL,
	"amount" double precision NOT NULL,
	"type" text NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rental_vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"color" text,
	"license_plate" text,
	"vin" text,
	"mileage" integer DEFAULT 0,
	"fuel_type" text DEFAULT 'gasoline' NOT NULL,
	"transmission" text DEFAULT 'automatic' NOT NULL,
	"seats" integer DEFAULT 5,
	"daily_rate" double precision DEFAULT 100 NOT NULL,
	"deposit_amount" double precision DEFAULT 25 NOT NULL,
	"description" text,
	"photos" text DEFAULT '[]',
	"is_available" boolean DEFAULT true NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointment_id" integer,
	"customer_id" text NOT NULL,
	"mechanic_id" integer,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"base_price" double precision NOT NULL,
	"duration_minutes" integer DEFAULT 60,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"firebase_uid" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"address" text,
	"profile_photo" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"approval_notes" text,
	"approved_at" timestamp with time zone,
	"approved_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"vin" text,
	"license_plate" text,
	"color" text,
	"mileage" integer DEFAULT 0,
	"last_service_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_parts" ADD CONSTRAINT "appointment_parts_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_mechanic_id_mechanics_id_fk" FOREIGN KEY ("mechanic_id") REFERENCES "public"."mechanics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mechanics" ADD CONSTRAINT "mechanics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_bookings" ADD CONSTRAINT "rental_bookings_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_bookings" ADD CONSTRAINT "rental_bookings_vehicle_id_rental_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."rental_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_payments" ADD CONSTRAINT "rental_payments_booking_id_rental_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."rental_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_payments" ADD CONSTRAINT "rental_payments_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_mechanic_id_mechanics_id_fk" FOREIGN KEY ("mechanic_id") REFERENCES "public"."mechanics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
