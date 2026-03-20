import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { statusEnum } from "./airlines";

export const airportsTable = pgTable("airports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  iataCode: text("iata_code"),
  cbpPortCode: text("cbp_port_code"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  customsApproved: boolean("customs_approved").notNull().default(false),
  status: statusEnum("status").notNull().default("pending"),
  source: text("source"),
  flaggedForReview: boolean("flagged_for_review").notNull().default(false),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAirportSchema = createInsertSchema(airportsTable).omit({ id: true, createdAt: true, lastUpdated: true });
export type InsertAirport = z.infer<typeof insertAirportSchema>;
export type Airport = typeof airportsTable.$inferSelect;
