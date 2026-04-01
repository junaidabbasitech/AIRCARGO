import { pgTable, text, serial, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rawImportsTable = pgTable("raw_imports", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  dataType: text("data_type").notNull(),
  rawData: jsonb("raw_data").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  flagged: boolean("flagged").notNull().default(false),
  status: text("status").notNull().default("pending"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const insertRawImportSchema = createInsertSchema(rawImportsTable).omit({ id: true, importedAt: true });
export type InsertRawImport = z.infer<typeof insertRawImportSchema>;
export type RawImport = typeof rawImportsTable.$inferSelect;
