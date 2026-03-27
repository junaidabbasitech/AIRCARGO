import { useState, useEffect, useCallback } from "react";
import { Database as DbIcon, Table2, RefreshCw, Search, ChevronLeft, ChevronRight, Edit2, Trash2, Save, X, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as any).message || "Request failed"); }
  return res.json();
}

interface TableInfo { name: string; rowCount: number; columnCount: number; }
interface ColumnDef { name: string; type: string; nullable: boolean; default: string | null; isPrimary: boolean; }

const READ_ONLY_COLS = new Set(["id", "created_at"]);
const NON_EDITABLE_TABLES: string[] = [];

const TABLE_LABELS: Record<string, string> = {
  airlines: "Airlines",
  airports: "Airports",
  airline_operations: "Airline Operations",
  ground_handlers: "Ground Handlers",
};

function TypeBadge({ type }: { type: string }) {
  const color = type.includes("int") || type.includes("numeric") ? "bg-blue-100 text-blue-700"
    : type.includes("bool") ? "bg-purple-100 text-purple-700"
    : type.includes("timestamp") || type.includes("date") ? "bg-orange-100 text-orange-700"
    : "bg-slate-100 text-slate-600";
  return <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${color}`}>{type}</span>;
}

function EditRowModal({ row, schema, tableName, onSave, onClose }: {
  row: Record<string, any>;
  schema: ColumnDef[];
  tableName: string;
  onSave: (updates: Record<string, any>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const f: Record<string, any> = {};
    schema.forEach(col => { if (!READ_ONLY_COLS.has(col.name)) f[col.name] = row[col.name] ?? ""; });
    return f;
  });
  const [saving, setSaving] = useState(false);
  const editableSchema = schema.filter(col => !READ_ONLY_COLS.has(col.name));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const getInputType = (col: ColumnDef) => {
    if (col.type.includes("bool")) return "checkbox";
    if (col.type.includes("int") || col.type.includes("numeric") || col.type === "real" || col.type === "double precision") return "number";
    if (col.type.includes("timestamp")) return "datetime-local";
    return "text";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-slate-100">
          <div className="h-9 w-9 rounded-xl bg-sky-100 flex items-center justify-center"><Edit2 className="h-4 w-4 text-sky-600" /></div>
          <div>
            <h3 className="font-bold text-slate-800">Edit Row — {TABLE_LABELS[tableName] ?? tableName}</h3>
            <p className="text-xs text-slate-400">ID: {row.id}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editableSchema.map(col => {
              const inputType = getInputType(col);
              return (
                <div key={col.name}>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                    {col.name.replace(/_/g, " ")} <TypeBadge type={col.type} />
                  </label>
                  {inputType === "checkbox" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!form[col.name]}
                        onChange={e => setForm(f => ({ ...f, [col.name]: e.target.checked }))}
                        className="accent-sky-500 h-4 w-4"
                      />
                      <span className="text-sm text-slate-600">{form[col.name] ? "True" : "False"}</span>
                    </label>
                  ) : (
                    <input
                      type={inputType}
                      value={form[col.name] ?? ""}
                      onChange={e => setForm(f => ({ ...f, [col.name]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                      placeholder={col.nullable ? "null" : ""}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Database() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [schema, setSchema] = useState<ColumnDef[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, any> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const totalPages = Math.ceil(total / limit);

  const loadTables = async () => {
    setTablesLoading(true);
    try {
      const r = await apiFetch("/api/db-admin/tables");
      setTables(r.tables);
    } catch (e: any) { toast.error(e.message); }
    finally { setTablesLoading(false); }
  };

  useEffect(() => { loadTables(); }, []);

  const loadTableData = useCallback(async (tableName: string, pg: number, q: string) => {
    setDataLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(limit) });
      if (q) params.set("search", q);
      const [schemaRes, dataRes] = await Promise.all([
        apiFetch(`/api/db-admin/tables/${tableName}/schema`),
        apiFetch(`/api/db-admin/tables/${tableName}/rows?${params}`),
      ]);
      setSchema(schemaRes.schema);
      setRows(dataRes.rows);
      setTotal(dataRes.total);
    } catch (e: any) { toast.error(e.message); }
    finally { setDataLoading(false); }
  }, [limit]);

  useEffect(() => {
    if (selectedTable) loadTableData(selectedTable, page, search);
  }, [selectedTable, page, search, loadTableData]);

  const selectTable = (name: string) => {
    setSelectedTable(name); setPage(1); setSearch(""); setSearchInput(""); setRows([]); setTotal(0);
  };

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const handleSave = async (updates: Record<string, any>) => {
    if (!selectedTable || !editRow) return;
    await apiFetch(`/api/db-admin/tables/${selectedTable}/rows/${editRow.id}`, {
      method: "PUT", body: JSON.stringify(updates),
    });
    toast.success("Row updated successfully");
    await loadTableData(selectedTable, page, search);
    await loadTables();
  };

  const handleDelete = async (id: number) => {
    if (!selectedTable) return;
    try {
      await apiFetch(`/api/db-admin/tables/${selectedTable}/rows/${id}`, { method: "DELETE" });
      toast.success("Row deleted");
      setDeleteConfirm(null);
      await loadTableData(selectedTable, page, search);
      await loadTables();
    } catch (e: any) { toast.error(e.message); }
  };

  const displayCols = schema.slice(0, 8);

  const formatCellValue = (val: any, col: ColumnDef) => {
    if (val === null || val === undefined) return <span className="text-slate-300 italic text-[10px]">null</span>;
    if (typeof val === "boolean") return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{val ? "true" : "false"}</span>;
    if (col.type.includes("timestamp") && typeof val === "string") {
      try { return <span className="text-[10px] font-mono text-slate-400">{new Date(val).toLocaleDateString()}</span>; } catch { return String(val); }
    }
    const str = String(val);
    if (str.length > 40) return <span title={str} className="text-xs text-slate-600">{str.slice(0, 38)}…</span>;
    return <span className="text-xs text-slate-700">{str}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Database Admin</h2>
          <p className="text-sm text-slate-500 mt-0.5">Browse and edit core database tables directly</p>
        </div>
        <button onClick={loadTables} disabled={tablesLoading} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${tablesLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-5">
        {/* Table list sidebar */}
        <div className="w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <DbIcon className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Tables</span>
            </div>
            {tablesLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />)}
              </div>
            ) : (
              <div className="p-2">
                {tables.map(t => (
                  <button
                    key={t.name}
                    onClick={() => selectTable(t.name)}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 mb-1 ${selectedTable === t.name ? "bg-sky-600 text-white shadow-md" : "hover:bg-slate-50 text-slate-700"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Table2 className={`h-3.5 w-3.5 shrink-0 ${selectedTable === t.name ? "text-sky-200" : "text-slate-400"}`} />
                      <span className="font-semibold text-sm truncate">{TABLE_LABELS[t.name] ?? t.name}</span>
                    </div>
                    <p className={`text-[10px] mt-0.5 font-mono ${selectedTable === t.name ? "text-sky-200" : "text-slate-400"}`}>{t.rowCount.toLocaleString()} rows</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Info box */}
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-amber-700 leading-relaxed">Editing data directly bypasses validation. Changes are immediate and permanent.</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {!selectedTable ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><Table2 className="h-8 w-8 text-slate-300" /></div>
              <h3 className="font-bold text-slate-700 mb-1">Select a table</h3>
              <p className="text-sm text-slate-400">Choose a table from the sidebar to browse and edit its data</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Table header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-sky-600" />
                  <span className="font-bold text-slate-800">{TABLE_LABELS[selectedTable] ?? selectedTable}</span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{total.toLocaleString()} rows</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                      placeholder="Search text columns..."
                      className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white w-52"
                    />
                  </div>
                  <button onClick={handleSearch} className="px-3 py-1.5 text-xs font-bold bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">Search</button>
                  {search && <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>}
                </div>
              </div>

              {/* Table data */}
              {dataLoading ? (
                <div className="p-8">
                  <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />)}</div>
                </div>
              ) : rows.length === 0 ? (
                <div className="p-12 text-center">
                  <Info className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{search ? "No rows match your search" : "This table is empty"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {displayCols.map(col => (
                          <th key={col.name} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              {col.name.replace(/_/g, " ")}
                              {col.isPrimary && <span className="text-[8px] font-black text-amber-500 bg-amber-100 px-1 rounded">PK</span>}
                            </span>
                          </th>
                        ))}
                        {schema.length > 8 && <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">+{schema.length - 8} more</th>}
                        <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rows.map(row => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                          {displayCols.map(col => (
                            <td key={col.name} className="px-4 py-2.5 max-w-[180px]">
                              {formatCellValue(row[col.name], col)}
                            </td>
                          ))}
                          {schema.length > 8 && <td className="px-4 py-2.5"><span className="text-[10px] text-slate-300 italic">...</span></td>}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditRow(row)}
                                className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-600 transition-colors"
                                title="Edit row"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              {deleteConfirm === row.id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleDelete(row.id)} className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded-md">Confirm</button>
                                  <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-[10px] font-bold bg-slate-200 text-slate-600 rounded-md">Cancel</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(row.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                                  title="Delete row"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-3 bg-slate-50">
                  <span className="text-xs text-slate-400">Page {page} of {totalPages} · {total.toLocaleString()} total rows</span>
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1.5 text-xs font-bold rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">«</button>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                    <span className="px-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg">{page}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="h-4 w-4" /></button>
                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1.5 text-xs font-bold rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">»</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editRow && (
        <EditRowModal
          row={editRow}
          schema={schema}
          tableName={selectedTable!}
          onSave={handleSave}
          onClose={() => setEditRow(null)}
        />
      )}
    </div>
  );
}
