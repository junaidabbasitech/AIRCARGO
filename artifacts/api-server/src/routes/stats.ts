import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { airlinesTable, airportsTable, groundHandlersTable, syncLogsTable } from "@workspace/db/schema";
import { sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  try {
    const [
      airlineStats,
      airportStats,
      handlerCount,
      lastSync,
    ] = await Promise.all([
      db.select({
        total: sql<number>`count(*)::int`,
        approved: sql<number>`sum(case when status = 'approved' then 1 else 0 end)::int`,
        pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)::int`,
        rejected: sql<number>`sum(case when status = 'rejected' then 1 else 0 end)::int`,
      }).from(airlinesTable),
      db.select({
        total: sql<number>`count(*)::int`,
        approved: sql<number>`sum(case when status = 'approved' then 1 else 0 end)::int`,
        pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)::int`,
        rejected: sql<number>`sum(case when status = 'rejected' then 1 else 0 end)::int`,
        customsApproved: sql<number>`sum(case when customs_approved = true then 1 else 0 end)::int`,
      }).from(airportsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(groundHandlersTable),
      db.select().from(syncLogsTable).orderBy(desc(syncLogsTable.syncedAt)).limit(1),
    ]);

    return res.json({
      totalAirlines: airlineStats[0].total,
      approvedAirlines: airlineStats[0].approved ?? 0,
      pendingAirlines: airlineStats[0].pending ?? 0,
      rejectedAirlines: airlineStats[0].rejected ?? 0,
      totalAirports: airportStats[0].total,
      approvedAirports: airportStats[0].approved ?? 0,
      pendingAirports: airportStats[0].pending ?? 0,
      rejectedAirports: airportStats[0].rejected ?? 0,
      totalGroundHandlers: handlerCount[0].count,
      customsApprovedAirports: airportStats[0].customsApproved ?? 0,
      lastSyncAt: lastSync[0]?.syncedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
