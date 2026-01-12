/**
 * Content Script - Trial Balance Manipulation
 * Runs on trial balance pages to populate/clear values
 */

import { SELECTORS, EXCLUDED_TERMS, POSTING_TYPES } from '../lib/constants.js';
import { validateTrialBalanceParams } from '../lib/validator.js';
import { shuffleArray, selectPostingSide, isNotBroughtForward } from '../lib/utils.js';

// Message listener
const messageHandler = (request, sender, sendResponse) => {
  if (request.action === 'populateTB') {
    try {
      clearTrialBalance();
      const result = populateTrialBalance(request.params);
      sendResponse({ status: 'success', ...result });
    } catch (error) {
      sendResponse({ 
        status: 'error', 
        errorType: 'populate_failed',
        message: error.message || 'Failed to populate the trial balance.'
      });
    }
  } else if (request.action === 'clearTB') {
    try {
      clearTrialBalance();
      sendResponse({ status: 'success' });
    } catch (error) {
      sendResponse({ 
        status: 'error', 
        errorType: 'clear_failed',
        message: error.message || 'Failed to clear the trial balance.'
      });
    }
  } else {
    sendResponse({ 
      status: 'error', 
      errorType: 'unknown_action', 
      message: 'Unknown action requested.' 
    });
  }
  
  return true; // Keep channel open for async response
};

// Register listener for both Chrome and Firefox
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener(messageHandler);
} else if (typeof browser !== 'undefined' && browser.runtime) {
  browser.runtime.onMessage.addListener(messageHandler);
}

/**
 * Populate trial balance with random values
 * @param {Object} params - Population parameters
 * @returns {Object} Result with rowsPopulated count
 */
function populateTrialBalance(params) {
  const { includeBF, minValue, maxValue, postingType, density } = params;
  
  // Validate inputs
  const validation = validateTrialBalanceParams(params);
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }
  
  // Parse validated values
  const parsedDensity = parseInt(density, 10);
  const minVal = parseInt(minValue, 10);
  const maxVal = parseInt(maxValue, 10);
  const range = maxVal - minVal + 1;
  
  const event = new Event('change', { bubbles: true });
  let total = 0;
  
  // Get all table rows
  let inputRows = Array.from(document.querySelectorAll(SELECTORS.TABLE_ROWS));
  
  if (inputRows.length === 0) {
    throw new Error('No trial balance rows found. The page structure may have changed.');
  }
  
  // Last row is for balancing
  const lastInputRow = inputRows.pop();
  
  // Filter out brought forward accounts if needed
  if (!includeBF) {
    inputRows = inputRows.filter(row => isNotBroughtForward(row, EXCLUDED_TERMS));
  }
  
  if (inputRows.length === 0) {
    throw new Error('No eligible rows to populate after filtering. Try enabling "Include brought forward accounts".');
  }
  
  // Handle density < 100% by randomly selecting rows
  if (parsedDensity < 100) {
    shuffleArray(inputRows);
    const rowsToFill = Math.floor(inputRows.length * (parsedDensity / 100));
    inputRows = inputRows.slice(0, rowsToFill);
  }
  
  // Populate selected rows
  let populatedCount = 0;
  inputRows.forEach(inputRow => {
    const postTo = selectPostingSide(postingType);
    const value = Math.floor(Math.random() * range) + minVal;
    const inputField = inputRow.querySelector(`input[name*=${postTo}]`);
    
    if (inputField) {
      inputField.value = value;
      populatedCount++;
      
      // Track running total
      if (postTo === 'debit') {
        total += value;
      } else {
        total -= value;
      }
    }
  });
  
  if (populatedCount === 0) {
    throw new Error('Could not find any input fields to populate. The page structure may have changed.');
  }
  
  // Balance the trial balance with final row
  const finalPostTo = (total <= 0) ? 'debit' : 'credit';
  const finalInputField = lastInputRow.querySelector(`input[name*=${finalPostTo}]`);
  
  if (finalInputField) {
    finalInputField.value = Math.abs(total);
    finalInputField.dispatchEvent(event);
  } else {
    throw new Error('Could not find the balancing row input field. The page structure may have changed.');
  }
  
  // Focus save button if available
  const saveButton = document.querySelector(SELECTORS.SAVE_BUTTON);
  if (saveButton) {
    saveButton.focus();
  }
  
  return { rowsPopulated: populatedCount + 1 };
}

/**
 * Clear all trial balance values
 */
function clearTrialBalance() {
  const event = new Event('change', { bubbles: true });
  const inputRows = document.querySelectorAll(SELECTORS.TABLE_ROWS);
  
  if (inputRows.length === 0) {
    throw new Error('No trial balance rows found to clear. The page structure may have changed.');
  }
  
  inputRows.forEach(row => {
    const creditInput = row.querySelector(SELECTORS.CREDIT_INPUT);
    const debitInput = row.querySelector(SELECTORS.DEBIT_INPUT);
    
    if (creditInput) creditInput.value = '';
    if (debitInput) debitInput.value = '';
  });
  
  // Trigger change event on first input to update the form
  const firstCreditInput = inputRows[0].querySelector(SELECTORS.CREDIT_INPUT);
  if (firstCreditInput) {
    firstCreditInput.dispatchEvent(event);
  }
}
