// Firefox background script (Manifest V3)
// The action is always enabled, allowing users to open the popup on any page.
// The content script will handle whether or not to populate based on the page content.

// Listen for tab updates to track which tabs have a Trial Balance form
browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    browser.scripting.executeScript({
      target: { tabId: tabId },
      func: () => document.querySelector('form.UIForm.trial-balance') !== null
    }).then((results) => {
      // Store the result for potential use, but don't disable the action
      // This keeps the popup accessible on all pages
    }).catch((error) => {
      // Script execution may fail on restricted pages, but that's okay
    });
  }
});
