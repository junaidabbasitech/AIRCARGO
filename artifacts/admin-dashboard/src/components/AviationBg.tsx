export function AviationBg() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">

      {/* ── Large commercial jet silhouette — top right ── */}
      <svg className="absolute -top-10 -right-20 opacity-[0.038] text-[#0b2147]"
        width="580" height="580" viewBox="0 0 120 80" fill="currentColor">
        <ellipse cx="60" cy="40" rx="48" ry="10" />
        <path d="M55,36 L75,8 L82,8 L72,36 Z" />
        <path d="M55,44 L75,72 L82,72 L72,44 Z" />
        <path d="M20,38 L4,26 L8,26 L22,38 Z" />
        <path d="M20,42 L4,54 L8,54 L22,42 Z" />
        <ellipse cx="68" cy="25" rx="10" ry="4" />
        <ellipse cx="68" cy="55" rx="10" ry="4" />
        <ellipse cx="100" cy="38" rx="4" ry="2.5" fill="white" fillOpacity="0.15" />
      </svg>

      {/* ── Control tower — right center ── */}
      <svg className="absolute top-1/3 right-10 opacity-[0.040] text-[#0b2147]"
        width="160" height="260" viewBox="0 0 60 100" fill="currentColor">
        <rect x="29" y="2" width="2" height="20" />
        <rect x="22" y="8" width="16" height="1.5" />
        <rect x="26" y="14" width="8" height="1" />
        <rect x="14" y="22" width="32" height="20" rx="3" />
        <rect x="17" y="26" width="7" height="6" rx="1" fill="white" fillOpacity="0.2" />
        <rect x="28" y="26" width="7" height="6" rx="1" fill="white" fillOpacity="0.2" />
        <rect x="37" y="26" width="5" height="6" rx="1" fill="white" fillOpacity="0.2" />
        <rect x="10" y="42" width="40" height="5" rx="1" />
        <rect x="22" y="47" width="16" height="4" />
        <path d="M20,51 L24,85 L36,85 L40,51 Z" />
        <rect x="12" y="85" width="36" height="8" rx="2" />
      </svg>

      {/* ── Small side-view plane — bottom left ── */}
      <svg className="absolute -bottom-8 -left-16 opacity-[0.032] text-[#0b2147]"
        width="400" height="300" viewBox="0 0 100 100" fill="currentColor"
        style={{ transform: "rotate(15deg)" }}>
        <ellipse cx="50" cy="50" rx="40" ry="9" transform="rotate(-30 50 50)" />
        <polygon points="50,44 80,30 80,58 50,56" />
        <polygon points="50,44 20,58 20,30 50,56" transform="scale(-1,1) translate(-100,0)" />
        <polygon points="82,45 100,30 100,44" />
        <polygon points="82,55 100,70 100,56" />
      </svg>

      {/* ── Small jet — upper left area ── */}
      <svg className="absolute top-16 left-1/3 opacity-[0.025] text-[#0b2147]"
        width="200" height="140" viewBox="0 0 120 80" fill="currentColor"
        style={{ transform: "rotate(-8deg)" }}>
        <ellipse cx="60" cy="40" rx="48" ry="10" />
        <path d="M55,36 L75,8 L82,8 L72,36 Z" />
        <path d="M55,44 L75,72 L82,72 L72,44 Z" />
        <path d="M20,38 L4,26 L8,26 L22,38 Z" />
        <path d="M20,42 L4,54 L8,54 L22,42 Z" />
        <ellipse cx="68" cy="25" rx="10" ry="4" />
        <ellipse cx="68" cy="55" rx="10" ry="4" />
      </svg>

      {/* ── Runway — bottom center ── */}
      <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-[0.040] text-[#0b2147]"
        width="800" height="80" viewBox="0 0 800 80" fill="currentColor">
        <rect x="0" y="30" width="800" height="20" rx="2" fillOpacity="0.5" />
        {Array.from({ length: 26 }).map((_, i) => (
          <rect key={i} x={30 + i * 29} y="37" width="18" height="4" rx="1" fill="white" fillOpacity="0.4" />
        ))}
        {[10, 16, 22, 28].map(x => (
          <rect key={`lt-${x}`} x={x} y="31" width="4" height="18" rx="1" fill="white" fillOpacity="0.3" />
        ))}
        {[774, 768, 762, 756].map(x => (
          <rect key={`rt-${x}`} x={x} y="31" width="4" height="18" rx="1" fill="white" fillOpacity="0.3" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <circle key={`al-${i}`} cx={8 - i * 6} cy={40} r="2" fillOpacity="0.5" />
        ))}
      </svg>

      {/* ── Route arc — background center ── */}
      <svg className="absolute top-1/4 left-1/4 opacity-[0.025] text-[#0b2147]"
        width="300" height="200" viewBox="0 0 300 200" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="30" cy="160" r="8" fill="currentColor" />
        <circle cx="270" cy="40" r="8" fill="currentColor" />
        <path d="M38,154 Q150,-20 262,48" strokeDasharray="10 5" />
        <g transform="translate(150,67) rotate(-38)">
          <ellipse cx="0" cy="0" rx="12" ry="3.5" fill="currentColor" />
          <polygon points="0,-3.5 11,9 11,-9" fill="currentColor" />
          <polygon points="-1,-3.5 -11,9 -11,-9" fill="currentColor" />
        </g>
      </svg>

      {/* ── Subtle diagonal texture ── */}
      <div className="absolute inset-0 opacity-[0.010]" style={{
        backgroundImage: "repeating-linear-gradient(45deg, #0b2147 0px, #0b2147 1px, transparent 1px, transparent 80px)",
      }} />
    </div>
  );
}
