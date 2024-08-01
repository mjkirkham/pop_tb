chrome.runtime.onInstalled.addListener(function () {
  chrome.action.disable();

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          return document.querySelector('form.UIForm.trial-balance') !== null;
        }
      }, (results) => {
        if (results && results[0].result) {
          chrome.action.enable(tabId);
        } else {
          chrome.action.disable(tabId);
        }
      });
    }
  });
});