import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "declined",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "backlog",
  "in_progress",
  "waiting_on_customer",
  "complete",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
]);

export const ipRuleActionEnum = pgEnum("ip_rule_action", ["flag", "block"]);

export const storeOrderStatusEnum = pgEnum("store_order_status", [
  "pending_payment",
  "paid",
  "fulfillment_failed",
  "in_production",
  "shipped",
  "canceled",
  "refunded",
]);

export const storeOrderSourceEnum = pgEnum("store_order_source", [
  "online",
  "in_person",
]);

export const customers = pgTable("customers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  // How this customer first entered the system — informs CRM reporting.
  source: text("source").notNull().default("form"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const appointmentRequests = pgTable("appointment_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  customerId: text("customer_id").references(() => customers.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  bikeYearMakeModel: text("bike_year_make_model").notNull(),
  serviceTypes: text("service_types").array().notNull(),
  details: text("details").notNull(),
  photoUrls: text("photo_urls").array().notNull().default([]),
  preferredDropoffAt: timestamp("preferred_dropoff_at", { mode: "date" }),
  status: requestStatusEnum("status").notNull().default("pending"),
  ipAddress: text("ip_address"),
  // Set when the submitting IP matches an active ip_rules entry — surfaced
  // in admin, never used to silently drop a submission.
  flaggedReason: text("flagged_reason"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  jobNumber: serial("job_number").notNull(),
  requestId: text("request_id").references(() => appointmentRequests.id),
  customerId: text("customer_id").references(() => customers.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: jobStatusEnum("status").notNull().default("backlog"),
  dropoffAt: timestamp("dropoff_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ticketNumber: serial("ticket_number").notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  jobId: text("job_id").references(() => jobs.id),
  subject: text("subject").notNull(),
  details: text("details"),
  status: ticketStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// First-party analytics — no third-party account needed. One row per page
// load, captured via a client-side beacon (see lib/analytics-client.ts).
export const pageViews = pgTable("page_views", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  path: text("path").notNull(),
  referrer: text("referrer"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Lets the owner flag/block submissions from specific IPs or CIDR ranges.
// Matching is informational (flag) by default — see lib/ip-rules.ts.
export const ipRules = pgTable("ip_rules", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  cidr: text("cidr").notNull(),
  action: ipRuleActionEnum("action").notNull().default("flag"),
  note: text("note"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// DB-backed admin login (replaces the env-var-only credential).
export const adminUsers = pgTable("admin_users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Store: online purchases (via Stripe Payment Element + Printify fulfillment)
// and in-person counter sales (via Stripe Terminal) both land here — one
// order model for both channels, so a shared product source stays honest.
export const storeOrders = pgTable("store_orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // Cosmetic only (email subjects, admin table) — never accept this as a
  // lookup key from an unauthenticated request. Use `id` for that; a
  // sequential integer is trivially guessable, the guest order-confirmation
  // page is unauthenticated by design.
  orderNumber: serial("order_number").notNull(),
  source: storeOrderSourceEnum("source").notNull().default("online"),
  status: storeOrderStatusEnum("status").notNull().default("pending_payment"),
  // Nullable — an in-person sale may not capture an email at all.
  email: text("email"),
  // Printify address_to shape: firstName/lastName/phone/country/region/
  // address1/address2/city/zip. Null for in_person (nothing ships).
  shippingAddress: jsonb("shipping_address"),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  // Not collected yet — always 0 for now, wired up as a real column so
  // adding tax later doesn't mean retrofitting the pricing/PaymentIntent path.
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  // Printify charges shipping per print provider, not once per order —
  // array of { printProviderId: number, cents: number } so that's shown
  // honestly rather than collapsed into one estimate.
  shippingBreakdown: jsonb("shipping_breakdown"),
  // Unique — doubles as an idempotency backstop alongside the atomic
  // status-flip guard in the webhook handler.
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  printifyOrderId: text("printify_order_id"),
  // Set when Printify order creation fails after payment already succeeded —
  // surfaced in admin so a paid, unfulfilled order is never silently stuck.
  printifyError: text("printify_error"),
  trackingNumber: text("tracking_number"),
  trackingCarrier: text("tracking_carrier"),
  ipAddress: text("ip_address"),
  // Same pattern as appointmentRequests.flaggedReason — set when the
  // submitting IP matches an active ip_rules entry, surfaced in admin,
  // never used to silently drop an order.
  flaggedReason: text("flagged_reason"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const storeOrderItems = pgTable("store_order_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => storeOrders.id),
  printifyProductId: text("printify_product_id").notNull(),
  // Printify variant/print-provider ids are numeric, unlike the Mongo-style
  // string product id.
  printifyVariantId: integer("printify_variant_id").notNull(),
  printProviderId: integer("print_provider_id").notNull(),
  // Snapshots at time of order, so historical orders/emails stay accurate
  // even if the live Printify catalog changes later.
  title: text("title").notNull(),
  variantLabel: text("variant_label"),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  imageUrl: text("image_url"),
});

export const appointmentRequestsRelations = relations(
  appointmentRequests,
  ({ one }) => ({
    job: one(jobs, {
      fields: [appointmentRequests.id],
      references: [jobs.requestId],
    }),
    customer: one(customers, {
      fields: [appointmentRequests.customerId],
      references: [customers.id],
    }),
  }),
);

export const jobsRelations = relations(jobs, ({ one }) => ({
  request: one(appointmentRequests, {
    fields: [jobs.requestId],
    references: [appointmentRequests.id],
  }),
  customer: one(customers, {
    fields: [jobs.customerId],
    references: [customers.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  requests: many(appointmentRequests),
  jobs: many(jobs),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  customer: one(customers, {
    fields: [tickets.customerId],
    references: [customers.id],
  }),
  job: one(jobs, {
    fields: [tickets.jobId],
    references: [jobs.id],
  }),
}));

export const storeOrdersRelations = relations(storeOrders, ({ many }) => ({
  items: many(storeOrderItems),
}));

export const storeOrderItemsRelations = relations(storeOrderItems, ({ one }) => ({
  order: one(storeOrders, {
    fields: [storeOrderItems.orderId],
    references: [storeOrders.id],
  }),
}));

// Service invoices — the printed repair-order/receipt for bike work (see
// components/admin/InvoiceForm.tsx), deliberately its own standalone tree
// rather than linked to `jobs`/`customers`: a fresh entry every time, same
// spirit as the Terminal's manual-entry flow, but saved so past invoices can
// be reopened or reprinted. Doesn't touch the appointment/CRM tables at all.
export const serviceInvoices = pgTable("service_invoices", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // Cosmetic display number (the paper form's "R.O. NUMBER") — same
  // never-a-lookup-key posture as storeOrders.orderNumber, though invoice
  // pages are admin-only anyway so it's a lower-stakes convention here.
  invoiceNumber: serial("invoice_number").notNull(),
  serviceAdvisor: text("service_advisor"),
  // Editable independently of createdAt — the owner may write this up a
  // day or two after the actual drop-off and want the printed date to
  // reflect that, not whenever they happened to sit down and type it in.
  dateWritten: timestamp("date_written", { mode: "date" }).notNull().defaultNow(),
  // Customer/vehicle fields are free text, not FKs — this form is filled by
  // hand for whoever's in front of the counter, same as the paper original.
  customerName: text("customer_name").notNull(),
  customerAddress: text("customer_address"),
  customerCityStateZip: text("customer_city_state_zip"),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  vehicleYear: text("vehicle_year"),
  vehicleMake: text("vehicle_make"),
  vehicleModel: text("vehicle_model"),
  vehicleColor: text("vehicle_color"),
  vehicleVin: text("vehicle_vin"),
  licensePlate: text("license_plate"),
  mileageIn: text("mileage_in"),
  odometerOut: text("odometer_out"),
  // Tax is a manual rate the owner sets per invoice (not a fixed config
  // value) — real repair shops often tax parts but not standalone labor, so
  // which subtotal(s) it applies to is configurable too, not assumed.
  // Numeric (not float) since it's a rate people expect to type exactly,
  // e.g. "6.000" — drizzle returns numeric columns as strings, parsed at
  // the edges (lib/validations/invoices.ts), never compared as floats.
  taxRatePercent: numeric("tax_rate_percent", { precision: 5, scale: 3 })
    .notNull()
    .default("0"),
  taxAppliesToParts: boolean("tax_applies_to_parts").notNull().default(true),
  taxAppliesToLabor: boolean("tax_applies_to_labor").notNull().default(false),
  // Optional credit-card processing surcharge — off by default, computed on
  // (parts + labor + tax) when enabled, i.e. the actual amount that would
  // run through the card. See computeInvoiceTotals in lib/store/invoice-totals.ts.
  ccFeeEnabled: boolean("cc_fee_enabled").notNull().default(false),
  ccFeeRatePercent: numeric("cc_fee_rate_percent", { precision: 5, scale: 3 })
    .notNull()
    .default("0"),
  // Snapshot totals, recomputed server-side from the nested jobs/parts on
  // every save (never trusted from the client) — stored rather than
  // recomputed on read so a past invoice's printed total never drifts if
  // the computation logic changes later.
  partsTotalCents: integer("parts_total_cents").notNull().default(0),
  laborTotalCents: integer("labor_total_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  ccFeeCents: integer("cc_fee_cents").notNull().default(0),
  totalDueCents: integer("total_due_cents").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// One row per "JOB 1 / JOB 2 / ..." block on the printed form — a single
// customer-reported problem within one visit, not the same concept as the
// `jobs` table above (which is one row per whole repair visit for the
// Board/Kanban pipeline).
export const serviceInvoiceJobs = pgTable("service_invoice_jobs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => serviceInvoices.id, { onDelete: "cascade" }),
  // Display order — jobs are added/removed freely, so this isn't implied by id.
  position: integer("position").notNull().default(0),
  techInitials: text("tech_initials"),
  customerDescription: text("customer_description"),
  technicianFindings: text("technician_findings"),
  correctionPerformed: text("correction_performed"),
  // Flat-rate labor, hand-typed by the owner — deliberately not itemized by
  // hours (matches how the paper form's "LABOR — FLAT RATE" box works).
  laborCents: integer("labor_cents").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const serviceInvoicePartsLines = pgTable("service_invoice_parts_lines", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  invoiceJobId: text("invoice_job_id")
    .notNull()
    .references(() => serviceInvoiceJobs.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  description: text("description").notNull().default(""),
  qty: integer("qty").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
});

export const serviceInvoicesRelations = relations(serviceInvoices, ({ many }) => ({
  jobs: many(serviceInvoiceJobs),
}));

export const serviceInvoiceJobsRelations = relations(
  serviceInvoiceJobs,
  ({ one, many }) => ({
    invoice: one(serviceInvoices, {
      fields: [serviceInvoiceJobs.invoiceId],
      references: [serviceInvoices.id],
    }),
    parts: many(serviceInvoicePartsLines),
  }),
);

export const serviceInvoicePartsLinesRelations = relations(
  serviceInvoicePartsLines,
  ({ one }) => ({
    job: one(serviceInvoiceJobs, {
      fields: [serviceInvoicePartsLines.invoiceJobId],
      references: [serviceInvoiceJobs.id],
    }),
  }),
);

export type AppointmentRequestRow = typeof appointmentRequests.$inferSelect;
export type NewAppointmentRequestRow = typeof appointmentRequests.$inferInsert;
export type JobRow = typeof jobs.$inferSelect;
export type NewJobRow = typeof jobs.$inferInsert;
export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;
export type TicketRow = typeof tickets.$inferSelect;
export type NewTicketRow = typeof tickets.$inferInsert;
export type PageViewRow = typeof pageViews.$inferSelect;
export type IpRuleRow = typeof ipRules.$inferSelect;
export type AdminUserRow = typeof adminUsers.$inferSelect;
export type StoreOrderRow = typeof storeOrders.$inferSelect;
export type NewStoreOrderRow = typeof storeOrders.$inferInsert;
export type StoreOrderItemRow = typeof storeOrderItems.$inferSelect;
export type NewStoreOrderItemRow = typeof storeOrderItems.$inferInsert;
export type ServiceInvoiceRow = typeof serviceInvoices.$inferSelect;
export type NewServiceInvoiceRow = typeof serviceInvoices.$inferInsert;
export type ServiceInvoiceJobRow = typeof serviceInvoiceJobs.$inferSelect;
export type NewServiceInvoiceJobRow = typeof serviceInvoiceJobs.$inferInsert;
export type ServiceInvoicePartsLineRow = typeof serviceInvoicePartsLines.$inferSelect;
export type NewServiceInvoicePartsLineRow = typeof serviceInvoicePartsLines.$inferInsert;
