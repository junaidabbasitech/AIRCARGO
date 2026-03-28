import { useGetStats } from "@workspace/api-client-react";
import {
  Plane, Building2, Users, AlertCircle, Network,
  Shield, Activity, ArrowRight, Clock, ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";

function StatCard({ title, value, sub, icon: Icon, accent }: {
  title: string; value?: number | null; sub?: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="aero-card p-6 cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: accent + "18" }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        <span
          className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
          style={{ background: accent + "12", color: accent }}
        >
          Live
        </span>
      </div>
      <div className="text-[38px] font-black leading-none mb-1.5" style={{ color: "#0b2147", fontVariantNumeric: "tabular-nums" }}>
        {value == null ? (
          <span className="inline-block h-9 w-20 rounded-lg animate-pulse" style={{ background: "#e4e9ed" }} />
        ) : value}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(11,33,71,0.45)" }}>{title}</p>
      {sub && <p className="text-[11px] font-medium" style={{ color: "rgba(11,33,71,0.55)" }}>{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-wide w-14 shrink-0" style={{ color: "rgba(11,33,71,0.45)" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#e4e9ed" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-black w-7 text-right" style={{ color: "#0b2147" }}>{value}</span>
    </div>
  );
}

function QuickAction({ label, desc, href, accent }: { label: string; desc: string; href: string; accent: string }) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className="group w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 section-hover"
      style={{ background: "#f6fafe", border: "1px solid rgba(197,198,207,0.35)" }}
    >
      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: accent }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-none mb-1" style={{ color: "#0b2147" }}>{label}</p>
        <p className="text-[11px] font-medium" style={{ color: "rgba(11,33,71,0.50)" }}>{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: "rgba(11,33,71,0.35)" }} />
    </button>
  );
}

function SectionCard({ title, icon: Icon, iconBg, children }: {
  title: string; icon: React.ElementType; iconBg: string; children: React.ReactNode;
}) {
  return (
    <div className="aero-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon className="h-4 w-4" style={{ color: "#0b2147" }} />
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#0b2147" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();

  const totalEntities = (stats?.totalAirlines || 0) + (stats?.totalAirports || 0);
  const approvedEntities = (stats?.approvedAirlines || 0) + (stats?.approvedAirports || 0);
  const pendingTotal = (stats?.pendingAirlines || 0) + (stats?.pendingAirports || 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Airlines"
          value={isLoading ? null : stats?.totalAirlines}
          sub={`${stats?.approvedAirlines ?? 0} approved · ${stats?.pendingAirlines ?? 0} pending`}
          icon={Plane}
          accent="#3b5fad"
        />
        <StatCard
          title="Total Airports"
          value={isLoading ? null : stats?.totalAirports}
          sub={`${stats?.customsApprovedAirports ?? 0} customs approved`}
          icon={Building2}
          accent="#009d6c"
        />
        <StatCard
          title="Pending Reviews"
          value={isLoading ? null : pendingTotal}
          sub={pendingTotal > 0 ? "Requires admin action" : "All reviewed"}
          icon={AlertCircle}
          accent={pendingTotal > 0 ? "#f59e0b" : "#009d6c"}
        />
        <StatCard
          title="Ground Handlers"
          value={isLoading ? null : stats?.totalGroundHandlers}
          sub="Active operators"
          icon={Users}
          accent="#8b5cf6"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Registry Status */}
        <SectionCard title="Registry Status" icon={Activity} iconBg="rgba(59,95,173,0.10)">
          <div className="space-y-5">
            <div className="space-y-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(11,33,71,0.40)" }}>Airlines</p>
              <MiniBar label="Approved" value={stats?.approvedAirlines ?? 0} max={stats?.totalAirlines ?? 1} color="#3b5fad" />
              <MiniBar label="Pending"  value={stats?.pendingAirlines  ?? 0} max={stats?.totalAirlines ?? 1} color="#f59e0b" />
              <MiniBar label="Rejected" value={stats?.rejectedAirlines ?? 0} max={stats?.totalAirlines ?? 1} color="#ba1a1a" />
            </div>
            <div className="space-y-2.5" style={{ borderTop: "1px solid rgba(197,198,207,0.30)", paddingTop: "1rem" }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(11,33,71,0.40)" }}>Airports</p>
              <MiniBar label="Approved" value={stats?.approvedAirports           ?? 0} max={stats?.totalAirports ?? 1} color="#009d6c" />
              <MiniBar label="Pending"  value={stats?.pendingAirports            ?? 0} max={stats?.totalAirports ?? 1} color="#f59e0b" />
              <MiniBar label="Customs"  value={stats?.customsApprovedAirports   ?? 0} max={stats?.totalAirports ?? 1} color="#8b5cf6" />
            </div>
          </div>
        </SectionCard>

        {/* System Health */}
        <SectionCard title="System Health" icon={Shield} iconBg="rgba(0,157,108,0.10)">
          <div className="space-y-1">
            {[
              { label: "API Server",     status: "Online",    ok: true },
              { label: "Database",       status: "Connected", ok: true },
              { label: "Data Sync",      status: "Active",    ok: true },
              { label: "Audit Logging",  status: "Running",   ok: true },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5"
                style={{ borderBottom: "1px solid rgba(197,198,207,0.20)" }}>
                <span className="text-[13px] font-semibold" style={{ color: "#0b2147" }}>{item.label}</span>
                <span className={item.ok ? "chip-emerald" : "chip-red"}>{item.status}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 flex items-center gap-1.5"
            style={{ borderTop: "1px solid rgba(197,198,207,0.20)" }}>
            <Clock className="h-3.5 w-3.5" style={{ color: "rgba(11,33,71,0.35)" }} />
            <span className="text-[10px] font-medium" style={{ color: "rgba(11,33,71,0.45)" }}>
              Last sync: {stats?.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString() : "—"}
            </span>
          </div>
        </SectionCard>

        {/* Data Summary */}
        <SectionCard title="Data Summary" icon={Network} iconBg="rgba(139,92,246,0.10)">
          <div className="space-y-3">
            {[
              { label: "Airline Operations",  value: "—",                                                                                     dot: "#3b5fad" },
              { label: "Approved Airlines",   value: String(stats?.approvedAirlines ?? 0),                                                    dot: "#009d6c" },
              { label: "Customs Airports",    value: String(stats?.customsApprovedAirports ?? 0),                                             dot: "#8b5cf6" },
              { label: "Total Registry",      value: String(totalEntities),                                                                    dot: "#0b2147" },
              { label: "Approval Rate",       value: totalEntities > 0 ? `${Math.round((approvedEntities / totalEntities) * 100)}%` : "—",    dot: "#f59e0b" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: item.dot }} />
                <span className="flex-1 text-[13px] font-medium" style={{ color: "rgba(11,33,71,0.65)" }}>{item.label}</span>
                <span className="text-[13px] font-black" style={{ color: "#0b2147", fontVariantNumeric: "tabular-nums" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <div className="aero-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.10)" }}>
            <ArrowRight className="h-4 w-4" style={{ color: "#b45309" }} />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#0b2147" }}>Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            label="Review Pending Airlines"
            desc={`${stats?.pendingAirlines ?? 0} awaiting review`}
            href="/airlines"
            accent="#3b5fad"
          />
          <QuickAction
            label="Review Pending Airports"
            desc={`${stats?.pendingAirports ?? 0} awaiting review`}
            href="/airports"
            accent="#009d6c"
          />
          <QuickAction
            label="Manage Operations"
            desc="ISC charges & FIRMS codes"
            href="/airline-operations"
            accent="#8b5cf6"
          />
          <QuickAction
            label="Sync Data"
            desc="Import / export registry"
            href="/sync"
            accent="#f59e0b"
          />
        </div>
      </div>
    </div>
  );
}
