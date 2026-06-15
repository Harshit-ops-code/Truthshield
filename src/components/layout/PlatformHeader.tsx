import { useEffect, useState } from "react";
import { ShieldAlert, Activity, Wifi } from "lucide-react";

interface StatusData {
  status: string;
  hasApiKey: boolean;
  engine: string;
}

export default function PlatformHeader() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [usersOnline, setUsersOnline] = useState(14);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((e) => console.log("Failed to load backend status:", e));

    // Simulated node live counts
    const interval = setInterval(() => {
      setUsersOnline((prev) => Math.max(8, Math.min(25, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header id="truthshield-header" className="h-max min-h-[64px] px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between bg-white/75 backdrop-blur-md border-b border-emerald-100/50 sticky top-0 z-50 py-3 sm:py-0 shadow-sm">
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          {/* Logo with Emerald Shield Accent */}
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-800 font-display">TruthShield</span>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
              v1.5
            </span>
          </div>
        </div>
        
        {/* Mobile status indicator */}
        <div className="md:hidden flex items-center gap-1.5">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75 bg-emerald-400"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      </div>

      {/* Nav Link Indicators and Secondary state */}
      <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-500 mt-2 md:mt-0">
        <a href="#diagnostics-sandbox-panel" className="text-emerald-600 font-semibold border-b-2 border-emerald-600 pb-2 md:pb-4 pt-2 md:pt-4 transition-colors">
          Deep Analysis
        </a>
        <a href="#extension-simulator-panel" className="hover:text-slate-800 transition-colors">
          Browsing Companion
        </a>
        <span className="text-slate-250">|</span>
        
        {/* Real-time Status and System State */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{usersOnline} agents online</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-100/60 px-3 py-1 rounded-full text-[10px] font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-700 font-bold uppercase tracking-tight flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-600" />
              {status ? (
                status.hasApiKey ? "Live Grounding" : "Simulated Mode"
              ) : (
                "Connecting..."
              )}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
