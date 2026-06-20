import { useState, useRef } from "react";
import { useSyncData, useGetSyncStatus, useGetRawData, SyncRequestSourcesItem } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { RefreshCw, Database, AlertCircle, CheckCircle2, Download, Upload, FileSpreadsheet, X, Check, XCircle, Clock, SkipForward, Layers } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as any).message || "Request failed"); }
  return res.json();
}

const AVAILABLE_SOURCES = [
  { id: "iata_airlines", label: "IATA Airlines Database" },
  { id: "iata_airports", label: "IATA Airports Database" },
  { id: "us_airports", label: "US Airports Registry" },
  { id: "cbp_ports", label: "CBP Port Codes" },
];

const EXPORT_CONFIGS = [
  { label: "Airports", endpoint: "/api/export/airports", filename: "airports.xlsx", color: "text-blue-400" },
  { label: "Airlines", endpoint: "/api/export/airlines", filename: "airlines.xlsx", color: "text-emerald-400" },
  { label: "Airline Operations", endpoint: "/api/export/airline-operations", filename: "airline-operations.xlsx", color: "text-amber-400" },
  { label: "All Data (3 sheets)", endpoint: "/api/export/all", filename: "aviacbp-export.xlsx", color: "text-violet-400" },
];

const IMPORT_CONFIGS = [
  {
    label: "Airports",
    endpoint: "/api/import/airports",
    description: "Columns: IATA Code, Airport Name, City, State, Country, CBP Port Code, Customs Approved",
    color: "border-blue-500/30 hover:border-blue-500/60",
    badge: "bg-blue-500/10 text-blue-400",
  },
  {
    label: "Airlines",
    endpoint: "/api/import/airlines",
    description: "Columns: IATA Code, Airline Name, ICAO Code, CBP Code, Country",
    color: "border-emerald-500/30 hover:border-emerald-500/60",
    badge: "bg-emerald-500/10 text-emerald-400",
  },
  {
    label: "Airline Operations",
    endpoint: "/api/import/airline-operations",
    description: "Columns: Airline IATA, Airport IATA, FIRMS Code, ISC Amount, ISC Payable At, ISC Payable To, Contact Number, Contact Email, Notes",
    color: "border-amber-500/30 hover:border-amber-500/60",
    badge: "bg-amber-500/10 text-amber-400",
  },
];

type ImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  total: number;
};

type UploadState = {
  loading: boolean;
  result: ImportResult | null;
  error: string | null;
  filename: string | null;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
      <Clock className="h-2.5 w-2.5" /> Pending
    </span>
  );
  if (status === "approved") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
      <CheckCircle2 className="h-2.5 w-2.5" /> Approved
    </span>
  );
  if (status === "rejected") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
      <XCircle className="h-2.5 w-2.5" /> Rejected
    </span>
  );
  if (status === "skipped") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
      <SkipForward className="h-2.5 w-2.5" /> Skipped
    </span>
  );
  return <span className="text-[10px] text-slate-400">{status}</span>;
}

export default function SyncData() {
  const [sources, setSources] = useState<string[]>(AVAILABLE_SOURCES.map(s => s.id));
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>(
    Object.fromEntries(IMPORT_CONFIGS.map(c => [c.label, { loading: false, result: null, error: null, filename: null }]))
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const queryClient = useQueryClient();
  const { data: status, isLoading: statusLoading } = useGetSyncStatus();
  const { data: rawData, isLoading: rawLoading } = useGetRawData({
    page,
    limit: 20,
    ...(statusFilter ? { status: statusFilter } : {}),
  } as any);

  const invalidateRaw = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/sync/raw-data"] });
    queryClient.invalidateQueries({ queryKey: ["/api/sync/status"] });
  };

  const syncMut = useSyncData({
    mutation: {
      onSuccess: (res: any) => {
        const pending = res.pending ?? 0;
        const skipped = res.skipped ?? 0;
        toast.success(`Sync staged: ${pending} pending approval, ${skipped} already in DB (skipped)`);
        if (res.errors && res.errors.length > 0) toast.warning(`Completed with ${res.errors.length} non-fatal errors`);
        queryClient.invalidateQueries({ queryKey: ["/api/sync/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/sync/raw-data"] });
        setStatusFilter("pending");
        setPage(1);
      },
      onError: (err: any) => toast.error(`Sync failed: ${err.message}`)
    }
  });

  const handleSync = () => {
    if (sources.length === 0) { toast.error("Select at least one source"); return; }
    syncMut.mutate({ data: { sources: sources as SyncRequestSourcesItem[] } });
  };

  const toggleSource = (id: string) => {
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleApprove = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const r = await apiFetch(`/api/sync/raw-data/${id}/approve`, { method: "POST" });
      toast.success(r.message);
      invalidateRaw();
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      const r = await apiFetch(`/api/sync/raw-data/${id}/reject`, { method: "POST" });
      toast.success(r.message || "Record rejected");
      invalidateRaw();
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleBulkApprove = async () => {
    const ids = selectedIds.size > 0
      ? Array.from(selectedIds)
      : (rawData?.data ?? []).filter((r: any) => r.status === "pending").map((r: any) => r.id);
    if (ids.length === 0) { toast.error("No pending items to approve"); return; }
    if (!confirm(`Approve ${ids.length} records and add them to the database?`)) return;
    setBulkLoading(true);
    try {
      const r = await apiFetch("/api/sync/raw-data/bulk-approve", { method: "POST", body: JSON.stringify({ ids }) });
      toast.success(r.message);
      invalidateRaw();
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    const ids = selectedIds.size > 0
      ? Array.from(selectedIds)
      : (rawData?.data ?? []).filter((r: any) => r.status === "pending").map((r: any) => r.id);
    if (ids.length === 0) { toast.error("No pending items to reject"); return; }
    if (!confirm(`Reject ${ids.length} records?`)) return;
    setBulkLoading(true);
    try {
      await apiFetch("/api/sync/raw-data/bulk-reject", { method: "POST", body: JSON.stringify({ ids }) });
      toast.success(`${ids.length} records rejected`);
      invalidateRaw();
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownload = async (config: typeof EXPORT_CONFIGS[0]) => {
    setDownloading(config.label);
    try {
      const res = await fetch(`${BASE}${config.endpoint}`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = config.filename; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${config.filename}`);
    } catch (e: any) {
      toast.error(`Download failed: ${e.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleUpload = async (label: string, endpoint: string, file: File) => {
    setUploadStates(prev => ({ ...prev, [label]: { loading: true, result: null, error: null, filename: file.name } }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${BASE}${endpoint}`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setUploadStates(prev => ({ ...prev, [label]: { loading: false, result: data, error: null, filename: file.name } }));
      toast.success(`${label} import: ${data.inserted} added, ${data.updated} updated`);
      queryClient.invalidateQueries();
    } catch (e: any) {
      setUploadStates(prev => ({ ...prev, [label]: { loading: false, result: null, error: e.message, filename: file.name } }));
      toast.error(`Import failed: ${e.message}`);
    }
  };

  const clearResult = (label: string) => {
    setUploadStates(prev => ({ ...prev, [label]: { loading: false, result: null, error: null, filename: null } }));
    if (fileInputRefs.current[label]) fileInputRefs.current[label]!.value = "";
  };

  const rows = rawData?.data ?? [];
  const pendingRows = rows.filter((r: any) => r.status === "pending");
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === pendingRows.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(pendingRows.map((r: any) => r.id)));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(11,33,71,0.40)" }}>System · Operations</p>
          <h1 className="text-[26px] font-black leading-tight" style={{ color: "#0b2147" }}>Sync Operations</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(11,33,71,0.45)" }}>Stage data imports for approval before committing to the registry</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#0b2147" }}>
            <RefreshCw className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Pending Approval Banner */}
      {(status as any)?.pendingApproval > 0 && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border"
          style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.30)" }}>
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(251,191,36,0.15)" }}>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">{(status as any).pendingApproval} records awaiting approval</p>
            <p className="text-xs text-amber-600 mt-0.5">Review the raw ingestion stream below and approve or reject each record.</p>
          </div>
          <button
            onClick={handleBulkApprove}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "#059669" }}
          >
            <Check className="h-3.5 w-3.5" />
            Approve All Pending
          </button>
        </div>
      )}

      {/* ── Download / Export ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-primary" /> Download Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Export the current database contents as Excel files.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {EXPORT_CONFIGS.map(cfg => (
              <button
                key={cfg.label}
                onClick={() => handleDownload(cfg)}
                disabled={downloading === cfg.label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all text-center group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className={`h-8 w-8 ${cfg.color} group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-medium">{cfg.label}</span>
                {downloading === cfg.label && (
                  <span className="text-xs text-muted-foreground">Downloading…</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Upload / Import ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Upload & Import Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload an Excel (.xlsx) file to import data. Existing records (matched by IATA code) will be updated; new records will be created.
            Tip: download first to see the expected column format.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {IMPORT_CONFIGS.map(cfg => {
              const state = uploadStates[cfg.label];
              return (
                <div key={cfg.label} className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all ${cfg.color} bg-card/30`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-display font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    {(state.result || state.error) && (
                      <button onClick={() => clearResult(cfg.label)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cfg.description}</p>
                  {state.result && (
                    <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-success font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Import complete</div>
                      <div className="text-muted-foreground">
                        <span className="text-foreground font-mono">{state.result.inserted}</span> added •{" "}
                        <span className="text-foreground font-mono">{state.result.updated}</span> updated •{" "}
                        <span className="text-foreground font-mono">{state.result.skipped}</span> skipped
                      </div>
                      {state.result.errors.length > 0 && (
                        <div className="text-warning mt-1">{state.result.errors.length} row errors (see console)</div>
                      )}
                    </div>
                  )}
                  {state.error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {state.error}
                    </div>
                  )}
                  <label
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-dashed border-border/50 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all ${state.loading ? "opacity-60 pointer-events-none" : ""}`}
                    onDragOver={e => { e.preventDefault(); }}
                    onDrop={e => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleUpload(cfg.label, cfg.endpoint, file);
                    }}
                  >
                    <input
                      ref={el => { fileInputRefs.current[cfg.label] = el; }}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(cfg.label, cfg.endpoint, file);
                      }}
                    />
                    {state.loading ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Importing {state.filename}…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground text-center">
                          {state.filename && !state.result && !state.error ? state.filename : "Drop .xlsx here or click to browse"}
                        </span>
                      </>
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Data Ingestion + Raw Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingestion Control */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Data Ingestion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 border border-border p-4 rounded-xl bg-background/30">
              <p className="text-sm font-display text-muted-foreground tracking-wider uppercase">Select Data Sources</p>
              {AVAILABLE_SOURCES.map(s => (
                <label key={s.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sources.includes(s.id)}
                    onChange={() => toggleSource(s.id)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/50 accent-primary"
                  />
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{s.label}</span>
                </label>
              ))}
            </div>

            <Button
              variant="primary"
              className="flex items-center px-3 py-1.5 text-xs font-bold text-white rounded-xl shadow-md transition-all duration-200 ease-in-out hover:bg-orange-600 hover:shadow-lg hover:scale-110 active:scale-85 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
              onClick={handleSync}
              isLoading={syncMut.isPending}
            >
              <RefreshCw className={syncMut.isPending ? "animate-spin mr-2" : "mr-2"} />
              Stage Sync for Review
            </Button>

            {statusLoading ? (
              <div className="animate-pulse h-24 bg-muted/20 rounded-xl" />
            ) : (
              <div className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
                <h4 className="text-xs font-display text-muted-foreground uppercase tracking-widest">System Status</h4>
                <div className="flex justify-between items-center text-sm">
                  <span>Last Sync</span>
                  <span className="font-mono text-primary">{(status as any)?.lastSyncAt ? formatDate((status as any).lastSyncAt) : "Never"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Pending Approval</span>
                  <span className="font-mono font-bold text-amber-600">{(status as any)?.pendingApproval ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>In DB (Airlines)</span>
                  <span className="font-mono text-primary">{(status as any)?.totalAirlines ?? "–"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>In DB (Airports)</span>
                  <span className="font-mono text-primary">{(status as any)?.totalAirports ?? "–"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raw Ingestion Stream */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" /> Raw Ingestion Stream
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1); setSelectedIds(new Set()); }}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="skipped">Skipped</option>
                  <option value="">All</option>
                </select>

                {statusFilter === "pending" && pendingRows.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkApprove}
                      disabled={bulkLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition-all"
                    >
                      <Check className="h-3 w-3" />
                      {selectedIds.size > 0 ? `Approve (${selectedIds.size})` : "Approve All"}
                    </button>
                    <button
                      onClick={handleBulkReject}
                      disabled={bulkLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-all"
                    >
                      <XCircle className="h-3 w-3" />
                      {selectedIds.size > 0 ? `Reject (${selectedIds.size})` : "Reject All"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {statusFilter === "pending" && (
                    <TableHead className="w-8">
                      <input
                        type="checkbox"
                        checked={pendingRows.length > 0 && selectedIds.size === pendingRows.length}
                        onChange={toggleSelectAll}
                        className="accent-sky-600 h-3.5 w-3.5"
                      />
                    </TableHead>
                  )}
                  <TableHead>ID</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>IATA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Staged At</TableHead>
                  {statusFilter === "pending" && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-400">Loading stream…</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                        <p className="text-sm font-semibold text-slate-600">
                          {statusFilter === "pending" ? "No pending records — all synced records have been reviewed." : "No records found."}
                        </p>
                        {statusFilter === "pending" && (
                          <p className="text-xs text-slate-400">Run a sync to stage new data for approval.</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row: any) => {
                    const rd = row.rawData as any;
                    const isSelected = selectedIds.has(row.id);
                    const rowLoading = actionLoading[row.id];
                    return (
                      <TableRow key={row.id} className={isSelected ? "bg-sky-50" : ""}>
                        {statusFilter === "pending" && (
                          <TableCell>
                            {row.status === "pending" && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(row.id)}
                                className="accent-sky-600 h-3.5 w-3.5"
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-primary/70 text-xs">#{String(row.id).padStart(5, "0")}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{row.source}</Badge></TableCell>
                        <TableCell className="uppercase text-xs font-semibold text-slate-500">{row.dataType}</TableCell>
                        <TableCell className="text-sm font-medium text-slate-700 max-w-[160px] truncate">{rd?.name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{rd?.iataCode ?? "—"}</TableCell>
                        <TableCell><StatusBadge status={row.status} /></TableCell>
                        <TableCell className="text-xs text-slate-400">{formatDate(row.importedAt)}</TableCell>
                        {statusFilter === "pending" && (
                          <TableCell>
                            {row.status === "pending" && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleApprove(row.id)}
                                  disabled={rowLoading}
                                  title="Approve — add to database"
                                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-all disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleReject(row.id)}
                                  disabled={rowLoading}
                                  title="Reject"
                                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-all disabled:opacity-50"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {rawData && rawData.total > 20 && (
              <div className="flex justify-between items-center mt-4 border-t border-border/50 pt-4">
                <span className="text-sm font-mono text-muted-foreground">
                  {rawData.total} total · page {page} of {Math.ceil(rawData.total / 20)}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" variant="outline" disabled={page * 20 >= rawData.total} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
