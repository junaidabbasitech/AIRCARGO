import { useState } from "react";
import { useListAirlines, useUpdateAirlineStatus, useCreateAirline, useUpdateAirline, useDeleteAirline, Airline, AirlineStatus, CreateAirlineRequest, UpdateAirlineRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Label } from "@/components/ui";
import { Search, Plus, Edit2, Trash2, Check, X, Filter } from "lucide-react";
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

export default function Airlines() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AirlineStatus | "">("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);

  const queryClient = useQueryClient();
  const { data, isLoading } = useListAirlines({ search, status: statusFilter as any, page, limit });

  const createMut = useCreateAirline({
    mutation: {
      onSuccess: () => {
        toast.success("Airline created successfully");
        queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
        closeModal();
      },
      onError: (err: any) => toast.error(`Error: ${err.message}`)
    }
  });

  const updateMut = useUpdateAirline({
    mutation: {
      onSuccess: () => {
        toast.success("Airline updated successfully");
        queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
        closeModal();
      },
      onError: (err: any) => toast.error(`Error: ${err.message}`)
    }
  });

  const deleteMut = useDeleteAirline({
    mutation: {
      onSuccess: () => {
        toast.success("Airline deleted");
        queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
      },
      onError: (err: any) => toast.error(`Error: ${err.message}`)
    }
  });

  const statusMut = useUpdateAirlineStatus({
    mutation: {
      onSuccess: () => {
        toast.success("Status updated");
        queryClient.invalidateQueries({ queryKey: ["/api/airlines"] });
      },
      onError: (err: any) => toast.error(`Error: ${err.message}`)
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", iataCode: "", cbpCode: "", icaoCode: "", country: "", source: "manual" }
  });

  const openModal = (airline?: Airline) => {
    if (airline) {
      setEditingAirline(airline);
      reset({
        name: airline.name,
        iataCode: airline.iataCode,
        cbpCode: airline.cbpCode,
        icaoCode: airline.icaoCode,
        country: airline.country,
        source: airline.source
      });
    } else {
      setEditingAirline(null);
      reset({ name: "", iataCode: "", cbpCode: "", icaoCode: "", country: "", source: "manual" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAirline(null);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingAirline) {
      updateMut.mutate({ id: editingAirline.id, data: values as UpdateAirlineRequest });
    } else {
      createMut.mutate({ data: values as CreateAirlineRequest });
    }
  };

  const renderStatusBadge = (status: string, flagged: boolean) => {
    if (flagged) return <Badge variant="warning">Flagged</Badge>;
    switch (status) {
      case "approved": return <Badge variant="success">Approved</Badge>;
      case "rejected": return <Badge variant="danger">Rejected</Badge>;
      case "pending": return <Badge variant="warning">Pending</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Airlines Registry</CardTitle>
          <Button variant="primary" onClick={() => openModal()}><Plus className="h-4 w-4 mr-2" /> Add Airline</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search airlines by name, IATA, CBP..." 
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
              <Select 
                className="pl-9"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
              >
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
                <TableHead>Airline</TableHead>
                <TableHead>Codes (IATA / ICAO / CBP)</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading registry data...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found matching criteria.</TableCell></TableRow>
              ) : (
                data?.data.map((airline) => (
                  <TableRow key={airline.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground">{airline.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {airline.id} • Src: {airline.source || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {airline.iataCode && <Badge variant="outline" className="px-1.5 py-0">IATA: {airline.iataCode}</Badge>}
                        {airline.icaoCode && <Badge variant="outline" className="px-1.5 py-0">ICAO: {airline.icaoCode}</Badge>}
                        {airline.cbpCode && <Badge variant="outline" className="px-1.5 py-0 border-primary/50 text-primary">CBP: {airline.cbpCode}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{airline.country || "—"}</TableCell>
                    <TableCell>{renderStatusBadge(airline.status, airline.flaggedForReview)}</TableCell>
                    <TableCell>{formatDate(airline.lastUpdated)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {airline.status !== 'approved' && (
                          <Button size="icon" variant="ghost" className="text-success hover:text-success hover:bg-success/20" title="Approve" onClick={() => statusMut.mutate({ id: airline.id, data: { status: 'approved' }})}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {airline.status !== 'rejected' && (
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/20" title="Reject" onClick={() => statusMut.mutate({ id: airline.id, data: { status: 'rejected' }})}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/20" onClick={() => openModal(airline)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/20" onClick={() => { if(confirm("Delete this airline?")) deleteMut.mutate({ id: airline.id }) }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.total > limit && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm font-mono text-muted-foreground">Showing {((page-1)*limit)+1} - {Math.min(page*limit, data.total)} of {data.total}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button size="sm" variant="outline" disabled={page * limit >= data.total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingAirline ? "Edit Airline" : "Register Airline"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Airline Name *</Label>
            <Input {...register("name")} placeholder="e.g. Delta Air Lines" />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IATA Code</Label>
              <Input {...register("iataCode")} placeholder="e.g. DL" maxLength={2} className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>ICAO Code</Label>
              <Input {...register("icaoCode")} placeholder="e.g. DAL" maxLength={3} className="uppercase" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CBP Code</Label>
              <Input {...register("cbpCode")} placeholder="e.g. DL" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input {...register("country")} placeholder="e.g. United States" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMut.isPending || updateMut.isPending}>
              {editingAirline ? "Save Changes" : "Create Record"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
