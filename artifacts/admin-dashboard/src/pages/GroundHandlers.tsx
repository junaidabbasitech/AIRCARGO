import { useState } from "react";
import { useListGroundHandlers, useCreateGroundHandler, useUpdateGroundHandler, useDeleteGroundHandler, useBulkUploadGroundHandlers, GroundHandler, CreateGroundHandlerRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Input, Modal, Label } from "@/components/ui";
import { SearchableAirportSelect } from "@/components/SearchableAirportSelect";
import { Search, Plus, Edit2, Trash2, Upload, Users, Mail, Phone } from "lucide-react";
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

const PAGE_SIZES = [20, 40, 50, 100, 150];

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

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", airportId: null, contactName: "", contactPhone: "", contactEmail: "", services: "" }
  });

  const openModal = (handler?: GroundHandler) => {
    if (handler) {
      setEditingHandler(handler);
      reset({
        name: handler.name,
        airportId: handler.airportId,
        contactName: handler.contactName ?? undefined,
        contactPhone: handler.contactPhone ?? undefined,
        contactEmail: handler.contactEmail ?? undefined,
        services: handler.services ?? undefined,
      });
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
    if(!csvData.trim()) { toast.error("CSV data cannot be empty"); return; }
    bulkMut.mutate({ data: { csvData } });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(11,33,71,0.40)" }}>Registry · Personnel</p>
          <h2 className="text-[26px] font-black leading-tight" style={{ color: "#0b2147" }}>Ground Handlers Directory</h2>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(11,33,71,0.45)" }}>Manage ramp operators, ground service providers, and airport personnel records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-slate-100"
            style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147", border: "1px solid rgba(11,33,71,0.10)" }}>
            <Upload className="h-4 w-4" /> Bulk Upload
          </button>
          <button onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "#0b2147", boxShadow: "0 4px 16px rgba(11,33,71,0.25)" }}>
            <Plus className="h-4 w-4" /> Add Handler
          </button>
        </div>
      </div>

      {/* Search + content card */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 1px 6px rgba(11,33,71,0.05)" }}>
        {/* Search bar */}
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(11,33,71,0.07)" }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "rgba(11,33,71,0.35)" }} />
            <Input placeholder="Search ground handlers, airport, contact..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(11,33,71,0.07)", background: "rgba(11,33,71,0.02)" }}>
                {["Operator Details", "Primary Contact", "Services", "Last Updated", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(11,33,71,0.40)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12" style={{ color: "rgba(11,33,71,0.35)" }}>
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-6 w-6 opacity-30" />
                    <span className="text-sm">Loading directory...</span>
                  </div>
                </td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(11,33,71,0.05)" }}>
                      <Users className="h-7 w-7" style={{ color: "rgba(11,33,71,0.25)" }} />
                    </div>
                    <p className="font-bold" style={{ color: "#0b2147" }}>No records found</p>
                    <p className="text-sm" style={{ color: "rgba(11,33,71,0.40)" }}>Add your first ground handler to get started</p>
                  </div>
                </td></tr>
              ) : (
                data?.data.map((handler) => (
                  <tr key={handler.id} className="group transition-all" style={{ borderBottom: "1px solid rgba(11,33,71,0.05)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(11,33,71,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-black text-[11px]"
                          style={{ background: "rgba(11,33,71,0.07)", color: "#0b2147" }}>
                          {handler.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: "#0b2147" }}>{handler.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(11,33,71,0.45)" }}>
                            {handler.airportName ? `Airport: ${handler.airportName}` : handler.airportId ? `Airport ID: ${handler.airportId}` : "All airports"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium" style={{ color: "#0b2147" }}>{handler.contactName || "—"}</p>
                      {handler.contactEmail && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" style={{ color: "rgba(11,33,71,0.35)" }} />
                          <span className="text-xs" style={{ color: "rgba(11,33,71,0.50)" }}>{handler.contactEmail}</span>
                        </div>
                      )}
                      {handler.contactPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" style={{ color: "rgba(11,33,71,0.35)" }} />
                          <span className="text-xs" style={{ color: "rgba(11,33,71,0.50)" }}>{handler.contactPhone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm truncate max-w-[200px]" style={{ color: "rgba(11,33,71,0.60)" }}>{handler.services || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono" style={{ color: "rgba(11,33,71,0.45)" }}>{formatDate(handler.lastUpdated)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(handler)}
                          className="p-2 rounded-xl transition-all hover:bg-blue-50"
                          style={{ color: "rgba(11,33,71,0.50)" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#0b2147"}
                          onMouseLeave={e => e.currentTarget.style.color = "rgba(11,33,71,0.50)"}>
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => { if(confirm("Delete operator?")) deleteMut.mutate({ id: handler.id }); }}
                          className="p-2 rounded-xl transition-all hover:bg-red-50"
                          style={{ color: "rgba(11,33,71,0.40)" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                          onMouseLeave={e => e.currentTarget.style.color = "rgba(11,33,71,0.40)"}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex flex-wrap justify-between items-center px-5 py-3 border-t" style={{ borderColor: "rgba(11,33,71,0.07)", background: "rgba(11,33,71,0.01)" }}>
            <span className="text-xs font-mono" style={{ color: "rgba(11,33,71,0.45)" }}>
              Showing {Math.min((page-1)*limit+1, data.total)}–{Math.min(page*limit, data.total)} of {data.total}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(11,33,71,0.50)" }}>
                <span>Show</span>
                <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="h-7 px-1.5 rounded-lg text-xs font-mono focus:outline-none"
                  style={{ background: "rgba(11,33,71,0.05)", border: "1px solid rgba(11,33,71,0.10)", color: "#0b2147" }}>
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span>per page</span>
              </div>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-30"
                style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147" }}>← Prev</button>
              <span className="text-xs px-1" style={{ color: "rgba(11,33,71,0.45)" }}>Page {page} of {Math.ceil(data.total/limit)}</span>
              <button disabled={page * limit >= data.total} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-30"
                style={{ background: "rgba(11,33,71,0.06)", color: "#0b2147" }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingHandler ? "Edit Operator" : "Add Operator"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2"><Label>Operator Name *</Label><Input {...register("name")} />{errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}</div>
          <div className="space-y-2">
            <Label>Assigned Airport</Label>
            <SearchableAirportSelect
              value={String(watch("airportId") ?? "")}
              onChange={(id) => setValue("airportId", id ? Number(id) : null)}
            />
          </div>
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
