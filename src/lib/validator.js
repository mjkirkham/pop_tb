/**
 * Validation Module
 * Handles form validation logic
 */

import { VALIDATION, VALID_POSTING_TYPES } from './constants.js';

/**
 * Validate trial balance parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateTrialBalanceParams(params) {
  const errors = [];
  
  // Parse values
  const parsedDensity = parseInt(params.density, 10);
  const minVal = parseInt(params.minValue, 10);
  const maxVal = parseInt(params.maxValue, 10);
  
  // Validate density
  if (isNaN(parsedDensity) || parsedDensity < VALIDATION.MIN_DENSITY || parsedDensity > VALIDATION.MAX_DENSITY) {
    errors.push(`Density must be a number between ${VALIDATION.MIN_DENSITY} and ${VALIDATION.MAX_DENSITY}.`);
  }
  
  // Validate minimum value
  if (isNaN(minVal) || minVal < VALIDATION.MIN_VALUE) {
    errors.push(`Minimum value must be a non-negative number.`);
  }
  
  // Validate maximum value
  if (isNaN(maxVal) || maxVal < 1) {
    errors.push(`Maximum value must be a positive number.`);
  }
  
  // Validate range relationship
  if (!isNaN(minVal) && !isNaN(maxVal) && maxVal < minVal) {
    errors.push(`Maximum value cannot be less than minimum value.`);
  }
  
  // Validate upper bounds
  if (!isNaN(maxVal) && maxVal > VALIDATION.MAX_VALUE) {
    errors.push(`Maximum value cannot exceed ${VALIDATION.MAX_VALUE.toLocaleString()}.`);
  }
  
  if (!isNaN(minVal) && minVal > VALIDATION.MAX_VALUE) {
    errors.push(`Minimum value cannot exceed ${VALIDATION.MAX_VALUE.toLocaleString()}.`);
  }
  
  // Validate posting type
  if (!VALID_POSTING_TYPES.includes(params.postingType)) {
    errors.push(`Invalid posting type specified.`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate form input fields
 * @param {HTMLInputElement} minInput - Minimum value input
 * @param {HTMLInputElement} maxInput - Maximum value input
 * @returns {string[]} Array of error messages
 */
export function validateFormInputs(minInput, maxInput) {
  const errors = [];
  const minValue = parseInt(minInput.value, 10);
  const maxValue = parseInt(maxInput.value, 10);
  
  // Check for NaN
  if (isNaN(minValue)) {
    errors.push('Minimum value must be a valid number.');
  }
  
  if (isNaN(maxValue)) {
    errors.push('Maximum value must be a valid number.');
  }
  
  // Only proceed with other validations if values are numbers
  if (!isNaN(minValue) && !isNaN(maxValue)) {
    const rules = [
      {
        condition: maxValue < minValue,
        message: 'Maximum value cannot be less than the minimum value.'
      },
      {
        condition: minValue > parseInt(minInput.max, 10),
        message: `Minimum value cannot be greater than ${minInput.max}.`
      },
      {
        condition: minValue < parseInt(minInput.min, 10),
        message: `Minimum value cannot be less than ${minInput.min}.`
      },
      {
        condition: maxValue > parseInt(maxInput.max, 10),
        message: `Maximum value cannot be greater than ${maxInput.max}.`
      },
      {
        condition: maxValue < parseInt(maxInput.min, 10),
        message: `Maximum value cannot be less than ${maxInput.min}.`
      }
    ];
    
    rules.forEach(rule => {
      if (rule.condition) {
        errors.push(rule.message);
      }
    });
  }
  
  return errors;
}

/**
 * Get friendly density label
 * @param {number|string} densityValue - Density value (1-100)
 * @returns {string} Friendly label
 */
export function getFriendlyDensityLabel(densityValue) {
  const intDensity = parseInt(densityValue, 10);
  
  if (intDensity === 1) return 'the bare minimum';
  if (intDensity <= 10) return 'hardly any';
  if (intDensity <= 40) return 'just a few';
  if (intDensity <= 60) return 'about half';
  if (intDensity <= 75) return 'a reasonable amount';
  if (intDensity < 100) return 'quite a lot';
  return 'As many as possible';
}
