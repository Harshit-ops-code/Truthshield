import React, { useState, useEffect } from "react";
import {
  User, LogIn, UserPlus, LogOut, ShieldCheck, Trophy, Globe, Plus,
  Trash2, Check, Ban, AlertTriangle, Mail, Key
} from "lucide-react";

interface UserProfile {
  username: string;
  email: string;
  reputation: number;
  badge: string;
  favorites: string[];
  blocked: string[];
}

interface SecurityHubProps {
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export default function SecurityHub({ currentUser, onLoginSuccess, onLogout }: SecurityHubProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Domain Manager states
  const [domainInput, setDomainInput] = useState("");
  const [domainType, setDomainType] = useState<"favorite" | "blocked">("favorite");
  const [domainList, setDomainList] = useState<{ favorites: string[]; blocked: string[] }>({ favorites: [], blocked: [] });

  // Load domain list when current user is active
  useEffect(() => {
    if (currentUser) {
      fetchDomains();
    }
  }, [currentUser]);

  const fetchDomains = async () => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem("truthshield_token");
      const res = await fetch(`/api/domains/${currentUser.username}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDomainList(data);
      }
    } catch (e) {
      console.error("Failed to load domains:", e);
    }
  };

  const clearInputs = () => {
    setUsernameInput("");
    setPasswordInput("");
    setEmailInput("");
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!usernameInput || !passwordInput) {
      setErrorMessage("Please fill in all layout credentials.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed.");
      } else {
        if (data.token) {
          localStorage.setItem("truthshield_token", data.token);
        }
        onLoginSuccess(data.user);
        setSuccessMessage(`Welcome back, ${data.user.username}!`);
        setTimeout(() => setSuccessMessage(null), 3000);
        clearInputs();
      }
    } catch (err) {
      setErrorMessage("Unable to connect to login service.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!usernameInput || !passwordInput || !emailInput) {
      setErrorMessage("All signup fields are required.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
          email: emailInput
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Registration failed.");
      } else {
        if (data.token) {
          localStorage.setItem("truthshield_token", data.token);
        }
        onLoginSuccess(data.user);
        setSuccessMessage(`Account created! Welcome ${data.user.username}`);
        setTimeout(() => setSuccessMessage(null), 3500);
        clearInputs();
        setIsRegistering(false);
      }
    } catch (err) {
      setErrorMessage("Unable to complete account registration.");
    }
  };

  const handleToggleDomain = async (domainToToggle: string, typeToToggle: "favorite" | "blocked") => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem("truthshield_token");
      const res = await fetch("/api/domains/toggle", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          domain: domainToToggle,
          type: typeToToggle
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDomainList(data);
        const updatedUser = { ...currentUser, favorites: data.favorites, blocked: data.blocked };
        onLoginSuccess(updatedUser);
      }
    } catch (e) {
      console.error("Failed to toggle domain target:", e);
    }
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput || !currentUser) return;
    
    const clean = domainInput.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
    if (clean.length < 3 || !clean.includes(".")) {
      setErrorMessage("Please specify a valid domain structure (e.g. newsoutlet.com)");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    handleToggleDomain(clean, domainType);
    setDomainInput("");
  };

  return (
    <div className="space-y-5 text-left">
      {/* Messages */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-1.5 font-sans leading-normal">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-1.5 font-sans leading-normal">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 animate-bounce" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ANONYMOUS STATE */}
      {!currentUser ? (
        <div className="bg-slate-950/40 rounded-2xl border border-emerald-500/10 p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              {isRegistering ? "Register Account" : "Secure Authentication"}
            </span>
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setErrorMessage(null); }}
              className="text-[10px] text-emerald-600 font-bold uppercase hover:underline"
            >
              {isRegistering ? "Sign In Instead" : "Create Account"}
            </button>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. truthshield_dev"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-white"
                />
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="********"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-2 rounded-xl text-xs font-semibold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-4"
            >
              {isRegistering ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
              <span>{isRegistering ? "Set Up Sentinel Account" : "Access Credentials Console"}</span>
            </button>
          </form>

          {/* Quick Demo Preloads */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">Interactive Guest Preloads</span>
            <div className="flex gap-2 justify-center mt-2">
              <button 
                onClick={() => { setUsernameInput("harshit_sentinel"); setPasswordInput("password"); }}
                className="px-2 py-1 bg-slate-900/85 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 text-[10px] font-semibold rounded-lg transition-colors border border-slate-800"
              >
                harshit_sentinel
              </button>
              <button 
                onClick={() => { setUsernameInput("hoax_buster_99"); setPasswordInput("buster"); }}
                className="px-2 py-1 bg-slate-900/85 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 text-[10px] font-semibold rounded-lg transition-colors border border-slate-800"
              >
                hoax_buster_99
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* AUTHENTICATED STATE */
        <div className="space-y-4">
          {/* User Profile Card */}
          <div className="bg-slate-950/40 border border-emerald-500/10 rounded-2xl p-[18px]">
            <div className="flex items-start gap-3 justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-display text-sm">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 truncate max-w-[140px]">
                    @{currentUser.username}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">{currentUser.email}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign out of system"
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Reputation Badge */}
            <div className="bg-[#0c1020] border border-emerald-500/20 p-3 rounded-xl mt-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500 font-mono text-[10px]">REPUTATION STATUS</span>
                <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] bold uppercase tracking-wider">{currentUser.badge}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-300">
                    <span>Forensic Score Points</span>
                    <span className="font-bold font-mono text-emerald-400">{currentUser.reputation} XP</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1 border border-slate-800">
                    <div 
                      className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (currentUser.reputation / 350) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Domains Filters List */}
          <div className="bg-slate-950/40 border border-emerald-500/10 rounded-2xl p-[18px] space-y-4 shadow-2xs">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" /> Source Domain Filters
              </h4>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-mono font-bold text-slate-500 border border-slate-200 uppercase">Rules</span>
            </div>

            <form onSubmit={handleAddDomain} className="space-y-2.5">
              <div className="flex gap-1.5 text-xs">
                <input
                  type="text"
                  required
                  placeholder="e.g. spoofnews.cc"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none text-white"
                />
                
                <select
                  value={domainType}
                  onChange={(e) => setDomainType(e.target.value as "favorite" | "blocked")}
                  className="bg-slate-900/80 border border-slate-800 px-2 rounded-xl text-xs text-slate-300 focus:outline-none"
                >
                  <option value="favorite font-medium">Favorite</option>
                  <option value="blocked font-medium">Block</option>
                </select>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-sans leading-tight">
                Adding domains as favorites increases credibility reports, and blocking flags them inside sandbox diagnostics instantly.
              </p>
            </form>

            <div className="space-y-2 mt-2">
              {domainList.favorites.length === 0 && domainList.blocked.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-[10px] text-slate-400">
                  No active domain preference rules.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {domainList.favorites.map((dom) => (
                    <div key={dom} className="flex justify-between items-center bg-emerald-50/40 border border-emerald-100 p-2 rounded-xl text-xs">
                      <div className="flex items-center gap-2 truncate text-slate-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{dom}</span>
                      </div>
                      <div className="flex items-center gap-1.5 scale-90">
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Favored</span>
                        <button 
                          onClick={() => handleToggleDomain(dom, "favorite")}
                          className="text-slate-400 hover:text-rose-500 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {domainList.blocked.map((dom) => (
                    <div key={dom} className="flex justify-between items-center bg-rose-50/40 border border-rose-100 p-2 rounded-xl text-xs">
                      <div className="flex items-center gap-2 truncate text-slate-700 font-medium">
                        <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{dom}</span>
                      </div>
                      <div className="flex items-center gap-1.5 scale-90">
                        <span className="text-[8px] bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Blocked</span>
                        <button 
                          onClick={() => handleToggleDomain(dom, "blocked")}
                          className="text-slate-400 hover:text-rose-500 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
