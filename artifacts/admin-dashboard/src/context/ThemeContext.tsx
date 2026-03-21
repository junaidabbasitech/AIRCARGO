import { createContext, useContext, useEffect, useState } from "react";

export type ColorScheme = "sky" | "violet" | "emerald" | "amber" | "rose";

export interface SchemeConfig {
  key: ColorScheme;
  label: string;
  swatch: string;
  swatch2: string;
}

export const SCHEMES: SchemeConfig[] = [
  { key: "sky",     label: "Sky & Orange",    swatch: "#0ea5e9", swatch2: "#f97316" },
  { key: "violet",  label: "Violet & Pink",   swatch: "#8b5cf6", swatch2: "#ec4899" },
  { key: "emerald", label: "Emerald & Teal",  swatch: "#10b981", swatch2: "#14b8a6" },
  { key: "amber",   label: "Amber & Gold",    swatch: "#f59e0b", swatch2: "#ea580c" },
  { key: "rose",    label: "Rose & Fuchsia",  swatch: "#f43f5e", swatch2: "#d946ef" },
];

interface ThemeCtx {
  isDark: boolean;
  scheme: ColorScheme;
  setIsDark: (v: boolean) => void;
  setScheme: (s: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  isDark: true,
  scheme: "sky",
  setIsDark: () => {},
  setScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDarkState] = useState<boolean>(() => {
    const saved = localStorage.getItem("aviacbp_dark");
    return saved === null ? false : saved === "1";
  });

  const [scheme, setSchemeState] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem("aviacbp_scheme") as ColorScheme | null;
    return SCHEMES.find(s => s.key === saved) ? (saved as ColorScheme) : "sky";
  });

  const setIsDark = (v: boolean) => {
    setIsDarkState(v);
    localStorage.setItem("aviacbp_dark", v ? "1" : "0");
  };

  const setScheme = (s: ColorScheme) => {
    setSchemeState(s);
    localStorage.setItem("aviacbp_scheme", s);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-mode", isDark ? "dark" : "light");
    root.setAttribute("data-scheme", scheme);
  }, [isDark, scheme]);

  return (
    <ThemeContext.Provider value={{ isDark, scheme, setIsDark, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Helper: returns dark class if dark mode, light class if light mode */
export function useT() {
  const { isDark } = useTheme();
  return (dark: string, light: string) => isDark ? dark : light;
}
