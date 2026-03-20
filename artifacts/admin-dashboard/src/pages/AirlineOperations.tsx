import { useState, useEffect } from "react";
import { useListAirlines, useListAirports } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Label, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui";
import { Plus, Edit2, Trash2, Search, Plane, Building2, Hash, DollarSign, Phone, Mail, Filter, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface AirlineOp {
  id: number;
  airlineId: number;
  airportId: number;
  firmsCode: string | null;
  iscAmount: string | null;
  iscPayableAt: string | null;
  iscPayableTo: string | null;
  contactNumber: string | null;
  contactEmail: string | null;
  notes: string | null;
  lastUpdated: string;
  airlineName: string | null;
  airlineIata: string | null;
  airportName: string | null;
  airportIata: string | null;
  airportCity: string | null;
  airportState: string | null;
}

const emptyForm = { airlineId: "", airportId: "", firmsCode: "", iscAmount: "", iscPayableAt: "", iscPayableTo: "", contactNumber: "", contactEmail: "", notes: "" };

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Request failed"); }
  return res.json();
}

export default function AirlineOperations() {
  const [ops, setOps] = useState<AirlineOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAirline, setFilterAirline] = useState("");
  const [filterAirport, setFilterAirport] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<AirlineOp | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const airlinesQ = useListAirlines({ status: "approved" as any, page: 1, limit: 300 });
  const airportsQ = useListAirports({ status: "approved" as any, page: 1, limit: 300 });

  const loadOps = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/airline-operations");
      setOps(data.data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOps(); }, []);

  const filtered = ops.filter(op => {
    const an = (op.airlineName ?? "").toLowerCase();
    const ap = (op.airportName ?? "").toLowerCase();
    const iata = (op.airlineIata ?? "").toLowerCase();
    const apIata = (op.airportIata ?? "").toLowerCase();
    if (filterAirline && !an.includes(filterAirline.toLowerCase()) && !iata.includes(filterAirline.toLowerCase())) return false;
    if (filterAirport && !ap.includes(filterAirport.toLowerCase()) && !apIata.includes(filterAirport.toLowerCase())) return false;
    return true;
  });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setIsModalOpen(true); };
  const openEdit = (op: AirlineOp) => {
    setEditing(op);
    setForm({
      airlineId: String(op.airlineId),
      airportId: String(op.airportId),
      firmsCode: op.firmsCode ?? "",
      iscAmount: op.iscAmount ?? "",
      iscPayableAt: op.iscPayableAt ?? "",
      iscPayableTo: op.iscPayableTo ?? "",
      contactNumber: op.contactNumber ?? "",
      contactEmail: op.contactEmail ?? "",
      notes: op.notes ?? "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.airlineId || !form.airportId) { toast.error("Airline and airport are required"); return; }
    setSaving(true);
    try {
      const body = {
        airlineId: parseInt(form.airlineId),
        airportId: parseInt(form.airportId),
        firmsCode: form.firmsCode || null,
        iscAmount: form.iscAmount || null,
        iscPayableAt: form.iscPayableAt || null,
        iscPayableTo: form.iscPayableTo || null,
        contactNumber: form.contactNumber || null,
        contactEmail: form.contactEmail || null,
        notes: form.notes || null,
      };
      if (editing) {
        await apiFetch(`/api/airline-operations/${editing.id}`, { method: "PUT", body: JSON.stringify(body) });
        toast.success("Record updated");
      } else {
        await apiFetch("/api/airline-operations", { method: "POST", body: JSON.stringify(body) });
        toast.success("Record created");
      }
      setIsModalOpen(false);
      loadOps();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this operation record?")) return;
    try {
      await apiFetch(`/api/airline-operations/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      loadOps();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Airline Operations & ISC Registry</CardTitle>
          <Button variant="primary" onClick={openCreate} className="hover:scale-105 active:scale-95 transition-all">
            <Plus className="h-4 w-4 mr-2" /> Add Operation
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage airline-airport operations: FIRMS codes, ISC charges, ground handler contacts and payment details.
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter by airline name or IATA..." className="pl-9 hover:border-primary/50 transition-colors" value={filterAirline} onChange={e => setFilterAirline(e.target.value)} />
            </div>
            <div className="relative flex-1">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter by airport name or IATA..." className="pl-9 hover:border-primary/50 transition-colors" value={filterAirport} onChange={e => setFilterAirport(e.target.value)} />
            </div>
            {(filterAirline || filterAirport) && (
              <button onClick={() => { setFilterAirline(""); setFilterAirport(""); }} className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg transition-all">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Airline</TableHead>
                <TableHead>Airport</TableHead>
                <TableHead>FIRMS Code</TableHead>
                <TableHead>ISC Amount</TableHead>
                <TableHead>ISC Payable To</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No records found. Add an airline operation above.</TableCell></TableRow>
              ) : filtered.map(op => (
                <>
                  <TableRow key={op.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setExpandedRow(expandedRow === op.id ? null : op.id)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 font-bold font-mono text-xs shrink-0">{op.airlineIata}</div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{op.airlineName}</p>
                          <p className="text-xs text-muted-foreground">IATA: {op.airlineIata}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 font-bold font-mono text-xs shrink-0">{op.airportIata}</div>
                        <div>
                          <p className="font-semibold text-sm">{op.airportName}</p>
                          <p className="text-xs text-muted-foreground">{[op.airportCity, op.airportState].filter(Boolean).join(", ")}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {op.firmsCode ? <Badge variant="outline" className="font-mono text-xs border-sky-300 text-sky-700 bg-sky-50">{op.firmsCode}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {op.iscAmount ? <span className="text-sm font-semibold text-green-700">${op.iscAmount}</span> : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm truncate max-w-[140px]">{op.iscPayableTo || <span className="text-muted-foreground text-xs">—</span>}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {op.contactNumber && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {op.contactNumber.split("\n")[0]}</p>}
                        {op.contactEmail && <p className="flex items-center gap-1 truncate max-w-[160px]"><Mail className="h-3 w-3" /> {op.contactEmail.split(";")[0]}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button title="Edit" onClick={() => openEdit(op)} className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-100 active:scale-90 transition-all">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button title="Delete" onClick={() => handleDelete(op.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-700 active:scale-90 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 self-center ${expandedRow === op.id ? "rotate-90" : ""}`} />
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRow === op.id && (
                    <TableRow key={`${op.id}-detail`}>
                      <TableCell colSpan={7} className="bg-muted/20 border-b border-border">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2 px-2">
                          <ExpandDetail label="ISC Payable At" value={op.iscPayableAt} />
                          <ExpandDetail label="Contact Number" value={op.contactNumber} />
                          <ExpandDetail label="Email Address" value={op.contactEmail} />
                          <ExpandDetail label="Notes" value={op.notes} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>

          <div className="mt-3 text-sm font-mono text-muted-foreground">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""} {(filterAirline || filterAirport) ? "(filtered)" : "total"}
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "Edit Operation Record" : "Add Airline Operation"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Airline *</Label>
              <Select value={form.airlineId} onChange={f("airlineId")} className="hover:border-sky-400 transition-colors">
                <option value="">— Select Airline —</option>
                {airlinesQ.data?.data.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.iataCode})</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Airport *</Label>
              <Select value={form.airportId} onChange={f("airportId")} className="hover:border-orange-400 transition-colors">
                <option value="">— Select Airport —</option>
                {airportsQ.data?.data.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.iataCode})</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>FIRMS Code</Label>
              <Input value={form.firmsCode} onChange={f("firmsCode")} placeholder="e.g. F670" className="uppercase hover:border-sky-400 transition-colors" />
            </div>
            <div className="space-y-2">
              <Label>ISC Amount ($)</Label>
              <Input value={form.iscAmount} onChange={f("iscAmount")} placeholder="e.g. 180.50 or 75–105" className="hover:border-green-400 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ISC Payable At</Label>
              <Input value={form.iscPayableAt} onChange={f("iscPayableAt")} placeholder="e.g. Epic, Cargo Sprint" className="hover:border-sky-400 transition-colors" />
            </div>
            <div className="space-y-2">
              <Label>ISC Payable To (Ground Handler)</Label>
              <Input value={form.iscPayableTo} onChange={f("iscPayableTo")} placeholder="e.g. WFS, Alliance Ground" className="hover:border-purple-400 transition-colors" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contact Number(s)</Label>
            <Input value={form.contactNumber} onChange={f("contactNumber")} placeholder="e.g. 718-656-3980 / 718-880-3417" className="hover:border-sky-400 transition-colors" />
          </div>

          <div className="space-y-2">
            <Label>Contact Email(s)</Label>
            <Input value={form.contactEmail} onChange={f("contactEmail")} placeholder="e.g. ekimport@wfs.aero" className="hover:border-sky-400 transition-colors" />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <textarea
              value={form.notes}
              onChange={f("notes")}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-primary/50 transition-colors resize-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="hover:bg-red-50 hover:text-red-600 transition-all">Cancel</Button>
            <Button type="button" variant="primary" onClick={handleSave} isLoading={saving} className="hover:scale-105 active:scale-95 transition-all">
              {editing ? "Save Changes" : "Create Record"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ExpandDetail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="bg-white rounded-lg border border-border p-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-foreground break-words">{value}</p>
    </div>
  );
}
