import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Palette, Check } from "lucide-react";
import { useTheme, SCHEMES, type ColorScheme } from "@/context/ThemeContext";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { isDark, setIsDark, scheme, setScheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1.5">
        {/* Dark/Light toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={`relative h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
            isDark
              ? "bg-white/8 text-yellow-400 hover:bg-white/15 hover:text-yellow-300"
              : "bg-black/8 text-slate-600 hover:bg-black/12 hover:text-slate-800"
          }`}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Color palette picker trigger */}
        <button
          onClick={() => setOpen(v => !v)}
          title="Change color scheme"
          className={`relative h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
            isDark
              ? "bg-white/8 text-slate-400 hover:bg-white/15 hover:text-white"
              : "bg-black/8 text-slate-500 hover:bg-black/12 hover:text-slate-800"
          } ${open ? (isDark ? "bg-white/15 text-white" : "bg-black/12 text-slate-800") : ""}`}
        >
          {/* Active scheme dot */}
          <div
            className="h-3.5 w-3.5 rounded-full ring-2 ring-white/30"
            style={{ background: SCHEMES.find(s => s.key === scheme)?.swatch }}
          />
        </button>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div
          className={`absolute bottom-10 left-0 z-[999] w-52 rounded-2xl p-3 shadow-2xl border ${
            isDark
              ? "bg-[hsl(222,60%,8%)] border-white/10"
              : "bg-white border-slate-200 shadow-slate-200/80"
          }`}
          style={{ minWidth: 210 }}
        >
          {/* Mode section */}
          <div className="mb-3">
            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              Display Mode
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Dark", value: true, icon: Moon },
                { label: "Light", value: false, icon: Sun },
              ].map(({ label, value, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setIsDark(value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isDark === value
                      ? "bg-[var(--t-accent)] text-white shadow-md"
                      : isDark
                        ? "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                  {isDark === value && <Check className="h-3 w-3 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className={`h-px mb-3 ${isDark ? "bg-white/8" : "bg-slate-100"}`} />

          {/* Color scheme section */}
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              Color Scheme
            </p>
            <div className="space-y-1">
              {SCHEMES.map(s => (
                <button
                  key={s.key}
                  onClick={() => { setScheme(s.key as ColorScheme); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    scheme === s.key
                      ? isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800"
                      : isDark ? "text-slate-500 hover:bg-white/5 hover:text-slate-300" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {/* Dual swatch */}
                  <div className="flex items-center shrink-0">
                    <div className="h-4 w-4 rounded-full ring-2 ring-black/10" style={{ background: s.swatch }} />
                    <div className="h-4 w-4 rounded-full ring-2 ring-black/10 -ml-1.5" style={{ background: s.swatch2 }} />
                  </div>
                  <span className="flex-1 text-left">{s.label}</span>
                  {scheme === s.key && (
                    <div className="h-4 w-4 rounded-full flex items-center justify-center shrink-0" style={{ background: s.swatch }}>
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
