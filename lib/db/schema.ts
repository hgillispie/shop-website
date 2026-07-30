import {
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
