import { Video, Image, FileText, Share2, ShieldAlert, ArrowRight } from "lucide-react";

export default function ProblemOverview() {
  const problems = [
    {
      id: "prob-deepfake",
      icon: <Video className="w-5 h-5 text-rose-600" />,
      label: "Deepfake Videos",
      problem: "Synthetic Statements",
      impact: "Political instability, character defamation, public trust erosion.",
      color: "border-rose-100 bg-rose-50/30"
    },
    {
      id: "prob-images",
      icon: <Image className="w-5 h-5 text-amber-600" />,
      label: "Synthesized AI Images",
      problem: "Fabricated Visuals",
      impact: "Viral fake evidence, digital manipulation, legal disputes.",
      color: "border-amber-100 bg-amber-50/30"
    },
    {
      id: "prob-text",
      icon: <FileText className="w-5 h-5 text-emerald-600" />,
      label: "AI-Written Articles",
      problem: "Automated Propaganda",
      impact: "Erosion of authentic journalism, mass machine-generated blogs.",
      color: "border-emerald-100 bg-emerald-50/30"
    },
    {
      id: "prob-forwards",
      icon: <Share2 className="w-5 h-5 text-cyan-600" />,
      label: "Viral Shared Hoaxes",
      problem: "Coordinate Rumours",
      impact: "Severe panic campaigns, coordinate disinformation, social tensions.",
      color: "border-cyan-100 bg-cyan-50/30"
    }
  ];

  return (
    <div id="truthshield-problem-overview" className="glass-panel neon-border-hover p-6 sm:p-8 relative overflow-hidden my-6">
      {/* Decorative Grid Accent */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="relative z-10 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-emerald-500/10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-mono font-bold rounded-full uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" /> Threat Landscape 2026
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-medium tracking-tight mt-3 text-white">
              The Escalating War on Truth
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
              Algorithmic synthetic media is weaponized at scale. TruthShield provides real-time digital forensic sandboxes to verify media integrity.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono text-slate-600 bg-emerald-50/50 border border-emerald-500/15 p-3 rounded-2xl">
            <div>
              <p className="text-slate-800 font-bold text-sm">94% +</p>
              <p className="text-[10px] text-slate-400">AI Surge Year</p>
            </div>
            <div className="h-6 w-px bg-emerald-500/10" />
            <div>
              <p className="text-emerald-600 font-bold text-sm">4.5M+</p>
              <p className="text-[10px] text-slate-400">Audited Nodes</p>
            </div>
          </div>
        </div>

        {/* Diagnostic Problem Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {problems.map((prob) => (
            <div
              key={prob.id}
              id={prob.id}
              className="p-5 rounded-2xl bg-white/85 border border-emerald-500/10 hover:border-emerald-500/35 hover:shadow-md transition-all duration-300 flex flex-col justify-between group shadow-3xs"
            >
              <div>
                <div className="p-2 w-max rounded-xl bg-slate-50 border border-slate-100 mb-4 group-hover:scale-105 transition-transform duration-200">
                  {prob.icon}
                </div>
                <h3 className="text-sm font-display font-semibold text-slate-800">
                  {prob.label}
                </h3>
                <p className="text-[10px] text-emerald-600 font-mono font-bold mt-0.5 uppercase tracking-wider">
                  {prob.problem}
                </p>
                <p className="text-xs text-slate-650 mt-2.5 leading-relaxed font-sans">
                  {prob.impact}
                </p>
              </div>
              
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold font-mono mt-4 pt-4 border-t border-slate-100 opacity-80 group-hover:opacity-100 transition-all cursor-pointer">
                <span>Configure sandbox</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
