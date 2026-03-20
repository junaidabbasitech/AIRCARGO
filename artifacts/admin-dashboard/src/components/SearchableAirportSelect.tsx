import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Building2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Airport {
  id: number;
  name: string;
  iataCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

interface Props {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableAirportSelect({ value, onChange, placeholder = "Search airports by name or IATA…", className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [displayLabel, setDisplayLabel] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // When value is set externally (edit mode), resolve the airport name
  useEffect(() => {
    if (!value) { setDisplayLabel(""); return; }
    fetch(`${BASE}/api/airports/${value}`)
      .then(r => r.ok ? r.json() : null)
      .then(a => {
        if (a) {
          const parts = [a.name, a.iataCode ? `(${a.iataCode})` : null].filter(Boolean);
          setDisplayLabel(parts.join(" "));
        } else {
          setDisplayLabel(`Airport #${value}`);
        }
      })
      .catch(() => setDisplayLabel(`Airport #${value}`));
  }, [value]);

  const doSearch = useCallback((q: string) => {
    clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE}/api/airports?search=${encodeURIComponent(q)}&limit=30&page=1`);
        const json = await res.json();
        setResults(json.data ?? []);
      } catch {}
      setLoading(false);
    }, 250);
  }, []);

  const openDropdown = () => {
    setIsOpen(true);
    setQuery("");
    setResults([]);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setLoading(false);
  };

  const selectAirport = (airport: Airport) => {
    onChange(String(airport.id));
    const parts = [airport.name, airport.iataCode ? `(${airport.iataCode})` : null].filter(Boolean);
    setDisplayLabel(parts.join(" "));
    closeDropdown();
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setDisplayLabel("");
    closeDropdown();
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* Trigger */}
      <div
        onClick={openDropdown}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-sm cursor-pointer hover:border-orange-400 transition-colors"
      >
        {isOpen ? (
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            placeholder={placeholder}
            value={query}
            onChange={e => { setQuery(e.target.value); doSearch(e.target.value); }}
            onKeyDown={e => { if (e.key === "Escape") closeDropdown(); }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 truncate ${displayLabel ? "text-foreground" : "text-muted-foreground"}`}>
            {displayLabel || "— Select Airport —"}
          </span>
        )}
        {!isOpen && value && (
          <button onMouseDown={clearSelection} className="shrink-0 text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!isOpen && <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search status */}
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
              <div className="h-3.5 w-3.5 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin shrink-0" />
              Searching airports…
            </div>
          ) : query && results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">
              No airports found for "<span className="font-medium text-slate-600">{query}</span>"
            </div>
          ) : !query ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-400">
              <Search className="h-3.5 w-3.5 shrink-0" />
              Type airport name, IATA code, or city…
            </div>
          ) : null}

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {results.map(airport => (
                <button
                  key={airport.id}
                  onMouseDown={() => selectAirport(airport)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 text-left transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="shrink-0 h-8 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <span className="text-xs font-bold font-mono text-orange-600">{airport.iataCode || "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{airport.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {[airport.city, airport.state, airport.country].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                  <Building2 className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                </button>
              ))}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center">
                Showing {results.length} results · refine your search for more
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
