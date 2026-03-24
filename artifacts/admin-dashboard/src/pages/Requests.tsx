import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Label } from "@/components/ui";
import {
  Search, X, MessageSquarePlus, CheckCircle2, AlertCircle,
  Clock, ThumbsUp, ThumbsDown, Eye, ChevronLeft, ArrowRight, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";

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

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: <Clock className="h-3.5 w-3.5" />, label: "Pending" },
  reviewed: { color: "#38bdf8", bg: "rgba(56,189,248,0.12)", icon: <Eye className="h-3.5 w-3.5" />, label: "Reviewed" },
  approved: { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Approved" },
  rejected: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)", icon: <AlertCircle className="h-3.5 w-3.5" />, label: "Rejected" },
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

const PAGE_SIZES = [20, 50, 100];

export default function Requests() {
  const { isDark } = useTheme();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<DataRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);

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
      apiFetch(`/api/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNotes }),
      }),
    onSuccess: (_, vars) => {
      toast.success(vars.status ? `Marked as ${vars.status}` : "Notes saved");
      qc.invalidateQueries({ queryKey: ["requests"] });
      if (selected && vars.status) setSelected(prev => prev ? { ...prev, status: vars.status as any } : null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/requests/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Request deleted");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const stats = data?.stats;
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const openDetail = (req: DataRequest) => { setSelected(req); setAdminNotes(req.adminNotes ?? ""); };

  if (selected) {
    const st = STATUS_CONFIG[selected.status];
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Back */}
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: "var(--t-accent)" }}>
          <ChevronLeft className="h-4 w-4" /> Back to Requests
        </button>

        {/* Detail card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold"
                    style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)" }}>
                    #{selected.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                    style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
                    {TYPE_LABELS[selected.type] ?? selected.type}
                  </span>
                </div>
                <CardTitle style={{ color: "var(--t-text)" }}>{selected.subject}</CardTitle>
                <p className="text-xs mt-1" style={{ color: "var(--t-text-muted)" }}>
                  Submitted {formatDate(selected.submittedAt)}
                  {selected.reviewedAt && ` · Reviewed ${formatDate(selected.reviewedAt)}`}
                </p>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
                style={{ background: st.bg, color: st.color }}>
                {st.icon} {st.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Details */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--t-text-muted)" }}>Details</p>
              <div className="rounded-xl p-4 text-sm leading-relaxed"
                style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)", color: "var(--t-text)" }}>
                {selected.details}
              </div>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Airline", value: [selected.airlineName, selected.airlineIata].filter(Boolean).join(" ") },
                { label: "Airport IATA", value: selected.airportIata },
                { label: "FIRMS Code", value: selected.firmsCode },
                { label: "Contact Name", value: selected.contactName },
                { label: "Contact Email", value: selected.contactEmail },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className="rounded-xl p-3"
                  style={{ background: "var(--t-card)", border: "1px solid var(--t-border)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--t-text-muted)" }}>{f.label}</p>
                  <p className="text-sm font-semibold font-mono" style={{ color: "var(--t-text)" }}>{f.value}</p>
                </div>
              ))}
            </div>

            {/* Admin notes */}
            <div>
              <Label>Admin Notes</Label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Add internal notes about this request..."
                className="w-full mt-1.5 px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none transition-all"
                style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", color: "var(--t-text)" }}
              />
              <Button size="sm" variant="outline" className="mt-2"
                onClick={() => patchMutation.mutate({ id: selected.id, adminNotes })}
                disabled={patchMutation.isPending}>
                Save Notes
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: "var(--t-border)" }}>
              <Button onClick={() => patchMutation.mutate({ id: selected.id, status: "reviewed" })}
                disabled={patchMutation.isPending || selected.status === "reviewed"}
                style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)" }}>
                <Eye className="h-4 w-4 mr-1.5" /> Mark Reviewed
              </Button>
              <Button onClick={() => patchMutation.mutate({ id: selected.id, status: "approved" })}
                disabled={patchMutation.isPending || selected.status === "approved"}
                style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                <ThumbsUp className="h-4 w-4 mr-1.5" /> Approve
              </Button>
              <Button onClick={() => patchMutation.mutate({ id: selected.id, status: "rejected" })}
                disabled={patchMutation.isPending || selected.status === "rejected"}
                style={{ background: "rgba(244,63,94,0.12)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.25)" }}>
                <ThumbsDown className="h-4 w-4 mr-1.5" /> Reject
              </Button>
              <Button onClick={() => { if (confirm("Delete this request permanently?")) deleteMutation.mutate(selected.id); }}
                variant="outline" disabled={deleteMutation.isPending} className="ml-auto text-red-400">
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: "linear-gradient(135deg, #059669, #047857)", boxShadow: "0 4px 16px rgba(5,150,105,0.35)" }}>
          <MessageSquarePlus className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight" style={{ color: "var(--t-text)" }}>Data Requests</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--t-text-muted)" }}>
            User-submitted requests for new airlines, ground handlers, FIRMS codes, ISC charges, and contact info
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["pending", "reviewed", "approved", "rejected"] as const).map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => { setStatusFilter(statusFilter === s ? "" : s); setPage(1); }}
                className="rounded-xl p-3 flex items-center gap-3 transition-all hover:scale-[1.02] text-left w-full"
                style={{
                  background: statusFilter === s ? cfg.bg : `${cfg.color}08`,
                  border: `1px solid ${statusFilter === s ? cfg.color : cfg.color + "25"}`,
                }}>
                <div className="text-2xl font-black font-mono" style={{ color: cfg.color }}>{stats[s]}</div>
                <div>
                  <div className="flex items-center gap-1" style={{ color: cfg.color }}>
                    {cfg.icon}
                    <span className="text-xs font-bold">{cfg.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--t-text-muted)" }} />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search subject, details, airline, FIRMS..." className="pl-9" />
            </div>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl text-sm focus:outline-none"
              style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", color: "var(--t-text)", minWidth: "160px" }}>
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {(search || statusFilter || typeFilter) && (
              <button onClick={() => { setSearch(""); setStatusFilter(""); setTypeFilter(""); setPage(1); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400"
                style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.05)" }}>
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">
              {isLoading ? "Loading…" : `${data?.total ?? 0} requests`}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--t-text-muted)" }}>
              {PAGE_SIZES.map(s => (
                <button key={s} onClick={() => { setLimit(s); setPage(1); }}
                  className="px-2 py-0.5 rounded-lg font-mono"
                  style={limit === s ? { background: "var(--t-accent-dim)", color: "var(--t-accent)" } : { color: "var(--t-text-muted)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y" style={{ borderColor: "var(--t-border)" }}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-4 flex gap-4">
                  {[80, 120, 200, 80, 100].map((w, j) => (
                    <div key={j} className="h-4 rounded animate-pulse" style={{ background: "var(--t-border)", width: w }} />
                  ))}
                </div>
              ))
            ) : data?.data.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "var(--t-text-muted)" }}>
                <MessageSquarePlus className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No requests found
              </div>
            ) : (
              data?.data.map((req: DataRequest) => {
                const st = STATUS_CONFIG[req.status];
                return (
                  <button key={req.id} onClick={() => openDetail(req)}
                    className="w-full px-4 py-4 flex items-center gap-4 text-left transition-all hover:opacity-90 group"
                    style={{ background: "transparent" }}>
                    {/* ID + type */}
                    <div className="shrink-0 w-32">
                      <div className="text-xs font-mono font-bold" style={{ color: "var(--t-accent)" }}>#{req.id}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--t-text-muted)" }}>
                        {TYPE_LABELS[req.type] ?? req.type}
                      </div>
                    </div>
                    {/* Subject */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ color: "var(--t-text)" }}>{req.subject}</div>
                      <div className="text-xs truncate mt-0.5" style={{ color: "var(--t-text-muted)" }}>{req.details}</div>
                    </div>
                    {/* Airline/airport */}
                    <div className="shrink-0 w-32 hidden sm:block">
                      {req.airlineIata && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold"
                          style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)" }}>
                          {req.airlineIata}
                        </span>
                      )}
                      {req.airportIata && (
                        <span className="ml-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold"
                          style={{ background: "var(--t-accent2-dim)", color: "var(--t-accent2)" }}>
                          {req.airportIata}
                        </span>
                      )}
                    </div>
                    {/* Status */}
                    <div className="shrink-0">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold"
                        style={{ background: st.bg, color: st.color }}>
                        {st.icon} {st.label}
                      </span>
                    </div>
                    {/* Date */}
                    <div className="shrink-0 w-36 hidden md:block text-xs" style={{ color: "var(--t-text-muted)" }}>
                      {formatDate(req.submittedAt)}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--t-accent)" }} />
                  </button>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--t-border)" }}>
              <span className="text-xs" style={{ color: "var(--t-text-muted)" }}>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />Prev
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next<ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
