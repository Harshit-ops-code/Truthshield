export interface TextReport {
  score: number;
  verdict: string;
  modelLikelyUsed: string;
  perplexityScore: string;
  burstinessScore: string;
  sentenceStructure: string;
  flaggedSentences: Array<{ text: string; reason: string; aiConfidence: number }>;
  analysisExplanation: string;
  simulated?: boolean;
}

export interface FactReport {
  verdict: string;
  confidenceScore: number;
  explanation: string;
  sources: Array<{ title: string; url: string; credibilityScore: number; organization: string; snippet: string }>;
  flaggedClaims: Array<{ claim: string; fact: string; verdict: string }>;
  sourceCredibilityScore: number;
  simulated?: boolean;
}

export interface ImageReport {
  score: number;
  verdict: string;
  reasons: Array<string>;
  detectedArtifacts: Array<{ element: string; description: string; severity: "High" | "Medium" | "Low" }>;
  pixelAnomaliesDescription: string;
  metadataSummary: string;
  simulated?: boolean;
}

export interface VideoReport {
  score: number;
  verdict: string;
  lipSyncAccuracy: string;
  eyeBlinkingRate: string;
  facialLandmarks: string;
  reasons: Array<string>;
  timeline: Array<{ time: string; claim: string; artifactType: string; confidence: number }>;
  simulated?: boolean;
}

export interface MessageReport {
  score: number;
  verdict: string;
  urgencyLevel: string;
  detectedThreats: Array<{ element: string; description: string; severity: "High" | "Medium" | "Low" }>;
  reasons: Array<string>;
  analysisExplanation: string;
  simulated?: boolean;
}

export type ScanType = "image" | "video" | "text" | "rumor" | "message";

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  type: ScanType;
  title: string;
  verdict: string;
  score: number;
  report: any;
}
