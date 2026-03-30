import { useState, useEffect } from "react";
import { useListAirlines, useUpdateAirlineStatus, useCreateAirline, useUpdateAirline, useDeleteAirline, Airline, AirlineStatus, CreateAirlineRequest, UpdateAirlineRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Input, Select, Modal, Label } from "@/components/ui";
import { Search, Plus, Edit2, Trash2, Check, X, Filter, CheckSquare, ChevronsUpDown, Hash, Globe, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  iataCode: z.string().optional().nullable(),
  cbpCode: z.string().optional().nullable(),
  icaoCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

const PAGE_SIZES = [18, 36, 54, 108];

function statusBadge(status: string, flagged: boolean) {
  if (flagged) return { label: "Action Required", bg: "rgba(239,68,68,0.12)", color: "#dc2626", border: "rgba(239,68,68,0.25)" };
  if (status === "approved") return { label: "Approved", bg: "rgba(5,150,105,0.10)", color: "#059669", border: "rgba(5,150,105,0.25)" };
  if (status === "rejected") return { label: "Rejected", bg: "rgba(239,68,68,0.10)", color: "#dc2626", border: "rgba(239,68,68,0.22)" };
  return { label: "Pending", bg: "rgba(245,158,11,0.10)", color: "#d97706", border: "rgba(245,158,11,0.25)" };
}

function AirlineCard({
  airline, firmsMap, selected, onToggle, onEdit, onDelete, onStatus,
}: {
  airline: Airline;
  firmsMap: Map<number, string[]>;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatus: (s: "approved" | "rejected") => void;
}) {
  const badge = statusBadge(airline.status, airline.flaggedForReview);
  const initials = airline.iataCode?.toUpperCase() || airline.name.slice(0, 2).toUpperCase();
  const firms = firmsMap.get(airline.id) ?? [];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        border: selected ? "1.5px solid #3b5fad" : "1px solid rgba(11,33,71,0.09)",
        boxShadow: selected ? "0 0 0 3px rgba(59,95,173,0.08)" : "0 1px 6px rgba(11,33,71,0.05)",
      }}>
      {/* Card header */}
      <div className="p-4 flex items-start gap-3">
        <input type="checkbox" checked={selected} onChange={onToggle}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer shrink-0" />

        {/* Airline avatar */}
        <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 font-black text-[15px] tracking-tight"
          style={{ background: "rgba(11,33,71,0.05)", color: "#0b2147", border: "1px solid rgba(11,33,71,0.08)" }}>
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-[14px] leading-tight truncate" style={{ color: "#0b2147" }}>{airline.name}</p>
              {airline.country && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Globe className="h-3 w-3" style={{ color: "rgba(11,33,71,0.35)" }} />
                  <p className="text-[11px]" style={{ color: "rgba(11,33,71,0.45)" }}>{airline.country}</p>
                </div>
              )}
            </div>
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen(v => !v)}
            className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "rgba(11,33,71,0.35)" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(11,33,71,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-xl overflow-hidden w-40"
              style={{ border: "1px solid rgba(11,33,71,0.10)" }}
              onMouseLeave={() => setMenuOpen(false)}>
              {airline.status !== "approved" && (
                <button onClick={() => { onStatus("approved"); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold hover:bg-emerald-50 transition-colors"
                  style={{ color: "#059669" }}>
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
              )}
              {airline.status !== "rejected" && (
                <button onClick={() => { onStatus("rejected"); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold hover:bg-red-50 transition-colors"
                  style={{ color: "#dc2626" }}>
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              )}
              <button onClick={() => { onEdit(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold hover:bg-blue-50 transition-colors"
                style={{ color: "#3b5fad" }}>
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={() => { onDelete(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold hover:bg-red-50 transition-colors"
                style={{ color: "#dc2626", borderTop: "1px solid rgba(11,33,71,0.06)" }}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Code fields */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        {[
          { label: "IATA", value: airline.iataCode },
          { label: "ICAO", value: airline.icaoCode },
          { label: "CBP ID", value: airline.cbpCode },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(11,33,71,0.03)", border: "1px solid rgba(11,33,71,0.07)" }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(11,33,71,0.35)" }}>{label}</p>
            <p className="text-[13px] font-black font-mono" style={{ color: value ? "#0b2147" : "rgba(11,33,71,0.25)" }}>{value || "--"}</p>
          </div>
        ))}
      </div>

      {/* FIRMS codes */}
      {firms.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {firms.map(code => (
            <span key={code} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
              style={{ background: "rgba(5,150,105,0.10)", color: "#059669", border: "1px solid rgba(5,150,105,0.20)" }}>
              {code}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(11,33,71,0.06)", background: "rgba(11,33,71,0.02)" }}>
        <p className="text-[10px]" style={{ color: "rgba(11,33,71,0.35)" }}>
          Last updated: {formatDate(airline.lastUpdated)}
        </p>
        <div className="flex items-center gap-1">
          <button title="Edit" onClick={onEdit}
            className="p-1 rounded-lg transition-colors"
            style={{ color: "rgba(11,33,71,0.30)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#3b5fad"; e.currentTarget.style.background = "rgba(59,95,173,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(11,33,71,0.30)"; e.currentTarget.style.background = "transparent"; }}>
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button title="Delete" onClick={onDelete}
            className="p-1 rounded-lg transition-colors"
            style={{ color: "rgba(11,33,71,0.30)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(11,33,71,0.30)"; e.currentTarget.style.background = "transparent"; }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Airlines() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AirlineStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(18);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [allFilterSelected, setAllFilterSelected] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [firmsMap, setFirmsMap] = useState<Map<number, string[]>>(new Map());
  const [firmsSearch, setFirmsSearch] = useState("");
  const [firmsFilterIds, setFirmsFilterIds] = useState<Set<number> | null>(null);
  const [firmsLoading, setFirmsLoading] = useState(false);

  const queryClient = useQueryClient();
  const { data, isLoading } = useListAirlines({ search, status: statusFilter as any, page, limit });

  useEffect(() => {
    fetch(`${BASE}/api/airline-operations?limit=2000`).then(r => r.json()).then(json => {
      const map = new Map<number, string[]>();
      for (const op of json.data ?? []) {
        if (!op.airlineId || !op.firmsCode) continue;
        if (!map.has(op.airlineId)) map.set(op.airlineId, []);
        const list = map.get(op.airlineId)!;
        if (!list.includes(op.firmsCode)) list.push(op.firmsCode);
      }
      setFirmsMap(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const term = firmsSearch.trim();
    if (!term) { setFirmsFilterIds(null); return; }
    setFirmsLoading(true);
    fetch(`${BASE}/api/airline-operations?search=${encodeURIComponent(term)}&limit=500`).then(r => r.json()).then(json => {
      const ids = new Set<number>((json.data ?? []).filter((op: any) => op.firmsCode).map((op: any) => op.airlineId as number));
      setFirmsFilterIds(ids);
    }).catch(() => setFirmsFilterIds(new Set())).finally(() => setFirmsLoading(false));
  }, [firmsSearch]);

  const createMut = useCreateAirline({ mutation: { onSuccess: () => { toast.success("Airline created"); queryClient.invalidateQueries({ queryKey: ["/api/airlines"] }); closeModal(); }, onError: (err: any) => toast.error(err.message) }});
  const updateMut = useUpdateAirline({ mutation: { onSuccess: () => { toast.success("Airline updated"); queryClient.invalidateQueries({ queryKey: ["/api/airlines"] }); closeModal(); }, onError: (err: any) => toast.error(err.message) }});
  const deleteMut = useDeleteAirline({ mutation: { onSuccess: () => { toast.success("Airline deleted"); queryClient.invalidateQueries({ queryKey: ["/api/airlines"] }); }, onError: (err: any) => toast.error(err.message) }});
  const statusMut = useUpdateAirlineStatus({ mutation: { onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["/api/airlines"] }); }, onError: (err: any) => toast.error(err.message) }});

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", iataCode: "", cbpCode: "", icaoCode: "", country: "", source: "manual" }
  });

  const openModal = (airline?: Airline) => {
    if (airline) { setEditingAirline(airline); reset({ name: airline.name, iataCode: airline.iataCode, cbpCode: airline.cbpCode, icaoCode: airline.icaoCode, country: airline.country, source: airline.source }); }
    else { setEditingAirline(null); reset({ name: "", iataCode: "", cbpCode: "", icaoCode: "", country: "", source: "manual" }); }
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingAirline(null); };
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingAirline) updateMut.mutate({ id: editingAirline.id, data: values as UpdateAirlineRequest });
    else createMut.mutate({ data: values as CreateAirlineRequest });
  };

  const pageIds = data?.data.map(a => a.id) ?? [];
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const somePageSelected = pageIds.some(id => selected.has(id));

  const toggleAll = () => {
    if (allPageSelected) { setSelected(new Set()); setAllFilterSelected(false); }
    else { setSelected(s => { const n = new Set(s); pageIds.forEach(id => n.add(id)); return n; }); }
  };

  const selectAllInFilter = async () => {
    setBulkLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/airlines/all-ids?${params}`);
      const json = await res.json();
      setSelected(new Set(json.ids));
      setAllFilterSelected(true);
      toast.success(`Selected all ${json.total} airlines`);
    } catch { toast.error("Failed to select all"); }
    setBulkLoading(false);
  };

  const toggleOne = (id: number) => { setAllFilterSelected(false); setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  const bulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/airlines/bulk-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected), status: "approved" }) });
      const json = await res.json();
      toast.success(`Approved ${json.updated} airline(s)`);
      setSelected(new Set()); setAllFilterSelected(false);
      queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
    } catch { toast.error("Bulk approve failed"); }
    setBulkLoading(false);
  };

  const bulkReject = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/airlines/bulk-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected), status: "rejected" }) });
      const json = await res.json();
      toast.success(`Rejected ${json.updated} airline(s)`);
      setSelected(new Set()); setAllFilterSelected(false);
      queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
    } catch { toast.error("Bulk reject failed"); }
    setBulkLoading(false);
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Permanently delete ${selected.size} airline(s)?`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/airlines/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected) }) });
      const json = await res.json();
      toast.success(`Deleted ${json.deleted} airline(s)`);
      setSelected(new Set()); setAllFilterSelected(false);
      queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
    } catch { toast.error("Bulk delete failed"); }
    setBulkLoading(false);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const visibleAirlines = (data?.data ?? []).filter(a => firmsFilterIds === null || firmsFilterIds.has(a.id));

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(11,33,71,0.40)" }}>
            Global Operator Index
          </p>
          <h1 className="text-[22px] font-black" style={{ color: "#0b2147" }}>Airlines Registry</h1>
        </div>
        <button onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: "#0b2147", boxShadow: "0 4px 16px rgba(11,33,71,0.25)" }}
          onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.15)"}
          onMouseLeave={e => e.currentTarget.style.filter = ""}>
          <Plus className="h-4 w-4" /> Add Airline
        </button>
      </div>

      {/* Filters row */}
      <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
        style={{ border: "1px solid rgba(11,33,71,0.08)" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "rgba(11,33,71,0.35)" }} />
          <input
            placeholder="Search airlines, ICAO, or regions..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] font-medium outline-none transition-all"
            style={{ background: "rgba(11,33,71,0.04)", border: "1px solid rgba(11,33,71,0.08)", color: "#0b2147" }}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); setSelected(new Set()); setAllFilterSelected(false); }}
            onFocus={e => e.target.style.borderColor = "#3b5fad"}
            onBlur={e => e.target.style.borderColor = "rgba(11,33,71,0.08)"}
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 z-10" style={{ color: "#059669" }} />
          <input
            placeholder="Filter by FIRMS code..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] font-mono outline-none transition-all"
            style={{ background: "rgba(11,33,71,0.04)", border: "1px solid rgba(11,33,71,0.08)", color: "#0b2147" }}
            value={firmsSearch}
            onChange={e => { setFirmsSearch(e.target.value); setPage(1); }}
            onFocus={e => e.target.style.borderColor = "#059669"}
            onBlur={e => e.target.style.borderColor = "rgba(11,33,71,0.08)"}
          />
          {firmsLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs animate-pulse" style={{ color: "#059669" }}>…</span>}
          {firmsSearch && !firmsLoading && (
            <button onClick={() => { setFirmsSearch(""); setFirmsFilterIds(null); }} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(11,33,71,0.35)" }}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(11,33,71,0.04)" }}>
          {[{ value: "", label: "All" }, { value: "approved", label: "Approved" }, { value: "pending", label: "Pending" }].map(opt => (
            <button key={opt.value}
              onClick={() => { setStatusFilter(opt.value as any); setPage(1); setSelected(new Set()); setAllFilterSelected(false); }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all"
              style={statusFilter === opt.value
                ? { background: "#0b2147", color: "white" }
                : { color: "rgba(11,33,71,0.50)" }}>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-32">
          <ChevronsUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 z-10" style={{ color: "rgba(11,33,71,0.35)" }} />
          <select
            className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] font-medium outline-none appearance-none cursor-pointer"
            style={{ background: "rgba(11,33,71,0.04)", border: "1px solid rgba(11,33,71,0.08)", color: "#0b2147" }}
            value={String(limit)} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
            {PAGE_SIZES.map(n => <option key={n} value={n}>Show {n}</option>)}
          </select>
        </div>
      </div>

      {/* FIRMS filter notice */}
      {firmsFilterIds !== null && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium"
          style={{ background: "rgba(5,150,105,0.08)", color: "#059669", border: "1px solid rgba(5,150,105,0.20)" }}>
          <Hash className="h-4 w-4 shrink-0" />
          {firmsFilterIds.size === 0
            ? `No airlines found with FIRMS code matching "${firmsSearch}"`
            : `${firmsFilterIds.size} airline${firmsFilterIds.size !== 1 ? "s" : ""} with FIRMS code matching "${firmsSearch}"`}
          <button onClick={() => { setFirmsSearch(""); setFirmsFilterIds(null); }} className="ml-auto text-xs underline">Clear</button>
        </div>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(59,95,173,0.06)", border: "1px solid rgba(59,95,173,0.15)" }}>
          <input type="checkbox" checked={allPageSelected}
            ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
            onChange={toggleAll} className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
          <CheckSquare className="h-4 w-4 shrink-0" style={{ color: "#3b5fad" }} />
          <span className="text-sm font-bold" style={{ color: "#3b5fad" }}>{selected.size} selected</span>
          {!allFilterSelected && data && selected.size < data.total && (
            <button onClick={selectAllInFilter} disabled={bulkLoading}
              className="text-xs font-semibold underline underline-offset-2 disabled:opacity-50"
              style={{ color: "#3b5fad" }}>
              Select all {data.total}
            </button>
          )}
          {allFilterSelected && (
            <span className="text-xs italic" style={{ color: "rgba(59,95,173,0.60)" }}>All {selected.size} selected</span>
          )}
          <button onClick={bulkApprove} disabled={bulkLoading} className="btn-success ml-auto flex items-center gap-1.5 disabled:opacity-50">
            <Check className="h-3.5 w-3.5" />{bulkLoading ? "Processing..." : "Approve All"}
          </button>
          <button onClick={bulkReject} disabled={bulkLoading} className="btn-danger flex items-center gap-1.5 disabled:opacity-50">
            <X className="h-3.5 w-3.5" />Reject All
          </button>
          <button onClick={bulkDelete} disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #475569, #1e293b)" }}
            onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}>
            <Trash2 className="h-3.5 w-3.5" />Delete All
          </button>
          <button onClick={() => { setSelected(new Set()); setAllFilterSelected(false); }}
            className="text-xs font-semibold px-2" style={{ color: "rgba(11,33,71,0.40)" }}>Clear</button>
        </div>
      )}

      {/* Card grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" style={{ border: "1px solid rgba(11,33,71,0.08)" }} />
          ))}
        </div>
      ) : visibleAirlines.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center" style={{ border: "1px solid rgba(11,33,71,0.08)" }}>
          <p className="text-[15px] font-bold mb-1" style={{ color: "#0b2147" }}>No records found</p>
          <p className="text-[13px]" style={{ color: "rgba(11,33,71,0.45)" }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleAirlines.map(airline => (
            <AirlineCard
              key={airline.id}
              airline={airline}
              firmsMap={firmsMap}
              selected={selected.has(airline.id)}
              onToggle={() => toggleOne(airline.id)}
              onEdit={() => openModal(airline)}
              onDelete={() => { if (confirm("Delete this airline?")) deleteMut.mutate({ id: airline.id }); }}
              onStatus={s => statusMut.mutate({ id: airline.id, data: { status: s } })}
            />
          ))}
          {/* Register New Entity placeholder */}
          <button onClick={() => openModal()}
            className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ border: "2px dashed rgba(11,33,71,0.12)", minHeight: 200 }}>
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(11,33,71,0.05)", border: "1.5px dashed rgba(11,33,71,0.18)" }}>
              <Plus className="h-6 w-6" style={{ color: "rgba(11,33,71,0.35)" }} />
            </div>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: "rgba(11,33,71,0.40)" }}>Register New Entity</p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(11,33,71,0.30)" }}>Initialize registry process for a new commercial operator</p>
            </div>
          </button>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-[12px] font-semibold" style={{ color: "rgba(11,33,71,0.45)" }}>
            Showing {((page-1)*limit)+1}–{Math.min(page*limit, data.total)} of {data.total} operators
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40"
              style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147" }}
              onMouseEnter={e => { if (page !== 1) e.currentTarget.style.background = "rgba(11,33,71,0.10)"; }}
              onMouseLeave={e => e.currentTarget.style.background = page !== 1 ? "rgba(11,33,71,0.06)" : "rgba(11,33,71,0.06)"}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (pg > totalPages) return null;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className="h-9 w-9 rounded-xl text-[12px] font-bold transition-all"
                  style={pg === page
                    ? { background: "#0b2147", color: "white" }
                    : { background: "rgba(11,33,71,0.06)", color: "#0b2147" }}>
                  {pg}
                </button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40"
              style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147" }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingAirline ? "Edit Airline" : "Register Airline"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Airline Name *</Label>
            <Input {...register("name")} placeholder="e.g. Delta Air Lines" />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>IATA Code</Label><Input {...register("iataCode")} placeholder="e.g. DL" className="uppercase" /></div>
            <div className="space-y-2"><Label>ICAO Code</Label><Input {...register("icaoCode")} placeholder="e.g. DAL" className="uppercase" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>CBP Code</Label><Input {...register("cbpCode")} placeholder="e.g. DL" /></div>
            <div className="space-y-2"><Label>Country</Label><Input {...register("country")} placeholder="e.g. US" /></div>
          </div>
          <div className="pt-3 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMut.isPending || updateMut.isPending}>
              {editingAirline ? "Save Changes" : "Create Record"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
