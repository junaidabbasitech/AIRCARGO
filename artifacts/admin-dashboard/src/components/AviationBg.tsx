export function AviationBg() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {/* Large airplane silhouette — top right */}
      <svg
        className="absolute -top-8 -right-16 opacity-[0.025] text-blue-900"
        width="520" height="520" viewBox="0 0 100 100" fill="currentColor"
      >
        <path d="M10 50 L45 38 L60 10 L68 10 L58 38 L88 32 L88 38 L58 48 L64 72 L58 72 L48 52 L20 62 Z" />
      </svg>

      {/* Medium airplane — bottom left */}
      <svg
        className="absolute -bottom-12 -left-12 opacity-[0.022] text-blue-900"
        width="380" height="380" viewBox="0 0 100 100" fill="currentColor"
        style={{ transform: "rotate(20deg)" }}
      >
        <path d="M10 50 L45 38 L60 10 L68 10 L58 38 L88 32 L88 38 L58 48 L64 72 L58 72 L48 52 L20 62 Z" />
      </svg>

      {/* Control tower — center-right */}
      <svg
        className="absolute top-1/3 right-24 opacity-[0.025] text-blue-900"
        width="180" height="240" viewBox="0 0 60 80" fill="currentColor"
      >
        {/* Tower body */}
        <rect x="24" y="50" width="12" height="30" />
        {/* Tower top cab */}
        <rect x="18" y="34" width="24" height="16" rx="2" />
        {/* Windows */}
        <rect x="20" y="37" width="6" height="5" rx="1" fill="white" fillOpacity="0.2" />
        <rect x="34" y="37" width="6" height="5" rx="1" fill="white" fillOpacity="0.2" />
        {/* Antenna */}
        <rect x="29" y="20" width="2" height="14" />
        <rect x="22" y="22" width="16" height="1.5" />
        {/* Base platform */}
        <rect x="14" y="50" width="32" height="4" rx="1" />
      </svg>

      {/* Small airplane — upper center */}
      <svg
        className="absolute top-28 left-1/2 opacity-[0.018] text-blue-900"
        width="200" height="200" viewBox="0 0 100 100" fill="currentColor"
        style={{ transform: "translate(-50%, 0) rotate(-12deg)" }}
      >
        <path d="M10 50 L45 38 L60 10 L68 10 L58 38 L88 32 L88 38 L58 48 L64 72 L58 72 L48 52 L20 62 Z" />
      </svg>

      {/* Runway lines — bottom decorative */}
      <div
        className="absolute bottom-0 left-0 right-0 opacity-[0.03]"
        style={{ height: 80, borderTop: "2px dashed #0b2147" }}
      >
        <div className="flex justify-center gap-8 pt-4">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{ width: 32, height: 8, background: "#0b2147", borderRadius: 2 }} />
          ))}
        </div>
      </div>

      {/* Subtle diagonal grid texture */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, #0b2147 0px, #0b2147 1px, transparent 1px, transparent 60px)",
        }}
      />
    </div>
  );
}
