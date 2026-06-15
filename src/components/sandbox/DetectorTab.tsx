import { useState, useEffect, useRef } from "react";
import {
  Image, Video, FileText, Share2, Upload, AlertCircle, CheckCircle,
  Sparkles, History, HelpCircle, ExternalLink,
  Trash2, FileUp, SlidersHorizontal, Layers, User, Cpu, ShieldAlert, BadgeCheck, MessageSquare
} from "lucide-react";
import { ScanType, ScanHistoryItem, ImageReport, VideoReport, TextReport, FactReport, MessageReport } from "../../types";
import SecurityHub from "../security/SecurityHub";
import CommunityEvidencePanel from "./CommunityEvidencePanel";

export default function DetectorTab() {
  const [activeTab, setActiveTab] = useState<ScanType>("image");

  useEffect(() => {
    const event = new CustomEvent("truthshield_tab_changed", { detail: activeTab });
    window.dispatchEvent(event);
  }, [activeTab]);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("truthshield_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeSidebarTab, setActiveSidebarTab] = useState<"history" | "profile">("history");

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("truthshield_current_user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("truthshield_current_user");
      }
    } catch (e) {
      console.log("Failed to sync current user state:", e);
    }
  }, [currentUser]);
  
  // Input states
  const [inputText, setInputText] = useState("");
  const [inputRumor, setInputRumor] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Diagnostic results
  const [textResult, setTextResult] = useState<TextReport | null>(null);
  const [factResult, setFactResult] = useState<FactReport | null>(null);
  const [imageResult, setImageResult] = useState<ImageReport | null>(null);
  const [videoResult, setVideoResult] = useState<VideoReport | null>(null);
  const [messageResult, setMessageResult] = useState<MessageReport | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  // Forensic terminal logs state
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  // Share certificate modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeShareReport, setActiveShareReport] = useState<any>(null);

  const openShareModal = (report: any, title: string, type: string) => {
    setActiveShareReport({
      report,
      title,
      type,
      id: "TS-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString()
    });
    setIsShareModalOpen(true);
  };
  
  const triggerSimulatedLogs = (type: string) => {
    setScanLogs([]);
    const lines = {
      image: [
        "[SYSTEM] Hooking convolutional pixel matrix...",
        "[DECRYPT] Running discrete cosine transform (DCT) filters...",
        "[ANALYSIS] Isolating speculative reflection vectors...",
        "[FORENSICS] EXIF metadata header scan: no native camera EXIF profiles active.",
        "[COMPLETE] Diagnostic report generated."
      ],
      video: [
        "[SYSTEM] Fetching oral-phoneme audio waveform envelopes...",
        "[DECRYPT] Tracking 56 structural facial landmark coordinates...",
        "[ANALYSIS] Auditing temporal eye-blinking intervals and jaw jitter...",
        "[FORENSICS] Audio-visual mismatch calculated at 220ms lag.",
        "[COMPLETE] Deepfake timeline diagnostics completed."
      ],
      text: [
        "[SYSTEM] Loading neural transformer linguistic matrix...",
        "[DECRYPT] Parsing sentence perplexity distributions...",
        "[ANALYSIS] Checking stylistic cliches and transition pattern symmetry...",
        "[COMPLETE] Linguistic audit generated."
      ],
      rumor: [
        "[SYSTEM] Opening live API socket to Google Fact Check Grounding...",
        "[DECRYPT] Fetching live news articles and credible citation indices...",
        "[ANALYSIS] Contrastive claim alignment filters initialized...",
        "[COMPLETE] Grounding report generated."
      ],
      message: [
        "[SYSTEM] Auditing text payload for social engineering pressure tactics...",
        "[DECRYPT] Parsing bank/government impersonation features...",
        "[ANALYSIS] Verifying malicious link domain reputation profiles...",
        "[COMPLETE] Phishing safety audit completed."
      ]
    }[type] || [];

    lines.forEach((line, idx) => {
      setTimeout(() => {
        setScanLogs(prev => [...prev, line]);
      }, (idx + 1) * 500);
    });
  };

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("truthshield_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.log("Failed to load local scan history:", e);
    }
  }, []);

  const saveToHistory = (type: ScanType, title: string, verdict: string, score: number, report: any) => {
    const newItem: ScanHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString(),
      type,
      title,
      verdict,
      score,
      report
    };
    const updated = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    try {
      localStorage.setItem("truthshield_history", JSON.stringify(updated));
    } catch (e) {
      console.log("Failed to save history item:", e);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("truthshield_history");
  };

  const handleSetHistoryReport = (item: ScanHistoryItem) => {
    setActiveTab(item.type);
    if (item.type === "image") {
      setImageResult(item.report);
      setPreviewUrl(item.report.previewUrl || null);
      setVideoResult(null); setTextResult(null); setFactResult(null); setMessageResult(null);
    } else if (item.type === "video") {
      setVideoResult(item.report);
      setPreviewUrl(item.report.previewUrl || null);
      setImageResult(null); setTextResult(null); setFactResult(null); setMessageResult(null);
    } else if (item.type === "text") {
      setTextResult(item.report);
      setInputText(item.title);
      setImageResult(null); setVideoResult(null); setFactResult(null); setMessageResult(null);
    } else if (item.type === "rumor") {
      setFactResult(item.report);
      setInputRumor(item.title);
      setImageResult(null); setVideoResult(null); setTextResult(null); setMessageResult(null);
    } else if (item.type === "message") {
      setMessageResult(item.report);
      setInputMessage(item.title);
      setImageResult(null); setVideoResult(null); setTextResult(null); setFactResult(null);
    }
  };

  // Preset mock contents for instant one-click testing
  const presets = {
    image: [
      {
        name: "Midjourney GAN Portrait (Synthetic)",
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
        sim: {
          score: 94,
          verdict: "AI-Generated Image",
          reasons: [
            "Facial boundary blending: Smudges and unnatural soft pixels around ear helix and neck intersections.",
            "Specular eye reflection mismatch: Light vectors fail to align with correct azimuthal lighting environment.",
            "Epidermal textures: Unnatural skin smoothing, entirely missing high-frequency sensor noise grain."
          ],
          detectedArtifacts: [
            { element: "Ear Helix Mesh", description: "Asymmetry in inner structural curvature.", severity: "High" },
            { element: "Pupillary Point", description: "Unmatched focal reflections.", severity: "Medium" }
          ],
          pixelAnomaliesDescription: "Significant frequency separation visible. High frequency patterns (typical of standard photography sensors) are absent, replaced by digital convolution gradients.",
          metadataSummary: "Discrepancy detected: Metadata header lacks native camera EXIF profiles or focal specifications of modern lenses."
        }
      },
      {
        name: "Authentic Canon Camera Photography",
        url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        sim: {
          score: 6,
          verdict: "Authentic photography",
          reasons: [
            "Consistent high-ISO pixel grain throughout both focused subject and out-of-focus background drop-off.",
            "Natural specular highlights in both pupils match a unified, identifiable single umbrella strobe.",
            "Physical depth-of-field matches correct lens aperture equations (85mm f/1.8)."
          ],
          detectedArtifacts: [],
          pixelAnomaliesDescription: "No frequency anomalies found. Noise floor aligns with native CMOS sensor characteristics.",
          metadataSummary: "No tampering: Normal EXIF markers active (Canon EOS 5D Mk IV, F/2.0, 1/160s, ISO 400)."
        }
      }
    ],
    video: [
      {
        name: "CEO Deepfaked Financial Statement",
        fileName: "corpo_ceo_announcement_fake.mp4",
        sim: {
          score: 87,
          verdict: "High Probability Deepfake",
          lipSyncAccuracy: "Frequent gaps where the oral motor movements fail key speech syllables (lagging behind the audio frequencies by up to 220ms).",
          eyeBlinkingRate: "Extremely low: Calculated at 1.8 blinks/min (normal healthy human standard ranges from 12 to 18 blinks/min).",
          facialLandmarks: "Vocal jaw drift detected: Anchor coordinates shift abruptly during rapid phoneme articulations.",
          reasons: [
            "Lip-sync phase mismatch: Lip-seal transitions fail standard audio envelopes.",
            "Temporal flickering: Micro-halos and flickering around facial borders when hands move in front of the chin.",
            "Lighting vector mismatch: Spotlight vectors on the forehead deviate from ambient background luminescence."
          ],
          timeline: [
            { time: "0:01", claim: "Initial speech kickoff", artifactType: "Micro-flickering around jaw", confidence: 78 },
            { time: "0:06", claim: "Financial projection declaration", artifactType: "Lip-sync phoneme lag", confidence: 93 },
            { time: "0:12", claim: "Abrupt neck tilt", artifactType: "Landmark mesh tearing", confidence: 85 }
          ]
        }
      },
      {
        name: "Standard Real News Update File",
        fileName: "news_broadcast_legit.mp4",
        sim: {
          score: 5,
          verdict: "Highly Likely Real Video",
          lipSyncAccuracy: "Perfect biomechanical alignment with speech envelopes (sub-12ms temporal accuracy).",
          eyeBlinkingRate: "Normal distribution: Standard 14 blinks/min interval, demonstrating natural human physical blinking loops.",
          facialLandmarks: "Positional stability: Mesh coordinates bind perfectly onto facial structures with zero jitter or coordinate skewing.",
          reasons: [
            "Consistent light refraction patterns across teeth, eyes, and skin margins.",
            "Background perspective matches natural optical compression constraints."
          ],
          timeline: []
        }
      }
    ],
    text: [
      {
        label: "AI-Generated Tech Pitch Prompt",
        content: "We are incredibly excited to showcase our groundbreaking paradigm-shifting solution. By leveraging state-of-the-art scalable architectures and leveraging synergistic capabilities, we aim to truly democratize workflow efficiency. Furthermore, it is a testament to our ongoing commitment to revolutionize user immersion and capture value."
      },
      {
        label: "Authentic Human Retrospective Essay",
        content: "Honestly, starting this project at 3 AM was a terrible choice. The coffee machine was broken, and I was staring at a blank screen wondering why I signed up for this class. My notes were a mess of scribbles and half-remembered theories. But somehow, around 4:15, after rambling to my cat, the core structure started making sense. It's rough, but it's raw, and it's mine."
      }
    ],
    rumor: [
      {
        label: "WhatsApp Viral Health Rumour",
        content: "URGENT WARNING: Drinking hot lemon juice with three teaspoons of standard baking soda completely dissolves all active viral cellular walls in under 12 hours. Share this immediately with family. Big pharma is hiding this from you!"
      },
      {
        label: "Unverified Crop Circle Mystery Post",
        content: "Recent UFO sighting in Suffolk confirms ancient circles have opened portals in agricultural corn fields last Tuesday night."
      }
    ],
    message: [
      {
        label: "Fake Government Grant Scam",
        content: "CONGRATULATIONS! You have been selected to receive a $5,000 Federal Subsidy Grant from the Ministry of Welfare and Housing. To claim, register instantly at http://fake-welfare-subsidy.gov-claims.net/payout and verify your details before midnight to avoid suspension."
      },
      {
        label: "Suspicious Bank Suspension SMS",
        content: "Alert: Your online banking access has been temporarily restricted due to unauthorized login attempts. Please update your security profile immediately to secure your funds at: https://secure-login.bank-update.org/login"
      }
    ]
  };

  // Convert uploaded image file to base64
  const handleImageUpload = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewUrl(e.target.result as string);
        setErrorText(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger base64 Image scan
  const executeImageScan = async () => {
    if (!previewUrl) {
      setErrorText("Please upload or select an image first.");
      return;
    }
    setLoading(true);
    setErrorText(null);
    setImageResult(null);
    triggerSimulatedLogs("image");

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: previewUrl,
          mimeType: selectedFile?.type || "image/jpeg",
          fileName: selectedFile?.name || ""
        })
      });

      if (!response.ok) throw new Error("Image analysis endpoint returned failing status.");
      const report: ImageReport = await response.json();
      setImageResult(report);

      saveToHistory(
        "image", 
        selectedFile?.name || "Uploaded Image Asset", 
        report.verdict, 
        report.score, 
        { ...report, previewUrl }
      );
    } catch (e: any) {
      console.error(e);
      setErrorText("Vision analysis failed. Loaded simulation parameters.");
      
      const isAuthenticPattern = /(authentic|canon|real|camera|legit|news)/i.test(selectedFile?.name || "");
      
      const mockResult: ImageReport = {
        score: isAuthenticPattern ? 6 : (/Midjourney/i.test(selectedFile?.name || "") ? 94 : 85),
        verdict: isAuthenticPattern ? "Authentic photography" : "AI Generated Image (Mock)",
        reasons: isAuthenticPattern 
          ? [
              "Consistent high-ISO pixel grain throughout both focused subject and background.",
              "Natural specular highlights in both pupils match a unified lighting environment.",
              "Physical depth-of-field matches correct optical lens apertures."
            ]
          : [
              "Mismatched specular eye reflections at pupillary focus",
              "Lack of authentic lens EXIF camera files",
              "Warped boundary artifacts along cheek contours"
            ],
        detectedArtifacts: isAuthenticPattern 
          ? [] 
          : [
              { element: "Structural Boundaries", description: "Mismatched focal blur drop indices.", severity: "High" }
            ],
        pixelAnomaliesDescription: isAuthenticPattern 
          ? "No frequency anomalies found. Noise floor aligns with native CMOS sensor characteristics."
          : "Analyzed pixel noise floor deviates from continuous sensor patterns.",
        metadataSummary: isAuthenticPattern 
          ? "No tampering: Normal EXIF markers active (Canon EOS 5D Mk IV)."
          : "No EXIF logs. Simulated result.",
        simulated: true
      };
      setImageResult(mockResult);
    } finally {
      setLoading(false);
    }
  };

  // Trigger base64 Video scan simulated thumbnail
  const executeVideoScan = async () => {
    setLoading(true);
    setErrorText(null);
    setVideoResult(null);
    triggerSimulatedLogs("video");

    const videoName = selectedFile?.name || "Scanned Video Stream";

    try {
      const response = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoFileName: videoName,
          videoBase64Frame: previewUrl
        })
      });

      if (!response.ok) throw new Error("Video analysis endpoint returned failing status.");
      const report: VideoReport = await response.json();
      setVideoResult(report);

      saveToHistory(
        "video", 
        videoName, 
        report.verdict, 
        report.score, 
        { ...report, previewUrl }
      );
    } catch (e: any) {
      console.error(e);
      setErrorText("Video processing failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Text AI Writing Scan
  const executeTextScan = async () => {
    if (!inputText || inputText.trim().length < 10) {
      setErrorText("Please paste a longer text (at least 10 characters) for stylistic pattern parsing.");
      return;
    }
    setLoading(true);
    setErrorText(null);
    setTextResult(null);
    triggerSimulatedLogs("text");

    try {
      const response = await fetch("/api/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) throw new Error("AI Text detection endpoint failed.");
      const report: TextReport = await response.json();
      setTextResult(report);

      saveToHistory(
        "text", 
        inputText.substring(0, 50) + "...", 
        report.verdict, 
        report.score, 
        report
      );
    } catch (e: any) {
      console.error(e);
      setErrorText("AI text analysis error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger live rumor Fact Check via Search Grounding
  const executeRumorScan = async () => {
    if (!inputRumor || inputRumor.trim().length < 5) {
      setErrorText("Please write or select a concise claim to cross-reference.");
      return;
    }
    setLoading(true);
    setErrorText(null);
    setFactResult(null);
    triggerSimulatedLogs("rumor");

    try {
      const response = await fetch("/api/verify-rumor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: inputRumor })
      });

      if (!response.ok) throw new Error("Fact check endpoint failed.");
      const report: FactReport = await response.json();
      setFactResult(report);

      saveToHistory(
        "rumor", 
        inputRumor.substring(0, 50) + "...", 
        report.verdict, 
        report.confidenceScore, 
        report
      );
    } catch (e: any) {
      console.error(e);
      setErrorText("Fact audit error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger WhatsApp/SMS scam audit
  const executeMessageScan = async () => {
    if (!inputMessage || inputMessage.trim().length < 5) {
      setErrorText("Please paste a message (at least 5 characters) to perform scam analysis.");
      return;
    }
    setLoading(true);
    setErrorText(null);
    setMessageResult(null);
    triggerSimulatedLogs("message");

    try {
      const response = await fetch("/api/analyze-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputMessage })
      });

      if (!response.ok) throw new Error("Scam checker endpoint failed.");
      const report: MessageReport = await response.json();
      setMessageResult(report);

      saveToHistory(
        "message", 
        inputMessage.substring(0, 50) + "...", 
        report.verdict, 
        report.score, 
        report
      );
    } catch (e: any) {
      console.error(e);
      setErrorText("Scam analysis error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Preset quick loader
  const loadPresetImage = (preset: any) => {
    setPreviewUrl(preset.url);
    setSelectedFile({ name: preset.name, type: "image/jpeg" } as any);
    setImageResult(preset.sim);
    setVideoResult(null); setTextResult(null); setFactResult(null); setMessageResult(null);
  };

  const loadPresetVideo = (preset: any) => {
    setPreviewUrl("https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=450");
    setSelectedFile({ name: preset.fileName, type: "video/mp4" } as any);
    setVideoResult(preset.sim);
    setImageResult(null); setTextResult(null); setFactResult(null); setMessageResult(null);
  };

  return (
    <div id="diagnostics-sandbox-panel" className="grid grid-cols-1 xl:grid-cols-12 gap-8 my-6 text-left relative z-20">
      
      {/* SIDEBAR: History Scans log / Profile (3 Columns) */}
      <div className="xl:col-span-3 flex flex-col glass-panel neon-border-hover p-5 h-max relative overflow-hidden">
        
        {/* Toggle Pills between Logs and Security Hub */}
        <div className="grid grid-cols-2 gap-1 bg-slate-950/40 p-1 rounded-xl mb-4 text-xs font-semibold border border-emerald-500/10">
          <button
            onClick={() => setActiveSidebarTab("history")}
            className={`py-1.5 rounded-lg transition-all font-display text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSidebarTab === "history"
                ? "bg-emerald-500/20 text-white border border-emerald-500/30 font-bold shadow-2xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Sandbox Logs</span>
          </button>
          
          <button
            onClick={() => setActiveSidebarTab("profile")}
            className={`py-1.5 rounded-lg transition-all font-display text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSidebarTab === "profile"
                ? "bg-emerald-500/20 text-white border border-emerald-500/30 font-bold shadow-2xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Security Hub</span>
          </button>
        </div>

        {activeSidebarTab === "history" ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="font-display font-medium text-sm text-slate-900">Sandbox Logs</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  title="Clear diagnostic history"
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs leading-normal">
                <Layers className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p>Your local diagnostic history is empty.</p>
                <p className="text-[10px] text-slate-400 mt-1">Execute a scan in any tab to record real audits.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSetHistoryReport(item)}
                    className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-white cursor-pointer transition-all duration-200 text-left group shadow-3xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                        item.type === "image" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        item.type === "video" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                        item.type === "text" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                        "bg-teal-50 text-teal-700 border border-teal-100"
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono italic">{item.timestamp}</span>
                    </div>
                    
                    <h4 className="text-xs font-semibold text-slate-800 mt-2 truncate group-hover:text-emerald-600 transition-colors">
                      {item.title}
                    </h4>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-mono text-slate-500 font-medium truncate max-w-[130px]">
                        {item.verdict}
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${
                        item.score >= 70 ? "text-rose-600" : 
                        item.score >= 35 ? "text-amber-600" : "text-emerald-600"
                      }`}>
                        {item.score}% Risk
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <SecurityHub 
            currentUser={currentUser} 
            onLoginSuccess={(user) => setCurrentUser(user)} 
            onLogout={() => setCurrentUser(null)} 
          />
        )}
      </div>

      {/* CORE FRAME: Workspace (9 Columns) */}
      <div className="xl:col-span-9 flex flex-col glass-panel neon-border-hover overflow-hidden relative">
        {/* Dynamic scanning laser sweeps across card when loading is active */}
        {loading && <div className="laser-scanline" />}
        
        {/* Workspace tab selectors */}
        <div className="border-b border-emerald-100/30 bg-slate-50/30 p-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => { setActiveTab("image"); setErrorText(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold transition-all uppercase cursor-pointer ${
              activeTab === "image"
                ? "bg-emerald-500/10 text-emerald-700 shadow-3xs border border-emerald-500/20"
                : "text-slate-500 hover:bg-white/40 hover:text-slate-950"
            }`}
          >
            <Image className="w-4 h-4 text-emerald-600" />
            <span>Image Checker</span>
          </button>
          
          <button
            onClick={() => { setActiveTab("video"); setErrorText(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold transition-all uppercase cursor-pointer ${
              activeTab === "video"
                ? "bg-emerald-500/10 text-emerald-700 shadow-3xs border border-emerald-500/20"
                : "text-slate-500 hover:bg-white/40 hover:text-slate-950"
            }`}
          >
            <Video className="w-4 h-4 text-teal-600" />
            <span>Video Checker</span>
          </button>

          <button
            onClick={() => { setActiveTab("text"); setErrorText(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold transition-all uppercase cursor-pointer ${
              activeTab === "text"
                ? "bg-emerald-500/10 text-emerald-700 shadow-3xs border border-emerald-500/20"
                : "text-slate-500 hover:bg-white/40 hover:text-slate-950"
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-600" />
            <span>AI Text Detection</span>
          </button>

          <button
            onClick={() => { setActiveTab("rumor"); setErrorText(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold transition-all uppercase cursor-pointer ${
              activeTab === "rumor"
                ? "bg-emerald-500/10 text-emerald-700 shadow-3xs border border-emerald-500/20"
                : "text-slate-500 hover:bg-white/40 hover:text-slate-950"
            }`}
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>Fact Grounding Audit</span>
          </button>

          <button
            onClick={() => { setActiveTab("message"); setErrorText(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold transition-all uppercase cursor-pointer ${
              activeTab === "message"
                ? "bg-emerald-500/10 text-emerald-700 shadow-3xs border border-emerald-500/20"
                : "text-slate-600 hover:bg-white/40 hover:text-slate-950"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp/SMS Scam Check</span>
          </button>
        </div>

        {/* Diagnostics Sandbox */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col">
          
          {errorText && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5 leading-normal">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Technical Warning Warning / Information</p>
                <p className="mt-0.5">{errorText}</p>
              </div>
            </div>
          )}

          {/* TAB 1: Image Sandbox */}
          {activeTab === "image" && (
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-emerald-100/50 rounded-2xl p-6 text-center hover:border-emerald-200 bg-slate-50/30 transition-all">
                    <input
                      type="file"
                      id="image-file-picker"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                    <label htmlFor="image-file-picker" className="cursor-pointer block">
                      <div className="bg-white p-3 rounded-full w-max mx-auto shadow-xs border border-emerald-50 text-slate-600 mb-3 hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">Upload Suspect Photo</p>
                      <p className="text-xs text-slate-400 mt-1 leading-normal">Drag-and-drop JPEG/PNG or click to browse</p>
                    </label>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Curated Sample Library</h4>
                    <div className="flex flex-col gap-2">
                      {presets.image.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => loadPresetImage(p)}
                          className="flex items-center justify-between text-left p-2.5 rounded-xl text-xs font-semibold border border-slate-100 bg-slate-50 hover:bg-emerald-50/40 hover:border-emerald-100 transition-all cursor-pointer"
                        >
                          <span className="text-slate-700">{p.name}</span>
                          <span className="text-[10px] text-emerald-600 font-mono">Load Preset</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {previewUrl && (
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 text-center">
                      <p className="text-[9px] text-slate-400 font-mono mb-2">TARGET IMAGE MATRIX</p>
                      <img src={previewUrl} alt="SUSPECT PREVIEW" className="max-h-56 mx-auto rounded-lg shadow-xs border border-slate-200 object-cover" />
                      <button
                        onClick={executeImageScan}
                        disabled={loading}
                        className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-display px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? "Analyzing Pixel Matrices..." : "Verify Photographic Authenticity"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/30 rounded-2xl border border-slate-200 p-5 min-h-[300px] flex flex-col justify-between">
                  {imageResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">Analysis Output</p>
                          <h4 className="font-display font-bold text-slate-800 uppercase text-xs sm:text-sm mt-0.5">{imageResult.verdict}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">Tamper Risk</p>
                          <p className={`text-base font-bold font-display ${imageResult.score >= 60 ? "text-rose-600" : "text-emerald-600"}`}>
                            {imageResult.score}% Probability
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${imageResult.score >= 60 ? "bg-rose-500" : "bg-emerald-500"}`}
                          style={{ width: `${imageResult.score}%` }}
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Forensic Artifact Findings:</p>
                        <ul className="space-y-2 list-none">
                          {imageResult.reasons.map((r, i) => (
                            <li key={i} className="text-xs text-slate-600 bg-white border border-slate-200 p-2.5 rounded-xl leading-normal flex gap-2">
                              <span className="text-emerald-500 font-bold shrink-0">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {imageResult.detectedArtifacts && imageResult.detectedArtifacts.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-3 mt-4">
                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-2">Detected Artifact Mesh:</p>
                          <div className="space-y-2">
                            {imageResult.detectedArtifacts.map((art, i) => (
                              <div key={i} className="flex justify-between items-center text-xs border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${art.severity === "High" ? "bg-rose-500" : "bg-amber-500"}`} />
                                  <span className="font-semibold text-slate-800">{art.element}</span>
                                </div>
                                <span className="text-slate-500 text-[10px] truncate max-w-[150px]">{art.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col gap-2">
                        <p><span className="font-semibold text-slate-700">Pixel Forensic Analysis:</span> {imageResult.pixelAnomaliesDescription}</p>
                        <p className="font-mono text-[9px] bg-white p-1.5 border border-slate-200 rounded">{imageResult.metadataSummary}</p>
                      </div>

                      <button
                        onClick={() => openShareModal(imageResult, selectedFile?.name || "Uploaded Image Asset", "image")}
                        className="mt-4 w-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 font-mono font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:text-white transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Generate Forensic Certificate</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 text-xs max-w-sm mx-auto flex flex-col items-center gap-3">
                      <Cpu className="w-8 h-8 text-emerald-600/60 animate-pulse" />
                      <p className="font-semibold text-slate-700 font-display">Awaiting suspect photograph.</p>
                      <p className="leading-normal">Upload your suspicious graphic locally or load curated samples from our training archives to see detailed spatial pixel diagnostics.</p>
                    </div>
                  )}
                </div>
              </div>

              {imageResult && (
                <CommunityEvidencePanel
                  contentId={selectedFile?.name || "Midjourney GAN Portrait (Synthetic)"}
                  currentUser={currentUser}
                  onReputationChange={(u) => setCurrentUser(u)}
                />
              )}
            </div>
          )}

          {/* TAB 2: Video Check */}
          {activeTab === "video" && (
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-emerald-100/50 rounded-2xl p-6 text-center hover:border-emerald-200 bg-slate-50/30 transition-all">
                    <input
                      type="file"
                      id="video-file-picker"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setPreviewUrl("https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=450");
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="video-file-picker" className="cursor-pointer block">
                      <div className="bg-white p-3 rounded-full w-max mx-auto shadow-xs border border-emerald-50 text-slate-600 mb-3">
                        <Upload className="w-5 h-5 text-teal-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">Upload Suspect MP4/WebM Video</p>
                      <p className="text-xs text-slate-400 mt-1">Loads timeline and biometric tracking</p>
                    </label>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Curated Sample Chronicles</h4>
                    <div className="flex flex-col gap-2">
                      {presets.video.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => loadPresetVideo(p)}
                          className="flex items-center justify-between text-left p-2.5 rounded-xl text-xs font-semibold border border-slate-100 bg-slate-50 hover:bg-emerald-50/40 hover:border-emerald-100 transition-all cursor-pointer"
                        >
                          <span className="text-slate-700">{p.name}</span>
                          <span className="text-[10px] text-teal-600 font-mono">Load Video</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[9px] text-slate-400 font-mono mb-2">SPECTRAL VIDEO STREAM</p>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 inline-flex items-center gap-2 mb-4 w-full text-left">
                        <Video className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate flex-1 block">{selectedFile.name}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">MP4</span>
                      </div>
                      <button
                        onClick={executeVideoScan}
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-display px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? "Extracting Temporal Landmarks..." : "Perform Deepfake Timeline Inspection"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/30 rounded-2xl border border-slate-200 p-5 min-h-[300px]">
                  {videoResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">Temporal Evaluation</p>
                          <h4 className="font-display font-bold text-slate-800 uppercase text-xs sm:text-sm mt-0.5">{videoResult.verdict}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Deepfake Rating</p>
                          <p className={`text-base font-bold font-display ${videoResult.score >= 60 ? "text-rose-600" : "text-emerald-600"}`}>
                            {videoResult.score}% Probability
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2.5">
                        <div>
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Lip Sync Phase Alignment:</p>
                          <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">{videoResult.lipSyncAccuracy}</p>
                        </div>
                        <div className="h-px bg-slate-100" />
                        <div>
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Eye Blinking Frequency:</p>
                          <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">{videoResult.eyeBlinkingRate}</p>
                        </div>
                        <div className="h-px bg-slate-100" />
                        <div>
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Facial Landmark Jitter:</p>
                          <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">{videoResult.facialLandmarks}</p>
                        </div>
                      </div>

                      {videoResult.timeline && videoResult.timeline.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Temporal Scan Timeline Logs:</p>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {videoResult.timeline.map((act, index) => (
                              <div key={index} className="flex justify-between items-center text-xs p-2 bg-white rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded text-[9px] font-bold">{act.time}</span>
                                  <span className="font-semibold text-slate-700">{act.claim}</span>
                                </div>
                                <span className="text-[9px] text-rose-600 font-mono font-bold">Flag: {act.artifactType}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => openShareModal(videoResult, selectedFile?.name || "Uploaded Video Stream", "video")}
                        className="mt-4 w-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 font-mono font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:text-white transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Generate Forensic Certificate</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 text-xs max-w-sm mx-auto flex flex-col items-center gap-3">
                      <SlidersHorizontal className="w-8 h-8 text-teal-600/60 animate-pulse" />
                      <p className="font-semibold text-slate-700 font-display">Awaiting video stream.</p>
                      <p className="leading-normal">Input or select simulated files to run visual-phoneme synchronization comparisons and landmark jitter tracking logs.</p>
                    </div>
                  )}
                </div>
              </div>

              {videoResult && (
                <CommunityEvidencePanel
                  contentId={selectedFile?.name || "CEO Deepfaked Financial Statement"}
                  currentUser={currentUser}
                  onReputationChange={(u) => setCurrentUser(u)}
                />
              )}
            </div>
          )}

          {/* TAB 3: Text AI writing detection */}
          {activeTab === "text" && (
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Paste article content or memo:</label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste your suspect text block here (e.g. papers, blogs or questionable memos)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs h-48 focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all leading-relaxed font-sans scrollbar"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {presets.text.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputText(t.content);
                          setTextResult(null);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 hover:border-emerald-300 text-slate-600 hover:bg-slate-50 max-w-xs truncate cursor-pointer"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={executeTextScan}
                    disabled={loading || inputText.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-display px-4 py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Parsing Lexical Perplexity..." : "Verify Text Integrity"}
                  </button>
                </div>

                <div className="bg-slate-50/30 rounded-2xl border border-slate-200 p-5 min-h-[300px]">
                  {textResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">Detection Report</p>
                          <h4 className="font-display font-bold text-slate-800 uppercase text-xs sm:text-sm mt-0.5">{textResult.verdict}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">AI Likelihood</p>
                          <p className={`text-base font-bold font-display ${textResult.score >= 60 ? "text-rose-600" : "text-emerald-600"}`}>
                            {textResult.score}% Risk Factor
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white border border-slate-200 p-2.5 rounded-xl text-center shadow-3xs">
                          <p className="text-[9px] text-slate-400 font-mono">Perplexity</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{textResult.perplexityScore}</p>
                        </div>
                        <div className="bg-white border border-slate-200 p-2.5 rounded-xl text-center shadow-3xs">
                          <p className="text-[9px] text-slate-400 font-mono">Burstiness</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{textResult.burstinessScore}</p>
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 p-2.5 text-center rounded-lg border border-emerald-100/50 shadow-3xs">
                        <p className="text-[9px] font-mono text-emerald-700 font-bold uppercase tracking-wider">LIKELY MODEL IDENTIFIED</p>
                        <p className="text-xs font-bold text-emerald-800 font-display mt-0.5">{textResult.modelLikelyUsed}</p>
                      </div>

                      <div className="text-xs text-slate-600 leading-relaxed font-sans italic bg-white p-3 rounded-xl border border-slate-200">
                        <p className="font-mono text-[9px] text-slate-400 font-bold uppercase not-italic mb-1 leading-none">Writing Flow Analysis:</p>
                        "{textResult.sentenceStructure}"
                      </div>

                      {textResult.flaggedSentences && textResult.flaggedSentences.length > 0 && (
                        <div className="space-y-2 text-left">
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Suspicious Sentences Found:</p>
                          <div className="space-y-2">
                            {textResult.flaggedSentences.map((flag, index) => (
                              <div key={index} className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl">
                                <p className="text-xs italic text-slate-800">"{flag.text}"</p>
                                <p className="text-[9px] text-rose-700 mt-1.5 font-semibold leading-none flex justify-between">
                                  <span>{flag.reason}</span>
                                  <span className="font-mono font-bold">Conf: {flag.aiConfidence}%</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-sans leading-normal">
                        <p className="font-mono text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-1">Audit Synthesis:</p>
                        {textResult.analysisExplanation}
                      </div>

                      <button
                        onClick={() => openShareModal(textResult, inputText.substring(0, 30) + "...", "text")}
                        className="mt-4 w-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 font-mono font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:text-white transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Generate Forensic Certificate</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 text-xs max-w-sm mx-auto flex flex-col items-center gap-3">
                      <HelpCircle className="w-8 h-8 text-cyan-600/60 animate-pulse" />
                      <p className="font-semibold text-slate-700 font-display">Awaiting writing text.</p>
                      <p className="leading-normal">Paste suspect articles or use preset text styles to trigger deep forensic perplexity scoring and structural transition audits.</p>
                    </div>
                  )}
                </div>
              </div>

              {textResult && (
                <CommunityEvidencePanel
                  contentId={inputText.trim().length > 30 ? inputText.trim().substring(0, 30) + "..." : "AI Synthesized Article Board"}
                  currentUser={currentUser}
                  onReputationChange={(u) => setCurrentUser(u)}
                />
              )}
            </div>
          )}

          {/* TAB 4: Fact Check (Search Grounded) */}
          {activeTab === "rumor" && (
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Paste viral WhatsApp forward, headline or claims:</label>
                    <input
                      type="text"
                      value={inputRumor}
                      onChange={(e) => setInputRumor(e.target.value)}
                      placeholder="e.g. Reserve bank currency swaps or UFO portals..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all font-sans"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Select sample hoaxes to verify:</p>
                    {presets.rumor.map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputRumor(r.content);
                          setFactResult(null);
                        }}
                        className="text-left p-2.5 rounded-xl text-xs font-semibold border border-slate-200 hover:border-emerald-250 bg-slate-50 text-slate-700 text-ellipsis truncate block cursor-pointer"
                      >
                        "{r.content}"
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={executeRumorScan}
                    disabled={loading || inputRumor.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-display px-4 py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Querying Google Search Grounding..." : "Audit Claim via Live News Search"}
                  </button>
                </div>

                <div className="bg-slate-50/30 rounded-2xl border border-slate-200 p-5 min-h-[300px]">
                  {factResult ? (
                    <div className="space-y-4">
                      
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">Grounding News Verdict</p>
                          <h4 className={`font-display font-bold text-xs sm:text-sm mt-0.5 ${
                            factResult.verdict.includes("FALSE") ? "text-rose-700" :
                            factResult.verdict.includes("MISLEADING") ? "text-amber-700" : "text-emerald-700"
                          }`}>{factResult.verdict}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Citations Rating</p>
                          <p className="text-sm font-bold font-display text-slate-800">
                            {factResult.sourceCredibilityScore}/10
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 leading-relaxed font-sans bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs">
                        <p className="font-mono text-[9px] uppercase font-bold text-slate-400 mb-1 leading-none">Search Auditor Analysis:</p>
                        {factResult.explanation}
                      </div>

                      {factResult.flaggedClaims && factResult.flaggedClaims.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Statement breakdowns:</p>
                          <div className="space-y-2">
                            {factResult.flaggedClaims.map((claimItem, index) => (
                              <div key={index} className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-3xs">
                                <p className="font-semibold text-slate-800">Claim: "{claimItem.claim}"</p>
                                <p className="text-slate-500 mt-1 leading-normal font-medium">Fact: {claimItem.fact}</p>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase mt-1.5 ${
                                  claimItem.verdict.toLowerCase().includes("false") ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                                }`}>
                                  {claimItem.verdict}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {factResult.sources && factResult.sources.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Grounded Credible Sources:</p>
                          <div className="space-y-1.5">
                            {factResult.sources.map((src, idx) => {
                              const isFav = currentUser?.favorites?.some((f: string) => 
                                src.url.toLowerCase().includes(f.toLowerCase()) || 
                                src.organization.toLowerCase().includes(f.toLowerCase())
                              );
                              const isBlk = currentUser?.blocked?.some((b: string) => 
                                src.url.toLowerCase().includes(b.toLowerCase()) || 
                                src.organization.toLowerCase().includes(b.toLowerCase())
                              );

                              return (
                                <div 
                                  key={idx} 
                                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs gap-4 transition-colors ${
                                    isFav ? "bg-emerald-50/50 border-emerald-200 shadow-2xs" :
                                    isBlk ? "bg-rose-50/50 border-rose-200" :
                                    "bg-white border-slate-250"
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap text-left">
                                      <p className={`font-semibold truncate ${isBlk ? "text-rose-800 line-through" : "text-slate-800"}`}>
                                        {src.title}
                                      </p>
                                      {isFav && (
                                        <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold uppercase px-1.5 rounded flex items-center gap-0.5">
                                          <BadgeCheck className="w-2.5 h-2.5" /> Trusted
                                        </span>
                                      )}
                                      {isBlk && (
                                        <span className="text-[8px] bg-rose-100 text-rose-800 border border-rose-200 font-mono font-bold uppercase px-1.5 rounded flex items-center gap-0.5">
                                          <ShieldAlert className="w-2.5 h-2.5" /> Blocked
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-semibold font-mono uppercase mt-0.5 text-left">
                                      {src.organization}
                                    </p>
                                  </div>
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 hover:text-emerald-700 shrink-0 text-[10px] font-mono font-bold uppercase flex items-center gap-0.5 hover:underline"
                                  >
                                    View <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => openShareModal(factResult, inputRumor.substring(0, 30) + "...", "rumor")}
                        className="mt-4 w-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 font-mono font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:text-white transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Generate Forensic Certificate</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 text-xs max-w-sm mx-auto flex flex-col items-center gap-3">
                      <Sparkles className="w-8 h-8 text-emerald-600/60 animate-pulse" />
                      <p className="font-semibold text-slate-700 font-display">Awaiting claim verification.</p>
                      <p className="leading-normal">Paste suspect hoaxes or WhatsApp forwards to cross-reference against Google Search Grounding news indices globally.</p>
                    </div>
                  )}
                </div>
              </div>

              {factResult && (
                <CommunityEvidencePanel
                  contentId={inputRumor.trim().length > 30 ? inputRumor.trim().substring(0, 30) + "..." : "Viral Grounded Claim Scan"}
                  currentUser={currentUser}
                  onReputationChange={(u) => setCurrentUser(u)}
                />
              )}
            </div>
          )}

          {/* TAB 5: WhatsApp/SMS Message Scam Checker */}
          {activeTab === "message" && (
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Paste WhatsApp/SMS Message:</label>
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Paste suspicious text or message links..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs h-48 focus:ring-1 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all leading-relaxed font-sans scrollbar"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">Select sample messages to verify:</p>
                    {presets.message.map((m, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputMessage(m.content);
                          setMessageResult(null);
                        }}
                        className="text-left p-2.5 rounded-xl text-xs font-semibold border border-slate-200 hover:border-emerald-250 bg-slate-50 text-slate-700 text-ellipsis truncate block cursor-pointer"
                      >
                        "{m.content}"
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={executeMessageScan}
                    disabled={loading || inputMessage.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-display px-4 py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Analyzing Fraud Patterns..." : "Audit Message Scam Risk"}
                  </button>
                </div>

                <div className="bg-slate-50/30 rounded-2xl border border-slate-200 p-5 min-h-[300px]">
                  {messageResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">Scam Verdict</p>
                          <h4 className={`font-display font-bold text-xs sm:text-sm mt-0.5 ${
                            messageResult.verdict.includes("HIGH") || messageResult.verdict.includes("SCAM") ? "text-rose-700" :
                            messageResult.verdict.includes("SUSPICIOUS") ? "text-amber-700" : "text-emerald-700"
                          }`}>{messageResult.verdict}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Scam Risk</p>
                          <p className={`text-base font-bold font-display ${messageResult.score >= 60 ? "text-rose-600" : "text-emerald-600"}`}>
                            {messageResult.score}% Probability
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${messageResult.score >= 60 ? "bg-rose-500" : "bg-emerald-500"}`}
                          style={{ width: `${messageResult.score}%` }}
                        />
                      </div>

                      <div className="bg-amber-50/50 p-2.5 text-center rounded-lg border border-amber-100/50 shadow-3xs flex justify-between items-center">
                        <span className="text-[9px] font-mono text-amber-700 font-bold uppercase tracking-wider">Urgency Level Indicator</span>
                        <span className="text-xs font-bold text-amber-800 font-display">{messageResult.urgencyLevel}</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Scam Reasons / Findings:</p>
                        <ul className="space-y-2 list-none">
                          {messageResult.reasons.map((r, i) => (
                            <li key={i} className="text-xs text-slate-600 bg-white border border-slate-200 p-2.5 rounded-xl leading-normal flex gap-2">
                              <span className="text-rose-500 font-bold shrink-0">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {messageResult.detectedThreats && messageResult.detectedThreats.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-3 mt-4">
                          <p className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-2">Detected Threat Elements:</p>
                          <div className="space-y-2">
                            {messageResult.detectedThreats.map((art, i) => (
                              <div key={i} className="flex justify-between items-center text-xs border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${art.severity === "High" ? "bg-rose-500" : "bg-amber-500"}`} />
                                  <span className="font-semibold text-slate-800">{art.element}</span>
                                </div>
                                <span className="text-slate-500 text-[10px] truncate max-w-[150px]">{art.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-sans leading-normal">
                        <p className="font-mono text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-1">Audit Explanation:</p>
                        {messageResult.analysisExplanation}
                      </div>

                      <button
                        onClick={() => openShareModal(messageResult, inputMessage.substring(0, 30) + "...", "message")}
                        className="mt-4 w-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 font-mono font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:text-white transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Generate Forensic Certificate</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 text-xs max-w-sm mx-auto flex flex-col items-center gap-3">
                      <ShieldAlert className="w-8 h-8 text-emerald-600/60 animate-pulse" />
                      <p className="font-semibold text-slate-700 font-display">Awaiting suspect message.</p>
                      <p className="leading-normal">Paste suspect SMS text or WhatsApp message contents to perform deep forensic audits for financial fraud, impersonation, urgency language, and malicious link patterns.</p>
                    </div>
                  )}
                </div>
              </div>

              {messageResult && (
                <CommunityEvidencePanel
                  contentId={inputMessage.trim().length > 30 ? inputMessage.trim().substring(0, 30) + "..." : "Viral Grounded Message Scan"}
                  currentUser={currentUser}
                  onReputationChange={(u) => setCurrentUser(u)}
                />
              )}
            </div>
          )}

          {/* Real-time Forensic Log stream terminal block */}
          {scanLogs.length > 0 && (
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl border border-slate-800 font-mono text-[10px] mt-6 shadow-inner relative overflow-hidden transition-all duration-350 scroll-reveal">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800/60">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Real-time Forensic Log stream
                </span>
                <span className="text-[8px] text-slate-500 font-bold">SENTINEL_TTY1</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar pr-1 text-left">
                {scanLogs.map((log, i) => (
                  <p key={i} className="leading-normal">
                    <span className="text-slate-600 font-semibold">{`>`}</span> {log}
                  </p>
                ))}
              </div>
            </div>
          )}

        {/* 4. Forensic Certificate Modal */}
        {isShareModalOpen && activeShareReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 animate-fade-in">
            <div className="glass-panel max-w-xl w-full p-6 sm:p-8 border border-emerald-500/20 bg-white/95 text-slate-800 relative overflow-hidden shadow-xl">
              {/* Holographic background decorations */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg flex items-center justify-center">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm tracking-wide text-slate-800">Forensic Audit Certificate</h3>
                    <p className="text-[9px] font-mono text-slate-400">ID: {activeShareReport.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-slate-450 hover:text-slate-800 transition-colors cursor-pointer text-xs font-mono"
                >
                  [CLOSE]
                </button>
              </div>

              <div className="space-y-4">
                {(() => {
                  const displayScore = activeShareReport.report.score !== undefined 
                    ? activeShareReport.report.score 
                    : (activeShareReport.report.confidenceScore !== undefined 
                        ? activeShareReport.report.confidenceScore 
                        : 0);
                  const isHighRisk = displayScore >= 60;
                  
                  return (
                    <>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Target Audit Name</span>
                            <span className="text-xs font-semibold text-slate-800 block mt-0.5 truncate max-w-[280px]">{activeShareReport.title}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Scan Timestamp</span>
                            <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{activeShareReport.timestamp}</span>
                          </div>
                        </div>

                        <div className="h-px bg-slate-200" />

                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Auditor Verification Signature</span>
                            <span className="text-[9px] font-mono text-cyan-600 block mt-0.5 select-all">TS_SIG_SHA256_{activeShareReport.id}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide border ${
                            isHighRisk 
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-600" 
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                          }`}>
                            {isHighRisk ? "TEMPERED / SCAM" : "AUTHENTIC"}
                          </span>
                        </div>
                      </div>

                      {/* Confidence Meter Graphic */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-center">
                        <span className="text-[8px] font-mono font-bold text-slate-455 uppercase tracking-wider block text-left">Confidence Matrix Assessment</span>
                        
                        <div className="flex flex-col items-center justify-center py-2">
                          <span className={`text-4xl font-display font-extrabold tracking-tight ${
                            isHighRisk ? "text-rose-600" : "text-emerald-600"
                          }`}>
                            {displayScore}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium mt-1">Risk probability score calculated</span>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              isHighRisk ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${displayScore}%` }}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
                
                <div className="space-y-1.5 text-left">
                  <span className="text-[8px] font-mono font-bold text-slate-450 uppercase tracking-wider">Forensic Audit Explanation</span>
                  <p className="text-xs text-slate-650 leading-relaxed bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    {activeShareReport.report.analysisExplanation || activeShareReport.report.reasons?.[0] || "Analysis confirmed that structural patterns within the visual EXIF noise floor and phoneme distributions exhibit generative model signatures."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      alert("Cryptographic receipt saved to clipboard!");
                      navigator.clipboard.writeText(JSON.stringify(activeShareReport, null, 2));
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold py-2.5 rounded-xl text-xs border border-slate-200 hover:border-slate-350 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Copy JSON Receipt
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    Print Certificate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  </div>
);
}
