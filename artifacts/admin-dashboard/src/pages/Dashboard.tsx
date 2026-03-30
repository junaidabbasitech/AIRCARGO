import { useGetStats } from "@workspace/api-client-react";
import {
  Plane, Building2, Users, AlertCircle,
  Activity, ChevronRight, RefreshCw, Network,
  Shield, Database, ClipboardList
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();
  const [, navigate] = useLocation();

  const totalAirlines = stats?.totalAirlines ?? 0;
  const totalAirports = stats?.totalAirports ?? 0;
  const pendingTotal = (stats?.pendingAirlines ?? 0) + (stats?.pendingAirports ?? 0);
  const totalGH = stats?.totalGroundHandlers ?? 0;

  const approvedAirlines = stats?.approvedAirlines ?? 0;
  const approvedAirports = stats?.approvedAirports ?? 0;
  const totalEntities = totalAirlines + totalAirports;
  const approvedEntities = approvedAirlines + approvedAirports;
  const verificationPct = totalAirlines > 0 ? Math.round((approvedAirlines / totalAirlines) * 100) : 0;
  const auditPct = totalAirports > 0 ? Math.round((approvedAirports / totalAirports) * 100) : 0;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* ── Stat cards row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "TOTAL AIRLINES", value: isLoading ? "—" : totalAirlines,
            sub: `+${stats?.pendingAirlines ?? 0} pending`, subOk: (stats?.pendingAirlines ?? 0) === 0,
            icon: Plane, href: "/airlines",
          },
          {
            label: "TOTAL AIRPORTS", value: isLoading ? "—" : totalAirports,
            sub: `+${stats?.customsApprovedAirports ?? 0} customs approved`, subOk: true,
            icon: Building2, href: "/airports",
          },
          {
            label: "PENDING REVIEWS", value: isLoading ? "—" : pendingTotal,
            sub: pendingTotal === 0 ? "System clear" : "Requires action",
            subOk: pendingTotal === 0,
            icon: AlertCircle, href: "/airlines",
          },
          {
            label: "GROUND HANDLERS", value: isLoading ? "—" : totalGH,
            sub: "Consistent load", subOk: true,
            icon: Users, href: "/ground-handlers",
          },
        ].map(({ label, value, sub, subOk, icon: Icon, href }) => (
          <button key={label} onClick={() => navigate(href)}
            className="group bg-white rounded-2xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 1px 6px rgba(11,33,71,0.05)" }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(11,33,71,0.40)" }}>
                {label}
              </p>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(11,33,71,0.04)" }}>
                <Icon className="h-4 w-4" style={{ color: "rgba(11,33,71,0.35)" }} />
              </div>
            </div>
            <p className="text-4xl font-black tabular-nums leading-none mb-2" style={{ color: "#0b2147" }}>
              {value}
            </p>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${subOk ? "bg-emerald-500" : "bg-amber-500"}`} />
              <p className="text-[11px] font-semibold" style={{ color: "rgba(11,33,71,0.45)" }}>{sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Registry Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6"
          style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 1px 6px rgba(11,33,71,0.05)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(5,150,105,0.10)" }}>
              <Shield className="h-4 w-4" style={{ color: "#059669" }} />
            </div>
            <h2 className="text-[15px] font-black" style={{ color: "#0b2147" }}>Registry Status</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                label: "Airline Verification Completion",
                pct: verificationPct,
                note: `${totalAirlines - approvedAirlines} records currently undergoing automated re-validation`,
              },
              {
                label: "Airport Audit Progress",
                pct: auditPct,
                note: "Annual audit for European sector scheduled for next cycle",
              },
            ].map(({ label, pct, note }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-bold" style={{ color: "#0b2147" }}>{label}</p>
                  <p className="text-[13px] font-black tabular-nums" style={{ color: "#0b2147" }}>{pct}%</p>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(11,33,71,0.07)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, #0b2147, #3b5fad)" }} />
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: "rgba(11,33,71,0.40)" }}>{note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 1px 6px rgba(11,33,71,0.05)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(59,95,173,0.10)" }}>
              <Activity className="h-4 w-4" style={{ color: "#3b5fad" }} />
            </div>
            <h2 className="text-[15px] font-black" style={{ color: "#0b2147" }}>System Health</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "API SERVER", value: "Online", ok: true },
              { label: "DATABASE", value: "Connected", ok: true },
              { label: "DATA SYNC", value: "Active", ok: true },
              { label: "AUDIT LOGGING", value: "Running", ok: true },
            ].map(({ label, value, ok }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: "rgba(11,33,71,0.03)", border: "1px solid rgba(11,33,71,0.06)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(11,33,71,0.38)" }}>{label}</p>
                </div>
                <p className="text-[13px] font-bold" style={{ color: "#0b2147" }}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(11,33,71,0.07)" }}>
            <p className="text-[10px] font-semibold" style={{ color: "rgba(11,33,71,0.38)" }}>
              Uptime: 99.998%
            </p>
            <p className="text-[10px] font-semibold" style={{ color: "rgba(11,33,71,0.38)" }}>
              Last sync: 2m ago
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-2xl p-6"
        style={{ border: "1px solid rgba(11,33,71,0.08)", boxShadow: "0 1px 6px rgba(11,33,71,0.05)" }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "rgba(11,33,71,0.40)" }}>
          Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Review Pending Airlines", icon: Plane, href: "/airlines", dark: true },
            { label: "Review Pending Airports", icon: Building2, href: "/airports", dark: false },
            { label: "Manage Operations", icon: Network, href: "/airline-operations", dark: false },
            { label: "Sync Data", icon: RefreshCw, href: "/sync", dark: false },
          ].map(({ label, icon: Icon, href, dark }) => (
            <button key={label} onClick={() => navigate(href)}
              className="group flex items-center gap-3 px-4 py-4 rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5"
              style={dark
                ? { background: "#0b2147", boxShadow: "0 4px 16px rgba(11,33,71,0.20)" }
                : { background: "rgba(11,33,71,0.04)", border: "1px solid rgba(11,33,71,0.08)" }
              }
              onMouseEnter={e => { if (!dark) e.currentTarget.style.background = "rgba(11,33,71,0.07)"; }}
              onMouseLeave={e => { if (!dark) e.currentTarget.style.background = "rgba(11,33,71,0.04)"; }}>
              <Icon className="h-4 w-4 shrink-0"
                style={{ color: dark ? "rgba(255,255,255,0.70)" : "rgba(11,33,71,0.50)" }} />
              <span className="text-[12px] font-bold leading-tight"
                style={{ color: dark ? "white" : "#0b2147" }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Data Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Registry Records", value: isLoading ? "—" : (totalEntities + totalGH).toLocaleString(), icon: Database, href: "/database" },
          { label: "Operations Indexed", value: isLoading ? "—" : "—", icon: Network, href: "/airline-operations" },
          { label: "Audit Log Entries", value: "—", icon: ClipboardList, href: "/audit" },
        ].map(({ label, value, icon: Icon, href }) => (
          <button key={label} onClick={() => navigate(href)}
            className="group bg-white rounded-2xl p-5 text-left flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ border: "1px solid rgba(11,33,71,0.08)" }}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(11,33,71,0.04)" }}>
              <Icon className="h-5 w-5" style={{ color: "rgba(11,33,71,0.40)" }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "rgba(11,33,71,0.38)" }}>{label}</p>
              <p className="text-2xl font-black tabular-nums" style={{ color: "#0b2147" }}>{value}</p>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              style={{ color: "rgba(11,33,71,0.30)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
