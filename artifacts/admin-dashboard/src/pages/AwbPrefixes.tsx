import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Table, TableHeader, TableBody,
  TableRow, TableHead, TableCell, Modal, Label, Badge
} from "@/components/ui";
import { CardWatermark } from "@/components/CardWatermark";
import { Search, Edit2, ScanBarcode, CheckCircle2, AlertCircle, X, Save, Plus } from "lucide-react";
import { toast } from "sonner";

interface AirlinePrefix {
  id: number;
  name: string;
  iataCode: string | null;
  icaoCode: string | null;
  awbPrefix: string | null;
  country: string | null;
  lastUpdated: string;
}

interface PrefixListResponse {
  data: AirlinePrefix[];
  total: number;
  page: number;
  limit: number;
  stats: { total: number; hasPrefix: number };
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function fetchPrefixes(params: Record<string, string>): Promise<PrefixListResponse> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/api/awb-prefixes?${qs}`);
  if (!res.ok) throw new Error("Failed to load AWB prefix data");
  return res.json();
}

async function updatePrefix(id: number, awbPrefix: string | null) {
  const res = await fetch(`${BASE}/api/airlines/${id}/awb-prefix`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ awbPrefix }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Update failed");
  return data;
}

const PAGE_SIZES = [20, 50, 100, 150];

export default function AwbPrefixes() {
  const { isDark } = useTheme();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "has" | "missing">("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [editingAirline, setEditingAirline] = useState<AirlinePrefix | null>(null);
  const [prefixInput, setPrefixInput] = useState("");
  const [prefixError, setPrefixError] = useState("");

  const QK = ["awb-prefixes", search, filter, page, limit];

  const { data, isLoading } = useQuery({
    queryKey: QK,
    queryFn: () => fetchPrefixes({
      search, filter: filter === "all" ? "" : filter,
      page: String(page), limit: String(limit),
    }),
    placeholderData: (prev) => prev,
  });

  const mutation = useMutation({
    mutationFn: ({ id, awbPrefix }: { id: number; awbPrefix: string | null }) =>
      updatePrefix(id, awbPrefix),
    onSuccess: (_, vars) => {
      toast.success(vars.awbPrefix
        ? `Prefix ${vars.awbPrefix} saved`
        : "Prefix cleared");
      qc.invalidateQueries({ queryKey: ["awb-prefixes"] });
      closeModal();
    },
    onError: (err: Error) => {
      setPrefixError(err.message);
    },
  });

  const openEdit = useCallback((airline: AirlinePrefix) => {
    setEditingAirline(airline);
    setPrefixInput(airline.awbPrefix ?? "");
    setPrefixError("");
  }, []);

  const closeModal = () => {
    setEditingAirline(null);
    setPrefixInput("");
    setPrefixError("");
  };

  const handleSave = () => {
    if (!editingAirline) return;
    const val = prefixInput.trim();
    if (val && !/^\d{3}$/.test(val)) {
      setPrefixError("Must be exactly 3 digits (e.g. 176)");
      return;
    }
    mutation.mutate({ id: editingAirline.id, awbPrefix: val || null });
  };

  const stats = data?.stats;
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const accentGlow = isDark ? "rgba(56,189,248,0.15)" : "rgba(14,165,233,0.12)";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(11,33,71,0.40)" }}>Registry · Cargo</p>
          <h1 className="text-[26px] font-black leading-tight" style={{ color: "#0b2147" }}>AWB Prefix Registry</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(11,33,71,0.45)" }}>Manage 3-digit IATA Air Waybill prefixes for each airline</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#0b2147" }}>
            <ScanBarcode className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Airlines", value: stats.total },
            { label: "With Prefix", value: stats.hasPrefix },
            { label: "Missing Prefix", value: stats.total - stats.hasPrefix },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 1px 6px rgba(11,33,71,0.05)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(11,33,71,0.45)" }}>{s.label}</p>
              <p className="text-3xl font-black tabular-nums" style={{ color: "#0b2147" }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardWatermark variant="route" size={100} opacity={0.04} position="bottom-right" />
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--t-text-muted)" }} />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search airline name, IATA, ICAO or prefix..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "has", "missing"] as const).map(f => (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 capitalize"
                  style={filter === f ? {
                    background: f === "missing" ? "rgba(245,158,11,0.15)" : f === "has" ? "rgba(5,150,105,0.15)" : "var(--t-accent-dim)",
                    color: f === "missing" ? "#f59e0b" : f === "has" ? "#059669" : "var(--t-accent)",
                    border: `1px solid ${f === "missing" ? "#f59e0b" : f === "has" ? "#059669" : "var(--t-accent)"}40`,
                  } : { color: "var(--t-text-sub)", border: "1px solid var(--t-border)" }}>
                  {f === "all" ? "All" : f === "has" ? "Has Prefix" : "Missing"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">
              {isLoading ? "Loading..." : `${data?.total ?? 0} airlines`}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--t-text-muted)" }}>
              Rows:
              {PAGE_SIZES.map(s => (
                <button key={s} onClick={() => { setLimit(s); setPage(1); }}
                  className="px-2 py-0.5 rounded-lg font-mono transition-all"
                  style={limit === s
                    ? { background: "var(--t-accent-dim)", color: "var(--t-accent)" }
                    : { color: "var(--t-text-muted)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Airline</TableHead>
                  <TableHead>IATA</TableHead>
                  <TableHead>ICAO</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>AWB Prefix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 rounded animate-pulse" style={{ background: "var(--t-border)", width: `${40 + Math.random() * 40}%` }} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12" style={{ color: "var(--t-text-muted)" }}>
                      No airlines found
                    </TableCell>
                  </TableRow>
                ) : data?.data.map(airline => (
                  <TableRow key={airline.id} className="group">
                    <TableCell className="font-semibold" style={{ color: "var(--t-text)" }}>
                      {airline.name}
                    </TableCell>
                    <TableCell>
                      {airline.iataCode ? (
                        <span className="px-2 py-0.5 rounded-lg font-mono text-xs font-bold"
                          style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)" }}>
                          {airline.iataCode}
                        </span>
                      ) : <span style={{ color: "var(--t-text-muted)" }}>—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs" style={{ color: "var(--t-text-sub)" }}>
                        {airline.icaoCode ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: "var(--t-text-sub)" }}>
                      {airline.country ?? "—"}
                    </TableCell>
                    <TableCell>
                      {airline.awbPrefix ? (
                        <span className="px-3 py-1 rounded-lg font-mono text-sm font-black tracking-widest"
                          style={{ background: "rgba(5,150,105,0.12)", color: "#059669", border: "1px solid rgba(5,150,105,0.25)" }}>
                          {airline.awbPrefix}
                        </span>
                      ) : (
                        <span className="text-xs italic" style={{ color: "var(--t-text-muted)" }}>Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {airline.awbPrefix ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#059669" }}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#f59e0b" }}>
                          <AlertCircle className="h-3.5 w-3.5" /> Missing
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(airline)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        {airline.awbPrefix ? "Edit" : "Add"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--t-border)" }}>
              <span className="text-xs" style={{ color: "var(--t-text-muted)" }}>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={!!editingAirline} onClose={closeModal} title="">
        {editingAirline && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                <ScanBarcode className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-black" style={{ color: "var(--t-text)" }}>
                  {editingAirline.awbPrefix ? "Edit" : "Add"} AWB Prefix
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--t-text-muted)" }}>
                  {editingAirline.name}
                  {editingAirline.iataCode && (
                    <span className="ml-2 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold"
                      style={{ background: "var(--t-accent-dim)", color: "var(--t-accent)" }}>
                      {editingAirline.iataCode}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Current value */}
            {editingAirline.awbPrefix && (
              <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.2)" }}>
                <span className="text-xs font-semibold" style={{ color: "var(--t-text-sub)" }}>Current Prefix</span>
                <span className="font-mono text-lg font-black tracking-widest" style={{ color: "#059669" }}>
                  {editingAirline.awbPrefix}
                </span>
              </div>
            )}

            {/* Input */}
            <div className="space-y-2">
              <Label>AWB Prefix <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  value={prefixInput}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                    setPrefixInput(val);
                    setPrefixError("");
                  }}
                  placeholder="e.g. 176"
                  maxLength={3}
                  className="font-mono text-center text-2xl tracking-[0.5em] font-black h-14"
                  autoFocus
                />
                {prefixInput.length === 3 && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                )}
              </div>
              <p className="text-xs" style={{ color: "var(--t-text-muted)" }}>
                3-digit IATA AWB prefix. Must be unique across all airlines. Leave empty to clear.
              </p>
              {prefixError && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400 font-semibold">{prefixError}</p>
                </div>
              )}
            </div>

            {/* Reference hint */}
            <div className="rounded-xl p-3" style={{ background: "var(--t-card)", border: "1px solid var(--t-border)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--t-text-sub)" }}>Common Reference Prefixes</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["176", "EK", "Emirates"], ["157", "QR", "Qatar"], ["020", "LH", "Lufthansa"],
                  ["057", "AF", "Air France"], ["235", "TK", "Turkish"], ["108", "5Y", "Atlas Air"],
                  ["125", "BA", "British"], ["001", "AA", "American"], ["016", "UA", "United"],
                ].map(([prefix, iata, name]) => (
                  <button key={prefix}
                    onClick={() => { setPrefixInput(prefix); setPrefixError(""); }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all hover:scale-105"
                    style={{ background: "var(--t-bg3)", border: "1px solid var(--t-border)" }}>
                    <span className="font-mono font-black" style={{ color: "var(--t-accent)" }}>{prefix}</span>
                    <span style={{ color: "var(--t-text-muted)" }}>{iata}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeModal}>
                <X className="h-4 w-4 mr-1.5" /> Cancel
              </Button>
              {editingAirline.awbPrefix && (
                <Button variant="outline" className="text-red-400 border-red-200 hover:bg-red-50"
                  onClick={() => mutation.mutate({ id: editingAirline.id, awbPrefix: null })}
                  disabled={mutation.isPending}>
                  Clear
                </Button>
              )}
              <Button className="flex-1"
                style={{ background: "linear-gradient(135deg, #059669, #047857)", color: "#fff" }}
                onClick={handleSave}
                disabled={mutation.isPending || (prefixInput.length > 0 && prefixInput.length < 3)}>
                <Save className="h-4 w-4 mr-1.5" />
                {mutation.isPending ? "Saving..." : "Save Prefix"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
