import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { airportsTable } from "./airports";

export const groundHandlersTable = pgTable("ground_handlers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  airportId: integer("airport_id").references(() => airportsTable.id, { onDelete: "set null" }),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  services: text("services"),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGroundHandlerSchema = createInsertSchema(groundHandlersTable).omit({ id: true, createdAt: true, lastUpdated: true });
export type InsertGroundHandler = z.infer<typeof insertGroundHandlerSchema>;
export type GroundHandler = typeof groundHandlersTable.$inferSelect;
