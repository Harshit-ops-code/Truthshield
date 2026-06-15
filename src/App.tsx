import { useEffect } from "react";
import PlatformHeader from "./components/layout/PlatformHeader";
import HeroSection3D from "./components/layout/HeroSection3D";
import ProblemOverview from "./components/layout/ProblemOverview";
import DetectorTab from "./components/sandbox/DetectorTab";
import ExtensionSimulator from "./components/simulator/ExtensionSimulator";
import { Shield, Sparkles, AlertCircle } from "lucide-react";

export default function App() {
  // Setup viewport intersection observer for scroll reveal fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".scroll-reveal");
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen text-[#0F172A] font-sans antialiased selection:bg-emerald-600 selection:text-white relative overflow-hidden bg-transparent">
      
      {/* Global Ambient Glow Orbs */}
      <div className="glowing-orb bg-pink-400/8 w-[500px] h-[500px] top-[5%] -left-[10%] -z-10" />
      <div className="glowing-orb bg-cyan-300/8 w-[600px] h-[600px] top-[40%] -right-[15%] -z-10" />
      <div className="glowing-orb bg-violet-350/8 w-[450px] h-[450px] bottom-[5%] left-[20%] -z-10" />

      {/* Real-time Global rumor Check Ticker */}
      <div className="ticker-wrap text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-100/30">
        <div className="ticker-content">
          <span>• live audits: whatsapp federal grant warning → LIKELY FALSE (Fact checked by AFP)</span>
          <span>• system update: neural core calibration → secure (12ms latency)</span>
          <span>• global check: bank suspension sms alert → high scam risk (91% confidence)</span>
          <span>• network: 17 validator nodes online → stance: active defense</span>
          <span>• live audits: whatsapp federal grant warning → LIKELY FALSE (Fact checked by AFP)</span>
          <span>• system update: neural core calibration → secure (12ms latency)</span>
          <span>• global check: bank suspension sms alert → high scam risk (91% confidence)</span>
        </div>
      </div>

      {/* 1. Global Platform Brand Header */}
      <PlatformHeader />

      {/* Main Body Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative z-10">
        
        {/* Interactive 3D Cybernetic Avatar Hero Section */}
        <div className="scroll-reveal">
          <HeroSection3D />
        </div>

        {/* 2. Urgent Threat Landscape Overview (Why TruthShield is required) */}
        <div className="scroll-reveal">
          <ProblemOverview />
        </div>

        {/* Section divider with premium typography */}
        <div className="border-t border-slate-200/50 pt-8 scroll-reveal">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-600">Command Control</span>
              <h2 className="text-xl font-display font-medium text-slate-900 tracking-tight mt-1">
                Deep Analysis Sandbox Center
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Run forensic convolutional filters on source photographs, verify conversational timelines, or query real-time Google Grounding indices.
              </p>
            </div>
            
            {/* API Warning Tip */}
            <div className="flex items-center gap-2 bg-emerald-50/75 px-3.5 py-1.5 rounded-full text-[10px] text-emerald-700 border border-emerald-100/70 font-bold font-mono uppercase tracking-tight w-max">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
              <span>Full-stack live search is active</span>
            </div>
          </div>
          
          {/* 3. Core Scanning Workspace */}
          <DetectorTab />
        </div>

        {/* Section divider for second key capability */}
        <div className="border-t border-slate-200/50 pt-10 scroll-reveal">
          <div className="mb-6">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-600">Interactive Companion</span>
            <h2 className="text-xl font-display font-medium text-slate-900 tracking-tight mt-1">
              Active Browsing Chrome Extension
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Experience the second surface of the TruthShield ecosystem. Interact with our live mockup to see how text context selections are analyzed.
            </p>
          </div>

          {/* 4. Chrome Extension Mockup Workspace */}
          <ExtensionSimulator />
        </div>

        {/* Platform Technical specifications & FAQ section */}
        <div className="border-t border-slate-800 pt-10 grid grid-cols-1 md:grid-cols-3 gap-6 scroll-reveal">
          <div className="p-5 glass-panel border border-emerald-500/10 flex flex-col justify-between">
            <div>
              <div className="bg-amber-500/10 rounded-lg p-2 w-max text-amber-500 mb-3 border border-amber-500/20">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Visual GAN Forensic Filters</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Our vision pipeline tests for sub-pixel boundary blur, specular reflection misalignment in visual lenses, and facial edge micro-tearing indicators produced by Diffusion architectures.
              </p>
            </div>
          </div>

          <div className="p-5 glass-panel border border-emerald-500/10 flex flex-col justify-between">
            <div>
              <div className="bg-red-500/10 rounded-lg p-2 w-max text-red-500 mb-3 border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Temporal Waveform Alignment</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Deepfake videos often exhibit microsecond misalignments between physical mouth envelopes and corresponding spoken phonemes. Our suite charts this in real-time.
              </p>
            </div>
          </div>

          <div className="p-5 glass-panel border border-emerald-500/10 flex flex-col justify-between">
            <div>
              <div className="bg-teal-500/10 rounded-lg p-2 w-max text-teal-500 mb-3 border border-teal-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Google Grounding Integration</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Fact audits bypass outdated static models by querying active Google Search APIs directly to retrieve credible publications and formal fact-checking databases on-the-fly.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Clean minimalist light footer */}
      <footer id="truthshield-footer" className="bg-white/60 border-t border-emerald-500/15 py-8 px-6 mt-20 text-[11px] text-slate-500 font-medium h-max relative overflow-hidden backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
          <div>
            <p className="font-bold text-slate-800 text-xs">TruthShield Sentinel Systems Inc.</p>
            <p className="text-slate-500 mt-1 leading-normal font-sans">Combatting artificial disinformation, deepfakes, and coordinate phishing hoaxes worldwide.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-[10px] font-mono tracking-wider uppercase text-slate-500">
            <span>Node JS Sandbox</span>
            <span className="text-slate-300">|</span>
            <span>Port 3000 Ingress</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-600 font-bold">(c) 2026 TruthShield Suite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
