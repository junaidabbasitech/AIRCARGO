import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  airlinesTable,
  airportsTable,
  auditLogsTable,
  rawImportsTable,
  syncLogsTable,
} from "@workspace/db/schema";
import { sql, desc } from "drizzle-orm";
import { ingestAirlines } from "../lib/ingest/airlines.js";
import { ingestAirports } from "../lib/ingest/airports.js";

const router: IRouter = Router();

router.post("/sync", async (req, res) => {
  const { sources } = req.body as { sources: string[] };
  if (!Array.isArray(sources) || sources.length === 0) {
    return res.status(400).json({ message: "sources array is required" });
  }

  const errors: string[] = [];
  let airlinesAdded = 0;
  let airportsAdded = 0;

  try {
    for (const source of sources) {
      if (source === "iata_airlines" || source === "cbp_airlines") {
        try {
          const added = await ingestAirlines(db, rawImportsTable, airlinesTable, source);
          airlinesAdded += added;
        } catch (err: unknown) {
          errors.push(`Airlines sync (${source}): ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      if (source === "iata_airports" || source === "us_airports" || source === "cbp_ports") {
        try {
          const added = await ingestAirports(db, rawImportsTable, airportsTable, source);
          airportsAdded += added;
        } catch (err: unknown) {
          errors.push(`Airports sync (${source}): ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  } catch (err: unknown) {
    errors.push(`Sync failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const syncedAt = new Date();

  await db.insert(syncLogsTable).values({
    sources,
    airlinesAdded,
    airportsAdded,
    success: errors.length === 0,
    errors,
    syncedAt,
  });

  await db.insert(auditLogsTable).values({
    entityType: "system",
    action: "sync",
    changes: { sources, airlinesAdded, airportsAdded, errors },
    performedBy: "admin",
  });

  res.json({
    success: errors.length === 0,
    airlinesAdded,
    airportsAdded,
    errors,
    syncedAt: syncedAt.toISOString(),
  });
});

router.get("/sync/status", async (req, res) => {
  try {
    const [lastSync] = await db.select().from(syncLogsTable).orderBy(desc(syncLogsTable.syncedAt)).limit(1);

    const [airlineCount] = await db.select({ count: sql<number>`count(*)::int` }).from(airlinesTable);
    const [airportCount] = await db.select({ count: sql<number>`count(*)::int` }).from(airportsTable);
    const [pendingCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(airlinesTable)
      .where(sql`status = 'pending'`);
    const [pendingAirportCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(airportsTable)
      .where(sql`status = 'pending'`);

    res.json({
      lastSyncAt: lastSync?.syncedAt?.toISOString() ?? null,
      lastSyncSources: lastSync?.sources ?? [],
      totalAirlines: airlineCount.count,
      totalAirports: airportCount.count,
      pendingReview: (pendingCount.count ?? 0) + (pendingAirportCount.count ?? 0),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/sync/raw-data", async (req, res) => {
  try {
    const { source, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const where = source ? sql`source = ${source}` : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(rawImportsTable).where(where).orderBy(desc(rawImportsTable.importedAt)).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(rawImportsTable).where(where),
    ]);

    res.json({ data, total: countResult[0].count, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
