import { useGetStats } from "@workspace/api-client-react";
import { Plane, Building2, Users, AlertCircle, Network, TrendingUp, Shield, Activity, RefreshCw, ArrowRight, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

function StatCard({ title, value, subtext, icon: Icon, gradient, badge }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 ${gradient} shadow-lg border border-white/10`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">{title}</p>
          <div className="text-4xl font-black font-mono text-white mb-1">
            {value ?? <span className="inline-block h-10 w-20 bg-white/10 rounded-lg animate-pulse" />}
          </div>
          {subtext && <p className="text-xs text-white/70 font-medium mt-1">{subtext}</p>}
        </div>
        <div className="shrink-0 ml-4 p-3 rounded-2xl bg-white/15 backdrop-blur-sm">
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
      {badge && (
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-white/70" />
          <span className="text-xs text-white/70 font-medium">{badge}</span>
        </div>
      )}
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 font-medium w-16 shrink-0 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-bold text-slate-700 w-8 text-right">{value}</span>
    </div>
  );
}

function QuickAction({ label, desc, href, color }: { label: string; desc: string; href: string; color: string }) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className={`group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-transparent ${color} hover:border-opacity-40 transition-all duration-200 text-left`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
    </button>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();

  const totalEntities = (stats?.totalAirlines || 0) + (stats?.totalAirports || 0);
  const approvedEntities = (stats?.approvedAirlines || 0) + (stats?.approvedAirports || 0);
  const pendingTotal = (stats?.pendingAirlines || 0) + (stats?.pendingAirports || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Airlines"
          value={isLoading ? null : stats?.totalAirlines}
          icon={Plane}
          gradient="bg-gradient-to-br from-sky-500 to-blue-600"
          badge={`${stats?.approvedAirlines || 0} Approved · ${stats?.pendingAirlines || 0} Pending`}
        />
        <StatCard
          title="Total Airports"
          value={isLoading ? null : stats?.totalAirports}
          icon={Building2}
          gradient="bg-gradient-to-br from-orange-400 to-rose-500"
          badge={`${stats?.customsApprovedAirports || 0} Customs Approved`}
        />
        <StatCard
          title="Pending Reviews"
          value={isLoading ? null : pendingTotal}
          icon={AlertCircle}
          gradient={pendingTotal > 0 ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-slate-500 to-slate-700"}
          badge={pendingTotal > 0 ? "Requires admin action" : "All reviewed"}
        />
        <StatCard
          title="Ground Handlers"
          value={isLoading ? null : stats?.totalGroundHandlers}
          icon={Users}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700"
          badge="Active operators"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Status breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-sky-50">
              <Activity className="h-4 w-4 text-sky-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Registry Status</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Airlines</p>
              <MiniBar label="Approved" value={stats?.approvedAirlines || 0} max={stats?.totalAirlines || 1} color="bg-emerald-400" />
              <MiniBar label="Pending" value={stats?.pendingAirlines || 0} max={stats?.totalAirlines || 1} color="bg-amber-400" />
              <MiniBar label="Rejected" value={stats?.rejectedAirlines || 0} max={stats?.totalAirlines || 1} color="bg-rose-400" />
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Airports</p>
              <MiniBar label="Approved" value={stats?.approvedAirports || 0} max={stats?.totalAirports || 1} color="bg-orange-400" />
              <MiniBar label="Pending" value={stats?.pendingAirports || 0} max={stats?.totalAirports || 1} color="bg-amber-400" />
              <MiniBar label="Customs" value={stats?.customsApprovedAirports || 0} max={stats?.totalAirports || 1} color="bg-violet-400" />
            </div>
          </div>
        </div>

        {/* System health */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-green-50">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">System Health</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "API Server", status: "Online", ok: true },
              { label: "Database", status: "Connected", ok: true },
              { label: "Data Sync", status: "Active", ok: true },
              { label: "Audit Logging", status: "Running", ok: true },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-600 font-medium">{item.label}</span>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${item.ok ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                  <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${item.ok ? "bg-green-500" : "bg-red-500"}`} />
                  {item.status}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Last sync: {stats?.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString() : "—"}</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-violet-50">
              <Network className="h-4 w-4 text-violet-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Data Summary</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Airline Operations", value: "328", color: "bg-sky-500" },
              { label: "Approved Airlines", value: String(stats?.approvedAirlines || 0), color: "bg-emerald-500" },
              { label: "Customs Airports", value: String(stats?.customsApprovedAirports || 0), color: "bg-orange-500" },
              { label: "Total Registry", value: String(totalEntities), color: "bg-violet-500" },
              { label: "Approval Rate", value: totalEntities > 0 ? `${Math.round((approvedEntities / totalEntities) * 100)}%` : "0%", color: "bg-pink-500" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.color}`} />
                <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                <span className="text-sm font-black font-mono text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-lg bg-orange-50">
            <ArrowRight className="h-4 w-4 text-orange-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction label="Review Pending Airlines" desc={`${stats?.pendingAirlines || 0} awaiting review`} href="/airlines" color="hover:bg-sky-50 hover:border-sky-200 bg-slate-50" />
          <QuickAction label="Review Pending Airports" desc={`${stats?.pendingAirports || 0} awaiting review`} href="/airports" color="hover:bg-orange-50 hover:border-orange-200 bg-slate-50" />
          <QuickAction label="Manage Operations" desc="ISC charges & FIRMS codes" href="/airline-operations" color="hover:bg-violet-50 hover:border-violet-200 bg-slate-50" />
          <QuickAction label="Sync Data" desc="Import / export registry" href="/sync" color="hover:bg-green-50 hover:border-green-200 bg-slate-50" />
        </div>
      </div>
    </div>
  );
}
