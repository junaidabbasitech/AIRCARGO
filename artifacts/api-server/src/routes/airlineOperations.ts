import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { airlineOperationsTable, airlinesTable, airportsTable, auditLogsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/airline-operations — list all, optionally filtered by airlineId or airportId
router.get("/airline-operations", async (req, res) => {
  try {
    const { airlineId, airportId } = req.query as Record<string, string>;
    const conditions = [];
    if (airlineId) conditions.push(eq(airlineOperationsTable.airlineId, parseInt(airlineId)));
    if (airportId) conditions.push(eq(airlineOperationsTable.airportId, parseInt(airportId)));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
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
      .where(where)
      .orderBy(airlinesTable.name, airportsTable.name);

    res.json({ data: rows, total: rows.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
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
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/airline-operations
router.post("/airline-operations", async (req, res) => {
  try {
    const { airlineId, airportId, firmsCode, iscAmount, iscPayableAt, iscPayableTo, contactNumber, contactEmail, notes } = req.body;
    if (!airlineId || !airportId) return res.status(400).json({ message: "airlineId and airportId are required" });

    const [op] = await db.insert(airlineOperationsTable).values({
      airlineId: parseInt(airlineId),
      airportId: parseInt(airportId),
      firmsCode: firmsCode || null,
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

    res.status(201).json(op);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/airline-operations/:id
router.put("/airline-operations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { airlineId, airportId, firmsCode, iscAmount, iscPayableAt, iscPayableTo, contactNumber, contactEmail, notes } = req.body;

    const [op] = await db.update(airlineOperationsTable)
      .set({
        airlineId: airlineId ? parseInt(airlineId) : undefined,
        airportId: airportId ? parseInt(airportId) : undefined,
        firmsCode: firmsCode ?? undefined,
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

    res.json(op);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
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

    res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
