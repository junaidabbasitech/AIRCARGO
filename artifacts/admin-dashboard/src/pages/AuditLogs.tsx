import { useState } from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Select, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

const PAGE_SIZES = [20, 40, 50, 100];

export default function AuditLogs() {
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useListAuditLogs({ entityType: entityType || undefined, page, limit });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5"/> Security Audit Trail</CardTitle>
        <div className="w-48">
          <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}>
            <option value="">All Entities</option>
            <option value="airline">Airlines</option>
            <option value="airport">Airports</option>
            <option value="ground_handler">Ground Handlers</option>
            <option value="sync">System Sync</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <Table className="flex-1">
          <TableHeader>
            <TableRow>
              <TableHead className="w-48">Timestamp</TableHead>
              <TableHead className="w-40">Actor</TableHead>
              <TableHead className="w-32">Action</TableHead>
              <TableHead className="w-48">Target Entity</TableHead>
              <TableHead>Delta Matrix (JSON)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={5} className="text-center py-8">Retrieving secure logs...</TableCell></TableRow>
            ) : data?.data.length === 0 ? (
               <TableRow><TableCell colSpan={5} className="text-center py-8">No log entries found.</TableCell></TableRow>
            ) : (
              data?.data.map((log) => (
                <TableRow key={log.id} className="hover:bg-accent/5">
                  <TableCell className="font-mono text-muted-foreground">{formatDate(log.performedAt)}</TableCell>
                  <TableCell><Badge variant="outline" className="border-primary/20 bg-primary/5 font-mono">{log.performedBy}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={
                      log.action.includes("CREATE") ? "success" : 
                      log.action.includes("DELETE") ? "danger" : 
                      log.action.includes("APPROVE") ? "success" :
                      log.action.includes("REJECT") ? "danger" : "default"
                    }>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs uppercase tracking-wider text-primary/80">
                    {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs bg-black/40 p-2 rounded border border-border/50 max-w-lg overflow-x-auto text-muted-foreground whitespace-nowrap">
                      {log.changes ? JSON.stringify(log.changes) : "{}"}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {data && data.total > 0 && (
          <div className="flex flex-wrap justify-between items-center mt-4 pt-4 border-t border-border gap-2">
            <span className="text-sm font-mono text-muted-foreground">Showing {Math.min((page-1)*limit+1, data.total)}–{Math.min(page*limit, data.total)} of {data.total} records</span>
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
  );
}
