import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Plane, Building2, Users, RefreshCw, ClipboardList,
  LayoutDashboard, Menu, X, ChevronDown,
  Search, Network, LogOut, Gauge, GitMerge, Shield
} from "lucide-react";
import { Watermark } from "@/components/Watermark";

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

  const isCmdActive = CMD_PATHS.includes(location);
  const isAirActive = location === "/air" || location === "/";

  const pageLabel =
    isAirActive ? "AIR Search" :
    CMD_SUB_ITEMS.find(i => i.href === location)?.label || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Watermark />

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 md:relative md:flex md:translate-x-0",
        "bg-gradient-to-b from-[hsl(222,60%,9%)] via-[hsl(222,55%,8%)] to-[hsl(222,50%,7%)] border-r border-white/5",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Atmospheric glow inside sidebar */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-10 h-48 w-48 rounded-full bg-sky-500/8 blur-[60px]" />
          <div className="absolute bottom-20 -right-10 h-32 w-32 rounded-full bg-orange-500/6 blur-[50px]" />
        </div>

        {/* Logo */}
        <div className="relative flex h-16 items-center px-5 border-b border-white/5 gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25 shrink-0">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display text-base font-black tracking-widest leading-none">
              <span className="text-sky-300">AVIA</span><span className="text-orange-400">CBP</span>
            </div>
            <div className="text-[8px] text-slate-600 font-mono tracking-widest uppercase mt-0.5">Aviation Registry</div>
          </div>
          <button className="md:hidden ml-auto text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all" onClick={() => setIsMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {/* AIR Search — Public */}
          <Link
            href="/air"
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group",
              isAirActive
                ? "bg-gradient-to-r from-sky-500/25 to-blue-500/10 text-white border border-sky-500/20 shadow-sm"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <Search className={cn("h-4 w-4 shrink-0 transition-colors", isAirActive ? "text-sky-400" : "text-slate-600 group-hover:text-slate-400")} />
            <span className="flex-1">AIR Search</span>
            <span className={cn(
              "text-[9px] px-2 py-0.5 rounded-md font-black tracking-widest border",
              isAirActive
                ? "bg-sky-500/20 text-sky-300 border-sky-500/25"
                : "bg-orange-500/10 text-orange-400 border-orange-500/15"
            )}>
              PUBLIC
            </span>
          </Link>

          {/* Divider */}
          <div className="my-3 mx-1">
            <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>

          <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 px-3 mb-2">Admin</p>

          {/* Command Center accordion */}
          <button
            onClick={() => setCmdExpanded(e => !e)}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
              isCmdActive
                ? "bg-gradient-to-r from-sky-500/15 to-transparent text-sky-300 border border-sky-500/15"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <LayoutDashboard className={cn("h-4 w-4 shrink-0 transition-colors", isCmdActive ? "text-sky-400" : "text-slate-600")} />
            <span className="flex-1 text-left">Command Center</span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-slate-600 transition-transform duration-200", cmdExpanded ? "rotate-0" : "-rotate-90")} />
          </button>

          {cmdExpanded && (
            <div className="ml-3 pl-3 border-l border-white/5 space-y-0.5 mt-1">
              {CMD_SUB_ITEMS.map(item => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 group",
                      isActive
                        ? "bg-sky-500/15 text-sky-200"
                        : "text-slate-600 hover:bg-white/5 hover:text-slate-300"
                    )}
                  >
                    <item.icon className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isActive ? "text-sky-400" : "text-slate-700 group-hover:text-slate-500")} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <div className="h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="relative border-t border-white/5 p-3">
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
              <span className="text-[10px] text-slate-700 font-mono tracking-widest">v1.0 · LIVE</span>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header — only shown for admin pages */}
        {!isAirActive && (
          <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-[hsl(222,55%,8%)] border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xs font-black text-white tracking-widest uppercase">{pageLabel}</h1>
                <p className="text-[10px] text-slate-600 font-mono hidden sm:block">Aviation CBP Registry</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/15">
                  <Shield className="h-3 w-3 text-sky-400" />
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider hidden sm:block">Admin</span>
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
          <div className="md:hidden flex items-center h-12 px-4 bg-[hsl(222,55%,8%)] border-b border-white/5 shrink-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Page Content */}
        <div className={cn(
          "flex-1 overflow-auto",
          isAirActive ? "bg-slate-950 p-0" : "bg-[hsl(222,40%,7%)] p-4 sm:p-6 lg:p-8"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
