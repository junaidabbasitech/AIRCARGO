import { useTheme } from "@/context/ThemeContext";

export function Watermark() {
  const { isDark } = useTheme();

  return (
    <div className="fixed bottom-4 right-5 z-[9999] pointer-events-none select-none">
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{
          background: isDark
            ? "rgba(11,33,71,0.55)"
            : "rgba(255,255,255,0.65)",
          backdropFilter: "blur(10px)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(11,33,71,0.10)",
          boxShadow: isDark
            ? "0 2px 12px rgba(0,0,0,0.35)"
            : "0 2px 12px rgba(11,33,71,0.10)",
        }}
      >
        <span
          className="text-[9px] font-medium tracking-wide uppercase"
          style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(11,33,71,0.45)" }}
        >
          Powered by
        </span>
        <span
          className="text-[10px] font-black tracking-widest uppercase"
          style={{ color: isDark ? "rgba(255,255,255,0.75)" : "#0b2147" }}
        >
          JUNAID ABBASI
        </span>
      </div>
    </div>
  );
}
