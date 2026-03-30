import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Modal, Label } from "@/components/ui";
import {
  Search, X, MessageSquarePlus, CheckCircle2, AlertCircle,
  Clock, ThumbsUp, ThumbsDown, Eye, ChevronLeft, ArrowRight, Trash2, SlidersHorizontal, Plus
} from "lucide-react";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface DataRequest {
  id: number;
  type: string;
  status: "pending" | "reviewed" | "approved" | "rejected";
  subject: string;
  details: string;
  airlineName: string | null;
  airlineIata: string | null;
  airportIata: string | null;
  firmsCode: string | null;
  contactName: string | null;
  contactEmail: string | null;
  additionalData: any;
  adminNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  new_airline: "New Airline",
  new_ground_handler: "New Ground Handler",
  firms_code: "FIRMS Code",
  isc_charges: "ISC Charges",
  payable_to: "Payable To",
  payable_by: "Payable By",
  contact_info: "Contact Info",
  other: "Other",
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string; sub: string }> = {
  pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)", icon: <Clock className="h-5 w-5" />, label: "Pending", sub: "Requires Immediate Action" },
  reviewed: { color: "#38bdf8", bg: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.22)", icon: <Eye className="h-5 w-5" />, label: "Reviewed", sub: "Under Assessment" },
  approved: { color: "#10b981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.22)", icon: <CheckCircle2 className="h-5 w-5" />, label: "Approved", sub: "Successfully Synced" },
  rejected: { color: "#f43f5e", bg: "rgba(244,63,94,0.10)", border: "rgba(244,63,94,0.22)", icon: <AlertCircle className="h-5 w-5" />, label: "Rejected", sub: "Invalid Schema" },
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).message || "Request failed");
  return data;
}

export default function Requests() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selected, setSelected] = useState<DataRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const QK = ["requests", search, statusFilter, typeFilter, page, limit];

  const { data, isLoading } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`${BASE}/api/requests?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: number; status?: string; adminNotes?: string }) =>
      apiFetch(`/api/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status, adminNotes }) }),
    onSuccess: (_, vars) => {
      toast.success(vars.status ? `Marked as ${vars.status}` : "Notes saved");
      qc.invalidateQueries({ queryKey: ["requests"] });
      if (selected && vars.status) setSelected(prev => prev ? { ...prev, status: vars.status as any } : null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/requests/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success("Request deleted"); setSelected(null); qc.invalidateQueries({ queryKey: ["requests"] }); },
    onError: (err: Error) => toast.error(err.message),
  });

  const stats = data?.stats;
  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const openDetail = (req: DataRequest) => { setSelected(req); setAdminNotes(req.adminNotes ?? ""); };

  /* ── Detail view ── */
  if (selected) {
    const st = STATUS_CONFIG[selected.status];
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-[13px] font-bold transition-opacity hover:opacity-70"
          style={{ color: "#3b5fad" }}>
          <ChevronLeft className="h-4 w-4" /> Back to Requests
        </button>

        <div className="bg-white rounded-2xl p-6 space-y-5"
          style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 2px 16px rgba(11,33,71,0.06)" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold"
                  style={{ background: "rgba(59,95,173,0.10)", color: "#3b5fad" }}>#{selected.id}</span>
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold"
                  style={{ background: "rgba(11,33,71,0.05)", color: "rgba(11,33,71,0.55)" }}>
                  {TYPE_LABELS[selected.type] ?? selected.type}
                </span>
              </div>
              <h2 className="text-[18px] font-black" style={{ color: "#0b2147" }}>{selected.subject}</h2>
              <p className="text-[12px] mt-1" style={{ color: "rgba(11,33,71,0.45)" }}>
                Submitted {formatDate(selected.submittedAt)}
                {selected.reviewedAt && ` · Reviewed ${formatDate(selected.reviewedAt)}`}
              </p>
            </div>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[13px] font-bold"
              style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {st.icon} {st.label}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(11,33,71,0.38)" }}>Details</p>
            <div className="rounded-xl p-4 text-[13px] leading-relaxed"
              style={{ background: "rgba(11,33,71,0.03)", border: "1px solid rgba(11,33,71,0.08)", color: "#0b2147" }}>
              {selected.details}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Airline", value: [selected.airlineName, selected.airlineIata].filter(Boolean).join(" ") },
              { label: "Airport IATA", value: selected.airportIata },
              { label: "FIRMS Code", value: selected.firmsCode },
              { label: "Contact Name", value: selected.contactName },
              { label: "Contact Email", value: selected.contactEmail },
            ].filter(f => f.value).map(f => (
              <div key={f.label} className="rounded-xl p-3"
                style={{ background: "rgba(11,33,71,0.03)", border: "1px solid rgba(11,33,71,0.08)" }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "rgba(11,33,71,0.38)" }}>{f.label}</p>
                <p className="text-[13px] font-semibold font-mono" style={{ color: "#0b2147" }}>{f.value}</p>
              </div>
            ))}
          </div>

          <div>
            <Label>Admin Notes</Label>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3}
              placeholder="Add internal notes about this request..."
              className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-[13px] focus:outline-none resize-none transition-all"
              style={{ background: "rgba(11,33,71,0.03)", border: "1px solid rgba(11,33,71,0.10)", color: "#0b2147" }}
              onFocus={e => e.target.style.borderColor = "#3b5fad"}
              onBlur={e => e.target.style.borderColor = "rgba(11,33,71,0.10)"} />
            <button className="mt-2 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all"
              style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147", border: "1px solid rgba(11,33,71,0.10)" }}
              onClick={() => patchMutation.mutate({ id: selected.id, adminNotes })}
              disabled={patchMutation.isPending}>
              Save Notes
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-4"
            style={{ borderTop: "1px solid rgba(11,33,71,0.07)" }}>
            <button onClick={() => patchMutation.mutate({ id: selected.id, status: "reviewed" })}
              disabled={patchMutation.isPending || selected.status === "reviewed"}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
              style={{ background: "rgba(56,189,248,0.12)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)" }}>
              <Eye className="h-4 w-4" /> Mark Reviewed
            </button>
            <button onClick={() => patchMutation.mutate({ id: selected.id, status: "approved" })}
              disabled={patchMutation.isPending || selected.status === "approved"}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
              style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
              <ThumbsUp className="h-4 w-4" /> Approve
            </button>
            <button onClick={() => patchMutation.mutate({ id: selected.id, status: "rejected" })}
              disabled={patchMutation.isPending || selected.status === "rejected"}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
              style={{ background: "rgba(244,63,94,0.10)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.22)" }}>
              <ThumbsDown className="h-4 w-4" /> Reject
            </button>
            <button onClick={() => { if (confirm("Delete this request permanently?")) deleteMutation.mutate(selected.id); }}
              disabled={deleteMutation.isPending}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all"
              style={{ color: "#f43f5e", border: "1px solid rgba(244,63,94,0.20)" }}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #059669, #047857)", boxShadow: "0 4px 16px rgba(5,150,105,0.30)" }}>
          <MessageSquarePlus className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "#059669" }}>Administrative Workspace</p>
          <h1 className="text-[20px] font-black leading-tight" style={{ color: "#0b2147" }}>Registry Data Management</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(11,33,71,0.50)" }}>
            Review and authorize incoming data requests for the AeroControl global registry. These updates affect real-time airline operations and ground handling routing across the network.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["pending", "reviewed", "approved", "rejected"] as const).map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => { setStatusFilter(statusFilter === s ? "" : s); setPage(1); }}
                className="bg-white rounded-2xl p-4 text-left flex items-start gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{
                  border: statusFilter === s ? `1.5px solid ${cfg.color}` : "1px solid rgba(11,33,71,0.08)",
                  boxShadow: statusFilter === s ? `0 0 0 3px ${cfg.color}18` : "0 1px 6px rgba(11,33,71,0.05)",
                }}>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                  {cfg.icon}
                </div>
                <div>
                  <p className="text-3xl font-black tabular-nums leading-none mb-1" style={{ color: cfg.color }}>
                    {stats[s]}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wide" style={{ color: "#0b2147" }}>{cfg.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: cfg.color }}>{cfg.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Requests Catalog */}
      <div className="bg-white rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 1px 6px rgba(11,33,71,0.05)" }}>

        {/* Catalog header */}
        <div className="px-5 py-4 flex items-center justify-between gap-3"
          style={{ borderBottom: "1px solid rgba(11,33,71,0.07)" }}>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(11,33,71,0.06)" }}>
              <MessageSquarePlus className="h-3.5 w-3.5" style={{ color: "rgba(11,33,71,0.45)" }} />
            </div>
            <h2 className="text-[14px] font-black" style={{ color: "#0b2147" }}>Requests Catalog</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "rgba(11,33,71,0.35)" }} />
              <input
                placeholder="Filter by ID or Airline..."
                className="pl-8 pr-3 py-2 rounded-xl text-[12px] outline-none w-52"
                style={{ background: "rgba(11,33,71,0.04)", border: "1px solid rgba(11,33,71,0.08)", color: "#0b2147" }}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                onFocus={e => e.target.style.borderColor = "#3b5fad"}
                onBlur={e => e.target.style.borderColor = "rgba(11,33,71,0.08)"}
              />
            </div>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl text-[12px] outline-none appearance-none cursor-pointer"
              style={{ background: "rgba(11,33,71,0.04)", border: "1px solid rgba(11,33,71,0.08)", color: "#0b2147" }}>
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all"
              style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147", border: "1px solid rgba(11,33,71,0.10)" }}>
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </button>
            {(search || statusFilter || typeFilter) && (
              <button onClick={() => { setSearch(""); setStatusFilter(""); setTypeFilter(""); setPage(1); }}
                className="p-2 rounded-xl text-[11px] transition-all"
                style={{ color: "#f43f5e", border: "1px solid rgba(244,63,94,0.20)" }}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(11,33,71,0.04)" }} />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center px-6">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center relative"
              style={{ background: "#0b2147" }}>
              <MessageSquarePlus className="h-10 w-10 text-white opacity-60" />
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400" />
            </div>
            <div>
              <p className="text-[17px] font-black mb-1" style={{ color: "#0b2147" }}>No requests found</p>
              <p className="text-[13px] max-w-xs" style={{ color: "rgba(11,33,71,0.45)" }}>
                There are currently no active data requests matching your filters. New requests from external handlers will appear here automatically.
              </p>
            </div>
            <button className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold text-white"
              style={{ background: "#0b2147", boxShadow: "0 4px 16px rgba(11,33,71,0.20)" }}>
              <Plus className="h-4 w-4" /> Create New Request
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(11,33,71,0.06)" }}>
            {data?.data.map((req: DataRequest) => {
              const st = STATUS_CONFIG[req.status];
              return (
                <button key={req.id} onClick={() => openDetail(req)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left transition-all group"
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(11,33,71,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div className="shrink-0 w-28">
                    <div className="text-[12px] font-mono font-bold" style={{ color: "#3b5fad" }}>#{req.id}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(11,33,71,0.45)" }}>
                      {TYPE_LABELS[req.type] ?? req.type}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] truncate" style={{ color: "#0b2147" }}>{req.subject}</div>
                    <div className="text-[11px] truncate mt-0.5" style={{ color: "rgba(11,33,71,0.45)" }}>{req.details}</div>
                  </div>
                  {(req.airlineIata || req.airportIata) && (
                    <div className="shrink-0 hidden sm:flex items-center gap-1.5">
                      {req.airlineIata && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold"
                          style={{ background: "rgba(59,95,173,0.10)", color: "#3b5fad" }}>{req.airlineIata}</span>
                      )}
                      {req.airportIata && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold"
                          style={{ background: "rgba(5,150,105,0.10)", color: "#059669" }}>{req.airportIata}</span>
                      )}
                    </div>
                  )}
                  <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold"
                    style={{ background: st.bg, color: st.color }}>
                    {st.icon} {st.label}
                  </span>
                  <div className="shrink-0 w-28 hidden md:block text-[11px]" style={{ color: "rgba(11,33,71,0.40)" }}>
                    {formatDate(req.submittedAt)}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                    style={{ color: "#3b5fad" }} />
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid rgba(11,33,71,0.07)" }}>
            <span className="text-[11px]" style={{ color: "rgba(11,33,71,0.40)" }}>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-xl text-[12px] font-bold disabled:opacity-40"
                style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147" }}>← Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-xl text-[12px] font-bold disabled:opacity-40"
                style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147" }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
