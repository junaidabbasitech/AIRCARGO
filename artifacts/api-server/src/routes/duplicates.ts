import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { airlinesTable, airportsTable, airlineOperationsTable } from "@workspace/db/schema";
import { sql, eq, inArray } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/duplicates — detect duplicate airlines, airports, and airline-airport ops
router.get("/duplicates", async (req, res) => {
  try {
    // Duplicate airlines — same IATA code
    const airlineDupRows = await db.execute(sql`
      SELECT 
        a.iata_code as key_field,
        'iata_code' as match_field,
        json_agg(json_build_object(
          'id', a.id,
          'name', a.name,
          'iataCode', a.iata_code,
          'icaoCode', a.icao_code,
          'cbpCode', a.cbp_code,
          'country', a.country,
          'source', a.source,
          'status', a.status,
          'lastUpdated', a.last_updated,
          'createdAt', a.created_at
        ) ORDER BY a.id) as records
      FROM airlines a
      WHERE a.iata_code IS NOT NULL
      GROUP BY a.iata_code
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, a.iata_code
    `);

    // Duplicate airlines — same name (case-insensitive), no IATA
    const airlineNameDups = await db.execute(sql`
      SELECT 
        LOWER(TRIM(a.name)) as key_field,
        'name' as match_field,
        json_agg(json_build_object(
          'id', a.id,
          'name', a.name,
          'iataCode', a.iata_code,
          'icaoCode', a.icao_code,
          'cbpCode', a.cbp_code,
          'country', a.country,
          'source', a.source,
          'status', a.status,
          'lastUpdated', a.last_updated,
          'createdAt', a.created_at
        ) ORDER BY a.id) as records
      FROM airlines a
      WHERE a.iata_code IS NULL
      GROUP BY LOWER(TRIM(a.name))
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `);

    // Duplicate airports — same IATA code
    const airportDupRows = await db.execute(sql`
      SELECT 
        a.iata_code as key_field,
        'iata_code' as match_field,
        json_agg(json_build_object(
          'id', a.id,
          'name', a.name,
          'iataCode', a.iata_code,
          'city', a.city,
          'state', a.state,
          'country', a.country,
          'cbpPortCode', a.cbp_port_code,
          'customsApproved', a.customs_approved,
          'source', a.source,
          'status', a.status,
          'lastUpdated', a.last_updated
        ) ORDER BY a.id) as records
      FROM airports a
      WHERE a.iata_code IS NOT NULL
      GROUP BY a.iata_code
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC, a.iata_code
    `);

    // Duplicate airline_operations — same airline+airport pair
    const opsDupRows = await db.execute(sql`
      SELECT 
        CONCAT(al.name, ' @ ', ap.iata_code) as key_field,
        'airline_airport_pair' as match_field,
        json_agg(json_build_object(
          'id', ao.id,
          'airlineId', ao.airline_id,
          'airportId', ao.airport_id,
          'airlineName', al.name,
          'airlineIata', al.iata_code,
          'airportName', ap.name,
          'airportIata', ap.iata_code,
          'firmsCode', ao.firms_code,
          'iscAmount', ao.isc_amount,
          'iscPayableTo', ao.isc_payable_to,
          'contactNumber', ao.contact_number,
          'contactEmail', ao.contact_email,
          'lastUpdated', ao.last_updated
        ) ORDER BY ao.id) as records
      FROM airline_operations ao
      JOIN airlines al ON al.id = ao.airline_id
      JOIN airports ap ON ap.id = ao.airport_id
      WHERE ao.airport_id IS NOT NULL
      GROUP BY ao.airline_id, ao.airport_id, al.name, ap.iata_code
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `);

    const airlineDups = [...airlineDupRows.rows, ...airlineNameDups.rows];
    const airportDups = airportDupRows.rows;
    const opsDups = opsDupRows.rows;

    res.json({
      airlines: {
        groups: airlineDups,
        totalGroups: airlineDups.length,
        totalDuplicates: airlineDups.reduce((sum, r: any) => sum + (r.records?.length ?? 0) - 1, 0),
      },
      airports: {
        groups: airportDups,
        totalGroups: airportDups.length,
        totalDuplicates: airportDups.reduce((sum, r: any) => sum + (r.records?.length ?? 0) - 1, 0),
      },
      operations: {
        groups: opsDups,
        totalGroups: opsDups.length,
        totalDuplicates: opsDups.reduce((sum, r: any) => sum + (r.records?.length ?? 0) - 1, 0),
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/duplicates/airlines/merge
router.post("/duplicates/airlines/merge", async (req, res) => {
  try {
    const { keepId, deleteIds } = req.body as { keepId: number; deleteIds: number[] };
    if (!keepId || !Array.isArray(deleteIds) || deleteIds.length === 0) {
      return res.status(400).json({ message: "keepId and deleteIds are required" });
    }

    const allIds = [keepId, ...deleteIds];
    const records = await db.select().from(airlinesTable).where(inArray(airlinesTable.id, allIds));
    if (records.length === 0) return res.status(404).json({ message: "Records not found" });

    const keepRecord = records.find(r => r.id === keepId);
    if (!keepRecord) return res.status(404).json({ message: "Keep record not found" });

    const mergedName = records.map(r => r.name).find(v => v) ?? keepRecord.name;
    const mergedIcao = records.map(r => r.icaoCode).find(v => v) ?? keepRecord.icaoCode;
    const mergedCbp = records.map(r => r.cbpCode).find(v => v) ?? keepRecord.cbpCode;
    const mergedCountry = records.map(r => r.country).find(v => v) ?? keepRecord.country;
    const mergedStatus = records.some(r => r.status === "approved") ? "approved" : keepRecord.status;

    await db.update(airlinesTable).set({
      name: mergedName,
      icaoCode: mergedIcao,
      cbpCode: mergedCbp,
      country: mergedCountry,
      status: mergedStatus,
      lastUpdated: new Date(),
    }).where(eq(airlinesTable.id, keepId));

    let opsRepointed = 0;
    for (const delId of deleteIds) {
      const ops = await db.select().from(airlineOperationsTable).where(eq(airlineOperationsTable.airlineId, delId));
      for (const op of ops) {
        if (op.airportId) {
          const conflict = await db.select({ id: airlineOperationsTable.id })
            .from(airlineOperationsTable)
            .where(sql`airline_id = ${keepId} AND airport_id = ${op.airportId}`)
            .limit(1);
          if (conflict.length > 0) {
            await db.delete(airlineOperationsTable).where(eq(airlineOperationsTable.id, op.id));
            continue;
          }
        } else {
          const conflict = await db.select({ id: airlineOperationsTable.id })
            .from(airlineOperationsTable)
            .where(sql`airline_id = ${keepId} AND airport_id IS NULL`)
            .limit(1);
          if (conflict.length > 0) {
            await db.delete(airlineOperationsTable).where(eq(airlineOperationsTable.id, op.id));
            continue;
          }
        }
        await db.update(airlineOperationsTable).set({ airlineId: keepId }).where(eq(airlineOperationsTable.id, op.id));
        opsRepointed++;
      }
    }

    await db.delete(airlinesTable).where(inArray(airlinesTable.id, deleteIds));
    res.json({ message: `Merged ${deleteIds.length} record(s) into ID ${keepId}. Re-pointed ${opsRepointed} operations.`, keepId, deleted: deleteIds.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/duplicates/airlines/delete
router.post("/duplicates/airlines/delete", async (req, res) => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids required" });
    await db.delete(airlinesTable).where(inArray(airlinesTable.id, ids));
    res.json({ message: `Deleted ${ids.length} airline(s)`, deleted: ids.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/duplicates/airports/merge
router.post("/duplicates/airports/merge", async (req, res) => {
  try {
    const { keepId, deleteIds } = req.body as { keepId: number; deleteIds: number[] };
    if (!keepId || !Array.isArray(deleteIds) || deleteIds.length === 0) {
      return res.status(400).json({ message: "keepId and deleteIds are required" });
    }

    const allIds = [keepId, ...deleteIds];
    const records = await db.select().from(airportsTable).where(inArray(airportsTable.id, allIds));
    const keepRecord = records.find(r => r.id === keepId);
    if (!keepRecord) return res.status(404).json({ message: "Keep record not found" });

    const mergedName = records.map(r => r.name).find(v => v) ?? keepRecord.name;
    const mergedCity = records.map(r => r.city).find(v => v) ?? keepRecord.city;
    const mergedState = records.map(r => r.state).find(v => v) ?? keepRecord.state;
    const mergedCountry = records.map(r => r.country).find(v => v) ?? keepRecord.country;
    const mergedCbpPort = records.map(r => r.cbpPortCode).find(v => v) ?? keepRecord.cbpPortCode;
    const mergedCustoms = records.some(r => r.customsApproved) ? true : keepRecord.customsApproved;
    const mergedStatus = records.some(r => r.status === "approved") ? "approved" : keepRecord.status;

    await db.update(airportsTable).set({
      name: mergedName,
      city: mergedCity,
      state: mergedState,
      country: mergedCountry,
      cbpPortCode: mergedCbpPort,
      customsApproved: mergedCustoms,
      status: mergedStatus,
      lastUpdated: new Date(),
    }).where(eq(airportsTable.id, keepId));

    await db.delete(airportsTable).where(inArray(airportsTable.id, deleteIds));
    res.json({ message: `Merged ${deleteIds.length} airport(s) into ID ${keepId}`, keepId, deleted: deleteIds.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/duplicates/airports/delete
router.post("/duplicates/airports/delete", async (req, res) => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids required" });
    await db.delete(airportsTable).where(inArray(airportsTable.id, ids));
    res.json({ message: `Deleted ${ids.length} airport(s)`, deleted: ids.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/duplicates/operations/delete — delete duplicate airline_operation records
router.post("/duplicates/operations/delete", async (req, res) => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids required" });
    await db.delete(airlineOperationsTable).where(inArray(airlineOperationsTable.id, ids));
    res.json({ message: `Deleted ${ids.length} operation(s)`, deleted: ids.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/duplicates/operations/merge — keep one op, merge fields from others, delete rest
router.post("/duplicates/operations/merge", async (req, res) => {
  try {
    const { keepId, deleteIds } = req.body as { keepId: number; deleteIds: number[] };
    if (!keepId || !Array.isArray(deleteIds) || deleteIds.length === 0) {
      return res.status(400).json({ message: "keepId and deleteIds are required" });
    }

    const allIds = [keepId, ...deleteIds];
    const records = await db.select().from(airlineOperationsTable).where(inArray(airlineOperationsTable.id, allIds));
    const keepRecord = records.find(r => r.id === keepId);
    if (!keepRecord) return res.status(404).json({ message: "Keep record not found" });

    // Merge: pick first non-null value for each field
    const merged = {
      firmsCode: records.map(r => r.firmsCode).find(v => v) ?? keepRecord.firmsCode,
      iscAmount: records.map(r => r.iscAmount).find(v => v) ?? keepRecord.iscAmount,
      iscPayableAt: records.map(r => r.iscPayableAt).find(v => v) ?? keepRecord.iscPayableAt,
      iscPayableTo: records.map(r => r.iscPayableTo).find(v => v) ?? keepRecord.iscPayableTo,
      contactNumber: records.map(r => r.contactNumber).find(v => v) ?? keepRecord.contactNumber,
      contactEmail: records.map(r => r.contactEmail).find(v => v) ?? keepRecord.contactEmail,
      notes: records.map(r => r.notes).find(v => v) ?? keepRecord.notes,
      lastUpdated: new Date(),
    };

    await db.update(airlineOperationsTable).set(merged).where(eq(airlineOperationsTable.id, keepId));
    await db.delete(airlineOperationsTable).where(inArray(airlineOperationsTable.id, deleteIds));

    res.json({ message: `Merged ${deleteIds.length} operation(s) into ID ${keepId}`, keepId, deleted: deleteIds.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
