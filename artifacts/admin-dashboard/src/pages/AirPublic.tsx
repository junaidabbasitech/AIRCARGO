import { useState, useEffect, useRef } from "react";
import { useListAirlines, useListAirports } from "@workspace/api-client-react";
import {
  Search, Plane, Building2, MapPin, Filter, ChevronRight, X,
  Phone, Mail, Hash, DollarSign, ArrowLeft, Zap, Globe, Radio,
  Shield, TrendingUp, AlertCircle
} from "lucide-react";
import { Watermark } from "@/components/Watermark";

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

function Badge({ children, color }: { children: React.ReactNode; color: "blue" | "orange" | "purple" | "green" | "slate" }) {
  const cls = {
    blue: "bg-sky-500/15 text-sky-300 border border-sky-500/25",
    orange: "bg-orange-500/15 text-orange-300 border border-orange-500/25",
    purple: "bg-purple-500/15 text-purple-300 border border-purple-500/25",
    green: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
    slate: "bg-white/8 text-slate-300 border border-white/10",
  }[color];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold tracking-wider ${cls}`}>
      {children}
    </span>
  );
}

function DetailCard({
  icon, label, value, color, isEmail
}: {
  icon: React.ReactNode; label: string; value: string | null | undefined; color: "sky" | "green" | "orange" | "purple" | "red"; isEmail?: boolean;
}) {
  const bg = {
    sky: "from-sky-500/10 border-sky-500/20",
    green: "from-emerald-500/10 border-emerald-500/20",
    orange: "from-orange-500/10 border-orange-500/20",
    purple: "from-purple-500/10 border-purple-500/20",
    red: "from-red-500/10 border-red-500/20",
  }[color];
  const labelClr = {
    sky: "text-sky-400", green: "text-emerald-400", orange: "text-orange-400",
    purple: "text-purple-400", red: "text-red-400",
  }[color];

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${bg} to-transparent p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={labelClr}>{icon}</span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${labelClr}`}>{label}</span>
      </div>
      {value ? (
        isEmail ? (
          <a href={`mailto:${value}`} className="text-sm text-sky-300 hover:text-sky-100 hover:underline break-all font-medium transition-colors">
            {value}
          </a>
        ) : (
          <p className="text-sm font-semibold text-white break-words">{value}</p>
        )
      ) : (
        <p className="text-xs text-slate-500 italic flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Not available
        </p>
      )}
    </div>
  );
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
  const [limit, setLimit] = useState(25);
  const [showFilters, setShowFilters] = useState(false);

  const [iscAirlineIds, setIscAirlineIds] = useState<Set<number>>(new Set());
  const iscFetched = useRef(false);
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

  const handleTab = (t: "airlines" | "airports") => {
    setTab(t); setSearch(""); setPage(1); setCountry(""); setCustoms(""); setAirportFilter("");
    setIcaoFilter(""); setCbpFilter(""); setHasIscOnly(false); setFirmsFilter("");
    setSelectedAirline(null); setSelectedOp(null); setAirlineOps([]);
  };

  const clearAll = () => {
    setSearch(""); setCountry(""); setCustoms(""); setAirportFilter("");
    setIcaoFilter(""); setCbpFilter(""); setHasIscOnly(false); setFirmsFilter(""); setPage(1);
    setSelectedAirline(null); setSelectedOp(null);
  };

  const hasActiveFilters = !!(search || country || icaoFilter || cbpFilter || hasIscOnly || firmsFilter || airportFilter || customs);
  const totalShown = tab === "airlines" ? (filteredAirlines?.length ?? 0) : (filteredAirports?.length ?? 0);
  const grandTotal = tab === "airlines" ? (airlines?.total ?? 0) : (airports?.total ?? 0);
  const totalPages = Math.ceil(grandTotal / limit);

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 min-h-screen bg-gradient-to-br from-slate-950 via-[hsl(222,55%,9%)] to-slate-900 relative">
      <Watermark />

      {/* Atmospheric glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-sky-500/6 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full bg-orange-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-sky-600/4 blur-[80px]" />
      </div>

      {/* ─── HERO ─── */}
      <div className="relative z-10 px-4 sm:px-8 pt-10 pb-16">
        {/* Status badges */}
        <div className="flex items-center justify-end gap-3 mb-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Live Data</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20">
            <Radio className="h-3 w-3 text-sky-400" />
            <span className="text-[10px] font-bold text-sky-400 tracking-widest uppercase hidden sm:inline">Registry Online</span>
          </div>
        </div>

        {/* Title */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 mb-5">
            <TrendingUp className="h-3 w-3 text-sky-400" />
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Aviation Data Intelligence</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-widest text-white mb-3 leading-tight normal-case">
            Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">Aviation</span>
            {" "}Data
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mb-8 leading-relaxed">
            Search airlines and airports — click an airline to explore where it operates,
            then view ISC charges, FIRMS codes and ground handler contacts.
          </p>

          {/* Tab switcher */}
          <div className="inline-flex bg-white/5 backdrop-blur-sm rounded-2xl p-1.5 gap-1 border border-white/8 mb-7">
            <button
              onClick={() => handleTab("airlines")}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                tab === "airlines"
                  ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30 scale-[1.02]"
                  : "text-slate-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <Plane className="h-4 w-4" />
              <span>Airlines</span>
              {airlines && <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${tab === "airlines" ? "bg-white/20" : "bg-white/8 text-slate-500"}`}>{airlines.total}</span>}
            </button>
            <button
              onClick={() => handleTab("airports")}
              className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                tab === "airports"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 scale-[1.02]"
                  : "text-slate-400 hover:text-white hover:bg-white/8"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Airports</span>
              {airports && <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${tab === "airports" ? "bg-white/20" : "bg-white/8 text-slate-500"}`}>{airports.total}</span>}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 rounded-2xl bg-sky-500/20 blur-xl opacity-60" />
            <div className="relative flex items-center bg-white/8 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden focus-within:border-sky-500/60 focus-within:bg-white/10 transition-all duration-300 shadow-xl">
              <Search className="ml-5 h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={tab === "airlines" ? "Search airline name, IATA or ICAO code..." : "Search airport name, city, state, IATA..."}
                className="flex-1 px-4 py-4 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="mr-3 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`mr-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  showFilters || hasActiveFilters
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                    : "bg-white/8 text-slate-400 hover:bg-white/15 hover:text-white border border-white/10"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && <span className="h-4 w-4 rounded-full bg-white/30 text-[9px] flex items-center justify-center font-black">!</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 pb-20">

        {/* ─── FILTER PANEL ─── */}
        {showFilters && (
          <div className="mb-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Filter className="h-3.5 w-3.5 text-sky-400" /> Active Filters
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-sky-400" />
                <input
                  type="text" value={country}
                  onChange={e => { setCountry(e.target.value); setPage(1); }}
                  placeholder="Country (e.g. US)"
                  className="w-28 px-3 py-1.5 bg-white/8 border border-white/12 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 font-mono"
                />
              </div>

              {tab === "airlines" && (
                <>
                  <input type="text" value={icaoFilter} onChange={e => { setIcaoFilter(e.target.value.toUpperCase()); setPage(1); }}
                    placeholder="ICAO" className="w-24 px-3 py-1.5 bg-white/8 border border-white/12 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 font-mono uppercase" />
                  <input type="text" value={cbpFilter} onChange={e => { setCbpFilter(e.target.value.toUpperCase()); setPage(1); }}
                    placeholder="CBP Code" className="w-24 px-3 py-1.5 bg-white/8 border border-orange-500/20 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/60 font-mono uppercase" />
                  <input type="text" value={firmsFilter} onChange={e => { setFirmsFilter(e.target.value.toUpperCase()); setPage(1); }}
                    placeholder="FIRMS" className="w-28 px-3 py-1.5 bg-white/8 border border-purple-500/20 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 font-mono uppercase" />
                  <button
                    onClick={() => { setHasIscOnly(v => !v); setPage(1); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                      hasIscOnly
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30"
                        : "bg-white/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" /> Has ISC Data
                  </button>
                </>
              )}

              {tab === "airports" && (
                <>
                  <input type="text" value={airportFilter} onChange={e => { setAirportFilter(e.target.value); setPage(1); }}
                    placeholder="Airport / IATA" className="w-36 px-3 py-1.5 bg-white/8 border border-white/12 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60" />
                  <select value={customs} onChange={e => { setCustoms(e.target.value as any); setPage(1); }}
                    className="px-3 py-1.5 bg-white/8 border border-white/12 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-sky-500/60 cursor-pointer">
                    <option value="">All Airports</option>
                    <option value="yes">Customs Approved</option>
                    <option value="no">Not Approved</option>
                  </select>
                </>
              )}

              {hasActiveFilters && (
                <button onClick={clearAll} className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">
                  <X className="h-3.5 w-3.5" /> Clear all
                </button>
              )}
            </div>

            {/* Active chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/8">
                {country && <Chip label={`Country: ${country}`} onRemove={() => setCountry("")} color="blue" />}
                {icaoFilter && <Chip label={`ICAO: ${icaoFilter}`} onRemove={() => setIcaoFilter("")} color="blue" />}
                {cbpFilter && <Chip label={`CBP: ${cbpFilter}`} onRemove={() => setCbpFilter("")} color="orange" />}
                {firmsFilter && <Chip label={`FIRMS: ${firmsFilter}`} onRemove={() => setFirmsFilter("")} color="purple" />}
                {hasIscOnly && <Chip label="Has ISC Data" onRemove={() => setHasIscOnly(false)} color="green" />}
                {airportFilter && <Chip label={`Airport: ${airportFilter}`} onRemove={() => setAirportFilter("")} color="blue" />}
                {customs && <Chip label={customs === "yes" ? "Customs Approved" : "No Customs"} onRemove={() => setCustoms("")} color="orange" />}
              </div>
            )}
          </div>
        )}

        {/* ─── AIRLINE DRILLDOWN ─── */}
        {selectedAirline && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden mb-4 shadow-xl">
            {/* Breadcrumb header */}
            <div className="px-5 py-4 bg-gradient-to-r from-sky-600/30 to-blue-600/20 border-b border-sky-500/20 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => { setSelectedAirline(null); setSelectedOp(null); setAirlineOps([]); }}
                className="flex items-center gap-1.5 text-sm text-sky-300 hover:text-white transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span className="text-sky-500/60">›</span>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center font-black font-mono text-xs text-sky-300">
                  {selectedAirline.iataCode || "—"}
                </div>
                <span className="font-bold text-white text-sm">{selectedAirline.name}</span>
              </div>
              {selectedOp && (
                <>
                  <span className="text-sky-500/60">›</span>
                  <button onClick={() => setSelectedOp(null)} className="flex items-center gap-1.5 text-sm text-sky-200 hover:text-white transition-colors">
                    <Building2 className="h-3.5 w-3.5" />
                    {selectedOp.airportIata} — {selectedOp.airportName}
                    <X className="h-3.5 w-3.5 ml-1 opacity-60" />
                  </button>
                </>
              )}
            </div>

            {selectedOp ? (
              /* ── Airport detail panel ── */
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/25 flex items-center justify-center font-black font-mono text-orange-300 text-sm shrink-0 shadow-lg">
                    {selectedOp.airportIata}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black text-white tracking-wide">{selectedOp.airportName}</h2>
                    {(selectedOp.airportCity || selectedOp.airportState) && (
                      <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-orange-400" />
                        {[selectedOp.airportCity, selectedOp.airportState].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {selectedOp.firmsCode && <Badge color="blue">FIRMS: {selectedOp.firmsCode}</Badge>}
                      {selectedOp.iscAmount && <Badge color="green">ISC: ${selectedOp.iscAmount}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailCard icon={<Hash className="h-4 w-4" />} label="FIRMS Code" value={selectedOp.firmsCode} color="sky" />
                  <DetailCard icon={<DollarSign className="h-4 w-4" />} label="ISC Amount" value={selectedOp.iscAmount ? `$${selectedOp.iscAmount}` : null} color="green" />
                  <DetailCard icon={<Building2 className="h-4 w-4" />} label="ISC Payable At" value={selectedOp.iscPayableAt} color="orange" />
                  <DetailCard icon={<Plane className="h-4 w-4" />} label="Ground Handler" value={selectedOp.iscPayableTo} color="purple" />
                  <DetailCard icon={<Phone className="h-4 w-4" />} label="Contact Number" value={selectedOp.contactNumber} color="sky" />
                  <DetailCard icon={<Mail className="h-4 w-4" />} label="Email Address" value={selectedOp.contactEmail} color="red" isEmail />
                </div>

                {selectedOp.notes && (
                  <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Notes</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{selectedOp.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              /* ── Airports list for the selected airline ── */
              <>
                <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between bg-white/3">
                  <span className="text-sm font-semibold text-sky-300">
                    {opsLoading
                      ? "Loading airport operations..."
                      : airlineOps.length > 0
                        ? `${airlineOps.length} airport${airlineOps.length !== 1 ? "s" : ""} — click to view ISC & contact details`
                        : "No operational data found for this airline"
                    }
                  </span>
                </div>
                {opsLoading ? (
                  <div className="py-14 text-center">
                    <div className="inline-flex items-center gap-3 text-slate-400 text-sm">
                      <div className="h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                      Fetching airport operations...
                    </div>
                  </div>
                ) : airlineOps.length === 0 ? (
                  <div className="py-14 text-center text-slate-500 text-sm">No operational data available for this airline yet.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {airlineOps.map(op => (
                      <button
                        key={op.id}
                        onClick={() => setSelectedOp(op)}
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all duration-150 group text-left"
                      >
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-500/15 to-amber-500/8 border border-orange-500/20 flex items-center justify-center text-orange-300 font-black font-mono text-xs shrink-0 group-hover:border-orange-500/40 group-hover:from-orange-500/20 transition-all">
                          {op.airportIata}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate group-hover:text-sky-200 transition-colors">{op.airportName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {op.airportCity && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-600" />
                                {[op.airportCity, op.airportState].filter(Boolean).join(", ")}
                              </span>
                            )}
                            {op.firmsCode && <Badge color="blue">FIRMS: {op.firmsCode}</Badge>}
                            {op.iscAmount && <Badge color="green">ISC: ${op.iscAmount}</Badge>}
                            {op.iscPayableTo && (
                              <span className="text-[10px] text-slate-500 truncate max-w-[130px]">{op.iscPayableTo}</span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-xs text-slate-500 font-semibold group-hover:text-orange-400 transition-colors">
                          View <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── RESULTS LIST ─── */}
        {!selectedAirline && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {/* Result count header */}
            <div className={`px-5 py-3.5 border-b flex items-center justify-between ${tab === "airlines" ? "border-sky-500/15 bg-sky-500/5" : "border-orange-500/15 bg-orange-500/5"}`}>
              <div className="flex items-center gap-2.5">
                {tab === "airlines"
                  ? <Plane className="h-4 w-4 text-sky-400" />
                  : <Building2 className="h-4 w-4 text-orange-400" />
                }
                <span className={`text-sm font-bold ${tab === "airlines" ? "text-sky-300" : "text-orange-300"}`}>
                  {(tab === "airlines" ? airlinesQuery.isLoading : airportsQuery.isLoading)
                    ? "Loading..."
                    : `${totalShown} ${tab === "airlines" ? "Airlines" : "Airports"}`
                  }
                </span>
                {grandTotal > 0 && <span className="text-xs text-slate-600 font-mono">of {grandTotal} total</span>}
              </div>
              {tab === "airlines" && (
                <span className="text-xs text-slate-600 font-mono hidden sm:block">Click an airline to explore airports & ISC data</span>
              )}
            </div>

            {/* Loading */}
            {(tab === "airlines" ? airlinesQuery.isLoading : airportsQuery.isLoading) && (
              <div className="py-20 text-center">
                <div className="inline-flex items-center gap-3 text-slate-500 text-sm">
                  <div className="h-4 w-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                  Searching registry...
                </div>
              </div>
            )}

            {/* Empty */}
            {!((tab === "airlines" ? airlinesQuery.isLoading : airportsQuery.isLoading)) && totalShown === 0 && (
              <div className="py-20 text-center">
                <Search className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No results match your search.</p>
                {hasActiveFilters && (
                  <button onClick={clearAll} className="mt-3 text-xs text-sky-400 hover:text-sky-300 underline transition-colors">Clear all filters</button>
                )}
              </div>
            )}

            {/* Airlines list */}
            {tab === "airlines" && !airlinesQuery.isLoading && (filteredAirlines?.length ?? 0) > 0 && (
              <div className="divide-y divide-white/5">
                {filteredAirlines?.map(airline => (
                  <button
                    key={airline.id}
                    onClick={() => handleAirlineClick(airline)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all duration-150 group text-left"
                  >
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-sky-500/15 to-blue-500/8 border border-sky-500/20 flex items-center justify-center text-sky-300 font-black font-mono text-xs shrink-0 group-hover:border-sky-500/40 group-hover:from-sky-500/22 transition-all">
                      {airline.iataCode || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm group-hover:text-sky-200 transition-colors truncate">{airline.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {airline.iataCode && <Badge color="blue">IATA {airline.iataCode}</Badge>}
                        {airline.icaoCode && <Badge color="slate">ICAO {airline.icaoCode}</Badge>}
                        {airline.cbpCode && <Badge color="orange">CBP {airline.cbpCode}</Badge>}
                        {airline.country && <span className="text-[10px] text-slate-600 font-mono">{airline.country}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-slate-600 group-hover:text-sky-400 transition-colors">
                      Airports <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Airports list */}
            {tab === "airports" && !airportsQuery.isLoading && (filteredAirports?.length ?? 0) > 0 && (
              <div className="divide-y divide-white/5">
                {filteredAirports?.map(airport => (
                  <div
                    key={airport.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all duration-150 group cursor-default"
                  >
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-500/15 to-amber-500/8 border border-orange-500/20 flex items-center justify-center text-orange-300 font-black font-mono text-xs shrink-0 group-hover:border-orange-500/35 transition-all">
                      {airport.iataCode || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate group-hover:text-orange-200 transition-colors">{airport.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {airport.iataCode && <Badge color="blue">IATA {airport.iataCode}</Badge>}
                        {airport.cbpPortCode && <Badge color="orange">CBP {airport.cbpPortCode}</Badge>}
                        {(airport.city || airport.state) && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[airport.city, airport.state].filter(Boolean).join(", ")}
                          </span>
                        )}
                        {airport.customsApproved && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                            <Shield className="h-3 w-3" /> Customs
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-orange-400 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3.5 border-t border-white/8 flex flex-wrap items-center justify-between gap-3 bg-white/3">
                <span className="text-xs text-slate-500 font-mono">
                  Page {page} of {totalPages} · {grandTotal} total
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    Show
                    <select
                      value={limit}
                      onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                      className="h-7 px-2 rounded-lg bg-white/8 border border-white/12 text-slate-300 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                    >
                      {[20, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, onRemove, color }: { label: string; onRemove: () => void; color: "blue" | "orange" | "purple" | "green" }) {
  const cls = {
    blue: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    orange: "bg-orange-500/15 text-orange-300 border-orange-500/25",
    purple: "bg-purple-500/15 text-purple-300 border-purple-500/25",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  }[color];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity"><X className="h-2.5 w-2.5" /></button>
    </span>
  );
}
