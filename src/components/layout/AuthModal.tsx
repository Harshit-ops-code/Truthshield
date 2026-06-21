import React, { useState } from "react";
import { X, Check } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
    // For signup, use clean name as username; for login, email serves as username/email key
    const username = isSignUp 
      ? (fullName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || email.split("@")[0].replace(/[^a-z0-9_]/g, ""))
      : email.trim();

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          email: email.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed.");
      } else {
        if (data.token) {
          localStorage.setItem("truthshield_token", data.token);
        }
        if (onLoginSuccess) onLoginSuccess(data.user);
        onClose();
        // Reset states
        setEmail("");
        setPassword("");
        setFullName("");
      }
    } catch (err) {
      setError("Cannot connect to server database ingress.");
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0F172A]/20 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col md:flex-row z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto md:overflow-visible">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT SIDE: Reference Image styling (Slate-50 background, big headers, features checklist) */}
        <div className="w-full md:w-1/2 bg-slate-50 p-8 sm:p-12 flex flex-col justify-between border-r border-slate-200 select-none">
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl sm:text-5xl font-sans font-extrabold text-slate-900 leading-tight tracking-tight">
                Ignite Your <br />
                <span className="text-brand-accent">Confidence.</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-3 font-sans leading-relaxed">
                Fuel your research with active safety biometrics and neural groundings.
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-3 pt-4">
              {[
                "Unlimited deepfake checks",
                "Browsing context companion",
                "FAC Check/AFP grounding api",
                "Advanced metadata scanner",
                "Secure diagnostic export"
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-accent flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-slate-900 text-sm font-semibold">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Line-art Illustration matching the reference style */}
          <div className="w-full h-48 sm:h-56 mt-8 flex items-end justify-center">
            <svg 
              viewBox="0 0 400 300" 
              className="w-full h-full text-slate-800" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {/* Floor/Ground line */}
              <line x1="20" y1="280" x2="380" y2="280" strokeDasharray="4 4" opacity="0.6" />
              
              {/* Desk */}
              <rect x="100" y="210" width="220" height="70" rx="4" fill="#F1F5F9" />
              <line x1="100" y1="210" x2="320" y2="210" strokeWidth="3.5" />
              <rect x="255" y="220" width="50" height="60" rx="2" fill="#FFFFFF" /> {/* Cabinet */}
              <line x1="280" y1="235" x2="280" y2="245" /> {/* Draw handle */}

              {/* Laptop */}
              <line x1="170" y1="210" x2="230" y2="210" strokeWidth="4" />
              <path d="M 180 210 L 220 210 L 240 160 L 195 160 Z" fill="#ffffff" />
              <line x1="195" y1="160" x2="240" y2="160" />
              
              {/* Desk Lamp */}
              <path d="M 285 210 Q 295 170 270 145" />
              <rect x="255" y="130" width="30" height="20" rx="3" transform="rotate(-15 255 130)" fill="#ffffff" />
              <line x1="255" y1="145" x2="240" y2="165" opacity="0.3" strokeWidth="4" />

              {/* Books */}
              <rect x="245" y="185" width="35" height="25" rx="1" transform="rotate(-5 245 185)" fill="#ffffff" />
              
              {/* Chair */}
              <line x1="55" y1="230" x2="70" y2="280" />
              <line x1="85" y1="230" x2="95" y2="280" />
              <rect x="50" y="222" width="45" height="8" rx="2" fill="#F1F5F9" />
              <path d="M 55 222 L 50 170 L 68 170 L 65 222" fill="#F1F5F9" />

              {/* Character drawing */}
              <circle cx="95" cy="115" r="18" fill="#F1F5F9" />
              <path d="M 82 105 Q 85 92 98 92 Q 112 92 110 108 Q 115 105 110 115 Z" fill="#2563EB" />
              <circle cx="98" cy="114" r="5" />
              <circle cx="108" cy="114" r="5" />
              <line x1="103" y1="114" x2="105" y2="114" />
              <path d="M 104 125 Q 108 128 111 123" />
              <path d="M 90 133 L 110 133 L 115 200 L 75 200 Z" fill="#ffffff" />
              <line x1="85" y1="133" x2="72" y2="222" strokeWidth="2.5" />
              <line x1="100" y1="133" x2="92" y2="222" strokeWidth="2.5" />
              <path d="M 95 145 C 115 155, 125 155, 140 185" />
              <line x1="140" y1="185" x2="152" y2="182" />
            </svg>
          </div>
        </div>

        {/* RIGHT SIDE: Dynamic Authentication Credentials Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full space-y-8">
            <div className="text-left">
              <span className="text-xs font-mono font-bold tracking-widest text-brand-accent uppercase">
                {isSignUp ? "Create free account" : "Welcome back"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-900 mt-1">
                {isSignUp ? "Get started in seconds" : "Access truth shield"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold font-sans text-left animate-in fade-in slide-in-from-top-1 duration-200">
                  {error}
                </div>
              )}
              {isSignUp && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 text-left">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent focus:outline-none rounded-xl"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 text-left">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent focus:outline-none rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 text-left">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-brand-accent focus:border-brand-accent focus:outline-none rounded-xl"
                />
              </div>

              {!isSignUp && (
                <div className="flex justify-end">
                  <a href="#" className="text-xs text-brand-accent hover:underline font-semibold">
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Cyber Blue CTA button */}
              <button
                type="submit"
                className="w-full py-3 mt-2 bg-brand-accent hover:bg-blue-700 text-white font-bold rounded-xl text-sm tracking-wide transition-all duration-200 cursor-pointer shadow-md shadow-brand-accent/15 hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSignUp ? "Create Account" : "Get Started"}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500 font-medium">
                {isSignUp ? "Already have an account?" : "New to TruthShield?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-brand-accent hover:underline font-bold ml-1 cursor-pointer"
                >
                  {isSignUp ? "Sign In" : "Sign up for free"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
