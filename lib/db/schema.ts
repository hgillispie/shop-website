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

export const appointmentRequests = pgTable("appointment_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  bikeYearMakeModel: text("bike_year_make_model").notNull(),
  engineType: text("engine_type").notNull(),
  serviceTypes: text("service_types").array().notNull(),
  details: text("details").notNull(),
  photoUrls: text("photo_urls").array().notNull().default([]),
  preferredDropoffAt: timestamp("preferred_dropoff_at", { mode: "date" }),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  jobNumber: serial("job_number").notNull(),
  requestId: text("request_id").references(() => appointmentRequests.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: jobStatusEnum("status").notNull().default("backlog"),
  dropoffAt: timestamp("dropoff_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const appointmentRequestsRelations = relations(
  appointmentRequests,
  ({ one }) => ({
    job: one(jobs, {
      fields: [appointmentRequests.id],
      references: [jobs.requestId],
    }),
  }),
);

export const jobsRelations = relations(jobs, ({ one }) => ({
  request: one(appointmentRequests, {
    fields: [jobs.requestId],
    references: [appointmentRequests.id],
  }),
}));

export type AppointmentRequestRow = typeof appointmentRequests.$inferSelect;
export type NewAppointmentRequestRow = typeof appointmentRequests.$inferInsert;
export type JobRow = typeof jobs.$inferSelect;
export type NewJobRow = typeof jobs.$inferInsert;
