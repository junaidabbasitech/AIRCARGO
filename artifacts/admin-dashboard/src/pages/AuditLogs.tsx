import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from "@/components/ui";
import { ClipboardList, Search, X, Activity, Plus, Pencil, Trash2, RefreshCw, ArrowRight, ChevronLeft } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const PAGE_SIZES = [20, 50, 100];

const ENTITY_TYPES = [
  { value: "", label: "All Entities" },
  { value: "airline", label: "Airlines", path: "/airlines" },
  { value: "airport", label: "Airports", path: "/airports" },
  { value: "airline_operation", label: "Airline Operations", path: "/airline-operations" },
  { value: "ground_handler", label: "Ground Handlers", path: "/ground-handlers" },
  { value: "user_request", label: "Data Requests", path: "/requests" },
  { value: "sync", label: "System Sync", path: "/sync" },
];

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  create: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  update: { bg: "rgba(56,189,248,0.12)", color: "#38bdf8" },
  patch: { bg: "rgba(56,189,248,0.10)", color: "#38bdf8" },
  delete: { bg: "rgba(244,63,94,0.12)", color: "#f43f5e" },
  approve: { bg: "rgba(16,185,129,0.15)", color: "#059669" },
  reject: { bg: "rgba(244,63,94,0.15)", color: "#f43f5e" },
  status_changed: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  awb: { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
};

function getActionStyle(action: string) {
  const lower = action.toLowerCase();
  for (const [key, style] of Object.entries(ACTION_COLORS)) {
    if (lower.includes(key)) return style;
  }
  return { bg: "rgba(100,116,139,0.12)", color: "#94a3b8" };
}

function getActionIcon(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("create")) return <Plus className="h-3 w-3" />;
  if (lower.includes("delete")) return <Trash2 className="h-3 w-3" />;
  if (lower.includes("update") || lower.includes("patch") || lower.includes("status")) return <Pencil className="h-3 w-3" />;
  if (lower.includes("sync")) return <RefreshCw className="h-3 w-3" />;
  return <Activity className="h-3 w-3" />;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ChangesPreview({ changes }: { changes: any }) {
  if (!changes) return <span className="italic text-xs" style={{ color: "var(--t-text-muted)" }}>—</span>;
  const str = typeof changes === "string" ? changes : JSON.stringify(changes, null, 0);
  const entries = typeof changes === "object" && !Array.isArray(changes)
    ? Object.entries(changes).filter(([, v]) => v !== null && v !== undefined)
    : null;

  if (entries && entries.length > 0 && entries.length <= 5) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono"
            style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
            <span style={{ color: "var(--t-accent)" }}>{k}</span>
            <span>:</span>
            <span className="truncate max-w-[120px]">{String(v)}</span>
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="font-mono text-xs px-3 py-1.5 rounded-lg max-w-md overflow-x-auto text-nowrap"
      style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
      {str.length > 200 ? str.slice(0, 200) + "…" : str}
    </div>
  );
}

export default function AuditLogs() {
  const { isDark } = useTheme();
  const [, navigate] = useLocation();
  const [entityType, setEntityType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", entityType, search, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (entityType) params.set("entityType", entityType);
      if (search) params.set("search", search);
      const res = await fetch(`${BASE}/api/audit-logs?${params}`);
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const stats = data?.stats;

  const handleEntityClick = (log: any) => {
    const entry = ENTITY_TYPES.find(e => e.value === log.entityType);
    if (entry?.path) navigate(entry.path);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(11,33,71,0.40)" }}>System · Compliance</p>
          <h1 className="text-[26px] font-black leading-tight" style={{ color: "#0b2147" }}>Audit Trail</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(11,33,71,0.45)" }}>Complete system activity log — click any row to expand or navigate to the entity</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#0b2147" }}>
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: stats.total },
            { label: "Creates", value: stats.creates },
            { label: "Updates", value: stats.updates },
            { label: "Deletes", value: stats.deletes },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 1px 6px rgba(11,33,71,0.05)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(11,33,71,0.45)" }}>{s.label}</p>
              <p className="text-3xl font-black tabular-nums" style={{ color: "#0b2147" }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--t-text-muted)" }} />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search action, entity type, changes..." className="pl-9" />
            </div>
            <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", color: "var(--t-text)", minWidth: "180px" }}>
              {ENTITY_TYPES.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            {(search || entityType) && (
              <button onClick={() => { setSearch(""); setEntityType(""); setPage(1); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 transition-all"
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
              {isLoading ? "Loading…" : `${data?.total ?? 0} log entries`}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--t-text-muted)" }}>
              {PAGE_SIZES.map(s => (
                <button key={s} onClick={() => { setLimit(s); setPage(1); }}
                  className="px-2 py-0.5 rounded-lg font-mono transition-all"
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
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-4 py-4 flex gap-4">
                  {[80, 60, 100, 120, 200].map((w, j) => (
                    <div key={j} className="h-4 rounded animate-pulse" style={{ background: "var(--t-border)", width: w }} />
                  ))}
                </div>
              ))
            ) : data?.data.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "var(--t-text-muted)" }}>No log entries found</div>
            ) : (
              data?.data.map((log: any) => {
                const actionStyle = getActionStyle(log.action);
                const entityEntry = ENTITY_TYPES.find(e => e.value === log.entityType);
                const isExpanded = expanded === log.id;
                return (
                  <div key={log.id}>
                    <div
                      className="px-4 py-3.5 flex items-center gap-4 cursor-pointer transition-all duration-150"
                      style={{ background: isExpanded ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : undefined }}
                      onClick={() => setExpanded(isExpanded ? null : log.id)}
                    >
                      {/* Timestamp */}
                      <div className="shrink-0 w-40">
                        <div className="text-[11px] font-mono" style={{ color: "var(--t-text-muted)" }}>
                          {formatDate(log.performedAt)}
                        </div>
                      </div>

                      {/* Actor */}
                      <div className="shrink-0 w-20">
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold"
                          style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)" }}>
                          {log.performedBy}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 w-44">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold"
                          style={{ background: actionStyle.bg, color: actionStyle.color }}>
                          {getActionIcon(log.action)}
                          {log.action.length > 22 ? log.action.slice(0, 22) + "…" : log.action}
                        </span>
                      </div>

                      {/* Entity */}
                      <div className="shrink-0 w-44 flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold uppercase"
                          style={{ color: "var(--t-text-sub)" }}>
                          {log.entityType}
                          {log.entityId ? <span style={{ color: "var(--t-text-muted)" }}> #{log.entityId}</span> : ""}
                        </span>
                        {entityEntry?.path && (
                          <button
                            onClick={e => { e.stopPropagation(); handleEntityClick(log); }}
                            className="p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:opacity-100"
                            title={`Go to ${entityEntry.label}`}
                            style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)" }}>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Changes preview */}
                      <div className="flex-1 min-w-0">
                        <ChangesPreview changes={log.changes} />
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)", borderTop: `1px solid var(--t-border)` }}>
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--t-text-muted)" }}>Full Change Log</p>
                            <pre className="text-xs font-mono p-3 rounded-xl overflow-x-auto max-w-2xl"
                              style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--t-text-muted)" }}>Meta</p>
                            <div className="space-y-1.5 text-xs" style={{ color: "var(--t-text-sub)" }}>
                              <div><span className="font-bold">ID:</span> {log.id}</div>
                              <div><span className="font-bold">Entity:</span> {log.entityType}{log.entityId ? ` #${log.entityId}` : ""}</div>
                              <div><span className="font-bold">Actor:</span> {log.performedBy}</div>
                              <div><span className="font-bold">Time:</span> {formatDate(log.performedAt)}</div>
                            </div>
                            {entityEntry?.path && (
                              <button onClick={() => handleEntityClick(log)}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)", border: "1px solid var(--t-accent-border)" }}>
                                <ArrowRight className="h-3.5 w-3.5" />
                                Go to {entityEntry.label}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--t-border)" }}>
              <span className="text-xs" style={{ color: "var(--t-text-muted)" }}>
                Page {page} of {totalPages} · {data?.total} total
              </span>
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
