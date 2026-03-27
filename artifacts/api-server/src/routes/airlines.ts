import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { airlinesTable, auditLogsTable } from "@workspace/db/schema";
import { eq, ilike, or, sql, and, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/airlines", async (req, res) => {
  try {
    const { search, status, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(or(
        ilike(airlinesTable.name, `%${search}%`),
        ilike(airlinesTable.iataCode, `%${search}%`),
        ilike(airlinesTable.cbpCode, `%${search}%`),
        ilike(airlinesTable.icaoCode, `%${search}%`)
      ));
    }
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      conditions.push(eq(airlinesTable.status, status as "pending" | "approved" | "rejected"));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [data, countResult] = await Promise.all([
      db.select().from(airlinesTable).where(where).orderBy(airlinesTable.name).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(airlinesTable).where(where),
    ]);

    return res.json({ data, total: countResult[0].count, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST — create airline with IATA duplicate check + merge
router.post("/airlines", async (req, res) => {
  try {
    const { name, iataCode, cbpCode, icaoCode, country, source } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    // IATA duplicate check
    if (iataCode) {
      const normalized = iataCode.trim().toUpperCase();
      const [existing] = await db.select().from(airlinesTable).where(eq(airlinesTable.iataCode, normalized));

      if (existing) {
        // Merge: fill null fields with new values, always update non-null incoming values
        const merged = await db.update(airlinesTable).set({
          name: name || existing.name,
          cbpCode: cbpCode || existing.cbpCode,
          icaoCode: icaoCode || existing.icaoCode,
          country: country || existing.country,
          source: source || existing.source,
          lastUpdated: new Date(),
        }).where(eq(airlinesTable.id, existing.id)).returning();

        await db.insert(auditLogsTable).values({
          entityType: "airline",
          entityId: existing.id,
          action: "merge",
          changes: { ...req.body, mergedWithId: existing.id },
          performedBy: "admin",
        });

        return res.status(200).json({ ...merged[0], merged: true, message: `Merged with existing record: ${existing.name}` });
      }
    }

    const [airline] = await db.insert(airlinesTable).values({
      name,
      iataCode: iataCode ? iataCode.trim().toUpperCase() : null,
      cbpCode: cbpCode || null,
      icaoCode: icaoCode || null,
      country: country || null,
      source: source || "manual",
      status: "pending",
      lastUpdated: new Date(),
    }).returning();

    await db.insert(auditLogsTable).values({
      entityType: "airline",
      entityId: airline.id,
      action: "create",
      changes: req.body,
      performedBy: "admin",
    });

    return res.status(201).json(airline);
  } catch (err: any) {
    req.log.error(err);
    if (err?.code === "23505") {
      return res.status(409).json({ message: `An airline with IATA code "${req.body.iataCode?.toUpperCase()}" already exists in the registry.` });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/airlines/all-ids — returns all IDs matching current filters (for select-all across pages)
router.get("/airlines/all-ids", async (req, res) => {
  try {
    const { search, status } = req.query as Record<string, string>;
    const conditions = [];
    if (search) {
      conditions.push(or(
        ilike(airlinesTable.name, `%${search}%`),
        ilike(airlinesTable.iataCode, `%${search}%`),
        ilike(airlinesTable.cbpCode, `%${search}%`),
        ilike(airlinesTable.icaoCode, `%${search}%`)
      ));
    }
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      conditions.push(eq(airlinesTable.status, status as "pending" | "approved" | "rejected"));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select({ id: airlinesTable.id }).from(airlinesTable).where(where).orderBy(airlinesTable.name);
    return res.json({ ids: rows.map(r => r.id), total: rows.length });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/airlines/bulk-status — update status for many airlines at once
router.post("/airlines/bulk-status", async (req, res) => {
  try {
    const { ids, status } = req.body as { ids: number[]; status: string };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids array is required" });
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status" });
    await db.update(airlinesTable).set({ status: status as "approved" | "rejected", lastUpdated: new Date() }).where(inArray(airlinesTable.id, ids));
    return res.json({ updated: ids.length });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/airlines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [airline] = await db.select().from(airlinesTable).where(eq(airlinesTable.id, id));
    if (!airline) return res.status(404).json({ message: "Not found" });
    return res.json(airline);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/airlines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, iataCode, cbpCode, icaoCode, country } = req.body;

    // Check for IATA conflict with a different record
    if (iataCode) {
      const normalized = iataCode.trim().toUpperCase();
      const [conflict] = await db.select().from(airlinesTable)
        .where(and(eq(airlinesTable.iataCode, normalized), sql`id != ${id}`));
      if (conflict) {
        return res.status(409).json({
          message: `IATA code ${normalized} is already used by "${conflict.name}" (ID ${conflict.id}). Use the merge action instead.`,
          conflictId: conflict.id,
        });
      }
    }

    const [airline] = await db.update(airlinesTable)
      .set({ name, iataCode: iataCode ? iataCode.trim().toUpperCase() : null, cbpCode, icaoCode, country, lastUpdated: new Date() })
      .where(eq(airlinesTable.id, id))
      .returning();

    if (!airline) return res.status(404).json({ message: "Not found" });

    await db.insert(auditLogsTable).values({
      entityType: "airline", entityId: id, action: "update", changes: req.body, performedBy: "admin",
    });

    return res.json(airline);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/airlines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(airlinesTable).where(eq(airlinesTable.id, id));
    await db.insert(auditLogsTable).values({ entityType: "airline", entityId: id, action: "delete", performedBy: "admin" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Bulk delete
router.post("/airlines/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids array is required" });

    await db.delete(airlinesTable).where(inArray(airlinesTable.id, ids));
    await db.insert(auditLogsTable).values({
      entityType: "airline", entityId: 0, action: "bulk_delete", changes: { ids }, performedBy: "admin",
    });
    return res.json({ deleted: ids.length });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/awb-prefixes — list all airlines with AWB prefix info
router.get("/awb-prefixes", async (req, res) => {
  try {
    const { search, filter, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(or(
        ilike(airlinesTable.name, `%${search}%`),
        ilike(airlinesTable.iataCode, `%${search}%`),
        ilike(airlinesTable.icaoCode, `%${search}%`),
        ilike(airlinesTable.awbPrefix, `%${search}%`),
      ));
    }
    if (filter === "missing") {
      conditions.push(sql`(awb_prefix IS NULL OR awb_prefix = '')`);
    } else if (filter === "has") {
      conditions.push(sql`(awb_prefix IS NOT NULL AND awb_prefix != '')`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: airlinesTable.id,
        name: airlinesTable.name,
        iataCode: airlinesTable.iataCode,
        icaoCode: airlinesTable.icaoCode,
        awbPrefix: airlinesTable.awbPrefix,
        country: airlinesTable.country,
        lastUpdated: airlinesTable.lastUpdated,
      }).from(airlinesTable).where(where).orderBy(airlinesTable.name).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(airlinesTable).where(where),
    ]);

    const [statsResult] = await db.select({
      total: sql<number>`count(*)::int`,
      hasPrefix: sql<number>`count(*) filter (where awb_prefix is not null and awb_prefix != '')::int`,
    }).from(airlinesTable);

    return res.json({ data, total: countResult[0].count, page: pageNum, limit: limitNum, stats: statsResult });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/airlines/:id/awb-prefix — update only the AWB prefix
router.patch("/airlines/:id/awb-prefix", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { awbPrefix } = req.body as { awbPrefix: string | null };

    // Validate: must be exactly 3 digits or null/empty
    if (awbPrefix && !/^\d{3}$/.test(awbPrefix.trim())) {
      return res.status(400).json({ message: "AWB prefix must be exactly 3 digits (e.g. 176)" });
    }

    // Check for duplicate prefix among other airlines
    if (awbPrefix) {
      const [conflict] = await db.select({ id: airlinesTable.id, name: airlinesTable.name, iataCode: airlinesTable.iataCode })
        .from(airlinesTable)
        .where(and(eq(airlinesTable.awbPrefix, awbPrefix.trim()), sql`id != ${id}`));
      if (conflict) {
        return res.status(409).json({
          message: `Prefix ${awbPrefix} is already assigned to ${conflict.name} (${conflict.iataCode || conflict.id}). Each airline must have a unique AWB prefix.`,
          conflict,
        });
      }
    }

    const [airline] = await db.update(airlinesTable)
      .set({ awbPrefix: awbPrefix ? awbPrefix.trim() : null, lastUpdated: new Date() })
      .where(eq(airlinesTable.id, id))
      .returning();

    if (!airline) return res.status(404).json({ message: "Airline not found" });

    await db.insert(auditLogsTable).values({
      entityType: "airline", entityId: id, action: "update",
      changes: { awbPrefix }, performedBy: "admin",
    });

    return res.json(airline);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/airlines/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status" });

    const [airline] = await db.update(airlinesTable)
      .set({ status, lastUpdated: new Date() })
      .where(eq(airlinesTable.id, id))
      .returning();

    if (!airline) return res.status(404).json({ message: "Not found" });

    await db.insert(auditLogsTable).values({
      entityType: "airline", entityId: id, action: status, changes: { status }, performedBy: "admin",
    });

    return res.json(airline);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
