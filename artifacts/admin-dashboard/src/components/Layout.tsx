import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Plane, Building2, Users, RefreshCw, ClipboardList,
  LayoutDashboard, Menu, X, ChevronDown,
  Search, Network, LogOut, Gauge, GitMerge, Shield
} from "lucide-react";
import { Watermark } from "@/components/Watermark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme, useT } from "@/context/ThemeContext";

const CMD_SUB_ITEMS = [
  { href: "/cmd", label: "Dashboard", icon: Gauge },
  { href: "/airlines", label: "Airlines", icon: Plane },
  { href: "/airports", label: "Airports", icon: Building2 },
  { href: "/airline-operations", label: "Airline Operations", icon: Network },
  { href: "/ground-handlers", label: "Ground Handlers", icon: Users },
  { href: "/duplicates", label: "Duplicate Detection", icon: GitMerge },
  { href: "/sync", label: "Sync Operations", icon: RefreshCw },
  { href: "/audit", label: "Audit Logs", icon: ClipboardList },
];

const CMD_PATHS = CMD_SUB_ITEMS.map(i => i.href);

interface LayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export function Layout({ children, isAuthenticated, onLogout }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [cmdExpanded, setCmdExpanded] = React.useState(true);
  const { isDark } = useTheme();
  const t = useT();

  const isCmdActive = CMD_PATHS.includes(location);
  const isAirActive = location === "/air" || location === "/";

  const pageLabel =
    isAirActive ? "AIR Search" :
    CMD_SUB_ITEMS.find(i => i.href === location)?.label || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--t-bg)" }}>
      <Watermark />

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* ─── Sidebar — always dark navy ─── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 md:relative md:flex md:translate-x-0",
        "border-r",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ background: "var(--t-sidebar)", borderColor: "var(--t-border-soft)" }}>

        {/* Atmospheric glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-10 h-48 w-48 rounded-full blur-[60px]" style={{ background: "var(--t-accent-dim)" }} />
          <div className="absolute bottom-20 -right-10 h-32 w-32 rounded-full blur-[50px]" style={{ background: "var(--t-accent2-dim)" }} />
        </div>

        {/* Logo */}
        <div className="relative flex h-16 items-center px-5 gap-3" style={{ borderBottom: "1px solid var(--t-border-soft)" }}>
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg shrink-0" style={{ background: "linear-gradient(135deg, var(--t-accent), color-mix(in srgb, var(--t-accent) 70%, #1d4ed8))" }}>
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display text-base font-black tracking-widest leading-none">
              <span style={{ color: "var(--t-accent)" }}>AVIA</span><span style={{ color: "var(--t-accent2)" }}>CBP</span>
            </div>
            <div className="text-[8px] font-mono tracking-widest uppercase mt-0.5" style={{ color: "#7a9abf" }}>Aviation Registry</div>
          </div>
          <button className="md:hidden ml-auto hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color: "#a6bee3" }} onClick={() => setIsMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {/* AIR Search — Public */}
          <Link
            href="/air"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group"
            style={isAirActive ? {
              background: "var(--t-accent-dim)",
              color: "var(--t-accent)",
              border: "1px solid var(--t-accent-border)"
            } : {
              color: "#a6bee3"
            }}
          >
            <Search className="h-4 w-4 shrink-0 transition-colors" style={{ color: "var(--t-accent)" }} />
            <span className="flex-1">AIR Search</span>
            <span className="text-[9px] px-2 py-0.5 rounded-md font-black tracking-widest border" style={{
              background: "var(--t-accent-dim)",
              color: "var(--t-accent)",
              borderColor: "var(--t-accent-border)"
            }}>
              PUBLIC
            </span>
          </Link>

          {/* Divider */}
          <div className="my-3 mx-1" style={{ height: 1, background: "var(--t-border-soft)" }} />
          <p className="text-[9px] font-black uppercase tracking-widest px-3 mb-2" style={{ color: "#7a9abf" }}>Admin</p>

          {/* Command Center accordion */}
          <button
            onClick={() => setCmdExpanded(e => !e)}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200"
            style={isCmdActive ? {
              background: "var(--t-accent-dim)",
              color: "var(--t-accent)",
              border: "1px solid var(--t-accent-border)"
            } : {
              color: "#a6bee3"
            }}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0 transition-colors" style={{ color: isCmdActive ? "var(--t-accent)" : "#a6bee3" }} />
            <span className="flex-1 text-left">Command Center</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", cmdExpanded ? "rotate-0" : "-rotate-90")} style={{ color: "#a6bee3" }} />
          </button>

          {cmdExpanded && (
            <div className="ml-3 pl-3 space-y-0.5 mt-1" style={{ borderLeft: "1px solid var(--t-border-soft)" }}>
              {CMD_SUB_ITEMS.map(item => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 group"
                    style={isActive ? {
                      background: "var(--t-accent-dim)",
                      color: "var(--t-accent)"
                    } : {
                      color: "#a6bee3"
                    }}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0 transition-colors" style={{ color: isActive ? "var(--t-accent)" : "#7a9abf" }} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--t-accent)", boxShadow: `0 0 6px var(--t-accent)` }} />}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="relative p-3" style={{ borderTop: "1px solid var(--t-border-soft)" }}>
          {/* Theme toggle row */}
          <div className="flex items-center justify-between px-2 py-2 mb-1">
            <span className="text-[9px] font-mono tracking-widest uppercase" style={{ color: "#7a9abf" }}>Theme</span>
            <ThemeToggle />
          </div>

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
            >
              <LogOut className="h-4 w-4 group-hover:text-red-400 transition-colors" />
              <span>Lock Command Center</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest" style={{ color: "#7a9abf" }}>v1.0 · LIVE</span>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin header — only for admin pages */}
        {!isAirActive && (
          <header className="h-14 flex items-center justify-between px-4 sm:px-6 shrink-0" style={{
            background: "var(--t-header)",
            borderBottom: `1px solid var(--t-border)`
          }}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden p-1.5 rounded-lg transition-all"
                style={{ color: "var(--t-text-muted)" }}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xs font-black tracking-widest uppercase" style={{ color: "var(--t-text)" }}>{pageLabel}</h1>
                <p className="text-[10px] font-mono hidden sm:block" style={{ color: "var(--t-text-muted)" }}>Aviation CBP Registry</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{
                  background: "var(--t-accent-dim)",
                  borderColor: "var(--t-accent-border)"
                }}>
                  <Shield className="h-3 w-3" style={{ color: "var(--t-accent)" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block" style={{ color: "var(--t-accent)" }}>Admin</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/15">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider hidden sm:block">Online</span>
              </div>
            </div>
          </header>
        )}

        {/* Mobile header for AIR Search */}
        {isAirActive && (
          <div className="md:hidden flex items-center h-12 px-4 shrink-0" style={{
            background: isDark ? "hsl(222,55%,8%)" : "var(--t-header)",
            borderBottom: "1px solid var(--t-border-soft)"
          }}>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: "var(--t-text-muted)" }}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-auto" style={isAirActive
          ? { background: isDark ? "hsl(222,60%,7%)" : "hsl(210,20%,96%)" }
          : { background: "var(--t-bg)", padding: "1.5rem" }
        }>
          {children}
        </div>
      </main>
    </div>
  );
}
