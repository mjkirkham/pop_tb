/**
 * Theme Management Module
 * Handles light/dark mode switching
 */

import { loadTheme, saveTheme } from './storage.js';

/**
 * Get system theme preference
 * @returns {string} 'dark' or 'light'
 */
export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme to the document
 * @param {string} theme - Theme name ('light', 'dark', or 'auto')
 */
export function applyTheme(theme) {
  if (theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

/**
 * Update theme toggle button label
 * @param {HTMLElement} toggleButton - Theme toggle button element
 * @param {string} theme - Current theme
 */
export function updateThemeToggleLabel(toggleButton, theme) {
  const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme;
  const label = effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  toggleButton.setAttribute('aria-label', label);
  toggleButton.setAttribute('title', label);
}

/**
 * Toggle between light and dark themes
 * @param {HTMLElement} toggleButton - Theme toggle button element
 * @returns {Promise<string>} New theme name
 */
export async function toggleTheme(toggleButton) {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const systemTheme = getSystemTheme();
  
  let newTheme;
  if (!currentTheme) {
    // Currently auto - switch to opposite of system
    newTheme = systemTheme === 'dark' ? 'light' : 'dark';
  } else if (currentTheme === 'dark') {
    newTheme = 'light';
  } else {
    newTheme = 'dark';
  }
  
  applyTheme(newTheme);
  updateThemeToggleLabel(toggleButton, newTheme);
  await saveTheme(newTheme);
  
  return newTheme;
}

/**
 * Initialize theme on page load
 * @param {HTMLElement} toggleButton - Theme toggle button element
 * @returns {Promise<void>}
 */
export async function initializeTheme(toggleButton) {
  const theme = await loadTheme();
  applyTheme(theme);
  updateThemeToggleLabel(toggleButton, theme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (!currentTheme) {
      // Only update label if in auto mode
      updateThemeToggleLabel(toggleButton, 'auto');
    }
  });
}
