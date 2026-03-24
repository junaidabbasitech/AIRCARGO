import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { airlineOperationsTable, airlinesTable, airportsTable } from "@workspace/db/schema";
import { eq, and, ilike } from "drizzle-orm";

const router: IRouter = Router();

// Parse AWB number: accepts "176-12345678", "17612345678", "176 12345678"
function parseAwbPrefix(awb: string): string | null {
  const cleaned = awb.trim().replace(/[\s\-]/g, "");
  // Standard format: first 3 digits are the prefix
  if (/^\d{3}/.test(cleaned)) return cleaned.slice(0, 3);
  return null;
}

// GET /api/awb-search?awb=176-12345678&airport=JFK
router.get("/awb-search", async (req, res) => {
  try {
    const { awb, airport } = req.query as Record<string, string>;

    if (!awb) return res.status(400).json({ message: "awb parameter is required (e.g. 176-12345678)" });
    if (!airport) return res.status(400).json({ message: "airport parameter is required (IATA code, e.g. JFK)" });

    const prefix = parseAwbPrefix(awb);
    if (!prefix) return res.status(400).json({ message: "Could not parse AWB prefix — ensure format is XXX-XXXXXXXX" });

    const airportCode = airport.trim().toUpperCase();

    // 1. Find airline by AWB prefix
    const [airline] = await db
      .select()
      .from(airlinesTable)
      .where(eq(airlinesTable.awbPrefix, prefix));

    if (!airline) {
      return res.status(404).json({
        message: `No airline found for AWB prefix ${prefix}`,
        awbPrefix: prefix,
        airport: airportCode,
      });
    }

    // 2. Find airport by IATA code
    const [airportRow] = await db
      .select()
      .from(airportsTable)
      .where(ilike(airportsTable.iataCode, airportCode));

    if (!airportRow) {
      return res.status(404).json({
        message: `Airport '${airportCode}' not found in registry`,
        awbPrefix: prefix,
        airline: { id: airline.id, name: airline.name, iataCode: airline.iataCode, awbPrefix: airline.awbPrefix },
      });
    }

    // 3. Find airline_operations for this airline + airport
    const [ops] = await db
      .select({
        id: airlineOperationsTable.id,
        firmsCode: airlineOperationsTable.firmsCode,
        iscAmount: airlineOperationsTable.iscAmount,
        iscPayableAt: airlineOperationsTable.iscPayableAt,
        iscPayableTo: airlineOperationsTable.iscPayableTo,
        contactNumber: airlineOperationsTable.contactNumber,
        contactEmail: airlineOperationsTable.contactEmail,
        notes: airlineOperationsTable.notes,
      })
      .from(airlineOperationsTable)
      .where(
        and(
          eq(airlineOperationsTable.airlineId, airline.id),
          eq(airlineOperationsTable.airportId, airportRow.id)
        )
      );

    return res.json({
      awb: awb.trim(),
      awbPrefix: prefix,
      airline: {
        id: airline.id,
        name: airline.name,
        iataCode: airline.iataCode,
        icaoCode: airline.icaoCode,
        country: airline.country,
        awbPrefix: airline.awbPrefix,
      },
      airport: {
        id: airportRow.id,
        name: airportRow.name,
        iataCode: airportRow.iataCode,
        city: airportRow.city,
        state: airportRow.state,
        country: airportRow.country,
      },
      operations: ops ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
