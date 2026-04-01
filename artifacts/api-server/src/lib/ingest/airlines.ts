import { eq } from "drizzle-orm";

const AIRLINES_DATA = [
  { name: "American Airlines", iataCode: "AA", icaoCode: "AAL", cbpCode: "AA", country: "US" },
  { name: "Delta Air Lines", iataCode: "DL", icaoCode: "DAL", cbpCode: "DL", country: "US" },
  { name: "United Airlines", iataCode: "UA", icaoCode: "UAL", cbpCode: "UA", country: "US" },
  { name: "Southwest Airlines", iataCode: "WN", icaoCode: "SWA", cbpCode: "WN", country: "US" },
  { name: "Alaska Airlines", iataCode: "AS", icaoCode: "ASA", cbpCode: "AS", country: "US" },
  { name: "JetBlue Airways", iataCode: "B6", icaoCode: "JBU", cbpCode: "B6", country: "US" },
  { name: "Spirit Airlines", iataCode: "NK", icaoCode: "NKS", cbpCode: "NK", country: "US" },
  { name: "Frontier Airlines", iataCode: "F9", icaoCode: "FFT", cbpCode: "F9", country: "US" },
  { name: "Allegiant Air", iataCode: "G4", icaoCode: "AAY", cbpCode: "G4", country: "US" },
  { name: "Hawaiian Airlines", iataCode: "HA", icaoCode: "HAL", cbpCode: "HA", country: "US" },
  { name: "Sun Country Airlines", iataCode: "SY", icaoCode: "SCX", cbpCode: "SY", country: "US" },
  { name: "Breeze Airways", iataCode: "MX", icaoCode: "BZE", cbpCode: "MX", country: "US" },
  { name: "Avelo Airlines", iataCode: "XP", icaoCode: "VXP", cbpCode: "XP", country: "US" },
  { name: "Air Canada", iataCode: "AC", icaoCode: "ACA", cbpCode: "AC", country: "CA" },
  { name: "Air Canada Rouge", iataCode: "RV", icaoCode: "ROU", cbpCode: "RV", country: "CA" },
  { name: "WestJet", iataCode: "WS", icaoCode: "WJA", cbpCode: "WS", country: "CA" },
  { name: "Air Transat", iataCode: "TS", icaoCode: "TSC", cbpCode: "TS", country: "CA" },
  { name: "Porter Airlines", iataCode: "PD", icaoCode: "POE", cbpCode: "PD", country: "CA" },
  { name: "British Airways", iataCode: "BA", icaoCode: "BAW", cbpCode: "BA", country: "GB" },
  { name: "Virgin Atlantic", iataCode: "VS", icaoCode: "VIR", cbpCode: "VS", country: "GB" },
  { name: "easyJet", iataCode: "U2", icaoCode: "EZY", cbpCode: "U2", country: "GB" },
  { name: "Ryanair", iataCode: "FR", icaoCode: "RYR", cbpCode: "FR", country: "IE" },
  { name: "Aer Lingus", iataCode: "EI", icaoCode: "EIN", cbpCode: "EI", country: "IE" },
  { name: "Lufthansa", iataCode: "LH", icaoCode: "DLH", cbpCode: "LH", country: "DE" },
  { name: "Air France", iataCode: "AF", icaoCode: "AFR", cbpCode: "AF", country: "FR" },
  { name: "KLM Royal Dutch Airlines", iataCode: "KL", icaoCode: "KLM", cbpCode: "KL", country: "NL" },
  { name: "Swiss International Air Lines", iataCode: "LX", icaoCode: "SWR", cbpCode: "LX", country: "CH" },
  { name: "Austrian Airlines", iataCode: "OS", icaoCode: "AUA", cbpCode: "OS", country: "AT" },
  { name: "Brussels Airlines", iataCode: "SN", icaoCode: "BEL", cbpCode: "SN", country: "BE" },
  { name: "Iberia", iataCode: "IB", icaoCode: "IBE", cbpCode: "IB", country: "ES" },
  { name: "Vueling Airlines", iataCode: "VY", icaoCode: "VLG", cbpCode: "VY", country: "ES" },
  { name: "TAP Air Portugal", iataCode: "TP", icaoCode: "TAP", cbpCode: "TP", country: "PT" },
  { name: "ITA Airways", iataCode: "AZ", icaoCode: "ITY", cbpCode: "AZ", country: "IT" },
  { name: "Scandinavian Airlines", iataCode: "SK", icaoCode: "SAS", cbpCode: "SK", country: "SE" },
  { name: "Finnair", iataCode: "AY", icaoCode: "FIN", cbpCode: "AY", country: "FI" },
  { name: "Norwegian Air Shuttle", iataCode: "DY", icaoCode: "NAX", cbpCode: "DY", country: "NO" },
  { name: "Turkish Airlines", iataCode: "TK", icaoCode: "THY", cbpCode: "TK", country: "TR" },
  { name: "Emirates", iataCode: "EK", icaoCode: "UAE", cbpCode: "EK", country: "AE" },
  { name: "Qatar Airways", iataCode: "QR", icaoCode: "QTR", cbpCode: "QR", country: "QA" },
  { name: "Etihad Airways", iataCode: "EY", icaoCode: "ETD", cbpCode: "EY", country: "AE" },
  { name: "flydubai", iataCode: "FZ", icaoCode: "FDB", cbpCode: "FZ", country: "AE" },
  { name: "Air Arabia", iataCode: "G9", icaoCode: "ABY", cbpCode: "G9", country: "AE" },
  { name: "Singapore Airlines", iataCode: "SQ", icaoCode: "SIA", cbpCode: "SQ", country: "SG" },
  { name: "Cathay Pacific", iataCode: "CX", icaoCode: "CPA", cbpCode: "CX", country: "HK" },
  { name: "Japan Airlines", iataCode: "JL", icaoCode: "JAL", cbpCode: "JL", country: "JP" },
  { name: "ANA All Nippon Airways", iataCode: "NH", icaoCode: "ANA", cbpCode: "NH", country: "JP" },
  { name: "Korean Air", iataCode: "KE", icaoCode: "KAL", cbpCode: "KE", country: "KR" },
  { name: "Asiana Airlines", iataCode: "OZ", icaoCode: "AAR", cbpCode: "OZ", country: "KR" },
  { name: "China Airlines", iataCode: "CI", icaoCode: "CAL", cbpCode: "CI", country: "TW" },
  { name: "EVA Air", iataCode: "BR", icaoCode: "EVA", cbpCode: "BR", country: "TW" },
  { name: "Air China", iataCode: "CA", icaoCode: "CCA", cbpCode: "CA", country: "CN" },
  { name: "China Eastern Airlines", iataCode: "MU", icaoCode: "CES", cbpCode: "MU", country: "CN" },
  { name: "China Southern Airlines", iataCode: "CZ", icaoCode: "CSN", cbpCode: "CZ", country: "CN" },
  { name: "Thai Airways", iataCode: "TG", icaoCode: "THA", cbpCode: "TG", country: "TH" },
  { name: "Malaysia Airlines", iataCode: "MH", icaoCode: "MAS", cbpCode: "MH", country: "MY" },
  { name: "Garuda Indonesia", iataCode: "GA", icaoCode: "GIA", cbpCode: "GA", country: "ID" },
  { name: "Philippine Airlines", iataCode: "PR", icaoCode: "PAL", cbpCode: "PR", country: "PH" },
  { name: "Vietnam Airlines", iataCode: "VN", icaoCode: "HVN", cbpCode: "VN", country: "VN" },
  { name: "Air India", iataCode: "AI", icaoCode: "AIC", cbpCode: "AI", country: "IN" },
  { name: "IndiGo", iataCode: "6E", icaoCode: "IGO", cbpCode: "6E", country: "IN" },
  { name: "Aeromexico", iataCode: "AM", icaoCode: "AMX", cbpCode: "AM", country: "MX" },
  { name: "LATAM Airlines", iataCode: "LA", icaoCode: "LAN", cbpCode: "LA", country: "CL" },
  { name: "Avianca", iataCode: "AV", icaoCode: "AVA", cbpCode: "AV", country: "CO" },
  { name: "Copa Airlines", iataCode: "CM", icaoCode: "CMP", cbpCode: "CM", country: "PA" },
  { name: "Gol Linhas Aereas", iataCode: "G3", icaoCode: "GLO", cbpCode: "G3", country: "BR" },
  { name: "Azul Brazilian Airlines", iataCode: "AD", icaoCode: "AZU", cbpCode: "AD", country: "BR" },
  { name: "Caribbean Airlines", iataCode: "BW", icaoCode: "BWA", cbpCode: "BW", country: "TT" },
  { name: "Cayman Airways", iataCode: "KX", icaoCode: "CAY", cbpCode: "KX", country: "KY" },
  { name: "Ethiopian Airlines", iataCode: "ET", icaoCode: "ETH", cbpCode: "ET", country: "ET" },
  { name: "Kenya Airways", iataCode: "KQ", icaoCode: "KQA", cbpCode: "KQ", country: "KE" },
  { name: "South African Airways", iataCode: "SA", icaoCode: "SAA", cbpCode: "SA", country: "ZA" },
  { name: "Egyptair", iataCode: "MS", icaoCode: "MSR", cbpCode: "MS", country: "EG" },
  { name: "Royal Air Maroc", iataCode: "AT", icaoCode: "RAM", cbpCode: "AT", country: "MA" },
  { name: "Air New Zealand", iataCode: "NZ", icaoCode: "ANZ", cbpCode: "NZ", country: "NZ" },
  { name: "Qantas", iataCode: "QF", icaoCode: "QFA", cbpCode: "QF", country: "AU" },
  { name: "Virgin Australia", iataCode: "VA", icaoCode: "VOZ", cbpCode: "VA", country: "AU" },
  { name: "Aeroflot", iataCode: "SU", icaoCode: "AFL", cbpCode: "SU", country: "RU" },
  { name: "LOT Polish Airlines", iataCode: "LO", icaoCode: "LOT", cbpCode: "LO", country: "PL" },
  { name: "Wizz Air", iataCode: "W6", icaoCode: "WZZ", cbpCode: "W6", country: "HU" },
  { name: "Aegean Airlines", iataCode: "A3", icaoCode: "AEE", cbpCode: "A3", country: "GR" },
  { name: "El Al Israel Airlines", iataCode: "LY", icaoCode: "ELY", cbpCode: "LY", country: "IL" },
  { name: "Pakistan International Airlines", iataCode: "PK", icaoCode: "PIA", cbpCode: "PK", country: "PK" },
  { name: "Sri Lankan Airlines", iataCode: "UL", icaoCode: "ALK", cbpCode: "UL", country: "LK" },
  { name: "Biman Bangladesh Airlines", iataCode: "BG", icaoCode: "BBC", cbpCode: "BG", country: "BD" },
  { name: "Atlas Air", iataCode: "5Y", icaoCode: "GTI", cbpCode: "5Y", country: "US" },
  { name: "FedEx Express", iataCode: "FX", icaoCode: "FDX", cbpCode: "FX", country: "US" },
  { name: "UPS Airlines", iataCode: "5X", icaoCode: "UPS", cbpCode: "5X", country: "US" },
  { name: "Kalitta Air", iataCode: "K4", icaoCode: "CKS", cbpCode: "K4", country: "US" },
  { name: "Western Global Airlines", iataCode: "WGN", icaoCode: "WGN", cbpCode: null, country: "US" },
  { name: "Cargolux", iataCode: "CV", icaoCode: "CLX", cbpCode: "CV", country: "LU" },
  { name: "Lufthansa Cargo", iataCode: "LH", icaoCode: "GEC", cbpCode: "LH", country: "DE" },
  { name: "Air France Cargo", iataCode: "AF", icaoCode: "AFR", cbpCode: "AF", country: "FR" },
  { name: "Korean Air Cargo", iataCode: "KE", icaoCode: "KAL", cbpCode: "KE", country: "KR" },
  { name: "Singapore Airlines Cargo", iataCode: "SQ", icaoCode: "SIA", cbpCode: "SQ", country: "SG" },
  { name: "Cathay Pacific Cargo", iataCode: "CX", icaoCode: "CPA", cbpCode: "CX", country: "HK" },
  { name: "Emirates SkyCargo", iataCode: "EK", icaoCode: "UAE", cbpCode: "EK", country: "AE" },
  { name: "Qatar Airways Cargo", iataCode: "QR", icaoCode: "QTR", cbpCode: "QR", country: "QA" },
];

export async function ingestAirlines(
  db: any,
  rawImportsTable: any,
  airlinesTable: any,
  source: string
): Promise<{ pending: number; skipped: number }> {
  let pending = 0;
  let skipped = 0;

  for (const airline of AIRLINES_DATA) {
    try {
      let existsInDb = false;

      if (airline.iataCode) {
        const existing = await db
          .select({ id: airlinesTable.id })
          .from(airlinesTable)
          .where(eq(airlinesTable.iataCode, airline.iataCode))
          .limit(1);
        existsInDb = existing.length > 0;
      } else {
        const existing = await db
          .select({ id: airlinesTable.id })
          .from(airlinesTable)
          .where(eq(airlinesTable.name, airline.name))
          .limit(1);
        existsInDb = existing.length > 0;
      }

      const status = existsInDb ? "skipped" : "pending";
      if (existsInDb) {
        skipped++;
      } else {
        pending++;
      }

      await db.insert(rawImportsTable).values({
        source,
        dataType: "airline",
        rawData: airline,
        flagged: false,
        status,
      }).onConflictDoNothing();

    } catch {
      skipped++;
    }
  }

  return { pending, skipped };
}
