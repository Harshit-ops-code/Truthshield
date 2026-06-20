import { useEffect, useState } from "react";
import { Shield, Activity, Wifi } from "lucide-react";

interface PlatformHeaderProps {
  onOpenAuth: () => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

interface StatusData {
  status: string;
  hasApiKey: boolean;
  engine: string;
}

export default function PlatformHeader({ onOpenAuth, isLoggedIn, onLogout }: PlatformHeaderProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [usersOnline, setUsersOnline] = useState(14);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((e) => console.log("Failed to load backend status:", e));

    const interval = setInterval(() => {
      setUsersOnline((prev) => Math.max(8, Math.min(25, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header id="truthshield-header" className="h-max min-h-[68px] px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 py-3 sm:py-0 shadow-sm">
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          {/* Logo with Cyber Blue Shield Accent */}
          <div className="w-9 h-9 bg-brand-accent rounded-xl flex items-center justify-center shadow-md shadow-brand-accent/15 border border-brand-accent/10">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">TruthShield</span>
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-indigo-50 text-indigo-600 border border-indigo-200/50">
              v1.5
            </span>
          </div>
        </div>
        
        {/* Mobile status indicator */}
        <div className="md:hidden flex items-center gap-1.5">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75 bg-brand-accent"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
          </span>
        </div>
      </div>

      {/* Nav Link Indicators & Sign In Button */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-[13px] font-medium text-slate-600 mt-2 md:mt-0">
        <a href="#truthshield-hero-3d" className="hover:text-slate-900 transition-colors py-2">
          Home
        </a>
        <a href="#truthshield-problem-overview" className="hover:text-slate-900 transition-colors py-2">
          Threats
        </a>
        <a href="#diagnostics-sandbox-panel" className="hover:text-slate-900 transition-colors py-2 font-bold text-brand-accent">
          Forensic Sandbox
        </a>
        <a href="#extension-simulator-panel" className="hover:text-slate-900 transition-colors py-2">
          Extension
        </a>
        <a href="#truthshield-footer" className="hover:text-slate-900 transition-colors py-2">
          Contact
        </a>
        
        <span className="text-slate-200 hidden sm:inline">|</span>
        
        {/* Real-time Status and System State */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-500 font-mono">
            <Activity className="w-3.5 h-3.5 text-brand-gold shrink-0" />
            <span>{usersOnline} agents online</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-brand-accent/5 border border-brand-accent/15 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-brand-accent"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-accent"></span>
            </span>
            <span className="text-slate-800 font-bold uppercase tracking-tight flex items-center gap-0.5">
              <Wifi className="w-3.5 h-3.5 text-brand-accent" />
              {status ? (status.hasApiKey ? "Grounding" : "Simulated") : "Offline"}
            </span>
          </div>
        </div>

        {/* Auth CTA Button */}
        {isLoggedIn ? (
          <button
            onClick={onLogout}
            className="ml-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs tracking-wide transition-all duration-200 cursor-pointer shadow-sm shadow-red-600/10 hover:scale-102 active:scale-98"
          >
            Sign Out
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="ml-2 px-4 py-1.5 bg-brand-accent hover:bg-blue-700 text-white font-semibold rounded-lg text-xs tracking-wide transition-all duration-200 cursor-pointer shadow-sm shadow-brand-accent/10 hover:scale-102 active:scale-98"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
