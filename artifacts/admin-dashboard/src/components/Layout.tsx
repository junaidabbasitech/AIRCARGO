import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Plane, Building2, Users, RefreshCw, ClipboardList,
  LayoutDashboard, Menu, X,
  Search, Network, LogOut, Gauge, GitMerge, Shield,
  ScanBarcode, MessageSquarePlus, Database, Lock
} from "lucide-react";
import { Watermark } from "@/components/Watermark";
import { AviationBg } from "@/components/AviationBg";
import { ThemeToggle } from "@/components/ThemeToggle";

/* ── Nav definition ──────────────────────────────────────── */
const AIR_NAV = [
  { href: "/air", label: "AIR Search", icon: Search, badge: "PUBLIC" },
];

const ADMIN_NAV = [
  { href: "/cmd",               label: "Dashboard",          icon: Gauge },
  { href: "/airlines",          label: "Airlines",           icon: Plane },
  { href: "/airports",          label: "Airports",           icon: Building2 },
  { href: "/airline-operations",label: "Airline Operations", icon: Network },
  { href: "/ground-handlers",   label: "Ground Handlers",    icon: Users },
  { href: "/awb-prefixes",      label: "AWB Prefixes",       icon: ScanBarcode },
  { href: "/requests",          label: "Data Requests",      icon: MessageSquarePlus },
  { href: "/duplicates",        label: "Duplicate Detection",icon: GitMerge },
  { href: "/database",          label: "Database Admin",     icon: Database },
  { href: "/sync",              label: "Sync Operations",    icon: RefreshCw },
  { href: "/audit",             label: "Audit Logs",         icon: ClipboardList },
];

interface LayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  onLogout: () => void;
}

function NavItem({
  href, label, icon: Icon, isActive, badge, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  isActive: boolean; badge?: string; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "sidebar-item flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold cursor-pointer select-none",
        isActive ? "sidebar-active" : ""
      )}
      style={{
        color: isActive ? "#b3c6f5" : "rgba(203,213,225,0.65)",
      }}
    >
      <Icon
        className="h-4 w-4 shrink-0"
        style={{ color: isActive ? "#b3c6f5" : "rgba(203,213,225,0.50)" }}
      />
      <span className="flex-1 leading-none">{label}</span>
      {badge && (
        <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-md"
          style={{ background: "rgba(179,198,245,0.15)", color: "#b3c6f5" }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

export function Layout({ children, isAuthenticated, onLogout }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const isAirActive = location === "/air" || location === "/";
  const pageLabel =
    isAirActive ? "AIR Search" :
    ADMIN_NAV.find(i => i.href === location)?.label ?? "Dashboard";

  const close = () => setIsMobileOpen(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--t-bg)" }}>
      {/* Aviation watermark — behind everything */}
      <AviationBg />
      <Watermark />

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300",
          "md:relative md:flex md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "#0b2147", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Decorative glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full blur-[80px]"
            style={{ background: "rgba(179,198,245,0.06)" }} />
          <div className="absolute bottom-16 -right-12 h-40 w-40 rounded-full blur-[60px]"
            style={{ background: "rgba(179,198,245,0.04)" }} />
        </div>

        {/* Brand */}
        <div className="relative flex h-16 items-center gap-3 px-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(179,198,245,0.12)" }}>
            <Plane className="h-4 w-4" style={{ color: "#b3c6f5" }} />
          </div>
          <div>
            <div className="text-[13px] font-black tracking-widest leading-none"
              style={{ color: "#b3c6f5" }}>
              AVIACBP
            </div>
            <div className="text-[8.5px] font-semibold tracking-widest uppercase mt-0.5"
              style={{ color: "rgba(179,198,245,0.45)" }}>
              Aviation Registry
            </div>
          </div>
          <button
            className="md:hidden ml-auto p-1.5 rounded-lg hover:bg-white/10 transition-all"
            style={{ color: "rgba(203,213,225,0.55)" }}
            onClick={close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {/* Public section */}
          {AIR_NAV.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isAirActive}
              badge={item.badge}
              onClick={close}
            />
          ))}

          {/* Divider */}
          <div className="mx-1 my-3" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          <p className="px-3.5 mb-2 text-[9px] font-black uppercase tracking-widest"
            style={{ color: "rgba(179,198,245,0.40)" }}>
            Command Center
          </p>

          {/* Admin section */}
          {ADMIN_NAV.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={location === item.href}
              onClick={close}
            />
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="relative p-3 space-y-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(179,198,245,0.40)" }}>Theme</span>
            <ThemeToggle />
          </div>

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 hover:bg-red-500/10 group"
              style={{ color: "rgba(203,213,225,0.55)" }}
            >
              <LogOut className="h-4 w-4 group-hover:text-red-400 transition-colors" />
              <span className="group-hover:text-red-400 transition-colors">Lock Command Center</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest"
                style={{ color: "rgba(179,198,245,0.40)" }}>
                v1.0 · LIVE
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-5 shrink-0"
          style={{
            background: "var(--t-card)",
            borderBottom: "1px solid rgba(11,33,71,0.07)",
            boxShadow: "0 1px 8px rgba(11,33,71,0.04)",
          }}>
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg transition-all hover:bg-gray-100"
              onClick={() => setIsMobileOpen(true)}
              style={{ color: "var(--t-text-muted)" }}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-[13px] font-black tracking-widest uppercase leading-none"
                style={{ color: "#0b2147" }}>
                {pageLabel}
              </h1>
              <p className="text-[10px] font-semibold tracking-wide mt-0.5 hidden sm:block"
                style={{ color: "rgba(11,33,71,0.40)" }}>
                Aviation CBP Registry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(179,198,245,0.15)" }}>
                <Shield className="h-3 w-3" style={{ color: "#3b5fad" }} />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block"
                  style={{ color: "#3b5fad" }}>
                  Admin
                </span>
              </div>
            )}
            {!isAuthenticated && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(179,198,245,0.10)" }}>
                <Lock className="h-3 w-3" style={{ color: "rgba(11,33,71,0.40)" }} />
                <span className="text-[10px] font-semibold hidden sm:block"
                  style={{ color: "rgba(11,33,71,0.45)" }}>
                  Read-only
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(0,157,108,0.08)" }}>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider hidden sm:block">
                Online
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto" style={{ background: "var(--t-bg)", padding: "1.5rem" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
