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
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "declined",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "open_draft",
  "backlog",
  "in_progress",
  "waiting_on_customer",
  "complete",
]);

export const intakeDraftStatusEnum = pgEnum("intake_draft_status", [
  "pending_review",
  "approved",
  "discarded",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
]);

export const reviewOutreachEnum = pgEnum("review_outreach", [
  "not_asked",
  "asked",
  "reviewed",
  "skip",
]);

export const quoteSentimentEnum = pgEnum("quote_sentiment", [
  "positive",
  "neutral",
  "negative",
]);

export type QuoteSentiment = (typeof quoteSentimentEnum.enumValues)[number];
export type ReviewOutreach = (typeof reviewOutreachEnum.enumValues)[number];

export const ipRuleActionEnum = pgEnum("ip_rule_action", ["flag", "block"]);

// Repair-invoice payment lifecycle via Shopify Draft Orders (Task 2 of
// docs/shopify-migration-plan.md) — a bare invoice starts "not_sent"; stays
// that way for invoices that get paid in person (cash/Terminal-equivalent,
// tracked manually) or printed and never sent electronically at all.
export const invoicePaymentStatusEnum = pgEnum("invoice_payment_status", [
  "not_sent",
  "invoice_sent",
  "paid",
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
  // 0–100 snapshot from lib/crm/health.ts (jobs + tickets + quotes + intake sentiment).
  healthScore: integer("health_score"),
  healthScoredAt: timestamp("health_scored_at", { mode: "date" }),
  reviewOutreach: reviewOutreachEnum("review_outreach").notNull().default("not_asked"),
  reviewAskedAt: timestamp("review_asked_at", { mode: "date" }),
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

export type IntakeUrgency = "low" | "normal" | "high";

export type IntakeExtraction = {
  customerName: string | null;
  phone: string | null;
  email: string | null;
  bikeYearMakeModel: string | null;
  workNeeded: string | null;
  conversationSummary: string | null;
  // 0–100 how happy the customer sounds about the shop/work. Null if there is no conversation.
  sentimentScore: number | null;
  // Verbatim customer sentences only — never paraphrased or invented.
  positiveQuotes: string[];
  negativeQuotes: string[];
  // Shop-owner brief: what is going on, what they want, how they sound, what to do.
  ownerBrief: string | null;
  recommendedNextStep: string | null;
  urgency: IntakeUrgency | null;
  missingInfo: string[];
  matchedFromCrm: boolean;
};

// Screenshot/email intake — a draft job lands in the Open Drafts column
// with extracted fields here. Customer + ticket are created only when the
// owner approves (see lib/intake/promote.ts).
export const intakeDrafts = pgTable("intake_drafts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  jobId: text("job_id")
    .notNull()
    .unique()
    .references(() => jobs.id, { onDelete: "cascade" }),
  // Resend receiving email id — webhook deliveries are at-least-once.
  resendEmailId: text("resend_email_id").unique(),
  telegramMediaGroupId: text("telegram_media_group_id").unique(),
  source: text("source").notNull().default("email"),
  fromEmail: text("from_email"),
  subject: text("subject"),
  bodyText: text("body_text"),
  photoUrls: text("photo_urls").array().notNull().default([]),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  bikeYearMakeModel: text("bike_year_make_model"),
  workNeeded: text("work_needed"),
  conversationSummary: text("conversation_summary"),
  extracted: jsonb("extracted").$type<IntakeExtraction | null>(),
  status: intakeDraftStatusEnum("status").notNull().default("pending_review"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Verbatim customer lines pulled from intake screenshots (or added by the
// owner). Positive ones can be flagged for later site testimonials; the
// Google-review queue prefers people who already said something kind.
export const customerQuotes = pgTable(
  "customer_quotes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    intakeDraftId: text("intake_draft_id").references(() => intakeDrafts.id, {
      onDelete: "set null",
    }),
    quote: text("quote").notNull(),
    normalizedQuote: text("normalized_quote").notNull(),
    sentiment: quoteSentimentEnum("sentiment").notNull(),
    source: text("source").notNull().default("intake"),
    approvedForSite: boolean("approved_for_site").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [unique("customer_quotes_customer_normalized").on(table.customerId, table.normalizedQuote)],
);

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

// Funnel events (booking_start, booking_step, booking_submit, call_click...).
// sessionId is what turns these into a funnel rather than a pile of counters —
// it's how you tell "started and finished" from "started and left".
export const analyticsEvents = pgTable("analytics_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  path: text("path"),
  sessionId: text("session_id"),
  meta: jsonb("meta"),
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

// storeOrders/storeOrderItems (the Stripe/Printify-direct order model) were
// removed here as part of the Shopify migration (see
// docs/shopify-migration-plan.md) — merch orders now live entirely in
// Shopify's own admin, and repair-invoice "orders" are serviceInvoices below,
// which never depended on this table. Dropped from the database once this
// branch's Neon connection points at an isolated branch (see the migration
// doc for why that matters before running db:push here).

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
  intakeDraft: one(intakeDrafts, {
    fields: [jobs.id],
    references: [intakeDrafts.jobId],
  }),
}));

export const intakeDraftsRelations = relations(intakeDrafts, ({ one }) => ({
  job: one(jobs, {
    fields: [intakeDrafts.jobId],
    references: [jobs.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  requests: many(appointmentRequests),
  jobs: many(jobs),
  tickets: many(tickets),
  quotes: many(customerQuotes),
}));

export const customerQuotesRelations = relations(customerQuotes, ({ one }) => ({
  customer: one(customers, {
    fields: [customerQuotes.customerId],
    references: [customers.id],
  }),
  intakeDraft: one(intakeDrafts, {
    fields: [customerQuotes.intakeDraftId],
    references: [intakeDrafts.id],
  }),
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
  // run through the card. See computeInvoiceTotals in lib/invoices/totals.ts.
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
  // Shopify Draft Order tie-in (Task 2) — set once "Send Shopify Invoice" is
  // used. draftOrderId/invoiceUrl come back from draftOrderCreate; orderId +
  // paidAt are filled in by the orders/paid webhook once Shopify converts
  // the draft into a real paid order. See lib/shopify/admin.ts and
  // app/api/shopify/webhooks/orders-paid/route.ts.
  paymentStatus: invoicePaymentStatusEnum("payment_status").notNull().default("not_sent"),
  shopifyDraftOrderId: text("shopify_draft_order_id"),
  shopifyInvoiceUrl: text("shopify_invoice_url"),
  shopifyOrderId: text("shopify_order_id"),
  paidAt: timestamp("paid_at", { mode: "date" }),
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
export type IntakeDraftRow = typeof intakeDrafts.$inferSelect;
export type NewIntakeDraftRow = typeof intakeDrafts.$inferInsert;
export type CustomerQuoteRow = typeof customerQuotes.$inferSelect;
export type NewCustomerQuoteRow = typeof customerQuotes.$inferInsert;
export type PageViewRow = typeof pageViews.$inferSelect;
export type AnalyticsEventRow = typeof analyticsEvents.$inferSelect;
export type IpRuleRow = typeof ipRules.$inferSelect;
export type AdminUserRow = typeof adminUsers.$inferSelect;
export type ServiceInvoiceRow = typeof serviceInvoices.$inferSelect;
export type NewServiceInvoiceRow = typeof serviceInvoices.$inferInsert;
export type ServiceInvoiceJobRow = typeof serviceInvoiceJobs.$inferSelect;
export type NewServiceInvoiceJobRow = typeof serviceInvoiceJobs.$inferInsert;
export type ServiceInvoicePartsLineRow = typeof serviceInvoicePartsLines.$inferSelect;
export type NewServiceInvoicePartsLineRow = typeof serviceInvoicePartsLines.$inferInsert;
