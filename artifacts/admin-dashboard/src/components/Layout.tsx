import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Plane, Building2, Users, RefreshCw, ClipboardList, LayoutDashboard, Menu, LogOut, Radar } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Command Center", icon: LayoutDashboard, section: "Overview" },
  { href: "/airlines", label: "Airlines", icon: Plane, section: "Data Management" },
  { href: "/airports", label: "Airports", icon: Building2, section: "Data Management" },
  { href: "/ground-handlers", label: "Ground Handlers", icon: Users, section: "Data Management" },
  { href: "/sync", label: "Sync Operations", icon: RefreshCw, section: "System" },
  { href: "/audit", label: "Audit Logs", icon: ClipboardList, section: "System" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:relative md:flex md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Radar className="h-6 w-6 text-primary animate-pulse" />
            <span className="font-display font-bold text-lg tracking-widest text-primary glow-text uppercase mt-1">AviaCBP</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2">
            <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Overview</p>
          </div>
          <nav className="space-y-1 px-2 mb-6">
            {NAV_ITEMS.filter(i => i.section === "Overview").map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}>
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 mb-2">
            <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Data Management</p>
          </div>
          <nav className="space-y-1 px-2 mb-6">
            {NAV_ITEMS.filter(i => i.section === "Data Management").map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}>
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 mb-2">
            <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">System</p>
          </div>
          <nav className="space-y-1 px-2">
            {NAV_ITEMS.filter(i => i.section === "System").map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}>
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="text-xs font-bold text-primary">AD</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Admin System</p>
              <p className="text-xs text-muted-foreground truncate">SYS-OP-01</p>
            </div>
            <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive cursor-pointer" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative z-0">
        <div className="absolute inset-0 z-[-1] opacity-30 pointer-events-none">
           <img src={`${import.meta.env.BASE_URL}images/bg-pattern.png`} alt="Background" className="w-full h-full object-cover mix-blend-screen" />
        </div>
        
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border glass-panel">
          <button onClick={() => setIsMobileOpen(true)} className="md:hidden text-muted-foreground hover:text-foreground">
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 ml-4 md:ml-0 flex items-center">
            <h1 className="text-xl font-display font-semibold text-foreground tracking-wide uppercase">
              {NAV_ITEMS.find(i => i.href === location)?.label || "Dashboard"}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono text-primary uppercase tracking-wider">System Online</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
