import { pgTable, text, serial, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const statusEnum = pgEnum("record_status", ["pending", "approved", "rejected"]);

export const airlinesTable = pgTable("airlines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  iataCode: text("iata_code").unique(),
  cbpCode: text("cbp_code"),
  icaoCode: text("icao_code"),
  country: text("country"),
  awbPrefix: text("awb_prefix"),
  status: statusEnum("status").notNull().default("pending"),
  source: text("source"),
  flaggedForReview: boolean("flagged_for_review").notNull().default(false),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAirlineSchema = createInsertSchema(airlinesTable).omit({ id: true, createdAt: true, lastUpdated: true });
export type InsertAirline = z.infer<typeof insertAirlineSchema>;
export type Airline = typeof airlinesTable.$inferSelect;
