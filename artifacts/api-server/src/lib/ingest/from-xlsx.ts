/**
 * Ingest data from the uploaded Excel file:
 * - Sheet1 rows 1-9: Airports
 * - Sheet1 rows 12+: Airlines + ground handler relationships
 */
import { db, airlinesTable, airportsTable, groundHandlersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// ─── Airports from Sheet1 ───────────────────────────────────────────────────
const AIRPORTS_FROM_XLSX = [
  { name: "John F. Kennedy International Airport", iataCode: "JFK", city: "Queens", state: "NY", country: "US", customsApproved: true },
  { name: "Hartsfield-Jackson Atlanta International Airport", iataCode: "ATL", city: "Atlanta", state: "GA", country: "US", customsApproved: true },
  { name: "Washington Dulles International Airport", iataCode: "IAD", city: "Dulles", state: "VA", country: "US", customsApproved: true },
  { name: "Detroit Metropolitan Wayne County Airport", iataCode: "DTW", city: "Detroit", state: "MI", country: "US", customsApproved: true },
  { name: "Miami International Airport", iataCode: "MIA", city: "Miami", state: "FL", country: "US", customsApproved: true },
  { name: "Orlando International Airport", iataCode: "MCO", city: "Orlando", state: "FL", country: "US", customsApproved: true },
  { name: "Boston Logan International Airport", iataCode: "BOS", city: "Boston", state: "MA", country: "US", customsApproved: true },
  { name: "Los Angeles International Airport", iataCode: "LAX", city: "Los Angeles", state: "CA", country: "US", customsApproved: true },
  { name: "Newark Liberty International Airport", iataCode: "EWR", city: "Newark", state: "NJ", country: "US", customsApproved: true },
  { name: "O'Hare International Airport", iataCode: "ORD", city: "Chicago", state: "IL", country: "US", customsApproved: true },
  { name: "Houston George Bush Intercontinental Airport", iataCode: "IAH", city: "Houston", state: "TX", country: "US", customsApproved: true },
];

// ─── Airlines from Sheet1 ───────────────────────────────────────────────────
const AIRLINES_FROM_XLSX = [
  { name: "Emirates Airlines", iataCode: "EK", icaoCode: "UAE", cbpCode: "EK", country: "AE" },
  { name: "Turkish Airlines", iataCode: "TK", icaoCode: "THY", cbpCode: "TK", country: "TR" },
  { name: "Cathay Pacific Airways", iataCode: "CX", icaoCode: "CPA", cbpCode: "CX", country: "HK" },
  { name: "British Airways", iataCode: "BA", icaoCode: "BAW", cbpCode: "BA", country: "GB" },
  { name: "United Airlines", iataCode: "UA", icaoCode: "UAL", cbpCode: "UA", country: "US" },
  { name: "Etihad Airways", iataCode: "EY", icaoCode: "ETD", cbpCode: "EY", country: "AE" },
  { name: "Qatar Airways", iataCode: "QR", icaoCode: "QTR", cbpCode: "QR", country: "QA" },
  { name: "KLM Royal Dutch Airlines", iataCode: "KL", icaoCode: "KLM", cbpCode: "KL", country: "NL" },
  { name: "Aer Lingus", iataCode: "EI", icaoCode: "EIN", cbpCode: "EI", country: "IE" },
  { name: "Silk Way West Airlines", iataCode: "7L", icaoCode: "AZG", cbpCode: "7L", country: "AZ" },
  { name: "American Airlines", iataCode: "AA", icaoCode: "AAL", cbpCode: "AA", country: "US" },
  { name: "Philippine Airlines", iataCode: "PR", icaoCode: "PAL", cbpCode: "PR", country: "PH" },
  { name: "Air France", iataCode: "AF", icaoCode: "AFR", cbpCode: "AF", country: "FR" },
  { name: "Saudia", iataCode: "SV", icaoCode: "SVA", cbpCode: "SV", country: "SA" },
  { name: "TAP Air Portugal", iataCode: "TP", icaoCode: "TAP", cbpCode: "TP", country: "PT" },
  { name: "Brussels Airlines", iataCode: "SN", icaoCode: "BEL", cbpCode: "SN", country: "BE" },
  { name: "Asiana Airlines", iataCode: "OZ", icaoCode: "AAR", cbpCode: "OZ", country: "KR" },
  { name: "Royal Air Maroc", iataCode: "AT", icaoCode: "RAM", cbpCode: "AT", country: "MA" },
  { name: "Kuwait Airways", iataCode: "KU", icaoCode: "KAC", cbpCode: "KU", country: "KW" },
  { name: "Azerbaijan Airlines", iataCode: "J2", icaoCode: "AHY", cbpCode: "J2", country: "AZ" },
  { name: "Kalitta Air", iataCode: "K4", icaoCode: "CKS", cbpCode: "K4", country: "US" },
  { name: "Cargolux Airlines International", iataCode: "CV", icaoCode: "CLX", cbpCode: "CV", country: "LU" },
  { name: "LOT Polish Airlines", iataCode: "LO", icaoCode: "LOT", cbpCode: "LO", country: "PL" },
  { name: "Korean Air", iataCode: "KE", icaoCode: "KAL", cbpCode: "KE", country: "KR" },
  { name: "All Nippon Airways", iataCode: "NH", icaoCode: "ANA", cbpCode: "NH", country: "JP" },
  { name: "China Cargo Airlines", iataCode: "CK", icaoCode: "CKK", cbpCode: "CK", country: "CN" },
  { name: "China Southern Airlines", iataCode: "CZ", icaoCode: "CSN", cbpCode: "CZ", country: "CN" },
  { name: "China Eastern Airlines", iataCode: "MU", icaoCode: "CES", cbpCode: "MU", country: "CN" },
  { name: "LATAM Airlines", iataCode: "JJ", icaoCode: "TAM", cbpCode: "JJ", country: "BR" },
  { name: "Atlas Air", iataCode: "5Y", icaoCode: "GTI", cbpCode: "5Y", country: "US" },
  { name: "Air Europa", iataCode: "UX", icaoCode: "AEA", cbpCode: "UX", country: "ES" },
  { name: "Yemenia Yemen Airways", iataCode: "IY", icaoCode: "IYE", cbpCode: "IY", country: "YE" },
  { name: "Virgin Atlantic Cargo", iataCode: "VS", icaoCode: "VIR", cbpCode: "VS", country: "GB" },
  { name: "Martinair Holland", iataCode: "MP", icaoCode: "MPH", cbpCode: "MP", country: "NL" },
  { name: "Iberia Airlines", iataCode: "IB", icaoCode: "IBE", cbpCode: "IB", country: "ES" },
  { name: "Sky Lease Cargo", iataCode: "GG", icaoCode: "GGN", cbpCode: "GG", country: "US" },
  { name: "Aeromexico", iataCode: "AM", icaoCode: "AMX", cbpCode: "AM", country: "MX" },
  { name: "Cargojet Airways", iataCode: "W8", icaoCode: "CJT", cbpCode: "W8", country: "CA" },
  { name: "Swiss International Air Lines", iataCode: "LX", icaoCode: "SWR", cbpCode: "LX", country: "CH" },
  { name: "Amerijet International", iataCode: "M6", icaoCode: "AJT", cbpCode: "M6", country: "US" },
  { name: "Lufthansa", iataCode: "LH", icaoCode: "DLH", cbpCode: "LH", country: "DE" },
  { name: "Air Serbia", iataCode: "JU", icaoCode: "ASL", cbpCode: "JU", country: "RS" },
  { name: "Royal Jordanian", iataCode: "RJ", icaoCode: "RJA", cbpCode: "RJ", country: "JO" },
  { name: "Ethiopian Airlines", iataCode: "ET", icaoCode: "ETH", cbpCode: "ET", country: "ET" },
  { name: "Air Canada", iataCode: "AC", icaoCode: "ACA", cbpCode: "AC", country: "CA" },
  { name: "Polar Air Cargo", iataCode: "PO", icaoCode: "PAC", cbpCode: "PO", country: "US" },
  { name: "Air China", iataCode: "CA", icaoCode: "CCA", cbpCode: "CA", country: "CN" },
  { name: "Singapore Airlines", iataCode: "SQ", icaoCode: "SIA", cbpCode: "SQ", country: "SG" },
  { name: "Virgin Australia International", iataCode: "VA", icaoCode: "VAU", cbpCode: "VA", country: "AU" },
  { name: "Hong Kong Airlines", iataCode: "HX", icaoCode: "CRK", cbpCode: "HX", country: "HK" },
  { name: "Xiamen Airlines", iataCode: "MF", icaoCode: "CXA", cbpCode: "MF", country: "CN" },
  { name: "Ukraine International Airlines", iataCode: "PS", icaoCode: "AUI", cbpCode: "PS", country: "UA" },
  { name: "Hainan Airlines", iataCode: "HU", icaoCode: "CHH", cbpCode: "HU", country: "CN" },
  { name: "Aeroflot Russian Airlines", iataCode: "SU", icaoCode: "AFL", cbpCode: "SU", country: "RU" },
  { name: "China Airlines", iataCode: "CI", icaoCode: "CAL", cbpCode: "CI", country: "TW" },
  { name: "DHL Aviation", iataCode: "D0", icaoCode: "DHK", cbpCode: "D0", country: "BH" },
  { name: "Nippon Cargo Airlines", iataCode: "KZ", icaoCode: "NCA", cbpCode: "KZ", country: "JP" },
  { name: "Japan Airlines", iataCode: "JL", icaoCode: "JAL", cbpCode: "JL", country: "JP" },
  { name: "EVA Air", iataCode: "BR", icaoCode: "EVA", cbpCode: "BR", country: "TW" },
  { name: "Suparna Airlines", iataCode: "Y8", icaoCode: "GCR", cbpCode: "Y8", country: "CN" },
  { name: "MNG Airlines", iataCode: "MB", icaoCode: "MNB", cbpCode: "MB", country: "TR" },
  { name: "TNT Airways", iataCode: "3V", icaoCode: "TAY", cbpCode: "3V", country: "BE" },
  { name: "ATOT Express", iataCode: "AT", icaoCode: null, cbpCode: null, country: "US" },
];

// ─── Ground handlers ────────────────────────────────────────────────────────
const HANDLERS_FROM_XLSX = [
  { name: "WFS (Worldwide Flight Services)", contactPhone: "718-656-3980", contactEmail: "ekimport@wfs.aero", services: "Cargo handling, import/export" },
  { name: "Alliance Ground International", contactPhone: "973-206-0660", contactEmail: "agiekewr@allianceground.com", services: "Ground handling, cargo" },
  { name: "Mercury Air Cargo", contactPhone: "310-258-6100", contactEmail: "ekimport@mercuryair.com", services: "Cargo handling" },
  { name: "Airport Logistics / Maestro Cargo", contactPhone: "773-686-0700", contactEmail: "ordres@emirates.com", services: "Logistics, cargo" },
  { name: "WFF (Worldwide Freight Forwarders)", contactPhone: "718-880-3417", contactEmail: "jfktkimp@allianceground.com", services: "Freight forwarding" },
  { name: "Midwest Express Handling", contactPhone: "800-726-6654", contactEmail: null, services: "Ground handling" },
  { name: "Epic Cargo", contactPhone: "832-827-5830", contactEmail: null, services: "Cargo handling, ISC" },
  { name: "Swissport", contactPhone: "404-767-8785", contactEmail: "atlekops@swissport.com", services: "Ground handling, cargo" },
  { name: "Special Services Corp", contactPhone: null, contactEmail: null, services: "Special cargo services" },
  { name: "TGT Trucking", contactPhone: null, contactEmail: null, services: "Cargo trucking" },
  { name: "CAS (Cargo Airline Services)", contactPhone: "703-840-8392", contactEmail: null, services: "Cargo handling" },
  { name: "DHL Hub Services", contactPhone: null, contactEmail: "jfkimport@dlh.de", services: "Express cargo" },
  { name: "Nas Handling", contactPhone: "305-871-9001", contactEmail: "turkish@nashandling.aero", services: "Ground handling" },
];

async function ingestFromXlsx() {
  console.log("Starting Excel data ingestion...\n");

  // ── Airports ──
  let airportInserted = 0, airportSkipped = 0;
  for (const ap of AIRPORTS_FROM_XLSX) {
    const existing = await db.select().from(airportsTable).where(eq(airportsTable.iataCode, ap.iataCode));
    if (existing.length > 0) { airportSkipped++; continue; }
    await db.insert(airportsTable).values({
      name: ap.name,
      iataCode: ap.iataCode,
      city: ap.city,
      state: ap.state,
      country: ap.country,
      customsApproved: ap.customsApproved,
      status: "approved",
      source: "xlsx_import",
    });
    airportInserted++;
  }
  console.log(`Airports: inserted ${airportInserted}, skipped ${airportSkipped}`);

  // ── Airlines ──
  let airlineInserted = 0, airlineSkipped = 0;
  for (const al of AIRLINES_FROM_XLSX) {
    const existing = await db.select().from(airlinesTable).where(eq(airlinesTable.iataCode, al.iataCode));
    if (existing.length > 0) { airlineSkipped++; continue; }
    await db.insert(airlinesTable).values({
      name: al.name,
      iataCode: al.iataCode,
      icaoCode: al.icaoCode ?? undefined,
      cbpCode: al.cbpCode ?? undefined,
      country: al.country,
      status: "approved",
      source: "xlsx_import",
    });
    airlineInserted++;
  }
  console.log(`Airlines: inserted ${airlineInserted}, skipped ${airlineSkipped}`);

  // ── Ground handlers ──
  let handlerInserted = 0, handlerSkipped = 0;
  for (const gh of HANDLERS_FROM_XLSX) {
    const existing = await db.select().from(groundHandlersTable).where(eq(groundHandlersTable.name, gh.name));
    if (existing.length > 0) { handlerSkipped++; continue; }
    await db.insert(groundHandlersTable).values({
      name: gh.name,
      contactPhone: gh.contactPhone ?? undefined,
      contactEmail: gh.contactEmail ?? undefined,
      services: gh.services,
    });
    handlerInserted++;
  }
  console.log(`Ground Handlers: inserted ${handlerInserted}, skipped ${handlerSkipped}`);

  console.log("\nIngestion complete.");
  process.exit(0);
}

ingestFromXlsx().catch((err) => { console.error("Ingestion failed:", err); process.exit(1); });
