import { Router, type IRouter } from "express";
import multer from "multer";
import XLSX from "xlsx";
import { db } from "@workspace/db";
import { airlinesTable, airportsTable, airlineOperationsTable } from "@workspace/db/schema";
import { eq, and, ne } from "drizzle-orm";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function parseWorkbook(buffer: Buffer) {
  return XLSX.read(buffer, { type: "buffer" });
}

function clean(v: any): string {
  return String(v ?? "").trim();
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

router.get("/export/airports", async (req, res) => {
  try {
    const rows = await db.select().from(airportsTable).orderBy(airportsTable.iataCode);
    const data = rows.map(r => ({
      "IATA Code": r.iataCode ?? "",
      "Airport Name": r.name,
      "City": r.city ?? "",
      "State": r.state ?? "",
      "Country": r.country ?? "",
      "CBP Port Code": r.cbpPortCode ?? "",
      "Customs Approved": r.customsApproved ? "Yes" : "No",
      "Status": r.status ?? "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Airports");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=airports.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buf);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Export failed" });
  }
});

router.get("/export/airlines", async (req, res) => {
  try {
    const rows = await db.select().from(airlinesTable).orderBy(airlinesTable.iataCode);
    const data = rows.map(r => ({
      "IATA Code": r.iataCode ?? "",
      "Airline Name": r.name,
      "ICAO Code": r.icaoCode ?? "",
      "CBP Code": r.cbpCode ?? "",
      "Country": r.country ?? "",
      "Status": r.status ?? "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Airlines");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=airlines.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buf);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Export failed" });
  }
});

router.get("/export/airline-operations", async (req, res) => {
  try {
    const rows = await db
      .select({
        airlineName: airlinesTable.name,
        airlineIata: airlinesTable.iataCode,
        airportIata: airportsTable.iataCode,
        airportName: airportsTable.name,
        city: airportsTable.city,
        state: airportsTable.state,
        firmsCode: airlineOperationsTable.firmsCode,
        iscAmount: airlineOperationsTable.iscAmount,
        iscPayableAt: airlineOperationsTable.iscPayableAt,
        iscPayableTo: airlineOperationsTable.iscPayableTo,
        contactNumber: airlineOperationsTable.contactNumber,
        contactEmail: airlineOperationsTable.contactEmail,
        notes: airlineOperationsTable.notes,
      })
      .from(airlineOperationsTable)
      .leftJoin(airlinesTable, eq(airlineOperationsTable.airlineId, airlinesTable.id))
      .leftJoin(airportsTable, eq(airlineOperationsTable.airportId, airportsTable.id))
      .orderBy(airlinesTable.name, airportsTable.name);

    const data = rows.map(r => ({
      "Airline": r.airlineName ?? "",
      "Airline IATA": r.airlineIata ?? "",
      "Airport IATA": r.airportIata ?? "",
      "Airport Name": r.airportName ?? "",
      "City": r.city ?? "",
      "State": r.state ?? "",
      "FIRMS Code": r.firmsCode ?? "",
      "ISC Amount": r.iscAmount ?? "",
      "ISC Payable At": r.iscPayableAt ?? "",
      "ISC Payable To": r.iscPayableTo ?? "",
      "Contact Number": r.contactNumber ?? "",
      "Contact Email": r.contactEmail ?? "",
      "Notes": r.notes ?? "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Airline Operations");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=airline-operations.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buf);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Export failed" });
  }
});

router.get("/export/all", async (req, res) => {
  try {
    const [airports, airlines] = await Promise.all([
      db.select().from(airportsTable).orderBy(airportsTable.iataCode),
      db.select().from(airlinesTable).orderBy(airlinesTable.iataCode),
    ]);
    const ops = await db
      .select({
        airlineName: airlinesTable.name,
        airlineIata: airlinesTable.iataCode,
        airportIata: airportsTable.iataCode,
        airportName: airportsTable.name,
        city: airportsTable.city,
        state: airportsTable.state,
        firmsCode: airlineOperationsTable.firmsCode,
        iscAmount: airlineOperationsTable.iscAmount,
        iscPayableAt: airlineOperationsTable.iscPayableAt,
        iscPayableTo: airlineOperationsTable.iscPayableTo,
        contactNumber: airlineOperationsTable.contactNumber,
        contactEmail: airlineOperationsTable.contactEmail,
        notes: airlineOperationsTable.notes,
      })
      .from(airlineOperationsTable)
      .leftJoin(airlinesTable, eq(airlineOperationsTable.airlineId, airlinesTable.id))
      .leftJoin(airportsTable, eq(airlineOperationsTable.airportId, airportsTable.id))
      .orderBy(airlinesTable.name, airportsTable.name);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(airports.map(r => ({
      "IATA Code": r.iataCode ?? "", "Airport Name": r.name, "City": r.city ?? "",
      "State": r.state ?? "", "Country": r.country ?? "", "CBP Port Code": r.cbpPortCode ?? "",
      "Customs Approved": r.customsApproved ? "Yes" : "No", "Status": r.status ?? "",
    }))), "Airports");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(airlines.map(r => ({
      "IATA Code": r.iataCode ?? "", "Airline Name": r.name, "ICAO Code": r.icaoCode ?? "",
      "CBP Code": r.cbpCode ?? "", "Country": r.country ?? "", "Status": r.status ?? "",
    }))), "Airlines");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ops.map(r => ({
      "Airline": r.airlineName ?? "", "Airline IATA": r.airlineIata ?? "",
      "Airport IATA": r.airportIata ?? "", "Airport Name": r.airportName ?? "",
      "City": r.city ?? "", "State": r.state ?? "", "FIRMS Code": r.firmsCode ?? "",
      "ISC Amount": r.iscAmount ?? "", "ISC Payable At": r.iscPayableAt ?? "",
      "ISC Payable To": r.iscPayableTo ?? "", "Contact Number": r.contactNumber ?? "",
      "Contact Email": r.contactEmail ?? "", "Notes": r.notes ?? "",
    }))), "Airline Operations");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=aviacbp-export.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buf);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ message: "Export failed" });
  }
});

// ─── IMPORT ──────────────────────────────────────────────────────────────────

router.post("/import/airports", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const wb = parseWorkbook(req.file.buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    let inserted = 0, updated = 0, skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const iata = clean(row["IATA Code"] || row["iata_code"] || row["Code"] || row["IATA"]).toUpperCase();
      const name = clean(row["Airport Name"] || row["Name"] || row["name"] || row["Description of Airport"] || row["airport_name"]);
      const city = clean(row["City"] || row["City Name"] || row["city"]) || undefined;
      const state = clean(row["State"] || row["state"]) || undefined;
      const country = clean(row["Country"] || row["country"]) || "US";
      const cbpCode = clean(row["CBP Port Code"] || row["cbp_port_code"] || row["CBP Code"]) || undefined;
      const customsStr = clean(row["Customs Approved"] || row["customs_approved"] || "").toLowerCase();
      const customs = customsStr === "yes" || customsStr === "true" || customsStr === "1";

      if (!iata || iata.length < 2 || iata.length > 5) { skipped++; continue; }
      if (!name) { skipped++; continue; }

      try {
        const existing = await db.select({ id: airportsTable.id }).from(airportsTable)
          .where(eq(airportsTable.iataCode, iata)).limit(1);

        if (existing.length > 0) {
          await db.update(airportsTable).set({
            name, city, state, country,
            customsApproved: customs,
            ...(cbpCode ? { cbpPortCode: cbpCode } : {}),
          }).where(eq(airportsTable.iataCode, iata));
          updated++;
        } else {
          await db.insert(airportsTable).values({
            iataCode: iata, name, city, state, country: country || "US",
            customsApproved: customs, cbpPortCode: cbpCode,
            status: "approved", source: "excel_upload",
          });
          inserted++;
        }
      } catch (e: any) {
        errors.push(`${iata}: ${e.message}`);
      }
    }

    return res.json({ inserted, updated, skipped, errors: errors.slice(0, 10), total: rows.length });
  } catch (err: any) {
    req.log.error(err);
    return res.status(400).json({ message: `Failed to parse file: ${err.message}` });
  }
});

router.post("/import/airlines", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const wb = parseWorkbook(req.file.buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    let inserted = 0, updated = 0, skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const iata = clean(row["IATA Code"] || row["iata_code"] || row["IATA"]).toUpperCase();
      const name = clean(row["Airline Name"] || row["Name"] || row["name"] || row["airline_name"]);
      const icao = clean(row["ICAO Code"] || row["icao_code"] || row["ICAO"]).toUpperCase() || undefined;
      const cbp = clean(row["CBP Code"] || row["cbp_code"]).toUpperCase() || undefined;
      const country = clean(row["Country"] || row["country"]) || undefined;

      if (!iata || iata.length < 2 || iata.length > 4 || /[^A-Z0-9]/.test(iata)) { skipped++; continue; }
      if (!name) { skipped++; continue; }

      try {
        const existing = await db.select({ id: airlinesTable.id }).from(airlinesTable)
          .where(eq(airlinesTable.iataCode, iata)).limit(1);

        if (existing.length > 0) {
          await db.update(airlinesTable).set({ name, icaoCode: icao, cbpCode: cbp, country })
            .where(eq(airlinesTable.iataCode, iata));
          updated++;
        } else {
          await db.insert(airlinesTable).values({
            iataCode: iata, name, icaoCode: icao, cbpCode: cbp,
            country, status: "approved", source: "excel_upload",
          });
          inserted++;
        }
      } catch (e: any) {
        errors.push(`${iata}: ${e.message}`);
      }
    }

    return res.json({ inserted, updated, skipped, errors: errors.slice(0, 10), total: rows.length });
  } catch (err: any) {
    req.log.error(err);
    return res.status(400).json({ message: `Failed to parse file: ${err.message}` });
  }
});

router.post("/import/airline-operations", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const wb = parseWorkbook(req.file.buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    let inserted = 0, updated = 0, skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const airlineIata = clean(row["Airline IATA"] || row["airline_iata"]).toUpperCase();
      const airportIata = clean(row["Airport IATA"] || row["airport_iata"]).toUpperCase();
      const firmsCode = clean(row["FIRMS Code"] || row["firms_code"]) || undefined;
      const iscAmount = clean(row["ISC Amount"] || row["isc_amount"] || row["ISC Charge"] || row["isc_charge"]) || undefined;
      const iscPayableAt = clean(row["ISC Payable At"] || row["isc_payable_at"]) || undefined;
      const iscPayableTo = clean(row["ISC Payable To"] || row["isc_payable_to"]) || undefined;
      const contactNumber = clean(row["Contact Number"] || row["contact_number"] || row["Contact Phone"] || row["contact_phone"]) || undefined;
      const contactEmail = clean(row["Contact Email"] || row["contact_email"]) || undefined;
      const notes = clean(row["Notes"] || row["notes"]) || undefined;

      if (!airlineIata || !airportIata) { skipped++; continue; }

      try {
        const [airlineRow] = await db.select({ id: airlinesTable.id }).from(airlinesTable)
          .where(eq(airlinesTable.iataCode, airlineIata)).limit(1);
        const [airportRow] = await db.select({ id: airportsTable.id }).from(airportsTable)
          .where(eq(airportsTable.iataCode, airportIata)).limit(1);

        if (!airlineRow || !airportRow) { skipped++; continue; }

        const [existing] = await db.select({ id: airlineOperationsTable.id }).from(airlineOperationsTable)
          .where(and(
            eq(airlineOperationsTable.airlineId, airlineRow.id),
            eq(airlineOperationsTable.airportId, airportRow.id)
          )).limit(1);

        // FIRMS code uniqueness check — reject if this code is already used by a different operation
        const normalizedFirms = firmsCode ? firmsCode.trim().toUpperCase() : undefined;
        if (normalizedFirms) {
          const conditions = [eq(airlineOperationsTable.firmsCode, normalizedFirms)];
          if (existing) conditions.push(ne(airlineOperationsTable.id, existing.id));
          const [firmsConflict] = await db.select({ id: airlineOperationsTable.id })
            .from(airlineOperationsTable)
            .where(and(...conditions)).limit(1);
          if (firmsConflict) {
            errors.push(`${airlineIata}@${airportIata}: FIRMS code "${normalizedFirms}" is already in use by operation ID ${firmsConflict.id}`);
            skipped++;
            continue;
          }
        }

        if (existing) {
          await db.update(airlineOperationsTable).set({
            firmsCode: normalizedFirms ?? null,
            iscAmount, iscPayableAt, iscPayableTo, contactNumber, contactEmail, notes,
          }).where(eq(airlineOperationsTable.id, existing.id));
          updated++;
        } else {
          await db.insert(airlineOperationsTable).values({
            airlineId: airlineRow.id, airportId: airportRow.id,
            firmsCode: normalizedFirms,
            iscAmount, iscPayableAt, iscPayableTo, contactNumber, contactEmail, notes,
          });
          inserted++;
        }
      } catch (e: any) {
        errors.push(`${airlineIata}@${airportIata}: ${e.message}`);
      }
    }

    return res.json({ inserted, updated, skipped, errors: errors.slice(0, 10), total: rows.length });
  } catch (err: any) {
    req.log.error(err);
    return res.status(400).json({ message: `Failed to parse file: ${err.message}` });
  }
});

export default router;
