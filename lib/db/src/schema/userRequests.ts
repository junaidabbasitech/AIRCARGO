import { pgTable, text, serial, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const requestStatusEnum = pgEnum("request_status", ["pending", "reviewed", "approved", "rejected"]);
export const requestTypeEnum = pgEnum("request_type", [
  "new_airline",
  "new_ground_handler",
  "firms_code",
  "isc_charges",
  "payable_to",
  "payable_by",
  "contact_info",
  "other",
]);

export const userRequestsTable = pgTable("user_requests", {
  id: serial("id").primaryKey(),
  type: requestTypeEnum("type").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  subject: text("subject").notNull(),
  details: text("details").notNull(),
  airlineName: text("airline_name"),
  airlineIata: text("airline_iata"),
  airportIata: text("airport_iata"),
  firmsCode: text("firms_code"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  additionalData: jsonb("additional_data"),
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const insertUserRequestSchema = createInsertSchema(userRequestsTable).omit({ id: true, submittedAt: true, reviewedAt: true, adminNotes: true });
export type InsertUserRequest = z.infer<typeof insertUserRequestSchema>;
export type UserRequest = typeof userRequestsTable.$inferSelect;
