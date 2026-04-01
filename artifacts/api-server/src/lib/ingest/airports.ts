import { eq } from "drizzle-orm";

const US_AIRPORTS_DATA = [
  { name: "Hartsfield-Jackson Atlanta International Airport", iataCode: "ATL", cbpPortCode: "0101", city: "Atlanta", state: "GA", country: "US", customsApproved: true },
  { name: "Los Angeles International Airport", iataCode: "LAX", cbpPortCode: "2704", city: "Los Angeles", state: "CA", country: "US", customsApproved: true },
  { name: "O'Hare International Airport", iataCode: "ORD", cbpPortCode: "3901", city: "Chicago", state: "IL", country: "US", customsApproved: true },
  { name: "Dallas/Fort Worth International Airport", iataCode: "DFW", cbpPortCode: "5501", city: "Dallas", state: "TX", country: "US", customsApproved: true },
  { name: "Denver International Airport", iataCode: "DEN", cbpPortCode: "5901", city: "Denver", state: "CO", country: "US", customsApproved: true },
  { name: "John F. Kennedy International Airport", iataCode: "JFK", cbpPortCode: "4701", city: "New York", state: "NY", country: "US", customsApproved: true },
  { name: "San Francisco International Airport", iataCode: "SFO", cbpPortCode: "2801", city: "San Francisco", state: "CA", country: "US", customsApproved: true },
  { name: "Seattle-Tacoma International Airport", iataCode: "SEA", cbpPortCode: "3001", city: "Seattle", state: "WA", country: "US", customsApproved: true },
  { name: "Orlando International Airport", iataCode: "MCO", cbpPortCode: "5201", city: "Orlando", state: "FL", country: "US", customsApproved: true },
  { name: "Miami International Airport", iataCode: "MIA", cbpPortCode: "5201", city: "Miami", state: "FL", country: "US", customsApproved: true },
  { name: "Newark Liberty International Airport", iataCode: "EWR", cbpPortCode: "4701", city: "Newark", state: "NJ", country: "US", customsApproved: true },
  { name: "Charlotte Douglas International Airport", iataCode: "CLT", cbpPortCode: "1501", city: "Charlotte", state: "NC", country: "US", customsApproved: true },
  { name: "Phoenix Sky Harbor International Airport", iataCode: "PHX", cbpPortCode: "2601", city: "Phoenix", state: "AZ", country: "US", customsApproved: true },
  { name: "George Bush Intercontinental Airport", iataCode: "IAH", cbpPortCode: "5301", city: "Houston", state: "TX", country: "US", customsApproved: true },
  { name: "Boston Logan International Airport", iataCode: "BOS", cbpPortCode: "0401", city: "Boston", state: "MA", country: "US", customsApproved: true },
  { name: "Minneapolis-Saint Paul International Airport", iataCode: "MSP", cbpPortCode: "3401", city: "Minneapolis", state: "MN", country: "US", customsApproved: true },
  { name: "Fort Lauderdale-Hollywood International Airport", iataCode: "FLL", cbpPortCode: "5201", city: "Fort Lauderdale", state: "FL", country: "US", customsApproved: true },
  { name: "Detroit Metropolitan Wayne County Airport", iataCode: "DTW", cbpPortCode: "3801", city: "Detroit", state: "MI", country: "US", customsApproved: true },
  { name: "Philadelphia International Airport", iataCode: "PHL", cbpPortCode: "1101", city: "Philadelphia", state: "PA", country: "US", customsApproved: true },
  { name: "Salt Lake City International Airport", iataCode: "SLC", cbpPortCode: "2901", city: "Salt Lake City", state: "UT", country: "US", customsApproved: true },
  { name: "Ronald Reagan Washington National Airport", iataCode: "DCA", cbpPortCode: "5401", city: "Washington", state: "DC", country: "US", customsApproved: true },
  { name: "Baltimore-Washington International Airport", iataCode: "BWI", cbpPortCode: "1301", city: "Baltimore", state: "MD", country: "US", customsApproved: true },
  { name: "Dulles International Airport", iataCode: "IAD", cbpPortCode: "5401", city: "Dulles", state: "VA", country: "US", customsApproved: true },
  { name: "San Diego International Airport", iataCode: "SAN", cbpPortCode: "2501", city: "San Diego", state: "CA", country: "US", customsApproved: true },
  { name: "Midway International Airport", iataCode: "MDW", cbpPortCode: "3901", city: "Chicago", state: "IL", country: "US", customsApproved: false },
  { name: "Tampa International Airport", iataCode: "TPA", cbpPortCode: "5201", city: "Tampa", state: "FL", country: "US", customsApproved: true },
  { name: "Portland International Airport", iataCode: "PDX", cbpPortCode: "2901", city: "Portland", state: "OR", country: "US", customsApproved: true },
  { name: "Nashville International Airport", iataCode: "BNA", cbpPortCode: "4401", city: "Nashville", state: "TN", country: "US", customsApproved: true },
  { name: "Austin-Bergstrom International Airport", iataCode: "AUS", cbpPortCode: "5501", city: "Austin", state: "TX", country: "US", customsApproved: true },
  { name: "Oakland International Airport", iataCode: "OAK", cbpPortCode: "2801", city: "Oakland", state: "CA", country: "US", customsApproved: false },
  { name: "John Wayne Airport", iataCode: "SNA", cbpPortCode: "2704", city: "Santa Ana", state: "CA", country: "US", customsApproved: false },
  { name: "Louis Armstrong New Orleans International Airport", iataCode: "MSY", cbpPortCode: "2001", city: "New Orleans", state: "LA", country: "US", customsApproved: true },
  { name: "Kansas City International Airport", iataCode: "MCI", cbpPortCode: "4501", city: "Kansas City", state: "MO", country: "US", customsApproved: true },
  { name: "Raleigh-Durham International Airport", iataCode: "RDU", cbpPortCode: "1501", city: "Raleigh", state: "NC", country: "US", customsApproved: true },
  { name: "Pittsburgh International Airport", iataCode: "PIT", cbpPortCode: "1101", city: "Pittsburgh", state: "PA", country: "US", customsApproved: true },
  { name: "Cleveland Hopkins International Airport", iataCode: "CLE", cbpPortCode: "4101", city: "Cleveland", state: "OH", country: "US", customsApproved: true },
  { name: "Indianapolis International Airport", iataCode: "IND", cbpPortCode: "3501", city: "Indianapolis", state: "IN", country: "US", customsApproved: true },
  { name: "Cincinnati/Northern Kentucky International Airport", iataCode: "CVG", cbpPortCode: "1701", city: "Cincinnati", state: "OH", country: "US", customsApproved: true },
  { name: "Louisville Muhammad Ali International Airport", iataCode: "SDF", cbpPortCode: "1601", city: "Louisville", state: "KY", country: "US", customsApproved: true },
  { name: "Sacramento International Airport", iataCode: "SMF", cbpPortCode: "2801", city: "Sacramento", state: "CA", country: "US", customsApproved: true },
  { name: "San Jose International Airport", iataCode: "SJC", cbpPortCode: "2801", city: "San Jose", state: "CA", country: "US", customsApproved: true },
  { name: "Tucson International Airport", iataCode: "TUS", cbpPortCode: "2601", city: "Tucson", state: "AZ", country: "US", customsApproved: true },
  { name: "Albuquerque International Airport", iataCode: "ABQ", cbpPortCode: "3101", city: "Albuquerque", state: "NM", country: "US", customsApproved: true },
  { name: "El Paso International Airport", iataCode: "ELP", cbpPortCode: "2401", city: "El Paso", state: "TX", country: "US", customsApproved: true },
  { name: "Milwaukee Mitchell International Airport", iataCode: "MKE", cbpPortCode: "3901", city: "Milwaukee", state: "WI", country: "US", customsApproved: true },
  { name: "Memphis International Airport", iataCode: "MEM", cbpPortCode: "4401", city: "Memphis", state: "TN", country: "US", customsApproved: true },
  { name: "Richmond International Airport", iataCode: "RIC", cbpPortCode: "1103", city: "Richmond", state: "VA", country: "US", customsApproved: true },
  { name: "Jacksonville International Airport", iataCode: "JAX", cbpPortCode: "5201", city: "Jacksonville", state: "FL", country: "US", customsApproved: true },
  { name: "Anchorage International Airport", iataCode: "ANC", cbpPortCode: "3101", city: "Anchorage", state: "AK", country: "US", customsApproved: true },
  { name: "Honolulu International Airport", iataCode: "HNL", cbpPortCode: "3201", city: "Honolulu", state: "HI", country: "US", customsApproved: true },
  { name: "Buffalo Niagara International Airport", iataCode: "BUF", cbpPortCode: "0901", city: "Buffalo", state: "NY", country: "US", customsApproved: true },
  { name: "Albany International Airport", iataCode: "ALB", cbpPortCode: "0901", city: "Albany", state: "NY", country: "US", customsApproved: false },
  { name: "Bradley International Airport", iataCode: "BDL", cbpPortCode: "0401", city: "Windsor Locks", state: "CT", country: "US", customsApproved: true },
  { name: "Providence T.F. Green Airport", iataCode: "PVD", cbpPortCode: "0401", city: "Providence", state: "RI", country: "US", customsApproved: false },
  { name: "Portland International Jetport", iataCode: "PWM", cbpPortCode: "0101", city: "Portland", state: "ME", country: "US", customsApproved: false },
  { name: "Burlington International Airport", iataCode: "BTV", cbpPortCode: "0201", city: "Burlington", state: "VT", country: "US", customsApproved: false },
  { name: "Concord Regional Airport", iataCode: "CON", cbpPortCode: "0101", city: "Concord", state: "NH", country: "US", customsApproved: false },
  { name: "Boise Airport", iataCode: "BOI", cbpPortCode: "3201", city: "Boise", state: "ID", country: "US", customsApproved: false },
  { name: "Spokane International Airport", iataCode: "GEG", cbpPortCode: "3001", city: "Spokane", state: "WA", country: "US", customsApproved: false },
  { name: "Bellingham International Airport", iataCode: "BLI", cbpPortCode: "3001", city: "Bellingham", state: "WA", country: "US", customsApproved: false },
  { name: "Missoula Montana Airport", iataCode: "MSO", cbpPortCode: "3301", city: "Missoula", state: "MT", country: "US", customsApproved: false },
  { name: "Billings Logan International Airport", iataCode: "BIL", cbpPortCode: "3301", city: "Billings", state: "MT", country: "US", customsApproved: false },
  { name: "Fargo Hector International Airport", iataCode: "FAR", cbpPortCode: "3401", city: "Fargo", state: "ND", country: "US", customsApproved: false },
  { name: "Sioux Falls Regional Airport", iataCode: "FSD", cbpPortCode: "3401", city: "Sioux Falls", state: "SD", country: "US", customsApproved: false },
  { name: "Rapid City Regional Airport", iataCode: "RAP", cbpPortCode: "3401", city: "Rapid City", state: "SD", country: "US", customsApproved: false },
  { name: "Lincoln Airport", iataCode: "LNK", cbpPortCode: "4501", city: "Lincoln", state: "NE", country: "US", customsApproved: false },
  { name: "Omaha Eppley Airfield", iataCode: "OMA", cbpPortCode: "4501", city: "Omaha", state: "NE", country: "US", customsApproved: false },
  { name: "Des Moines International Airport", iataCode: "DSM", cbpPortCode: "4501", city: "Des Moines", state: "IA", country: "US", customsApproved: false },
];

export async function ingestAirports(
  db: any,
  rawImportsTable: any,
  airportsTable: any,
  source: string
): Promise<{ pending: number; skipped: number }> {
  let pending = 0;
  let skipped = 0;

  for (const airport of US_AIRPORTS_DATA) {
    try {
      let existsInDb = false;

      if (airport.iataCode) {
        const existing = await db
          .select({ id: airportsTable.id })
          .from(airportsTable)
          .where(eq(airportsTable.iataCode, airport.iataCode))
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
        dataType: "airport",
        rawData: airport,
        flagged: false,
        status,
      }).onConflictDoNothing();

    } catch {
      skipped++;
    }
  }

  return { pending, skipped };
}
