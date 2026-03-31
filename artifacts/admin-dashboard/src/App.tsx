import { useEffect, useRef, useCallback } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { LogIn, Plane, Shield } from "lucide-react";
import { Layout } from "@/components/Layout";
import { AviationBg } from "@/components/AviationBg";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Airlines from "@/pages/Airlines";
import Airports from "@/pages/Airports";
import GroundHandlers from "@/pages/GroundHandlers";
import SyncData from "@/pages/SyncData";
import AuditLogs from "@/pages/AuditLogs";
import AirPublic from "@/pages/AirPublic";
import AirlineOperations from "@/pages/AirlineOperations";
import Duplicates from "@/pages/Duplicates";
import AwbPrefixes from "@/pages/AwbPrefixes";
import Requests from "@/pages/Requests";
import Database from "@/pages/Database";
import { Watermark } from "@/components/Watermark";
import { useAuth } from "@workspace/replit-auth-web";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } }
});

function LoginGate() {
  const { login } = useAuth();
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: isDark ? "#0b1220" : "#f6fafe" }}>
      <AviationBg />

      <div className="relative w-full max-w-sm z-10">
        <div className="absolute -top-12 right-0">
          <ThemeToggle />
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ boxShadow: "0 24px 80px rgba(11,33,71,0.12)" }}>
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #0b2147, #000b25)" }}>
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <div className="text-xl font-black tracking-widest mb-1">
                <span style={{ color: "#3b5fad" }}>AVIA</span><span style={{ color: "#009d6c" }}>CBP</span>
              </div>
              <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: "#0b2147" }}>Command Center</h2>
              <p className="text-xs mt-1.5 font-medium" style={{ color: "rgba(11,33,71,0.50)" }}>Sign in to access the admin dashboard</p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={login}
              className="btn-primary w-full py-3.5 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Log In
            </button>

            <div className="text-center pt-1">
              <a href="/air" className="text-xs font-semibold transition-colors hover:opacity-70"
                style={{ color: "rgba(11,33,71,0.45)" }}>
                ← Return to AIR Search (public)
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Plane className="h-3.5 w-3.5" style={{ color: "rgba(11,33,71,0.35)" }} />
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "rgba(11,33,71,0.35)" }}>
            Aviation CBP Registry System
          </span>
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, isLoading, logout } = useAuth();

  const isProtected = location !== "/air" && !location.startsWith("/air");

  const handleLogout = () => {
    logout();
  };

  // ── Auto-lock after 10 minutes of inactivity ──
  const INACTIVITY_MS = 10 * 60 * 1000;
  const lastActivityRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_MS) {
        toast("Session locked", {
          description: "Logged out after 10 minutes of inactivity.",
          icon: "🔒",
          duration: 6000,
        });
        logout();
      }
    }, 30_000);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearInterval(interval);
    };
  }, [isAuthenticated, resetTimer, logout]);

  // Redirect to /air if accessing root unauthenticated
  useEffect(() => {
    if (!isLoading && location === "/" && !isAuthenticated) navigate("/air");
  }, [location, isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Show login gate for protected routes
  if (isProtected && !isAuthenticated) {
    return <LoginGate />;
  }

  return (
    <Layout isAuthenticated={isAuthenticated} onLogout={handleLogout}>
      <Switch>
        <Route path="/air" component={AirPublic} />
        <Route path="/cmd" component={Dashboard} />
        <Route path="/airlines" component={Airlines} />
        <Route path="/airports" component={Airports} />
        <Route path="/airline-operations" component={AirlineOperations} />
        <Route path="/duplicates" component={Duplicates} />
        <Route path="/database" component={Database} />
        <Route path="/ground-handlers" component={GroundHandlers} />
        <Route path="/awb-prefixes" component={AwbPrefixes} />
        <Route path="/requests" component={Requests} />
        <Route path="/sync" component={SyncData} />
        <Route path="/audit" component={AuditLogs} />
        <Route path="/" component={AirPublic} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRouter />
        </WouterRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--t-bg3)",
              border: "1px solid var(--t-border)",
              color: "var(--t-text)",
              fontFamily: "Manrope, sans-serif",
            }
          }}
        />
        <Watermark />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
