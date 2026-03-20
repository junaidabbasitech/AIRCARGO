import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { airportsTable, auditLogsTable } from "@workspace/db/schema";
import { eq, ilike, or, sql, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/airports", async (req, res) => {
  try {
    const { search, status, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(airportsTable.name, `%${search}%`),
          ilike(airportsTable.iataCode, `%${search}%`),
          ilike(airportsTable.cbpPortCode, `%${search}%`),
          ilike(airportsTable.city, `%${search}%`),
          ilike(airportsTable.state, `%${search}%`)
        )
      );
    }
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      conditions.push(eq(airportsTable.status, status as "pending" | "approved" | "rejected"));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(airportsTable).where(where).orderBy(airportsTable.name).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(airportsTable).where(where),
    ]);

    res.json({ data, total: countResult[0].count, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/airports", async (req, res) => {
  try {
    const { name, iataCode, cbpPortCode, city, state, country, customsApproved, source } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const [airport] = await db.insert(airportsTable).values({
      name,
      iataCode: iataCode || null,
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
      entityType: "airport",
      entityId: airport.id,
      action: "create",
      changes: req.body,
      performedBy: "admin",
    });

    res.status(201).json(airport);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/airports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [airport] = await db.select().from(airportsTable).where(eq(airportsTable.id, id));
    if (!airport) return res.status(404).json({ message: "Not found" });
    res.json(airport);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/airports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, iataCode, cbpPortCode, city, state, country, customsApproved } = req.body;

    const [airport] = await db.update(airportsTable)
      .set({ name, iataCode, cbpPortCode, city, state, country, customsApproved, lastUpdated: new Date() })
      .where(eq(airportsTable.id, id))
      .returning();

    if (!airport) return res.status(404).json({ message: "Not found" });

    await db.insert(auditLogsTable).values({
      entityType: "airport",
      entityId: id,
      action: "update",
      changes: req.body,
      performedBy: "admin",
    });

    res.json(airport);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/airports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(airportsTable).where(eq(airportsTable.id, id));

    await db.insert(auditLogsTable).values({
      entityType: "airport",
      entityId: id,
      action: "delete",
      performedBy: "admin",
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/airports/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [airport] = await db.update(airportsTable)
      .set({ status, lastUpdated: new Date() })
      .where(eq(airportsTable.id, id))
      .returning();

    if (!airport) return res.status(404).json({ message: "Not found" });

    await db.insert(auditLogsTable).values({
      entityType: "airport",
      entityId: id,
      action: status,
      changes: { status },
      performedBy: "admin",
    });

    res.json(airport);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
