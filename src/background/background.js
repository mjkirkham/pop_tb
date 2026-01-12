/**
 * Background Script
 * Minimal background script - most logic is in content/popup scripts
 */

// Extension installed/updated handler
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    // Extension installed - no action needed
    // The popup will handle all UI and the content script handles page manipulation
  });
}

if (typeof browser !== 'undefined' && browser.runtime) {
  browser.runtime.onInstalled.addListener(() => {
    // Extension installed - no action needed
  });
}
