import { useEffect, useState } from "react";
import PlatformHeader from "./components/layout/PlatformHeader";
import HeroSection3D from "./components/layout/HeroSection3D";
import ProblemOverview from "./components/layout/ProblemOverview";
import DetectorTab from "./components/sandbox/DetectorTab";
import ExtensionSimulator from "./components/simulator/ExtensionSimulator";
import AuthModal from "./components/layout/AuthModal";
import { Shield, Sparkles, AlertCircle, Mail, Twitter, Github, Linkedin } from "lucide-react";

export default function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("truthshield_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isLoggedIn = !!currentUser;

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("truthshield_current_user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("truthshield_current_user");
        localStorage.removeItem("truthshield_token");
      }
    } catch (e) {
      console.log("Failed to sync current user state:", e);
    }
  }, [currentUser]);

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
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen text-[#0F172A] font-sans antialiased selection:bg-brand-accent/20 selection:text-brand-primary relative overflow-hidden bg-transparent">
      
      {/* Global Ambient Glow Orbs */}
      <div className="glowing-orb bg-brand-accent/5 w-[500px] h-[500px] top-[5%] -left-[10%] -z-10" />
      <div className="glowing-orb bg-brand-gold/5 w-[600px] h-[600px] top-[40%] -right-[15%] -z-10" />
      <div className="glowing-orb bg-brand-accent/3 w-[450px] h-[450px] bottom-[5%] left-[20%] -z-10" />

      {/* Real-time Global rumor Check Ticker */}
      <div className="ticker-wrap text-[10px] font-mono font-bold uppercase tracking-wider text-brand-accent border-b border-slate-200 bg-white">
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
      <PlatformHeader 
        onOpenAuth={() => setIsAuthOpen(true)} 
        isLoggedIn={isLoggedIn}
        onLogout={() => setCurrentUser(null)}
      />

      {/* Main Body Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative z-10">
        
        {/* Interactive 3D Cybernetic Avatar Hero Section (Landing Page Only) */}
        {!isLoggedIn && (
          <div className="scroll-reveal">
            <HeroSection3D isLoggedIn={isLoggedIn} onOpenAuth={() => setIsAuthOpen(true)} />
          </div>
        )}

        {/* 2. Urgent Threat Landscape Overview (Why TruthShield is required) */}
        <div className="scroll-reveal">
          <ProblemOverview />
        </div>

        {isLoggedIn && (
          <>
            {/* Section divider with premium typography */}
            <div id="diagnostics-sandbox-panel" className="border-t border-slate-200 pt-8 scroll-reveal">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-brand-accent">Command Control</span>
                  <h2 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight mt-1">
                    Deep Analysis Sandbox Center
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Run forensic convolutional filters on source photographs, verify conversational timelines, or query real-time Google Grounding indices.
                  </p>
                </div>
                
                {/* API Warning Tip */}
                <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full text-[10px] text-slate-800 border border-slate-200 font-bold font-mono uppercase tracking-tight w-max shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-brand-accent shrink-0 animate-pulse" />
                  <span>Full-stack live search is active</span>
                </div>
              </div>
              
              {/* 3. Core Scanning Workspace */}
              <DetectorTab currentUser={currentUser} setCurrentUser={setCurrentUser} />
            </div>

            {/* Section divider for second key capability */}
            <div id="extension-simulator-panel" className="border-t border-slate-200 pt-10 scroll-reveal">
              <div className="mb-6">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-brand-accent">Interactive Companion</span>
                <h2 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight mt-1">
                  Active Browsing Chrome Extension
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Experience the second surface of the TruthShield ecosystem. Interact with our live mockup to see how text context selections are analyzed.
                </p>
              </div>

              {/* 4. Chrome Extension Mockup Workspace */}
              <ExtensionSimulator />
            </div>
          </>
        )}

        {/* Platform Technical specifications & FAQ section */}
        <div className="border-t border-slate-200 pt-10 grid grid-cols-1 md:grid-cols-3 gap-6 scroll-reveal">
          <div className="p-5 glass-panel border border-slate-200 bg-white flex flex-col justify-between shadow-sm">
            <div>
              <div className="bg-indigo-50 rounded-lg p-2 w-max text-indigo-600 mb-3 border border-indigo-200/50">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider mb-2">Visual GAN Forensic Filters</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Our vision pipeline tests for sub-pixel boundary blur, specular reflection misalignment in visual lenses, and facial edge micro-tearing indicators produced by Diffusion architectures.
              </p>
            </div>
          </div>

          <div className="p-5 glass-panel border border-slate-200 bg-white flex flex-col justify-between shadow-sm">
            <div>
              <div className="bg-brand-accent/5 rounded-lg p-2 w-max text-brand-accent mb-3 border border-brand-accent/25">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider mb-2">Temporal Waveform Alignment</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Deepfake videos often exhibit microsecond misalignments between physical mouth envelopes and corresponding spoken phonemes. Our suite charts this in real-time.
              </p>
            </div>
          </div>

          <div className="p-5 glass-panel border border-slate-200 bg-white flex flex-col justify-between shadow-sm">
            <div>
              <div className="bg-indigo-50 rounded-lg p-2 w-max text-indigo-600 mb-3 border border-indigo-200/50">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider mb-2">Google Grounding Integration</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Fact audits bypass outdated static models by querying active Google Search APIs directly to retrieve credible publications and formal fact-checking databases on-the-fly.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Detailed Corporate Footer (Slate-900 / white text) */}
      <footer id="truthshield-footer" className="bg-slate-900 text-slate-200 border-t border-slate-800 pt-16 pb-12 px-6 sm:px-12 mt-24 relative overflow-hidden">
        {/* Background micro grid */}
        <div className="absolute inset-0 opacity-[0.015] bg-[linear-gradient(to_right,#FAF8F5_1px,transparent_1px),linear-gradient(to_bottom,#FAF8F5_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-12 relative z-10">
          
          {/* Logo & About */}
          <div className="col-span-1 md:col-span-4 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-sans font-bold tracking-wide">TruthShield</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-sans">
              Combatting artificial disinformation, coordinate deepfake campaigns, and automated phishing hoaxes worldwide. Built with safety biometrics and neural grounding verification.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Mail className="w-4 h-4 text-brand-accent" />
              <a href="mailto:contact@truthshield.io" className="text-xs text-slate-200 hover:text-brand-accent hover:underline font-semibold font-mono">
                contact@truthshield.io
              </a>
            </div>
          </div>

          {/* Features Links */}
          <div className="col-span-1 md:col-span-2 space-y-3 text-left">
            <h4 className="text-[11px] font-mono font-bold tracking-widest text-indigo-400 uppercase">Capabilities</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#diagnostics-sandbox-panel" className="hover:text-white transition-colors">Forensic Sandbox</a></li>
              <li><a href="#extension-simulator-panel" className="hover:text-white transition-colors">Browsing Companion</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Specular Analysis</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Speech Timelines</a></li>
            </ul>
          </div>

          {/* Corporate Links */}
          <div className="col-span-1 md:col-span-2 space-y-3 text-left">
            <h4 className="text-[11px] font-mono font-bold tracking-widest text-indigo-400 uppercase">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Security Hub</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">System Audits</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Research Reports</a></li>
            </ul>
          </div>

          {/* Legal / Policy Links */}
          <div className="col-span-1 md:col-span-2 space-y-3 text-left">
            <h4 className="text-[11px] font-mono font-bold tracking-widest text-indigo-400 uppercase">Legal</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">AI Safety Stance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Compliance Board</a></li>
            </ul>
          </div>

          {/* Socials & Status */}
          <div className="col-span-1 md:col-span-2 space-y-3 text-left">
            <h4 className="text-[11px] font-mono font-bold tracking-widest text-indigo-400 uppercase">Follow Us</h4>
            <div className="flex gap-3 pt-1">
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-brand-accent transition-all text-white"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-brand-accent transition-all text-white"><Github className="w-4 h-4" /></a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-brand-accent transition-all text-white"><Linkedin className="w-4 h-4" /></a>
            </div>
            <div className="text-[10px] text-slate-500 font-mono pt-2 space-y-0.5">
              <p>Node Ingress: 3000 Ingress</p>
              <p>Status: Active Defense Stance</p>
            </div>
          </div>

        </div>

        {/* Footer bottom divider and legal copy */}
        <div className="max-w-7xl mx-auto border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-[11px] text-slate-500">
          <p>© 2026 TruthShield Sentinel Systems Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Legal Notice</a>
            <span>•</span>
            <a href="#" className="hover:underline">System Status</a>
          </div>
        </div>
      </footer>

      {/* Login / Sign Up Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLoginSuccess={(user: any) => setCurrentUser(user)} 
      />
    </div>
  );
}
