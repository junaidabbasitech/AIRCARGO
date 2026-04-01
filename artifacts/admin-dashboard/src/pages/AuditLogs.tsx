import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, Input } from "@/components/ui";
import {
  ClipboardList, Search, X, Activity, Plus, Pencil, Trash2,
  RefreshCw, ArrowRight, ChevronLeft, AlertTriangle, Info,
  AlertCircle, Globe, User, Wifi, Eye, Clock
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const PAGE_SIZES = [20, 50, 100, 150];

const ENTITY_TYPES = [
  { value: "", label: "All Entities" },
  { value: "airline", label: "Airlines", path: "/airlines" },
  { value: "airport", label: "Airports", path: "/airports" },
  { value: "airline_operation", label: "Airline Ops", path: "/airline-operations" },
  { value: "ground_handler", label: "Ground Handlers", path: "/ground-handlers" },
  { value: "frontend", label: "User Actions" },
  { value: "navigation", label: "Navigation" },
  { value: "db_admin", label: "DB Admin", path: "/database" },
  { value: "import_export", label: "Import/Export" },
  { value: "system", label: "System" },
  { value: "sync", label: "Sync", path: "/sync" },
];

const LEVELS = [
  { value: "", label: "All Levels", color: "var(--t-text-muted)" },
  { value: "info", label: "Info", color: "#38bdf8" },
  { value: "warning", label: "Warning", color: "#f59e0b" },
  { value: "error", label: "Error", color: "#f43f5e" },
];

const LEVEL_CONFIG: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  info: { bg: "rgba(56,189,248,0.10)", color: "#38bdf8", icon: <Info className="h-3 w-3" /> },
  warning: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", icon: <AlertTriangle className="h-3 w-3" /> },
  error: { bg: "rgba(244,63,94,0.15)", color: "#f43f5e", icon: <AlertCircle className="h-3 w-3" /> },
};

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  UPDATE: { bg: "rgba(56,189,248,0.12)", color: "#38bdf8" },
  DELETE: { bg: "rgba(244,63,94,0.12)", color: "#f43f5e" },
  READ: { bg: "rgba(100,116,139,0.10)", color: "#94a3b8" },
  IMPORT: { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
  EXPORT: { bg: "rgba(139,92,246,0.10)", color: "#a78bfa" },
  VIEW: { bg: "rgba(16,185,129,0.08)", color: "#6ee7b7" },
  FAILED: { bg: "rgba(244,63,94,0.08)", color: "#fb7185" },
  SERVER_ERROR: { bg: "rgba(244,63,94,0.18)", color: "#f43f5e" },
};

function getActionStyle(action: string) {
  for (const [key, style] of Object.entries(ACTION_COLORS)) {
    if (action.toUpperCase().includes(key)) return style;
  }
  return { bg: "rgba(100,116,139,0.10)", color: "#94a3b8" };
}

function getActionIcon(action: string) {
  const upper = action.toUpperCase();
  if (upper.includes("CREATE")) return <Plus className="h-3 w-3" />;
  if (upper.includes("DELETE")) return <Trash2 className="h-3 w-3" />;
  if (upper.includes("UPDATE") || upper.includes("PATCH")) return <Pencil className="h-3 w-3" />;
  if (upper.includes("SYNC")) return <RefreshCw className="h-3 w-3" />;
  if (upper.includes("VIEW") || upper.includes("READ")) return <Eye className="h-3 w-3" />;
  if (upper.includes("ERROR") || upper.includes("FAILED")) return <AlertCircle className="h-3 w-3" />;
  return <Activity className="h-3 w-3" />;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function MethodBadge({ method }: { method?: string | null }) {
  if (!method) return null;
  const colors: Record<string, string> = {
    GET: "#38bdf8", POST: "#10b981", PUT: "#f59e0b",
    PATCH: "#f59e0b", DELETE: "#f43f5e",
  };
  return (
    <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${colors[method] ?? "#94a3b8"}18`, color: colors[method] ?? "#94a3b8", border: `1px solid ${colors[method] ?? "#94a3b8"}30` }}>
      {method}
    </span>
  );
}

function StatusBadge({ code }: { code?: number | null }) {
  if (!code) return null;
  const color = code >= 500 ? "#f43f5e" : code >= 400 ? "#f59e0b" : code >= 300 ? "#38bdf8" : "#10b981";
  return (
    <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {code}
    </span>
  );
}

function ChangesPreview({ changes }: { changes: any }) {
  if (!changes) return <span className="italic text-xs" style={{ color: "var(--t-text-muted)" }}>—</span>;
  const entries = typeof changes === "object" && !Array.isArray(changes)
    ? Object.entries(changes).filter(([, v]) => v !== null && v !== undefined)
    : null;

  if (entries && entries.length > 0 && entries.length <= 5) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono"
            style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
            <span style={{ color: "var(--t-accent)" }}>{k}</span>:<span className="truncate max-w-[100px]">{String(v)}</span>
          </span>
        ))}
      </div>
    );
  }
  const str = typeof changes === "string" ? changes : JSON.stringify(changes);
  return (
    <div className="font-mono text-xs px-2 py-1 rounded-lg max-w-xs overflow-x-hidden text-nowrap truncate"
      style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)" }}>
      {str.length > 160 ? str.slice(0, 160) + "…" : str}
    </div>
  );
}

export default function AuditLogs() {
  const { isDark } = useTheme();
  const [, navigate] = useLocation();
  const [entityType, setEntityType] = useState("");
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", entityType, level, search, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (entityType) params.set("entityType", entityType);
      if (level) params.set("level", level);
      if (search) params.set("search", search);
      const res = await fetch(`${BASE}/api/audit-logs?${params}`);
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json();
    },
    placeholderData: (prev) => prev,
    refetchInterval: autoRefresh ? 10000 : false,
  });

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const stats = data?.stats;

  const handleEntityClick = (log: any) => {
    const entry = ENTITY_TYPES.find(e => e.value === log.entityType);
    if (entry?.path) navigate(entry.path);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const hasFilters = !!(search || entityType || level);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(11,33,71,0.40)" }}>System · Compliance</p>
          <h1 className="text-[26px] font-black leading-tight" style={{ color: "#0b2147" }}>Audit Trail</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(11,33,71,0.45)" }}>
            Every API call, user action, and error — automatically captured in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={autoRefresh
              ? { background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }
              : { background: "var(--t-bg3)", color: "var(--t-text-muted)", border: "1px solid var(--t-border)" }}>
            <Wifi className="h-3.5 w-3.5" />
            {autoRefresh ? "Live" : "Static"}
          </button>
          <button onClick={() => refetch()}
            className="p-2 rounded-xl transition-all"
            title="Refresh"
            style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)", color: "var(--t-text-muted)" }}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#0b2147" }}>
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total", value: stats.total, color: "#0b2147" },
            { label: "Errors", value: stats.errors, color: "#f43f5e" },
            { label: "Warnings", value: stats.warnings, color: "#f59e0b" },
            { label: "Creates", value: stats.creates, color: "#10b981" },
            { label: "Updates", value: stats.updates, color: "#38bdf8" },
            { label: "Deletes", value: stats.deletes, color: "#f43f5e" },
            { label: "API Calls", value: stats.apiCalls, color: "#8b5cf6" },
            { label: "User Actions", value: stats.userActions, color: "#06b6d4" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4" style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 1px 6px rgba(11,33,71,0.05)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(11,33,71,0.40)" }}>{s.label}</p>
              <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 1px 6px rgba(11,33,71,0.05)" }}>
        {/* Level tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {LEVELS.map(l => (
            <button key={l.value} onClick={() => { setLevel(l.value); setPage(1); }}
              className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
              style={level === l.value
                ? { background: `${l.color}20`, color: l.color, border: `1px solid ${l.color}40` }
                : { background: "var(--t-bg3)", color: "var(--t-text-muted)", border: "1px solid var(--t-border)" }}>
              {l.label}
            </button>
          ))}
        </div>
        {/* Search row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--t-text-muted)" }} />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search action, entity, URL, error…" className="pl-9" />
          </div>
          <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: "var(--t-card)", border: "1px solid var(--t-border)", color: "var(--t-text)", minWidth: "160px" }}>
            {ENTITY_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(""); setEntityType(""); setLevel(""); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 transition-all"
              style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.05)" }}>
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

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
                  style={limit === s ? { background: "var(--t-accent-dim)", color: "var(--t-accent)" } : {}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y" style={{ borderColor: "var(--t-border)" }}>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-3.5 flex gap-4">
                  {[40, 80, 60, 140, 180, 180].map((w, j) => (
                    <div key={j} className="h-4 rounded animate-pulse" style={{ background: "var(--t-border)", width: w }} />
                  ))}
                </div>
              ))
            ) : data?.data.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "var(--t-text-muted)" }}>No log entries found</div>
            ) : (
              data?.data.map((log: any) => {
                const actionStyle = getActionStyle(log.action);
                const levelCfg = LEVEL_CONFIG[log.level] ?? LEVEL_CONFIG.info;
                const entityEntry = ENTITY_TYPES.find(e => e.value === log.entityType);
                const isExpanded = expanded === log.id;
                const isError = log.level === "error";

                return (
                  <div key={log.id}>
                    <div
                      className="px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-150"
                      style={{
                        background: isError
                          ? (isDark ? "rgba(244,63,94,0.05)" : "rgba(244,63,94,0.03)")
                          : isExpanded ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : undefined
                      }}
                      onClick={() => setExpanded(isExpanded ? null : log.id)}
                    >
                      {/* Level indicator */}
                      <div className="shrink-0 w-5 flex items-center justify-center">
                        <span style={{ color: levelCfg.color }}>{levelCfg.icon}</span>
                      </div>

                      {/* Timestamp */}
                      <div className="shrink-0 w-36">
                        <div className="text-[10px] font-mono" style={{ color: "var(--t-text-muted)" }}>
                          {formatDate(log.performedAt)}
                        </div>
                      </div>

                      {/* Actor */}
                      <div className="shrink-0 w-14">
                        <span className="flex items-center gap-1 text-[10px] font-mono"
                          style={{ color: log.performedBy === "frontend" ? "#06b6d4" : log.performedBy === "api" ? "#8b5cf6" : "var(--t-text-muted)" }}>
                          {log.performedBy === "frontend" ? <User className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                          {log.performedBy}
                        </span>
                      </div>

                      {/* Method + Status */}
                      <div className="shrink-0 w-20 flex items-center gap-1">
                        <MethodBadge method={log.method} />
                        <StatusBadge code={log.statusCode} />
                      </div>

                      {/* Action */}
                      <div className="shrink-0 w-40">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold"
                          style={{ background: actionStyle.bg, color: actionStyle.color }}>
                          {getActionIcon(log.action)}
                          {log.action.length > 20 ? log.action.slice(0, 20) + "…" : log.action}
                        </span>
                      </div>

                      {/* Entity */}
                      <div className="shrink-0 w-36 flex items-center gap-1">
                        <span className="text-[10px] font-mono font-semibold uppercase truncate"
                          style={{ color: "var(--t-text-sub)" }}>
                          {log.entityType}
                          {log.entityId ? <span style={{ color: "var(--t-text-muted)" }}> #{log.entityId}</span> : ""}
                        </span>
                        {entityEntry?.path && (
                          <button onClick={e => { e.stopPropagation(); handleEntityClick(log); }}
                            className="p-0.5 rounded opacity-60 hover:opacity-100 transition-all"
                            style={{ color: "var(--t-accent)" }}>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>

                      {/* Error message or changes */}
                      <div className="flex-1 min-w-0">
                        {log.errorMessage ? (
                          <span className="text-xs font-mono truncate block" style={{ color: "#f43f5e" }}>
                            {log.errorMessage.length > 80 ? log.errorMessage.slice(0, 80) + "…" : log.errorMessage}
                          </span>
                        ) : (
                          <ChangesPreview changes={log.changes} />
                        )}
                      </div>

                      {/* Duration */}
                      {log.duration != null && (
                        <div className="shrink-0 w-14 text-right">
                          <span className="text-[10px] font-mono" style={{
                            color: log.duration > 1000 ? "#f59e0b" : log.duration > 500 ? "#f59e0b" : "var(--t-text-muted)"
                          }}>
                            {log.duration >= 1000 ? `${(log.duration / 1000).toFixed(1)}s` : `${Math.round(log.duration)}ms`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2" style={{
                        background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
                        borderTop: `1px solid var(--t-border)`
                      }}>
                        <div className="flex flex-wrap gap-6">
                          {/* Changes */}
                          <div className="flex-1 min-w-[220px]">
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-muted)" }}>
                              {log.errorMessage ? "Error Details" : "Data / Changes"}
                            </p>
                            {log.errorMessage && (
                              <div className="mb-2 px-3 py-2 rounded-xl text-xs font-mono"
                                style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.20)", color: "#f43f5e" }}>
                                {log.errorMessage}
                              </div>
                            )}
                            <pre className="text-xs font-mono p-3 rounded-xl overflow-x-auto"
                              style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)", color: "var(--t-text-sub)", maxHeight: 200 }}>
                              {JSON.stringify(log.changes, null, 2) || "—"}
                            </pre>
                          </div>

                          {/* Meta */}
                          <div className="space-y-1.5 min-w-[180px]">
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--t-text-muted)" }}>Request Meta</p>
                            <div className="space-y-1 text-xs font-mono" style={{ color: "var(--t-text-sub)" }}>
                              <div><span className="font-bold">ID:</span> {log.id}</div>
                              <div><span className="font-bold">Level:</span> <span style={{ color: levelCfg.color }}>{log.level}</span></div>
                              <div><span className="font-bold">Actor:</span> {log.performedBy}</div>
                              {log.method && <div><span className="font-bold">Method:</span> {log.method}</div>}
                              {log.url && <div className="break-all"><span className="font-bold">URL:</span> {log.url}</div>}
                              {log.statusCode && <div><span className="font-bold">Status:</span> {log.statusCode}</div>}
                              {log.duration != null && <div><span className="font-bold">Duration:</span> {Math.round(log.duration)}ms</div>}
                              {log.ipAddress && <div><span className="font-bold">IP:</span> {log.ipAddress}</div>}
                              {log.userAgent && <div className="truncate max-w-xs"><span className="font-bold">UA:</span> {log.userAgent}</div>}
                              <div><span className="font-bold">Time:</span> {formatDate(log.performedAt)}</div>
                            </div>
                            {entityEntry?.path && (
                              <button onClick={() => handleEntityClick(log)}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)", border: "1px solid var(--t-accent-border)" }}>
                                <ArrowRight className="h-3 w-3" />Go to {entityEntry.label}
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
                <button
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all"
                  style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)", color: "var(--t-text)" }}
                  disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />Prev
                </button>
                <button
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all"
                  style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)", color: "var(--t-text)" }}
                  disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next<ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
