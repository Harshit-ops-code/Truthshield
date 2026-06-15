document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("content");

  // Load last scanning coordinate result
  chrome.storage.local.get("lastScan", (data) => {
    if (data.lastScan) {
      render(data.lastScan);
    }
  });

  // Listen for message broadcasts from background worker
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "scan_complete") {
      chrome.storage.local.get("lastScan", (data) => {
        if (data.lastScan) {
          render(data.lastScan);
        }
      });
    }
  });

  function render(scan) {
    if (!scan) return;

    if (scan.loading) {
      container.innerHTML = `
        <div class="status-card">
          <div class="label">Highlighted selection</div>
          <div class="selection-text">"${scan.text}"</div>
        </div>
        <div class="loading-spinner">
          <div class="spinner"></div>
          <div>Auditing statement integrity...</div>
        </div>
      `;
      return;
    }

    if (scan.error) {
      container.innerHTML = `
        <div class="status-card">
          <div class="label">Highlighted selection</div>
          <div class="selection-text">"${scan.text}"</div>
        </div>
        <div style="color: #ef4444; font-size: 11px; padding: 12px; text-align: center;">
          Failed to query local host: ${scan.error}
          <p style="color: #64748b; font-size: 9px; margin-top: 4px;">Make sure the backend is active at http://localhost:3000</p>
        </div>
      `;
      return;
    }

    if (scan.result) {
      const isAI = scan.type === "ai-detector";
      const score = isAI ? scan.result.score : scan.result.confidenceScore;
      const verdict = isAI ? scan.result.verdict : scan.result.verdict;
      const explanation = isAI ? scan.result.analysisExplanation : scan.result.explanation;
      const scoreColor = score >= 60 ? "#ef4444" : "#10b981";

      container.innerHTML = `
        <div class="status-card">
          <div class="label">Target Statement</div>
          <div class="selection-text">"${scan.text}"</div>
        </div>

        <div class="status-card">
          <div class="verdict-header">
            <div>
              <div class="label">Analysis Verdict</div>
              <div class="verdict" style="color: ${scoreColor}">${verdict}</div>
            </div>
            <div style="text-align: right;">
              <div class="label">${isAI ? "AI Probability" : "Confidence"}</div>
              <div class="score" style="color: ${scoreColor}">${score}%</div>
            </div>
          </div>
          <div class="explanation">
            ${explanation}
          </div>
        </div>
      `;
    }
  }
});
