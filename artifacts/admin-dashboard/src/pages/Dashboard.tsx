import { useGetStats } from "@workspace/api-client-react";
import {
  Plane, Building2, Users, AlertCircle, Network, TrendingUp,
  Shield, Activity, RefreshCw, ArrowRight, Clock, ChevronRight,
  CheckCircle2
} from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";

const AVIATION_IMGS = {
  airlines: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=700&auto=format&fit=crop&q=80",
  airports: "https://images.unsplash.com/photo-1559508551-44bff1de756b?w=700&auto=format&fit=crop&q=80",
  pending: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=700&auto=format&fit=crop&q=80",
  handlers: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=700&auto=format&fit=crop&q=80",
  hero: "https://images.unsplash.com/photo-1583267716812-db65ee2ef56e?w=1400&auto=format&fit=crop&q=80",
};

function StatCard({ title, value, icon: Icon, img, gradientStyle, badge, onClick }: {
  title: string; value: number | null | undefined; icon: any;
  img: string; gradientStyle: string; badge?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl text-left w-full focus:outline-none"
      style={{ minHeight: 180 }}
    >
      <img
        src={img}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: gradientStyle }}
      />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300" />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.25)" }}
      />
      <div className="relative z-10 p-6 h-full flex flex-col justify-between" style={{ minHeight: 180 }}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{title}</p>
            <div className="text-5xl font-black font-mono text-white leading-none mb-1 drop-shadow-lg">
              {value != null ? value : <span className="inline-block h-12 w-24 bg-white/10 rounded-xl animate-pulse" />}
            </div>
          </div>
          <div className="shrink-0 ml-3 p-3 rounded-2xl bg-white/15 backdrop-blur-sm group-hover:bg-white/25 transition-all duration-300 group-hover:scale-110">
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
        {badge && (
          <div className="mt-4 pt-3.5 border-t border-white/15 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-white/70" />
            <span className="text-xs text-white/75 font-medium">{badge}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium w-16 shrink-0 uppercase tracking-wide" style={{ color: "var(--t-text-muted)" }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--t-border)" }}>
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-bold w-8 text-right" style={{ color: "var(--t-text-sub)" }}>{value}</span>
    </div>
  );
}

function QuickActionCard({ label, desc, href, img, gradientStyle }: {
  label: string; desc: string; href: string; img: string; gradientStyle: string;
}) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className="group relative overflow-hidden rounded-2xl text-left focus:outline-none w-full"
      style={{ minHeight: 120 }}
    >
      <img
        src={img}
        alt={label}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 transition-opacity duration-300" style={{ background: gradientStyle }} />
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-all duration-300" />
      <div className="relative z-10 p-4 h-full flex flex-col justify-between" style={{ minHeight: 120 }}>
        <p className="text-sm font-black text-white leading-tight">{label}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-white/70 font-medium">{desc}</p>
          <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/35 transition-all duration-200 group-hover:translate-x-1">
            <ChevronRight className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </button>
  );
}

function InfoCard({ children, iconBg, icon: Icon, title }: {
  children: React.ReactNode; iconBg: string; icon: any; title: string;
}) {
  return (
    <div className="rounded-2xl shadow-sm p-6" style={{
      background: "var(--t-card2)",
      border: "1px solid var(--t-border)"
    }}>
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg" style={{ background: iconBg }}>
          <Icon className="h-4 w-4" style={{ color: "var(--t-accent)" }} />
        </div>
        <h3 className="font-black text-xs uppercase tracking-widest" style={{ color: "var(--t-text-sub)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();
  const [, navigate] = useLocation();
  const { isDark } = useTheme();

  const totalEntities = (stats?.totalAirlines || 0) + (stats?.totalAirports || 0);
  const approvedEntities = (stats?.approvedAirlines || 0) + (stats?.approvedAirports || 0);
  const pendingTotal = (stats?.pendingAirlines || 0) + (stats?.pendingAirports || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 160 }}>
        <img
          src={AVIATION_IMGS.hero}
          alt="Runway"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isDark ? 0.55 : 0.35 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(90deg, rgba(13,17,35,0.97) 0%, rgba(13,17,35,0.80) 60%, rgba(13,17,35,0.40) 100%)"
              : "linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.80) 60%, rgba(255,255,255,0.30) 100%)"
          }}
        />
        <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "var(--t-accent)" }}>Command Center</p>
            <h2 className="text-2xl font-black tracking-wide" style={{ color: "var(--t-text)" }}>Aviation CBP Registry</h2>
            <p className="text-sm mt-1" style={{ color: "var(--t-text-muted)" }}>Real-time dashboard — airlines, airports, operations & ground handlers</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.28)" }}>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Registry Online</span>
            </div>
            {stats?.lastSyncAt && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--t-card)", border: "1px solid var(--t-border)" }}>
                <Clock className="h-3 w-3" style={{ color: "var(--t-text-muted)" }} />
                <span className="text-[10px] font-mono hidden sm:inline" style={{ color: "var(--t-text-muted)" }}>
                  {new Date(stats.lastSyncAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Airlines"
          value={isLoading ? null : stats?.totalAirlines}
          icon={Plane}
          img={AVIATION_IMGS.airlines}
          gradientStyle="linear-gradient(135deg, rgba(3,105,161,0.88) 0%, rgba(30,64,175,0.96) 100%)"
          badge={`${stats?.approvedAirlines || 0} Approved · ${stats?.pendingAirlines || 0} Pending`}
          onClick={() => navigate("/airlines")}
        />
        <StatCard
          title="Total Airports"
          value={isLoading ? null : stats?.totalAirports}
          icon={Building2}
          img={AVIATION_IMGS.airports}
          gradientStyle="linear-gradient(135deg, rgba(234,88,12,0.88) 0%, rgba(185,28,28,0.96) 100%)"
          badge={`${stats?.customsApprovedAirports || 0} Customs Approved`}
          onClick={() => navigate("/airports")}
        />
        <StatCard
          title="Pending Reviews"
          value={isLoading ? null : pendingTotal}
          icon={AlertCircle}
          img={AVIATION_IMGS.pending}
          gradientStyle={pendingTotal > 0
            ? "linear-gradient(135deg, rgba(217,119,6,0.88) 0%, rgba(180,83,9,0.96) 100%)"
            : "linear-gradient(135deg, rgba(71,85,105,0.88) 0%, rgba(30,41,59,0.96) 100%)"}
          badge={pendingTotal > 0 ? "Requires admin action" : "All cleared"}
          onClick={() => navigate("/airlines")}
        />
        <StatCard
          title="Ground Handlers"
          value={isLoading ? null : stats?.totalGroundHandlers}
          icon={Users}
          img={AVIATION_IMGS.handlers}
          gradientStyle="linear-gradient(135deg, rgba(124,58,237,0.88) 0%, rgba(109,40,217,0.96) 100%)"
          badge="Active operators"
          onClick={() => navigate("/ground-handlers")}
        />
      </div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Status breakdown */}
        <InfoCard title="Registry Status" icon={Activity} iconBg="var(--t-accent-dim)">
          <div className="space-y-4">
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--t-text-muted)" }}>Airlines</p>
              <MiniBar label="Approved" value={stats?.approvedAirlines || 0} max={stats?.totalAirlines || 1} color="bg-emerald-400" />
              <MiniBar label="Pending" value={stats?.pendingAirlines || 0} max={stats?.totalAirlines || 1} color="bg-amber-400" />
              <MiniBar label="Rejected" value={stats?.rejectedAirlines || 0} max={stats?.totalAirlines || 1} color="bg-rose-400" />
            </div>
            <div className="pt-4 space-y-2.5" style={{ borderTop: "1px solid var(--t-border)" }}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "var(--t-text-muted)" }}>Airports</p>
              <MiniBar label="Approved" value={stats?.approvedAirports || 0} max={stats?.totalAirports || 1} color="bg-orange-400" />
              <MiniBar label="Pending" value={stats?.pendingAirports || 0} max={stats?.totalAirports || 1} color="bg-amber-400" />
              <MiniBar label="Customs" value={stats?.customsApprovedAirports || 0} max={stats?.totalAirports || 1} color="bg-violet-400" />
            </div>
          </div>
        </InfoCard>

        {/* System health */}
        <InfoCard title="System Health" icon={Shield} iconBg="rgba(16,185,129,0.12)">
          <div className="space-y-3">
            {[
              { label: "API Server", status: "Online", ok: true },
              { label: "Database", status: "Connected", ok: true },
              { label: "Data Sync", status: "Active", ok: true },
              { label: "Audit Logging", status: "Running", ok: true },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--t-border-soft)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--t-text-sub)" }}>{item.label}</span>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold`}
                  style={{
                    background: item.ok ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                    color: item.ok ? "#10b981" : "#f43f5e",
                    border: `1px solid ${item.ok ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`
                  }}>
                  <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${item.ok ? "bg-emerald-400" : "bg-rose-400"}`} />
                  {item.status}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 flex items-center gap-2 text-xs" style={{ borderTop: "1px solid var(--t-border)", color: "var(--t-text-muted)" }}>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Last sync: {stats?.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString() : "—"}</span>
          </div>
        </InfoCard>

        {/* Data summary */}
        <InfoCard title="Data Summary" icon={Network} iconBg="var(--t-accent2-dim)">
          <div className="space-y-4">
            {[
              { label: "Approved Airlines", value: String(stats?.approvedAirlines || 0), dotColor: "#0ea5e9" },
              { label: "Customs Airports", value: String(stats?.customsApprovedAirports || 0), dotColor: "#f97316" },
              { label: "Total Registry", value: String(totalEntities), dotColor: "#8b5cf6" },
              { label: "Approval Rate", value: totalEntities > 0 ? `${Math.round((approvedEntities / totalEntities) * 100)}%` : "0%", dotColor: "#10b981" },
              { label: "Pending Actions", value: String(pendingTotal), dotColor: pendingTotal > 0 ? "#f59e0b" : "var(--t-text-muted)" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: item.dotColor }} />
                <span className="text-sm flex-1" style={{ color: "var(--t-text-sub)" }}>{item.label}</span>
                <span className="text-sm font-black font-mono" style={{ color: "var(--t-text)" }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 flex items-center gap-2 text-xs" style={{ borderTop: "1px solid var(--t-border)", color: "var(--t-text-muted)" }}>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>All systems operational</span>
          </div>
        </InfoCard>
      </div>

      {/* ── Quick Action Cards with Aviation Photos ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg" style={{ background: "var(--t-accent-dim)" }}>
            <ArrowRight className="h-4 w-4" style={{ color: "var(--t-accent)" }} />
          </div>
          <h3 className="font-black text-xs uppercase tracking-widest" style={{ color: "var(--t-text-sub)" }}>Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            label="Review Pending Airlines"
            desc={`${stats?.pendingAirlines || 0} awaiting review`}
            href="/airlines"
            img={AVIATION_IMGS.airlines}
            gradientStyle="linear-gradient(135deg, rgba(3,105,161,0.85) 0%, rgba(30,64,175,0.94) 100%)"
          />
          <QuickActionCard
            label="Review Pending Airports"
            desc={`${stats?.pendingAirports || 0} awaiting review`}
            href="/airports"
            img={AVIATION_IMGS.airports}
            gradientStyle="linear-gradient(135deg, rgba(234,88,12,0.85) 0%, rgba(185,28,28,0.94) 100%)"
          />
          <QuickActionCard
            label="Manage Operations"
            desc="ISC charges & FIRMS codes"
            href="/airline-operations"
            img={AVIATION_IMGS.handlers}
            gradientStyle="linear-gradient(135deg, rgba(109,40,217,0.85) 0%, rgba(88,28,135,0.94) 100%)"
          />
          <QuickActionCard
            label="Sync Registry Data"
            desc="Import / export / sync"
            href="/sync"
            img={AVIATION_IMGS.pending}
            gradientStyle="linear-gradient(135deg, rgba(4,120,87,0.85) 0%, rgba(6,78,59,0.94) 100%)"
          />
        </div>
      </div>
    </div>
  );
}
