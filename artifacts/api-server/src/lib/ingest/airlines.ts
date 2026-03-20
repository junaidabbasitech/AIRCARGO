import type { DrizzleTypeError } from "drizzle-orm";

type AnyDB = {
  insert: (table: unknown) => {
    values: (data: unknown) => {
      onConflictDoNothing: () => Promise<unknown>;
    };
  };
  select: () => {
    from: (table: unknown) => {
      where: (cond: unknown) => Promise<unknown[]>;
    };
  };
};

// Comprehensive curated airline dataset (100+ airlines) from IATA sources
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
  { name: "Alitalia", iataCode: "AZ", icaoCode: "AZA", cbpCode: "AZ", country: "IT" },
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
  { name: "Saudia", iataCode: "SV", icaoCode: "SVA", cbpCode: "SV", country: "SA" },
  { name: "Royal Jordanian", iataCode: "RJ", icaoCode: "RJA", cbpCode: "RJ", country: "JO" },
  { name: "Middle East Airlines", iataCode: "ME", icaoCode: "MEA", cbpCode: "ME", country: "LB" },
  { name: "Oman Air", iataCode: "WY", icaoCode: "OMA", cbpCode: "WY", country: "OM" },
  { name: "Kuwait Airways", iataCode: "KU", icaoCode: "KAC", cbpCode: "KU", country: "KW" },
  { name: "Gulf Air", iataCode: "GF", icaoCode: "GFA", cbpCode: "GF", country: "BH" },
  { name: "Singapore Airlines", iataCode: "SQ", icaoCode: "SIA", cbpCode: "SQ", country: "SG" },
  { name: "Cathay Pacific", iataCode: "CX", icaoCode: "CPA", cbpCode: "CX", country: "HK" },
  { name: "Japan Airlines", iataCode: "JL", icaoCode: "JAL", cbpCode: "JL", country: "JP" },
  { name: "All Nippon Airways", iataCode: "NH", icaoCode: "ANA", cbpCode: "NH", country: "JP" },
  { name: "Korean Air", iataCode: "KE", icaoCode: "KAL", cbpCode: "KE", country: "KR" },
  { name: "Asiana Airlines", iataCode: "OZ", icaoCode: "AAR", cbpCode: "OZ", country: "KR" },
  { name: "China Airlines", iataCode: "CI", icaoCode: "CAL", cbpCode: "CI", country: "TW" },
  { name: "EVA Air", iataCode: "BR", icaoCode: "EVA", cbpCode: "BR", country: "TW" },
  { name: "China Eastern Airlines", iataCode: "MU", icaoCode: "CES", cbpCode: "MU", country: "CN" },
  { name: "China Southern Airlines", iataCode: "CZ", icaoCode: "CSN", cbpCode: "CZ", country: "CN" },
  { name: "Air China", iataCode: "CA", icaoCode: "CCA", cbpCode: "CA", country: "CN" },
  { name: "Hainan Airlines", iataCode: "HU", icaoCode: "CHH", cbpCode: "HU", country: "CN" },
  { name: "Thai Airways", iataCode: "TG", icaoCode: "THA", cbpCode: "TG", country: "TH" },
  { name: "Bangkok Airways", iataCode: "PG", icaoCode: "BKP", cbpCode: "PG", country: "TH" },
  { name: "Vietnam Airlines", iataCode: "VN", icaoCode: "HVN", cbpCode: "VN", country: "VN" },
  { name: "Philippine Airlines", iataCode: "PR", icaoCode: "PAL", cbpCode: "PR", country: "PH" },
  { name: "Garuda Indonesia", iataCode: "GA", icaoCode: "GIA", cbpCode: "GA", country: "ID" },
  { name: "Malaysia Airlines", iataCode: "MH", icaoCode: "MAS", cbpCode: "MH", country: "MY" },
  { name: "AirAsia", iataCode: "AK", icaoCode: "AXM", cbpCode: "AK", country: "MY" },
  { name: "IndiGo", iataCode: "6E", icaoCode: "IGO", cbpCode: "6E", country: "IN" },
  { name: "Air India", iataCode: "AI", icaoCode: "AIC", cbpCode: "AI", country: "IN" },
  { name: "SpiceJet", iataCode: "SG", icaoCode: "SEJ", cbpCode: "SG", country: "IN" },
  { name: "Aeromexico", iataCode: "AM", icaoCode: "AMX", cbpCode: "AM", country: "MX" },
  { name: "Volaris", iataCode: "Y4", icaoCode: "VOI", cbpCode: "Y4", country: "MX" },
  { name: "VivaAerobus", iataCode: "VB", icaoCode: "VIV", cbpCode: "VB", country: "MX" },
  { name: "LATAM Airlines", iataCode: "LA", icaoCode: "LAN", cbpCode: "LA", country: "CL" },
  { name: "Copa Airlines", iataCode: "CM", icaoCode: "CMP", cbpCode: "CM", country: "PA" },
  { name: "Avianca", iataCode: "AV", icaoCode: "AVA", cbpCode: "AV", country: "CO" },
  { name: "GOL Linhas Aereas", iataCode: "G3", icaoCode: "GLO", cbpCode: "G3", country: "BR" },
  { name: "LATAM Brasil", iataCode: "JJ", icaoCode: "TAM", cbpCode: "JJ", country: "BR" },
  { name: "Azul Brazilian Airlines", iataCode: "AD", icaoCode: "AZU", cbpCode: "AD", country: "BR" },
  { name: "Caribbean Airlines", iataCode: "BW", icaoCode: "BWA", cbpCode: "BW", country: "TT" },
  { name: "Bahamasair", iataCode: "UP", icaoCode: "BHS", cbpCode: "UP", country: "BS" },
  { name: "Cayman Airways", iataCode: "KX", icaoCode: "CAY", cbpCode: "KX", country: "KY" },
  { name: "Air Jamaica", iataCode: "JM", icaoCode: "AJM", cbpCode: "JM", country: "JM" },
  { name: "Ethiopian Airlines", iataCode: "ET", icaoCode: "ETH", cbpCode: "ET", country: "ET" },
  { name: "Kenya Airways", iataCode: "KQ", icaoCode: "KQA", cbpCode: "KQ", country: "KE" },
  { name: "South African Airways", iataCode: "SA", icaoCode: "SAA", cbpCode: "SA", country: "ZA" },
  { name: "Egyptair", iataCode: "MS", icaoCode: "MSR", cbpCode: "MS", country: "EG" },
  { name: "Royal Air Maroc", iataCode: "AT", icaoCode: "RAM", cbpCode: "AT", country: "MA" },
  { name: "Tunisair", iataCode: "TU", icaoCode: "TAR", cbpCode: "TU", country: "TN" },
  { name: "Air Algerie", iataCode: "AH", icaoCode: "DAH", cbpCode: "AH", country: "DZ" },
  { name: "Air New Zealand", iataCode: "NZ", icaoCode: "ANZ", cbpCode: "NZ", country: "NZ" },
  { name: "Qantas", iataCode: "QF", icaoCode: "QFA", cbpCode: "QF", country: "AU" },
  { name: "Virgin Australia", iataCode: "VA", icaoCode: "VOZ", cbpCode: "VA", country: "AU" },
  { name: "Aeroflot", iataCode: "SU", icaoCode: "AFL", cbpCode: "SU", country: "RU" },
  { name: "Ural Airlines", iataCode: "U6", icaoCode: "SVR", cbpCode: "U6", country: "RU" },
  { name: "LOT Polish Airlines", iataCode: "LO", icaoCode: "LOT", cbpCode: "LO", country: "PL" },
  { name: "Czech Airlines", iataCode: "OK", icaoCode: "CSA", cbpCode: "OK", country: "CZ" },
  { name: "Wizz Air", iataCode: "W6", icaoCode: "WZZ", cbpCode: "W6", country: "HU" },
  { name: "Aegean Airlines", iataCode: "A3", icaoCode: "AEE", cbpCode: "A3", country: "GR" },
  { name: "Air Baltic", iataCode: "BT", icaoCode: "BTI", cbpCode: "BT", country: "LV" },
  { name: "TAL Aviation Group", iataCode: null, icaoCode: null, cbpCode: null, country: "IL" },
  { name: "El Al Israel Airlines", iataCode: "LY", icaoCode: "ELY", cbpCode: "LY", country: "IL" },
  { name: "Arkia", iataCode: "IZ", icaoCode: "AIZ", cbpCode: "IZ", country: "IL" },
  { name: "Iran Air", iataCode: "IR", icaoCode: "IRA", cbpCode: "IR", country: "IR" },
  { name: "Pakistan International Airlines", iataCode: "PK", icaoCode: "PIA", cbpCode: "PK", country: "PK" },
  { name: "Sri Lankan Airlines", iataCode: "UL", icaoCode: "ALK", cbpCode: "UL", country: "LK" },
  { name: "Maldivian", iataCode: "Q2", icaoCode: "DQA", cbpCode: "Q2", country: "MV" },
  { name: "Biman Bangladesh Airlines", iataCode: "BG", icaoCode: "BBC", cbpCode: "BG", country: "BD" },
  { name: "Nepal Airlines", iataCode: "RA", icaoCode: "RNA", cbpCode: "RA", country: "NP" },
];

export async function ingestAirlines(
  db: any,
  rawImportsTable: any,
  airlinesTable: any,
  source: string
): Promise<number> {
  let added = 0;

  for (const airline of AIRLINES_DATA) {
    try {
      await db.insert(rawImportsTable).values({
        source,
        dataType: "airline",
        rawData: airline,
        flagged: false,
      }).onConflictDoNothing();

      const result = await db.insert(airlinesTable).values({
        name: airline.name,
        iataCode: airline.iataCode,
        cbpCode: airline.cbpCode,
        icaoCode: airline.icaoCode,
        country: airline.country,
        source,
        status: "pending",
        flaggedForReview: false,
        lastUpdated: new Date(),
      }).onConflictDoNothing().returning();

      if (result.length > 0) added++;
    } catch {
      // Skip duplicates silently
    }
  }

  return added;
}
