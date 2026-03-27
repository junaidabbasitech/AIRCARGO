import { useState } from "react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { GitMerge, Trash2, Search, AlertTriangle, CheckCircle2, Plane, Building2, Network, ChevronDown, ChevronRight, Info } from "lucide-react";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).message || "Request failed"); }
  return res.json();
}

interface DupRecord {
  id: number;
  name?: string;
  iataCode?: string | null;
  icaoCode?: string | null;
  cbpCode?: string | null;
  country?: string | null;
  source?: string | null;
  status?: string | null;
  lastUpdated?: string | null;
  city?: string | null;
  state?: string | null;
  cbpPortCode?: string | null;
  customsApproved?: boolean;
  // ops fields
  airlineId?: number;
  airportId?: number;
  airlineName?: string | null;
  airlineIata?: string | null;
  airportName?: string | null;
  airportIata?: string | null;
  firmsCode?: string | null;
  iscAmount?: string | null;
  iscPayableTo?: string | null;
  contactNumber?: string | null;
  contactEmail?: string | null;
}

interface DupGroup {
  key_field: string;
  match_field: string;
  records: DupRecord[];
}

interface DupResult {
  groups: DupGroup[];
  totalGroups: number;
  totalDuplicates: number;
}

function statusBadge(status?: string | null) {
  if (status === "approved") return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Approved</span>;
  if (status === "rejected") return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Rejected</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Pending</span>;
}

function AirlineGroup({ group, idx, onMerge, onDelete, loading }: {
  group: DupGroup; idx: number;
  onMerge: (keepId: number, deleteIds: number[]) => void;
  onDelete: (ids: number[]) => void; loading: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [keepId, setKeepId] = useState<number>(group.records[0]?.id);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(group.records.slice(1).map(r => r.id)));
  const toggleSelect = (id: number) => { if (id === keepId) return; setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const selectAll = () => setSelectedIds(new Set(group.records.filter(r => r.id !== keepId).map(r => r.id)));
  const clearAll = () => setSelectedIds(new Set());
  const handleKeepChange = (newKeepId: number) => { setKeepId(newKeepId); setSelectedIds(new Set(group.records.filter(r => r.id !== newKeepId).map(r => r.id))); };
  const deleteIds = Array.from(selectedIds).filter(id => id !== keepId);
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><AlertTriangle className="h-4 w-4 text-amber-600" /></div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm">{group.records.length} duplicates — <span className="text-amber-600 font-mono">{group.key_field}</span></p>
            <p className="text-xs text-slate-400">Matched by {group.match_field === "iata_code" ? "IATA code" : "name"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-mono">{group.records.length} records</span>
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Select to delete:</span>
            <button onClick={selectAll} className="text-xs text-sky-600 hover:text-sky-800 font-semibold underline underline-offset-2">All except kept</button>
            <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">None</button>
            <span className="ml-auto text-xs text-slate-400">{selectedIds.size} selected for deletion</span>
          </div>
          <div className="divide-y divide-slate-50">
            {group.records.map(rec => {
              const isKeep = rec.id === keepId;
              const isSelected = selectedIds.has(rec.id);
              return (
                <div key={rec.id} className={`flex items-start gap-3 px-4 py-3 transition-colors ${isKeep ? "bg-green-50" : isSelected ? "bg-red-50" : "hover:bg-slate-50"}`}>
                  <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                    <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name={`keep-airline-${idx}`} checked={isKeep} onChange={() => handleKeepChange(rec.id)} className="accent-green-500" /><span className="text-[10px] text-green-600 font-bold">KEEP</span></label>
                    <label className="flex items-center gap-1 cursor-pointer mt-1"><input type="checkbox" checked={isSelected} disabled={isKeep} onChange={() => toggleSelect(rec.id)} className="accent-red-500" /><span className="text-[10px] text-red-500 font-bold">DEL</span></label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800">{rec.name}</span>
                      {isKeep && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">KEEP</span>}
                      {isSelected && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">DELETE</span>}
                      {statusBadge(rec.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-mono text-slate-500">ID: {rec.id}</span>
                      {rec.iataCode && <span className="text-xs font-mono bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">IATA: {rec.iataCode}</span>}
                      {rec.icaoCode && <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">ICAO: {rec.icaoCode}</span>}
                      {rec.cbpCode && <span className="text-xs font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">CBP: {rec.cbpCode}</span>}
                      {rec.country && <span className="text-xs text-slate-400">· {rec.country}</span>}
                      {rec.source && <span className="text-xs text-slate-400 italic">[{rec.source}]</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-400"><Info className="h-3.5 w-3.5" />Merge copies best data into the kept record</div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => { if (deleteIds.length === 0) { toast.error("Select records to delete"); return; } onDelete(deleteIds); }} disabled={loading || deleteIds.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all active:scale-95"><Trash2 className="h-3.5 w-3.5" />Delete ({deleteIds.length})</button>
              <button onClick={() => { if (deleteIds.length === 0) { toast.error("Select records to merge/delete"); return; } onMerge(keepId, deleteIds); }} disabled={loading || deleteIds.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all active:scale-95"><GitMerge className="h-3.5 w-3.5" />Merge & Keep</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AirportGroup({ group, idx, onMerge, onDelete, loading }: {
  group: DupGroup; idx: number;
  onMerge: (keepId: number, deleteIds: number[]) => void;
  onDelete: (ids: number[]) => void; loading: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [keepId, setKeepId] = useState<number>(group.records[0]?.id);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(group.records.slice(1).map(r => r.id)));
  const toggleSelect = (id: number) => { if (id === keepId) return; setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const selectAll = () => setSelectedIds(new Set(group.records.filter(r => r.id !== keepId).map(r => r.id)));
  const clearAll = () => setSelectedIds(new Set());
  const handleKeepChange = (newKeepId: number) => { setKeepId(newKeepId); setSelectedIds(new Set(group.records.filter(r => r.id !== newKeepId).map(r => r.id))); };
  const deleteIds = Array.from(selectedIds).filter(id => id !== keepId);
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0"><AlertTriangle className="h-4 w-4 text-orange-600" /></div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm">{group.records.length} duplicates — <span className="text-orange-600 font-mono">{group.key_field}</span></p>
            <p className="text-xs text-slate-400">Matched by {group.match_field === "iata_code" ? "IATA code" : "name"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-mono">{group.records.length} records</span>
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Select to delete:</span>
            <button onClick={selectAll} className="text-xs text-sky-600 hover:text-sky-800 font-semibold underline underline-offset-2">All except kept</button>
            <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">None</button>
            <span className="ml-auto text-xs text-slate-400">{selectedIds.size} selected for deletion</span>
          </div>
          <div className="divide-y divide-slate-50">
            {group.records.map(rec => {
              const isKeep = rec.id === keepId;
              const isSelected = selectedIds.has(rec.id);
              return (
                <div key={rec.id} className={`flex items-start gap-3 px-4 py-3 transition-colors ${isKeep ? "bg-green-50" : isSelected ? "bg-red-50" : "hover:bg-slate-50"}`}>
                  <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                    <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name={`keep-airport-${idx}`} checked={isKeep} onChange={() => handleKeepChange(rec.id)} className="accent-green-500" /><span className="text-[10px] text-green-600 font-bold">KEEP</span></label>
                    <label className="flex items-center gap-1 cursor-pointer mt-1"><input type="checkbox" checked={isSelected} disabled={isKeep} onChange={() => toggleSelect(rec.id)} className="accent-red-500" /><span className="text-[10px] text-red-500 font-bold">DEL</span></label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800">{rec.name}</span>
                      {isKeep && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">KEEP</span>}
                      {isSelected && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">DELETE</span>}
                      {statusBadge(rec.status)}
                      {rec.customsApproved && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">Customs</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-mono text-slate-500">ID: {rec.id}</span>
                      {rec.iataCode && <span className="text-xs font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">IATA: {rec.iataCode}</span>}
                      {rec.cbpPortCode && <span className="text-xs font-mono bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">CBP Port: {rec.cbpPortCode}</span>}
                      {[rec.city, rec.state, rec.country].filter(Boolean).length > 0 && <span className="text-xs text-slate-400">· {[rec.city, rec.state, rec.country].filter(Boolean).join(", ")}</span>}
                      {rec.source && <span className="text-xs text-slate-400 italic">[{rec.source}]</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-400"><Info className="h-3.5 w-3.5" />Merge copies best data into the kept record</div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => { if (deleteIds.length === 0) { toast.error("Select records to delete"); return; } onDelete(deleteIds); }} disabled={loading || deleteIds.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all active:scale-95"><Trash2 className="h-3.5 w-3.5" />Delete ({deleteIds.length})</button>
              <button onClick={() => { if (deleteIds.length === 0) { toast.error("Select records to merge/delete"); return; } onMerge(keepId, deleteIds); }} disabled={loading || deleteIds.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all active:scale-95"><GitMerge className="h-3.5 w-3.5" />Merge & Keep</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OpsGroup({ group, idx, onMerge, onDelete, loading }: {
  group: DupGroup; idx: number;
  onMerge: (keepId: number, deleteIds: number[]) => void;
  onDelete: (ids: number[]) => void; loading: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [keepId, setKeepId] = useState<number>(group.records[0]?.id);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(group.records.slice(1).map(r => r.id)));
  const toggleSelect = (id: number) => { if (id === keepId) return; setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const selectAll = () => setSelectedIds(new Set(group.records.filter(r => r.id !== keepId).map(r => r.id)));
  const clearAll = () => setSelectedIds(new Set());
  const handleKeepChange = (newKeepId: number) => { setKeepId(newKeepId); setSelectedIds(new Set(group.records.filter(r => r.id !== newKeepId).map(r => r.id))); };
  const deleteIds = Array.from(selectedIds).filter(id => id !== keepId);
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0"><AlertTriangle className="h-4 w-4 text-purple-600" /></div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm">{group.records.length} duplicate ops — <span className="text-purple-600 font-mono">{group.key_field}</span></p>
            <p className="text-xs text-slate-400">Same airline at same airport — only one record should exist</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full font-mono">{group.records.length} records</span>
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Select to delete:</span>
            <button onClick={selectAll} className="text-xs text-sky-600 hover:text-sky-800 font-semibold underline underline-offset-2">All except kept</button>
            <button onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">None</button>
            <span className="ml-auto text-xs text-slate-400">{selectedIds.size} selected for deletion</span>
          </div>
          <div className="divide-y divide-slate-50">
            {group.records.map(rec => {
              const isKeep = rec.id === keepId;
              const isSelected = selectedIds.has(rec.id);
              return (
                <div key={rec.id} className={`flex items-start gap-3 px-4 py-3 transition-colors ${isKeep ? "bg-green-50" : isSelected ? "bg-red-50" : "hover:bg-slate-50"}`}>
                  <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
                    <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name={`keep-ops-${idx}`} checked={isKeep} onChange={() => handleKeepChange(rec.id)} className="accent-green-500" /><span className="text-[10px] text-green-600 font-bold">KEEP</span></label>
                    <label className="flex items-center gap-1 cursor-pointer mt-1"><input type="checkbox" checked={isSelected} disabled={isKeep} onChange={() => toggleSelect(rec.id)} className="accent-red-500" /><span className="text-[10px] text-red-500 font-bold">DEL</span></label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800">{rec.airlineName} @ {rec.airportIata}</span>
                      {isKeep && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">KEEP</span>}
                      {isSelected && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">DELETE</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-mono text-slate-500">Op ID: {rec.id}</span>
                      {rec.firmsCode && <span className="text-xs font-mono bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">FIRMS: {rec.firmsCode}</span>}
                      {rec.iscAmount && <span className="text-xs font-mono bg-green-100 text-green-700 px-1.5 py-0.5 rounded">ISC: ${rec.iscAmount}</span>}
                      {rec.iscPayableTo && <span className="text-xs text-slate-400">· {rec.iscPayableTo}</span>}
                    </div>
                    {(rec.contactNumber || rec.contactEmail) && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        {rec.contactNumber && <span>{rec.contactNumber}</span>}
                        {rec.contactEmail && <span className="ml-2 italic">{rec.contactEmail}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center gap-1 text-xs text-slate-400"><Info className="h-3.5 w-3.5" />Merge preserves best data from all duplicates</div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => { if (deleteIds.length === 0) { toast.error("Select records to delete"); return; } onDelete(deleteIds); }} disabled={loading || deleteIds.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all active:scale-95"><Trash2 className="h-3.5 w-3.5" />Delete ({deleteIds.length})</button>
              <button onClick={() => { if (deleteIds.length === 0) { toast.error("Select records to merge/delete"); return; } onMerge(keepId, deleteIds); }} disabled={loading || deleteIds.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all active:scale-95"><GitMerge className="h-3.5 w-3.5" />Merge & Keep</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Duplicates() {
  const [tab, setTab] = useState<"airlines" | "airports" | "operations">("airlines");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [data, setData] = useState<{ airlines: DupResult; airports: DupResult; operations: DupResult } | null>(null);
  const [checked, setChecked] = useState(false);

  const checkDuplicates = async () => {
    setLoading(true);
    try {
      const result = await apiFetch("/api/duplicates");
      setData(result);
      setChecked(true);
      const total = result.airlines.totalGroups + result.airports.totalGroups + result.operations.totalGroups;
      if (total === 0) toast.success("No duplicates found — database is clean!");
      else toast.info(`Found ${result.airlines.totalGroups} airline, ${result.airports.totalGroups} airport, ${result.operations.totalGroups} operation duplicate groups`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAirlineMerge = async (keepId: number, deleteIds: number[]) => {
    if (!confirm(`Merge ${deleteIds.length} airline(s) into ID ${keepId}? Best data will be preserved.`)) return;
    setActionLoading(true);
    try { const r = await apiFetch("/api/duplicates/airlines/merge", { method: "POST", body: JSON.stringify({ keepId, deleteIds }) }); toast.success(r.message); await checkDuplicates(); }
    catch (e: any) { toast.error(e.message); } finally { setActionLoading(false); }
  };
  const handleAirlineDelete = async (ids: number[]) => {
    if (!confirm(`Permanently delete ${ids.length} airline record(s)?`)) return;
    setActionLoading(true);
    try { const r = await apiFetch("/api/duplicates/airlines/delete", { method: "POST", body: JSON.stringify({ ids }) }); toast.success(r.message); await checkDuplicates(); }
    catch (e: any) { toast.error(e.message); } finally { setActionLoading(false); }
  };
  const handleAirportMerge = async (keepId: number, deleteIds: number[]) => {
    if (!confirm(`Merge ${deleteIds.length} airport(s) into ID ${keepId}?`)) return;
    setActionLoading(true);
    try { const r = await apiFetch("/api/duplicates/airports/merge", { method: "POST", body: JSON.stringify({ keepId, deleteIds }) }); toast.success(r.message); await checkDuplicates(); }
    catch (e: any) { toast.error(e.message); } finally { setActionLoading(false); }
  };
  const handleAirportDelete = async (ids: number[]) => {
    if (!confirm(`Permanently delete ${ids.length} airport record(s)?`)) return;
    setActionLoading(true);
    try { const r = await apiFetch("/api/duplicates/airports/delete", { method: "POST", body: JSON.stringify({ ids }) }); toast.success(r.message); await checkDuplicates(); }
    catch (e: any) { toast.error(e.message); } finally { setActionLoading(false); }
  };
  const handleOpsMerge = async (keepId: number, deleteIds: number[]) => {
    if (!confirm(`Merge ${deleteIds.length} duplicate operation(s) into ID ${keepId}? Best data will be preserved.`)) return;
    setActionLoading(true);
    try { const r = await apiFetch("/api/duplicates/operations/merge", { method: "POST", body: JSON.stringify({ keepId, deleteIds }) }); toast.success(r.message); await checkDuplicates(); }
    catch (e: any) { toast.error(e.message); } finally { setActionLoading(false); }
  };
  const handleOpsDelete = async (ids: number[]) => {
    if (!confirm(`Permanently delete ${ids.length} duplicate operation record(s)?`)) return;
    setActionLoading(true);
    try { const r = await apiFetch("/api/duplicates/operations/delete", { method: "POST", body: JSON.stringify({ ids }) }); toast.success(r.message); await checkDuplicates(); }
    catch (e: any) { toast.error(e.message); } finally { setActionLoading(false); }
  };

  const tabs = [
    { key: "airlines" as const, label: "Airlines", icon: Plane, data: data?.airlines },
    { key: "airports" as const, label: "Airports", icon: Building2, data: data?.airports },
    { key: "operations" as const, label: "Operations", icon: Network, data: data?.operations },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Duplicate Detection</h2>
          <p className="text-sm text-slate-500 mt-0.5">Scan for duplicate airlines, airports, and airline-airport operation records</p>
        </div>
        <Button variant="primary" onClick={checkDuplicates} isLoading={loading} className="shrink-0 hover:scale-105 active:scale-95 transition-all">
          <Search className="h-4 w-4 mr-2" />
          {checked ? "Re-Scan Database" : "Check for Duplicates"}
        </Button>
      </div>

      {checked && data && (
        <div className="grid grid-cols-3 gap-4">
          {tabs.map(({ key, label, icon: Icon, data: d }) => (
            <div key={key} className={`rounded-xl p-4 border-2 ${d && d.totalGroups > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${d && d.totalGroups > 0 ? "text-amber-600" : "text-green-600"}`} />
                <span className="text-sm font-bold text-slate-700">{label}</span>
              </div>
              {d && d.totalGroups > 0 ? (
                <><p className="text-2xl font-black font-mono text-amber-700">{d.totalGroups} groups</p><p className="text-xs text-amber-600 mt-0.5">{d.totalDuplicates} records can be removed</p></>
              ) : (
                <><p className="text-2xl font-black font-mono text-green-700">Clean</p><p className="text-xs text-green-600 mt-0.5">No duplicates found</p></>
              )}
            </div>
          ))}
        </div>
      )}

      {!checked && !loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><GitMerge className="h-8 w-8 text-slate-400" /></div>
          <h3 className="font-bold text-slate-700 mb-1">No scan performed yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">Click "Check for Duplicates" to scan for duplicate airlines, airports, and airline-airport operation records.</p>
        </div>
      )}

      {checked && data && (
        <>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {tabs.map(({ key, label, icon: Icon, data: d }) => (
              <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${tab === key ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
                <Icon className="h-4 w-4" />
                {label}
                {d && d.totalGroups > 0 && <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{d.totalGroups}</span>}
              </button>
            ))}
          </div>

          {tab === "airlines" && (
            data.airlines.totalGroups === 0
              ? <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"><CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" /><p className="font-bold text-green-700">No duplicate airlines found</p></div>
              : <div className="space-y-3">{data.airlines.groups.map((g, i) => <AirlineGroup key={`${g.key_field}-${i}`} group={g} idx={i} onMerge={handleAirlineMerge} onDelete={handleAirlineDelete} loading={actionLoading} />)}</div>
          )}
          {tab === "airports" && (
            data.airports.totalGroups === 0
              ? <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"><CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" /><p className="font-bold text-green-700">No duplicate airports found</p></div>
              : <div className="space-y-3">{data.airports.groups.map((g, i) => <AirportGroup key={`${g.key_field}-${i}`} group={g} idx={i} onMerge={handleAirportMerge} onDelete={handleAirportDelete} loading={actionLoading} />)}</div>
          )}
          {tab === "operations" && (
            data.operations.totalGroups === 0
              ? <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"><CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" /><p className="font-bold text-green-700">No duplicate airline-airport operations found</p><p className="text-sm text-green-500 mt-1">Each airline appears only once per airport</p></div>
              : <div className="space-y-3">{data.operations.groups.map((g, i) => <OpsGroup key={`${g.key_field}-${i}`} group={g} idx={i} onMerge={handleOpsMerge} onDelete={handleOpsDelete} loading={actionLoading} />)}</div>
          )}
        </>
      )}
    </div>
  );
}
