/**
 * Constants and Configuration Values
 */

// DOM Selectors
export const SELECTORS = {
  TRIAL_BALANCE_FORM: 'form.UIForm.trial-balance',
  TABLE_ROWS: 'tr.odd, tr.even',
  ACCOUNT_NAME: 'span.nominal_account_name',
  CREDIT_INPUT: 'input[name*=credit]',
  DEBIT_INPUT: 'input[name*=debit]',
  SAVE_BUTTON: 'button.save'
};

// Timing Constants
export const TIMING = {
  TOAST_DURATION: 2000,
  TOAST_HIDE_DELAY: 300
};

// Validation Constants
export const VALIDATION = {
  MIN_DENSITY: 1,
  MAX_DENSITY: 100,
  MIN_VALUE: 0,
  MAX_VALUE: 9999999,
  DEFAULT_MIN: 1,
  DEFAULT_MAX: 9999
};

// Posting Types
export const POSTING_TYPES = {
  BOTH: 'both',
  CREDIT_ONLY: 'creditOnly',
  DEBIT_ONLY: 'debitOnly'
};

export const VALID_POSTING_TYPES = [
  POSTING_TYPES.BOTH,
  POSTING_TYPES.CREDIT_ONLY,
  POSTING_TYPES.DEBIT_ONLY
];

// Excluded Account Terms
export const EXCLUDED_TERMS = /(brought forward|prior period adjustments|effects of changes in accounting policies)/i;

// Default Preferences
export const DEFAULT_PREFERENCES = {
  postingType: POSTING_TYPES.BOTH,
  includeBF: false,
  minValue: String(VALIDATION.DEFAULT_MIN),
  maxValue: String(VALIDATION.DEFAULT_MAX),
  density: String(VALIDATION.MAX_DENSITY)
};

// Density Labels
export const DENSITY_LABELS = [
  { max: 1, label: 'the bare minimum' },
  { max: 10, label: 'hardly any' },
  { max: 40, label: 'just a few' },
  { max: 60, label: 'about half' },
  { max: 75, label: 'a reasonable amount' },
  { max: 99, label: 'quite a lot' },
  { max: 100, label: 'As many as possible' }
];
