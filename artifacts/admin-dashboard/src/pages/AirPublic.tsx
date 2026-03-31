import { useState, useEffect, useRef } from "react";
import { useListAirlines, useListAirports } from "@workspace/api-client-react";
import {
  Search, Plane, Building2, MapPin, Filter, ChevronRight, X,
  Phone, Mail, Hash, DollarSign, ArrowLeft, Zap, Globe, Radio,
  Shield, TrendingUp, AlertCircle, ScanBarcode, Package, Loader2,
  MessageSquarePlus, Send, CheckCircle2
} from "lucide-react";
import { AviationBg } from "@/components/AviationBg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";

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

async function fetchOps(params: { airlineId?: number; airportId?: number } = {}): Promise<AirlineOperation[]> {
  const p = new URLSearchParams();
  if (params.airlineId) p.set("airlineId", String(params.airlineId));
  if (params.airportId) p.set("airportId", String(params.airportId));
  const res = await fetch(`${BASE}/api/airline-operations?${p}`);
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

/* ─── Ops detail panel (shared by both airline→airport and airport→airline flows) ─── */
function OpsDetail({ op }: { op: AirlineOperation }) {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailCard icon={<Hash className="h-4 w-4" />} label="FIRMS Code" value={op.firmsCode} varKey="--t-accent" />
        <DetailCard icon={<DollarSign className="h-4 w-4" />} label="ISC Amount" value={op.iscAmount ? `$${op.iscAmount}` : null} varKey="green" />
        <DetailCard icon={<Building2 className="h-4 w-4" />} label="ISC Payable At" value={op.iscPayableAt} varKey="--t-accent2" />
        <DetailCard icon={<Plane className="h-4 w-4" />} label="Ground Handler" value={op.iscPayableTo} varKey="--t-accent2" />
        <DetailCard icon={<Phone className="h-4 w-4" />} label="Contact Number" value={op.contactNumber} varKey="--t-accent" />
        <DetailCard icon={<Mail className="h-4 w-4" />} label="Email Address" value={op.contactEmail} varKey="red" isEmail />
      </div>
      {op.notes && (
        <div className="mt-4 p-4 rounded-xl" style={{ background: "var(--t-card)", border: "1px solid var(--t-border)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Notes</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--t-text-sub)" }}>{op.notes}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Spinner ─── */
function Spinner() {
  return (
    <div className="py-14 text-center">
      <div className="inline-flex items-center gap-3 text-sm" style={{ color: "var(--t-text-muted)" }}>
        <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
        Loading...
      </div>
    </div>
  );
}

const REQUEST_TYPES = [
  { value: "new_airline", label: "New Airline" },
  { value: "new_ground_handler", label: "New Ground Handler" },
  { value: "firms_code", label: "FIRMS Code" },
  { value: "isc_charges", label: "ISC Charges" },
  { value: "payable_to", label: "Payable To (Ground Handler)" },
  { value: "payable_by", label: "Payable By" },
  { value: "contact_info", label: "Contact Info" },
  { value: "other", label: "Other" },
];

const emptyReqForm = { type: "firms_code", subject: "", details: "", airlineName: "", airlineIata: "", airportIata: "", firmsCode: "", contactName: "", contactEmail: "" };

function RequestModal({ isOpen, onClose, isDark }: { isOpen: boolean; onClose: () => void; isDark: boolean }) {
  const [form, setForm] = useState(emptyReqForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputStyle: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
    border: "1px solid var(--t-border)",
    color: "var(--t-text)",
  };

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.details.trim()) { setError("Subject and details are required"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${BASE}/api/requests`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type, subject: form.subject.trim(), details: form.details.trim(),
          airlineName: form.airlineName || null, airlineIata: form.airlineIata || null,
          airportIata: form.airportIata || null, firmsCode: form.firmsCode || null,
          contactName: form.contactName || null, contactEmail: form.contactEmail || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Submission failed"); }
      else { setSuccess(true); setForm(emptyReqForm); }
    } catch { setError("Network error — please try again."); }
    setSubmitting(false);
  };

  const handleClose = () => { setSuccess(false); setError(""); setForm(emptyReqForm); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: isDark ? "hsl(222,55%,10%)" : "#fff", border: "1px solid var(--t-border)" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--t-border)" }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
              <MessageSquarePlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-base" style={{ color: "var(--t-text)" }}>Submit Data Request</h2>
              <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>Request new airlines, FIRMS codes, ISC charges, or contact info</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl transition-all hover:opacity-70" style={{ color: "var(--t-text-muted)" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-black" style={{ color: "var(--t-text)" }}>Request Submitted!</h3>
            <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>
              Thank you. Our team will review your request and update the registry accordingly.
            </p>
            <button onClick={handleClose}
              className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
              Close
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Type */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Request Type</label>
              <select value={form.type} onChange={f("type")} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {/* Subject */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Subject <span className="text-red-400">*</span></label>
              <input type="text" value={form.subject} onChange={f("subject")} placeholder="Brief description of what you need..."
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            </div>
            {/* Details */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Details <span className="text-red-400">*</span></label>
              <textarea value={form.details} onChange={f("details")} rows={3} placeholder="Provide as much detail as possible..."
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none" style={inputStyle} />
            </div>
            {/* Airline + airport */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Airline IATA</label>
                <input type="text" value={form.airlineIata} onChange={f("airlineIata")} placeholder="e.g. EK" maxLength={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-mono uppercase focus:outline-none" style={inputStyle} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Airport IATA</label>
                <input type="text" value={form.airportIata} onChange={f("airportIata")} placeholder="e.g. JFK" maxLength={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-mono uppercase focus:outline-none" style={inputStyle} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>FIRMS Code</label>
                <input type="text" value={form.firmsCode} onChange={f("firmsCode")} placeholder="e.g. ABCD" maxLength={6}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-mono uppercase focus:outline-none" style={inputStyle} />
              </div>
            </div>
            {/* Airline name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Airline Name (optional)</label>
              <input type="text" value={form.airlineName} onChange={f("airlineName")} placeholder="e.g. Emirates"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            </div>
            {/* Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Your Name (optional)</label>
                <input type="text" value={form.contactName} onChange={f("contactName")} placeholder="Full name"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Your Email (optional)</label>
                <input type="email" value={form.contactEmail} onChange={f("contactEmail")} placeholder="For follow-up"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400 font-semibold">{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #059669, #047857)", color: "#fff", boxShadow: "0 4px 20px rgba(5,150,105,0.3)" }}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AirPublic() {
  const { isDark } = useTheme();
  const [requestOpen, setRequestOpen] = useState(false);

  const [tab, setTab] = useState<"airlines" | "airports" | "awb" | "firms">("awb");
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

  /* ── AWB Search ── */
  const [awbInput, setAwbInput] = useState("");
  const [awbAirport, setAwbAirport] = useState("");
  const [awbResult, setAwbResult] = useState<null | { awb: string; awbPrefix: string; airline: any; airport: any; operations: any }>(null);
  const [awbError, setAwbError] = useState<string | null>(null);
  const [awbLoading, setAwbLoading] = useState(false);

  /* ── FIRMS Code Search ── */
  const [firmsInput, setFirmsInput] = useState("");
  const [firmsResults, setFirmsResults] = useState<AirlineOperation[]>([]);
  const [firmsLoading, setFirmsLoading] = useState(false);
  const [firmsSearched, setFirmsSearched] = useState(false);
  const [firmsSelectedOp, setFirmsSelectedOp] = useState<AirlineOperation | null>(null);

  const handleFirmsSearch = async () => {
    const code = firmsInput.trim().toUpperCase();
    if (!code) return;
    setFirmsLoading(true); setFirmsSearched(false); setFirmsResults([]); setFirmsSelectedOp(null);
    try {
      const r = await fetch(`${BASE}/api/airline-operations?firmsCode=${encodeURIComponent(code)}&limit=200`);
      const json = await r.json();
      setFirmsResults(json.data ?? []);
      setFirmsSearched(true);
    } catch { setFirmsResults([]); setFirmsSearched(true); }
    finally { setFirmsLoading(false); }
  };

  /* ── Global Search (Airlines tab) ── */
  const [globalMode, setGlobalMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState<AirlineOperation[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [selectedGlobalOp, setSelectedGlobalOp] = useState<AirlineOperation | null>(null);

  const handleAwbSearch = async () => {
    const awb = awbInput.trim();
    const airport = awbAirport.trim().toUpperCase();
    if (!awb || !airport) { setAwbError("Please enter both an AWB number and destination airport code."); return; }
    setAwbLoading(true); setAwbError(null); setAwbResult(null);
    try {
      const r = await fetch(`${BASE}/api/awb-search?awb=${encodeURIComponent(awb)}&airport=${encodeURIComponent(airport)}`);
      const json = await r.json();
      if (!r.ok) { setAwbError(json.message ?? "Search failed."); }
      else { setAwbResult(json); }
    } catch {
      setAwbError("Network error — please try again.");
    }
    setAwbLoading(false);
  };

  /* ── Airline ISC / FIRMS pre-filter sets ── */
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

  useEffect(() => {
    if (!globalMode) return;
    const term = globalSearch.trim();
    if (!term) { setGlobalResults([]); return; }
    setGlobalLoading(true);
    const params = new URLSearchParams({ search: term, limit: "100" });
    fetch(`${BASE}/api/airline-operations?${params}`)
      .then(r => r.json())
      .then(data => setGlobalResults(data.data ?? []))
      .catch(() => {})
      .finally(() => setGlobalLoading(false));
  }, [globalSearch, globalMode]);

  /* ── Airline drilldown ── */
  const [selectedAirline, setSelectedAirline] = useState<{ id: number; name: string; iataCode?: string | null } | null>(null);
  const [airlineOps, setAirlineOps] = useState<AirlineOperation[]>([]);
  const [airlineOpsLoading, setAirlineOpsLoading] = useState(false);
  const [selectedAirlineOp, setSelectedAirlineOp] = useState<AirlineOperation | null>(null);

  /* ── Airport drilldown ── */
  const [selectedAirport, setSelectedAirport] = useState<{ id: number; name: string; iataCode?: string | null; city?: string | null; state?: string | null } | null>(null);
  const [airportOps, setAirportOps] = useState<AirlineOperation[]>([]);
  const [airportOpsLoading, setAirportOpsLoading] = useState(false);
  const [selectedAirportOp, setSelectedAirportOp] = useState<AirlineOperation | null>(null);

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
    setSelectedAirline(airline); setSelectedAirlineOp(null); setAirlineOpsLoading(true);
    setAirlineOps(await fetchOps({ airlineId: airline.id }));
    setAirlineOpsLoading(false);
  };

  const handleAirportClick = async (airport: { id: number; name: string; iataCode?: string | null; city?: string | null; state?: string | null }) => {
    setSelectedAirport(airport); setSelectedAirportOp(null); setAirportOpsLoading(true);
    setAirportOps(await fetchOps({ airportId: airport.id }));
    setAirportOpsLoading(false);
  };

  const handleTab = (t: "airlines" | "airports" | "awb" | "firms") => {
    setTab(t); setSearch(""); setPage(1); setCountry(""); setCustoms(""); setAirportFilter("");
    setIcaoFilter(""); setCbpFilter(""); setHasIscOnly(false); setFirmsFilter("");
    setSelectedAirline(null); setSelectedAirlineOp(null); setAirlineOps([]);
    setSelectedAirport(null); setSelectedAirportOp(null); setAirportOps([]);
    setAwbResult(null); setAwbError(null); setAwbInput(""); setAwbAirport("");
    setGlobalMode(false); setGlobalSearch(""); setGlobalResults([]); setSelectedGlobalOp(null);
    setFirmsInput(""); setFirmsResults([]); setFirmsSearched(false); setFirmsSelectedOp(null);
  };

  const clearAll = () => {
    setSearch(""); setCountry(""); setCustoms(""); setAirportFilter("");
    setIcaoFilter(""); setCbpFilter(""); setHasIscOnly(false); setFirmsFilter(""); setPage(1);
    setSelectedAirline(null); setSelectedAirlineOp(null);
    setSelectedAirport(null); setSelectedAirportOp(null);
  };

  const hasActiveFilters = !!(search || country || icaoFilter || cbpFilter || hasIscOnly || firmsFilter || airportFilter || customs);
  const totalShown = tab === "airlines" ? (filteredAirlines?.length ?? 0) : (filteredAirports?.length ?? 0);
  const grandTotal = tab === "airlines" ? (airlines?.total ?? 0) : (airports?.total ?? 0);
  const totalPages = Math.ceil(grandTotal / limit);

  /* ── Theme helpers ── */
  const heroBg = isDark
    ? "linear-gradient(135deg, hsl(222,60%,7%) 0%, hsl(222,55%,9%) 60%, hsl(222,50%,8%) 100%)"
    : "linear-gradient(135deg, hsl(210,25%,96%) 0%, hsl(0,0%,100%) 60%, hsl(220,20%,97%) 100%)";

  const cardStyle: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    border: `1px solid var(--t-border)`,
  };

  const rowHoverClass = "themed-row";

  const inputStyle: React.CSSProperties = {
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    border: `1px solid var(--t-border)`,
    color: "var(--t-text)",
  };

  /* ── Breadcrumb header factory ── */
  const BreadcrumbBar = ({ children }: { children: React.ReactNode }) => (
    <div className="px-5 py-4 flex items-center gap-3 flex-wrap" style={{
      background: isDark ? "linear-gradient(90deg, var(--t-accent-dim), transparent)" : "var(--t-accent-dim)",
      borderBottom: "1px solid var(--t-accent-border)"
    }}>{children}</div>
  );

  return (
    <div className="min-h-screen relative" style={{ background: isDark ? "hsl(222,60%,7%)" : "hsl(210,20%,96%)" }}>
      <AviationBg />
      {/* Atmospheric glow blobs (dark only) */}
      {isDark && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-[120px]" style={{ background: "var(--t-accent-dim)" }} />
          <div className="absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full blur-[100px]" style={{ background: "var(--t-accent2-dim)" }} />
        </div>
      )}
      {/* ─── HERO ─── */}
      <div className="relative z-10 px-4 sm:px-8 pb-16 overflow-hidden pt-[4px]">
        {/* Background image */}
        <img
          src={`${BASE}/plane-takeoff.jpg`}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute top-0 left-0 w-full h-[360px] object-cover object-top"
          style={{ zIndex: 0 }}
        />
        {/* Gradient overlay for readability */}
        <div
          className="absolute top-0 left-0 w-full h-[360px]"
          style={{
            zIndex: 1,
            background: "linear-gradient(to bottom, rgba(11,33,71,0.35) 0%, rgba(11,33,71,0.5) 50%, rgba(11,33,71,0.75) 100%)",
          }}
        />
        {/* Hero content sits above all layers */}
        <div className="relative" style={{ zIndex: 3 }}>
        {/* Status + Theme toggle row */}
        <div className="flex items-center justify-between gap-3 mb-10 max-w-6xl mx-auto">
          <button
            onClick={() => setRequestOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, rgba(5,150,105,0.2), rgba(5,150,105,0.1))", border: "1px solid rgba(5,150,105,0.4)", color: "#34d399" }}>
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span>Submit Data Request</span>
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-[10px] font-bold text-emerald-300 tracking-widest uppercase">Live Data</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)" }}>
              <Radio className="h-3 w-3" style={{ color: "rgba(147,197,253,0.8)" }} />
              <span className="text-[10px] font-bold tracking-widest uppercase hidden sm:inline" style={{ color: "rgba(147,197,253,0.8)" }}>Registry Online</span>
            </div>
            <ThemeToggle compact />
          </div>
        </div>

        {/* Title section */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(147,197,253,0.9)" }}>Global Aviation Registry</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-black mb-4 leading-tight" style={{ color: "#ffffff", letterSpacing: "-0.02em" }}>
            Global{" "}<span style={{ background: "linear-gradient(120deg, rgba(147,197,253,0.95), rgba(34,197,94,0.95))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Cargo Search</span>
          </h1>
          <p className="text-sm sm:text-base mb-8 leading-relaxed max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.9)" }}>
            Search Airlines, Airports, and AWBs with complete access to ISC charges, FIRMS codes, and operational details.
          </p>

          {/* Tab switcher */}
          <div className="inline-flex rounded-2xl p-1.5 gap-1 mb-8" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
            {([
              { key: "awb" as const, icon: ScanBarcode, label: "AWB Track", activeBg: "linear-gradient(135deg, #059669, #047857)", shadow: "rgba(5,150,105,0.35)" },
              { key: "airlines" as const, icon: Plane, label: "Airlines", activeBg: "linear-gradient(135deg, var(--t-accent), #1d4ed8)", shadow: "var(--t-accent-glow)" },
              { key: "airports" as const, icon: Building2, label: "Airports", activeBg: "linear-gradient(135deg, var(--t-accent2), #dc2626)", shadow: "var(--t-accent2-dim)" },
              { key: "firms" as const, icon: Hash, label: "FIRMS Lookup", activeBg: "linear-gradient(135deg, #7c3aed, #6d28d9)", shadow: "rgba(124,58,237,0.35)" },
            ] as const).map(({ key, icon: Icon, label, activeBg, shadow }) => (
              <button key={key}
                onClick={() => handleTab(key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200"
                style={tab === key
                  ? { background: activeBg, color: "#fff", boxShadow: `0 4px 15px ${shadow}` }
                  : { color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.05)" }}>
                <Icon className="h-3.5 w-3.5" />
                {label}
                {key === "airlines" && airlines && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md"
                    style={{ background: tab === "airlines" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                    {airlines.total}
                  </span>
                )}
                {key === "airports" && airports && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md"
                    style={{ background: tab === "airports" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                    {airports.total}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search bar — hidden on AWB and FIRMS tabs */}
          {tab !== "awb" && tab !== "firms" && <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center rounded-2xl overflow-hidden transition-all duration-300 shadow-lg" style={{
              background: "rgba(255,255,255,0.95)",
              border: `1px solid rgba(255,255,255,0.3)`, backdropFilter: "blur(10px)"
            }}>
              <Search className="ml-5 h-5 w-5 shrink-0 text-slate-400" />
              <input
                type="text" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={tab === "airlines" ? "Search airline name, IATA or ICAO code..." : "Search airport name, city, state, IATA..."}
                className="flex-1 px-4 py-3.5 bg-transparent focus:outline-none text-sm text-slate-700"
              />
              {search && (
                <button onClick={() => setSearch("")} className="mr-3 p-1.5 rounded-lg transition-all text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setShowFilters(v => !v)}
                className="mr-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
                style={showFilters || hasActiveFilters ? {
                  background: "#0b2147", color: "#fff", boxShadow: "0 2px 12px rgba(11,33,71,0.3)"
                } : {
                  background: "rgba(11,33,71,0.08)", color: "#0b2147", border: "1px solid rgba(11,33,71,0.15)"
                }}
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && <span className="h-4 w-4 rounded-full bg-amber-400 text-[9px] flex items-center justify-center font-black text-slate-700">!</span>}
              </button>
            </div>
          </div>}
        </div>
      </div>
      {/* ─── MAIN CONTENT ─── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 pb-20 mt-6">

        {/* ─── FILTER PANEL ─── */}
        {showFilters && tab !== "awb" && tab !== "firms" && (
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
                  <button onClick={() => { setHasIscOnly(v => !v); setPage(1); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                    style={hasIscOnly ? { background: "#10b981", color: "#fff", border: "1px solid #10b981" }
                      : { background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.22)" }}>
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

        {/* ═══════════════════════════════════════════
            AWB SEARCH PANEL
        ═══════════════════════════════════════════ */}
        {tab === "awb" && (
          <div>
            {/* Input card */}
            <div className="rounded-2xl p-6 shadow-lg mb-6" style={{ ...cardStyle, background: isDark ? "rgba(5,150,105,0.08)" : "rgba(5,150,105,0.05)", border: "1px solid rgba(5,150,105,0.3)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.4)" }}>
                  <ScanBarcode className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-wide" style={{ color: "var(--t-text)" }}>AWB Lookup</h2>
                  <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>Enter Air Waybill and destination airport to find airlines and ISC details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--t-text-muted)" }}>AWB Number</label>
                  <input
                    type="text"
                    value={awbInput}
                    onChange={e => setAwbInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAwbSearch()}
                    placeholder="e.g. 176-12345678"
                    className="w-full px-4 py-3 rounded-xl text-sm font-mono focus:outline-none transition-all focus:ring-2"
                    style={{
                      background: "var(--t-card)",
                      border: "1px solid var(--t-border)",
                      color: "var(--t-text)",
                      outlineColor: "var(--t-accent)"
                    }}
                  />
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--t-text-muted)" }}>3-digit prefix identifies the airline</p>
                </div>
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--t-text-muted)" }}>Destination Airport</label>
                  <input
                    type="text"
                    value={awbAirport}
                    onChange={e => setAwbAirport(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && handleAwbSearch()}
                    placeholder="IATA code, e.g. JFK"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl text-sm font-mono uppercase focus:outline-none transition-all focus:ring-2"
                    style={{
                      background: "var(--t-card)",
                      border: "1px solid var(--t-border)",
                      color: "var(--t-text)",
                      outlineColor: "var(--t-accent)"
                    }}
                  />
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--t-text-muted)" }}>Airport IATA code where cargo will arrive</p>
                </div>
              </div>

              <button
                onClick={handleAwbSearch}
                disabled={awbLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-black tracking-wide transition-all duration-200 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #059669, #047857)", color: "#fff", boxShadow: "0 4px 20px rgba(5,150,105,0.35)" }}
              >
                {awbLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanBarcode className="h-4 w-4" />}
                {awbLoading ? "Looking up..." : "Search AWB"}
              </button>

              {awbError && (
                <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm" style={{ color: "#f87171" }}>{awbError}</p>
                </div>
              )}
            </div>

            {/* Result card */}
            {awbResult && (
              <div className="rounded-2xl overflow-hidden shadow-xl" style={cardStyle}>
                {/* Header */}
                <div className="px-6 pt-5 pb-4 flex items-start gap-4" style={{ borderBottom: "1px solid var(--t-border)", background: "rgba(5,150,105,0.06)" }}>
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center font-black font-mono text-lg shrink-0"
                    style={{ background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.35)", color: "#34d399" }}>
                    {awbResult.airline.iataCode ?? "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(5,150,105,0.15)", color: "#34d399", border: "1px solid rgba(5,150,105,0.3)" }}>
                        AWB {awbResult.awb}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: "var(--t-card)", color: "var(--t-text-muted)", border: "1px solid var(--t-border)" }}>
                        Prefix {awbResult.awbPrefix}
                      </span>
                    </div>
                    <h2 className="text-xl font-black tracking-wide" style={{ color: "var(--t-text)" }}>{awbResult.airline.name}</h2>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "var(--t-text-muted)" }}>
                      {awbResult.airline.country && `${awbResult.airline.country} · `}Destination: <strong style={{ color: "var(--t-text-sub)" }}>{awbResult.airport.name} ({awbResult.airport.iataCode})</strong>
                      {(awbResult.airport.city || awbResult.airport.state) && ` · ${[awbResult.airport.city, awbResult.airport.state].filter(Boolean).join(", ")}`}
                    </p>
                  </div>
                </div>

                {awbResult.operations ? (
                  <div className="p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--t-text-muted)" }}>Operational Details at {awbResult.airport.iataCode}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailCard icon={<Hash className="h-4 w-4" />} label="FIRMS Code" value={awbResult.operations.firmsCode} varKey="--t-accent" />
                      <DetailCard icon={<DollarSign className="h-4 w-4" />} label="ISC Charges (USD)" value={awbResult.operations.iscAmount ? `$${awbResult.operations.iscAmount}` : null} varKey="green" />
                      <DetailCard icon={<Building2 className="h-4 w-4" />} label="Ground Handler" value={awbResult.operations.iscPayableTo} varKey="--t-accent2" />
                      <DetailCard icon={<Package className="h-4 w-4" />} label="ISC Payable At" value={awbResult.operations.iscPayableAt} varKey="--t-accent2" />
                      <DetailCard icon={<Phone className="h-4 w-4" />} label="Contact Number" value={awbResult.operations.contactNumber} varKey="--t-accent" />
                      <DetailCard icon={<Mail className="h-4 w-4" />} label="Email Address" value={awbResult.operations.contactEmail} varKey="red" isEmail />
                    </div>
                    {awbResult.operations.notes && (
                      <div className="mt-4 p-4 rounded-xl" style={{ background: "var(--t-card)", border: "1px solid var(--t-border)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>Notes</p>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--t-text-sub)" }}>{awbResult.operations.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-14 text-center px-6">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: "var(--t-text-muted)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>Airline identified — no operational data at this airport yet</p>
                    <p className="text-xs mt-1.5" style={{ color: "var(--t-text-muted)" }}>
                      {awbResult.airline.name} ({awbResult.airline.iataCode}) does not have ISC / FIRMS data entered for {awbResult.airport.iataCode}.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quick reference */}
            {!awbResult && !awbError && (
              <div className="rounded-2xl p-5 shadow-lg" style={cardStyle}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--t-text-muted)" }}>Common AWB Prefixes</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[["176","Emirates (EK)"],["157","Qatar Airways (QR)"],["020","Lufthansa (LH)"],["057","Air France (AF)"],
                    ["235","Turkish Airlines (TK)"],["108","Atlas Air (5Y)"],["125","British Airways (BA)"],["618","Singapore Airlines (SQ)"],
                    ["016","United Airlines (UA)"],["006","Delta Air Lines (DL)"],["001","American Airlines (AA)"],["160","Cathay Pacific (CX)"]].map(([prefix, name]) => (
                    <button key={prefix} onClick={() => setAwbInput(`${prefix}-`)}
                      className="text-left p-2.5 rounded-lg transition-all"
                      style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: "2px solid rgba(249,115,22,0.35)" }}>
                      <p className="text-sm font-black font-mono" style={{ color: "var(--t-accent)" }}>{prefix}</p>
                      <p className="text-[10px] leading-tight mt-0.5" style={{ color: "#ffffff" }}>{name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            AIRLINE DRILLDOWN  (click airline → airports)
        ═══════════════════════════════════════════ */}
        {selectedAirline && (
          <div className="rounded-2xl overflow-hidden mb-4 shadow-xl" style={cardStyle}>
            <BreadcrumbBar>
              <button onClick={() => { setSelectedAirline(null); setSelectedAirlineOp(null); setAirlineOps([]); }}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: "var(--t-accent)" }}>
                <ArrowLeft className="h-4 w-4" /> Airlines
              </button>
              <span style={{ color: "var(--t-text-muted)" }}>›</span>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center font-black font-mono text-xs"
                  style={{ background: "var(--t-accent-dim)", border: "1px solid var(--t-accent-border)", color: "var(--t-accent)" }}>
                  {selectedAirline.iataCode || "—"}
                </div>
                <span className="font-bold text-sm" style={{ color: "var(--t-text)" }}>{selectedAirline.name}</span>
              </div>
              {selectedAirlineOp && (
                <>
                  <span style={{ color: "var(--t-text-muted)" }}>›</span>
                  <button onClick={() => setSelectedAirlineOp(null)} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--t-text-sub)" }}>
                    <Building2 className="h-3.5 w-3.5" />
                    {selectedAirlineOp.airportIata} — {selectedAirlineOp.airportName}
                    <X className="h-3.5 w-3.5 ml-1 opacity-50" />
                  </button>
                </>
              )}
            </BreadcrumbBar>

            {selectedAirlineOp ? (
              <>
                {/* Op summary header */}
                <div className="px-6 pt-5 pb-3 flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center font-black font-mono text-sm shrink-0"
                    style={{ background: "var(--t-accent2-dim)", border: "1px solid var(--t-accent2-border)", color: "var(--t-accent2)" }}>
                    {selectedAirlineOp.airportIata}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black tracking-wide" style={{ color: "var(--t-text)" }}>{selectedAirlineOp.airportName}</h2>
                    {(selectedAirlineOp.airportCity || selectedAirlineOp.airportState) && (
                      <p className="text-sm flex items-center gap-1.5 mt-0.5" style={{ color: "var(--t-text-sub)" }}>
                        <MapPin className="h-3.5 w-3.5" style={{ color: "var(--t-accent2)" }} />
                        {[selectedAirlineOp.airportCity, selectedAirlineOp.airportState].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {selectedAirlineOp.firmsCode && <Badge color="accent">FIRMS: {selectedAirlineOp.firmsCode}</Badge>}
                      {selectedAirlineOp.iscAmount && <Badge color="green">ISC: ${selectedAirlineOp.iscAmount}</Badge>}
                    </div>
                  </div>
                </div>
                <OpsDetail op={selectedAirlineOp} />
              </>
            ) : (
              <>
                <div className="px-5 py-3 flex items-center justify-between"
                  style={{ borderBottom: "1px solid var(--t-border)", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                  <span className="text-sm font-semibold" style={{ color: "var(--t-accent)" }}>
                    {airlineOpsLoading ? "Loading airports..." :
                      airlineOps.length > 0
                        ? `${airlineOps.length} airport${airlineOps.length !== 1 ? "s" : ""} — click to view ISC & contact details`
                        : "No operational data found for this airline"}
                  </span>
                </div>
                {airlineOpsLoading ? <Spinner /> : airlineOps.length === 0 ? (
                  <div className="py-14 text-center text-sm" style={{ color: "var(--t-text-muted)" }}>No operational data available for this airline yet.</div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--t-border-soft)" }}>
                    {airlineOps.map(op => (
                      <button key={op.id} onClick={() => setSelectedAirlineOp(op)}
                        className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-150 text-left ${rowHoverClass}`}>
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center font-black font-mono text-xs shrink-0"
                          style={{ background: "var(--t-accent2-dim)", border: "1px solid var(--t-accent2-border)", color: "var(--t-accent2)" }}>
                          {op.airportIata}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: "var(--t-text)" }}>{op.airportName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {op.airportCity && <span className="text-xs flex items-center gap-1" style={{ color: "var(--t-text-muted)" }}><MapPin className="h-3 w-3" />{[op.airportCity, op.airportState].filter(Boolean).join(", ")}</span>}
                            {op.firmsCode && <Badge color="accent">FIRMS: {op.firmsCode}</Badge>}
                            {op.iscAmount && <Badge color="green">ISC: ${op.iscAmount}</Badge>}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--t-text-muted)" }}>
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

        {/* ═══════════════════════════════════════════
            AIRPORT DRILLDOWN  (click airport → airlines)
        ═══════════════════════════════════════════ */}
        {selectedAirport && (
          <div className="rounded-2xl overflow-hidden mb-4 shadow-xl" style={cardStyle}>
            <BreadcrumbBar>
              <button onClick={() => { setSelectedAirport(null); setSelectedAirportOp(null); setAirportOps([]); }}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: "var(--t-accent)" }}>
                <ArrowLeft className="h-4 w-4" /> Airports
              </button>
              <span style={{ color: "var(--t-text-muted)" }}>›</span>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center font-black font-mono text-xs"
                  style={{ background: "var(--t-accent2-dim)", border: "1px solid var(--t-accent2-border)", color: "var(--t-accent2)" }}>
                  {selectedAirport.iataCode || "—"}
                </div>
                <span className="font-bold text-sm" style={{ color: "var(--t-text)" }}>{selectedAirport.name}</span>
                {(selectedAirport.city || selectedAirport.state) && (
                  <span className="text-xs flex items-center gap-1" style={{ color: "var(--t-text-muted)" }}>
                    <MapPin className="h-3 w-3" />{[selectedAirport.city, selectedAirport.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              {selectedAirportOp && (
                <>
                  <span style={{ color: "var(--t-text-muted)" }}>›</span>
                  <button onClick={() => setSelectedAirportOp(null)} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--t-text-sub)" }}>
                    <Plane className="h-3.5 w-3.5" />
                    {selectedAirportOp.airlineIata} — {selectedAirportOp.airlineName}
                    <X className="h-3.5 w-3.5 ml-1 opacity-50" />
                  </button>
                </>
              )}
            </BreadcrumbBar>

            {selectedAirportOp ? (
              <>
                {/* Op summary header */}
                <div className="px-6 pt-5 pb-3 flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center font-black font-mono text-sm shrink-0"
                    style={{ background: "var(--t-accent-dim)", border: "1px solid var(--t-accent-border)", color: "var(--t-accent)" }}>
                    {selectedAirportOp.airlineIata || "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black tracking-wide" style={{ color: "var(--t-text)" }}>{selectedAirportOp.airlineName}</h2>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "var(--t-text-muted)" }}>
                      Operating at {selectedAirport.name} ({selectedAirport.iataCode})
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {selectedAirportOp.firmsCode && <Badge color="accent">FIRMS: {selectedAirportOp.firmsCode}</Badge>}
                      {selectedAirportOp.iscAmount && <Badge color="green">ISC: ${selectedAirportOp.iscAmount}</Badge>}
                    </div>
                  </div>
                </div>
                <OpsDetail op={selectedAirportOp} />
              </>
            ) : (
              <>
                <div className="px-5 py-3 flex items-center justify-between"
                  style={{ borderBottom: "1px solid var(--t-border)", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                  <span className="text-sm font-semibold" style={{ color: "var(--t-accent2)" }}>
                    {airportOpsLoading ? "Loading airlines..." :
                      airportOps.length > 0
                        ? `${airportOps.length} airline${airportOps.length !== 1 ? "s" : ""} operate here — click to view ISC & contact details`
                        : "No airlines with operational data found for this airport"}
                  </span>
                </div>
                {airportOpsLoading ? <Spinner /> : airportOps.length === 0 ? (
                  <div className="py-14 text-center">
                    <Plane className="h-8 w-8 mx-auto mb-3 opacity-20" style={{ color: "var(--t-text-muted)" }} />
                    <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>No operational data found for this airport.</p>
                    <p className="text-xs mt-1" style={{ color: "var(--t-text-muted)" }}>Airlines may not have FIRMS/ISC data entered for this location yet.</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--t-border-soft)" }}>
                    {airportOps.map(op => (
                      <button key={op.id} onClick={() => setSelectedAirportOp(op)}
                        className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-150 text-left ${rowHoverClass}`}>
                        {/* Airline IATA badge */}
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center font-black font-mono text-xs shrink-0"
                          style={{ background: "var(--t-accent-dim)", border: "1px solid var(--t-accent-border)", color: "var(--t-accent)" }}>
                          {op.airlineIata || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: "var(--t-text)" }}>{op.airlineName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {op.airlineIata && <Badge color="accent">IATA {op.airlineIata}</Badge>}
                            {op.firmsCode && <Badge color="muted">FIRMS: {op.firmsCode}</Badge>}
                            {op.iscAmount && <Badge color="green">ISC: ${op.iscAmount}</Badge>}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--t-text-muted)" }}>
                          Details <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════
            FIRMS LOOKUP PANEL
        ═══════════════════════════════════════════ */}
        {tab === "firms" && (
          <div>
            {/* Search card */}
            <div className="rounded-2xl p-6 shadow-xl mb-6" style={{ ...cardStyle, background: isDark ? "rgba(124,58,237,0.06)" : "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.22)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
                  <Hash className="h-5 w-5" style={{ color: "#7c3aed" }} />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-wide" style={{ color: "var(--t-text)" }}>FIRMS Code Lookup</h2>
                  <p className="text-xs" style={{ color: "#ffffff" }}>Find airlines and operational details by FIRMS code</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#ffffff" }}>FIRMS Code</label>
                  <input
                    type="text"
                    value={firmsInput}
                    onChange={e => setFirmsInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && handleFirmsSearch()}
                    placeholder="e.g. ABCD, XY12"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl font-mono text-sm focus:outline-none focus:ring-2"
                    style={{ ...inputStyle, focusRingColor: "#7c3aed" }}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleFirmsSearch}
                    disabled={firmsLoading || !firmsInput.trim()}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#ffffff", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}
                  >
                    {firmsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    {firmsLoading ? "Searching..." : "Lookup"}
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {firmsSearched && (
              firmsResults.length === 0 ? (
                <div className="rounded-2xl p-12 text-center" style={cardStyle}>
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                    <Hash className="h-7 w-7" style={{ color: "#7c3aed" }} />
                  </div>
                  <h3 className="font-bold mb-1" style={{ color: "var(--t-text)" }}>No results for "{firmsInput}"</h3>
                  <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>No airline operations found with this FIRMS code. Try a different code.</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden shadow-xl" style={cardStyle}>
                  <div className="px-5 py-3.5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--t-border)", background: isDark ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.04)" }}>
                    <Hash className="h-4 w-4" style={{ color: "#7c3aed" }} />
                    <span className="font-bold text-sm" style={{ color: "var(--t-text)" }}>FIRMS: <span className="font-mono">{firmsInput}</span></span>
                    <span className="ml-auto text-xs font-mono px-2 py-1 rounded-lg" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>{firmsResults.length} match{firmsResults.length !== 1 ? "es" : ""}</span>
                    {firmsSelectedOp && (
                      <button onClick={() => setFirmsSelectedOp(null)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                      </button>
                    )}
                  </div>

                  {firmsSelectedOp ? (
                    <div>
                      <div className="px-5 py-3 flex items-center gap-2 flex-wrap" style={{ background: isDark ? "rgba(124,58,237,0.06)" : "rgba(124,58,237,0.03)", borderBottom: "1px solid var(--t-border)" }}>
                        <Hash className="h-3.5 w-3.5" style={{ color: "#7c3aed" }} />
                        <span className="text-sm font-bold" style={{ color: "#7c3aed" }}>{firmsSelectedOp.airlineName}</span>
                        <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--t-text-muted)" }} />
                        <span className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>{firmsSelectedOp.airportName} ({firmsSelectedOp.airportIata})</span>
                        {firmsSelectedOp.airportCity && <span className="text-xs" style={{ color: "var(--t-text-muted)" }}>— {firmsSelectedOp.airportCity}{firmsSelectedOp.airportState ? `, ${firmsSelectedOp.airportState}` : ""}</span>}
                      </div>
                      <OpsDetail op={firmsSelectedOp} />
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--t-border)" }}>
                      {firmsResults.map(op => (
                        <button
                          key={op.id}
                          onClick={() => setFirmsSelectedOp(op)}
                          className={`w-full text-left flex items-center gap-4 px-5 py-4 transition-all duration-150 ${rowHoverClass}`}
                        >
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                            <Plane className="h-4 w-4" style={{ color: "#7c3aed" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm" style={{ color: "var(--t-text)" }}>{op.airlineName}</span>
                              {op.airlineIata && <Badge color="accent">{op.airlineIata}</Badge>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <MapPin className="h-3 w-3" style={{ color: "var(--t-text-muted)" }} />
                              <span className="text-xs" style={{ color: "var(--t-text-sub)" }}>{op.airportName} ({op.airportIata})</span>
                              {op.airportCity && <span className="text-xs" style={{ color: "var(--t-text-muted)" }}>· {op.airportCity}{op.airportState ? `, ${op.airportState}` : ""}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {op.iscAmount && <p className="text-xs font-bold" style={{ color: "#059669" }}>${op.iscAmount}</p>}
                            {op.firmsCode && <p className="text-[10px] font-mono" style={{ color: "#7c3aed" }}>{op.firmsCode}</p>}
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--t-text-muted)" }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {/* ─── RESULTS LIST (only shown when nothing is selected) ─── */}
        {!selectedAirline && !selectedAirport && tab !== "awb" && tab !== "firms" && (
          <div className="rounded-2xl overflow-hidden shadow-xl" style={cardStyle}>
            {/* By Airline / Global Search toggle — only on airlines tab */}
            {tab === "airlines" && (
              <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--t-border)", background: "var(--t-accent-dim)" }}>
                <button
                  onClick={() => { setGlobalMode(false); setGlobalSearch(""); setGlobalResults([]); setSelectedGlobalOp(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                  style={!globalMode ? {
                    background: "var(--t-accent)", color: "#fff", boxShadow: "0 2px 12px var(--t-accent-glow)"
                  } : {
                    background: "var(--t-card)", color: "var(--t-text-sub)", border: "1px solid var(--t-border)"
                  }}
                >
                  <Plane className="h-3.5 w-3.5" /> By Airline
                </button>
                <button
                  onClick={() => setGlobalMode(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                  style={globalMode ? {
                    background: "var(--t-accent)", color: "#fff", boxShadow: "0 2px 12px var(--t-accent-glow)"
                  } : {
                    background: "var(--t-card)", color: "var(--t-text-sub)", border: "1px solid var(--t-border)"
                  }}
                >
                  <Globe className="h-3.5 w-3.5" /> Global Search
                </button>
              </div>
            )}

            {/* ─── GLOBAL SEARCH MODE ─── */}
            {tab === "airlines" && globalMode && (
              <>
                {/* Global search input */}
                <div className="p-4" style={{ borderBottom: "1px solid var(--t-border)" }}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--t-text-muted)" }} />
                    <input
                      autoFocus
                      type="text"
                      value={globalSearch}
                      onChange={e => { setGlobalSearch(e.target.value); setSelectedGlobalOp(null); }}
                      placeholder="Search airline, airport, FIRMS code, ISC amount, handler, contact..."
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ ...inputStyle, border: "1px solid var(--t-accent-border)" }}
                    />
                    {globalSearch && (
                      <button onClick={() => { setGlobalSearch(""); setGlobalResults([]); setSelectedGlobalOp(null); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--t-text-muted)" }}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Drilled-in op detail */}
                {selectedGlobalOp ? (
                  <>
                    <div className="px-5 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid var(--t-accent-border)", background: "var(--t-accent-dim)" }}>
                      <button onClick={() => setSelectedGlobalOp(null)} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--t-accent)" }}>
                        <ArrowLeft className="h-4 w-4" /> Results
                      </button>
                      <span style={{ color: "var(--t-text-muted)" }}>›</span>
                      <span className="font-bold text-sm" style={{ color: "var(--t-text)" }}>{selectedGlobalOp.airlineName}</span>
                      <span className="text-xs font-mono" style={{ color: "var(--t-text-muted)" }}>@ {selectedGlobalOp.airportIata}</span>
                    </div>
                    <div className="px-6 pt-5 pb-3 flex items-start gap-4" style={{ borderBottom: "1px solid var(--t-border)" }}>
                      <div className="h-14 w-14 rounded-2xl flex items-center justify-center font-black font-mono text-sm shrink-0"
                        style={{ background: "var(--t-accent-dim)", border: "1px solid var(--t-accent-border)", color: "var(--t-accent)" }}>
                        {selectedGlobalOp.airlineIata || "—"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-black tracking-wide" style={{ color: "var(--t-text)" }}>{selectedGlobalOp.airlineName}</h2>
                        <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: "var(--t-text-sub)" }}>
                          <Building2 className="h-3.5 w-3.5" style={{ color: "var(--t-accent2)" }} />
                          {selectedGlobalOp.airportName} ({selectedGlobalOp.airportIata})
                          {(selectedGlobalOp.airportCity || selectedGlobalOp.airportState) && (
                            <span className="flex items-center gap-1" style={{ color: "var(--t-text-muted)" }}>
                              <MapPin className="h-3 w-3" />{[selectedGlobalOp.airportCity, selectedGlobalOp.airportState].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {selectedGlobalOp.firmsCode && <Badge color="accent">FIRMS: {selectedGlobalOp.firmsCode}</Badge>}
                          {selectedGlobalOp.iscAmount && <Badge color="green">ISC: ${selectedGlobalOp.iscAmount}</Badge>}
                        </div>
                      </div>
                    </div>
                    <OpsDetail op={selectedGlobalOp} />
                  </>
                ) : globalSearch.trim() === "" ? (
                  <div className="py-16 text-center">
                    <Globe className="h-8 w-8 mx-auto mb-3 opacity-20" style={{ color: "var(--t-text-muted)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--t-text-muted)" }}>Type to search across all operations data</p>
                    <p className="text-xs mt-1 opacity-60" style={{ color: "var(--t-text-muted)" }}>FIRMS codes · ISC amounts · ground handlers · airline & airport names · contacts</p>
                  </div>
                ) : globalLoading ? (
                  <Spinner />
                ) : globalResults.length === 0 ? (
                  <div className="py-16 text-center">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-20" style={{ color: "var(--t-text-muted)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--t-text-muted)" }}>No results for "{globalSearch}"</p>
                  </div>
                ) : (
                  <>
                    <div className="px-5 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid var(--t-border)", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)" }}>
                      <span className="text-xs font-semibold" style={{ color: "var(--t-text-muted)" }}>
                        {globalResults.length} result{globalResults.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: "var(--t-border-soft)" }}>
                      {globalResults.map(op => (
                        <button key={op.id} onClick={() => setSelectedGlobalOp(op)}
                          className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-150 text-left ${rowHoverClass}`}>
                          <div className="h-11 w-11 rounded-xl flex items-center justify-center font-black font-mono text-xs shrink-0"
                            style={{ background: "var(--t-accent-dim)", border: "1px solid var(--t-accent-border)", color: "var(--t-accent)" }}>
                            {op.airlineIata ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm" style={{ color: "var(--t-text)" }}>{op.airlineName}</p>
                              <span className="text-xs flex items-center gap-1" style={{ color: "var(--t-text-muted)" }}>
                                <Building2 className="h-3 w-3" /> {op.airportIata} — {op.airportName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {op.firmsCode && <Badge color="accent">FIRMS: {op.firmsCode}</Badge>}
                              {op.iscAmount && <Badge color="green">ISC: ${op.iscAmount}</Badge>}
                              {op.iscPayableTo && <Badge color="muted">{op.iscPayableTo}</Badge>}
                              {(op.airportCity || op.airportState) && (
                                <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--t-text-muted)" }}>
                                  <MapPin className="h-2.5 w-2.5" />{[op.airportCity, op.airportState].filter(Boolean).join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--t-text-muted)" }} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ─── BY AIRLINE MODE (normal list) ─── */}
            {!(tab === "airlines" && globalMode) && (
              <>
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
              <span className="text-xs font-mono hidden sm:block" style={{ color: "var(--t-text-muted)" }}>
                {tab === "airlines" ? "Click airline → view airports & ISC data" : "Click airport → view airlines operating there"}
              </span>
            </div>

            {/* Loading */}
            {(tab === "airlines" ? airlinesQuery.isLoading : airportsQuery.isLoading) && <Spinner />}

            {/* Empty */}
            {!((tab === "airlines" ? airlinesQuery.isLoading : airportsQuery.isLoading)) && totalShown === 0 && (
              <div className="py-20 text-center">
                <Search className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--t-border)" }} />
                <p className="text-sm" style={{ color: "var(--t-text-muted)" }}>No results match your search.</p>
                {hasActiveFilters && <button onClick={clearAll} className="mt-3 text-xs underline transition-colors" style={{ color: "var(--t-accent)" }}>Clear all filters</button>}
              </div>
            )}

            {/* Airlines list */}
            {tab === "airlines" && !airlinesQuery.isLoading && (filteredAirlines?.length ?? 0) > 0 && (
              <div>
                {filteredAirlines?.map((airline, i) => (
                  <button key={airline.id} onClick={() => handleAirlineClick(airline)}
                    className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-150 text-left ${rowHoverClass}`}
                    style={{ borderBottom: i < (filteredAirlines.length - 1) ? `1px solid var(--t-border-soft)` : "none" }}>
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center font-black font-mono text-xs shrink-0"
                      style={{ background: "var(--t-accent-dim)", border: "1px solid var(--t-accent-border)", color: "var(--t-accent)" }}>
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
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--t-text-muted)" }}>
                      Airports <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Airports list */}
            {tab === "airports" && !airportsQuery.isLoading && (filteredAirports?.length ?? 0) > 0 && (
              <div>
                {filteredAirports?.map((airport, i) => (
                  <button key={airport.id} onClick={() => handleAirportClick({
                    id: airport.id, name: airport.name ?? "", iataCode: airport.iataCode,
                    city: airport.city, state: airport.state
                  })}
                    className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-150 text-left ${rowHoverClass}`}
                    style={{ borderBottom: i < (filteredAirports.length - 1) ? `1px solid var(--t-border-soft)` : "none" }}>
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center font-black font-mono text-xs shrink-0"
                      style={{ background: "var(--t-accent2-dim)", border: "1px solid var(--t-accent2-border)", color: "var(--t-accent2)" }}>
                      {airport.iataCode || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--t-text)" }}>{airport.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {airport.iataCode && <Badge color="accent2">IATA {airport.iataCode}</Badge>}
                        {airport.cbpPortCode && <Badge color="muted">CBP {airport.cbpPortCode}</Badge>}
                        {(airport.city || airport.state) && <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--t-text-muted)" }}><MapPin className="h-3 w-3" />{[airport.city, airport.state].filter(Boolean).join(", ")}</span>}
                        {airport.customsApproved && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500"><Shield className="h-3 w-3" />Customs</span>}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--t-text-muted)" }}>
                      Airlines <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
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
                      className="h-7 px-2 rounded-lg text-xs font-mono focus:outline-none"
                      style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
                      {[20, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {[{ label: "← Prev", disabled: page === 1, fn: () => setPage(p => p - 1) },
                    { label: "Next →", disabled: page >= totalPages, fn: () => setPage(p => p + 1) }].map(btn => (
                    <button key={btn.label} disabled={btn.disabled} onClick={btn.fn}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            </>
            )}
          </div>
        )}
        </div>{/* end zIndex: 3 content wrapper */}
      </div>
      <RequestModal isOpen={requestOpen} onClose={() => setRequestOpen(false)} isDark={isDark} />
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm transition-all hover:shadow-md"
      style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)", border: "1px solid var(--t-accent-border)" }}>
      {label}
      <button onClick={onRemove} className="hover:opacity-60 transition-opacity ml-0.5"><X className="h-3 w-3" /></button>
    </span>
  );
}
