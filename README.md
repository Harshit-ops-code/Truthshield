# TruthShield Sentinel Core

Combatting artificial disinformation, deepfakes, and coordinate phishing hoaxes using a live multi-API forensic sandbox center and Manifest V3 Companion Extension.

## Features
- **Visual Checkers**: Image and video deepfake metadata analysis powered by Groq/Gemini models.
- **AI Text Detection**: Linguistic integrity parsing via Hugging Face's `Hello-SimpleAI` model.
- **Fact Grounding**: Cross-reference rumors with global publications using live search.
- **Scam Message Scan**: Social engineering checks for SMS/WhatsApp threats.
- **Chrome Extension (Manifest V3)**: Real-time context menu audits directly from the browser.

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your keys:
   ```env
   GEMINI_API_KEY="your_gemini_key"
   GROQ_API_KEY="your_groq_key"
   HF_API_KEY="your_huggingface_key"
   ```
3. Run the application:
   ```bash
   npm run dev
   ```
4. Access the web app at `http://localhost:3000`.

## Chrome Extension Setup
1. Go to `chrome://extensions/` in Google Chrome.
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked** in the top left.
4. Select the `extension/` directory of this project.
