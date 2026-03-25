import { useState, useRef, useEffect } from "react";
import { useSyncData, useGetSyncStatus, useGetRawData, SyncRequestSourcesItem } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { RefreshCw, Database, AlertCircle, CheckCircle2, Download, Upload, FileSpreadsheet, X, CloudDownload, Zap, Clock, ShieldCheck, ShieldOff } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

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

export default function SyncData() {
  const [sources, setSources] = useState<string[]>(AVAILABLE_SOURCES.map(s => s.id));
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>(
    Object.fromEntries(IMPORT_CONFIGS.map(c => [c.label, { loading: false, result: null, error: null, filename: null }]))
  );
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const queryClient = useQueryClient();
  const { data: status, isLoading: statusLoading } = useGetSyncStatus();
  const { data: rawData, isLoading: rawLoading } = useGetRawData({ page, limit: 10 });

  const syncMut = useSyncData({
    mutation: {
      onSuccess: (res) => {
        toast.success(`Sync successful: Added ${res.airlinesAdded} airlines, ${res.airportsAdded} airports`);
        if (res.errors && res.errors.length > 0) toast.warning(`Completed with ${res.errors.length} non-fatal errors`);
        queryClient.invalidateQueries({ queryKey: ["/api/sync/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/sync/raw-data"] });
      },
      onError: (err: any) => toast.error(`Sync failed: ${err.message}`)
    }
  });

  const handleSync = () => {
    if (sources.length === 0) return toast.error("Select at least one source");
    syncMut.mutate({ data: { sources: sources as SyncRequestSourcesItem[] } });
  };

  const toggleSource = (id: string) => {
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
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

  return (
    <div className="space-y-6">
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

                  {/* Result display */}
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

                  {/* Drop zone */}
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

      {/* ── Legacy Sync + Raw Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              className="w-full h-12 text-base shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-500"
              onClick={handleSync}
              isLoading={syncMut.isPending}
            >
              <RefreshCw className={syncMut.isPending ? "animate-spin mr-2" : "mr-2"} />
              Initialize Sync Sequence
            </Button>

            {statusLoading ? (
              <div className="animate-pulse h-20 bg-muted/20 rounded-xl" />
            ) : (
              <div className="mt-6 p-4 rounded-xl bg-card border border-border/50 space-y-3">
                <h4 className="text-xs font-display text-muted-foreground uppercase tracking-widest">System Status</h4>
                <div className="flex justify-between items-center text-sm">
                  <span>Last Sync</span>
                  <span className="font-mono text-primary">{status?.lastSyncAt ? formatDate(status.lastSyncAt) : "Never"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Queued Reviews</span>
                  <span className="font-mono font-bold text-warning">{status?.pendingReview || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Raw Ingestion Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingestion ID</TableHead>
                  <TableHead>Source Route</TableHead>
                  <TableHead>Payload Type</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Integrity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Accessing stream...</TableCell></TableRow>
                ) : rawData?.data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Stream empty.</TableCell></TableRow>
                ) : (
                  rawData?.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-primary/70">#{row.id.toString().padStart(6, '0')}</TableCell>
                      <TableCell><Badge variant="outline">{row.source}</Badge></TableCell>
                      <TableCell className="uppercase text-xs">{row.dataType}</TableCell>
                      <TableCell>{formatDate(row.importedAt)}</TableCell>
                      <TableCell>
                        {row.flagged ? (
                          <div className="flex items-center gap-1 text-warning"><AlertCircle className="h-4 w-4" /> Flagged</div>
                        ) : (
                          <div className="flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /> Verified</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {rawData && rawData.total > 10 && (
              <div className="flex justify-between items-center mt-4 border-t border-border/50 pt-4">
                <span className="text-sm font-mono text-muted-foreground">Showing page {page}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" variant="outline" disabled={page * 10 >= rawData.total} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
