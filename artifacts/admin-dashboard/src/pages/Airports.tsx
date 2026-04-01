import { useState } from "react";
import { useListAirports, useUpdateAirportStatus, useCreateAirport, useUpdateAirport, useDeleteAirport, Airport, AirportStatus, CreateAirportRequest, UpdateAirportRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Input, Modal, Label } from "@/components/ui";
import { Search, Plus, Edit2, Trash2, Check, X, MapPin, CheckSquare, ChevronsUpDown, MoreVertical, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  iataCode: z.string().optional().nullable(),
  cbpPortCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  customsApproved: z.boolean().default(false),
  source: z.string().optional().nullable(),
});

const PAGE_SIZES = [16, 32, 48, 96, 150];

function statusInfo(status: string, flagged: boolean) {
  if (flagged) return { label: "Restricted", dot: "#dc2626", border: "#dc2626" };
  if (status === "approved") return { label: "Approved", dot: "#059669", border: "#059669" };
  if (status === "rejected") return { label: "Rejected", dot: "#dc2626", border: "#dc2626" };
  return { label: "Pending", dot: "#f59e0b", border: "#f59e0b" };
}

function AirportCard({
  airport, selected, onToggle, onEdit, onDelete, onStatus
}: {
  airport: Airport; selected: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
  onStatus: (s: "approved" | "rejected") => void;
}) {
  const { label, dot, border } = statusInfo(airport.status, airport.flaggedForReview);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = [airport.city, airport.state, airport.country].filter(Boolean).join(", ");
  const codes = [airport.iataCode, airport.cbpPortCode ? `CBP:${airport.cbpPortCode}` : null].filter(Boolean).join(" / ");

  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        border: selected ? `1.5px solid ${border}` : "1px solid rgba(11,33,71,0.09)",
        borderLeft: `3px solid ${border}`,
        boxShadow: selected ? `0 0 0 3px ${border}22` : "0 1px 6px rgba(11,33,71,0.05)",
      }}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {codes && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold"
                style={{ background: "rgba(11,33,71,0.05)", color: "#0b2147", border: "1px solid rgba(11,33,71,0.12)" }}>
                {codes}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ color: dot }}>
              <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: dot }} />
              {label}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <input type="checkbox" checked={selected} onChange={onToggle}
              className="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600 cursor-pointer" />
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)}
                className="h-6 w-6 flex items-center justify-center rounded-lg"
                style={{ color: "rgba(11,33,71,0.30)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(11,33,71,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-20 bg-white rounded-xl shadow-xl overflow-hidden w-36"
                  style={{ border: "1px solid rgba(11,33,71,0.10)" }}
                  onMouseLeave={() => setMenuOpen(false)}>
                  {airport.status !== "approved" && (
                    <button onClick={() => { onStatus("approved"); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold hover:bg-emerald-50"
                      style={{ color: "#059669" }}>
                      <Check className="h-3 w-3" /> Approve
                    </button>
                  )}
                  {airport.status !== "rejected" && (
                    <button onClick={() => { onStatus("rejected"); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold hover:bg-red-50"
                      style={{ color: "#dc2626" }}>
                      <X className="h-3 w-3" /> Reject
                    </button>
                  )}
                  <button onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold hover:bg-blue-50"
                    style={{ color: "#3b5fad" }}>
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold hover:bg-red-50"
                    style={{ color: "#dc2626", borderTop: "1px solid rgba(11,33,71,0.06)" }}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Airport name */}
        <h3 className="text-[16px] font-black leading-tight mb-1" style={{ color: "#0b2147" }}>{airport.name}</h3>

        {/* Location */}
        {location && (
          <p className="text-[12px] font-medium mb-3" style={{ color: "rgba(11,33,71,0.50)" }}>{location}</p>
        )}

        {/* Registry ID / CBP Port */}
        {airport.cbpPortCode && (
          <div className="mb-2">
            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(11,33,71,0.35)" }}>Registry ID</p>
            <p className="text-[12px] font-bold font-mono" style={{ color: "#0b2147" }}>REG-{airport.cbpPortCode}</p>
          </div>
        )}

        {/* Customs Access */}
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold"
            style={airport.customsApproved
              ? { background: "rgba(5,150,105,0.10)", color: "#059669", border: "1px solid rgba(5,150,105,0.22)" }
              : { background: "rgba(11,33,71,0.06)", color: "rgba(11,33,71,0.45)", border: "1px solid rgba(11,33,71,0.10)" }}>
            Customs Access {airport.customsApproved ? "Yes / 24H" : "No Entry"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(11,33,71,0.06)", background: "rgba(11,33,71,0.02)" }}>
        <button onClick={onEdit}
          className="text-[11px] font-bold flex items-center gap-1 transition-colors"
          style={{ color: "#3b5fad" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          <MapPin className="h-3 w-3" /> VIEW MAP
        </button>
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

export default function Airports() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AirportStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(16);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirport, setEditingAirport] = useState<Airport | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [allFilterSelected, setAllFilterSelected] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const queryClient = useQueryClient();
  const { data, isLoading } = useListAirports({ search, status: statusFilter as any, page, limit });

  const createMut = useCreateAirport({ mutation: { onSuccess: () => { toast.success("Airport created"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); closeModal(); }, onError: (err: any) => toast.error(err.message) }});
  const updateMut = useUpdateAirport({ mutation: { onSuccess: () => { toast.success("Airport updated"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); closeModal(); }, onError: (err: any) => toast.error(err.message) }});
  const deleteMut = useDeleteAirport({ mutation: { onSuccess: () => { toast.success("Airport deleted"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); }, onError: (err: any) => toast.error(err.message) }});
  const statusMut = useUpdateAirportStatus({ mutation: { onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); }, onError: (err: any) => toast.error(err.message) }});

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", iataCode: "", cbpPortCode: "", city: "", state: "", country: "", customsApproved: false, source: "manual" }
  });

  const openModal = (airport?: Airport) => {
    if (airport) { setEditingAirport(airport); reset({ name: airport.name, iataCode: airport.iataCode, cbpPortCode: airport.cbpPortCode, city: airport.city, state: airport.state, country: airport.country, customsApproved: airport.customsApproved, source: airport.source }); }
    else { setEditingAirport(null); reset({ name: "", iataCode: "", cbpPortCode: "", city: "", state: "", country: "", customsApproved: false, source: "manual" }); }
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingAirport(null); };
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingAirport) updateMut.mutate({ id: editingAirport.id, data: values as UpdateAirportRequest });
    else createMut.mutate({ data: values as CreateAirportRequest });
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
      const res = await fetch(`/api/airports/all-ids?${params}`);
      const json = await res.json();
      setSelected(new Set(json.ids));
      setAllFilterSelected(true);
      toast.success(`Selected all ${json.total} airports`);
    } catch { toast.error("Failed to select all"); }
    setBulkLoading(false);
  };

  const toggleOne = (id: number) => { setAllFilterSelected(false); setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  const bulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/airports/bulk-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected), status: "approved" }) });
      const json = await res.json();
      toast.success(`Approved ${json.updated} airport(s)`);
      setSelected(new Set()); setAllFilterSelected(false);
      queryClient.invalidateQueries({ queryKey: ["/api/airports"] });
    } catch { toast.error("Bulk approve failed"); }
    setBulkLoading(false);
  };

  const bulkReject = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/airports/bulk-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected), status: "rejected" }) });
      const json = await res.json();
      toast.success(`Rejected ${json.updated} airport(s)`);
      setSelected(new Set()); setAllFilterSelected(false);
      queryClient.invalidateQueries({ queryKey: ["/api/airports"] });
    } catch { toast.error("Bulk reject failed"); }
    setBulkLoading(false);
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Permanently delete ${selected.size} airport(s)?`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/airports/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected) }) });
      const json = await res.json();
      toast.success(`Deleted ${json.deleted} airport(s)`);
      setSelected(new Set()); setAllFilterSelected(false);
      queryClient.invalidateQueries({ queryKey: ["/api/airports"] });
    } catch { toast.error("Bulk delete failed"); }
    setBulkLoading(false);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black" style={{ color: "#0b2147" }}>Airports Registry</h1>
          <p className="text-[12px] font-medium mt-0.5" style={{ color: "rgba(11,33,71,0.45)" }}>
            Global Database • {isLoading ? "..." : data?.total ?? 0} Entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all hover:-translate-y-0.5"
            style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147", border: "1px solid rgba(11,33,71,0.10)" }}>
            <Download className="h-3.5 w-3.5" /> Export Data
          </button>
          <button onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "#0b2147", boxShadow: "0 4px 16px rgba(11,33,71,0.25)" }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.15)"}
            onMouseLeave={e => e.currentTarget.style.filter = ""}>
            <Plus className="h-4 w-4" /> Add Airport
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center gap-3"
        style={{ border: "1px solid rgba(11,33,71,0.08)" }}>
        <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: "rgba(11,33,71,0.04)" }}>
          {[{ value: "", label: "All Entries" }, { value: "approved", label: "Approved" }, { value: "pending", label: "Pending" }, { value: "rejected", label: "Rejected" }].map(opt => (
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

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "rgba(11,33,71,0.35)" }} />
          <input
            placeholder="Search airports, codes, or locations..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] font-medium outline-none transition-all"
            style={{ background: "rgba(11,33,71,0.04)", border: "1px solid rgba(11,33,71,0.08)", color: "#0b2147" }}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); setSelected(new Set()); setAllFilterSelected(false); }}
            onFocus={e => e.target.style.borderColor = "#3b5fad"}
            onBlur={e => e.target.style.borderColor = "rgba(11,33,71,0.08)"}
          />
        </div>

        <div className="relative w-32">
          <ChevronsUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 z-10" style={{ color: "rgba(11,33,71,0.35)" }} />
          <select
            className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] font-medium outline-none appearance-none cursor-pointer"
            style={{ background: "rgba(11,33,71,0.04)", border: "1px solid rgba(11,33,71,0.08)", color: "#0b2147" }}
            value={String(limit)} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
            {PAGE_SIZES.map(n => <option key={n} value={n}>Show {n}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.15)" }}>
          <input type="checkbox" checked={allPageSelected}
            ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
            onChange={toggleAll} className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
          <CheckSquare className="h-4 w-4 shrink-0" style={{ color: "#059669" }} />
          <span className="text-sm font-bold" style={{ color: "#059669" }}>{selected.size} selected</span>
          {!allFilterSelected && data && selected.size < data.total && (
            <button onClick={selectAllInFilter} disabled={bulkLoading}
              className="text-xs font-semibold underline disabled:opacity-50"
              style={{ color: "#059669" }}>
              Select all {data.total}
            </button>
          )}
          {allFilterSelected && <span className="text-xs italic" style={{ color: "rgba(5,150,105,0.60)" }}>All {selected.size} selected</span>}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" style={{ border: "1px solid rgba(11,33,71,0.08)" }} />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center" style={{ border: "1px solid rgba(11,33,71,0.08)" }}>
          <p className="text-[15px] font-bold mb-1" style={{ color: "#0b2147" }}>No airports found</p>
          <p className="text-[13px]" style={{ color: "rgba(11,33,71,0.45)" }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(data?.data ?? []).map(airport => (
            <AirportCard
              key={airport.id}
              airport={airport}
              selected={selected.has(airport.id)}
              onToggle={() => toggleOne(airport.id)}
              onEdit={() => openModal(airport)}
              onDelete={() => { if (confirm("Delete airport?")) deleteMut.mutate({ id: airport.id }); }}
              onStatus={s => statusMut.mutate({ id: airport.id, data: { status: s } })}
            />
          ))}
          {/* Expand Database placeholder */}
          <button onClick={() => openModal()}
            className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ border: "2px dashed rgba(11,33,71,0.12)", minHeight: 200 }}>
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(11,33,71,0.04)", border: "1.5px dashed rgba(11,33,71,0.18)" }}>
              <Plus className="h-6 w-6" style={{ color: "rgba(11,33,71,0.30)" }} />
            </div>
            <div className="text-center">
              <p className="text-[12px] font-bold" style={{ color: "rgba(11,33,71,0.40)" }}>Expand Database</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(11,33,71,0.28)" }}>Bulk upload airport registry files via CSV or JSON format</p>
            </div>
          </button>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-[12px] font-semibold" style={{ color: "rgba(11,33,71,0.45)" }}>
            Showing {((page-1)*limit)+1}–{Math.min(page*limit, data.total)} of {data.total} entries
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40"
              style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147" }}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (pg > totalPages) return null;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className="h-9 w-9 rounded-xl text-[12px] font-bold transition-all"
                  style={pg === page ? { background: "#0b2147", color: "white" } : { background: "rgba(11,33,71,0.06)", color: "#0b2147" }}>
                  {pg}
                </button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40"
              style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147" }}>Next →</button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingAirport ? "Edit Airport" : "Add Airport"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Facility Name *</Label>
            <Input {...register("name")} />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>IATA Code</Label><Input {...register("iataCode")} className="uppercase" /></div>
            <div className="space-y-2"><Label>CBP Port Code</Label><Input {...register("cbpPortCode")} className="uppercase" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label>City</Label><Input {...register("city")} /></div>
            <div className="space-y-2"><Label>State</Label><Input {...register("state")} /></div>
            <div className="space-y-2"><Label>Country</Label><Input {...register("country")} /></div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(11,33,71,0.04)", border: "1px solid rgba(11,33,71,0.08)" }}>
            <input type="checkbox" id="customs" {...register("customsApproved")} className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
            <Label htmlFor="customs" className="cursor-pointer">Customs Facility Approved</Label>
          </div>
          <div className="pt-3 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMut.isPending || updateMut.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
