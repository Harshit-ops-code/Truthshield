import { Video, Image, FileText, Share2, ShieldAlert, ArrowRight } from "lucide-react";

export default function ProblemOverview() {
  const problems = [
    {
      id: "prob-deepfake",
      icon: <Video className="w-5 h-5 text-brand-accent" />,
      label: "Deepfake Videos",
      problem: "Synthetic Statements",
      impact: "Political instability, character defamation, public trust erosion.",
      color: "border-brand-accent/20 bg-brand-accent/5"
    },
    {
      id: "prob-images",
      icon: <Image className="w-5 h-5 text-brand-gold" />,
      label: "Synthesized AI Images",
      problem: "Fabricated Visuals",
      impact: "Viral fake evidence, digital manipulation, legal disputes.",
      color: "border-brand-gold/25 bg-brand-gold/5"
    },
    {
      id: "prob-text",
      icon: <FileText className="w-5 h-5 text-brand-accent" />,
      label: "AI-Written Articles",
      problem: "Automated Propaganda",
      impact: "Erosion of authentic journalism, mass machine-generated blogs.",
      color: "border-brand-accent/20 bg-brand-accent/5"
    },
    {
      id: "prob-forwards",
      icon: <Share2 className="w-5 h-5 text-brand-gold" />,
      label: "Viral Shared Hoaxes",
      problem: "Coordinate Rumours",
      impact: "Severe panic campaigns, coordinate disinformation, social tensions.",
      color: "border-brand-gold/25 bg-brand-gold/5"
    }
  ];

  return (
    <div id="truthshield-problem-overview" className="py-10 border-t border-slate-200 relative">
      
      <div className="relative z-10 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200/50 text-indigo-600 text-xs font-mono font-bold rounded-full uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" /> Threat Landscape 2026
            </span>
            <h2 className="text-2xl sm:text-3xl font-sans font-extrabold tracking-tight mt-3 text-slate-900">
              The Escalating War on Truth
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-sans leading-relaxed">
              Algorithmic synthetic media is weaponized at scale. TruthShield provides real-time digital forensic sandboxes to verify media integrity.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
            <div>
              <p className="text-slate-900 font-bold text-sm">94% +</p>
              <p className="text-[10px] text-slate-500">AI Surge Year</p>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <p className="text-brand-accent font-bold text-sm">4.5M+</p>
              <p className="text-[10px] text-slate-500">Audited Nodes</p>
            </div>
          </div>
        </div>

        {/* Diagnostic Problem Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {problems.map((prob) => (
            <div
              key={prob.id}
              id={prob.id}
              className="p-5 rounded-2xl bg-white/70 border border-slate-200 hover:border-brand-accent/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group shadow-sm hover:-translate-y-0.5"
            >
              <div>
                <div className={`p-2.5 w-max rounded-xl border mb-4 group-hover:scale-105 transition-transform duration-200 ${prob.color}`}>
                  {prob.icon}
                </div>
                <h3 className="text-sm font-sans font-bold text-slate-900">
                  {prob.label}
                </h3>
                <p className="text-[10px] text-brand-gold font-mono font-bold mt-0.5 uppercase tracking-wider">
                  {prob.problem}
                </p>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-sans">
                  {prob.impact}
                </p>
              </div>
              
              <div className="flex items-center gap-1.5 text-[10px] text-brand-accent font-bold font-mono mt-4 pt-4 border-t border-slate-100 opacity-80 group-hover:opacity-100 transition-all cursor-pointer">
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
