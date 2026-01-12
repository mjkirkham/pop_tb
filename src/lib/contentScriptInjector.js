/**
 * Content Script Injection Helper
 * Handles dynamic injection of content scripts
 */

import browserAPI from './browserAPI.js';

/**
 * Ensure content script is loaded in the specified tab
 * @param {number} tabId - Tab ID to inject into
 * @returns {Promise<void>}
 */
export async function ensureContentScriptLoaded(tabId) {
  try {
    await browserAPI.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  } catch (error) {
    // Script may already be injected or page doesn't allow injection
    // This is acceptable - the message will fail if script isn't available
  }
}

/**
 * Check if current tab has a trial balance form
 * @param {number} tabId - Tab ID to check
 * @returns {Promise<boolean>}
 */
export async function hasTrialBalanceForm(tabId) {
  try {
    const results = await browserAPI.scripting.executeScript({
      target: { tabId: tabId },
      func: () => document.querySelector('form.UIForm.trial-balance') !== null
    });
    return results && results[0] && results[0].result;
  } catch (error) {
    return false;
  }
}
