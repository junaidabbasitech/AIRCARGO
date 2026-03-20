import { useGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Plane, Building2, Users, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { formatDate } from "@/lib/utils";

function StatCard({ title, value, subtext, icon: Icon, loading, highlight }: any) {
  return (
    <Card className={highlight ? "glow-border" : ""}>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : (
            <h3 className="text-3xl font-mono font-bold text-foreground">{value}</h3>
          )}
          {subtext && <p className="text-xs text-muted-foreground mt-2 font-mono">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${highlight ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();

  const chartData = [
    { name: "Airlines", approved: stats?.approvedAirlines || 0, pending: stats?.pendingAirlines || 0, rejected: stats?.rejectedAirlines || 0 },
    { name: "Airports", approved: stats?.approvedAirports || 0, pending: stats?.pendingAirports || 0, rejected: stats?.rejectedAirports || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Airlines" 
          value={stats?.totalAirlines} 
          icon={Plane} 
          loading={isLoading}
          subtext={`${stats?.approvedAirlines || 0} Approved`}
        />
        <StatCard 
          title="Total Airports" 
          value={stats?.totalAirports} 
          icon={Building2} 
          loading={isLoading}
          subtext={`${stats?.customsApprovedAirports || 0} Customs Approved`}
        />
        <StatCard 
          title="Pending Reviews" 
          value={(stats?.pendingAirlines || 0) + (stats?.pendingAirports || 0)} 
          icon={AlertCircle} 
          loading={isLoading}
          highlight={(stats?.pendingAirlines || 0) + (stats?.pendingAirports || 0) > 0}
          subtext="Requires Admin Action"
        />
        <StatCard 
          title="Ground Handlers" 
          value={stats?.totalGroundHandlers} 
          icon={Users} 
          loading={isLoading}
          subtext="Active Operators"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Entity Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 32% 17%)" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(215 20% 65%)" tick={{fontFamily: 'JetBrains Mono', fontSize: 12}} />
                  <YAxis stroke="hsl(215 20% 65%)" tick={{fontFamily: 'JetBrains Mono', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(221 45% 9%)', borderColor: 'hsl(189 94% 43%)', color: 'hsl(210 40% 98%)' }}
                    itemStyle={{ fontFamily: 'JetBrains Mono', fontSize: 14 }}
                  />
                  <Bar dataKey="approved" stackId="a" fill="hsl(160 84% 39%)" name="Approved" />
                  <Bar dataKey="pending" stackId="a" fill="hsl(38 92% 50%)" name="Pending" />
                  <Bar dataKey="rejected" stackId="a" fill="hsl(0 84% 60%)" name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground font-display uppercase tracking-wider mb-2">Last Data Sync</p>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-sm">{formatDate(stats?.lastSyncAt)}</p>
                  <p className="text-xs text-primary mt-0.5 uppercase tracking-wide">Automated System</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground font-display uppercase tracking-wider mb-4">Quick Actions</p>
              <div className="space-y-3">
                 <button 
                  onClick={() => window.location.href = '/sync'}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                 >
                   <span className="text-sm font-medium">Trigger Data Sync</span>
                   <RefreshCw className="h-4 w-4 text-muted-foreground" />
                 </button>
                 <button 
                  onClick={() => window.location.href = '/airlines?status=pending'}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-warning/50 hover:bg-warning/5 transition-all text-left"
                 >
                   <span className="text-sm font-medium">Review Pending Airlines</span>
                   <AlertCircle className="h-4 w-4 text-warning" />
                 </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
