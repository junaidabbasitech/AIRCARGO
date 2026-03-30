import { useGetStats } from "@workspace/api-client-react";
import {
  Plane, Building2, Users, AlertCircle, Network,
  Shield, Activity, ArrowRight, Clock, ChevronRight,
  TrendingUp, Check, Database, RefreshCw, GitMerge
} from "lucide-react";
import { useLocation } from "wouter";
import { CardWatermark } from "@/components/CardWatermark";

/* ── Colorful gradient stat card ── */
function StatCard({
  title, value, sub, icon: Icon, gradient, accent, textAccent, wm, href,
}: {
  title: string; value?: number | null; sub?: string;
  icon: React.ElementType; gradient: string; accent: string;
  textAccent?: string;
  wm: "plane" | "jet" | "tower" | "runway" | "globe" | "route";
  href: string;
}) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className="group relative overflow-hidden rounded-2xl p-6 text-left w-full transition-all duration-300"
      style={{
        background: gradient,
        boxShadow: `0 8px 32px ${accent}45`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
        e.currentTarget.style.boxShadow = `0 16px 48px ${accent}60`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = `0 8px 32px ${accent}45`;
      }}
    >
      <CardWatermark variant={wm} size={90} opacity={0.12} position="bottom-right" />

      {/* Click hint */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.20)" }}>
          <span className="text-[8px] font-black uppercase tracking-widest text-white">Open</span>
          <ArrowRight className="h-2.5 w-2.5 text-white" />
        </div>
      </div>

      <div className="relative z-10">
        <div className="mb-4 h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.18)" }}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="text-[42px] font-black leading-none mb-1.5 text-white tabular-nums">
          {value == null ? (
            <span className="inline-block h-9 w-16 rounded-lg animate-pulse bg-white/20" />
          ) : value}
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">{title}</p>
        {sub && <p className="text-[11px] font-medium text-white/55 leading-tight">{sub}</p>}
      </div>
    </button>
  );
}

/* ── Metric row inside a card ── */
function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-wide w-16 shrink-0" style={{ color: "rgba(11,33,71,0.45)" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#eef0f4" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-black w-7 text-right tabular-nums" style={{ color: "#0b2147" }}>{value}</span>
    </div>
  );
}

/* ── Clickable quick action tile ── */
function ActionTile({
  label, desc, href, gradient, icon: Icon,
}: {
  label: string; desc: string; href: string; gradient: string; icon: React.ElementType;
}) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className="group relative flex items-center gap-4 p-4 rounded-2xl text-left w-full transition-all duration-250 overflow-hidden"
      style={{ background: "#f8faff", border: "1px solid rgba(197,198,207,0.28)" }}
      onMouseEnter={e => {
        e.currentTarget.style.background = gradient;
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(11,33,71,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "#f8faff";
        e.currentTarget.style.borderColor = "rgba(197,198,207,0.28)";
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-250"
        style={{ background: gradient }}>
        <Icon className="h-4.5 w-4.5 text-white h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-none mb-1 transition-colors duration-250"
          style={{ color: "#0b2147" }}>{label}</p>
        <p className="text-[11px] font-medium truncate transition-colors duration-250"
          style={{ color: "rgba(11,33,71,0.50)" }}>{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 group-hover:translate-x-1 transition-transform"
        style={{ color: "rgba(11,33,71,0.28)" }} />
    </button>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();

  const totalEntities = (stats?.totalAirlines || 0) + (stats?.totalAirports || 0);
  const approvedEntities = (stats?.approvedAirlines || 0) + (stats?.approvedAirports || 0);
  const pendingTotal = (stats?.pendingAirlines || 0) + (stats?.pendingAirports || 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ── Hero welcome strip ── */}
      <div className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: "linear-gradient(120deg, #0b2147 0%, #1e3a6e 55%, #0f2d55 100%)", boxShadow: "0 8px 40px rgba(11,33,71,0.25)" }}>
        <CardWatermark variant="route" size={120} opacity={0.10} position="bottom-right" />
        {/* Glassy accent circles */}
        <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full blur-[50px]" style={{ background: "rgba(59,95,173,0.35)" }} />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-24 rounded-full blur-[40px]" style={{ background: "rgba(0,157,108,0.25)" }} />

        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <Plane className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-black text-white tracking-wide">Command Center</h2>
              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: "rgba(0,157,108,0.30)", color: "#34d399", border: "1px solid rgba(0,157,108,0.30)" }}>
                Live
              </span>
            </div>
            <p className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
              Manage airlines, airports, ISC charges, FIRMS codes, and ground handlers
            </p>
          </div>
          <div className="ml-auto hidden sm:flex flex-col items-end">
            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Registry Size</p>
            <p className="text-3xl font-black text-white tabular-nums">{isLoading ? "—" : totalEntities + (stats?.totalGroundHandlers ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* ── Colorful stat cards (clickable) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Airlines"
          value={isLoading ? null : stats?.totalAirlines}
          sub={`${stats?.approvedAirlines ?? 0} approved · ${stats?.pendingAirlines ?? 0} pending`}
          icon={Plane}
          gradient="linear-gradient(135deg, #3b5fad 0%, #1e3a8a 100%)"
          accent="#3b5fad"
          wm="jet"
          href="/airlines"
        />
        <StatCard
          title="Total Airports"
          value={isLoading ? null : stats?.totalAirports}
          sub={`${stats?.customsApprovedAirports ?? 0} customs approved`}
          icon={Building2}
          gradient="linear-gradient(135deg, #059669 0%, #065f46 100%)"
          accent="#059669"
          wm="tower"
          href="/airports"
        />
        <StatCard
          title="Pending Reviews"
          value={isLoading ? null : pendingTotal}
          sub={pendingTotal > 0 ? "Requires admin action" : "All up to date"}
          icon={AlertCircle}
          gradient={pendingTotal > 0
            ? "linear-gradient(135deg, #d97706 0%, #92400e 100%)"
            : "linear-gradient(135deg, #059669 0%, #065f46 100%)"}
          accent={pendingTotal > 0 ? "#d97706" : "#059669"}
          wm="runway"
          href="/airlines"
        />
        <StatCard
          title="Ground Handlers"
          value={isLoading ? null : stats?.totalGroundHandlers}
          sub="Active operators"
          icon={Users}
          gradient="linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)"
          accent="#7c3aed"
          wm="globe"
          href="/ground-handlers"
        />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Registry status */}
        <div className="aero-card p-0 overflow-hidden">
          <CardWatermark variant="plane" size={70} opacity={0.045} position="top-right" />
          {/* Colored header */}
          <div className="px-5 py-4 flex items-center gap-3"
            style={{ background: "linear-gradient(90deg, rgba(59,95,173,0.10), rgba(59,95,173,0.04))", borderBottom: "1px solid rgba(59,95,173,0.10)" }}>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,95,173,0.12)" }}>
              <Activity className="h-3.5 w-3.5" style={{ color: "#3b5fad" }} />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#0b2147" }}>Registry Status</h3>
          </div>
          <div className="p-5 space-y-5 relative z-10">
            <div className="space-y-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: "rgba(11,33,71,0.35)" }}>Airlines</p>
              <MiniBar label="Approved" value={stats?.approvedAirlines ?? 0} max={stats?.totalAirlines ?? 1} color="#3b5fad" />
              <MiniBar label="Pending"  value={stats?.pendingAirlines  ?? 0} max={stats?.totalAirlines ?? 1} color="#f59e0b" />
              <MiniBar label="Rejected" value={stats?.rejectedAirlines ?? 0} max={stats?.totalAirlines ?? 1} color="#ef4444" />
            </div>
            <div className="space-y-2.5 pt-4" style={{ borderTop: "1px solid rgba(197,198,207,0.20)" }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: "rgba(11,33,71,0.35)" }}>Airports</p>
              <MiniBar label="Approved" value={stats?.approvedAirports          ?? 0} max={stats?.totalAirports ?? 1} color="#059669" />
              <MiniBar label="Pending"  value={stats?.pendingAirports           ?? 0} max={stats?.totalAirports ?? 1} color="#f59e0b" />
              <MiniBar label="Customs"  value={stats?.customsApprovedAirports  ?? 0} max={stats?.totalAirports ?? 1} color="#8b5cf6" />
            </div>
          </div>
        </div>

        {/* System health */}
        <div className="aero-card p-0 overflow-hidden">
          <CardWatermark variant="route" size={70} opacity={0.045} position="top-right" />
          <div className="px-5 py-4 flex items-center gap-3"
            style={{ background: "linear-gradient(90deg, rgba(5,150,105,0.10), rgba(5,150,105,0.04))", borderBottom: "1px solid rgba(5,150,105,0.10)" }}>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(5,150,105,0.12)" }}>
              <Shield className="h-3.5 w-3.5" style={{ color: "#059669" }} />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#0b2147" }}>System Health</h3>
          </div>
          <div className="p-5 relative z-10">
            <div className="space-y-0.5">
              {[
                { label: "API Server",     ok: true },
                { label: "Database",       ok: true },
                { label: "Data Sync",      ok: true },
                { label: "Audit Logging",  ok: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5"
                  style={{ borderBottom: "1px solid rgba(197,198,207,0.15)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[13px] font-semibold" style={{ color: "#0b2147" }}>{item.label}</span>
                  </div>
                  <span className="chip-emerald">Online</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 flex items-center gap-1.5" style={{ borderTop: "1px solid rgba(197,198,207,0.15)" }}>
              <Clock className="h-3.5 w-3.5" style={{ color: "rgba(11,33,71,0.30)" }} />
              <span className="text-[10px] font-medium" style={{ color: "rgba(11,33,71,0.40)" }}>
                Last sync: {stats?.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString() : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Data summary */}
        <div className="aero-card p-0 overflow-hidden">
          <CardWatermark variant="globe" size={70} opacity={0.045} position="top-right" />
          <div className="px-5 py-4 flex items-center gap-3"
            style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.10), rgba(124,58,237,0.04))", borderBottom: "1px solid rgba(124,58,237,0.10)" }}>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.12)" }}>
              <Network className="h-3.5 w-3.5" style={{ color: "#7c3aed" }} />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#0b2147" }}>Data Summary</h3>
          </div>
          <div className="p-5 relative z-10">
            {[
              { label: "Approved Airlines",  value: String(stats?.approvedAirlines ?? 0),   dot: "#3b5fad" },
              { label: "Customs Airports",   value: String(stats?.customsApprovedAirports ?? 0), dot: "#059669" },
              { label: "Total Registry",     value: String(totalEntities),                   dot: "#0b2147" },
              { label: "Approval Rate",      value: totalEntities > 0 ? `${Math.round((approvedEntities / totalEntities) * 100)}%` : "—", dot: "#f59e0b" },
              { label: "Ground Handlers",    value: String(stats?.totalGroundHandlers ?? 0), dot: "#7c3aed" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 py-2"
                style={{ borderBottom: "1px solid rgba(197,198,207,0.12)" }}>
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: item.dot }} />
                <span className="flex-1 text-[13px] font-medium" style={{ color: "rgba(11,33,71,0.60)" }}>{item.label}</span>
                <span className="text-[14px] font-black tabular-nums" style={{ color: "#0b2147" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions (colorful hover tiles) ── */}
      <div className="aero-card p-0 overflow-hidden">
        <CardWatermark variant="runway" size={110} opacity={0.04} position="bottom-right" />
        <div className="px-5 py-4 flex items-center gap-3"
          style={{ background: "linear-gradient(90deg, rgba(217,119,6,0.08), rgba(217,119,6,0.02))", borderBottom: "1px solid rgba(217,119,6,0.10)" }}>
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(217,119,6,0.12)" }}>
            <ArrowRight className="h-3.5 w-3.5" style={{ color: "#d97706" }} />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#0b2147" }}>Quick Actions</h3>
        </div>
        <div className="p-4 relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionTile label="Airlines Registry"     desc={`${stats?.totalAirlines ?? 0} total · ${stats?.pendingAirlines ?? 0} pending`}  href="/airlines"            gradient="linear-gradient(135deg, #3b5fad, #1e3a8a)" icon={Plane} />
          <ActionTile label="Airports Registry"     desc={`${stats?.totalAirports ?? 0} total airports`}                                  href="/airports"            gradient="linear-gradient(135deg, #059669, #065f46)" icon={Building2} />
          <ActionTile label="Airline Operations"    desc="ISC charges & FIRMS codes"                                                       href="/airline-operations"  gradient="linear-gradient(135deg, #7c3aed, #4c1d95)" icon={Network} />
          <ActionTile label="Ground Handlers"       desc={`${stats?.totalGroundHandlers ?? 0} active operators`}                          href="/ground-handlers"     gradient="linear-gradient(135deg, #d97706, #92400e)" icon={Users} />
          <ActionTile label="AWB Prefixes"          desc="Airline prefix registry"                                                         href="/awb-prefixes"        gradient="linear-gradient(135deg, #0891b2, #155e75)" icon={TrendingUp} />
          <ActionTile label="Duplicate Detection"   desc="Find & resolve duplicates"                                                       href="/duplicates"          gradient="linear-gradient(135deg, #dc2626, #7f1d1d)" icon={GitMerge} />
          <ActionTile label="Database Admin"        desc="Direct table access"                                                             href="/database"            gradient="linear-gradient(135deg, #475569, #1e293b)" icon={Database} />
          <ActionTile label="Sync Operations"       desc="Import & export data"                                                            href="/sync"                gradient="linear-gradient(135deg, #059669, #065f46)" icon={RefreshCw} />
        </div>
      </div>
    </div>
  );
}
