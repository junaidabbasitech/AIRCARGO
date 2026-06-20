import React from "react";
import { cn } from "@/lib/utils";
import { X, Loader2 } from "lucide-react";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("aero-card flex flex-col", className)} {...props} />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)}
    style={{ borderBottom: "1px solid rgba(197,198,207,0.25)" }} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-base font-black tracking-wide", className)}
    style={{ color: "#0b2147" }} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-5 flex-1 overflow-auto", className)} {...props} />
));
CardContent.displayName = "CardContent";

/* ── Button ── */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
};

const BTN_VARIANTS: Record<string, string> = {
  primary:   "text-white shadow-md",
  secondary: "text-white shadow-sm",
  danger:    "text-white shadow-md",
  success:   "text-white shadow-md",
  outline:   "border font-semibold",
  ghost:     "hover:bg-black/5",
  default:   "border font-semibold",
};

const BTN_STYLES: Record<string, React.CSSProperties> = {
  primary:   { background: "linear-gradient(135deg, #3b5fad 0%, #1e3a8a 100%)", boxShadow: "0 4px 18px rgba(59,95,173,0.35)" },
  secondary: { background: "linear-gradient(135deg, #475569 0%, #334155 100%)", boxShadow: "0 4px 14px rgba(51,65,85,0.30)" },
  danger:    { background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", boxShadow: "0 4px 18px rgba(239,68,68,0.35)" },
  success:   { background: "linear-gradient(135deg, #059669 0%, #065f46 100%)", boxShadow: "0 4px 18px rgba(5,150,105,0.35)" },
  outline:   { background: "transparent", borderColor: "rgba(59,95,173,0.30)", color: "#3b5fad" },
  ghost:     { background: "transparent", color: "#44474e" },
  default:   { background: "#f8faff", borderColor: "rgba(197,198,207,0.40)", color: "#0b2147" },
};

const BTN_HOVER: Record<string, React.CSSProperties> = {
  primary:   { filter: "brightness(1.12)", transform: "translateY(-2px)", boxShadow: "0 8px 28px rgba(59,95,173,0.45)" },
  secondary: { filter: "brightness(1.10)", transform: "translateY(-2px)", boxShadow: "0 8px 22px rgba(51,65,85,0.38)" },
  danger:    { filter: "brightness(1.10)", transform: "translateY(-2px)", boxShadow: "0 8px 28px rgba(239,68,68,0.45)" },
  success:   { filter: "brightness(1.10)", transform: "translateY(-2px)", boxShadow: "0 8px 28px rgba(5,150,105,0.45)" },
  outline:   { background: "rgba(59,95,173,0.07)", transform: "translateY(-1px)" },
  ghost:     { background: "rgba(0,0,0,0.05)" },
  default:   { background: "#eef3ff", transform: "translateY(-1px)" },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", isLoading, style, children, ...props }, ref) => {
    const [hovered, setHovered] = React.useState(false);
    const v = variant;

    const sizes = {
      sm:   "h-8 px-3 text-xs rounded-lg",
      md:   "h-9 px-4 text-sm rounded-xl",
      lg:   "h-11 px-6 text-sm rounded-xl",
      icon: "h-9 w-9 rounded-xl p-0",
    };

    const computedStyle: React.CSSProperties = {
      ...BTN_STYLES[v],
      ...(hovered && !props.disabled ? BTN_HOVER[v] : {}),
      transition: "all 0.18s ease",
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
        onMouseUp={e => (e.currentTarget.style.transform = hovered ? BTN_HOVER[v]?.transform as string || "" : "")}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          BTN_VARIANTS[v],
          sizes[size],
          className
        )}
        style={computedStyle}
        {...props}
      >
        {isLoading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-xl border px-3 py-2 text-sm",
      "bg-white/80 placeholder:text-slate-400",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
      "disabled:cursor-not-allowed disabled:opacity-50 transition-all",
      className
    )}
    style={{
      border: "1px solid rgba(197,198,207,0.45)",
      color: "#0b2147",
    } as any}
    onFocus={e => {
      e.currentTarget.style.borderColor = "rgba(59,95,173,0.50)";
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,95,173,0.10)";
    }}
    onBlur={e => {
      e.currentTarget.style.borderColor = "rgba(197,198,207,0.45)";
      e.currentTarget.style.boxShadow = "";
    }}
    {...props}
  />
));
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-xl border px-3 py-2 text-sm appearance-none",
      "bg-white/80",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
      "disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer",
      className
    )}
    style={{
      border: "1px solid rgba(197,198,207,0.45)",
      color: "#0b2147",
    } as any}
    onFocus={e => {
      e.currentTarget.style.borderColor = "rgba(59,95,173,0.50)";
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,95,173,0.10)";
    }}
    onBlur={e => {
      e.currentTarget.style.borderColor = "rgba(197,198,207,0.45)";
      e.currentTarget.style.boxShadow = "";
    }}
    {...props}
  />
));
Select.displayName = "Select";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-[10px] font-black leading-none uppercase tracking-widest", className)}
    style={{ color: "rgba(11,33,71,0.50)" }} {...props} />
));
Label.displayName = "Label";

export const Badge = ({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "success" | "warning" | "danger" | "outline"
}) => {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: "rgba(59,95,173,0.10)", color: "#3b5fad",   border: "1px solid rgba(59,95,173,0.22)" },
    success: { background: "rgba(5,150,105,0.10)",  color: "#059669",   border: "1px solid rgba(5,150,105,0.22)" },
    warning: { background: "rgba(217,119,6,0.10)",  color: "#b45309",   border: "1px solid rgba(217,119,6,0.22)" },
    danger:  { background: "rgba(239,68,68,0.10)",  color: "#dc2626",   border: "1px solid rgba(239,68,68,0.22)" },
    outline: { background: "transparent",           color: "#44474e",   border: "1px solid rgba(197,198,207,0.50)" },
  };
  return (
    <div
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", className)}
      style={styles[variant]}
      {...props}
    />
  );
};

export const Modal = ({ isOpen, onClose, title, children }: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-50 w-full max-w-lg mx-4 rounded-2xl overflow-hidden"
        style={{ background: "#fff", boxShadow: "0 24px 80px rgba(11,33,71,0.18)", border: "1px solid rgba(197,198,207,0.35)" }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background: "linear-gradient(90deg, rgba(59,95,173,0.06), rgba(59,95,173,0.02))", borderBottom: "1px solid rgba(197,198,207,0.25)" }}>
          <h2 className="text-[15px] font-black tracking-wide" style={{ color: "#0b2147" }}>{title}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
            style={{ background: "rgba(11,33,71,0.06)", color: "rgba(11,33,71,0.50)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.10)"; e.currentTarget.style.color = "#dc2626"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(11,33,71,0.06)"; e.currentTarget.style.color = "rgba(11,33,71,0.50)"; }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 animate-in fade-in zoom-in-95 duration-200">{children}</div>
      </div>
    </div>
  );
};

export const Table = ({ children, className, ...props }: React.TableHTMLAttributes<HTMLTableElement> & { children: React.ReactNode; className?: string }) => (
  <div className="w-full overflow-auto rounded-xl" style={{ border: "1px solid rgba(197,198,207,0.30)" }}>
    <table {...props} className={cn("w-full caption-bottom text-sm", className)}>{children}</table>
  </div>
);

export const TableHeader = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & { children: React.ReactNode }) => (
  <thead {...props} style={{ background: "rgba(11,33,71,0.025)", borderBottom: "1px solid rgba(197,198,207,0.25)" }}>{children}</thead>
);

export const TableBody = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & { children: React.ReactNode }) => (
  <tbody {...props} className={cn("[&_tr:last-child]:border-0", (props as any).className)}>{children}</tbody>
);

export const TableRow = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { children: React.ReactNode; className?: string }) => (
  <tr
    {...props}
    className={cn("group border-b transition-colors cursor-default", className)}
    style={{ borderColor: "rgba(197,198,207,0.20)", ...(props as any).style }}
    onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,95,173,0.03)")}
    onMouseLeave={e => (e.currentTarget.style.background = "")}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableHeaderCellElement> & { children: React.ReactNode; className?: string }) => (
  <th {...props} className={cn("h-11 px-4 text-left align-middle text-[9px] font-black uppercase tracking-widest", className)}
    style={{ color: "rgba(11,33,71,0.40)", ...(props as any).style }}>
    {children}
  </th>
);

export const TableCell = ({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableDataCellElement> & { children: React.ReactNode; className?: string }) => (
  <td {...props} className={cn("px-4 py-3 align-middle text-sm", className)} style={{ color: "#0b2147", ...(props as any).style }}>
    {children}
  </td>
);
