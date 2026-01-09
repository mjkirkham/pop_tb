// Chrome background service worker
// The action is always enabled, allowing users to open the popup on any page.
// The popup will detect if it's on a valid Trial Balance page and show appropriate UI.

chrome.runtime.onInstalled.addListener(function () {
  // Extension installed - no action needed
});
