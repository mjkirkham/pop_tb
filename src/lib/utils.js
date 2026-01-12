/**
 * Utility Functions
 * Common helper functions used across the extension
 */

/**
 * Shuffle array in place using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Determine posting side (credit or debit)
 * @param {string} postingType - Posting type ('both', 'creditOnly', 'debitOnly')
 * @returns {string} 'credit' or 'debit'
 */
export function selectPostingSide(postingType) {
  const postingTypes = {
    creditOnly: 'credit',
    debitOnly: 'debit'
  };
  
  return postingTypes[postingType] || (Math.floor(Math.random() * 2) === 0 ? 'credit' : 'debit');
}

/**
 * Check if row is not a brought forward account
 * @param {HTMLElement} row - Table row element
 * @param {RegExp} excludedTerms - Regex pattern for excluded terms
 * @returns {boolean}
 */
export function isNotBroughtForward(row, excludedTerms) {
  const accountNameElement = row.querySelector('span.nominal_account_name');
  if (!accountNameElement) return false;
  
  const accountName = accountNameElement.innerText;
  return !excludedTerms.test(accountName);
}

/**
 * Create a safe DOM element with text content
 * @param {string} tagName - HTML tag name
 * @param {string} textContent - Text content to set
 * @returns {HTMLElement}
 */
export function createSafeElement(tagName, textContent) {
  const element = document.createElement(tagName);
  element.textContent = textContent;
  return element;
}

/**
 * Clear all children from an element safely
 * @param {HTMLElement} element - Element to clear
 */
export function clearElement(element) {
  element.textContent = '';
}
