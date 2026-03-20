import { useState } from "react";
import { useListGroundHandlers, useCreateGroundHandler, useUpdateGroundHandler, useDeleteGroundHandler, useBulkUploadGroundHandlers, GroundHandler, CreateGroundHandlerRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal, Label } from "@/components/ui";
import { Search, Plus, Edit2, Trash2, Upload, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name required"),
  airportId: z.coerce.number().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  services: z.string().optional().nullable(),
});

const PAGE_SIZES = [20, 40, 50, 100];

export default function GroundHandlers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHandler, setEditingHandler] = useState<GroundHandler | null>(null);
  
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvData, setCsvData] = useState("");

  const queryClient = useQueryClient();
  const { data, isLoading } = useListGroundHandlers({ search, page, limit });

  const createMut = useCreateGroundHandler({
    mutation: { onSuccess: () => { toast.success("Added"); queryClient.invalidateQueries({ queryKey: ["/api/ground-handlers"] }); closeModal(); } }
  });
  const updateMut = useUpdateGroundHandler({
    mutation: { onSuccess: () => { toast.success("Updated"); queryClient.invalidateQueries({ queryKey: ["/api/ground-handlers"] }); closeModal(); } }
  });
  const deleteMut = useDeleteGroundHandler({
    mutation: { onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["/api/ground-handlers"] }); } }
  });
  const bulkMut = useBulkUploadGroundHandlers({
    mutation: { 
      onSuccess: (res) => { 
        toast.success(`Upload complete: ${res.inserted} inserted, ${res.skipped} skipped.`); 
        queryClient.invalidateQueries({ queryKey: ["/api/ground-handlers"] }); 
        setIsBulkModalOpen(false); setCsvData(""); 
      },
      onError: (err: any) => toast.error(err.message)
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", airportId: null, contactName: "", contactPhone: "", contactEmail: "", services: "" }
  });

  const openModal = (handler?: GroundHandler) => {
    if (handler) {
      setEditingHandler(handler);
      reset({ name: handler.name, airportId: handler.airportId, contactName: handler.contactName, contactPhone: handler.contactPhone, contactEmail: handler.contactEmail, services: handler.services });
    } else {
      setEditingHandler(null);
      reset({ name: "", airportId: null, contactName: "", contactPhone: "", contactEmail: "", services: "" });
    }
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingHandler(null); };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert empty strings to null for optional API fields
    const payload = { ...values, contactEmail: values.contactEmail || null };
    if (editingHandler) updateMut.mutate({ id: editingHandler.id, data: payload as CreateGroundHandlerRequest });
    else createMut.mutate({ data: payload as CreateGroundHandlerRequest });
  };

  const handleBulkSubmit = () => {
    if(!csvData.trim()) return toast.error("CSV data cannot be empty");
    bulkMut.mutate({ data: { csvData } });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Ground Handlers Directory</CardTitle>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}><Upload className="h-4 w-4 mr-2" /> Bulk Upload</Button>
            <Button variant="primary" onClick={() => openModal()}><Plus className="h-4 w-4 mr-2" /> Add Handler</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search ground handlers..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operator Details</TableHead>
                <TableHead>Primary Contact</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading directory...</TableCell></TableRow>
              ) : data?.data.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records found.</TableCell></TableRow>
              ) : (
                data?.data.map((handler) => (
                  <TableRow key={handler.id}>
                    <TableCell>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> {handler.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Airport: {handler.airportName || `ID ${handler.airportId}` || "Any"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{handler.contactName || "—"}</div>
                      <div className="text-xs font-mono text-muted-foreground">{handler.contactEmail || "—"} • {handler.contactPhone || "—"}</div>
                    </TableCell>
                    <TableCell><div className="text-sm truncate max-w-xs">{handler.services || "—"}</div></TableCell>
                    <TableCell>{formatDate(handler.lastUpdated)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="text-primary hover:bg-primary/20" onClick={() => openModal(handler)}><Edit2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/20" onClick={() => { if(confirm("Delete operator?")) deleteMut.mutate({ id: handler.id }) }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data && data.total > 0 && (
            <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
              <span className="text-sm font-mono text-muted-foreground">
                Showing {Math.min((page-1)*limit+1, data.total)}–{Math.min(page*limit, data.total)} of {data.total}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Show</span>
                  <select
                    value={limit}
                    onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="h-7 px-1.5 rounded border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span>per page</span>
                </div>
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <span className="text-xs text-muted-foreground px-1">Page {page} of {Math.ceil(data.total/limit)}</span>
                <Button size="sm" variant="outline" disabled={page * limit >= data.total} onClick={() => setPage(p => p + 1)}>Next →</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingHandler ? "Edit Operator" : "Add Operator"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2"><Label>Operator Name *</Label><Input {...register("name")} />{errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}</div>
          <div className="space-y-2"><Label>Assigned Airport ID</Label><Input type="number" {...register("airportId")} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Contact Name</Label><Input {...register("contactName")} /></div>
            <div className="space-y-2"><Label>Contact Phone</Label><Input {...register("contactPhone")} /></div>
          </div>
          <div className="space-y-2"><Label>Contact Email</Label><Input {...register("contactEmail")} />{errors.contactEmail && <span className="text-xs text-destructive">{errors.contactEmail.message}</span>}</div>
          <div className="space-y-2"><Label>Services Provided</Label><Input {...register("services")} placeholder="e.g. Fueling, Ramp Service..." /></div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMut.isPending || updateMut.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Bulk Upload CSV">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Paste your CSV content below. Expected headers: name, airportId, contactName, contactPhone, contactEmail, services.</p>
          <textarea 
            className="w-full h-48 bg-background/50 border border-border p-3 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-lg resize-none"
            placeholder="name,airportId,contactName..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleBulkSubmit} isLoading={bulkMut.isPending}>Upload Data</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
