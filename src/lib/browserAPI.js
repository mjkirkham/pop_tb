/**
 * Browser API Abstraction Layer
 * Provides a unified API that works with both Chrome (callback-based) and Firefox (Promise-based)
 */

const browserAPI = (function() {
  // Firefox uses browser.* with native Promises
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser;
  }
  
  // Chrome uses chrome.* with callbacks - wrap in Promises for consistency
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return {
      runtime: {
        lastError: chrome.runtime.lastError,
        onInstalled: chrome.runtime.onInstalled,
        onMessage: chrome.runtime.onMessage
      },
      storage: {
        local: {
          get: (keys) => new Promise((resolve) => {
            chrome.storage.local.get(keys, resolve);
          }),
          set: (items) => new Promise((resolve, reject) => {
            chrome.storage.local.set(items, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve();
              }
            });
          })
        }
      },
      tabs: {
        query: (queryInfo) => new Promise((resolve) => {
          chrome.tabs.query(queryInfo, resolve);
        }),
        sendMessage: (tabId, message) => new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        }),
        onUpdated: chrome.tabs.onUpdated
      },
      scripting: {
        executeScript: (injection) => new Promise((resolve, reject) => {
          chrome.scripting.executeScript(injection, (results) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(results);
            }
          });
        })
      }
    };
  }
  
  throw new Error('Browser API not available');
})();

export default browserAPI;
