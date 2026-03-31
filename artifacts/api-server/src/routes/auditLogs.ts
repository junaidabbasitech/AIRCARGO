import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";
import { eq, sql, desc, and, ilike, or, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/audit-logs", async (req, res) => {
  try {
    const {
      entityType, action, search, entityId,
      level, page = "1", limit = "50"
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (entityType) conditions.push(eq(auditLogsTable.entityType, entityType));
    if (action) conditions.push(ilike(auditLogsTable.action, `%${action}%`));
    if (entityId) conditions.push(eq(auditLogsTable.entityId, parseInt(entityId)));
    if (level) conditions.push(eq(auditLogsTable.level, level));
    if (search) {
      conditions.push(or(
        ilike(auditLogsTable.entityType, `%${search}%`),
        ilike(auditLogsTable.action, `%${search}%`),
        ilike(auditLogsTable.performedBy, `%${search}%`),
        ilike(auditLogsTable.url, `%${search}%`),
        ilike(auditLogsTable.errorMessage, `%${search}%`),
        sql`${auditLogsTable.changes}::text ilike ${'%' + search + '%'}`,
      ));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult, statsResult] = await Promise.all([
      db.select().from(auditLogsTable)
        .where(where)
        .orderBy(desc(auditLogsTable.performedAt))
        .limit(limitNum)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(auditLogsTable).where(where),
      db.select({
        total: sql<number>`count(*)::int`,
        errors: sql<number>`count(*) filter (where level = 'error')::int`,
        warnings: sql<number>`count(*) filter (where level = 'warning')::int`,
        creates: sql<number>`count(*) filter (where action ilike 'create%' or action = 'CREATE')::int`,
        updates: sql<number>`count(*) filter (where action ilike 'update%' or action = 'UPDATE' or action ilike 'patch%')::int`,
        deletes: sql<number>`count(*) filter (where action ilike 'delete%' or action = 'DELETE')::int`,
        reads: sql<number>`count(*) filter (where action = 'READ')::int`,
        userActions: sql<number>`count(*) filter (where performed_by = 'frontend')::int`,
        apiCalls: sql<number>`count(*) filter (where performed_by = 'api')::int`,
      }).from(auditLogsTable),
    ]);

    return res.json({
      data,
      total: countResult[0].count,
      page: pageNum,
      limit: limitNum,
      stats: statsResult[0],
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/audit-logs", async (req, res) => {
  try {
    const {
      level = "info",
      entityType = "frontend",
      entityId,
      action,
      method,
      url,
      statusCode,
      duration,
      ipAddress,
      userAgent,
      errorMessage,
      changes,
      performedBy = "frontend",
    } = req.body;

    if (!action) {
      return res.status(400).json({ message: "action is required" });
    }

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      || req.socket.remoteAddress
      || ipAddress
      || "unknown";

    const ua = req.headers["user-agent"] || userAgent || null;

    await pool.query(
      `INSERT INTO audit_logs
        (level, entity_type, entity_id, action, method, url, status_code, duration, ip_address, user_agent, error_message, changes, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        level,
        entityType,
        entityId || null,
        action,
        method || null,
        url || null,
        statusCode || null,
        duration || null,
        ip,
        ua,
        errorMessage || null,
        changes ? JSON.stringify(changes) : null,
        performedBy,
      ]
    );

    return res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
