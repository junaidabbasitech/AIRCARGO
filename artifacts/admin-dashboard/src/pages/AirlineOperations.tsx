import { useState, useEffect } from "react";
import { useListAirlines } from "@workspace/api-client-react";
import { Card, CardContent, Button, Input, Label, Modal, Select, Badge } from "@/components/ui";
import { CardWatermark } from "@/components/CardWatermark";
import { SearchableAirportSelect } from "@/components/SearchableAirportSelect";
import { Plus, Edit2, Trash2, Search, Plane, Building2, ChevronLeft, Phone, Mail, Hash, DollarSign, MapPin, CheckSquare, X, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface AirlineOp {
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
  lastUpdated: string;
  airlineName: string | null;
  airlineIata: string | null;
  airportName: string | null;
  airportIata: string | null;
  airportCity: string | null;
  airportState: string | null;
}

const emptyForm = { airlineId: "", airportId: "", firmsCode: "", iscAmount: "", iscPayableAt: "", iscPayableTo: "", contactNumber: "", contactEmail: "", notes: "" };

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Request failed"); }
  return res.json();
}

export default function AirlineOperations() {
  const { isDark } = useTheme();
  const [ops, setOps] = useState<AirlineOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [airlineSearch, setAirlineSearch] = useState("");
  const [selectedAirlineId, setSelectedAirlineId] = useState<number | null>(null);
  const [expandedAirportId, setExpandedAirportId] = useState<number | null>(null);

  // Global search mode
  const [globalMode, setGlobalMode] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState<AirlineOp[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<AirlineOp | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const airlinesQ = useListAirlines({ status: "approved" as any, page: 1, limit: 300 });

  const loadOps = async () => {
    setLoading(true);
    try { setOps((await apiFetch("/api/airline-operations")).data); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOps(); }, []);

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

  // Grouped: unique airlines that have operations
  const airlineMap = new Map<number, { name: string; iata: string; count: number; hasData: boolean }>();
  for (const op of ops) {
    if (!airlineMap.has(op.airlineId)) {
      airlineMap.set(op.airlineId, { name: op.airlineName ?? "Unknown", iata: op.airlineIata ?? "?", count: 0, hasData: false });
    }
    const entry = airlineMap.get(op.airlineId)!;
    if (op.airportId) entry.count++;
    if (op.firmsCode || op.iscAmount || op.contactNumber || op.contactEmail) entry.hasData = true;
  }
  const uniqueAirlines = Array.from(airlineMap.entries())
    .filter(([, a]) => {
      const q = airlineSearch.toLowerCase();
      return !q || a.name.toLowerCase().includes(q) || a.iata.toLowerCase().includes(q);
    })
    .sort((a, b) => a[1].name.localeCompare(b[1].name));

  // Ops for the selected airline
  const airlineOps = ops.filter(op => op.airlineId === selectedAirlineId);
  const selectedAirlineInfo = selectedAirlineId ? airlineMap.get(selectedAirlineId) : null;

  // Selection logic for bulk delete
  const allOpsIds = airlineOps.map(o => o.id);
  const allSelected = allOpsIds.length > 0 && allOpsIds.every(id => selected.has(id));
  const someSelected = allOpsIds.some(id => selected.has(id));
  const toggleAll = () => {
    if (allSelected) setSelected(s => { const n = new Set(s); allOpsIds.forEach(id => n.delete(id)); return n; });
    else setSelected(s => { const n = new Set(s); allOpsIds.forEach(id => n.add(id)); return n; });
  };
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Permanently delete ${selected.size} operation record(s)?`)) return;
    setBulkLoading(true);
    try {
      let deleted = 0;
      for (const id of Array.from(selected)) {
        await apiFetch(`/api/airline-operations/${id}`, { method: "DELETE" });
        deleted++;
      }
      toast.success(`Deleted ${deleted} record(s)`);
      setSelected(new Set());
      loadOps();
    } catch (e: any) { toast.error(e.message); }
    setBulkLoading(false);
  };

  const openCreate = (airlineId?: number) => {
    setEditing(null);
    setForm({ ...emptyForm, airlineId: airlineId ? String(airlineId) : "" });
    setIsModalOpen(true);
  };
  const openEdit = (op: AirlineOp) => {
    setEditing(op);
    setForm({
      airlineId: String(op.airlineId),
      airportId: String(op.airportId),
      firmsCode: op.firmsCode ?? "",
      iscAmount: op.iscAmount ?? "",
      iscPayableAt: op.iscPayableAt ?? "",
      iscPayableTo: op.iscPayableTo ?? "",
      contactNumber: op.contactNumber ?? "",
      contactEmail: op.contactEmail ?? "",
      notes: op.notes ?? "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.airlineId) { toast.error("Airline is required"); return; }
    setSaving(true);
    try {
      const body = {
        airlineId: parseInt(form.airlineId), airportId: form.airportId ? parseInt(form.airportId) : null,
        firmsCode: form.firmsCode || null, iscAmount: form.iscAmount || null,
        iscPayableAt: form.iscPayableAt || null, iscPayableTo: form.iscPayableTo || null,
        contactNumber: form.contactNumber || null, contactEmail: form.contactEmail || null,
        notes: form.notes || null,
      };
      if (editing) {
        await apiFetch(`/api/airline-operations/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
        toast.success("Record updated");
      } else {
        await apiFetch("/api/airline-operations", { method: "POST", body: JSON.stringify(body) });
        toast.success("Record created");
      }
      setIsModalOpen(false);
      loadOps();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this operation record?")) return;
    try { await apiFetch(`/api/airline-operations/${id}`, { method: "DELETE" }); toast.success("Deleted"); loadOps(); }
    catch (e: any) { toast.error(e.message); }
  };

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  // ──────────────────────────────────────────────
  // LEVEL 1 — Airline Grid OR Global Search
  // ──────────────────────────────────────────────
  if (!selectedAirlineId) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--t-text)" }}>Airline Operations</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--t-text-muted)" }}>Manage airport operations, FIRMS codes, and ISC data by airline</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--t-border)" }}>
              <button onClick={() => setGlobalMode(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all"
                style={!globalMode ? { background: "var(--t-accent)", color: "#fff" } : { background: "var(--t-card)", color: "var(--t-text-sub)" }}>
                <Plane className="h-3.5 w-3.5" /> By Airline
              </button>
              <button onClick={() => setGlobalMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all"
                style={globalMode ? { background: "var(--t-accent)", color: "#fff" } : { background: "var(--t-card)", color: "var(--t-text-sub)" }}>
                <Globe className="h-3.5 w-3.5" /> Global Search
              </button>
            </div>
            <Button variant="primary" onClick={() => openCreate()} className="hover:scale-105 active:scale-95 transition-all">
              <Plus className="h-4 w-4 mr-2" /> Add Operation
            </Button>
          </div>
        </div>

        {globalMode ? (
          /* ── Global Search Mode ── */
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--t-text-muted)" }} />
              <Input
                placeholder="Search by airline, airport, FIRMS code, ISC amount, payable to, contact..."
                className="pl-9 text-sm"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                autoFocus
              />
              {globalSearch && (
                <button onClick={() => { setGlobalSearch(""); setGlobalResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all hover:opacity-70"
                  style={{ color: "var(--t-text-muted)" }}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {globalSearch.trim() === "" ? (
              <div className="text-center py-16" style={{ color: "var(--t-text-muted)" }}>
                <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold">Type to search across all operation fields</p>
                <p className="text-xs mt-1 opacity-70">FIRMS codes, ISC amounts, airlines, airports, ground handlers, contacts...</p>
              </div>
            ) : globalLoading ? (
              <div className="text-center py-16" style={{ color: "var(--t-text-muted)" }}>Searching...</div>
            ) : globalResults.length === 0 ? (
              <div className="text-center py-16" style={{ color: "var(--t-text-muted)" }}>No results for "{globalSearch}"</div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--t-border)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--t-text-muted)" }}>{globalResults.length} result{globalResults.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--t-border)" }}>
                          {["Airline", "Airport", "FIRMS Code", "ISC Amount", "Payable To", "Contact", "Actions"].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--t-text-muted)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {globalResults.map(op => (
                          <tr key={op.id} className="group transition-all" style={{ borderBottom: "1px solid var(--t-border)" }}>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded-lg text-xs font-mono font-bold" style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)" }}>
                                  {op.airlineIata ?? "?"}
                                </span>
                                <span className="text-xs font-semibold truncate max-w-[100px]" style={{ color: "var(--t-text)" }}>{op.airlineName ?? "—"}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded-lg text-xs font-mono font-bold" style={{ background: "var(--t-accent2-dim)", color: "var(--t-accent2)" }}>
                                  {op.airportIata ?? "?"}
                                </span>
                                <span className="text-xs truncate max-w-[80px]" style={{ color: "var(--t-text-sub)" }}>{op.airportCity ?? ""}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              {op.firmsCode ? (
                                <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                                  {op.firmsCode}
                                </span>
                              ) : <span className="text-xs italic" style={{ color: "var(--t-text-muted)" }}>—</span>}
                            </td>
                            <td className="px-3 py-3 text-xs font-mono" style={{ color: "var(--t-text)" }}>{op.iscAmount ?? "—"}</td>
                            <td className="px-3 py-3 text-xs" style={{ color: "var(--t-text-sub)" }}>{op.iscPayableTo ?? "—"}</td>
                            <td className="px-3 py-3 text-xs" style={{ color: "var(--t-text-sub)" }}>
                              {op.contactNumber || op.contactEmail ? (
                                <div>
                                  {op.contactNumber && <div>{op.contactNumber}</div>}
                                  {op.contactEmail && <div className="truncate max-w-[120px]">{op.contactEmail}</div>}
                                </div>
                              ) : "—"}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(op)} className="p-1.5 rounded-lg transition-all" style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)" }}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDelete(op.id)} className="p-1.5 rounded-lg transition-all" style={{ background: "rgba(244,63,94,0.1)", color: "#f43f5e" }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* ── By Airline Mode ── */
          <>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search airline name or IATA..." className="pl-9" value={airlineSearch} onChange={e => setAirlineSearch(e.target.value)} />
            </div>

            {loading ? (
              <div className="text-center py-16" style={{ color: "var(--t-text-muted)" }}>Loading...</div>
            ) : uniqueAirlines.length === 0 ? (
              <div className="text-center py-16" style={{ color: "var(--t-text-muted)" }}>No airline operations found. Click "Add Operation" to get started.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {uniqueAirlines.map(([airlineId, info]) => (
                  <button
                    key={airlineId}
                    onClick={() => { setSelectedAirlineId(airlineId); setExpandedAirportId(null); setSelected(new Set()); }}
                    className="group flex flex-col items-center gap-3 p-4 border rounded-2xl hover:shadow-lg active:scale-95 transition-all duration-200 text-left"
                    style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", borderColor: "var(--t-border)" }}
                  >
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold font-mono text-lg shadow group-hover:scale-110 transition-transform">
                      {info.iata}
                    </div>
                    <div className="text-center w-full">
                      <p className="font-semibold text-sm line-clamp-2 leading-tight" style={{ color: "var(--t-text)" }}>{info.name}</p>
                      <p className="text-xs mt-1">
                        {info.count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-orange-700" style={{ background: "rgba(234,88,12,0.12)" }}>
                            <Building2 className="h-3 w-3" /> {info.count} airport{info.count !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium" style={{ color: "var(--t-text-muted)", background: "var(--t-card)" }}>
                            No airports
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <OperationModal
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
          editing={editing} form={form} saving={saving}
          airlinesQ={airlinesQ}
          onAirportChange={(id: string) => setForm(prev => ({ ...prev, airportId: id }))}
          f={f} handleSave={handleSave}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // LEVEL 2 — Airport list for selected airline
  // ──────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Breadcrumb + header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={() => { setSelectedAirlineId(null); setExpandedAirportId(null); setSelected(new Set()); }}
          className="flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-800 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          All Airlines
        </button>
        <span className="text-muted-foreground hidden sm:inline">/</span>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold font-mono text-xs">
            {selectedAirlineInfo?.iata}
          </div>
          <span className="font-bold text-lg text-foreground">{selectedAirlineInfo?.name}</span>
          <Badge variant="outline" className="text-xs border-sky-300 text-sky-700">{selectedAirlineInfo?.iata}</Badge>
        </div>
        <div className="sm:ml-auto">
          <Button variant="primary" onClick={() => openCreate(selectedAirlineId!)} className="hover:scale-105 active:scale-95 transition-all">
            <Plus className="h-4 w-4 mr-2" /> Add Airport
          </Button>
        </div>
      </div>

      {/* Bulk delete bar */}
      {someSelected && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <CheckSquare className="h-4 w-4 text-red-500" />
          <span className="text-sm font-semibold text-red-700">{selected.size} selected</span>
          <button
            onClick={bulkDelete}
            disabled={bulkLoading}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {bulkLoading ? "Deleting..." : "Delete Selected"}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-slate-600 px-2">Clear</button>
        </div>
      )}

      {/* Airport rows */}
      {airlineOps.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-muted-foreground">No airports linked yet. Click "Add Airport" to add one.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {/* Select all */}
          <div className="flex items-center gap-2 px-1">
            <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleAll} className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>

          {airlineOps.map(op => (
            <div key={op.id} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-sky-200 transition-all">
              {/* Row header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpandedAirportId(expandedAirportId === op.id ? null : op.id)}
              >
                <div onClick={e => { e.stopPropagation(); toggleOne(op.id); }}>
                  <input
                    type="checkbox"
                    checked={selected.has(op.id)}
                    onChange={() => toggleOne(op.id)}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                </div>

                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm shrink-0 ${op.airportId ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-400"}`}>
                  {op.airportIata ?? "—"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{op.airportName ?? <span className="text-slate-400 italic">No airport assigned</span>}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {op.airportId ? ([op.airportCity, op.airportState].filter(Boolean).join(", ") || "—") : "Click edit to assign an airport"}
                  </p>
                </div>

                {/* Summary chips */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  {op.firmsCode && (
                    <span className="flex items-center gap-1 text-xs font-mono bg-sky-100 text-sky-700 px-2.5 py-1 rounded-lg font-semibold">
                      <Hash className="h-3 w-3" /> {op.firmsCode}
                    </span>
                  )}
                  {op.iscAmount && (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg font-semibold">
                      <DollarSign className="h-3 w-3" /> {op.iscAmount}
                    </span>
                  )}
                  {op.iscPayableTo && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg font-medium truncate max-w-[120px]">
                      {op.iscPayableTo}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    title="Edit"
                    onClick={() => openEdit(op)}
                    className="p-2 rounded-xl text-sky-600 hover:bg-sky-100 hover:text-sky-800 active:scale-90 transition-all"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => handleDelete(op.id)}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-100 hover:text-red-700 active:scale-90 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ── LEVEL 3: Expanded detail panel ── */}
              {expandedAirportId === op.id && (
                <div className="border-t border-border bg-slate-50 px-5 py-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <DetailCard color="sky" label="FIRMS Code" value={op.firmsCode} icon={<Hash className="h-4 w-4" />} />
                    <DetailCard color="green" label="ISC Amount" value={op.iscAmount ? `$${op.iscAmount}` : null} icon={<DollarSign className="h-4 w-4" />} />
                    <DetailCard color="orange" label="ISC Payable At" value={op.iscPayableAt} icon={<Building2 className="h-4 w-4" />} />
                    <DetailCard color="purple" label="ISC Payable To" value={op.iscPayableTo} icon={<Plane className="h-4 w-4" />} />
                  </div>

                  {(op.contactNumber || op.contactEmail) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {op.contactNumber && (
                        <div className="bg-white rounded-xl border border-border p-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-sky-500" /> Contact Number
                          </p>
                          {op.contactNumber.split(/\n|\//).map((n, i) => (
                            <p key={i} className="text-sm text-foreground font-mono">{n.trim()}</p>
                          ))}
                        </div>
                      )}
                      {op.contactEmail && (
                        <div className="bg-white rounded-xl border border-border p-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-sky-500" /> Email Address
                          </p>
                          {op.contactEmail.split(/;|,/).map((e, i) => (
                            <a key={i} href={`mailto:${e.trim()}`} className="block text-sm text-sky-600 hover:underline truncate">{e.trim()}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {op.notes && (
                    <div className="bg-white rounded-xl border border-border p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm text-foreground">{op.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => openEdit(op)}
                      className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit This Record
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <OperationModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        editing={editing} form={form} saving={saving}
        airlinesQ={airlinesQ}
        onAirportChange={(id: string) => setForm(prev => ({ ...prev, airportId: id }))}
        f={f} handleSave={handleSave}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// Helper components
// ──────────────────────────────────────────────

function DetailCard({ color, label, value, icon }: { color: string; label: string; value: string | null | undefined; icon: React.ReactNode }) {
  const colors: Record<string, string> = {
    sky: "bg-sky-50 border-sky-200 text-sky-700",
    green: "bg-green-50 border-green-200 text-green-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color] ?? colors.sky}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-70">{icon}<span className="text-xs font-semibold uppercase tracking-wider">{label}</span></div>
      <p className="text-sm font-bold">{value || <span className="font-normal opacity-50">—</span>}</p>
    </div>
  );
}

function OperationModal({ isOpen, onClose, editing, form, saving, airlinesQ, onAirportChange, f, handleSave }: any) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? "Edit Operation Record" : "Add Airline Operation"}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Airline *</Label>
            <Select value={form.airlineId} onChange={f("airlineId")} className="hover:border-sky-400 transition-colors">
              <option value="">— Select Airline —</option>
              {airlinesQ.data?.data.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name} ({a.iataCode})</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Airport</Label>
            <SearchableAirportSelect
              value={form.airportId}
              onChange={onAirportChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>FIRMS Code</Label>
            <Input value={form.firmsCode} onChange={f("firmsCode")} placeholder="e.g. F670" className="uppercase hover:border-sky-400 transition-colors" />
          </div>
          <div className="space-y-2">
            <Label>ISC Amount ($)</Label>
            <Input value={form.iscAmount} onChange={f("iscAmount")} placeholder="e.g. 180.50 or 75–105" className="hover:border-green-400 transition-colors" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>ISC Payable At</Label>
            <Input value={form.iscPayableAt} onChange={f("iscPayableAt")} placeholder="e.g. Epic, Cargo Sprint" className="hover:border-orange-400 transition-colors" />
          </div>
          <div className="space-y-2">
            <Label>ISC Payable To (Ground Handler)</Label>
            <Input value={form.iscPayableTo} onChange={f("iscPayableTo")} placeholder="e.g. WFS, Alliance Ground" className="hover:border-purple-400 transition-colors" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Contact Number(s)</Label>
          <Input value={form.contactNumber} onChange={f("contactNumber")} placeholder="e.g. 718-656-3980 / 718-880-3417" className="hover:border-sky-400 transition-colors" />
        </div>

        <div className="space-y-2">
          <Label>Contact Email(s)</Label>
          <Input value={form.contactEmail} onChange={f("contactEmail")} placeholder="e.g. ekimport@wfs.aero" className="hover:border-sky-400 transition-colors" />
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <textarea
            value={form.notes}
            onChange={f("notes")}
            placeholder="Any additional notes..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-primary/50 transition-colors resize-none"
          />
        </div>

        <div className="pt-3 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-red-50 hover:text-red-600 transition-all">Cancel</Button>
          <Button type="button" variant="primary" onClick={handleSave} isLoading={saving} className="hover:scale-105 active:scale-95 transition-all">
            {editing ? "Save Changes" : "Create Record"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
