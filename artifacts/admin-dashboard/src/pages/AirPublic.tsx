import { useState, useEffect, useRef } from "react";
import { useListAirlines, useListAirports } from "@workspace/api-client-react";
import { Search, Plane, Building2, MapPin, Filter, ChevronRight, ChevronDown, X, Phone, Mail, Hash, DollarSign, ArrowLeft, Zap } from "lucide-react";

interface AirlineOperation {
  id: number;
  airlineId: number;
  airportId: number;
  firmsCode: string | null;
  iscAmount: string | null;
  iscPayableAt: string | null;
  iscPayableTo: string | null;
  contactNumber: string | null;
  contactEmail: string | null;
  notes: string | null;
  airlineName: string | null;
  airlineIata: string | null;
  airportName: string | null;
  airportIata: string | null;
  airportCity: string | null;
  airportState: string | null;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function fetchOps(airlineId?: number, airportId?: number): Promise<AirlineOperation[]> {
  const params = new URLSearchParams();
  if (airlineId) params.set("airlineId", String(airlineId));
  if (airportId) params.set("airportId", String(airportId));
  const res = await fetch(`${BASE}/api/airline-operations?${params}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function AirPublic() {
  const [tab, setTab] = useState<"airlines" | "airports">("airlines");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [icaoFilter, setIcaoFilter] = useState("");
  const [cbpFilter, setCbpFilter] = useState("");
  const [hasIscOnly, setHasIscOnly] = useState(false);
  const [firmsFilter, setFirmsFilter] = useState("");
  const [customs, setCustoms] = useState<"" | "yes" | "no">("");
  const [airportFilter, setAirportFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Airline IDs that have ISC/operations data
  const [iscAirlineIds, setIscAirlineIds] = useState<Set<number>>(new Set());
  const iscFetched = useRef(false);

  // Airline IDs that have operations with the specified FIRMS code
  const [firmsAirlineIds, setFirmsAirlineIds] = useState<Set<number>>(new Set());
  const firmsRef = useRef("");

  useEffect(() => {
    if (hasIscOnly && !iscFetched.current) {
      iscFetched.current = true;
      fetch(`${BASE}/api/airline-operations?limit=500`)
        .then(r => r.json())
        .then(json => {
          const ids = new Set<number>((json.data ?? []).map((op: AirlineOperation) => op.airlineId));
          setIscAirlineIds(ids);
        })
        .catch(() => {});
    }
  }, [hasIscOnly]);

  useEffect(() => {
    const code = firmsFilter.trim();
    if (!code) { setFirmsAirlineIds(new Set()); firmsRef.current = ""; return; }
    if (firmsRef.current === code) return;
    firmsRef.current = code;
    fetch(`${BASE}/api/airline-operations?firmsCode=${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then(json => {
        const ids = new Set<number>((json.data ?? []).map((op: AirlineOperation) => op.airlineId));
        setFirmsAirlineIds(ids);
      })
      .catch(() => {});
  }, [firmsFilter]);

  // Drilldown state
  const [selectedAirline, setSelectedAirline] = useState<{ id: number; name: string; iataCode?: string | null } | null>(null);
  const [airlineOps, setAirlineOps] = useState<AirlineOperation[]>([]);
  const [opsLoading, setOpsLoading] = useState(false);
  const [selectedOp, setSelectedOp] = useState<AirlineOperation | null>(null);

  const airlinesQuery = useListAirlines({ search: tab === "airlines" ? search : "", status: "approved" as any, page: tab === "airlines" ? page : 1, limit });
  const airportsQuery = useListAirports({ search: tab === "airports" ? search : "", status: "approved" as any, page: tab === "airports" ? page : 1, limit });

  const airlines = airlinesQuery.data;
  const airports = airportsQuery.data;

  const filteredAirlines = airlines?.data.filter(a => {
    if (country && !a.country?.toLowerCase().includes(country.toLowerCase())) return false;
    if (icaoFilter && !a.icaoCode?.toLowerCase().includes(icaoFilter.toLowerCase())) return false;
    if (cbpFilter && !a.cbpCode?.toLowerCase().includes(cbpFilter.toLowerCase())) return false;
    if (hasIscOnly && !iscAirlineIds.has(a.id)) return false;
    if (firmsFilter.trim() && !firmsAirlineIds.has(a.id)) return false;
    return true;
  });

  const filteredAirports = airports?.data.filter(a => {
    const loc = [a.city, a.state, a.country].join(" ").toLowerCase();
    if (country && !loc.includes(country.toLowerCase())) return false;
    if (airportFilter && !loc.includes(airportFilter.toLowerCase()) && !(a.name?.toLowerCase().includes(airportFilter.toLowerCase())) && !(a.iataCode?.toLowerCase().includes(airportFilter.toLowerCase()))) return false;
    if (customs === "yes" && !a.customsApproved) return false;
    if (customs === "no" && a.customsApproved) return false;
    return true;
  });

  const handleAirlineClick = async (airline: { id: number; name: string; iataCode?: string | null }) => {
    setSelectedAirline(airline);
    setSelectedOp(null);
    setOpsLoading(true);
    const ops = await fetchOps(airline.id);
    setAirlineOps(ops);
    setOpsLoading(false);
  };

  const clearAirlineFilters = () => { setCountry(""); setIcaoFilter(""); setCbpFilter(""); setHasIscOnly(false); setFirmsFilter(""); setPage(1); };
  const hasActiveFilters = !!(country || icaoFilter || cbpFilter || hasIscOnly || firmsFilter);

  const handleTab = (t: "airlines" | "airports") => {
    setTab(t); setSearch(""); setPage(1); setCountry(""); setCustoms(""); setAirportFilter("");
    setIcaoFilter(""); setCbpFilter(""); setHasIscOnly(false); setFirmsFilter("");
    setSelectedAirline(null); setSelectedOp(null); setAirlineOps([]);
  };

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-orange-50">
      {/* Header */}
      <div className="bg-[hsl(220,48%,14%)] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Plane className="h-7 w-7 text-orange-400" />
          <div>
            <div>
              <span className="font-display text-xl tracking-widest text-sky-300">AIR</span>
              <span className="font-display text-xl tracking-widest text-orange-400 ml-1">SEARCH</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Aviation Data Directory</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          LIVE DATA
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-[hsl(220,48%,20%)] to-transparent pt-8 pb-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-display text-white tracking-widest mb-1">
            FIND <span className="text-orange-400">AVIATION</span> DATA
          </h1>
          <p className="text-slate-300 text-sm mb-6">Search airlines and airports — click an airline to see where it operates, then view ISC charges and contact details</p>

          {/* Tabs */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex bg-white/10 rounded-xl p-1 gap-1">
              <button onClick={() => handleTab("airlines")} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === "airlines" ? "bg-sky-500 text-white shadow-md scale-105" : "text-slate-300 hover:text-white hover:bg-white/10"}`}>
                <Plane className="h-4 w-4" /> Airlines
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder={tab === "airlines" ? "Search by airline name, IATA code..." : "Search by airport name, city, state, IATA..."}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-white/20 bg-white/95 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 shadow-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-3 mb-4 border border-sky-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Filter className="h-4 w-4 text-sky-500" /> Filters:
            </div>

            {/* Country — always shown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-slate-500 whitespace-nowrap">Country:</label>
              <input type="text" value={country} onChange={e => { setCountry(e.target.value); setPage(1); }} placeholder="e.g. US, GR" className="border border-sky-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-sky-400 bg-sky-50 hover:bg-sky-100 transition-colors w-24" />
            </div>

            {/* Airlines-only filters */}
            {tab === "airlines" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono text-slate-500 whitespace-nowrap">ICAO:</label>
                  <input type="text" value={icaoFilter} onChange={e => { setIcaoFilter(e.target.value.toUpperCase()); setPage(1); }} placeholder="e.g. DAL" className="border border-sky-200 rounded-lg px-3 py-1.5 text-sm font-mono uppercase focus:outline-none focus:border-sky-400 bg-sky-50 hover:bg-sky-100 transition-colors w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono text-slate-500 whitespace-nowrap">CBP Code:</label>
                  <input type="text" value={cbpFilter} onChange={e => { setCbpFilter(e.target.value.toUpperCase()); setPage(1); }} placeholder="e.g. EK" className="border border-orange-200 rounded-lg px-3 py-1.5 text-sm font-mono uppercase focus:outline-none focus:border-orange-400 bg-orange-50 hover:bg-orange-100 transition-colors w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono text-slate-500 whitespace-nowrap">FIRMS Code:</label>
                  <input type="text" value={firmsFilter} onChange={e => { setFirmsFilter(e.target.value.toUpperCase()); setPage(1); }} placeholder="e.g. S0743" className="border border-purple-200 rounded-lg px-3 py-1.5 text-sm font-mono uppercase focus:outline-none focus:border-purple-400 bg-purple-50 hover:bg-purple-100 transition-colors w-28" />
                </div>
                <button
                  onClick={() => { setHasIscOnly(v => !v); setPage(1); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${hasIscOnly ? "bg-green-500 border-green-500 text-white shadow-md" : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"}`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Has ISC Data
                </button>
              </>
            )}

            {/* Airports-only filters */}
            {tab === "airports" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono text-slate-500 whitespace-nowrap">Airport:</label>
                  <input type="text" value={airportFilter} onChange={e => { setAirportFilter(e.target.value); setPage(1); }} placeholder="Name or IATA" className="border border-orange-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 bg-orange-50 hover:bg-orange-100 transition-colors w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-mono text-slate-500 whitespace-nowrap">Customs:</label>
                  <select value={customs} onChange={e => { setCustoms(e.target.value as any); setPage(1); }} className="border border-orange-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-400 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer">
                    <option value="">All</option>
                    <option value="yes">Customs Approved</option>
                    <option value="no">Not Approved</option>
                  </select>
                </div>
              </>
            )}

            {(search || country || customs || airportFilter || icaoFilter || cbpFilter || hasIscOnly || firmsFilter) && (
              <button
                onClick={() => { setSearch(""); setCountry(""); setCustoms(""); setAirportFilter(""); setIcaoFilter(""); setCbpFilter(""); setHasIscOnly(false); setFirmsFilter(""); setPage(1); setSelectedAirline(null); setSelectedOp(null); }}
                className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear All
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {(icaoFilter || cbpFilter || hasIscOnly || country || firmsFilter) && tab === "airlines" && (
            <div className="flex flex-wrap gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
              {country && (
                <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  Country: {country}
                  <button onClick={() => { setCountry(""); setPage(1); }} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}
              {icaoFilter && (
                <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  ICAO: {icaoFilter}
                  <button onClick={() => { setIcaoFilter(""); setPage(1); }} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}
              {cbpFilter && (
                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  CBP: {cbpFilter}
                  <button onClick={() => { setCbpFilter(""); setPage(1); }} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}
              {hasIscOnly && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Zap className="h-3 w-3" /> Has ISC Data
                  <button onClick={() => { setHasIscOnly(false); setPage(1); }} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}
              {firmsFilter && (
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  FIRMS: {firmsFilter}
                  <button onClick={() => { setFirmsFilter(""); setPage(1); }} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ─── AIRLINE DRILLDOWN VIEW ─── */}
        {selectedAirline && (
          <div className="bg-white rounded-2xl shadow-md border border-sky-200 overflow-hidden mb-4">
            {/* Breadcrumb header */}
            <div className="px-5 py-3 bg-sky-600 text-white flex items-center gap-3">
              <button onClick={() => { setSelectedAirline(null); setSelectedOp(null); setAirlineOps([]); }} className="flex items-center gap-1 text-sm text-sky-200 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span className="text-sky-300">›</span>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center font-bold font-mono text-xs">{selectedAirline.iataCode}</div>
                <span className="font-semibold">{selectedAirline.name}</span>
              </div>
              {selectedOp && (
                <>
                  <span className="text-sky-300">›</span>
                  <button onClick={() => setSelectedOp(null)} className="flex items-center gap-1 text-sm text-sky-100 hover:text-white transition-colors">
                    {selectedOp.airportIata} — {selectedOp.airportName}
                    <X className="h-3.5 w-3.5 ml-1" />
                  </button>
                </>
              )}
            </div>

            {selectedOp ? (
              /* ── Airport detail panel ── */
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center font-bold font-mono text-orange-700 text-sm shrink-0">{selectedOp.airportIata}</div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{selectedOp.airportName}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {[selectedOp.airportCity, selectedOp.airportState].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailCard icon={<Hash className="h-4 w-4 text-sky-600" />} label="FIRMS Code" value={selectedOp.firmsCode} color="sky" />
                  <DetailCard icon={<DollarSign className="h-4 w-4 text-green-600" />} label="ISC Amount" value={selectedOp.iscAmount ? `$${selectedOp.iscAmount}` : null} color="green" />
                  <DetailCard icon={<Building2 className="h-4 w-4 text-orange-600" />} label="ISC Payable At" value={selectedOp.iscPayableAt} color="orange" />
                  <DetailCard icon={<Plane className="h-4 w-4 text-purple-600" />} label="ISC Payable To (Ground Handler)" value={selectedOp.iscPayableTo} color="purple" />
                  <DetailCard icon={<Phone className="h-4 w-4 text-sky-600" />} label="Contact Number" value={selectedOp.contactNumber} color="sky" />
                  <DetailCard icon={<Mail className="h-4 w-4 text-red-600" />} label="Email Address" value={selectedOp.contactEmail} color="red" isEmail />
                </div>
                {selectedOp.notes && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{selectedOp.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              /* ── Airports list ── */
              <>
                <div className="px-5 py-2.5 border-b border-sky-100 bg-sky-50 flex items-center justify-between">
                  <span className="text-sm font-semibold text-sky-700">
                    {opsLoading ? "Loading airports..." : airlineOps.length > 0 ? `${airlineOps.length} airport${airlineOps.length !== 1 ? "s" : ""} — click to view ISC & contact details` : "No operational data found for this airline"}
                  </span>
                </div>
                {opsLoading ? (
                  <div className="py-12 text-center text-slate-400 text-sm animate-pulse">Fetching airport operations...</div>
                ) : airlineOps.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">No operational data available for this airline yet.</div>
                ) : (
                  <div className="divide-y divide-sky-50">
                    {airlineOps.map(op => (
                      <button key={op.id} onClick={() => setSelectedOp(op)} className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-orange-50 transition-colors group text-left">
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 font-bold font-mono text-sm shrink-0 group-hover:bg-orange-200 transition-colors">
                          {op.airportIata}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{op.airportName}</p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {op.airportCity && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{[op.airportCity, op.airportState].filter(Boolean).join(", ")}
                              </span>
                            )}
                            {op.firmsCode && <span className="text-xs font-mono bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">FIRMS: {op.firmsCode}</span>}
                            {op.iscAmount && <span className="text-xs font-mono bg-green-100 text-green-700 px-1.5 py-0.5 rounded">ISC: ${op.iscAmount}</span>}
                            {op.iscPayableTo && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded truncate max-w-[150px]">{op.iscPayableTo}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-xs text-orange-500 font-semibold group-hover:text-orange-700 transition-colors">
                          View Details <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── RESULTS (hidden while drilldown is open) ─── */}
        {!selectedAirline && (
          <div className="bg-white rounded-2xl shadow-md border border-sky-100 overflow-hidden mb-8">
            {tab === "airlines" ? (
              <>
                <div className="px-5 py-3 border-b border-sky-100 flex items-center justify-between bg-sky-50">
                  <span className="text-sm font-semibold text-sky-700">
                    {airlinesQuery.isLoading ? "Loading..." : `${filteredAirlines?.length ?? 0} Airlines`}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Click an airline to see airports & ISC details</span>
                </div>
                {airlinesQuery.isLoading ? (
                  <div className="py-16 text-center text-slate-400 text-sm animate-pulse">Searching airline registry...</div>
                ) : filteredAirlines?.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">No airlines match your search.</div>
                ) : (
                  <div className="divide-y divide-sky-50">
                    {filteredAirlines?.map(airline => (
                      <button key={airline.id} onClick={() => handleAirlineClick(airline)} className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-sky-50 transition-colors group text-left">
                        <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 font-bold font-mono text-sm shrink-0 group-hover:bg-sky-200 transition-colors">
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
                        <div className="shrink-0 flex items-center gap-1 text-xs text-sky-500 font-semibold group-hover:text-sky-700 transition-colors">
                          Airports <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-orange-100 flex items-center justify-between bg-orange-50">
                  <span className="text-sm font-semibold text-orange-700">
                    {airportsQuery.isLoading ? "Loading..." : `${filteredAirports?.length ?? 0} Airports`}
                  </span>
                  {airports && <span className="text-xs text-slate-400 font-mono">{airports.total} total approved</span>}
                </div>
                {airportsQuery.isLoading ? (
                  <div className="py-16 text-center text-slate-400 text-sm animate-pulse">Searching airport registry...</div>
                ) : filteredAirports?.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">No airports match your search.</div>
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
                              <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{[airport.city, airport.state].filter(Boolean).join(", ")}</span>
                            )}
                            {airport.customsApproved && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">✓ Customs</span>}
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
                <span className="text-xs font-mono text-slate-400">Page {page} of {Math.ceil((tab === "airlines" ? (airlines?.total ?? 0) : (airports?.total ?? 0)) / limit)}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">← Prev</button>
                  <button disabled={page * limit >= (tab === "airlines" ? (airlines?.total ?? 0) : (airports?.total ?? 0))} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailCard({ icon, label, value, color, isEmail }: { icon: React.ReactNode; label: string; value: string | null | undefined; color: string; isEmail?: boolean }) {
  const colorMap: Record<string, string> = {
    sky: "bg-sky-50 border-sky-200",
    green: "bg-green-50 border-green-200",
    orange: "bg-orange-50 border-orange-200",
    purple: "bg-purple-50 border-purple-200",
    red: "bg-red-50 border-red-200",
  };
  return (
    <div className={`p-4 rounded-xl border ${colorMap[color] ?? "bg-slate-50 border-slate-200"}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      {value ? (
        isEmail ? (
          <a href={`mailto:${value}`} className="text-sm text-sky-600 hover:underline break-all">{value}</a>
        ) : (
          <p className="text-sm font-semibold text-slate-800 break-words">{value}</p>
        )
      ) : (
        <p className="text-sm text-slate-400 italic">Not available</p>
      )}
    </div>
  );
}
