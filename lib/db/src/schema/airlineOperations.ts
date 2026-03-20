import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { airlinesTable } from "./airlines";
import { airportsTable } from "./airports";

export const airlineOperationsTable = pgTable("airline_operations", {
  id: serial("id").primaryKey(),
  airlineId: integer("airline_id").notNull().references(() => airlinesTable.id, { onDelete: "cascade" }),
  airportId: integer("airport_id").notNull().references(() => airportsTable.id, { onDelete: "cascade" }),
  firmsCode: text("firms_code"),
  iscAmount: text("isc_amount"),
  iscPayableAt: text("isc_payable_at"),
  iscPayableTo: text("isc_payable_to"),
  contactNumber: text("contact_number"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAirlineOperationSchema = createInsertSchema(airlineOperationsTable).omit({ id: true, createdAt: true, lastUpdated: true });
export type InsertAirlineOperation = z.infer<typeof insertAirlineOperationSchema>;
export type AirlineOperation = typeof airlineOperationsTable.$inferSelect;
