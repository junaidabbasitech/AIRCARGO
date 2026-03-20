/**
 * Pre-populate airline_operations table from Excel Sheet1 data
 */
import { db, airlinesTable, airportsTable, airlineOperationsTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";

const OPERATIONS_DATA = [
  // Emirates (EK)
  { airlineIata: "EK", airportIata: "JFK", firmsCode: "F670", iscAmount: "180.50", iscPayableAt: "Epic", iscPayableTo: "WFS", contactNumber: "718-656-3980 / 718-880-3417 / 718-880-3418", contactEmail: "ekimport@wfs.aero" },
  { airlineIata: "EK", airportIata: "EWR", firmsCode: "E435", iscAmount: "100.00", iscPayableAt: null, iscPayableTo: "Alliance Ground International", contactNumber: "973-206-0660", contactEmail: "agiekewr@allianceground.com" },
  { airlineIata: "EK", airportIata: "ATL", firmsCode: "L531", iscAmount: null, iscPayableAt: null, iscPayableTo: "Swissport", contactNumber: "404-767-8785", contactEmail: "atlekops@swissport.com" },
  { airlineIata: "EK", airportIata: "LAX", firmsCode: "W177", iscAmount: "95.00", iscPayableAt: "Epic Pay", iscPayableTo: "Mercury Air Cargo", contactNumber: "310-258-6100", contactEmail: "ekimport@mercuryair.com" },
  { airlineIata: "EK", airportIata: "ORD", firmsCode: "H526", iscAmount: "75–105", iscPayableAt: null, iscPayableTo: "Airport Logistics / Maestro Cargo", contactNumber: "773-686-0700 / 773-570-6432", contactEmail: "ordres@emirates.com" },
  { airlineIata: "EK", airportIata: "MCO", firmsCode: "O761", iscAmount: "75.00", iscPayableAt: "Pay Cargo / Cargo Sprint", iscPayableTo: null, contactNumber: "321-732-8070", contactEmail: null },
  { airlineIata: "EK", airportIata: "BOS", firmsCode: "A308", iscAmount: null, iscPayableAt: null, iscPayableTo: null, contactNumber: "617-702-2848", contactEmail: null },
  { airlineIata: "EK", airportIata: "IAD", firmsCode: "L720", iscAmount: null, iscPayableAt: null, iscPayableTo: "WFS", contactNumber: "703-840-8392", contactEmail: "iadres@emirates.com" },
  // Turkish Airlines (TK)
  { airlineIata: "TK", airportIata: "JFK", firmsCode: "F364", iscAmount: "170.00", iscPayableAt: null, iscPayableTo: "Alliance Ground International", contactNumber: "718-785-2920 / 718-553-2190 / 718-880-3513", contactEmail: "jfktkimp@allianceground.com" },
  { airlineIata: "TK", airportIata: "MIA", firmsCode: "LAI0", iscAmount: null, iscPayableAt: null, iscPayableTo: "Alliance Ground International", contactNumber: "305-871-9001", contactEmail: "miacargo@thy.com" },
  { airlineIata: "TK", airportIata: "ORD", firmsCode: "K372", iscAmount: "90.00", iscPayableAt: null, iscPayableTo: "Alliance Ground International", contactNumber: "773-686-5840", contactEmail: "tkordops@allianceground.com" },
  // Cathay Pacific (CX)
  { airlineIata: "CX", airportIata: "JFK", firmsCode: "F177", iscAmount: "150.00", iscPayableAt: "Cargo Sprint", iscPayableTo: "WFS", contactNumber: "718-656-3980", contactEmail: "jfkcargo@cathaypacific.com" },
  // British Airways (BA)
  { airlineIata: "BA", airportIata: "JFK", firmsCode: "F364", iscAmount: "125.00", iscPayableAt: "Epic", iscPayableTo: "Alliance Ground International", contactNumber: "718-880-3513", contactEmail: "jfkbaexp@allianceground.com" },
  { airlineIata: "BA", airportIata: "LAX", firmsCode: "W208", iscAmount: "100.00", iscPayableAt: "Epic Pay", iscPayableTo: "Midwest Express Handling", contactNumber: "310-646-3620", contactEmail: "laxcargo@ba.com" },
  // Etihad (EY)
  { airlineIata: "EY", airportIata: "JFK", firmsCode: "F601", iscAmount: "160.00", iscPayableAt: "Cargo Sprint", iscPayableTo: "WFS", contactNumber: "718-553-2190", contactEmail: "jfkimport@etihad.com" },
  // Qatar Airways (QR)
  { airlineIata: "QR", airportIata: "JFK", firmsCode: "F602", iscAmount: "157.00", iscPayableAt: "Epic", iscPayableTo: "WFS", contactNumber: "718-656-3981", contactEmail: "jfkcargo@qatarairways.com.qa" },
  { airlineIata: "QR", airportIata: "IAH", firmsCode: "H720", iscAmount: "130.00", iscPayableAt: "Cargo Sprint", iscPayableTo: "Epic Cargo", contactNumber: "832-827-5830", contactEmail: null },
  // Lufthansa (LH)
  { airlineIata: "LH", airportIata: "JFK", firmsCode: "F290", iscAmount: "120.00", iscPayableAt: "Cargo Sprint", iscPayableTo: null, contactNumber: "718-244-5500", contactEmail: "jfkimport@dlh.de" },
  { airlineIata: "LH", airportIata: "BOS", firmsCode: "A290", iscAmount: "90.00", iscPayableAt: "Cargo Sprint", iscPayableTo: null, contactNumber: "617-702-2849", contactEmail: "boshandling@dlh.de" },
  { airlineIata: "LH", airportIata: "MIA", firmsCode: "M290", iscAmount: "95.00", iscPayableAt: "Cargo Sprint", iscPayableTo: null, contactNumber: "305-871-9002", contactEmail: "miaimport@dlh.de" },
  // Korean Air (KE)
  { airlineIata: "KE", airportIata: "JFK", firmsCode: "F180", iscAmount: "145.00", iscPayableAt: "Epic", iscPayableTo: "WFS", contactNumber: "718-656-3982", contactEmail: "jfkcargo@koreanair.com" },
  // Japan Airlines (JL)
  { airlineIata: "JL", airportIata: "JFK", firmsCode: "F131", iscAmount: "140.00", iscPayableAt: "Cargo Sprint", iscPayableTo: "Alliance Ground International", contactNumber: "718-785-2921", contactEmail: "jfkimport@jal.com" },
  // Ethiopian Airlines (ET)
  { airlineIata: "ET", airportIata: "IAD", firmsCode: "L071", iscAmount: "100.00", iscPayableAt: "Epic", iscPayableTo: "WFS", contactNumber: "703-840-8393", contactEmail: "etiadcargo@ethiopianairlines.com" },
  // Air France (AF)
  { airlineIata: "AF", airportIata: "JFK", firmsCode: "F057", iscAmount: "130.00", iscPayableAt: "Cargo Sprint", iscPayableTo: "Alliance Ground International", contactNumber: "718-880-3519", contactEmail: "jfkafcargo@airfrance.fr" },
  // Singapore Airlines (SQ)
  { airlineIata: "SQ", airportIata: "JFK", firmsCode: "F618", iscAmount: "155.00", iscPayableAt: "Epic", iscPayableTo: "WFS", contactNumber: "718-656-3984", contactEmail: "jfkcargo@singaporeair.com" },
  // Air China (CA)
  { airlineIata: "CA", airportIata: "JFK", firmsCode: "F999", iscAmount: "135.00", iscPayableAt: "Cargo Sprint", iscPayableTo: "WFS", contactNumber: "718-656-3985", contactEmail: "jfkcargo@airchina.com" },
];

async function ingestOperations() {
  console.log("Ingesting airline operations data...\n");

  let inserted = 0;
  let skipped = 0;
  let notFound = 0;

  for (const op of OPERATIONS_DATA) {
    // Look up airline by IATA code
    const [airline] = await db.select().from(airlinesTable).where(eq(airlinesTable.iataCode, op.airlineIata));
    if (!airline) { console.warn(`  Airline not found: ${op.airlineIata}`); notFound++; continue; }

    // Look up airport by IATA code
    const [airport] = await db.select().from(airportsTable).where(eq(airportsTable.iataCode, op.airportIata));
    if (!airport) { console.warn(`  Airport not found: ${op.airportIata}`); notFound++; continue; }

    // Check for duplicate
    const existing = await db.select().from(airlineOperationsTable)
      .where(eq(airlineOperationsTable.airlineId, airline.id));
    const dup = existing.find(e => e.airportId === airport.id);
    if (dup) { skipped++; continue; }

    await db.insert(airlineOperationsTable).values({
      airlineId: airline.id,
      airportId: airport.id,
      firmsCode: op.firmsCode || null,
      iscAmount: op.iscAmount || null,
      iscPayableAt: op.iscPayableAt || null,
      iscPayableTo: op.iscPayableTo || null,
      contactNumber: op.contactNumber || null,
      contactEmail: op.contactEmail || null,
    });
    console.log(`  + ${op.airlineIata} @ ${op.airportIata}`);
    inserted++;
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped, ${notFound} not found.`);
  process.exit(0);
}

ingestOperations().catch(err => { console.error(err); process.exit(1); });
