import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Check } from "lucide-react";
import { useTheme, SCHEMES, type ColorScheme } from "@/context/ThemeContext";

export function ThemeToggle({
  compact = false,
  direction = "down", // 👈 NEW PROP
}: {
  compact?: boolean;
  direction?: "up" | "down"; // 👈 NEW TYPE
}) {
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

  const activeScheme = SCHEMES.find(s => s.key === scheme);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1.5">
        {/* Dark/Light toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: isDark ? "rgba(255,255,255,0.10)" : "rgba(11,33,71,0.07)",
            color: isDark ? "#fbbf24" : "#475569",
            border: "1px solid " + (isDark ? "rgba(255,255,255,0.12)" : "rgba(11,33,71,0.12)"),
          }}
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* Color scheme trigger */}
        <button
          onClick={() => setOpen(v => !v)}
          title="Change color scheme"
          className="h-8 rounded-lg flex items-center gap-2 px-2.5 transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: open
              ? (activeScheme?.swatch + "22")
              : isDark ? "rgba(255,255,255,0.10)" : "rgba(11,33,71,0.07)",
            border: "1px solid " + (open
              ? (activeScheme?.swatch + "55")
              : isDark ? "rgba(255,255,255,0.12)" : "rgba(11,33,71,0.12)"),
          }}
        >
          {/* Dual color swatch */}
          <div className="flex items-center shrink-0">
            <div className="h-3.5 w-3.5 rounded-full ring-2 ring-white/40" style={{ background: activeScheme?.swatch }} />
            <div className="h-3.5 w-3.5 rounded-full ring-2 ring-white/40 -ml-1" style={{ background: activeScheme?.swatch2 }} />
          </div>

          {!compact && (
            <span
              className="text-[10px] font-bold hidden sm:block"
              style={{ color: isDark ? "rgba(255,255,255,0.60)" : "rgba(11,33,71,0.55)" }}
            >
              Theme
            </span>
          )}
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute right-0 z-[999] w-56 rounded-2xl overflow-hidden ${
            direction === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          style={{
            background: "#ffffff",
            border: "1px solid rgba(197,198,207,0.35)",
            boxShadow: "0 20px 60px rgba(11,33,71,0.14)",
          }}
        >
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2">
            <p
              className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: "rgba(11,33,71,0.40)" }}
            >
              Display Mode
            </p>
          </div>

          {/* Mode switcher */}
          <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
            {[
              { label: "Light", value: false, icon: Sun },
              { label: "Dark", value: true, icon: Moon },
            ].map(({ label, value, icon: Icon }) => {
              const active = isDark === value;
              return (
                <button
                  key={label}
                  onClick={() => setIsDark(value)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150"
                  style={{
                    background: active ? "#0b2147" : "rgba(11,33,71,0.05)",
                    color: active ? "#ffffff" : "#44474e",
                    border: active ? "1px solid #0b2147" : "1px solid rgba(197,198,207,0.30)",
                  }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                  {active && <Check className="h-3 w-3 ml-auto" />}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(197,198,207,0.25)", margin: "0 12px" }} />

          {/* Color scheme */}
          <div className="px-4 pt-3 pb-1">
            <p
              className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: "rgba(11,33,71,0.40)" }}
            >
              Accent Color
            </p>
          </div>

          <div className="px-3 pb-3 space-y-1">
            {SCHEMES.map(s => {
              const active = scheme === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setScheme(s.key as ColorScheme)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150"
                  style={{
                    background: active ? s.swatch + "14" : "transparent",
                    border: active ? `1px solid ${s.swatch}45` : "1px solid transparent",
                    color: "#171c1f",
                  }}
                >
                  <div className="flex items-center shrink-0">
                    <div className="h-4 w-4 rounded-full shadow-sm" style={{ background: s.swatch }} />
                    <div className="h-4 w-4 rounded-full shadow-sm -ml-1.5" style={{ background: s.swatch2 }} />
                  </div>

                  <span className="flex-1 text-left font-semibold" style={{ color: active ? s.swatch : "#44474e" }}>
                    {s.label}
                  </span>

                  {active && (
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: s.swatch }}
                    >
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}