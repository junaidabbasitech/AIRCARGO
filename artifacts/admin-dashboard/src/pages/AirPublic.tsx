import { useState } from "react";
import { useListAirlines, useListAirports } from "@workspace/api-client-react";
import { Search, Plane, Building2, MapPin, Filter, ChevronRight } from "lucide-react";

export default function AirPublic() {
  const [tab, setTab] = useState<"airlines" | "airports">("airlines");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [customs, setCustoms] = useState<"" | "yes" | "no">("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const airlinesQuery = useListAirlines({
    search: tab === "airlines" ? search : "",
    status: "approved" as any,
    page: tab === "airlines" ? page : 1,
    limit,
  });

  const airportsQuery = useListAirports({
    search: tab === "airports" ? search : "",
    status: "approved" as any,
    page: tab === "airports" ? page : 1,
    limit,
  });

  const airlines = airlinesQuery.data;
  const airports = airportsQuery.data;

  const filteredAirlines = airlines?.data.filter(a =>
    (!country || a.country?.toLowerCase().includes(country.toLowerCase()))
  );

  const filteredAirports = airports?.data.filter(a => {
    if (country && !a.country?.toLowerCase().includes(country.toLowerCase()) &&
        !a.state?.toLowerCase().includes(country.toLowerCase()) &&
        !a.city?.toLowerCase().includes(country.toLowerCase())) return false;
    if (customs === "yes" && !a.customsApproved) return false;
    if (customs === "no" && a.customsApproved) return false;
    return true;
  });

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleTab = (t: "airlines" | "airports") => { setTab(t); setSearch(""); setPage(1); setCountry(""); setCustoms(""); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50">
      {/* Header */}
      <div className="bg-[hsl(220,48%,14%)] text-white px-6 py-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Plane className="h-7 w-7 text-orange-400" />
          <div>
            <span className="font-display text-xl tracking-widest text-sky-300">AIR</span>
            <span className="font-display text-xl tracking-widest text-orange-400 ml-1">SEARCH</span>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Aviation Data Directory</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          LIVE DATA
        </div>
      </div>

      {/* Hero search */}
      <div className="bg-gradient-to-b from-[hsl(220,48%,20%)] to-transparent pt-10 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-display text-white tracking-widest mb-2">
            FIND <span className="text-orange-400">AVIATION</span> DATA
          </h1>
          <p className="text-slate-300 font-sans text-sm mb-8">Search airlines and airports with CBP port codes and customs approval status</p>

          {/* Tab switcher */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-white/10 rounded-xl p-1 gap-1">
              <button
                onClick={() => handleTab("airlines")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === "airlines"
                    ? "bg-sky-500 text-white shadow-md scale-105"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Plane className="h-4 w-4" /> Airlines
              </button>
              <button
                onClick={() => handleTab("airports")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === "airports"
                    ? "bg-orange-500 text-white shadow-md scale-105"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Building2 className="h-4 w-4" /> Airports
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder={tab === "airlines" ? "Search by airline name, IATA code, country..." : "Search by airport name, city, state, IATA code..."}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-white/20 bg-white/95 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 shadow-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters + Results */}
      <div className="max-w-5xl mx-auto px-6 -mt-8">
        {/* Filter chips */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-4 flex flex-wrap items-center gap-3 border border-sky-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Filter className="h-4 w-4 text-sky-500" /> Filters:
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-slate-500 whitespace-nowrap">Country / State:</label>
            <input
              type="text"
              value={country}
              onChange={e => { setCountry(e.target.value); setPage(1); }}
              placeholder="e.g. US, CA, NY"
              className="border border-sky-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 bg-sky-50 hover:bg-sky-100 transition-colors"
            />
          </div>
          {tab === "airports" && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-slate-500 whitespace-nowrap">Customs:</label>
              <select
                value={customs}
                onChange={e => { setCustoms(e.target.value as any); setPage(1); }}
                className="border border-orange-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer"
              >
                <option value="">All</option>
                <option value="yes">Customs Approved</option>
                <option value="no">Not Approved</option>
              </select>
            </div>
          )}
          {(search || country || customs) && (
            <button
              onClick={() => { setSearch(""); setCountry(""); setCustoms(""); setPage(1); }}
              className="text-xs text-red-500 hover:text-red-700 hover:underline font-semibold transition-colors ml-auto"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl shadow-md border border-sky-100 overflow-hidden mb-8">
          {tab === "airlines" ? (
            <>
              <div className="px-5 py-3 border-b border-sky-100 flex items-center justify-between bg-sky-50">
                <span className="text-sm font-semibold text-sky-700">
                  {airlinesQuery.isLoading ? "Loading..." : `${filteredAirlines?.length ?? 0} Airlines found`}
                </span>
                {airlines && <span className="text-xs text-slate-400 font-mono">{airlines.total} total approved</span>}
              </div>
              {airlinesQuery.isLoading ? (
                <div className="py-16 text-center text-slate-400 text-sm animate-pulse">Searching airline registry...</div>
              ) : filteredAirlines?.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">No airlines match your search criteria.</div>
              ) : (
                <div className="divide-y divide-sky-50">
                  {filteredAirlines?.map(airline => (
                    <div key={airline.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-sky-50 transition-colors group cursor-default">
                      <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 font-bold font-mono text-sm shrink-0 group-hover:bg-sky-200 transition-colors">
                        {airline.iataCode || "??"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{airline.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {airline.iataCode && <span className="text-xs font-mono bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">IATA: {airline.iataCode}</span>}
                          {airline.icaoCode && <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">ICAO: {airline.icaoCode}</span>}
                          {airline.cbpCode && <span className="text-xs font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">CBP: {airline.cbpCode}</span>}
                          {airline.country && <span className="text-xs text-slate-400">• {airline.country}</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-sky-400 transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-orange-100 flex items-center justify-between bg-orange-50">
                <span className="text-sm font-semibold text-orange-700">
                  {airportsQuery.isLoading ? "Loading..." : `${filteredAirports?.length ?? 0} Airports found`}
                </span>
                {airports && <span className="text-xs text-slate-400 font-mono">{airports.total} total approved</span>}
              </div>
              {airportsQuery.isLoading ? (
                <div className="py-16 text-center text-slate-400 text-sm animate-pulse">Searching airport registry...</div>
              ) : filteredAirports?.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">No airports match your search criteria.</div>
              ) : (
                <div className="divide-y divide-orange-50">
                  {filteredAirports?.map(airport => (
                    <div key={airport.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-orange-50 transition-colors group cursor-default">
                      <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold font-mono text-sm shrink-0 group-hover:bg-orange-200 transition-colors">
                        {airport.iataCode || "??"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{airport.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {airport.iataCode && <span className="text-xs font-mono bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">IATA: {airport.iataCode}</span>}
                          {airport.cbpPortCode && <span className="text-xs font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">CBP: {airport.cbpPortCode}</span>}
                          {(airport.city || airport.state) && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[airport.city, airport.state].filter(Boolean).join(", ")}
                            </span>
                          )}
                          {airport.customsApproved && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">✓ Customs</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-orange-400 transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {((tab === "airlines" && airlines && airlines.total > limit) ||
            (tab === "airports" && airports && airports.total > limit)) && (
            <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-xs font-mono text-slate-400">
                Page {page} of {Math.ceil((tab === "airlines" ? (airlines?.total ?? 0) : (airports?.total ?? 0)) / limit)}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                <button
                  disabled={page * limit >= (tab === "airlines" ? (airlines?.total ?? 0) : (airports?.total ?? 0))}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
