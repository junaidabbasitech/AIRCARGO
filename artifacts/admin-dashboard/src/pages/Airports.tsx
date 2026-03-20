import { useState } from "react";
import { useListAirports, useUpdateAirportStatus, useCreateAirport, useUpdateAirport, useDeleteAirport, Airport, AirportStatus, CreateAirportRequest, UpdateAirportRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Label } from "@/components/ui";
import { Search, Plus, Edit2, Trash2, Check, X, Filter, MapPin, CheckSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  iataCode: z.string().optional().nullable(),
  cbpPortCode: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  customsApproved: z.boolean().default(false),
  source: z.string().optional().nullable(),
});

export default function Airports() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AirportStatus | "">("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirport, setEditingAirport] = useState<Airport | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const queryClient = useQueryClient();
  const { data, isLoading } = useListAirports({ search, status: statusFilter as any, page, limit });

  const createMut = useCreateAirport({ mutation: {
    onSuccess: () => { toast.success("Airport created"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); closeModal(); },
    onError: (err: any) => toast.error(err.message)
  }});
  const updateMut = useUpdateAirport({ mutation: {
    onSuccess: () => { toast.success("Airport updated"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); closeModal(); },
    onError: (err: any) => toast.error(err.message)
  }});
  const deleteMut = useDeleteAirport({ mutation: {
    onSuccess: () => { toast.success("Airport deleted"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); },
    onError: (err: any) => toast.error(err.message)
  }});
  const statusMut = useUpdateAirportStatus({ mutation: {
    onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); },
    onError: (err: any) => toast.error(err.message)
  }});

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", iataCode: "", cbpPortCode: "", city: "", state: "", country: "", customsApproved: false, source: "manual" }
  });

  const openModal = (airport?: Airport) => {
    if (airport) { setEditingAirport(airport); reset({ name: airport.name, iataCode: airport.iataCode, cbpPortCode: airport.cbpPortCode, city: airport.city, state: airport.state, country: airport.country, customsApproved: airport.customsApproved, source: airport.source }); }
    else { setEditingAirport(null); reset({ name: "", iataCode: "", cbpPortCode: "", city: "", state: "", country: "", customsApproved: false, source: "manual" }); }
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingAirport(null); };
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingAirport) updateMut.mutate({ id: editingAirport.id, data: values as UpdateAirportRequest });
    else createMut.mutate({ data: values as CreateAirportRequest });
  };

  // Selection logic
  const allIds = data?.data.map(a => a.id) ?? [];
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const someSelected = allIds.some(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) setSelected(s => { const n = new Set(s); allIds.forEach(id => n.delete(id)); return n; });
    else setSelected(s => { const n = new Set(s); allIds.forEach(id => n.add(id)); return n; });
  };
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const bulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selected);
    let done = 0;
    for (const id of ids) {
      try { await fetch(`/api/airports/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "approved" }) }); done++; }
      catch { /* skip */ }
    }
    setBulkLoading(false);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["/api/airports"] });
    toast.success(`Bulk approved ${done} airport(s)`);
  };

  const bulkReject = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selected);
    let done = 0;
    for (const id of ids) {
      try { await fetch(`/api/airports/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }) }); done++; }
      catch { /* skip */ }
    }
    setBulkLoading(false);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["/api/airports"] });
    toast.success(`Bulk rejected ${done} airport(s)`);
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Permanently delete ${selected.size} airport(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/airports/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected) }) });
      const data = await res.json();
      toast.success(`Deleted ${data.deleted} airport(s)`);
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/airports"] });
    } catch { toast.error("Bulk delete failed"); }
    setBulkLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Airports Registry</CardTitle>
          <Button variant="primary" onClick={() => openModal()} className="hover:scale-105 active:scale-95 transition-all">
            <Plus className="h-4 w-4 mr-2" /> Add Airport
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search airports by name, city, state, IATA..." className="pl-9 hover:border-primary/50 transition-colors" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="relative w-full sm:w-44">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select className="pl-9 hover:border-primary/50 transition-colors cursor-pointer" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
          </div>

          {/* Bulk actions bar */}
          {someSelected && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-sky-50 border border-sky-200 rounded-xl">
              <CheckSquare className="h-4 w-4 text-sky-600" />
              <span className="text-sm font-semibold text-sky-700">{selected.size} selected</span>
              <button
                onClick={bulkApprove}
                disabled={bulkLoading}
                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white text-xs font-bold rounded-lg transition-all duration-150 shadow hover:shadow-green-300/50 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                {bulkLoading ? "Processing..." : "Approve All"}
              </button>
              <button
                onClick={bulkReject}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-bold rounded-lg transition-all duration-150 shadow hover:shadow-red-300/50 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Reject All
              </button>
              <button
                onClick={bulkDelete}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-700 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold rounded-lg transition-all duration-150 shadow disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete All
              </button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2">Clear</button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }} onChange={toggleAll} className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
                </TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Codes</TableHead>
                <TableHead>Customs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No records found.</TableCell></TableRow>
              ) : data?.data.map(airport => (
                <TableRow key={airport.id} className={selected.has(airport.id) ? "bg-sky-50" : "hover:bg-muted/30"}>
                  <TableCell>
                    <input type="checkbox" checked={selected.has(airport.id)} onChange={() => toggleOne(airport.id)} className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground text-sm">{airport.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {airport.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {[airport.city, airport.state, airport.country].filter(Boolean).join(", ") || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {airport.iataCode && <span className="text-xs font-mono bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded w-fit">IATA: {airport.iataCode}</span>}
                      {airport.cbpPortCode && <span className="text-xs font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded w-fit">CBP: {airport.cbpPortCode}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{airport.customsApproved ? <Badge variant="success">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                  <TableCell>
                    {airport.flaggedForReview ? <Badge variant="warning">Flagged</Badge> :
                      airport.status === "approved" ? <Badge variant="success">Approved</Badge> :
                      airport.status === "rejected" ? <Badge variant="danger">Rejected</Badge> :
                      <Badge variant="warning">Pending</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {airport.status !== "approved" && (
                        <button title="Approve" onClick={() => statusMut.mutate({ id: airport.id, data: { status: "approved" }})} className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 hover:text-green-700 active:scale-90 transition-all duration-150">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {airport.status !== "rejected" && (
                        <button title="Reject" onClick={() => statusMut.mutate({ id: airport.id, data: { status: "rejected" }})} className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 hover:text-red-700 active:scale-90 transition-all duration-150">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button title="Edit" onClick={() => openModal(airport)} className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-100 hover:text-sky-800 active:scale-90 transition-all duration-150">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button title="Delete" onClick={() => { if (confirm("Delete airport?")) deleteMut.mutate({ id: airport.id }); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-700 active:scale-90 transition-all duration-150">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data && data.total > limit && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm font-mono text-muted-foreground">Page {page} of {Math.ceil(data.total / limit)}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="hover:border-sky-400 hover:text-sky-600 transition-all">← Prev</Button>
                <Button size="sm" variant="outline" disabled={page * limit >= data.total} onClick={() => setPage(p => p + 1)} className="hover:border-sky-400 hover:text-sky-600 transition-all">Next →</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingAirport ? "Edit Airport" : "Add Airport"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Facility Name *</Label>
            <Input {...register("name")} className="hover:border-sky-400 transition-colors" />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>IATA Code</Label><Input {...register("iataCode")} className="uppercase hover:border-sky-400 transition-colors" /></div>
            <div className="space-y-2"><Label>CBP Port Code</Label><Input {...register("cbpPortCode")} className="uppercase hover:border-orange-400 transition-colors" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2"><Label>City</Label><Input {...register("city")} className="hover:border-sky-400 transition-colors" /></div>
            <div className="space-y-2"><Label>State</Label><Input {...register("state")} className="hover:border-sky-400 transition-colors" /></div>
            <div className="space-y-2"><Label>Country</Label><Input {...register("country")} className="hover:border-sky-400 transition-colors" /></div>
          </div>
          <div className="flex items-center gap-2 p-3 border border-border rounded-xl bg-muted/30 hover:bg-sky-50 hover:border-sky-200 transition-all cursor-pointer">
            <input type="checkbox" id="customs" {...register("customsApproved")} className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
            <Label htmlFor="customs" className="cursor-pointer">Customs Facility Approved</Label>
          </div>
          <div className="pt-3 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModal} className="hover:bg-red-50 hover:text-red-600 transition-all">Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMut.isPending || updateMut.isPending} className="hover:scale-105 active:scale-95 transition-all">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
