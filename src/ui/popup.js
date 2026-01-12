/**
 * Popup Script - Main UI Controller
 * Handles user interactions and coordinates between modules
 */

import browserAPI from '../lib/browserAPI.js';
import { TIMING, DEFAULT_PREFERENCES } from '../lib/constants.js';
import { loadPreferences, savePreferences } from '../lib/storage.js';
import { initializeTheme, toggleTheme } from '../lib/theme.js';
import { validateFormInputs, getFriendlyDensityLabel } from '../lib/validator.js';
import { ensureContentScriptLoaded, hasTrialBalanceForm } from '../lib/contentScriptInjector.js';
import { createSafeElement, clearElement } from '../lib/utils.js';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', initializePopup);

async function initializePopup() {
  // Get DOM elements
  const elements = {
    form: document.getElementById('form'),
    btnPopTB: document.getElementById('btn_pop_tb_run'),
    btnClearTB: document.getElementById('btn_clear_tb'),
    rngDensity: document.getElementById('rngDensity'),
    rngDensityOutput: document.getElementById('rngDensityOutput'),
    densityFriendlyOutput: document.getElementById('densityFriendlyOutput'),
    mainContent: document.getElementById('mainContent'),
    notAvailableMessage: document.getElementById('notAvailableMessage'),
    themeToggle: document.getElementById('themeToggle'),
    errorPanel: document.getElementById('errorPanel'),
    errorList: document.getElementById('errorList'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    minValueInput: document.getElementById('numMinValue'),
    maxValueInput: document.getElementById('numMaxValue'),
    includeBFInput: document.getElementById('chkIncludeBF')
  };

  // Initialize theme
  await initializeTheme(elements.themeToggle);
  
  // Theme toggle handler
  elements.themeToggle.addEventListener('click', () => toggleTheme(elements.themeToggle));

  // Load and apply preferences
  const prefs = await loadPreferences();
  applyPreferencesToForm(elements, prefs);

  // Check if we're on a valid Trial Balance page
  await checkPageValidity(elements);

  // Set up event listeners
  setupEventListeners(elements);

  // Set initial density display
  updateDensityDisplay(elements);
}

/**
 * Apply preferences to form inputs
 */
function applyPreferencesToForm(elements, prefs) {
  // Apply posting type
  const postingTypeRadio = document.querySelector(
    `input[name="postingType"][value="${prefs.postingType}"]`
  );
  if (postingTypeRadio) postingTypeRadio.checked = true;

  // Apply other preferences
  elements.includeBFInput.checked = prefs.includeBF;
  elements.minValueInput.value = prefs.minValue;
  elements.maxValueInput.value = prefs.maxValue;
  elements.rngDensity.value = prefs.density;
}

/**
 * Check if current page is a valid Trial Balance page
 */
async function checkPageValidity(elements) {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (!tab || !tab.id) {
      showNotAvailable(elements);
      return;
    }

    const isValid = await hasTrialBalanceForm(tab.id);
    
    if (isValid) {
      elements.mainContent.style.display = 'block';
      elements.notAvailableMessage.style.display = 'none';
    } else {
      showNotAvailable(elements);
    }
  } catch (error) {
    showNotAvailable(elements);
  }
}

/**
 * Show "not available" message
 */
function showNotAvailable(elements) {
  elements.mainContent.style.display = 'none';
  elements.notAvailableMessage.style.display = 'flex';
}

/**
 * Set up all event listeners
 */
function setupEventListeners(elements) {
  // Save preferences on any form change
  elements.form.addEventListener('change', () => saveCurrentPreferences(elements));

  // Density slider
  elements.rngDensity.addEventListener('input', () => updateDensityDisplay(elements));

  // Populate button
  elements.btnPopTB.addEventListener('click', () => handlePopulate(elements));

  // Clear button
  elements.btnClearTB.addEventListener('click', () => handleClear(elements));

  // Form validation
  elements.form.addEventListener('blur', (event) => handleBlur(event, elements), true);

  // Keyboard navigation for radio groups
  setupKeyboardNavigation();

  // Help icon keyboard support
  setupHelpIconSupport();

  // Tab trap
  setupTabTrap();
}

/**
 * Update density display
 */
function updateDensityDisplay(elements) {
  const value = elements.rngDensity.value;
  elements.rngDensityOutput.textContent = value + '%';
  elements.densityFriendlyOutput.textContent = getFriendlyDensityLabel(value);
  elements.rngDensity.setAttribute('aria-valuenow', value);
  elements.rngDensity.setAttribute('aria-valuetext', value + '%');
}

/**
 * Save current form preferences
 */
async function saveCurrentPreferences(elements) {
  const prefs = {
    postingType: document.querySelector('input[name="postingType"]:checked').value,
    includeBF: elements.includeBFInput.checked,
    minValue: elements.minValueInput.value,
    maxValue: elements.maxValueInput.value,
    density: elements.rngDensity.value
  };
  await savePreferences(prefs);
}

/**
 * Handle populate button click
 */
async function handlePopulate(elements) {
  setLoadingState(elements, true);
  clearError(elements);

  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    // Inject content script
    await ensureContentScriptLoaded(tab.id);

    // Gather parameters
    const params = {
      postingType: document.querySelector('input[name="postingType"]:checked').value,
      includeBF: elements.includeBFInput.checked,
      minValue: elements.minValueInput.value,
      maxValue: elements.maxValueInput.value,
      density: elements.rngDensity.value
    };

    // Send message to content script
    const response = await browserAPI.tabs.sendMessage(tab.id, { 
      action: 'populateTB', 
      params 
    });

    handleResponse(elements, response, 'populate');
  } catch (error) {
    setLoadingState(elements, false);
    showError(elements, 'Could not connect to the page. Please refresh the page and try again.');
  }
}

/**
 * Handle clear button click
 */
async function handleClear(elements) {
  setLoadingState(elements, true);
  clearError(elements);

  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    // Inject content script
    await ensureContentScriptLoaded(tab.id);

    // Send message to content script
    const response = await browserAPI.tabs.sendMessage(tab.id, { action: 'clearTB' });

    handleResponse(elements, response, 'clear');
  } catch (error) {
    setLoadingState(elements, false);
    showError(elements, 'Could not connect to the page. Please refresh the page and try again.');
  }
}

/**
 * Handle response from content script
 */
function handleResponse(elements, response, action) {
  setLoadingState(elements, false);

  if (!response) {
    showError(elements, 'Unable to communicate with the page. Please refresh and try again.');
    return;
  }

  if (response.status === 'error') {
    showError(elements, response.message || 'An unexpected error occurred.');
    return;
  }

  if (response.status === 'success') {
    const message = action === 'populate' && response.rowsPopulated 
      ? `Populated ${response.rowsPopulated} rows successfully!`
      : action === 'populate' 
        ? 'Trial Balance populated successfully!'
        : 'Trial Balance cleared successfully!';
    showToast(elements, message);
  }
}

/**
 * Set loading state
 */
function setLoadingState(elements, isLoading) {
  elements.btnPopTB.classList.toggle('loading', isLoading);
  elements.btnPopTB.disabled = isLoading;
  elements.btnClearTB.disabled = isLoading;
}

/**
 * Show error message
 */
function showError(elements, message) {
  clearElement(elements.errorList);
  const li = createSafeElement('li', message);
  elements.errorList.appendChild(li);
  elements.errorPanel.classList.add('visible');
  elements.errorPanel.focus();
}

/**
 * Clear error message
 */
function clearError(elements) {
  elements.errorPanel.classList.remove('visible');
}

/**
 * Show toast notification
 */
function showToast(elements, message) {
  const toastIcon = elements.toast.querySelector('.toast-icon');
  elements.toastMessage.textContent = message;
  toastIcon.textContent = '✓';
  
  elements.toast.classList.remove('toast-success', 'toast-info');
  elements.toast.classList.add('toast-success');
  elements.toast.classList.add('visible');
  
  setTimeout(() => {
    elements.toast.classList.remove('visible');
    setTimeout(() => window.close(), TIMING.TOAST_HIDE_DELAY);
  }, TIMING.TOAST_DURATION);
}

/**
 * Handle form blur for validation
 */
function handleBlur(event, elements) {
  // Normalize numeric inputs
  if (event.target.type === 'number') {
    const numericValue = parseInt(event.target.value, 10);
    event.target.value = isNaN(numericValue) ? event.target.defaultValue : numericValue;
  }

  // Validate
  const errors = validateFormInputs(elements.minValueInput, elements.maxValueInput);

  // Reset error states
  removeErrorState(elements.minValueInput);
  removeErrorState(elements.maxValueInput);

  // Apply error states
  if (errors.length > 0) {
    // Determine which fields have errors
    const minValue = parseInt(elements.minValueInput.value, 10);
    const maxValue = parseInt(elements.maxValueInput.value, 10);
    
    if (isNaN(minValue)) addErrorState(elements.minValueInput);
    if (isNaN(maxValue)) addErrorState(elements.maxValueInput);
    if (!isNaN(minValue) && !isNaN(maxValue) && maxValue < minValue) {
      addErrorState(elements.maxValueInput);
    }
  }

  // Update UI
  elements.btnPopTB.disabled = errors.length > 0;
  
  clearElement(elements.errorList);
  errors.forEach(msg => {
    const li = createSafeElement('li', msg);
    elements.errorList.appendChild(li);
  });
  
  elements.errorPanel.classList.toggle('visible', errors.length > 0);
}

/**
 * Add error state to input
 */
function addErrorState(inputElement) {
  const row = inputElement.closest('.input-row');
  if (row) row.classList.add('error-state');
}

/**
 * Remove error state from input
 */
function removeErrorState(inputElement) {
  const row = inputElement.closest('.input-row');
  if (row) row.classList.remove('error-state');
}

/**
 * Setup keyboard navigation for radio groups
 */
function setupKeyboardNavigation() {
  const radioGroups = document.querySelectorAll('.radio-group');
  radioGroups.forEach(group => {
    const radios = group.querySelectorAll('input[type="radio"]');
    radios.forEach((radio, index) => {
      radio.addEventListener('keydown', (e) => {
        let newIndex;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          newIndex = (index + 1) % radios.length;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          newIndex = (index - 1 + radios.length) % radios.length;
        }
        if (newIndex !== undefined) {
          radios[newIndex].focus();
          radios[newIndex].checked = true;
          radios[newIndex].dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  });
}

/**
 * Setup help icon keyboard support
 */
function setupHelpIconSupport() {
  const helpIcons = document.querySelectorAll('.help-icon');
  helpIcons.forEach(icon => {
    icon.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        icon.blur();
      }
    });
  });
}

/**
 * Setup tab trap for popup
 */
function setupTabTrap() {
  const focusableElements = document.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return;
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
}
