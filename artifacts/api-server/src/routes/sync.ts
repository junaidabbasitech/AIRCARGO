import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  airlinesTable,
  airportsTable,
  auditLogsTable,
  rawImportsTable,
  syncLogsTable,
} from "@workspace/db/schema";
import { sql, desc, eq, inArray } from "drizzle-orm";
import { ingestAirlines } from "../lib/ingest/airlines.js";
import { ingestAirports } from "../lib/ingest/airports.js";

const router: IRouter = Router();

router.post("/sync", async (req, res) => {
  const { sources } = req.body as { sources: string[] };
  if (!Array.isArray(sources) || sources.length === 0) {
    return res.status(400).json({ message: "sources array is required" });
  }

  const errors: string[] = [];
  let totalPending = 0;
  let totalSkipped = 0;

  try {
    for (const source of sources) {
      if (source === "iata_airlines" || source === "cbp_airlines") {
        try {
          const result = await ingestAirlines(db, rawImportsTable, airlinesTable, source);
          totalPending += result.pending;
          totalSkipped += result.skipped;
        } catch (err: unknown) {
          errors.push(`Airlines sync (${source}): ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      if (source === "iata_airports" || source === "us_airports" || source === "cbp_ports") {
        try {
          const result = await ingestAirports(db, rawImportsTable, airportsTable, source);
          totalPending += result.pending;
          totalSkipped += result.skipped;
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
    airlinesAdded: 0,
    airportsAdded: 0,
    success: errors.length === 0,
    errors,
    syncedAt,
  });

  await db.insert(auditLogsTable).values({
    entityType: "sync",
    action: "SYNC_STAGED",
    level: "info",
    changes: { sources, totalPending, totalSkipped, errors },
    performedBy: "admin",
  });

  return res.json({
    success: errors.length === 0,
    pending: totalPending,
    skipped: totalSkipped,
    errors,
    syncedAt: syncedAt.toISOString(),
    message: `Sync complete: ${totalPending} records pending approval, ${totalSkipped} already in database (auto-skipped)`,
  });
});

router.get("/sync/status", async (req, res) => {
  try {
    const [lastSync] = await db.select().from(syncLogsTable).orderBy(desc(syncLogsTable.syncedAt)).limit(1);
    const [airlineCount] = await db.select({ count: sql<number>`count(*)::int` }).from(airlinesTable);
    const [airportCount] = await db.select({ count: sql<number>`count(*)::int` }).from(airportsTable);
    const [pendingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(airlinesTable).where(sql`status = 'pending'`);
    const [pendingAirportCount] = await db.select({ count: sql<number>`count(*)::int` }).from(airportsTable).where(sql`status = 'pending'`);
    const [pendingRaw] = await db.select({ count: sql<number>`count(*)::int` }).from(rawImportsTable).where(eq(rawImportsTable.status, "pending"));

    return res.json({
      lastSyncAt: lastSync?.syncedAt?.toISOString() ?? null,
      lastSyncSources: lastSync?.sources ?? [],
      totalAirlines: airlineCount.count,
      totalAirports: airportCount.count,
      pendingReview: (pendingCount.count ?? 0) + (pendingAirportCount.count ?? 0),
      pendingApproval: pendingRaw.count,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/sync/raw-data", async (req, res) => {
  try {
    const { source, status, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];
    if (source) conditions.push(sql`source = ${source}`);
    if (status) conditions.push(sql`status = ${status}`);

    const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(rawImportsTable).where(where).orderBy(desc(rawImportsTable.importedAt)).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(rawImportsTable).where(where),
    ]);

    return res.json({ data, total: countResult[0].count, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/sync/raw-data/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [raw] = await db.select().from(rawImportsTable).where(eq(rawImportsTable.id, id)).limit(1);
    if (!raw) return res.status(404).json({ message: "Record not found" });
    if (raw.status !== "pending") return res.status(400).json({ message: `Record is already ${raw.status}` });

    const data = raw.rawData as any;

    if (raw.dataType === "airline") {
      await db.insert(airlinesTable).values({
        name: data.name,
        iataCode: data.iataCode ?? null,
        icaoCode: data.icaoCode ?? null,
        cbpCode: data.cbpCode ?? null,
        country: data.country ?? null,
        source: raw.source,
        status: "approved",
        flaggedForReview: false,
        lastUpdated: new Date(),
      }).onConflictDoNothing();
    } else if (raw.dataType === "airport") {
      await db.insert(airportsTable).values({
        name: data.name,
        iataCode: data.iataCode ?? null,
        cbpPortCode: data.cbpPortCode ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        country: data.country ?? null,
        customsApproved: data.customsApproved ?? false,
        source: raw.source,
        status: "approved",
        flaggedForReview: false,
        lastUpdated: new Date(),
      }).onConflictDoNothing();
    }

    await db.update(rawImportsTable).set({ status: "approved", processedAt: new Date() }).where(eq(rawImportsTable.id, id));

    await db.insert(auditLogsTable).values({ level: "info", entityType: "sync", action: "SYNC_APPROVE", changes: { id, dataType: raw.dataType, data }, performedBy: "admin" });

    return res.json({ ok: true, message: `${raw.dataType} approved and added to database` });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/sync/raw-data/:id/reject", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [raw] = await db.select().from(rawImportsTable).where(eq(rawImportsTable.id, id)).limit(1);
    if (!raw) return res.status(404).json({ message: "Record not found" });

    await db.update(rawImportsTable).set({ status: "rejected", processedAt: new Date() }).where(eq(rawImportsTable.id, id));

    await db.insert(auditLogsTable).values({ level: "info", entityType: "sync", action: "SYNC_REJECT", changes: { id, dataType: raw.dataType }, performedBy: "admin" });

    return res.json({ ok: true, message: `${raw.dataType} rejected` });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/sync/raw-data/bulk-approve", async (req, res) => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids required" });

    let approved = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const [raw] = await db.select().from(rawImportsTable).where(eq(rawImportsTable.id, id)).limit(1);
        if (!raw || raw.status !== "pending") continue;

        const data = raw.rawData as any;
        if (raw.dataType === "airline") {
          await db.insert(airlinesTable).values({
            name: data.name, iataCode: data.iataCode ?? null, icaoCode: data.icaoCode ?? null,
            cbpCode: data.cbpCode ?? null, country: data.country ?? null, source: raw.source,
            status: "approved", flaggedForReview: false, lastUpdated: new Date(),
          }).onConflictDoNothing();
        } else if (raw.dataType === "airport") {
          await db.insert(airportsTable).values({
            name: data.name, iataCode: data.iataCode ?? null, cbpPortCode: data.cbpPortCode ?? null,
            city: data.city ?? null, state: data.state ?? null, country: data.country ?? null,
            customsApproved: data.customsApproved ?? false, source: raw.source,
            status: "approved", flaggedForReview: false, lastUpdated: new Date(),
          }).onConflictDoNothing();
        }
        await db.update(rawImportsTable).set({ status: "approved", processedAt: new Date() }).where(eq(rawImportsTable.id, id));
        approved++;
      } catch (e: any) {
        errors.push(`ID ${id}: ${e.message}`);
      }
    }

    await db.insert(auditLogsTable).values({ level: "info", entityType: "sync", action: "SYNC_BULK_APPROVE", changes: { ids, approved, errors }, performedBy: "admin" });

    return res.json({ ok: true, approved, errors, message: `${approved} records approved and added to database` });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/sync/raw-data/bulk-reject", async (req, res) => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids required" });

    await db.update(rawImportsTable).set({ status: "rejected", processedAt: new Date() })
      .where(inArray(rawImportsTable.id, ids));

    await db.insert(auditLogsTable).values({ level: "info", entityType: "sync", action: "SYNC_BULK_REJECT", changes: { ids, count: ids.length }, performedBy: "admin" });

    return res.json({ ok: true, rejected: ids.length });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
