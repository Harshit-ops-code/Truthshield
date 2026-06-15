// Initialize context menu item on extension installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "truthshield-verify-claim",
    title: "Verify claim with TruthShield: '%s'",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "truthshield-detect-ai",
    title: "Detect AI Authoring with TruthShield: '%s'",
    contexts: ["selection"]
  });
});

// Listen for context menu click events
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const selectedText = info.selectionText;
  if (!selectedText) return;

  // Store selection in local extension storage to show in popup
  chrome.storage.local.set({ 
    lastScan: {
      text: selectedText,
      loading: true,
      result: null,
      error: null
    }
  });

  const endpoint = info.menuItemId === "truthshield-detect-ai" 
    ? "http://localhost:3000/api/analyze-text" 
    : "http://localhost:3000/api/verify-rumor";

  const bodyPayload = info.menuItemId === "truthshield-detect-ai"
    ? { text: selectedText }
    : { query: selectedText };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) throw new Error("TruthShield server returned error status");
    const data = await res.json();

    chrome.storage.local.set({
      lastScan: {
        text: selectedText,
        type: info.menuItemId === "truthshield-detect-ai" ? "ai-detector" : "fact-check",
        loading: false,
        result: data,
        error: null
      }
    });

    // Notify popup if it is currently open
    chrome.runtime.sendMessage({ action: "scan_complete", data });
  } catch (err) {
    chrome.storage.local.set({
      lastScan: {
        text: selectedText,
        loading: false,
        result: null,
        error: err.message
      }
    });
    chrome.runtime.sendMessage({ action: "scan_complete", error: err.message });
  }
});
