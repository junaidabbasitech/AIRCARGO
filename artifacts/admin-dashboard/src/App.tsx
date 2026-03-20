import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Lock, Plane, Shield } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Watermark } from "@/components/Watermark";
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

const CORRECT_PASSWORD = "332";
const AUTH_KEY = "aviacbp_auth";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } }
});

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (pwd === CORRECT_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onSuccess();
    } else {
      setError("Incorrect access code. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPwd("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[hsl(222,55%,9%)] to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      <Watermark />

      {/* Glow blobs */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-500/6 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-orange-500/5 blur-[80px] pointer-events-none" />

      <div className={`relative w-full max-w-sm ${shake ? "animate-bounce" : ""}`}>
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo area */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-sky-500/20 blur-xl" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 flex items-center justify-center shadow-xl shadow-sky-500/30">
                <Lock className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <div className="font-display text-xl font-black tracking-widest mb-1">
                <span className="text-sky-300">AVIA</span><span className="text-orange-400">CBP</span>
              </div>
              <h2 className="font-display text-sm text-white tracking-widest uppercase">Command Center</h2>
              <p className="text-xs text-slate-500 mt-1.5 font-sans normal-case tracking-normal">Enter your access code to continue</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              <input
                type="password"
                value={pwd}
                onChange={e => { setPwd(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && attempt()}
                placeholder="• • • • • •"
                autoFocus
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/8 border border-white/12 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:bg-white/10 text-center text-xl tracking-[0.5em] font-mono transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs text-red-400 font-semibold">{error}</p>
              </div>
            )}

            <button
              onClick={attempt}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-sm hover:from-sky-400 hover:to-blue-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-sky-500/25 uppercase tracking-widest"
            >
              Unlock Access
            </button>

            <div className="text-center pt-1">
              <a
                href="/air"
                className="text-xs text-slate-600 hover:text-sky-400 transition-colors font-medium"
              >
                ← Return to AIR Search (public)
              </a>
            </div>
          </div>
        </div>

        {/* Footer brand */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Plane className="h-3.5 w-3.5 text-slate-700" />
          <span className="text-[10px] text-slate-700 font-mono tracking-widest uppercase">Aviation CBP Registry System</span>
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  const [location, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === "1"
  );

  const isProtected = location !== "/air" && !location.startsWith("/air");

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    navigate("/air");
  };

  // Redirect to /air if accessing root unauthenticated
  useEffect(() => {
    if (location === "/" && !isAuthenticated) navigate("/air");
  }, [location, isAuthenticated]);

  // Show password gate for protected routes
  if (isProtected && !isAuthenticated) {
    return (
      <PasswordGate onSuccess={() => {
        setIsAuthenticated(true);
        navigate("/cmd");
      }} />
    );
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
        <Route path="/ground-handlers" component={GroundHandlers} />
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
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppRouter />
      </WouterRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "hsl(222 55% 11%)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "hsl(210 30% 90%)",
            fontFamily: "Manrope, sans-serif",
          }
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
