/**
 * Storage Management Module
 * Handles saving and loading preferences
 */

import browserAPI from './browserAPI.js';
import { DEFAULT_PREFERENCES } from './constants.js';

/**
 * Load preferences from storage
 * @returns {Promise<Object>} Preferences object
 */
export async function loadPreferences() {
  try {
    const result = await browserAPI.storage.local.get('preferences');
    return result.preferences || DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save preferences to storage
 * @param {Object} preferences - Preferences object to save
 * @returns {Promise<void>}
 */
export async function savePreferences(preferences) {
  try {
    await browserAPI.storage.local.set({ preferences });
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

/**
 * Load theme preference from storage
 * @returns {Promise<string>} Theme name ('light', 'dark', or 'auto')
 */
export async function loadTheme() {
  try {
    const result = await browserAPI.storage.local.get('theme');
    return result.theme || 'auto';
  } catch (error) {
    console.error('Error loading theme:', error);
    return 'auto';
  }
}

/**
 * Save theme preference to storage
 * @param {string} theme - Theme name to save
 * @returns {Promise<void>}
 */
export async function saveTheme(theme) {
  try {
    await browserAPI.storage.local.set({ theme });
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}
