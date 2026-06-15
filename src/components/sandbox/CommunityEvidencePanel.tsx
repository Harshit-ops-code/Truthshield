import React, { useState, useEffect } from "react";
import {
  ThumbsUp, ThumbsDown, MessageSquare, Plus,
  ShieldCheck, HelpCircle, AlertTriangle, ExternalLink
} from "lucide-react";

interface EvidenceItem {
  id: string;
  contentId: string;
  user: string;
  userReputation: number;
  userBadge: string;
  type: "support" | "refute";
  statement: string;
  linkUrl?: string;
  timestamp: string;
  votes: number;
  votedBy: { [username: string]: "up" | "down" };
}

interface CommunityEvidencePanelProps {
  contentId: string;
  currentUser: any;
  onReputationChange?: (newUserObj: any) => void;
}

export default function CommunityEvidencePanel({ contentId, currentUser, onReputationChange }: CommunityEvidencePanelProps) {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newStatement, setNewStatement] = useState("");
  const [newType, setNewType] = useState<"support" | "refute">("refute");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load evidence whenever active contentId changes
  useEffect(() => {
    if (contentId) {
      loadEvidence();
    }
  }, [contentId]);

  const loadEvidence = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const normalizedId = encodeURIComponent(contentId);
      const res = await fetch(`/api/evidence/${normalizedId}`);
      if (res.ok) {
        const data = await res.json();
        setEvidenceList(data);
      }
    } catch (e) {
      console.error("Failed to fetch community evidence logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (evidenceId: string, value: "up" | "down") => {
    if (!currentUser) {
      setErrorMsg("Please register or log in in the Security Hub to cast your community vote!");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    try {
      const res = await fetch("/api/evidence/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidenceId,
          username: currentUser.username,
          value
        })
      });

      if (res.ok) {
        const updatedList = await res.json();
        setEvidenceList(updatedList);
        refreshVoterProfile();
      }
    } catch (e) {
      console.error("Failed to cast vote:", e);
    }
  };

  const refreshVoterProfile = async () => {
    if (!currentUser || !onReputationChange) return;
    try {
      const res = await fetch(`/api/auth/profile/${currentUser.username}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          onReputationChange(data.user);
        }
      }
    } catch (e) {
      console.log("No profile update returned.", e);
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentUser) {
      setErrorMsg("Authentication required. Please access the profile tab to log in!");
      return;
    }

    if (newStatement.trim().length < 15) {
      setErrorMsg("Please write a detailed explanation statement (min 15 characters).");
      return;
    }

    try {
      const res = await fetch("/api/evidence/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          username: currentUser.username,
          statement: newStatement,
          type: newType,
          linkUrl: newLinkUrl
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to publish evidence.");
      } else {
        const updatedList = await res.json();
        setEvidenceList(updatedList);
        setNewStatement("");
        setNewLinkUrl("");
        setSuccessMsg("Community evidence filed! +10 Reputation points earned.");
        setTimeout(() => setSuccessMsg(null), 4000);
        refreshVoterProfile();
      }
    } catch (err) {
      setErrorMsg("Failed to communicate with community database.");
    }
  };

  const refutingCount = evidenceList.filter(e => e.type === "refute").length;
  const supportingCount = evidenceList.filter(e => e.type === "support").length;

  return (
    <div className="mt-6 border-t border-emerald-500/10 pt-5 space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 p-4 rounded-2xl border border-emerald-500/10">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold uppercase tracking-wider font-mono">
            <MessageSquare className="w-3.5 h-3.5" /> Community Forensic Bulletin
          </div>
          <h4 className="text-xs font-semibold text-slate-800 font-sans mt-1">
            Verification logs filed for: <span className="font-mono text-emerald-700">"{contentId}"</span>
          </h4>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono font-bold">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-700">{supportingCount} Authen.</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-rose-700">{refutingCount} Manip.</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-1.5 leading-normal">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-1.5 leading-normal">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-3">
        {evidenceList.length === 0 ? (
          <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
            No community evidence has been filed yet for this resource. Be the first to file evidence!
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {evidenceList.map((ev) => {
              const myVote = currentUser ? ev.votedBy[currentUser.username] : null;
              return (
                <div 
                  key={ev.id} 
                  className={`p-3.5 rounded-2xl border transition-all text-xs flex gap-3 ${
                    ev.type === "refute" 
                      ? "bg-rose-50/20 border-rose-100 hover:border-rose-250" 
                      : "bg-emerald-50/20 border-emerald-100 hover:border-emerald-250"
                  }`}
                >
                  <div className="flex flex-col justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 min-w-[70px] text-center shrink-0">
                    <div>
                      <span className={`inline-block px-1.5 py-0.5 tracking-tighter uppercase font-mono text-[8px] font-bold rounded ${
                        ev.type === "refute"
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {ev.type === "refute" ? "MANIPULATED" : "AUTHENTIC"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 text-[10px] font-mono">
                      <button 
                        onClick={() => handleVote(ev.id, "up")}
                        title="Upvote evidence"
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          myVote === "up" 
                            ? "bg-emerald-600 text-white" 
                            : "bg-slate-950/40 hover:bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      
                      <span className={`font-bold ${ev.votes > 0 ? "text-emerald-400" : (ev.votes < 0 ? "text-rose-450" : "text-slate-550")}`}>
                        {ev.votes}
                      </span>

                      <button 
                        onClick={() => handleVote(ev.id, "down")}
                        title="Downvote evidence"
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          myVote === "down" 
                            ? "bg-rose-600 text-white" 
                            : "bg-slate-950/40 hover:bg-slate-900 text-slate-400 hover:text-rose-400"
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-slate-700 font-sans leading-relaxed break-words font-medium">
                        "{ev.statement}"
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px]">
                      <div className="flex items-center gap-1 flex-wrap text-slate-400">
                        <span className="font-semibold text-slate-600">@{ev.user}</span>
                        <span className="text-slate-300">|</span>
                        <span className="bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded italic font-bold">
                          {ev.userBadge}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="font-mono text-slate-500">{ev.userReputation} XP</span>
                      </div>

                      {ev.linkUrl && (
                        <a
                          href={ev.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-mono font-bold uppercase tracking-wide flex items-center gap-0.5 hover:underline animate-pulse"
                        >
                          Source Cit. <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {currentUser ? (
        <form onSubmit={handleSubmitEvidence} className="bg-slate-950/40 border border-emerald-500/10 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">File Verified Proof & Citation</span>
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Submitter: @{currentUser.username}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Stance</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "support" | "refute")}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none text-white text-xs"
              >
                <option value="refute">Unmasks Manipulated / Deepfaked Claim (Refute)</option>
                <option value="support">Supports Authenticity / Photographic Fact (Support)</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Source Citation link (Optional)</label>
              <input
                type="url"
                placeholder="https://credibleoutlet.com/fact-check-report"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Forensic Explanation Statement</label>
            <textarea
              required
              rows={2}
              placeholder="Detail your scientific or architectural proof (e.g., specular eye reflections, acoustic timestamps, EXIF logs, Snopes checking)..."
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-2 focus:outline-none text-white text-xs font-sans leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Submit Evidence Audit Report
          </button>
        </form>
      ) : (
        <div className="p-4 bg-slate-950/40 border border-emerald-500/10 rounded-2xl text-center flex flex-col items-center gap-2">
          <HelpCircle className="w-6 h-6 text-emerald-400" />
          <p className="text-xs font-bold text-white uppercase">WANT TO FILE CONTRIBUTING EVIDENCE?</p>
          <p className="text-[11px] text-slate-400 max-w-sm leading-normal">
            Authenticate in the sidebar Security Hub to build reputation, submit evidence, and gain verifier badges.
          </p>
        </div>
      )}
    </div>
  );
}
