import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { airlinesTable, auditLogsTable } from "@workspace/db/schema";
import { eq, ilike, or, sql, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/airlines", async (req, res) => {
  try {
    const { search, status, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(airlinesTable.name, `%${search}%`),
          ilike(airlinesTable.iataCode, `%${search}%`),
          ilike(airlinesTable.cbpCode, `%${search}%`),
          ilike(airlinesTable.icaoCode, `%${search}%`)
        )
      );
    }
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      conditions.push(eq(airlinesTable.status, status as "pending" | "approved" | "rejected"));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(airlinesTable).where(where).orderBy(airlinesTable.name).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(airlinesTable).where(where),
    ]);

    res.json({ data, total: countResult[0].count, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/airlines", async (req, res) => {
  try {
    const { name, iataCode, cbpCode, icaoCode, country, source } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const [airline] = await db.insert(airlinesTable).values({
      name,
      iataCode: iataCode || null,
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

    res.status(201).json(airline);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/airlines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [airline] = await db.select().from(airlinesTable).where(eq(airlinesTable.id, id));
    if (!airline) return res.status(404).json({ message: "Not found" });
    res.json(airline);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/airlines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, iataCode, cbpCode, icaoCode, country } = req.body;

    const [airline] = await db.update(airlinesTable)
      .set({ name, iataCode, cbpCode, icaoCode, country, lastUpdated: new Date() })
      .where(eq(airlinesTable.id, id))
      .returning();

    if (!airline) return res.status(404).json({ message: "Not found" });

    await db.insert(auditLogsTable).values({
      entityType: "airline",
      entityId: id,
      action: "update",
      changes: req.body,
      performedBy: "admin",
    });

    res.json(airline);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/airlines/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(airlinesTable).where(eq(airlinesTable.id, id));

    await db.insert(auditLogsTable).values({
      entityType: "airline",
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

router.patch("/airlines/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [airline] = await db.update(airlinesTable)
      .set({ status, lastUpdated: new Date() })
      .where(eq(airlinesTable.id, id))
      .returning();

    if (!airline) return res.status(404).json({ message: "Not found" });

    await db.insert(auditLogsTable).values({
      entityType: "airline",
      entityId: id,
      action: status,
      changes: { status },
      performedBy: "admin",
    });

    res.json(airline);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
