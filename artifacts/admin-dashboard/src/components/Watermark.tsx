import { useTheme } from "@/context/ThemeContext";

export function Watermark() {
  const { isDark } = useTheme();
  const color = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.85)";

  return (
    <div className="fixed bottom-3 right-4 z-50 pointer-events-none select-none">
      <p className="font-mono tracking-wide text-right leading-tight text-[11px]" style={{ color }}>
        © All rights reserved
        <br />
        <span className="font-bold tracking-widest uppercase text-[10px]" style={{ color }}>JUNAID ABBASI</span>
      </p>
    </div>
  );
}
