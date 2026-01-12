/**
 * Tests for Validator Module
 */

import { 
  validateTrialBalanceParams, 
  validateFormInputs, 
  getFriendlyDensityLabel 
} from '../../src/lib/validator.js';

describe('Validator Module', () => {
  describe('validateTrialBalanceParams', () => {
    test('should accept valid parameters', () => {
      const params = {
        density: '50',
        minValue: '100',
        maxValue: '500',
        postingType: 'both'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject density below minimum', () => {
      const params = {
        density: '0',
        minValue: '100',
        maxValue: '500',
        postingType: 'both'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Density must be a number between 1 and 100.');
    });

    test('should reject density above maximum', () => {
      const params = {
        density: '101',
        minValue: '100',
        maxValue: '500',
        postingType: 'both'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Density must be a number between 1 and 100.');
    });

    test('should reject negative minimum value', () => {
      const params = {
        density: '50',
        minValue: '-10',
        maxValue: '500',
        postingType: 'both'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Minimum value must be a non-negative number.');
    });

    test('should reject maximum value less than minimum value', () => {
      const params = {
        density: '50',
        minValue: '500',
        maxValue: '100',
        postingType: 'both'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Maximum value cannot be less than minimum value.');
    });

    test('should reject values exceeding MAX_VALUE', () => {
      const params = {
        density: '50',
        minValue: '1',
        maxValue: '10000000',
        postingType: 'both'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Maximum value cannot exceed 9,999,999.');
    });

    test('should reject invalid posting type', () => {
      const params = {
        density: '50',
        minValue: '100',
        maxValue: '500',
        postingType: 'invalid'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid posting type specified.');
    });

    test('should accept creditOnly posting type', () => {
      const params = {
        density: '50',
        minValue: '100',
        maxValue: '500',
        postingType: 'creditOnly'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(true);
    });

    test('should accept debitOnly posting type', () => {
      const params = {
        density: '50',
        minValue: '100',
        maxValue: '500',
        postingType: 'debitOnly'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(true);
    });

    test('should reject NaN density', () => {
      const params = {
        density: 'not-a-number',
        minValue: '100',
        maxValue: '500',
        postingType: 'both'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should accumulate multiple errors', () => {
      const params = {
        density: '0',
        minValue: '-10',
        maxValue: '50',
        postingType: 'invalid'
      };
      
      const result = validateTrialBalanceParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateFormInputs', () => {
    let minInput, maxInput;

    beforeEach(() => {
      minInput = document.createElement('input');
      minInput.type = 'number';
      minInput.min = '0';
      minInput.max = '9999999';
      
      maxInput = document.createElement('input');
      maxInput.type = 'number';
      maxInput.min = '1';
      maxInput.max = '9999999';
    });

    test('should accept valid input values', () => {
      minInput.value = '100';
      maxInput.value = '500';
      
      const errors = validateFormInputs(minInput, maxInput);
      expect(errors).toHaveLength(0);
    });

    test('should reject max less than min', () => {
      minInput.value = '500';
      maxInput.value = '100';
      
      const errors = validateFormInputs(minInput, maxInput);
      expect(errors).toContain('Maximum value cannot be less than the minimum value.');
    });

    test('should reject NaN minimum value', () => {
      minInput.value = 'abc';
      maxInput.value = '500';
      
      const errors = validateFormInputs(minInput, maxInput);
      expect(errors).toContain('Minimum value must be a valid number.');
    });

    test('should reject NaN maximum value', () => {
      minInput.value = '100';
      maxInput.value = 'xyz';
      
      const errors = validateFormInputs(minInput, maxInput);
      expect(errors).toContain('Maximum value must be a valid number.');
    });

    test('should reject minimum value exceeding max attribute', () => {
      minInput.value = '10000000';
      maxInput.value = '10000001';
      
      const errors = validateFormInputs(minInput, maxInput);
      expect(errors).toContain('Minimum value cannot be greater than 9999999.');
    });
  });

  describe('getFriendlyDensityLabel', () => {
    test('should return "the bare minimum" for 1', () => {
      expect(getFriendlyDensityLabel(1)).toBe('the bare minimum');
    });

    test('should return "hardly any" for values ≤10', () => {
      expect(getFriendlyDensityLabel(5)).toBe('hardly any');
      expect(getFriendlyDensityLabel(10)).toBe('hardly any');
    });

    test('should return "just a few" for values ≤40', () => {
      expect(getFriendlyDensityLabel(25)).toBe('just a few');
      expect(getFriendlyDensityLabel(40)).toBe('just a few');
    });

    test('should return "about half" for values ≤60', () => {
      expect(getFriendlyDensityLabel(50)).toBe('about half');
      expect(getFriendlyDensityLabel(60)).toBe('about half');
    });

    test('should return "a reasonable amount" for values ≤75', () => {
      expect(getFriendlyDensityLabel(70)).toBe('a reasonable amount');
      expect(getFriendlyDensityLabel(75)).toBe('a reasonable amount');
    });

    test('should return "quite a lot" for values <100', () => {
      expect(getFriendlyDensityLabel(85)).toBe('quite a lot');
      expect(getFriendlyDensityLabel(99)).toBe('quite a lot');
    });

    test('should return "As many as possible" for 100', () => {
      expect(getFriendlyDensityLabel(100)).toBe('As many as possible');
    });

    test('should handle string input', () => {
      expect(getFriendlyDensityLabel('50')).toBe('about half');
    });
  });
});
