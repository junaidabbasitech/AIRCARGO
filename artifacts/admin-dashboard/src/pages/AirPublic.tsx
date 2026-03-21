import { useState, useEffect, useRef } from "react";
import { useListAirlines, useListAirports } from "@workspace/api-client-react";
import {
  Search, Plane, Building2, MapPin, Filter, ChevronRight, X,
  Phone, Mail, Hash, DollarSign, ArrowLeft, Zap, Globe, Radio,
  Shield, TrendingUp, AlertCircle
} from "lucide-react";
import { Watermark } from "@/components/Watermark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme, useT } from "@/context/ThemeContext";

interface AirlineOperation {
  id: number; airlineId: number; airportId: number;
  firmsCode: string | null; iscAmount: string | null;
  iscPayableAt: string | null; iscPayableTo: string | null;
  contactNumber: string | null; contactEmail: string | null;
  notes: string | null; airlineName: string | null;
  airlineIata: string | null; airportName: string | null;
  airportIata: string | null; airportCity: string | null;
  airportState: string | null;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function fetchOps(airlineId?: number): Promise<AirlineOperation[]> {
  const params = new URLSearchParams();
  if (airlineId) params.set("airlineId", String(airlineId));
  const res = await fetch(`${BASE}/api/airline-operations?${params}`);
  if (!res.ok) return [];
  return (await res.json()).data ?? [];
}

function Badge({ children, color }: { children: React.ReactNode; color: "accent" | "accent2" | "muted" | "green" }) {
  const style: React.CSSProperties =
    color === "accent"  ? { background: "var(--t-accent-dim)", color: "var(--t-accent)", border: "1px solid var(--t-accent-border)" } :
    color === "accent2" ? { background: "var(--t-accent2-dim)", color: "var(--t-accent2)", border: "1px solid var(--t-accent2-border)" } :
    color === "green"   ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.22)" } :
                          { background: "var(--t-card)", color: "var(--t-text-sub)", border: "1px solid var(--t-border)" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold tracking-wider" style={style}>
      {children}
    </span>
  );
}

function DetailCard({ icon, label, value, varKey, isEmail }: {
  icon: React.ReactNode; label: string; value: string | null | undefined;
  varKey: "--t-accent" | "--t-accent2" | "green" | "red"; isEmail?: boolean;
}) {
  const clr = varKey === "green" ? "#10b981" : varKey === "red" ? "#f43f5e" : `var(${varKey})`;
  const dimBg = varKey === "green" ? "rgba(16,185,129,0.08)" : varKey === "red" ? "rgba(244,63,94,0.08)" : `var(${varKey}-dim)`;
  const bdr = varKey === "green" ? "rgba(16,185,129,0.2)" : varKey === "red" ? "rgba(244,63,94,0.2)" : `var(${varKey}-border)`;
  return (
    <div className="rounded-xl p-4" style={{ background: dimBg, border: `1px solid ${bdr}` }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: clr }}>{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: clr }}>{label}</span>
      </div>
      {value ? (
        isEmail ? (
          <a href={`mailto:${value}`} className="text-sm font-medium hover:underline break-all transition-colors" style={{ color: "var(--t-accent)" }}>{value}</a>
        ) : (
          <p className="text-sm font-semibold break-words" style={{ color: "var(--t-text)" }}>{value}</p>
        )
      ) : (
        <p className="text-xs italic flex items-center gap-1" style={{ color: "var(--t-text-muted)" }}>
          <AlertCircle className="h-3 w-3" /> Not available
        </p>
      )}
    </div>
  );
}

export default function AirPublic() {
  const { isDark } = useTheme();
  const t = useT();

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
      fetch(`${BASE}/api/airline-operations?limit=500`).then(r => r.json())
        .then(json => setIscAirlineIds(new Set((json.data ?? []).map((op: AirlineOperation) => op.airlineId))))
        .catch(() => {});
    }
  }, [hasIscOnly]);

  useEffect(() => {
    const code = firmsFilter.trim();
    if (!code) { setFirmsAirlineIds(new Set()); firmsRef.current = ""; return; }
    if (firmsRef.current === code) return;
    firmsRef.current = code;
    fetch(`${BASE}/api/airline-operations?firmsCode=${encodeURIComponent(code)}`).then(r => r.json())
      .then(json => setFirmsAirlineIds(new Set((json.data ?? []).map((op: AirlineOperation) => op.airlineId))))
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
    setSelectedAirline(airline); setSelectedOp(null); setOpsLoading(true);
    setAirlineOps(await fetchOps(airline.id));
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

  /* ── Computed theme helpers ── */
  const heroBg = isDark
    ? "linear-gradient(135deg, hsl(222,60%,7%) 0%, hsl(222,55%,9%) 60%, hsl(222,50%,8%) 100%)"
    : "linear-gradient(135deg, hsl(210,25%,96%) 0%, hsl(0,0%,100%) 60%, hsl(220,20%,97%) 100%)";

  const cardStyle: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    border: `1px solid var(--t-border)`,
  };

  const rowHoverClass = isDark ? "hover:bg-white/5" : "hover:bg-black/3";

  const inputStyle: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    border: `1px solid var(--t-border)`,
    color: "var(--t-text)",
  };

  return (
    <div className="min-h-screen relative" style={{ background: isDark ? "hsl(222,60%,7%)" : "hsl(210,20%,96%)" }}>
      <Watermark />

      {/* Atmospheric glow blobs (dark only) */}
      {isDark && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-[120px]" style={{ background: "var(--t-accent-dim)" }} />
          <div className="absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full blur-[100px]" style={{ background: "var(--t-accent2-dim)" }} />
        </div>
      )}

      {/* ─── HERO ─── */}
      <div className="relative z-10 px-4 sm:px-8 pt-10 pb-16" style={{ background: heroBg }}>
        {/* Status + Theme toggle row */}
        <div className="flex items-center justify-end gap-3 mb-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Live Data</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--t-accent-dim)", border: "1px solid var(--t-accent-border)" }}>
            <Radio className="h-3 w-3" style={{ color: "var(--t-accent)" }} />
            <span className="text-[10px] font-bold tracking-widest uppercase hidden sm:inline" style={{ color: "var(--t-accent)" }}>Registry Online</span>
          </div>
          <ThemeToggle compact />
        </div>

        {/* Title */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5" style={{ background: "var(--t-accent-dim)", border: "1px solid var(--t-accent-border)" }}>
            <TrendingUp className="h-3 w-3" style={{ color: "var(--t-accent)" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--t-accent)" }}>Aviation Data Intelligence</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-widest mb-3 leading-tight normal-case" style={{ color: "var(--t-text)" }}>
            Find{" "}
            <span style={{ color: "var(--t-accent)" }}>Aviation</span>
            {" "}Data
          </h1>
          <p className="text-sm sm:text-base mb-8 leading-relaxed" style={{ color: "var(--t-text-sub)" }}>
            Search airlines and airports — click an airline to explore where it operates,
            then view ISC charges, FIRMS codes and ground handler contacts.
          </p>

          {/* Tab switcher */}
          <div className="inline-flex rounded-2xl p-1.5 gap-1 mb-7" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", border: "1px solid var(--t-border)" }}>
            <button
              onClick={() => handleTab("airlines")}
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
              style={tab === "airlines" ? {
                background: "linear-gradient(135deg, var(--t-accent), color-mix(in srgb, var(--t-accent) 70%, #1d4ed8))",
                color: "#fff",
                boxShadow: "0 4px 20px var(--t-accent-glow)"
              } : { color: "var(--t-text-sub)" }}
            >
              <Plane className="h-4 w-4" />
              Airlines
              {airlines && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md" style={{
                  background: tab === "airlines" ? "rgba(255,255,255,0.2)" : "var(--t-card)",
                  color: tab === "airlines" ? "#fff" : "var(--t-text-muted)"
                }}>{airlines.total}</span>
              )}
            </button>
            <button
              onClick={() => handleTab("airports")}
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
              style={tab === "airports" ? {
                background: "linear-gradient(135deg, var(--t-accent2), color-mix(in srgb, var(--t-accent2) 80%, #dc2626))",
                color: "#fff",
                boxShadow: "0 4px 20px var(--t-accent2-dim)"
              } : { color: "var(--t-text-sub)" }}
            >
              <Building2 className="h-4 w-4" />
              Airports
              {airports && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md" style={{
                  background: tab === "airports" ? "rgba(255,255,255,0.2)" : "var(--t-card)",
                  color: tab === "airports" ? "#fff" : "var(--t-text-muted)"
                }}>{airports.total}</span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto">
            {isDark && (
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-40" style={{ background: "var(--t-accent-dim)" }} />
            )}
            <div className="relative flex items-center rounded-2xl overflow-hidden transition-all duration-300 shadow-xl" style={{
              background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.9)",
              border: `1px solid var(--t-border)`,
              backdropFilter: "blur(12px)"
            }}>
              <Search className="ml-5 h-5 w-5 shrink-0" style={{ color: "var(--t-text-muted)" }} />
              <input
                type="text" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={tab === "airlines" ? "Search airline name, IATA or ICAO code..." : "Search airport name, city, state, IATA..."}
                className="flex-1 px-4 py-4 bg-transparent focus:outline-none text-sm"
                style={{ color: "var(--t-text)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="mr-3 p-1.5 rounded-lg transition-all" style={{ color: "var(--t-text-muted)" }}>
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setShowFilters(v => !v)}
                className="mr-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
                style={showFilters || hasActiveFilters ? {
                  background: "var(--t-accent)",
                  color: "#fff",
                  boxShadow: "0 2px 12px var(--t-accent-glow)"
                } : {
                  background: "var(--t-card)",
                  color: "var(--t-text-sub)",
                  border: "1px solid var(--t-border)"
                }}
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
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 pb-20 mt-6">

        {/* ─── FILTER PANEL ─── */}
        {showFilters && (
          <div className="mb-4 rounded-2xl p-4 shadow-xl" style={cardStyle}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--t-text-muted)" }}>
                <Filter className="h-3.5 w-3.5" style={{ color: "var(--t-accent)" }} /> Active Filters
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" style={{ color: "var(--t-accent)" }} />
                <input type="text" value={country} onChange={e => { setCountry(e.target.value); setPage(1); }} placeholder="Country (e.g. US)"
                  className="w-28 px-3 py-1.5 rounded-lg text-sm focus:outline-none font-mono" style={inputStyle} />
              </div>

              {tab === "airlines" && (
                <>
                  <input type="text" value={icaoFilter} onChange={e => { setIcaoFilter(e.target.value.toUpperCase()); setPage(1); }}
                    placeholder="ICAO" className="w-24 px-3 py-1.5 rounded-lg text-sm focus:outline-none font-mono uppercase" style={inputStyle} />
                  <input type="text" value={cbpFilter} onChange={e => { setCbpFilter(e.target.value.toUpperCase()); setPage(1); }}
                    placeholder="CBP Code" className="w-24 px-3 py-1.5 rounded-lg text-sm focus:outline-none font-mono uppercase" style={inputStyle} />
                  <input type="text" value={firmsFilter} onChange={e => { setFirmsFilter(e.target.value.toUpperCase()); setPage(1); }}
                    placeholder="FIRMS" className="w-28 px-3 py-1.5 rounded-lg text-sm focus:outline-none font-mono uppercase" style={inputStyle} />
                  <button
                    onClick={() => { setHasIscOnly(v => !v); setPage(1); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                    style={hasIscOnly ? {
                      background: "#10b981", color: "#fff", border: "1px solid #10b981"
                    } : {
                      background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.22)"
                    }}
                  >
                    <Zap className="h-3.5 w-3.5" /> Has ISC Data
                  </button>
                </>
              )}

              {tab === "airports" && (
                <>
                  <input type="text" value={airportFilter} onChange={e => { setAirportFilter(e.target.value); setPage(1); }}
                    placeholder="Airport / IATA" className="w-36 px-3 py-1.5 rounded-lg text-sm focus:outline-none" style={inputStyle} />
                  <select value={customs} onChange={e => { setCustoms(e.target.value as any); setPage(1); }}
                    className="px-3 py-1.5 rounded-lg text-sm focus:outline-none cursor-pointer" style={inputStyle}>
                    <option value="">All Airports</option>
                    <option value="yes">Customs Approved</option>
                    <option value="no">Not Approved</option>
                  </select>
                </>
              )}

              {hasActiveFilters && (
                <button onClick={clearAll} className="ml-auto flex items-center gap-1 text-xs font-semibold transition-colors text-red-400 hover:text-red-300">
                  <X className="h-3.5 w-3.5" /> Clear all
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--t-border)" }}>
                {country && <FilterChip label={`Country: ${country}`} onRemove={() => setCountry("")} />}
                {icaoFilter && <FilterChip label={`ICAO: ${icaoFilter}`} onRemove={() => setIcaoFilter("")} />}
                {cbpFilter && <FilterChip label={`CBP: ${cbpFilter}`} onRemove={() => setCbpFilter("")} />}
                {firmsFilter && <FilterChip label={`FIRMS: ${firmsFilter}`} onRemove={() => setFirmsFilter("")} />}
                {hasIscOnly && <FilterChip label="Has ISC Data" onRemove={() => setHasIscOnly(false)} />}
                {airportFilter && <FilterChip label={`Airport: ${airportFilter}`} onRemove={() => setAirportFilter("")} />}
                {customs && <FilterChip label={customs === "yes" ? "Customs Approved" : "No Customs"} onRemove={() => setCustoms("")} />}
              </div>
            )}
          </div>
        )}

        {/* ─── AIRLINE DRILLDOWN ─── */}
        {selectedAirline && (
          <div className="rounded-2xl overflow-hidden mb-4 shadow-xl" style={cardStyle}>
            {/* Breadcrumb header */}
            <div className="px-5 py-4 flex items-center gap-3 flex-wrap" style={{
              background: isDark ? "linear-gradient(90deg, var(--t-accent-dim), transparent)" : "var(--t-accent-dim)",
              borderBottom: "1px solid var(--t-accent-border)"
            }}>
              <button onClick={() => { setSelectedAirline(null); setSelectedOp(null); setAirlineOps([]); }}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: "var(--t-accent)" }}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span style={{ color: "var(--t-text-muted)" }}>›</span>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center font-black font-mono text-xs" style={{
                  background: "var(--t-accent-dim)", border: "1px solid var(--t-accent-border)", color: "var(--t-accent)"
                }}>
                  {selectedAirline.iataCode || "—"}
                </div>
                <span className="font-bold text-sm" style={{ color: "var(--t-text)" }}>{selectedAirline.name}</span>
              </div>
              {selectedOp && (
                <>
                  <span style={{ color: "var(--t-text-muted)" }}>›</span>
                  <button onClick={() => setSelectedOp(null)} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--t-text-sub)" }}>
                    <Building2 className="h-3.5 w-3.5" />
                    {selectedOp.airportIata} — {selectedOp.airportName}
                    <X className="h-3.5 w-3.5 ml-1 opacity-50" />
                  </button>
                </>
              )}
            </div>

            {selectedOp ? (
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center font-black font-mono text-sm shrink-0" style={{
                    background: "var(--t-accent2-dim)", border: "1px solid var(--t-accent2-border)", color: "var(--t-accent2)"
                  }}>
                    {selectedOp.airportIata}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black tracking-wide" style={{ color: "var(--t-text)" }}>{selectedOp.airportName}</h2>
                    {(selectedOp.airportCity || selectedOp.airportState) && (
                      <p className="text-sm flex items-center gap-1.5 mt-0.5" style={{ color: "var(--t-text-sub)" }}>
                        <MapPin className="h-3.5 w-3.5" style={{ color: "var(--t-accent2)" }} />
                        {[selectedOp.airportCity, selectedOp.airportState].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {selectedOp.firmsCode && <Badge color="accent">FIRMS: {selectedOp.firmsCode}</Badge>}
                      {selectedOp.iscAmount && <Badge color="green">ISC: ${selectedOp.iscAmount}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailCard icon={<Hash className="h-4 w-4" />} label="FIRMS Code" value={selectedOp.firmsCode} varKey="--t-accent" />
                  <DetailCard icon={<DollarSign className="h-4 w-4" />} label="ISC Amount" value={selectedOp.iscAmount ? `$${selectedOp.iscAmount}` : null} varKey="green" />
                  <DetailCard icon={<Building2 className="h-4 w-4" />} label="ISC Payable At" value={selectedOp.iscPayableAt} varKey="--t-accent2" />
                  <DetailCard icon={<Plane className="h-4 w-4" />} label="Ground Handler" value={selectedOp.iscPayableTo} varKey="--t-accent2" />
                  <DetailCard icon={<Phone className="h-4 w-4" />} label="Contact Number" value={selectedOp.contactNumber} varKey="--t-accent" />
                  <DetailCard icon={<Mail className="h-4 w-4" />} label="Email Address" value={selectedOp.contactEmail} varKey="red" isEmail />
                </div>

                {selectedOp.notes && (
                  <div className="mt-4 p-4 rounded-xl" style={{ background: "var(--t-card)", border: "1px solid var(--t-border)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Notes</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--t-text-sub)" }}>{selectedOp.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--t-border)", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                  <span className="text-sm font-semibold" style={{ color: "var(--t-accent)" }}>
                    {opsLoading ? "Loading airports..." : airlineOps.length > 0
                      ? `${airlineOps.length} airport${airlineOps.length !== 1 ? "s" : ""} — click to view ISC & contact details`
                      : "No operational data found for this airline"}
                  </span>
                </div>
                {opsLoading ? (
                  <div className="py-14 text-center">
                    <div className="inline-flex items-center gap-3 text-sm" style={{ color: "var(--t-text-muted)" }}>
                      <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
                      Fetching airport operations...
                    </div>
                  </div>
                ) : airlineOps.length === 0 ? (
                  <div className="py-14 text-center text-sm" style={{ color: "var(--t-text-muted)" }}>No operational data available for this airline yet.</div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--t-border-soft)" }}>
                    {airlineOps.map(op => (
                      <button key={op.id} onClick={() => setSelectedOp(op)}
                        className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-150 group text-left ${rowHoverClass}`}>
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center font-black font-mono text-xs shrink-0 transition-all" style={{
                          background: "var(--t-accent2-dim)", border: "1px solid var(--t-accent2-border)", color: "var(--t-accent2)"
                        }}>
                          {op.airportIata}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate transition-colors" style={{ color: "var(--t-text)" }}>{op.airportName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {op.airportCity && <span className="text-xs flex items-center gap-1" style={{ color: "var(--t-text-muted)" }}><MapPin className="h-3 w-3" />{[op.airportCity, op.airportState].filter(Boolean).join(", ")}</span>}
                            {op.firmsCode && <Badge color="accent">FIRMS: {op.firmsCode}</Badge>}
                            {op.iscAmount && <Badge color="green">ISC: ${op.iscAmount}</Badge>}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: "var(--t-text-muted)" }}>
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
          <div className="rounded-2xl overflow-hidden shadow-xl" style={cardStyle}>
            {/* Result count header */}
            <div className="px-5 py-3.5 flex items-center justify-between" style={{
              borderBottom: "1px solid var(--t-border)",
              background: tab === "airlines" ? "var(--t-accent-dim)" : "var(--t-accent2-dim)"
            }}>
              <div className="flex items-center gap-2.5">
                {tab === "airlines"
                  ? <Plane className="h-4 w-4" style={{ color: "var(--t-accent)" }} />
                  : <Building2 className="h-4 w-4" style={{ color: "var(--t-accent2)" }} />
                }
                <span className="text-sm font-bold" style={{ color: tab === "airlines" ? "var(--t-accent)" : "var(--t-accent2)" }}>
                  {(tab === "airlines" ? airlinesQuery.isLoading : airportsQuery.isLoading) ? "Loading..." : `${totalShown} ${tab === "airlines" ? "Airlines" : "Airports"}`}
                </span>
                {grandTotal > 0 && <span className="text-xs font-mono" style={{ color: "var(--t-text-muted)" }}>of {grandTotal} total</span>}
              </div>
              {tab === "airlines" && (
                <span className="text-xs font-mono hidden sm:block" style={{ color: "var(--t-text-muted)" }}>Click an airline to explore airports & ISC data</span>
              )}
            </div>

            {/* Loading */}
            {(tab === "airlines" ? airlinesQuery.isLoading : airportsQuery.isLoading) && (
              <div className="py-20 text-center">
                <div className="inline-flex items-center gap-3 text-sm" style={{ color: "var(--t-text-muted)" }}>
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
                  Searching registry...
                </div>
              </div>
            )}

            {/* Empty */}
            {!((tab === "airlines" ? airlinesQuery.isLoading : airportsQuery.isLoading)) && totalShown === 0 && (
              <div className="py-20 text-center">
                <Search className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--t-border)" }} />
                <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>No results match your search.</p>
                {hasActiveFilters && <button onClick={clearAll} className="mt-3 text-xs underline transition-colors" style={{ color: "var(--t-accent)" }}>Clear all filters</button>}
              </div>
            )}

            {/* Airlines */}
            {tab === "airlines" && !airlinesQuery.isLoading && (filteredAirlines?.length ?? 0) > 0 && (
              <div>
                {filteredAirlines?.map((airline, i) => (
                  <button key={airline.id} onClick={() => handleAirlineClick(airline)}
                    className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-150 group text-left ${rowHoverClass}`}
                    style={{ borderBottom: i < (filteredAirlines.length - 1) ? `1px solid var(--t-border-soft)` : "none" }}>
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center font-black font-mono text-xs shrink-0 transition-all" style={{
                      background: "var(--t-accent-dim)", border: "1px solid var(--t-accent-border)", color: "var(--t-accent)"
                    }}>
                      {airline.iataCode || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--t-text)" }}>{airline.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {airline.iataCode && <Badge color="accent">IATA {airline.iataCode}</Badge>}
                        {airline.icaoCode && <Badge color="muted">ICAO {airline.icaoCode}</Badge>}
                        {airline.cbpCode && <Badge color="accent2">CBP {airline.cbpCode}</Badge>}
                        {airline.country && <span className="text-[10px] font-mono" style={{ color: "var(--t-text-muted)" }}>{airline.country}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: "var(--t-text-muted)" }}>
                      Airports <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Airports */}
            {tab === "airports" && !airportsQuery.isLoading && (filteredAirports?.length ?? 0) > 0 && (
              <div>
                {filteredAirports?.map((airport, i) => (
                  <div key={airport.id} className={`flex items-center gap-4 px-5 py-4 transition-all duration-150 group cursor-default ${rowHoverClass}`}
                    style={{ borderBottom: i < (filteredAirports.length - 1) ? `1px solid var(--t-border-soft)` : "none" }}>
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center font-black font-mono text-xs shrink-0" style={{
                      background: "var(--t-accent2-dim)", border: "1px solid var(--t-accent2-border)", color: "var(--t-accent2)"
                    }}>
                      {airport.iataCode || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--t-text)" }}>{airport.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {airport.iataCode && <Badge color="accent">IATA {airport.iataCode}</Badge>}
                        {airport.cbpPortCode && <Badge color="accent2">CBP {airport.cbpPortCode}</Badge>}
                        {(airport.city || airport.state) && <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--t-text-muted)" }}><MapPin className="h-3 w-3" />{[airport.city, airport.state].filter(Boolean).join(", ")}</span>}
                        {airport.customsApproved && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500"><Shield className="h-3 w-3" />Customs</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 transition-colors" style={{ color: "var(--t-border)" }} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3" style={{
                borderTop: "1px solid var(--t-border)",
                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"
              }}>
                <span className="text-xs font-mono" style={{ color: "var(--t-text-muted)" }}>
                  Page {page} of {totalPages} · {grandTotal} total
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--t-text-muted)" }}>
                    Show
                    <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                      className="h-7 px-2 rounded-lg text-xs font-mono focus:outline-none" style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
                      {[20, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {[{ label: "← Prev", disabled: page === 1, fn: () => setPage(p => p - 1) }, { label: "Next →", disabled: page >= totalPages, fn: () => setPage(p => p + 1) }].map(btn => (
                    <button key={btn.label} disabled={btn.disabled} onClick={btn.fn}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{
      background: "var(--t-accent-dim)", color: "var(--t-accent)", border: "1px solid var(--t-accent-border)"
    }}>
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity"><X className="h-2.5 w-2.5" /></button>
    </span>
  );
}
