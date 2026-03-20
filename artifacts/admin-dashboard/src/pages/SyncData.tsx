import { useState } from "react";
import { useSyncData, useGetSyncStatus, useGetRawData, SyncRequestSourcesItem } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { RefreshCw, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const AVAILABLE_SOURCES = [
  { id: "iata_airlines", label: "IATA Airlines Database" },
  { id: "iata_airports", label: "IATA Airports Database" },
  { id: "us_airports", label: "US Airports Registry" },
  { id: "cbp_ports", label: "CBP Port Codes" },
];

export default function SyncData() {
  const [sources, setSources] = useState<string[]>(AVAILABLE_SOURCES.map(s => s.id));
  const [page, setPage] = useState(1);
  
  const queryClient = useQueryClient();
  const { data: status, isLoading: statusLoading } = useGetSyncStatus();
  const { data: rawData, isLoading: rawLoading } = useGetRawData({ page, limit: 10 });
  
  const syncMut = useSyncData({
    mutation: {
      onSuccess: (res) => {
        toast.success(`Sync successful: Added ${res.airlinesAdded} airlines, ${res.airportsAdded} airports`);
        if (res.errors && res.errors.length > 0) {
          toast.warning(`Completed with ${res.errors.length} non-fatal errors`);
        }
        queryClient.invalidateQueries({ queryKey: ["/api/sync/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/sync/raw-data"] });
      },
      onError: (err: any) => toast.error(`Sync failed: ${err.message}`)
    }
  });

  const handleSync = () => {
    if (sources.length === 0) return toast.error("Select at least one source");
    syncMut.mutate({ data: { sources: sources as SyncRequestSourcesItem[] } });
  };

  const toggleSource = (id: string) => {
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Data Ingestion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 border border-border p-4 rounded-xl bg-background/30">
              <p className="text-sm font-display text-muted-foreground tracking-wider uppercase">Select Data Sources</p>
              {AVAILABLE_SOURCES.map(s => (
                <label key={s.id} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={sources.includes(s.id)}
                    onChange={() => toggleSource(s.id)}
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/50 accent-primary"
                  />
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{s.label}</span>
                </label>
              ))}
            </div>

            <Button 
              variant="primary" 
              className="w-full h-12 text-base shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-500" 
              onClick={handleSync}
              isLoading={syncMut.isPending}
            >
              <RefreshCw className={syncMut.isPending ? "animate-spin mr-2" : "mr-2"} />
              Initialize Sync Sequence
            </Button>
            
            {statusLoading ? (
              <div className="animate-pulse h-20 bg-muted/20 rounded-xl" />
            ) : (
              <div className="mt-6 p-4 rounded-xl bg-card border border-border/50 space-y-3">
                <h4 className="text-xs font-display text-muted-foreground uppercase tracking-widest">System Status</h4>
                <div className="flex justify-between items-center text-sm">
                  <span>Last Sync</span>
                  <span className="font-mono text-primary">{status?.lastSyncAt ? formatDate(status.lastSyncAt) : "Never"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Queued Reviews</span>
                  <span className="font-mono font-bold text-warning">{status?.pendingReview || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Raw Ingestion Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingestion ID</TableHead>
                  <TableHead>Source Route</TableHead>
                  <TableHead>Payload Type</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Integrity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Accessing stream...</TableCell></TableRow>
                ) : rawData?.data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Stream empty.</TableCell></TableRow>
                ) : (
                  rawData?.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-primary/70">#{row.id.toString().padStart(6, '0')}</TableCell>
                      <TableCell><Badge variant="outline">{row.source}</Badge></TableCell>
                      <TableCell className="uppercase text-xs">{row.dataType}</TableCell>
                      <TableCell>{formatDate(row.importedAt)}</TableCell>
                      <TableCell>
                        {row.flagged ? (
                          <div className="flex items-center gap-1 text-warning"><AlertCircle className="h-4 w-4"/> Flagged</div>
                        ) : (
                          <div className="flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4"/> Verified</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {rawData && rawData.total > 10 && (
             <div className="flex justify-between items-center mt-4 border-t border-border/50 pt-4">
               <span className="text-sm font-mono text-muted-foreground">Showing page {page}</span>
               <div className="flex gap-2">
                 <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                 <Button size="sm" variant="outline" disabled={page * 10 >= rawData.total} onClick={() => setPage(p => p + 1)}>Next</Button>
               </div>
             </div>
           )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
