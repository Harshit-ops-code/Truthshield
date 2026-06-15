import React, { useState, useEffect } from "react";
import { Shield, ExternalLink, ThumbsUp, AlertTriangle, Search, Eye, Info, Sparkles } from "lucide-react";
import { FactReport } from "../../types";

export default function ExtensionSimulator() {
  const [selectedArticleId, setSelectedArticleId] = useState("art-1");
  const [highlightedText, setHighlightedText] = useState("");
  const [showRightClickMenu, setShowRightClickMenu] = useState(false);
  const [rightClickPos, setRightClickPos] = useState({ x: 0, y: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customClaimInput, setCustomClaimInput] = useState("");
  
  // Extension sidebar report state
  const [extensionReport, setExtensionReport] = useState<{
    sourceName: string;
    sourceCredibility: number;
    verdict: string;
    confidence: number;
    flaggedStatements: Array<{ statement: string; fact: string; isFalse: boolean }>;
    summary: string;
    loading: boolean;
  }>({
    sourceName: "DailyTelegramBlog.net",
    sourceCredibility: 3,
    verdict: "LIKELY FALSE",
    confidence: 84,
    flaggedStatements: [
      {
        statement: "The central reserve bank has confirmed they are replacing all paper banknotes next month with dynamic federal crypto-tokens.",
        fact: "The national reserve board explicitly refuted this claim, identifying it as a spoof coordinate forward. No currency substitution exists.",
        isFalse: true
      },
      {
        statement: "Citizen accounts that do not register for dynamic tokens will face immediate freezing assets.",
        fact: "The national authority confirmed they never freeze savings via third-party digital token declarations.",
        isFalse: true
      }
    ],
    summary: "The claims disseminated by this blog match known financial phishing hoaxes currently circulating on WhatsApp networks. The primary source has a credibility rating of 3/10 due to high clickbait distribution and absent peer citations.",
    loading: false
  });

  // Predefined mock articles
  const articlesList = [
    {
      id: "art-1",
      title: "BREAKING: Reserve Board to Swap Paper Currency Next Month in Drastic Crypto Shift",
      source: "DailyTelegramBlog.net",
      credibility: 3,
      date: "June 10, 2026",
      content: "A confidential white paper leaked from the central reserve bank states that they are replacing all physical paper banknotes next month with dynamic federal crypto-tokens. Citizens are urged to transfer their savings immediately. Senior sources warn that citizen accounts that do not register for dynamic tokens will face immediate freezing assets. Experts say this is to tackle cash hoarding, but public panic is spreading as banks have reported unprecedented queues.",
      suggestions: [
        "replacing all physical paper banknotes next month with dynamic federal crypto-tokens",
        "citizen accounts that do not register for dynamic tokens will face immediate freezing assets"
      ]
    },
    {
      id: "art-2",
      title: "NASA Curiosity Rover Snaps Image of Alleged Metallic Dome Structure on Mars Boundary",
      source: "CosmicHorizonSpace.org",
      credibility: 6,
      date: "May 24, 2026",
      content: "Recent transmissions retrieved from NASA's Curiosity Rover appear to show a highly polished metallic dome structure reflecting Martian solar rays near the base of Mount Sharp. UFO researchers claim this structure could imply past industrial colonization. NASA officials commented that the anomalous visual coordinate is highly likely a result of wind-induced natural specular reflection on high-silica sandstone sheets, rather than an artificial biosphere.",
      suggestions: [
        "show a highly polished metallic dome structure reflecting Martian solar rays",
        "UFO researchers claim this structure could imply past industrial colonization"
      ]
    },
    {
      id: "art-3",
      title: "WHO Announces Complete Eradication of Seasonal Flu following Global mRNA Distribution Trial",
      source: "GlobalHealthUpdates.net",
      credibility: 4,
      date: "June 02, 2026",
      content: "Medical advisors have released a report alleging that the common influenza virus has been 100% eradicated worldwide this season. The breakthrough is credited to a secret global mRNA distribute campaign handled over the last winter. However, official regulatory bodies like the CDC maintain that while vaccination rates reduced clinical hospital burdens, the flu is far from eradicated, and no such secret campaign was ever authorized or physically executed.",
      suggestions: [
        "influenza virus has been 100% eradicated worldwide this season",
        "secret global mRNA distribute campaign handled over the last winter"
      ]
    }
  ];

  const currentArticle = articlesList.find(a => a.id === selectedArticleId) || articlesList[0];

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      const selectedText = selection.toString().trim();
      if (selectedText.length > 5) {
        setHighlightedText(selectedText);
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const mockBrowserArea = document.getElementById("mock-browser-view");
    if (mockBrowserArea) {
      const rect = mockBrowserArea.getBoundingClientRect();
      setRightClickPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setShowRightClickMenu(true);
    }
  };

  useEffect(() => {
    const closeMenu = () => setShowRightClickMenu(false);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const triggerExtensionCheck = async (claimText: string) => {
    if (!claimText || claimText.trim().length === 0) return;
    
    setIsAnalyzing(true);
    setExtensionReport(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch("/api/verify-rumor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: claimText })
      });

      if (!response.ok) throw new Error("Verification failed");
      const report: FactReport = await response.json();

      setExtensionReport({
        sourceName: currentArticle.source,
        sourceCredibility: currentArticle.credibility,
        verdict: report.verdict,
        confidence: report.confidenceScore,
        flaggedStatements: report.flaggedClaims.map(fc => ({
          statement: fc.claim,
          fact: fc.fact,
          isFalse: fc.verdict.toLowerCase().includes("false") || fc.verdict.toLowerCase().includes("misleading")
        })),
        summary: report.explanation,
        loading: false
      });
    } catch (e) {
      console.error(e);
      setExtensionReport({
        sourceName: currentArticle.source,
        sourceCredibility: currentArticle.credibility,
        verdict: "UNVERIFIED",
        confidence: 50,
        flaggedStatements: [
          {
            statement: claimText,
            fact: "Simulation Mode active. Fact check data streams can be loaded live when a real GEMINI_API_KEY is supplied.",
            isFalse: true
          }
        ],
        summary: "This report acts as a mockup of real-time browsing verification. Install a real API key to check live global press and Snopes indexes.",
        loading: false
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="extension-simulator-panel" className="glass-panel neon-border-hover p-6 sm:p-8 text-left relative overflow-hidden">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 pb-6 border-b border-emerald-500/15">
        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-mono font-bold rounded-full uppercase tracking-wider">
            Companion Widget Mockup
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-medium tracking-tight text-slate-900 mt-2">
            Browsing Companion Simulator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Drag-and-highlight any sentence in the news portal, then right-click and check with TruthShield to audit claim validity contextually.
          </p>
        </div>
        
        {/* Toggle Preset Articles */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {articlesList.map((art) => (
            <button
              key={art.id}
              onClick={() => {
                setSelectedArticleId(art.id);
                setHighlightedText("");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedArticleId === art.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {art.source}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* LEFT COLUMN: Browser Wrapper */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-200 overflow-hidden shadow-2xs relative">
          
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 block" />
            </div>
            
            <div className="ml-4 flex-1 bg-slate-200/50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 flex items-center justify-between font-mono">
              <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                <span className="text-emerald-600">https://</span>
                <span className="text-slate-700 font-sans font-medium">{currentArticle.source}/news/feed</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>

          <div
            id="mock-browser-view"
            onMouseUp={handleTextSelection}
            onContextMenu={handleRightClick}
            className="p-6 bg-slate-50/40 min-h-[380px] max-h-[450px] overflow-y-auto relative cursor-text select-text"
          >
            <div className="bg-white/90 p-6 rounded-xl border border-slate-200/80 shadow-2xs text-left">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                <span className="uppercase text-emerald-600 tracking-wider font-bold">{currentArticle.source}</span>
                <span>{currentArticle.date}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-display font-medium text-slate-900 leading-snug">
                {currentArticle.title}
              </h1>
              
              <div className="mt-4 text-xs sm:text-sm text-slate-650 font-sans leading-relaxed space-y-3">
                {currentArticle.content}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-550" /> Curated Test Highlights:
                </p>
                <div className="flex flex-col gap-1.5">
                  {currentArticle.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setHighlightedText(sug);
                        triggerExtensionCheck(sug);
                      }}
                      className="text-left py-1 px-2.5 rounded-lg text-xs font-medium bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 transition-all border border-emerald-100/30 block hover:translate-x-0.5 duration-200 cursor-pointer"
                    >
                      "{sug}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {showRightClickMenu && highlightedText && (
              <div
                style={{
                  top: `${rightClickPos.y}px`,
                  left: `${rightClickPos.x}px`
                }}
                className="absolute z-50 bg-white text-slate-800 rounded-xl shadow-md border border-slate-200 py-1.5 w-60 text-xs font-medium cursor-pointer"
              >
                <div
                  onClick={() => triggerExtensionCheck(highlightedText)}
                  className="px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 border-b border-slate-100 text-emerald-600 font-semibold"
                >
                  <span className="flex items-center gap-2 font-display">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Check with TruthShield
                  </span>
                  <span className="text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700 font-mono font-bold whitespace-nowrap">Instant</span>
                </div>
                <div className="px-3 py-1.5 text-[10px] text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                  Selected: "{highlightedText}"
                </div>
              </div>
            )}
            
            {!highlightedText && (
              <div className="absolute top-4 right-4 bg-emerald-650 text-white text-[10px] px-3 py-1.5 rounded-full font-mono font-bold shadow-sm border border-emerald-500/20 flex items-center gap-1.5 animate-bounce pointer-events-none">
                <Info className="w-3.5 h-3.5 text-emerald-100" />
                <span>Drag to highlight sentences above</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TruthShield Chrome Extension widget */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="border border-slate-200/80 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm flex-1 flex flex-col overflow-hidden">
            
            <div className="bg-slate-50 text-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-xs tracking-wider uppercase text-slate-700">TruthShield Extension</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[9px] text-emerald-700 font-mono font-bold border border-emerald-200">ACTIVE</span>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[450px]">
              {highlightedText ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left">
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Target Statement:</p>
                  <p className="text-xs text-slate-600 italic font-medium leading-relaxed">
                    "{highlightedText}"
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50/30 border border-dashed border-emerald-100/50 rounded-xl p-6 text-center text-xs text-slate-500">
                  <Eye className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="font-semibold font-display text-slate-700">Select statement to scan</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Select text inside the news layout or click a preset highlight suggests.
                  </p>
                </div>
              )}

              {isAnalyzing ? (
                <div className="bg-slate-50 py-12 text-center rounded-xl border border-slate-100 flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                    <Shield className="w-3.5 h-3.5 text-emerald-600 absolute inset-0 m-auto" />
                  </div>
                  <p className="text-xs font-semibold font-mono text-slate-500">Cross-referencing database indices...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <p className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Verdict</p>
                      <p className={`text-xs sm:text-sm font-display font-bold uppercase mt-1 leading-none ${
                        extensionReport.verdict.includes("FALSE") ? "text-rose-600" :
                        extensionReport.verdict.includes("UNVERIFIED") ? "text-amber-600" : "text-emerald-600"
                      }`}>
                        {extensionReport.verdict}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <p className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Credibility</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-sm sm:text-base font-bold font-display ${
                          extensionReport.sourceCredibility >= 6 ? "text-emerald-600" : "text-rose-600"
                        }`}>{extensionReport.sourceCredibility}/10</span>
                        <span className="text-[9px] text-slate-400 font-mono">Index</span>
                      </div>
                    </div>
                  </div>

                  {extensionReport.flaggedStatements.length > 0 && (
                    <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-3.5">
                      <div className="flex items-center gap-2 text-rose-800 font-display font-semibold text-xs mb-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Anomalies Flagged:</span>
                      </div>
                      <div className="space-y-2.5">
                        {extensionReport.flaggedStatements.map((flag, idx) => (
                          <div key={idx} className="border-l-2 border-rose-300 pl-2 text-left">
                            <p className="text-xs font-semibold text-slate-800 leading-tight">
                              "{flag.statement}"
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                              Fact: {flag.fact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 leading-relaxed text-left">
                    <p className="font-mono text-[9px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-emerald-600" /> Grounding Evidence:
                    </p>
                    {extensionReport.summary}
                  </div>
                </div>
              )}

              <div className="mt-2 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <label className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                  Test custom prompt:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customClaimInput}
                    onChange={(e) => setCustomClaimInput(e.target.value)}
                    placeholder="e.g. Alien bases detected..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (customClaimInput) {
                        setHighlightedText(customClaimInput);
                        triggerExtensionCheck(customClaimInput);
                        setCustomClaimInput("");
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg p-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
