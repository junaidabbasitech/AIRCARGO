import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Plane, Building2, Users, RefreshCw, ClipboardList,
  LayoutDashboard, Menu, X, ChevronDown,
  Search, Network, LogOut, Gauge
} from "lucide-react";

const CMD_SUB_ITEMS = [
  { href: "/cmd", label: "Dashboard", icon: Gauge },
  { href: "/airlines", label: "Airlines", icon: Plane },
  { href: "/airports", label: "Airports", icon: Building2 },
  { href: "/airline-operations", label: "Airline Operations", icon: Network },
  { href: "/ground-handlers", label: "Ground Handlers", icon: Users },
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
  const isAirActive = location === "/air";

  const pageLabel =
    location === "/air" ? "AIR Search" :
    CMD_SUB_ITEMS.find(i => i.href === location)?.label || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[hsl(222,47%,11%)] transition-transform duration-300 md:relative md:flex md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center px-5 border-b border-white/5 gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-black text-base tracking-widest text-white uppercase">AVIA</span>
            <span className="font-black text-base tracking-widest text-orange-400 uppercase">CBP</span>
          </div>
          <button className="md:hidden ml-auto text-slate-400 hover:text-white p-1" onClick={() => setIsMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* AIR — Public */}
          <Link
            href="/air"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 group",
              isAirActive
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Search className={cn("h-4 w-4 shrink-0", isAirActive ? "text-white" : "text-orange-400")} />
            <span>AIR Search</span>
            <span className={cn("ml-auto text-[10px] px-1.5 py-0.5 rounded-md font-bold tracking-wider", isAirActive ? "bg-white/20 text-white" : "bg-orange-500/20 text-orange-400")}>
              PUBLIC
            </span>
          </Link>

          {/* Divider */}
          <div className="my-3 border-t border-white/5" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-2">Admin</p>

          {/* Command Center accordion */}
          <button
            onClick={() => setCmdExpanded(e => !e)}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
              isCmdActive
                ? "bg-sky-500/15 text-sky-300"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <LayoutDashboard className={cn("h-4 w-4 shrink-0", isCmdActive ? "text-sky-400" : "text-slate-500")} />
            <span className="flex-1 text-left">Command Center</span>
            <ChevronDown className={cn("h-3.5 w-3.5 text-slate-500 transition-transform duration-200", cmdExpanded ? "rotate-0" : "-rotate-90")} />
          </button>

          {/* Sub-items */}
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
                        ? "bg-sky-500/20 text-sky-300"
                        : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                    )}
                  >
                    <item.icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-sky-400" : "text-slate-600 group-hover:text-slate-400")} />
                    <span>{item.label}</span>
                    {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/5 p-3">
          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
            >
              <LogOut className="h-4 w-4 group-hover:text-red-400 transition-colors" />
              <span>Lock Command Center</span>
            </button>
          ) : (
            <div className="px-3 py-2 text-xs text-slate-600 font-mono">v1.0 · Live Data</div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-slate-100 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-black text-slate-800 tracking-widest uppercase">{pageLabel}</h1>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">Aviation CBP Registry System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-100">
                <div className="h-2 w-2 rounded-full bg-sky-500" />
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider hidden sm:block">Admin</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider hidden sm:block">Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}
