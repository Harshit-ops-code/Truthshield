process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import cors from "cors";
import rateLimit from "express-rate-limit";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(cors({ origin: ['https://truthshield-nu.vercel.app', 'http://localhost:3000'] }));


// ─── Cryptographic Security Utilities ─────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

/**
 * Hash password with bcryptjs
 */
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * Verify password against stored bcryptjs hash
 */
function verifyPassword(password: string, storedHash: string): boolean {
  try {
    return bcrypt.compareSync(password, storedHash);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically signed HMAC token (JWT-like)
 */
function generateToken(payload: object, expiryHours = 24): string {
  const expiresAt = Date.now() + expiryHours * 60 * 60 * 1000;
  const body = Buffer.from(JSON.stringify({ ...payload, expiresAt })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

/**
 * Verify HMAC token and return decoded payload
 */
function verifyToken(token: string): any {
  try {
    const [bodyB64, signature] = token.split(".");
    if (!bodyB64 || !signature) return null;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(bodyB64).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(bodyB64, "base64url").toString("utf8"));
    if (Date.now() > payload.expiresAt) return null; // expired token
    return payload;
  } catch {
    return null;
  }
}

// ─── Security Middlewares ──────────────────────────────────────────────────────

/**
 * Express middleware to enforce authentication via Bearer Token
 */
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token is required. Please login." });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: "Your session has expired or is invalid. Please login again." });
  }
  req.user = payload;
  next();
}

/**
 * Simple in-memory rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function rateLimiter(limit: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown_ip";
    const now = Date.now();
    let record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }
    record.count++;
    rateLimitMap.set(ip, record);
    if (record.count > limit) {
      console.warn(`[SECURITY WARNING] Rate limit exceeded for IP: ${ip} on route: ${req.path}`);
      return res.status(429).json({ error: "Too many requests from this device. Please try again later." });
    }
    next();
  };
}

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests from this IP, please try again after a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: "Strict analysis rate limit reached. Max 3 requests per minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", apiLimiter);
app.use("/api/analyze-image", strictLimiter);
app.use("/api/analyze-video", strictLimiter);

/**
 * Sanitize input values against XSS and limit max string lengths
 */
function sanitize(input: any, maxLength = 5000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}

// Increase body limit to support base64 uploads for images and media
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── API Key Detection ─────────────────────────────────────────────────────────

const hasCerebrasKey =
  !!process.env.CEREBRAS_API_KEY &&
  process.env.CEREBRAS_API_KEY !== "your_cerebras_key_here" &&
  process.env.CEREBRAS_API_KEY !== "";

const hasGroqKey =
  !!process.env.GROQ_API_KEY &&
  process.env.GROQ_API_KEY !== "MY_GROQ_API_KEY" &&
  process.env.GROQ_API_KEY !== "";

const hasGeminiKey =
  !!process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" &&
  process.env.GEMINI_API_KEY !== "";

const hasOpenRouterKey =
  !!process.env.OPENROUTER_API_KEY &&
  process.env.OPENROUTER_API_KEY !== "";

const hasRealApiKey = hasCerebrasKey || hasGroqKey || hasGeminiKey || hasOpenRouterKey;

// Active engine label (for status endpoint)
const activeEngine = hasOpenRouterKey
  ? "OpenRouter (google/gemini-2.5-flash)"
  : hasCerebrasKey
  ? "Cerebras Fast Inference (gpt-oss-120b)"
  : hasGroqKey
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

console.log(`[TruthShield] Cerebras Key: ${hasCerebrasKey ? "✅ ACTIVE" : "❌ Not set"}`);
console.log(`[TruthShield] Groq Key: ${hasGroqKey ? "✅ ACTIVE" : "❌ Not set"}`);
console.log(`[TruthShield] Gemini Key: ${hasGeminiKey ? "✅ ACTIVE" : "❌ Not set"}`);
console.log(`[TruthShield] OpenRouter Key: ${hasOpenRouterKey ? "✅ ACTIVE" : "❌ Not set"}`);
console.log(`[TruthShield] Active Engine: ${activeEngine}`);

// ─── Unified AI Helpers ────────────────────────────────────────────────────────

/**
 * Call the best available text AI with a system + user prompt.
 * Groq is tried first; falls back to Gemini if Groq is unavailable.
 * Always returns a parsed JSON object.
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<any> {
  // ── Try Cerebras first ──
  if (hasCerebrasKey) {
    try {
      const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const rawText = data.choices?.[0]?.message?.content || "{}";
        return JSON.parse(rawText);
      }
      console.warn("[TruthShield] Cerebras call failed with status:", res.status, "trying Groq fallback");
    } catch (cerebrasErr: any) {
      console.warn("[TruthShield] Cerebras call threw error, trying Groq fallback:", cerebrasErr.message);
    }
  }

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
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
      const jsonStr = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}');
      return JSON.parse(jsonStr.slice(start, end + 1));
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

// Health endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Self-ping keep-alive
if (process.env.RENDER_URL) {
  setInterval(() => {
    fetch(`${process.env.RENDER_URL}/health`).catch(() => {});
  }, 14 * 60 * 1000);
}

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
  const text = sanitize(req.body.text, 5000);

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "Text is required for analysis." });
  }

  const hasWAIKey = !!process.env.WAI_API_KEY && process.env.WAI_API_KEY !== "your_wasitaigenerated_token_here" && process.env.WAI_API_KEY !== "";
  if (hasWAIKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const waiRes = await fetch(
        "https://www.wasitaigenerated.com/api/v1/detect/text",
        {
          headers: {
            Authorization: `Bearer ${process.env.WAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ content: text }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (waiRes.ok) {
        const data = await waiRes.json();
        if (data && typeof data.isAI === "boolean") {
          const confidence = typeof data.confidence === "number" ? data.confidence : 0.5;
          const score = data.isAI ? Math.round(confidence * 100) : Math.round((1 - confidence) * 100);
          const verdict = score >= 70 ? "AI-Generated" : score >= 35 ? "Mixed / Partially AI" : "Highly Likely Human";
          
          return res.json({
            score,
            verdict,
            modelLikelyUsed: score >= 50 ? "WasItAIGenerated Classifier" : "Human Writer",
            perplexityScore: `${(100 - score).toFixed(1)} - ${score >= 70 ? "Low" : "High"}`,
            burstinessScore: `${score.toFixed(1)} - ${score >= 70 ? "Uniform" : "Diverse"}`,
            sentenceStructure: score >= 70 
              ? "Uniform sentence distributions matching generative token distributions." 
              : "Diverse sentence lengths and natural language flow matching human style.",
            flaggedSentences: Array.isArray(data.sentences) 
              ? data.sentences.filter((s: any) => s.isAI).map((s: any) => ({
                  text: s.text,
                  reason: `Sentence matches generative pattern distributions.`,
                  aiConfidence: Math.round((s.scores?.ai || s.confidence || 0.5) * 100)
                }))
              : [],
            analysisExplanation: `WasItAIGenerated analysis completed. Service returned verdict: ${data.analysis?.likelihood || "N/A"} (${data.analysis?.reasoning || ""}).`,
            simulated: false
          });
        }
      }
      console.warn("[TruthShield] WasItAIGenerated API returned error status, falling back to simulation.");
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.warn("[TruthShield] WasItAIGenerated request failed, falling back to simulation:", e.message);
    }
  }

  const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "";
  if (hasGemini && gemini) {
    try {
      const systemPrompt = `You are an AI writing detector. Analyze the following text and determine if it was written by an AI (like GPT-4, Claude, Gemini) or by a human. Respond ONLY with a valid JSON object.`;
      const userPrompt = `Analyze this text for perplexity, burstiness, syntax patterns, and stylistic signatures typical of LLMs:
      
      Text to analyze:
      "${text}"
      
      Respond ONLY with a valid JSON object:
      {
        "score": <number 0-100, where higher means higher AI probability>,
        "verdict": "AI-Generated" | "Mixed / Partially AI" | "Highly Likely Human",
        "modelLikelyUsed": <string>,
        "perplexityScore": <string>,
        "burstinessScore": <string>,
        "sentenceStructure": <string>,
        "flaggedSentences": [{ "text": <string>, "reason": <string>, "aiConfidence": <number 0-100> }],
        "analysisExplanation": <string>
      }`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `${systemPrompt}\n\n${userPrompt}`,
        config: {
          responseMimeType: "application/json",
        },
      });
      const resultData = JSON.parse(response.text || "{}");
      return res.json({ ...resultData, simulated: false });
    } catch (e: any) {
      console.warn("[TruthShield] Gemini Text Detection failed, falling back to simulation:", e.message);
    }
  }

  // Simulation Fallback
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

  res.json({
    score,
    verdict,
    modelLikelyUsed: score >= 70 ? "GPT-4 / Claude 3.5 Mix (Simulation)" : "Human Writer (Simulation)",
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
      "Simulation Fallback Mode: WAI_API_KEY and Gemini API are inactive or failed. Returned simulated metrics.",
    simulated: true,
  });
});

// ─── Endpoint 2: Fact Checker ──────────────────────────────────────────────────
app.post("/api/verify-rumor", async (req, res) => {
  const query = sanitize(req.body.query, 5000);
  const fullArticle = sanitize(req.body.fullArticle, 5000);
  const contentToVerify = query || fullArticle;

  if (!contentToVerify || contentToVerify.trim().length === 0) {
    return res.status(400).json({ error: "A claim or article is required to search and verify." });
  }

  const prompt = `You are a real-time factual investigator and fake-news analyst. 
  Cross-reference the following claim or news text with reputable databases, credible journals, and active global news publications to verify its truthfulness.
  Contrast the rumors against verified details from Snopes, PolitiFact, Reuters, AFP, BBC, etc.
  
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

  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "";
  if (hasOpenRouter) {
    try {
      const resOpenRouter = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "TruthShield",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1000,
          response_format: { type: "json_object" }
        }),
      });

      if (resOpenRouter.ok) {
        const data = await resOpenRouter.json();
        let rawText = data.choices?.[0]?.message?.content || "{}";
        if (rawText.includes("```")) {
          const jsonStr = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
          const start = jsonStr.indexOf('{');
          const end = jsonStr.lastIndexOf('}');
          rawText = jsonStr.slice(start, end + 1);
        }
        const resultData = JSON.parse(rawText);
        return res.json({ ...resultData, simulated: false, groundedSearch: false });
      } else {
        const errorText = await resOpenRouter.text();
        console.warn(`[TruthShield] OpenRouter call failed with status: ${resOpenRouter.status}. Response: ${errorText}`);
      }
    } catch (e: any) {
      console.warn("[TruthShield] OpenRouter Fact Check failed, trying Gemini fallback:", e.message);
    }
  }

  const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "";
  if (hasGemini && gemini) {
    try {
      const geminiPrompt = `${prompt}\n\nYou MUST search for real and up-to-date information.`;
      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: geminiPrompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }], // Live Google Search Grounding
        },
      });

      const resultData = JSON.parse(response.text || "{}");
      return res.json({ ...resultData, simulated: false, groundedSearch: true });
    } catch (e: any) {
      console.warn("[TruthShield] Gemini Fact Check failed, falling back to simulation:", e.message);
    }
  }

  // Simulation Fallback
  res.json({
    verdict: "UNVERIFIED (Simulation)",
    confidenceScore: 50,
    explanation:
      "Simulation Fallback Mode: OpenRouter and Gemini APIs are inactive or have exceeded quota. Returned baseline fact verification.",
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
  const imageBase64 = req.body.imageBase64;
  const mimeType = sanitize(req.body.mimeType, 100);
  const fileName = sanitize(req.body.fileName, 500);

  if (!imageBase64) {
    return res.status(400).json({ error: "Image data (base64 or URL) is required." });
  }

  const rawData = await getBase64FromUrlOrData(imageBase64, mimeType || "image/jpeg");
  if (rawData) {
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

    // 1. Try Groq
    const hasGroq = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "";
    if (hasGroq && groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${rawData.mimeType};base64,${rawData.data}` },
                },
                { type: "text", text: userPrompt },
              ],
            },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        });
        const rawText = completion.choices[0]?.message?.content || "{}";
        const jsonStr = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        const start = jsonStr.indexOf('{');
        const end = jsonStr.lastIndexOf('}');
        const resultData = JSON.parse(jsonStr.slice(start, end + 1));
        return res.json({ ...resultData, simulated: false });
      } catch (e: any) {
        console.warn("[TruthShield] Groq Image analysis failed, trying OpenRouter fallback:", e.message);
      }
    }

    // 2. Try OpenRouter
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "";
    if (hasOpenRouter) {
      try {
        const resOpenRouter = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "TruthShield",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: `data:${rawData.mimeType};base64,${rawData.data}` }
                  },
                  { type: "text", text: userPrompt }
                ]
              }
            ],
            max_tokens: 1000,
            response_format: { type: "json_object" }
          })
        });

        if (resOpenRouter.ok) {
          const data = await resOpenRouter.json();
          let rawText = data.choices?.[0]?.message?.content || "{}";
          if (rawText.includes("```")) {
            const jsonStr = rawText
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/```\s*$/i, '')
              .trim();
            const start = jsonStr.indexOf('{');
            const end = jsonStr.lastIndexOf('}');
            rawText = jsonStr.slice(start, end + 1);
          }
          const resultData = JSON.parse(rawText);
          return res.json({ ...resultData, simulated: false });
        } else {
          const errorText = await resOpenRouter.text();
          console.warn(`[TruthShield] OpenRouter Image analysis failed with status: ${resOpenRouter.status}. Response: ${errorText}`);
        }
      } catch (e: any) {
        console.warn("[TruthShield] OpenRouter Image analysis error, trying Gemini fallback:", e.message);
      }
    }

    // 3. Try Gemini
    const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "";
    if (hasGemini && gemini) {
      try {
        const imagePart = {
          inlineData: { mimeType: rawData.mimeType, data: rawData.data },
        };
        const textPart = { text: `${systemPrompt}\n\n${userPrompt}` };
        const response = await gemini.models.generateContent({
          model: "gemini-2.0-flash",
          contents: { parts: [imagePart, textPart] },
          config: { responseMimeType: "application/json" },
        });
        const resultData = JSON.parse(response.text || "{}");
        return res.json({ ...resultData, simulated: false });
      } catch (e: any) {
        console.warn("[TruthShield] Gemini Image analysis failed, falling back to simulation:", e.message);
      }
    }
  }

  // Simulation Fallback
  const isAuthentic = /(authentic|canon|real|camera|legit|news)/i.test(fileName || "");
  const score = isAuthentic ? 6 : 89;
  
  res.json({
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
      "Simulation Fallback Mode: Groq Vision is inactive or rate limited. Returned visual forensic metrics.",
    metadataSummary: isAuthentic 
      ? "No tampering: Normal EXIF markers active (Canon EOS 5D Mk IV)."
      : "No metadata found. Standard simulation mode active.",
    simulated: true,
  });
});

// ─── Endpoint 4: Video Deepfake Analyzer ──────────────────────────────────────
app.post("/api/analyze-video", async (req, res) => {
  const videoFileName = sanitize(req.body.videoFileName, 500);
  const videoBase64Frame = req.body.videoBase64Frame;

  const rawData = videoBase64Frame ? await getBase64FromUrlOrData(videoBase64Frame) : null;
  let resultData: any;
  let success = false;

  const systemPromptImage = `You are a forensic video engineering specialist specializing in deepfake detection. Respond with valid JSON only.`;
  const userPromptImage = `Analyze this freeze-frame from "${videoFileName || "scanned_video.mp4"}" for deepfake manipulation. Inspect lip sync, eye symmetry, blinking indicators, landmark edge flickering, and digital blending artifacts.
  
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

  const systemPromptText = `You are a forensic video engineering specialist. Respond with valid JSON only.`;
  const userPromptText = `Perform a probabilistic deepfake audit for a video named "${videoFileName || "unknown_clip.mp4"}". No visual frame is available — list standard deepfake markers and expected risk levels.
  
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

  // 1. Try Groq
  const hasGroq = !!process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "";
  if (hasGroq && groq) {
    try {
      if (rawData) {
        const completion = await groq.chat.completions.create({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            { role: "system", content: systemPromptImage },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${rawData.mimeType};base64,${rawData.data}` },
                },
                { type: "text", text: userPromptImage },
              ],
            },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        });
        const rawText = completion.choices[0]?.message?.content || "{}";
        const jsonStr = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        const start = jsonStr.indexOf('{');
        const end = jsonStr.lastIndexOf('}');
        resultData = JSON.parse(jsonStr.slice(start, end + 1));
      } else {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPromptText },
            { role: "user", content: userPromptText },
          ],
          temperature: 0.3,
          max_tokens: 2048,
          response_format: { type: "json_object" },
        });
        const rawText = completion.choices[0]?.message?.content || "{}";
        resultData = JSON.parse(rawText);
      }
      success = true;
    } catch (e: any) {
      console.warn("[TruthShield] Groq Video analysis failed, trying OpenRouter fallback:", e.message);
    }
  }

  // 2. Try OpenRouter
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "";
  if (!success && hasOpenRouter) {
    try {
      let resOpenRouter;
      if (rawData) {
        resOpenRouter = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "TruthShield",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPromptImage },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: `data:${rawData.mimeType};base64,${rawData.data}` }
                  },
                  { type: "text", text: userPromptImage }
                ]
              }
            ],
            max_tokens: 1000,
            response_format: { type: "json_object" }
          })
        });
      } else {
        resOpenRouter = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "TruthShield",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPromptText },
              { role: "user", content: userPromptText }
            ],
            max_tokens: 1000,
            response_format: { type: "json_object" }
          })
        });
      }

      if (resOpenRouter.ok) {
        const data = await resOpenRouter.json();
        let rawText = data.choices?.[0]?.message?.content || "{}";
        if (rawText.includes("```")) {
          const jsonStr = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
          const start = jsonStr.indexOf('{');
          const end = jsonStr.lastIndexOf('}');
          rawText = jsonStr.slice(start, end + 1);
        }
        resultData = JSON.parse(rawText);
        success = true;
      } else {
        const errorText = await resOpenRouter.text();
        console.warn(`[TruthShield] OpenRouter Video analysis failed with status: ${resOpenRouter.status}. Response: ${errorText}`);
      }
    } catch (e: any) {
      console.warn("[TruthShield] OpenRouter Video analysis error, trying Gemini fallback:", e.message);
    }
  }

  // 3. Try Gemini
  const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "";
  if (!success && hasGemini && gemini) {
    try {
      if (rawData) {
        const imagePart = {
          inlineData: { mimeType: rawData.mimeType, data: rawData.data },
        };
        const textPart = { text: `${systemPromptImage}\n\n${userPromptImage}` };
        const response = await gemini.models.generateContent({
          model: "gemini-2.0-flash",
          contents: { parts: [imagePart, textPart] },
          config: { responseMimeType: "application/json" },
        });
        resultData = JSON.parse(response.text || "{}");
      } else {
        const response = await gemini.models.generateContent({
          model: "gemini-2.0-flash",
          contents: `${systemPromptText}\n\n${userPromptText}`,
          config: { responseMimeType: "application/json" },
        });
        resultData = JSON.parse(response.text || "{}");
      }
      success = true;
    } catch (e: any) {
      console.warn("[TruthShield] Gemini Video analysis failed, falling back to simulation:", e.message);
    }
  }

  if (success) {
    return res.json({ ...resultData, simulated: false });
  }

  // Simulation Fallback
  res.json({
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
});

// ─── Endpoint 5: Scam Message Checker ─────────────────────────────────────────
app.post("/api/analyze-message", async (req, res) => {
  const message = sanitize(req.body.message, 500);

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: "Message content is required for analysis." });
  }

  const hasCerebras = !!process.env.CEREBRAS_API_KEY && process.env.CEREBRAS_API_KEY !== "";
  if (hasCerebras) {
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

      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content || "{}";
        const resultData = JSON.parse(rawText);
        return res.json({ ...resultData, simulated: false });
      } else {
        const errorBody = await response.text();
        console.warn("[TruthShield] Cerebras Scam Check failed, status:", response.status, "body:", errorBody);
      }
    } catch (e: any) {
      console.warn("[TruthShield] Cerebras Scam Check error, falling back to simulation:", e.message);
    }
  }

  const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "";
  if (hasGemini && gemini) {
    try {
      const systemPrompt = `You are a cybersecurity expert specializing in social engineering, phishing, and SMS/WhatsApp scam detection. You analyze messages for manipulation tactics, fraudulent patterns, and urgency language. You ALWAYS respond with valid JSON only.`;
      const userPrompt = `Analyze the following message for scam risk — check for urgency language, suspicious links, impersonation attempts, and financial fraud patterns.
      
      Message:
      "${message}"
      
      Respond ONLY with a valid JSON object:
      {
        "score": <number 0-100>,
        "verdict": "HIGH RISK SCAM" | "SUSPICIOUS" | "LOW RISK / SAFE",
        "urgencyLevel": "CRITICAL" | "HIGH" | "NORMAL",
        "detectedThreats": [{ "element": <string>, "description": <string>, "severity": "High" | "Medium" | "Low" }],
        "reasons": [<string>, ...],
        "analysisExplanation": <string>
      }`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `${systemPrompt}\n\n${userPrompt}`,
        config: { responseMimeType: "application/json" },
      });
      const resultData = JSON.parse(response.text || "{}");
      return res.json({ ...resultData, simulated: false });
    } catch (e: any) {
      console.warn("[TruthShield] Gemini Scam Check failed, falling back to simulation:", e.message);
    }
  }

  // Simulation Fallback
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

  res.json({
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
      "Simulation Fallback Mode: Cerebras API is inactive or has exceeded quota. Returned simulated scam results.",
    simulated: true,
  });
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

const USERS_FILE = path.join(process.cwd(), "users.json");
const EVIDENCE_FILE = path.join(process.cwd(), "evidence.json");

const seedUsers: { [username: string]: UserProfile & { passwordHash: string } } = {
  harshit_sentinel: {
    username: "harshit_sentinel",
    email: "harshitkk5830@gmail.com",
    passwordHash: "$2b$10$ioWRcxuIT2NO5Wo5FsSJIOLACUPVFftwBwKnWzubPbzNVfm0K5n7y",
    reputation: 175,
    badge: "Senior Sentinel",
    favorites: ["reuters.com", "apnews.com", "wikipedia.org"],
    blocked: ["fakenewsblog.ru", "totalhoaxdaily.net", "rumorspam.com"],
  },
  fact_check_reuters: {
    username: "fact_check_reuters",
    email: "reuters@factcheck.org",
    passwordHash: "$2b$10$48o1q3H5hSpHtu9ZluwuNeDv0c6EDzmCp9JUpYSELL0MVRo5guj/O",
    reputation: 520,
    badge: "Official Partner",
    favorites: ["reuters.com"],
    blocked: [],
  },
  hoax_buster_99: {
    username: "hoax_buster_99",
    email: "buster@gmail.com",
    passwordHash: "$2b$10$BaMKG1yWrhzl/CeNpEzR/O/R1PgKQygkAUGdkmgobpSS7TPYGsVPq",
    reputation: 110,
    badge: "Trusted Verifier",
    favorites: ["snopes.com", "politifact.com"],
    blocked: ["unverifiedrumor.co"],
  },
};

const seedEvidence: CommunityEvidence[] = [
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

// Load helpers
function loadUsers(): { [username: string]: UserProfile & { passwordHash: string } } {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load users from file persistence:", error);
  }
  saveUsers(seedUsers);
  return { ...seedUsers };
}

function loadEvidence(): CommunityEvidence[] {
  try {
    if (fs.existsSync(EVIDENCE_FILE)) {
      const data = fs.readFileSync(EVIDENCE_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load evidence from file persistence:", error);
  }
  saveEvidence(seedEvidence);
  return [...seedEvidence];
}

// Write persistence helpers. Replace with Supabase for production.
function saveUsers(data: { [username: string]: UserProfile & { passwordHash: string } }) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to save users to file persistence:", error);
  }
}

function saveEvidence(data: CommunityEvidence[]) {
  try {
    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to save evidence to file persistence:", error);
  }
}

// Load databases
const usersDb = loadUsers();
const evidenceDb = loadEvidence();

function getBadge(reputation: number): string {
  if (reputation >= 200) return "Master Forensic Analyst";
  if (reputation >= 80) return "Senior Sentinel";
  if (reputation >= 30) return "Trusted Verifier";
  return "Novice Grounder";
}

// Authentication & Session Endpoints (Rate Limited to 5 requests / min)
app.post("/api/auth/register", rateLimiter(5, 60 * 1000), (req, res) => {
  const username = sanitize(req.body.username, 500);
  const password = typeof req.body.password === "string" ? req.body.password.trim() : "";
  const email = sanitize(req.body.email, 500);

  if (!username || !password || !email) {
    return res.status(400).json({ error: "All registration fields are required." });
  }
  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: "Username must be at least 3 chars and password at least 6 chars." });
  }
  const normalized = username.toLowerCase().trim();
  if (usersDb[normalized]) {
    return res.status(400).json({ error: "Username already exists." });
  }
  const newUser: UserProfile & { passwordHash: string } = {
    username: normalized,
    email: email.trim(),
    passwordHash: hashPassword(password),
    reputation: 10,
    badge: "Novice Grounder",
    favorites: [],
    blocked: [],
  };
  usersDb[normalized] = newUser;
  saveUsers(usersDb);

  const { passwordHash, ...safeUser } = newUser;
  const token = generateToken({ username: normalized });
  res.json({ success: true, user: safeUser, token });
});

app.post("/api/auth/login", rateLimiter(5, 60 * 1000), (req, res) => {
  const username = sanitize(req.body.username, 500);
  const password = typeof req.body.password === "string" ? req.body.password.trim() : "";

  if (!username || !password) {
    return res.status(400).json({ error: "Username or email, and password are required." });
  }
  const normalized = username.toLowerCase().trim();
  let user = usersDb[normalized];
  if (!user) {
    user = Object.values(usersDb).find(
      (u) => u.email.toLowerCase().trim() === normalized
    ) as any;
  }
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid username/email or password credentials." });
  }
  const { passwordHash, ...safeUser } = user;
  const token = generateToken({ username: user.username });
  res.json({ success: true, user: safeUser, token });
});

app.get("/api/auth/profile/:username", authenticateToken, (req, res) => {
  const normalized = sanitize(req.params.username, 500).toLowerCase().trim();
  const user = usersDb[normalized];
  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Domain Filters Endpoints (Token Authenticated)
app.get("/api/domains/:username", authenticateToken, (req: any, res) => {
  const normalized = sanitize(req.params.username, 500).toLowerCase().trim();
  if (req.user.username !== normalized) {
    return res.status(403).json({ error: "Forbidden: Cannot view other user domain filters." });
  }
  const user = usersDb[normalized];
  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }
  res.json({ favorites: user.favorites, blocked: user.blocked });
});

app.post("/api/domains/toggle", authenticateToken, (req: any, res) => {
  const domain = sanitize(req.body.domain, 500);
  const type = sanitize(req.body.type, 100);
  const username = req.user.username; // Verified identity from token
  if (!domain || !type) {
    return res.status(400).json({ error: "Missing required fields: domain and type." });
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
  saveUsers(usersDb);
  res.json({ favorites: user.favorites, blocked: user.blocked });
});

// Community Verification & Evidence Endpoints
app.get("/api/evidence/:contentId", (req, res) => {
  const contentId = sanitize(req.params.contentId, 500);
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

app.post("/api/evidence/add", authenticateToken, (req: any, res) => {
  const contentId = sanitize(req.body.contentId, 500);
  const statement = sanitize(req.body.statement, 5000);
  const type = sanitize(req.body.type, 100) as "support" | "refute";
  const linkUrl = sanitize(req.body.linkUrl, 1000);
  const username = req.user.username; // Secure identity from token
  if (!contentId || !statement || !type) {
    return res.status(400).json({ error: "Required fields are missing: contentId, statement, type." });
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
  saveEvidence(evidenceDb);
  if (user) {
    saveUsers(usersDb);
  }
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

app.post("/api/evidence/vote", authenticateToken, (req: any, res) => {
  const evidenceId = sanitize(req.body.evidenceId, 100);
  const value = sanitize(req.body.value, 100) as "up" | "down";
  const username = req.user.username; // Secure identity from token
  if (!evidenceId || !value) {
    return res.status(400).json({ error: "Missing voting properties: evidenceId and value." });
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
    saveUsers(usersDb);
  }
  saveEvidence(evidenceDb);
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

// Global Error Handler Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[SERVER ERROR BOUNDARY]", {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    message: err.message,
    stack: err.stack
  });
  res.status(500).json({ error: "An internal server error occurred on the TruthShield gateway. Please try again." });
});

startServer();
