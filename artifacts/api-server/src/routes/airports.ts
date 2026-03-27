import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { airportsTable, auditLogsTable } from "@workspace/db/schema";
import { eq, ilike, or, sql, and, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/airports", async (req, res) => {
  try {
    const { search, status, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(or(
        ilike(airportsTable.name, `%${search}%`),
        ilike(airportsTable.iataCode, `%${search}%`),
        ilike(airportsTable.cbpPortCode, `%${search}%`),
        ilike(airportsTable.city, `%${search}%`),
        ilike(airportsTable.state, `%${search}%`)
      ));
    }
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      conditions.push(eq(airportsTable.status, status as "pending" | "approved" | "rejected"));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [data, countResult] = await Promise.all([
      db.select().from(airportsTable).where(where).orderBy(airportsTable.name).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(airportsTable).where(where),
    ]);

    return res.json({ data, total: countResult[0].count, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST — create airport with IATA duplicate check + merge
router.post("/airports", async (req, res) => {
  try {
    const { name, iataCode, cbpPortCode, city, state, country, customsApproved, source } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    // IATA duplicate check
    if (iataCode) {
      const normalized = iataCode.trim().toUpperCase();
      const [existing] = await db.select().from(airportsTable).where(eq(airportsTable.iataCode, normalized));

      if (existing) {
        const merged = await db.update(airportsTable).set({
          name: name || existing.name,
          cbpPortCode: cbpPortCode || existing.cbpPortCode,
          city: city || existing.city,
          state: state || existing.state,
          country: country || existing.country,
          customsApproved: customsApproved !== undefined ? customsApproved : existing.customsApproved,
          source: source || existing.source,
          lastUpdated: new Date(),
        }).where(eq(airportsTable.id, existing.id)).returning();

        await db.insert(auditLogsTable).values({
          entityType: "airport",
          entityId: existing.id,
          action: "merge",
          changes: { ...req.body, mergedWithId: existing.id },
          performedBy: "admin",
        });

        return res.status(200).json({ ...merged[0], merged: true, message: `Merged with existing record: ${existing.name}` });
      }
    }

    const [airport] = await db.insert(airportsTable).values({
      name,
      iataCode: iataCode ? iataCode.trim().toUpperCase() : null,
      cbpPortCode: cbpPortCode || null,
      city: city || null,
      state: state || null,
      country: country || "US",
      customsApproved: customsApproved ?? false,
      source: source || "manual",
      status: "pending",
      lastUpdated: new Date(),
    }).returning();

    await db.insert(auditLogsTable).values({
      entityType: "airport", entityId: airport.id, action: "create", changes: req.body, performedBy: "admin",
    });

    return res.status(201).json(airport);
  } catch (err: any) {
    req.log.error(err);
    if (err?.code === "23505") {
      return res.status(409).json({ message: `An airport with IATA code "${req.body.iataCode?.toUpperCase()}" already exists in the registry.` });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/airports/all-ids — returns all IDs matching current filters (for select-all across pages)
router.get("/airports/all-ids", async (req, res) => {
  try {
    const { search, status } = req.query as Record<string, string>;
    const conditions = [];
    if (search) {
      conditions.push(or(
        ilike(airportsTable.name, `%${search}%`),
        ilike(airportsTable.iataCode, `%${search}%`),
        ilike(airportsTable.cbpPortCode, `%${search}%`),
        ilike(airportsTable.city, `%${search}%`),
        ilike(airportsTable.state, `%${search}%`)
      ));
    }
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      conditions.push(eq(airportsTable.status, status as "pending" | "approved" | "rejected"));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select({ id: airportsTable.id }).from(airportsTable).where(where).orderBy(airportsTable.name);
    return res.json({ ids: rows.map(r => r.id), total: rows.length });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/airports/bulk-status — update status for many airports at once
router.post("/airports/bulk-status", async (req, res) => {
  try {
    const { ids, status } = req.body as { ids: number[]; status: string };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids array is required" });
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status" });
    await db.update(airportsTable).set({ status: status as "approved" | "rejected", lastUpdated: new Date() }).where(inArray(airportsTable.id, ids));
    return res.json({ updated: ids.length });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/airports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [airport] = await db.select().from(airportsTable).where(eq(airportsTable.id, id));
    if (!airport) return res.status(404).json({ message: "Not found" });
    return res.json(airport);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/airports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, iataCode, cbpPortCode, city, state, country, customsApproved } = req.body;

    // IATA conflict check
    if (iataCode) {
      const normalized = iataCode.trim().toUpperCase();
      const [conflict] = await db.select().from(airportsTable)
        .where(and(eq(airportsTable.iataCode, normalized), sql`id != ${id}`));
      if (conflict) {
        return res.status(409).json({
          message: `IATA code ${normalized} is already used by "${conflict.name}" (ID ${conflict.id}).`,
          conflictId: conflict.id,
        });
      }
    }

    const [airport] = await db.update(airportsTable)
      .set({ name, iataCode: iataCode ? iataCode.trim().toUpperCase() : null, cbpPortCode, city, state, country, customsApproved, lastUpdated: new Date() })
      .where(eq(airportsTable.id, id))
      .returning();

    if (!airport) return res.status(404).json({ message: "Not found" });

    await db.insert(auditLogsTable).values({
      entityType: "airport", entityId: id, action: "update", changes: req.body, performedBy: "admin",
    });

    return res.json(airport);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/airports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(airportsTable).where(eq(airportsTable.id, id));
    await db.insert(auditLogsTable).values({ entityType: "airport", entityId: id, action: "delete", performedBy: "admin" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Bulk delete
router.post("/airports/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids array is required" });

    await db.delete(airportsTable).where(inArray(airportsTable.id, ids));
    await db.insert(auditLogsTable).values({
      entityType: "airport", entityId: 0, action: "bulk_delete", changes: { ids }, performedBy: "admin",
    });
    return res.json({ deleted: ids.length });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/airports/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status" });

    const [airport] = await db.update(airportsTable)
      .set({ status, lastUpdated: new Date() })
      .where(eq(airportsTable.id, id))
      .returning();

    if (!airport) return res.status(404).json({ message: "Not found" });

    await db.insert(auditLogsTable).values({
      entityType: "airport", entityId: id, action: status, changes: { status }, performedBy: "admin",
    });

    return res.json(airport);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
