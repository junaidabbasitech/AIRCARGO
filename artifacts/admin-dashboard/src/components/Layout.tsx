import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Plane, Building2, Users, RefreshCw, ClipboardList,
  LayoutDashboard, Menu, X, ChevronDown, ChevronRight,
  Radar, Search, Network
} from "lucide-react";

const CMD_SUB_ITEMS = [
  { href: "/cmd", label: "Command Center", icon: LayoutDashboard },
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
    <div className="flex h-screen overflow-hidden bg-background">
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 flex flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:relative md:flex md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center px-5 border-b border-sidebar-border gap-3">
          <Radar className="h-5 w-5 text-sky-400 animate-pulse" />
          <span className="font-display font-bold text-base tracking-widest text-sky-300 uppercase">AviaCBP</span>
          <button className="md:hidden ml-auto text-slate-400 hover:text-white" onClick={() => setIsMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* AIR — Public */}
          <Link
            href="/air"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 group",
              isAirActive
                ? "bg-orange-500 text-white shadow-md"
                : "text-slate-300 hover:bg-orange-500/15 hover:text-orange-300"
            )}
          >
            <Search className={cn("h-4 w-4 transition-colors", isAirActive ? "text-white" : "text-orange-400 group-hover:text-orange-300")} />
            AIR Search
            <span className={cn("ml-auto text-xs px-1.5 py-0.5 rounded font-mono", isAirActive ? "bg-white/20 text-white" : "bg-orange-500/20 text-orange-400")}>
              PUBLIC
            </span>
          </Link>

          {/* Divider */}
          <div className="border-t border-sidebar-border my-2" />

          {/* Command Center accordion */}
          <button
            onClick={() => setCmdExpanded(e => !e)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 group",
              isCmdActive
                ? "bg-sky-500/20 text-sky-300"
                : "text-slate-300 hover:bg-sky-500/10 hover:text-sky-300"
            )}
          >
            <LayoutDashboard className={cn("h-4 w-4 shrink-0 transition-colors", isCmdActive ? "text-sky-400" : "text-slate-400 group-hover:text-sky-400")} />
            <span className="flex-1 text-left">Command Center</span>
            {cmdExpanded
              ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-400 transition-transform" />
              : <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-400 transition-transform" />
            }
          </button>

          {/* Sub-items */}
          {cmdExpanded && (
            <div className="pl-3 space-y-0.5 border-l border-sky-500/20 ml-4">
              {CMD_SUB_ITEMS.map(item => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-sky-500/20 text-sky-300 border-l-2 border-sky-400 -ml-[2px]"
                        : "text-slate-400 hover:bg-sky-500/10 hover:text-sky-300"
                    )}
                  >
                    <item.icon className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isActive ? "text-sky-400" : "text-slate-500 group-hover:text-sky-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Logout (no profile) */}
        {isAuthenticated && (
          <div className="border-t border-sidebar-border p-3">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 group"
            >
              <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
              Lock Command Center
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card shadow-sm">
          <button onClick={() => setIsMobileOpen(true)} className="md:hidden text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-display font-semibold text-foreground tracking-wide uppercase ml-2 md:ml-0">
            {pageLabel}
          </h1>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-200">
                <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-xs font-mono text-sky-700 uppercase tracking-wider">Admin</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 border border-green-200">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-green-700 uppercase tracking-wider">Online</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}
