import { useState } from "react";
import { useListAirports, useUpdateAirportStatus, useCreateAirport, useUpdateAirport, useDeleteAirport, Airport, AirportStatus, CreateAirportRequest, UpdateAirportRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Label } from "@/components/ui";
import { Search, Plus, Edit2, Trash2, Check, X, Filter, MapPin } from "lucide-react";
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

  const queryClient = useQueryClient();
  const { data, isLoading } = useListAirports({ search, status: statusFilter as any, page, limit });

  const createMut = useCreateAirport({
    mutation: {
      onSuccess: () => { toast.success("Airport created"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); closeModal(); },
      onError: (err: any) => toast.error(err.message)
    }
  });

  const updateMut = useUpdateAirport({
    mutation: {
      onSuccess: () => { toast.success("Airport updated"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); closeModal(); },
      onError: (err: any) => toast.error(err.message)
    }
  });

  const deleteMut = useDeleteAirport({
    mutation: {
      onSuccess: () => { toast.success("Airport deleted"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); },
      onError: (err: any) => toast.error(err.message)
    }
  });

  const statusMut = useUpdateAirportStatus({
    mutation: {
      onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["/api/airports"] }); },
      onError: (err: any) => toast.error(err.message)
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", iataCode: "", cbpPortCode: "", city: "", state: "", country: "", customsApproved: false, source: "manual" }
  });

  const openModal = (airport?: Airport) => {
    if (airport) {
      setEditingAirport(airport);
      reset({ name: airport.name, iataCode: airport.iataCode, cbpPortCode: airport.cbpPortCode, city: airport.city, state: airport.state, country: airport.country, customsApproved: airport.customsApproved, source: airport.source });
    } else {
      setEditingAirport(null);
      reset({ name: "", iataCode: "", cbpPortCode: "", city: "", state: "", country: "", customsApproved: false, source: "manual" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingAirport(null); };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingAirport) updateMut.mutate({ id: editingAirport.id, data: values as UpdateAirportRequest });
    else createMut.mutate({ data: values as CreateAirportRequest });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Airports Registry</CardTitle>
          <Button variant="primary" onClick={() => openModal()}><Plus className="h-4 w-4 mr-2" /> Add Airport</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search airports..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
              <Select className="pl-9" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading registry data...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found.</TableCell></TableRow>
              ) : (
                data?.data.map((airport) => (
                  <TableRow key={airport.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground">{airport.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {airport.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{[airport.city, airport.state, airport.country].filter(Boolean).join(", ") || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {airport.iataCode && <span className="text-xs font-mono">IATA: {airport.iataCode}</span>}
                        {airport.cbpPortCode && <span className="text-xs font-mono text-primary">CBP: {airport.cbpPortCode}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{airport.customsApproved ? <Badge variant="success">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                    <TableCell>
                      {airport.flaggedForReview ? <Badge variant="warning">Flagged</Badge> : 
                        airport.status === 'approved' ? <Badge variant="success">Approved</Badge> :
                        airport.status === 'rejected' ? <Badge variant="danger">Rejected</Badge> :
                        <Badge variant="warning">Pending</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {airport.status !== 'approved' && <Button size="icon" variant="ghost" className="text-success hover:bg-success/20" onClick={() => statusMut.mutate({ id: airport.id, data: { status: 'approved' }})}><Check className="h-4 w-4" /></Button>}
                        {airport.status !== 'rejected' && <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/20" onClick={() => statusMut.mutate({ id: airport.id, data: { status: 'rejected' }})}><X className="h-4 w-4" /></Button>}
                        <Button size="icon" variant="ghost" className="text-primary hover:bg-primary/20" onClick={() => openModal(airport)}><Edit2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/20" onClick={() => { if(confirm("Delete airport?")) deleteMut.mutate({ id: airport.id }) }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.total > limit && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm font-mono text-muted-foreground">Page {page} of {Math.ceil(data.total/limit)}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page * limit >= data.total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingAirport ? "Edit Airport" : "Add Airport"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Facility Name *</Label>
            <Input {...register("name")} />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>IATA Code</Label><Input {...register("iataCode")} className="uppercase" /></div>
            <div className="space-y-2"><Label>CBP Port Code</Label><Input {...register("cbpPortCode")} className="uppercase" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>City</Label><Input {...register("city")} /></div>
            <div className="space-y-2"><Label>State</Label><Input {...register("state")} /></div>
            <div className="space-y-2"><Label>Country</Label><Input {...register("country")} /></div>
          </div>
          <div className="flex items-center gap-2 mt-4 p-3 border border-border rounded-lg bg-background/50">
            <input type="checkbox" id="customs" {...register("customsApproved")} className="h-4 w-4 rounded border-border bg-transparent text-primary focus:ring-primary focus:ring-offset-background accent-primary" />
            <Label htmlFor="customs" className="cursor-pointer">Customs Facility Approved</Label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMut.isPending || updateMut.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
