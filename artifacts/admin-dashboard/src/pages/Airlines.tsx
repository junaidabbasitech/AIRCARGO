import { useState } from "react";
import { useListAirlines, useUpdateAirlineStatus, useCreateAirline, useUpdateAirline, useDeleteAirline, Airline, AirlineStatus, CreateAirlineRequest, UpdateAirlineRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Label } from "@/components/ui";
import { Search, Plus, Edit2, Trash2, Check, X, Filter, CheckSquare, ChevronsUpDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  iataCode: z.string().optional().nullable(),
  cbpCode: z.string().optional().nullable(),
  icaoCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
});

const PAGE_SIZES = [20, 40, 50, 100];

export default function Airlines() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AirlineStatus | "">("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [allFilterSelected, setAllFilterSelected] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const queryClient = useQueryClient();
  const { data, isLoading } = useListAirlines({ search, status: statusFilter as any, page, limit });

  const createMut = useCreateAirline({ mutation: {
    onSuccess: () => { toast.success("Airline created"); queryClient.invalidateQueries({ queryKey: ["/api/airlines"] }); closeModal(); },
    onError: (err: any) => toast.error(err.message)
  }});
  const updateMut = useUpdateAirline({ mutation: {
    onSuccess: () => { toast.success("Airline updated"); queryClient.invalidateQueries({ queryKey: ["/api/airlines"] }); closeModal(); },
    onError: (err: any) => toast.error(err.message)
  }});
  const deleteMut = useDeleteAirline({ mutation: {
    onSuccess: () => { toast.success("Airline deleted"); queryClient.invalidateQueries({ queryKey: ["/api/airlines"] }); },
    onError: (err: any) => toast.error(err.message)
  }});
  const statusMut = useUpdateAirlineStatus({ mutation: {
    onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["/api/airlines"] }); },
    onError: (err: any) => toast.error(err.message)
  }});

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", iataCode: "", cbpCode: "", icaoCode: "", country: "", source: "manual" }
  });

  const openModal = (airline?: Airline) => {
    if (airline) { setEditingAirline(airline); reset({ name: airline.name, iataCode: airline.iataCode, cbpCode: airline.cbpCode, icaoCode: airline.icaoCode, country: airline.country, source: airline.source }); }
    else { setEditingAirline(null); reset({ name: "", iataCode: "", cbpCode: "", icaoCode: "", country: "", source: "manual" }); }
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingAirline(null); };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingAirline) updateMut.mutate({ id: editingAirline.id, data: values as UpdateAirlineRequest });
    else createMut.mutate({ data: values as CreateAirlineRequest });
  };

  const pageIds = data?.data.map(a => a.id) ?? [];
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.has(id));
  const somePageSelected = pageIds.some(id => selected.has(id));

  // Toggle page selection; if page fully selected and there are more records, offer to select all
  const toggleAll = async () => {
    if (allPageSelected) {
      // Deselect everything
      setSelected(new Set());
      setAllFilterSelected(false);
    } else {
      // Select current page
      setSelected(s => { const n = new Set(s); pageIds.forEach(id => n.add(id)); return n; });
    }
  };

  const selectAllInFilter = async () => {
    setBulkLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/airlines/all-ids?${params}`);
      const json = await res.json();
      setSelected(new Set(json.ids));
      setAllFilterSelected(true);
      toast.success(`Selected all ${json.total} airlines matching current filter`);
    } catch { toast.error("Failed to select all"); }
    setBulkLoading(false);
  };

  const toggleOne = (id: number) => {
    setAllFilterSelected(false);
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const bulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/airlines/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), status: "approved" })
      });
      const json = await res.json();
      toast.success(`Approved ${json.updated} airline(s)`);
      setSelected(new Set()); setAllFilterSelected(false);
      queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
    } catch { toast.error("Bulk approve failed"); }
    setBulkLoading(false);
  };

  const bulkReject = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/airlines/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), status: "rejected" })
      });
      const json = await res.json();
      toast.success(`Rejected ${json.updated} airline(s)`);
      setSelected(new Set()); setAllFilterSelected(false);
      queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
    } catch { toast.error("Bulk reject failed"); }
    setBulkLoading(false);
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Permanently delete ${selected.size} airline(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/airlines/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected) }) });
      const json = await res.json();
      toast.success(`Deleted ${json.deleted} airline(s)`);
      setSelected(new Set()); setAllFilterSelected(false);
      queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
    } catch { toast.error("Bulk delete failed"); }
    setBulkLoading(false);
  };

  const renderStatus = (status: string, flagged: boolean) => {
    if (flagged) return <Badge variant="warning">Flagged</Badge>;
    if (status === "approved") return <Badge variant="success">Approved</Badge>;
    if (status === "rejected") return <Badge variant="danger">Rejected</Badge>;
    return <Badge variant="warning">Pending</Badge>;
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Airlines Registry</CardTitle>
          <Button variant="primary" onClick={() => openModal()} className="hover:scale-105 active:scale-95 transition-all">
            <Plus className="h-4 w-4 mr-2" /> Add Airline
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, IATA, CBP, ICAO..." className="pl-9 hover:border-primary/50 focus:border-primary transition-colors" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); setSelected(new Set()); setAllFilterSelected(false); }} />
            </div>
            <div className="relative w-full sm:w-44">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select className="pl-9 hover:border-primary/50 transition-colors cursor-pointer" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); setSelected(new Set()); setAllFilterSelected(false); }}>
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
            <div className="relative w-full sm:w-36">
              <ChevronsUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select className="pl-9 hover:border-primary/50 transition-colors cursor-pointer" value={String(limit)} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                {PAGE_SIZES.map(n => <option key={n} value={n}>Show {n}</option>)}
              </Select>
            </div>
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-sky-50 border border-sky-200 rounded-xl">
              <CheckSquare className="h-4 w-4 text-sky-600 shrink-0" />
              <span className="text-sm font-semibold text-sky-700">{selected.size} selected</span>

              {/* Select-all-in-filter banner */}
              {!allFilterSelected && data && selected.size < data.total && (
                <button
                  onClick={selectAllInFilter}
                  disabled={bulkLoading}
                  className="text-xs text-sky-600 hover:text-sky-800 font-semibold underline underline-offset-2 transition-colors disabled:opacity-50"
                >
                  Select all {data.total} matching this filter
                </button>
              )}
              {allFilterSelected && (
                <span className="text-xs text-sky-500 font-medium italic">All {selected.size} in filter selected</span>
              )}

              <button onClick={bulkApprove} disabled={bulkLoading} className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white text-xs font-bold rounded-lg transition-all duration-150 shadow hover:shadow-green-300/50 disabled:opacity-50">
                <Check className="h-3.5 w-3.5" />
                {bulkLoading ? "Processing..." : "Approve All"}
              </button>
              <button onClick={bulkReject} disabled={bulkLoading} className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-bold rounded-lg transition-all duration-150 shadow hover:shadow-red-300/50 disabled:opacity-50">
                <X className="h-3.5 w-3.5" />
                Reject All
              </button>
              <button onClick={bulkDelete} disabled={bulkLoading} className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-700 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold rounded-lg transition-all duration-150 shadow disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" />
                Delete All
              </button>
              <button onClick={() => { setSelected(new Set()); setAllFilterSelected(false); }} className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2">Clear</button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" checked={allPageSelected} ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }} onChange={toggleAll} className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
                </TableHead>
                <TableHead>Airline</TableHead>
                <TableHead>Codes</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No records found.</TableCell></TableRow>
              ) : data?.data.map(airline => (
                <TableRow key={airline.id} className={selected.has(airline.id) ? "bg-sky-50" : "hover:bg-muted/30"}>
                  <TableCell>
                    <input type="checkbox" checked={selected.has(airline.id)} onChange={() => toggleOne(airline.id)} className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{airline.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {airline.id} • {airline.source || "N/A"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {airline.iataCode && <Badge variant="outline" className="px-1.5 py-0 text-xs">IATA: {airline.iataCode}</Badge>}
                      {airline.icaoCode && <Badge variant="outline" className="px-1.5 py-0 text-xs">ICAO: {airline.icaoCode}</Badge>}
                      {airline.cbpCode && <Badge variant="outline" className="px-1.5 py-0 text-xs border-orange-300 text-orange-600">CBP: {airline.cbpCode}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{airline.country || "—"}</TableCell>
                  <TableCell>{renderStatus(airline.status, airline.flaggedForReview)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(airline.lastUpdated)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {airline.status !== "approved" && (
                        <button title="Approve" onClick={() => statusMut.mutate({ id: airline.id, data: { status: "approved" }})} className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 hover:text-green-700 active:scale-90 transition-all duration-150">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {airline.status !== "rejected" && (
                        <button title="Reject" onClick={() => statusMut.mutate({ id: airline.id, data: { status: "rejected" }})} className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 hover:text-red-700 active:scale-90 transition-all duration-150">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button title="Edit" onClick={() => openModal(airline)} className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-100 hover:text-sky-800 active:scale-90 transition-all duration-150">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button title="Delete" onClick={() => { if (confirm("Delete this airline?")) deleteMut.mutate({ id: airline.id }); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-700 active:scale-90 transition-all duration-150">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data && data.total > 0 && (
            <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
              <span className="text-sm font-mono text-muted-foreground">
                Showing {((page-1)*limit)+1}–{Math.min(page*limit, data.total)} of {data.total}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="hover:border-sky-400 hover:text-sky-600 transition-all">← Prev</Button>
                <span className="flex items-center text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="hover:border-sky-400 hover:text-sky-600 transition-all">Next →</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingAirline ? "Edit Airline" : "Register Airline"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Airline Name *</Label>
            <Input {...register("name")} placeholder="e.g. Delta Air Lines" className="hover:border-sky-400 focus:border-sky-500 transition-colors" />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>IATA Code</Label><Input {...register("iataCode")} placeholder="e.g. DL" className="uppercase hover:border-sky-400 transition-colors" /></div>
            <div className="space-y-2"><Label>ICAO Code</Label><Input {...register("icaoCode")} placeholder="e.g. DAL" className="uppercase hover:border-sky-400 transition-colors" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>CBP Code</Label><Input {...register("cbpCode")} placeholder="e.g. DL" className="hover:border-orange-400 transition-colors" /></div>
            <div className="space-y-2"><Label>Country</Label><Input {...register("country")} placeholder="e.g. US" className="hover:border-sky-400 transition-colors" /></div>
          </div>
          <div className="pt-3 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModal} className="hover:bg-red-50 hover:text-red-600 transition-all">Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMut.isPending || updateMut.isPending} className="hover:scale-105 active:scale-95 transition-all">
              {editingAirline ? "Save Changes" : "Create Record"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
