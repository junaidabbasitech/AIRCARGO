import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const syncLogsTable = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  sources: jsonb("sources").notNull().$type<string[]>(),
  airlinesAdded: integer("airlines_added").notNull().default(0),
  airportsAdded: integer("airports_added").notNull().default(0),
  success: boolean("success").notNull().default(true),
  errors: jsonb("errors").notNull().$type<string[]>().default([]),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSyncLogSchema = createInsertSchema(syncLogsTable).omit({ id: true, syncedAt: true });
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type SyncLog = typeof syncLogsTable.$inferSelect;
