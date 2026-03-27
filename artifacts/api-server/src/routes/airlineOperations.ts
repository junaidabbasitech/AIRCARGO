import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { airlineOperationsTable, airlinesTable, airportsTable, auditLogsTable } from "@workspace/db/schema";
import { eq, and, sql, ilike, ne, or, desc } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/airline-operations — list all, with multi-field search + filters
router.get("/airline-operations", async (req, res) => {
  try {
    const { airlineId, airportId, firmsCode, search, page = "1", limit = "500" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (airlineId) conditions.push(eq(airlineOperationsTable.airlineId, parseInt(airlineId)));
    if (airportId) conditions.push(eq(airlineOperationsTable.airportId, parseInt(airportId)));
    if (firmsCode) conditions.push(ilike(airlineOperationsTable.firmsCode, `%${firmsCode}%`));
    if (search) {
      conditions.push(or(
        ilike(airlinesTable.name, `%${search}%`),
        ilike(airlinesTable.iataCode, `%${search}%`),
        ilike(airportsTable.name, `%${search}%`),
        ilike(airportsTable.iataCode, `%${search}%`),
        ilike(airportsTable.city, `%${search}%`),
        ilike(airlineOperationsTable.firmsCode, `%${search}%`),
        ilike(airlineOperationsTable.iscAmount, `%${search}%`),
        ilike(airlineOperationsTable.iscPayableAt, `%${search}%`),
        ilike(airlineOperationsTable.iscPayableTo, `%${search}%`),
        ilike(airlineOperationsTable.contactNumber, `%${search}%`),
        ilike(airlineOperationsTable.contactEmail, `%${search}%`),
        ilike(airlineOperationsTable.notes, `%${search}%`),
      ));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const colSelect = {
      id: airlineOperationsTable.id,
      airlineId: airlineOperationsTable.airlineId,
      airportId: airlineOperationsTable.airportId,
      firmsCode: airlineOperationsTable.firmsCode,
      iscAmount: airlineOperationsTable.iscAmount,
      iscPayableAt: airlineOperationsTable.iscPayableAt,
      iscPayableTo: airlineOperationsTable.iscPayableTo,
      contactNumber: airlineOperationsTable.contactNumber,
      contactEmail: airlineOperationsTable.contactEmail,
      notes: airlineOperationsTable.notes,
      lastUpdated: airlineOperationsTable.lastUpdated,
      airlineName: airlinesTable.name,
      airlineIata: airlinesTable.iataCode,
      airportName: airportsTable.name,
      airportIata: airportsTable.iataCode,
      airportCity: airportsTable.city,
      airportState: airportsTable.state,
    };

    const base = db
      .select(colSelect)
      .from(airlineOperationsTable)
      .leftJoin(airlinesTable, eq(airlineOperationsTable.airlineId, airlinesTable.id))
      .leftJoin(airportsTable, eq(airlineOperationsTable.airportId, airportsTable.id));

    const usePages = !!(search || page !== "1" || parseInt(limit) < 500);

    if (usePages) {
      const [rows, countResult] = await Promise.all([
        base.where(where).orderBy(airlinesTable.name, airportsTable.name).limit(limitNum).offset(offset),
        db.select({ count: sql<number>`count(*)::int` })
          .from(airlineOperationsTable)
          .leftJoin(airlinesTable, eq(airlineOperationsTable.airlineId, airlinesTable.id))
          .leftJoin(airportsTable, eq(airlineOperationsTable.airportId, airportsTable.id))
          .where(where),
      ]);
      return res.json({ data: rows, total: countResult[0].count, page: pageNum, limit: limitNum });
    }

    const rows = await base.where(where).orderBy(airlinesTable.name, airportsTable.name).limit(limitNum).offset(offset);
    return res.json({ data: rows, total: rows.length });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/airline-operations/:id
router.get("/airline-operations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db
      .select({
        id: airlineOperationsTable.id,
        airlineId: airlineOperationsTable.airlineId,
        airportId: airlineOperationsTable.airportId,
        firmsCode: airlineOperationsTable.firmsCode,
        iscAmount: airlineOperationsTable.iscAmount,
        iscPayableAt: airlineOperationsTable.iscPayableAt,
        iscPayableTo: airlineOperationsTable.iscPayableTo,
        contactNumber: airlineOperationsTable.contactNumber,
        contactEmail: airlineOperationsTable.contactEmail,
        notes: airlineOperationsTable.notes,
        lastUpdated: airlineOperationsTable.lastUpdated,
        airlineName: airlinesTable.name,
        airlineIata: airlinesTable.iataCode,
        airportName: airportsTable.name,
        airportIata: airportsTable.iataCode,
        airportCity: airportsTable.city,
        airportState: airportsTable.state,
      })
      .from(airlineOperationsTable)
      .leftJoin(airlinesTable, eq(airlineOperationsTable.airlineId, airlinesTable.id))
      .leftJoin(airportsTable, eq(airlineOperationsTable.airportId, airportsTable.id))
      .where(eq(airlineOperationsTable.id, id));
    if (!row) return res.status(404).json({ message: "Not found" });
    return res.json(row);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/airline-operations
router.post("/airline-operations", async (req, res) => {
  try {
    const { airlineId, airportId, firmsCode, iscAmount, iscPayableAt, iscPayableTo, contactNumber, contactEmail, notes } = req.body;
    if (!airlineId) return res.status(400).json({ message: "airlineId is required" });

    const normalizedFirms = firmsCode ? firmsCode.trim().toUpperCase() : null;

    // Airline + Airport pair duplicate check (same airport cannot appear twice for same airline)
    if (airportId) {
      const [conflict] = await db.select({ id: airlineOperationsTable.id })
        .from(airlineOperationsTable)
        .where(and(
          eq(airlineOperationsTable.airlineId, parseInt(airlineId)),
          eq(airlineOperationsTable.airportId, parseInt(airportId))
        ))
        .limit(1);
      if (conflict) {
        return res.status(409).json({
          message: `This airline already has an operation record for that airport (ID ${conflict.id}). Each airport can only appear once per airline.`,
          conflictId: conflict.id,
        });
      }
    }

    const [op] = await db.insert(airlineOperationsTable).values({
      airlineId: parseInt(airlineId),
      airportId: airportId ? parseInt(airportId) : null,
      firmsCode: normalizedFirms,
      iscAmount: iscAmount || null,
      iscPayableAt: iscPayableAt || null,
      iscPayableTo: iscPayableTo || null,
      contactNumber: contactNumber || null,
      contactEmail: contactEmail || null,
      notes: notes || null,
      lastUpdated: new Date(),
    }).returning();

    await db.insert(auditLogsTable).values({
      entityType: "airline_operation",
      entityId: op.id,
      action: "create",
      changes: req.body,
      performedBy: "admin",
    });

    return res.status(201).json(op);
  } catch (err: any) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/airline-operations/:id
router.put("/airline-operations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { airlineId, airportId, firmsCode, iscAmount, iscPayableAt, iscPayableTo, contactNumber, contactEmail, notes } = req.body;

    const normalizedFirms = firmsCode ? firmsCode.trim().toUpperCase() : null;

    // Airline + Airport pair duplicate check (ignore this record itself)
    if (airlineId && airportId) {
      const [conflict] = await db.select({ id: airlineOperationsTable.id })
        .from(airlineOperationsTable)
        .where(and(
          eq(airlineOperationsTable.airlineId, parseInt(airlineId)),
          eq(airlineOperationsTable.airportId, parseInt(airportId)),
          ne(airlineOperationsTable.id, id)
        ))
        .limit(1);
      if (conflict) {
        return res.status(409).json({
          message: `This airline already has an operation record for that airport (ID ${conflict.id}). Each airport can only appear once per airline.`,
          conflictId: conflict.id,
        });
      }
    }

    const [op] = await db.update(airlineOperationsTable)
      .set({
        airlineId: airlineId ? parseInt(airlineId) : undefined,
        airportId: airportId !== undefined ? (airportId ? parseInt(airportId) : null) : undefined,
        firmsCode: normalizedFirms !== undefined ? normalizedFirms : undefined,
        iscAmount: iscAmount ?? undefined,
        iscPayableAt: iscPayableAt ?? undefined,
        iscPayableTo: iscPayableTo ?? undefined,
        contactNumber: contactNumber ?? undefined,
        contactEmail: contactEmail ?? undefined,
        notes: notes ?? undefined,
        lastUpdated: new Date(),
      })
      .where(eq(airlineOperationsTable.id, id))
      .returning();

    if (!op) return res.status(404).json({ message: "Not found" });

    await db.insert(auditLogsTable).values({
      entityType: "airline_operation",
      entityId: id,
      action: "update",
      changes: req.body,
      performedBy: "admin",
    });

    return res.json(op);
  } catch (err: any) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/airline-operations/:id
router.delete("/airline-operations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(airlineOperationsTable).where(eq(airlineOperationsTable.id, id));

    await db.insert(auditLogsTable).values({
      entityType: "airline_operation",
      entityId: id,
      action: "delete",
      performedBy: "admin",
    });

    return res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
