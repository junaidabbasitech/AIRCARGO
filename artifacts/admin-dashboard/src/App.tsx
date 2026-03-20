import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Lock } from "lucide-react";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Airlines from "@/pages/Airlines";
import Airports from "@/pages/Airports";
import GroundHandlers from "@/pages/GroundHandlers";
import SyncData from "@/pages/SyncData";
import AuditLogs from "@/pages/AuditLogs";
import AirPublic from "@/pages/AirPublic";

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
      setError("Incorrect password. Access denied.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPwd("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center px-4">
      <div className={`bg-white rounded-2xl shadow-xl border border-sky-200 p-8 w-full max-w-sm ${shake ? "animate-bounce" : ""}`}>
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="h-14 w-14 rounded-2xl bg-sky-100 border-2 border-sky-300 flex items-center justify-center">
            <Lock className="h-7 w-7 text-sky-600" />
          </div>
          <div className="text-center">
            <h2 className="font-display text-lg text-slate-800 tracking-widest uppercase">Command Center</h2>
            <p className="text-sm text-slate-500 mt-1 font-sans normal-case tracking-normal">Enter your admin password to continue</p>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && attempt()}
            placeholder="Password"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border-2 border-sky-200 bg-sky-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-center text-xl tracking-[0.4em] font-mono transition-all"
          />
          {error && (
            <p className="text-xs text-red-500 text-center font-semibold">{error}</p>
          )}
          <button
            onClick={attempt}
            className="w-full py-3 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 active:scale-95 transition-all duration-150 shadow-md hover:shadow-sky-300/50 uppercase tracking-wider"
          >
            Unlock
          </button>
          <a
            href="/air"
            className="block text-center text-xs text-slate-400 hover:text-orange-500 transition-colors mt-2"
          >
            Go to AIR Search (public) →
          </a>
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
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(210 25% 88%)",
            color: "hsl(215 40% 15%)",
            fontFamily: "Manrope, sans-serif",
          }
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
