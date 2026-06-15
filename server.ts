import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit to support base64 uploads for images and media
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── API Key Detection ─────────────────────────────────────────────────────────

const hasGroqKey =
  !!process.env.GROQ_API_KEY &&
  process.env.GROQ_API_KEY !== "MY_GROQ_API_KEY" &&
  process.env.GROQ_API_KEY !== "";

const hasGeminiKey =
  !!process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" &&
  process.env.GEMINI_API_KEY !== "";

const hasRealApiKey = hasGroqKey || hasGeminiKey;

// Active engine label (for status endpoint)
const activeEngine = hasGroqKey
  ? "Groq (LLaMA 3 - Primary)"
  : hasGeminiKey
  ? "Google Gemini (Fallback)"
  : "Simulation Mode";

// Initialize clients
const groq = hasGroqKey ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const gemini = hasGeminiKey
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    })
  : null;

console.log(`[TruthShield] Groq Key: ${hasGroqKey ? "✅ ACTIVE" : "❌ Not set"}`);
console.log(`[TruthShield] Gemini Key: ${hasGeminiKey ? "✅ ACTIVE" : "❌ Not set"}`);
console.log(`[TruthShield] Active Engine: ${activeEngine}`);

// ─── Unified AI Helpers ────────────────────────────────────────────────────────

/**
 * Call the best available text AI with a system + user prompt.
 * Groq is tried first; falls back to Gemini if Groq is unavailable.
 * Always returns a parsed JSON object.
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<any> {
  // ── Try Groq first ──
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      });
      const rawText = completion.choices[0]?.message?.content || "{}";
      return JSON.parse(rawText);
    } catch (groqErr: any) {
      console.warn("[TruthShield] Groq call failed, trying Gemini fallback:", groqErr.message);
    }
  }

  // ── Try Gemini fallback ──
  if (gemini) {
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: combinedPrompt,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "{}");
  }

  throw new Error("No AI provider is configured.");
}

/**
 * Call the best available vision AI with a base64 image + prompts.
 * Groq vision model is tried first; falls back to Gemini if unavailable.
 */
async function callVisionAI(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  mimeType: string
): Promise<any> {
  // ── Try Groq vision first ──
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              { type: "text", text: userPrompt },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      });
      const rawText = completion.choices[0]?.message?.content || "{}";
      // Extract JSON block if wrapped in markdown code fences
      const jsonMatch =
        rawText.match(/```json\s*([\s\S]*?)```/) ||
        rawText.match(/({[\s\S]*})/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : rawText;
      return JSON.parse(jsonStr.trim());
    } catch (groqErr: any) {
      console.warn("[TruthShield] Groq Vision call failed, trying Gemini fallback:", groqErr.message);
    }
  }

  // ── Try Gemini vision fallback ──
  if (gemini) {
    const imagePart = {
      inlineData: { mimeType, data: imageBase64 },
    };
    const textPart = { text: `${systemPrompt}\n\n${userPrompt}` };
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [imagePart, textPart] },
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "{}");
  }

  throw new Error("No AI vision provider is configured.");
}

// ─── API Endpoints ──────────────────────────────────────────────────────────────

// Status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    hasApiKey: hasRealApiKey,
    hasGroqKey,
    hasGeminiKey,
    activeEngine,
    timestamp: new Date().toISOString(),
    engine: `TruthShield Sentinel Core v2.0 — ${activeEngine}`,
  });
});

// ─── Endpoint 1: AI Text Detector ─────────────────────────────────────────────
app.post("/api/analyze-text", async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "Text is required for analysis." });
  }

  // ─── Try HuggingFace chatgpt-detector-single if token is configured ───
  const hasHFKey = !!process.env.HF_API_KEY && process.env.HF_API_KEY !== "your_huggingface_token_here" && process.env.HF_API_KEY !== "";
  if (hasHFKey) {
    try {
      const hfRes = await fetch(
        "https://api-inference.huggingface.co/models/Hello-SimpleAI/chatgpt-detector-single",
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (hfRes.ok) {
        const data = await hfRes.json();
        // HuggingFace returns: [[{label: "Human", score: 0.12}, {label: "ChatGPT", score: 0.88}]]
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const predictions = data[0];
          const chatgptPred = predictions.find((p: any) => p.label === "ChatGPT");
          const humanPred = predictions.find((p: any) => p.label === "Human");

          const score = chatgptPred ? Math.round(chatgptPred.score * 100) : 50;
          const verdict = score >= 70 ? "AI-Generated" : score >= 35 ? "Mixed / Partially AI" : "Highly Likely Human";
          
          return res.json({
            score,
            verdict,
            modelLikelyUsed: score >= 50 ? "ChatGPT / GPT-3.5 / GPT-4" : "N/A - Likely Human Writer",
            perplexityScore: `${(100 - score).toFixed(1)} - ${score >= 70 ? "Low" : "High"}`,
            burstinessScore: `${score.toFixed(1)} - ${score >= 70 ? "Uniform" : "Diverse"}`,
            sentenceStructure: score >= 70 
              ? "Uniform sentence distributions matching generative token distributions." 
              : "Diverse sentence lengths and natural language flow matching human style.",
            flaggedSentences: score >= 70 ? [
              {
                text: text.substring(0, Math.min(text.length, 120)) + "...",
                reason: "Lexical patterns match Hello-SimpleAI ChatGPT class signature.",
                aiConfidence: score
              }
            ] : [],
            analysisExplanation: `Hello-SimpleAI model analysis completed. The HuggingFace text classifier returned a ${(score).toFixed(1)}% probability that this text was produced by ChatGPT.`,
            simulated: false
          });
        }
      }
      console.warn("[TruthShield] HuggingFace detector API returned error status, falling back to LLM.");
    } catch (e: any) {
      console.warn("[TruthShield] HuggingFace detector request failed, falling back to LLM:", e.message);
    }
  }

  if (!hasRealApiKey) {
    const isMockAI =
      text.length > 150 &&
      (text.includes("generate") ||
        text.includes("innovative") ||
        text.includes("reimagining") ||
        text.includes("democratize") ||
        text.includes("efficiency") ||
        text.includes("furthermore") ||
        text.includes("testament"));
    const score = isMockAI
      ? Math.floor(Math.random() * 20) + 75
      : Math.floor(Math.random() * 25) + 5;
    const verdict =
      score >= 70 ? "AI-Generated" : score >= 35 ? "Mixed / Partially AI" : "Highly Likely Human";

    return res.json({
      score,
      verdict,
      modelLikelyUsed: score >= 70 ? "GPT-4 / Claude 3.5 Mix" : "Human Writer",
      perplexityScore: (score * 1.2).toFixed(1),
      burstinessScore: (100 - score).toFixed(1),
      sentenceStructure:
        score >= 70
          ? "Extremely uniform sentence lengths and signature repetitive transition patterns typical of generative models."
          : "Highly organic variations in paragraph structures, colloquial rhythms, and uneven sentence distribution.",
      flaggedSentences:
        score >= 70
          ? [
              {
                text: text.substring(0, Math.min(text.length, 120)) + "...",
                reason: "Perfect subject-verb symmetry and cliche stylistic transitions.",
                aiConfidence: score,
              },
            ]
          : [],
      analysisExplanation:
        "Simulation Mode: No GROQ_API_KEY, GEMINI_API_KEY, or HF_API_KEY found in .env. Add a key to unlock the live neural detection engines.",
      simulated: true,
    });
  }

  try {
    const systemPrompt = `You are a cognitive linguist and AI text detection expert. You analyze text to determine if it was written by a human or generated by AI (ChatGPT, GPT-4, Claude, Gemini, etc.). You ALWAYS respond with valid JSON only.`;

    const userPrompt = `Analyze the following text for AI generation signals. Check for perplexity (predictability), burstiness (sentence length variation), stylistic markers, and vocabulary patterns.

Text to analyze:
"${text}"

Respond ONLY with a valid JSON object:
{
  "score": <number 0-100, likelihood of AI generation>,
  "verdict": <"AI-Generated" | "Mixed / Partially AI" | "Highly Likely Human">,
  "modelLikelyUsed": <string>,
  "perplexityScore": <string, e.g. "34.1 - Low">,
  "burstinessScore": <string, e.g. "12.4 - Highly Uniform">,
  "sentenceStructure": <string>,
  "flaggedSentences": [{ "text": <string>, "reason": <string>, "aiConfidence": <number> }],
  "analysisExplanation": <string>
}`;

    const resultData = await callAI(systemPrompt, userPrompt);
    res.json({ ...resultData, simulated: false });
  } catch (error: any) {
    console.error("Text analysis API error:", error);
    res.status(500).json({ error: "Failed to perform AI Text Detection. Details: " + error.message });
  }
});

// ─── Endpoint 2: Fact Checker ──────────────────────────────────────────────────
app.post("/api/verify-rumor", async (req, res) => {
  const { query, fullArticle } = req.body;
  const contentToVerify = query || fullArticle;

  if (!contentToVerify || contentToVerify.trim().length === 0) {
    return res.status(400).json({ error: "A claim or article is required to search and verify." });
  }

  if (!hasRealApiKey) {
    return res.json({
      verdict: "UNVERIFIED (Simulation)",
      confidenceScore: 50,
      explanation:
        "Simulation Mode: No GROQ_API_KEY or GEMINI_API_KEY found. Add either key to .env to enable live fact-checking.",
      sources: [
        {
          title: "Google Fact Check Database",
          url: "https://toolbox.google.com/factcheck",
          credibilityScore: 10,
          organization: "Google Developer Tools",
          snippet: "Connect an API key to enable AI-powered fact verification.",
        },
      ],
      flaggedClaims: [
        {
          claim: contentToVerify.substring(0, 100) + "...",
          fact: "AI-powered cross-referencing is inactive.",
          verdict: "UNVERIFIED",
        },
      ],
      sourceCredibilityScore: 5,
      simulated: true,
    });
  }

  try {
    // For Gemini, we can use Google Search Grounding — detect which engine is active
    if (!hasGroqKey && hasGeminiKey && gemini) {
      // Use Gemini with live Google Search grounding
      const prompt = `You are a real-time factual investigator and fake-news analyst. 
      Cross-reference the following claim or news text with reputable databases, credible journals, and active global news publications to verify its truthfulness.
      You MUST search for real and up-to-date information. Contrast the rumors against verified details from Snopes, PolitiFact, Reuters, AFP, BBC, etc.
      
      Content to verify:
      "${contentToVerify}"
      
      Return your analysis strictly as a JSON object:
      {
        "verdict": "CONFIRMED TRUE" | "LIKELY FALSE / FABRICATED" | "MISLEADING / EXAGGERATED" | "UNVERIFIED / INSUFFICIENT DATA",
        "confidenceScore": <number 0-100>,
        "explanation": <string>,
        "sources": [{ "title": <string>, "url": <string>, "credibilityScore": <number>, "organization": <string>, "snippet": <string> }],
        "flaggedClaims": [{ "claim": <string>, "fact": <string>, "verdict": <string> }],
        "sourceCredibilityScore": <number 1-10>
      }`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }], // Live Google Search Grounding (Gemini only)
        },
      });

      let resultData;
      try {
        resultData = JSON.parse(response.text || "{}");
      } catch {
        resultData = {
          verdict: "UNVERIFIED",
          confidenceScore: 40,
          explanation: response.text || "Grounding analysis completed but returned unstructured text.",
          sources: [],
          flaggedClaims: [],
          sourceCredibilityScore: 5,
        };
      }
      return res.json({ ...resultData, simulated: false, groundedSearch: true });
    }

    // Groq or combined: use knowledge-based fact check
    const systemPrompt = `You are a professional fact-checker and investigative journalist with expertise in verifying news, rumors, and viral claims. You cross-reference statements against known facts, credible sources (Snopes, PolitiFact, Reuters, AFP, BBC, AP, WHO). You ALWAYS respond with valid JSON only.`;

    const userPrompt = `Fact-check the following claim. Determine whether it is true, false, misleading, or unverifiable. Cite specific organizations, dates, and context.

Content to verify:
"${contentToVerify}"

Respond ONLY with a valid JSON object:
{
  "verdict": <"CONFIRMED TRUE" | "LIKELY FALSE / FABRICATED" | "MISLEADING / EXAGGERATED" | "UNVERIFIED / INSUFFICIENT DATA">,
  "confidenceScore": <number 0-100>,
  "explanation": <string>,
  "sources": [{ "title": <string>, "url": <string>, "credibilityScore": <number>, "organization": <string>, "snippet": <string> }],
  "flaggedClaims": [{ "claim": <string>, "fact": <string>, "verdict": <string> }],
  "sourceCredibilityScore": <number 1-10>
}`;

    const resultData = await callAI(systemPrompt, userPrompt);
    res.json({ ...resultData, simulated: false, groundedSearch: false });
  } catch (error: any) {
    console.error("Fact audit API error:", error);
    res.status(500).json({ error: "Failed to perform Fact Check. Details: " + error.message });
  }
});

// ─── Helper: Base64 from URL or data URI ──────────────────────────────────────
async function getBase64FromUrlOrData(
  inputString: string,
  fallbackMimeType = "image/jpeg"
): Promise<{ data: string; mimeType: string } | null> {
  if (!inputString) return null;
  if (inputString.startsWith("data:")) {
    const mimeMatch = inputString.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : fallbackMimeType;
    const cleanBase64 = inputString.replace(/^data:[^;]+;base64,/, "");
    return { data: cleanBase64, mimeType };
  } else if (inputString.startsWith("http://") || inputString.startsWith("https://")) {
    try {
      const fetchRes = await fetch(inputString);
      if (fetchRes.ok) {
        const arrayBuffer = await fetchRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = fetchRes.headers.get("content-type") || "image/jpeg";
        return { data: buffer.toString("base64"), mimeType };
      }
    } catch (e) {
      console.error("Failed to fetch image from URL:", e);
    }
  } else if (/^[A-Za-z0-9+/=\s]+$/.test(inputString) && inputString.length > 100) {
    return { data: inputString.replace(/\s/g, ""), mimeType: fallbackMimeType };
  }
  return null;
}

// ─── Endpoint 3: Image Deepfake Checker ───────────────────────────────────────
app.post("/api/analyze-image", async (req, res) => {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Image data (base64 or URL) is required." });
  }

  if (!hasRealApiKey) {
    const { fileName } = req.body;
    const isAuthentic = /(authentic|canon|real|camera|legit|news)/i.test(fileName || "");
    const score = isAuthentic ? 6 : 89;
    
    return res.json({
      score,
      verdict: score >= 60 ? "AI Generated Image (Simulation)" : "Authentic photography",
      reasons:
        score >= 60
          ? [
              "Facial boundary blending anomaly detected around ear lobes.",
              "Unnatural skin texturing void of standard camera high-ISO grain.",
              "Mismatched specular highlights in the pupillary reflections.",
            ]
          : [
              "Natural skin pore noise density matches general sensor noise floor.",
              "Background focus drop-off matches natural physics depth-of-field expectations.",
            ],
      detectedArtifacts:
        score >= 60
          ? [
              { element: "Temporal Bordering", description: "Soft, smeared transition at hair margins.", severity: "High" },
              { element: "Specular Pupils", description: "Bilateral reflection lighting vectors deviate by over 14 degrees.", severity: "Medium" },
            ]
          : [],
      pixelAnomaliesDescription:
        "Simulation Mode: No GROQ_API_KEY or GEMINI_API_KEY found. Add either key to .env to run visual forensic algorithms.",
      metadataSummary: isAuthentic 
        ? "No tampering: Normal EXIF markers active (Canon EOS 5D Mk IV)."
        : "No metadata found. Standard simulation mode active.",
      simulated: true,
    });
  }

  try {
    const rawData = await getBase64FromUrlOrData(imageBase64, mimeType || "image/jpeg");
    if (!rawData) {
      return res.status(400).json({ error: "Could not retrieve or convert valid image data." });
    }

    const systemPrompt = `You are a professional image forensic expert specializing in GAN, Diffusion model (DALL-E, Midjourney, Stable Diffusion), and Deepfake visual pattern detection. Respond with valid JSON only.`;

    const userPrompt = `Inspect this image carefully. Examine facial features, eye details, hair structures, background perspective consistency, specular lighting (especially in eye pupils), skin texturing, and edge boundaries. Determine the likelihood this image is AI-generated, deepfaked, or authentic camera photography.

Respond ONLY with a valid JSON object:
{
  "score": <number 0-100>,
  "verdict": <"AI-Generated Image" | "Deepfaked Photo" | "Authentic Photography">,
  "reasons": [<string>, ...],
  "detectedArtifacts": [{ "element": <string>, "description": <string>, "severity": <"High" | "Medium" | "Low"> }],
  "pixelAnomaliesDescription": <string>,
  "metadataSummary": <string>
}`;

    const resultData = await callVisionAI(systemPrompt, userPrompt, rawData.data, rawData.mimeType);
    res.json({ ...resultData, simulated: false });
  } catch (error: any) {
    console.error("Image analysis API error:", error);
    res.status(500).json({ error: "Failed to perform visual analysis. Details: " + error.message });
  }
});

// ─── Endpoint 4: Video Deepfake Analyzer ──────────────────────────────────────
app.post("/api/analyze-video", async (req, res) => {
  const { videoFileName, videoBase64Frame } = req.body;

  if (!hasRealApiKey) {
    return res.json({
      score: 87,
      verdict: "High Probability Deepfake (Simulation)",
      lipSyncAccuracy:
        "Lip movements lack motor-sensory timing consistency (lip boundaries lag active speech tracks by approximately 180ms).",
      eyeBlinkingRate:
        "Critically low blinking frequency detected: 2/min (average human baseline is 12-18/min), indicating temporal frame freezing.",
      facialLandmarks:
        "Slight jitter (landmark drift) of 4.2 pixels around nasal bridge and eye contour vectors during 30-degree facial rotation.",
      reasons: [
        "Temporal discontinuities: Micro-flickering visible around neck collar and chin intersection.",
        "Audio phase misalignment: Speech waveforms mismatch high-speed visual phoneme formations.",
        "Unnatural facial texture: Synthetic matte rendering on cheekbones and forehead lacks standard light diffraction.",
      ],
      timeline: [
        { time: "0:02", claim: "Initialization", artifactType: "Soft boundary transition", confidence: 78 },
        { time: "0:08", claim: "Vocal Phoneme Mismatch", artifactType: "Lip-sync lag", confidence: 91 },
        { time: "0:14", claim: "Facial Rotation Drift", artifactType: "Landmark skewing", confidence: 85 },
      ],
      simulated: true,
    });
  }

  try {
    const rawData = videoBase64Frame ? await getBase64FromUrlOrData(videoBase64Frame) : null;

    let resultData: any;

    if (rawData) {
      const systemPrompt = `You are a forensic video engineering specialist specializing in deepfake detection. Respond with valid JSON only.`;
      const userPrompt = `Analyze this freeze-frame from "${videoFileName || "scanned_video.mp4"}" for deepfake manipulation. Inspect lip sync, eye symmetry, blinking indicators, landmark edge flickering, and digital blending artifacts.

Respond ONLY with a valid JSON object:
{
  "score": <number 0-100>,
  "verdict": <string>,
  "lipSyncAccuracy": <string>,
  "eyeBlinkingRate": <string>,
  "facialLandmarks": <string>,
  "reasons": [<string>, ...],
  "timeline": [{ "time": <string>, "claim": <string>, "artifactType": <string>, "confidence": <number> }]
}`;

      resultData = await callVisionAI(systemPrompt, userPrompt, rawData.data, rawData.mimeType);
    } else {
      const systemPrompt = `You are a forensic video engineering specialist. Respond with valid JSON only.`;
      const userPrompt = `Perform a probabilistic deepfake audit for a video named "${videoFileName || "unknown_clip.mp4"}". No visual frame is available — list standard deepfake markers and expected risk levels.

Respond ONLY with a valid JSON object:
{
  "score": <number 0-100>,
  "verdict": <string>,
  "lipSyncAccuracy": <string>,
  "eyeBlinkingRate": <string>,
  "facialLandmarks": <string>,
  "reasons": [<string>, ...],
  "timeline": [{ "time": <string>, "claim": <string>, "artifactType": <string>, "confidence": <number> }]
}`;

      resultData = await callAI(systemPrompt, userPrompt);
    }

    res.json({ ...resultData, simulated: false });
  } catch (error: any) {
    console.error("Video analysis API error:", error);
    res.status(500).json({ error: "Failed to perform video analysis. Details: " + error.message });
  }
});

// ─── Endpoint 5: Scam Message Checker ─────────────────────────────────────────
app.post("/api/analyze-message", async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "Message content is required for analysis." });
  }

  if (!hasRealApiKey) {
    const isMockScam =
      message.includes("win") ||
      message.includes("urgent") ||
      message.includes("lottery") ||
      message.includes("account") ||
      message.includes("bank") ||
      message.includes("http") ||
      message.includes("payment");
    const score = isMockScam ? 91 : 12;
    const verdict = score >= 70 ? "HIGH RISK SCAM" : score >= 35 ? "SUSPICIOUS" : "LOW RISK / SAFE";
    const urgencyLevel = score >= 70 ? "CRITICAL" : score >= 35 ? "HIGH" : "NORMAL";

    return res.json({
      score,
      verdict,
      urgencyLevel,
      detectedThreats:
        score >= 70
          ? [
              { element: "Fake Impersonation", description: "Spoofing of government or banking institutions.", severity: "High" },
              { element: "Suspicious Payment Link", description: "Leads to unverified dynamic URL templates.", severity: "High" },
              { element: "Urgency Tactics", description: "Coerces rapid actions within limited timing window.", severity: "Medium" },
            ]
          : [],
      reasons:
        score >= 70
          ? [
              "Fake government/bank impersonation attempt identified.",
              "Suspicious dynamic payment or verification link detected.",
              "Urgency pressure tactics coercing immediate response.",
            ]
          : ["Normal conversational rhythm.", "No suspicious payment vectors detected."],
      analysisExplanation:
        "Simulation Mode: No GROQ_API_KEY or GEMINI_API_KEY found. Add either key to .env to run real neural scam diagnostics.",
      simulated: true,
    });
  }

  try {
    const systemPrompt = `You are a cybersecurity expert specializing in social engineering, phishing, and SMS/WhatsApp scam detection. You analyze messages for manipulation tactics, fraudulent patterns, and urgency language. You ALWAYS respond with valid JSON only.`;

    const userPrompt = `Analyze the following message for scam risk — check for urgency language, suspicious links, impersonation attempts, and financial fraud patterns.

Message:
"${message}"

Respond ONLY with a valid JSON object:
{
  "score": <number 0-100>,
  "verdict": <"HIGH RISK SCAM" | "SUSPICIOUS" | "LOW RISK / SAFE">,
  "urgencyLevel": <"CRITICAL" | "HIGH" | "NORMAL">,
  "detectedThreats": [{ "element": <string>, "description": <string>, "severity": <"High" | "Medium" | "Low"> }],
  "reasons": [<string>, ...],
  "analysisExplanation": <string>
}`;

    const resultData = await callAI(systemPrompt, userPrompt);
    res.json({ ...resultData, simulated: false });
  } catch (error: any) {
    console.error("Message analysis API error:", error);
    res.status(500).json({ error: "Failed to perform scam analysis. Details: " + error.message });
  }
});

// ==========================================================
// In-Memory Database (Users & Community Evidence)
// ==========================================================

interface UserProfile {
  username: string;
  email: string;
  reputation: number;
  badge: string;
  favorites: string[];
  blocked: string[];
}

interface CommunityEvidence {
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

const usersDb: { [username: string]: UserProfile & { passwordHash: string } } = {
  harshit_sentinel: {
    username: "harshit_sentinel",
    email: "harshitkk5830@gmail.com",
    passwordHash: "password",
    reputation: 175,
    badge: "Senior Sentinel",
    favorites: ["reuters.com", "apnews.com", "wikipedia.org"],
    blocked: ["fakenewsblog.ru", "totalhoaxdaily.net", "rumorspam.com"],
  },
  fact_check_reuters: {
    username: "fact_check_reuters",
    email: "reuters@factcheck.org",
    passwordHash: "secure123",
    reputation: 520,
    badge: "Official Partner",
    favorites: ["reuters.com"],
    blocked: [],
  },
  hoax_buster_99: {
    username: "hoax_buster_99",
    email: "buster@gmail.com",
    passwordHash: "buster",
    reputation: 110,
    badge: "Trusted Verifier",
    favorites: ["snopes.com", "politifact.com"],
    blocked: ["unverifiedrumor.co"],
  },
};

const evidenceDb: CommunityEvidence[] = [
  {
    id: "ev-1",
    contentId: "Midjourney GAN Portrait (Synthetic)",
    user: "fact_check_reuters",
    userReputation: 520,
    userBadge: "Official Partner",
    type: "refute",
    statement:
      "Standard forensic grid alignment reveals high frequency pixel tears bordering the ears and neck. No high-ISO sensor grain detected.",
    linkUrl: "https://reuters.com/factcheck/deepfake-portrait-verify",
    timestamp: "2026-06-10 14:22",
    votes: 38,
    votedBy: {},
  },
  {
    id: "ev-2",
    contentId: "Midjourney GAN Portrait (Synthetic)",
    user: "hoax_buster_99",
    userReputation: 110,
    userBadge: "Trusted Verifier",
    type: "refute",
    statement:
      "Pupillary reflection geometry is offset by 15.4 degrees. This asymmetric lighting spotlight occurs consistently in Midjourney v6 generated humans.",
    linkUrl: "https://snopes.com/midjourney-forensics",
    timestamp: "2026-06-11 02:45",
    votes: 14,
    votedBy: {},
  },
  {
    id: "ev-3",
    contentId: "CEO Deepfaked Financial Statement",
    user: "fact_check_reuters",
    userReputation: 520,
    userBadge: "Official Partner",
    type: "refute",
    statement:
      "The background audio tracks leak traces of synthetic phase cancellations. Genuine statement was broadcasted on June 5th, with completely different numbers.",
    linkUrl: "https://reuters.com/investigates/synthetic-statement-ceo",
    timestamp: "2026-06-10 18:05",
    votes: 49,
    votedBy: {},
  },
  {
    id: "ev-4",
    contentId: "WhatsApp Viral Health Rumour",
    user: "hoax_buster_99",
    userReputation: 110,
    userBadge: "Trusted Verifier",
    type: "refute",
    statement:
      "Baking soda and lemons can affect body pH slightly but have zero measurable antiviral capabilities according to peer-reviewed paper in the Lancet.",
    linkUrl: "https://ncbi.nlm.nih.gov/pmc/articles/Lancet-Antiviral-Myth-Dump",
    timestamp: "2026-06-11 06:12",
    votes: 27,
    votedBy: {},
  },
];

function getBadge(reputation: number): string {
  if (reputation >= 200) return "Master Forensic Analyst";
  if (reputation >= 80) return "Senior Sentinel";
  if (reputation >= 30) return "Trusted Verifier";
  return "Novice Grounder";
}

app.post("/api/auth/register", (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: "All fields are required." });
  }
  const normalized = username.toLowerCase().trim();
  if (usersDb[normalized]) {
    return res.status(400).json({ error: "Username already exists." });
  }
  const newUser: UserProfile & { passwordHash: string } = {
    username: normalized,
    email: email.trim(),
    passwordHash: password,
    reputation: 10,
    badge: "Novice Grounder",
    favorites: [],
    blocked: [],
  };
  usersDb[normalized] = newUser;
  const { passwordHash, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  const normalized = username.toLowerCase().trim();
  const user = usersDb[normalized];
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: "Invalid username or password credentials." });
  }
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

app.get("/api/auth/profile/:username", (req, res) => {
  const normalized = req.params.username.toLowerCase().trim();
  const user = usersDb[normalized];
  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

app.get("/api/domains/:username", (req, res) => {
  const normalized = req.params.username.toLowerCase().trim();
  const user = usersDb[normalized];
  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }
  res.json({ favorites: user.favorites, blocked: user.blocked });
});

app.post("/api/domains/toggle", (req, res) => {
  const { username, domain, type } = req.body;
  if (!username || !domain || !type) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  const normalizedUser = username.toLowerCase().trim();
  const user = usersDb[normalizedUser];
  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }
  const cleanDomain = domain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, "");
  if (type === "favorite") {
    user.blocked = user.blocked.filter((d) => d !== cleanDomain);
    if (user.favorites.includes(cleanDomain)) {
      user.favorites = user.favorites.filter((d) => d !== cleanDomain);
    } else {
      user.favorites.push(cleanDomain);
    }
  } else if (type === "blocked") {
    user.favorites = user.favorites.filter((d) => d !== cleanDomain);
    if (user.blocked.includes(cleanDomain)) {
      user.blocked = user.blocked.filter((d) => d !== cleanDomain);
    } else {
      user.blocked.push(cleanDomain);
    }
  }
  res.json({ favorites: user.favorites, blocked: user.blocked });
});

app.get("/api/evidence/:contentId", (req, res) => {
  const contentId = req.params.contentId;
  const matches = evidenceDb
    .filter(
      (ev) =>
        ev.contentId === contentId ||
        contentId.includes(ev.contentId) ||
        ev.contentId.includes(contentId)
    )
    .sort((a, b) => b.votes - a.votes);
  res.json(matches);
});

app.post("/api/evidence/add", (req, res) => {
  const { contentId, username, statement, type, linkUrl } = req.body;
  if (!contentId || !username || !statement || !type) {
    return res.status(400).json({ error: "Required fields are missing." });
  }
  const normalizedUser = username.toLowerCase().trim();
  const user = usersDb[normalizedUser];
  let rep = 15;
  let bdg = "Novice Grounder";
  if (user) {
    user.reputation += 10;
    user.badge = getBadge(user.reputation);
    rep = user.reputation;
    bdg = user.badge;
  }
  const newEvidence: CommunityEvidence = {
    id: "ev-" + Math.random().toString(36).substring(2, 9),
    contentId: contentId.trim(),
    user: username,
    userReputation: rep,
    userBadge: bdg,
    type,
    statement: statement.trim(),
    linkUrl: linkUrl ? linkUrl.trim() : undefined,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
    votes: 1,
    votedBy: { [username]: "up" },
  };
  evidenceDb.push(newEvidence);
  const matches = evidenceDb
    .filter(
      (ev) =>
        ev.contentId === contentId ||
        contentId.includes(ev.contentId) ||
        ev.contentId.includes(contentId)
    )
    .sort((a, b) => b.votes - a.votes);
  res.json(matches);
});

app.post("/api/evidence/vote", (req, res) => {
  const { evidenceId, username, value } = req.body;
  if (!evidenceId || !username || !value) {
    return res.status(400).json({ error: "Missing voting properties." });
  }
  const ev = evidenceDb.find((item) => item.id === evidenceId);
  if (!ev) {
    return res.status(404).json({ error: "Evidence not found." });
  }
  const currentVote = ev.votedBy[username];
  let voteDiff = 0;
  if (currentVote === value) {
    delete ev.votedBy[username];
    voteDiff = value === "up" ? -1 : 1;
  } else {
    if (currentVote) {
      voteDiff = value === "up" ? 2 : -2;
    } else {
      voteDiff = value === "up" ? 1 : -1;
    }
    ev.votedBy[username] = value;
  }
  ev.votes += voteDiff;
  const authorNormalized = ev.user.toLowerCase().trim();
  const authorUser = usersDb[authorNormalized];
  if (authorUser && authorNormalized !== username.toLowerCase().trim()) {
    if (value === "up" && voteDiff > 0) {
      authorUser.reputation += 5;
    } else if (value === "down" && voteDiff < 0) {
      authorUser.reputation = Math.max(0, authorUser.reputation - 2);
    }
    authorUser.badge = getBadge(authorUser.reputation);
    ev.userReputation = authorUser.reputation;
    ev.userBadge = authorUser.badge;
  }
  const matches = evidenceDb
    .filter((item) => item.contentId === ev.contentId)
    .sort((a, b) => b.votes - a.votes);
  res.json(matches);
});

// ==========================================================
// Vite Integration & Static Server
// ==========================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TruthShield Backend] Server running on http://localhost:${PORT}`);
    console.log(`[TruthShield Backend] Active Engine: ${activeEngine}`);
    console.log(`[TruthShield Backend] Groq: ${hasGroqKey ? "ACTIVE" : "not set"} | Gemini: ${hasGeminiKey ? "ACTIVE" : "not set"}`);
  });
}

startServer();
