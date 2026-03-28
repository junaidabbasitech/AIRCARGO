type CardWatermarkVariant = "plane" | "jet" | "tower" | "runway" | "globe" | "route";

interface CardWatermarkProps {
  variant?: CardWatermarkVariant;
  size?: number;
  opacity?: number;
  className?: string;
  position?: "bottom-right" | "top-right" | "bottom-left" | "center";
}

export function CardWatermark({
  variant = "plane",
  size = 80,
  opacity = 0.05,
  className = "",
  position = "bottom-right",
}: CardWatermarkProps) {
  const posClass =
    position === "bottom-right" ? "bottom-3 right-3" :
    position === "top-right"    ? "top-3 right-3" :
    position === "bottom-left"  ? "bottom-3 left-3" :
    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  return (
    <div
      className={`absolute pointer-events-none select-none ${posClass} ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {variant === "plane"   && <PlaneSvg size={size} />}
      {variant === "jet"     && <JetSvg size={size} />}
      {variant === "tower"   && <TowerSvg size={size} />}
      {variant === "runway"  && <RunwaySvg size={size} />}
      {variant === "globe"   && <GlobeSvg size={size} />}
      {variant === "route"   && <RouteSvg size={size} />}
    </div>
  );
}

function PlaneSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="#0b2147">
      {/* Main fuselage */}
      <ellipse cx="50" cy="50" rx="40" ry="9" transform="rotate(-30 50 50)" />
      {/* Wings */}
      <polygon points="50,44 80,30 80,58 50,56" />
      <polygon points="50,44 20,58 20,30 50,56" transform="scale(-1,1) translate(-100,0)" />
      {/* Tail */}
      <polygon points="82,45 100,30 100,44" />
      <polygon points="82,55 100,70 100,56" />
    </svg>
  );
}

function JetSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 80" fill="#0b2147">
      {/* Body */}
      <ellipse cx="60" cy="40" rx="48" ry="10" />
      {/* Nose cone */}
      <path d="M108,40 Q120,40 108,37 Z" />
      {/* Main wings */}
      <path d="M55,36 L75,8 L82,8 L72,36 Z" />
      <path d="M55,44 L75,72 L82,72 L72,44 Z" />
      {/* Rear wings */}
      <path d="M20,38 L4,26 L8,26 L22,38 Z" />
      <path d="M20,42 L4,54 L8,54 L22,42 Z" />
      {/* Engine pods */}
      <ellipse cx="68" cy="25" rx="10" ry="4" />
      <ellipse cx="68" cy="55" rx="10" ry="4" />
      {/* Cockpit windows */}
      <ellipse cx="100" cy="38" rx="4" ry="2.5" fill="white" fillOpacity="0.3" />
    </svg>
  );
}

function TowerSvg({ size }: { size: number }) {
  return (
    <svg width={size * 0.6} height={size} viewBox="0 0 60 100" fill="#0b2147">
      {/* Antenna */}
      <rect x="29" y="2" width="2" height="20" />
      <rect x="22" y="8" width="16" height="1.5" />
      <rect x="26" y="14" width="8" height="1" />
      {/* Cab */}
      <rect x="14" y="22" width="32" height="20" rx="3" />
      {/* Windows */}
      <rect x="17" y="26" width="7" height="6" rx="1" fill="white" fillOpacity="0.25" />
      <rect x="28" y="26" width="7" height="6" rx="1" fill="white" fillOpacity="0.25" />
      <rect x="37" y="26" width="5" height="6" rx="1" fill="white" fillOpacity="0.25" />
      {/* Platform */}
      <rect x="10" y="42" width="40" height="5" rx="1" />
      {/* Tower neck */}
      <rect x="22" y="47" width="16" height="4" />
      {/* Shaft */}
      <path d="M20,51 L24,85 L36,85 L40,51 Z" />
      {/* Base */}
      <rect x="12" y="85" width="36" height="8" rx="2" />
      {/* Base supports */}
      <path d="M14,85 L20,93" stroke="#0b2147" strokeWidth="2" fill="none" />
      <path d="M46,85 L40,93" stroke="#0b2147" strokeWidth="2" fill="none" />
    </svg>
  );
}

function RunwaySvg({ size }: { size: number }) {
  return (
    <svg width={size * 1.4} height={size * 0.6} viewBox="0 0 140 60" fill="#0b2147">
      {/* Runway surface */}
      <rect x="10" y="22" width="120" height="16" rx="2" fillOpacity="0.5" />
      {/* Center line dashes */}
      {[18, 36, 54, 72, 90, 108].map(x => (
        <rect key={x} x={x} y="29" width="12" height="2.5" rx="1" fill="white" fillOpacity="0.4" />
      ))}
      {/* Threshold markings */}
      {[14, 18, 22].map(x => (
        <rect key={`lt-${x}`} x={x} y="24" width="2" height="12" rx="0.5" fill="white" fillOpacity="0.3" />
      ))}
      {[120, 124, 128].map(x => (
        <rect key={`rt-${x}`} x={x} y="24" width="2" height="12" rx="0.5" fill="white" fillOpacity="0.3" />
      ))}
      {/* Taxiway */}
      <rect x="60" y="38" width="20" height="20" rx="1" fillOpacity="0.3" />
      {/* Approach lights */}
      {[0, 5, 10].map(i => (
        <circle key={i} cx={8 - i * 3} cy={30} r="1.2" fillOpacity="0.6" />
      ))}
    </svg>
  );
}

function GlobeSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="#0b2147" strokeWidth="3">
      {/* Globe outline */}
      <circle cx="50" cy="50" r="42" />
      {/* Latitude lines */}
      <ellipse cx="50" cy="50" rx="42" ry="18" />
      <line x1="8" y1="50" x2="92" y2="50" />
      {/* Longitude lines */}
      <ellipse cx="50" cy="50" rx="20" ry="42" />
      {/* Planes on route */}
      <circle cx="30" cy="35" r="3" fill="#0b2147" />
      <circle cx="70" cy="65" r="3" fill="#0b2147" />
      <path d="M30,35 Q50,20 70,65" strokeDasharray="4 3" strokeWidth="2" />
    </svg>
  );
}

function RouteSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 120 80" fill="#0b2147">
      {/* Origin dot */}
      <circle cx="15" cy="60" r="5" />
      <circle cx="15" cy="60" r="9" fill="none" stroke="#0b2147" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Destination dot */}
      <circle cx="105" cy="20" r="5" />
      <circle cx="105" cy="20" r="9" fill="none" stroke="#0b2147" strokeWidth="1.5" />
      {/* Arc route */}
      <path d="M20,58 Q60,-5 100,24" stroke="#0b2147" strokeWidth="2" fill="none" strokeDasharray="6 3" />
      {/* Plane on route */}
      <g transform="translate(58,22) rotate(-38)">
        <ellipse cx="0" cy="0" rx="8" ry="2.5" />
        <polygon points="0,-2.5 7,6 7,-6" />
        <polygon points="-1,-2.5 -7,6 -7,-6" />
      </g>
    </svg>
  );
}
