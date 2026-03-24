import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";
import { eq, sql, desc, and, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

router.get("/audit-logs", async (req, res) => {
  try {
    const { entityType, action, search, entityId, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (entityType) conditions.push(eq(auditLogsTable.entityType, entityType));
    if (action) conditions.push(ilike(auditLogsTable.action, `%${action}%`));
    if (entityId) conditions.push(eq(auditLogsTable.entityId, parseInt(entityId)));
    if (search) {
      conditions.push(or(
        ilike(auditLogsTable.entityType, `%${search}%`),
        ilike(auditLogsTable.action, `%${search}%`),
        ilike(auditLogsTable.performedBy, `%${search}%`),
        sql`${auditLogsTable.changes}::text ilike ${'%' + search + '%'}`,
      ));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult, statsResult] = await Promise.all([
      db.select().from(auditLogsTable).where(where).orderBy(desc(auditLogsTable.performedAt)).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(auditLogsTable).where(where),
      db.select({
        total: sql<number>`count(*)::int`,
        creates: sql<number>`count(*) filter (where action ilike 'create%')::int`,
        updates: sql<number>`count(*) filter (where action ilike 'update%' or action ilike 'patch%')::int`,
        deletes: sql<number>`count(*) filter (where action ilike 'delete%')::int`,
      }).from(auditLogsTable),
    ]);

    res.json({ data, total: countResult[0].count, page: pageNum, limit: limitNum, stats: statsResult[0] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
