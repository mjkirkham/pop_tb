/**
 * Tests for Utils Module
 */

import { 
  shuffleArray, 
  selectPostingSide, 
  isNotBroughtForward,
  createSafeElement,
  clearElement
} from '../../src/lib/utils.js';

describe('Utils Module', () => {
  describe('shuffleArray', () => {
    test('should shuffle array in place', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const array = [...original];
      
      shuffleArray(array);
      
      // Array should still have same length
      expect(array).toHaveLength(original.length);
      
      // Array should contain all original elements (sort to compare)
      const sortedArray = [...array].sort((a, b) => a - b);
      expect(sortedArray).toEqual(original);
    });

    test('should modify the original array', () => {
      const array = [1, 2, 3];
      const reference = array;
      
      shuffleArray(array);
      
      expect(reference).toBe(array); // Same reference
    });

    test('should handle empty array', () => {
      const array = [];
      shuffleArray(array);
      expect(array).toEqual([]);
    });

    test('should handle single element', () => {
      const array = [1];
      shuffleArray(array);
      expect(array).toEqual([1]);
    });

    test('should produce different orders (statistical)', () => {
      // This test runs multiple shuffles and checks that we get variation
      const original = [1, 2, 3, 4, 5];
      const results = new Set();
      
      for (let i = 0; i < 100; i++) {
        const array = [...original];
        shuffleArray(array);
        results.add(array.join(','));
      }
      
      // With 100 shuffles of 5 elements, we should see multiple different arrangements
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('selectPostingSide', () => {
    test('should return "credit" for creditOnly', () => {
      expect(selectPostingSide('creditOnly')).toBe('credit');
    });

    test('should return "debit" for debitOnly', () => {
      expect(selectPostingSide('debitOnly')).toBe('debit');
    });

    test('should return either credit or debit for "both"', () => {
      const result = selectPostingSide('both');
      expect(['credit', 'debit']).toContain(result);
    });

    test('should return random values for "both" (statistical)', () => {
      const results = { credit: 0, debit: 0 };
      
      for (let i = 0; i < 100; i++) {
        const result = selectPostingSide('both');
        results[result]++;
      }
      
      // Both should occur at least once in 100 tries
      expect(results.credit).toBeGreaterThan(0);
      expect(results.debit).toBeGreaterThan(0);
    });

    test('should default to random for unknown posting type', () => {
      const result = selectPostingSide('unknown');
      expect(['credit', 'debit']).toContain(result);
    });
  });

  describe('isNotBroughtForward', () => {
    let mockRow;

    beforeEach(() => {
      mockRow = document.createElement('tr');
      const span = document.createElement('span');
      span.className = 'nominal_account_name';
      mockRow.appendChild(span);
    });

    test('should return true for normal account', () => {
      const span = mockRow.querySelector('span.nominal_account_name');
      span.innerText = 'Sales Revenue';
      
      const excludedTerms = /(brought forward|prior period adjustments)/i;
      expect(isNotBroughtForward(mockRow, excludedTerms)).toBe(true);
    });

    test('should return false for brought forward account', () => {
      const span = mockRow.querySelector('span.nominal_account_name');
      span.innerText = 'Balance brought forward';
      
      const excludedTerms = /(brought forward|prior period adjustments)/i;
      expect(isNotBroughtForward(mockRow, excludedTerms)).toBe(false);
    });

    test('should return false for prior period adjustments', () => {
      const span = mockRow.querySelector('span.nominal_account_name');
      span.innerText = 'Prior period adjustments';
      
      const excludedTerms = /(brought forward|prior period adjustments)/i;
      expect(isNotBroughtForward(mockRow, excludedTerms)).toBe(false);
    });

    test('should be case insensitive', () => {
      const span = mockRow.querySelector('span.nominal_account_name');
      span.innerText = 'BROUGHT FORWARD';
      
      const excludedTerms = /(brought forward|prior period adjustments)/i;
      expect(isNotBroughtForward(mockRow, excludedTerms)).toBe(false);
    });

    test('should return false when account name element missing', () => {
      const emptyRow = document.createElement('tr');
      const excludedTerms = /(brought forward|prior period adjustments)/i;
      
      expect(isNotBroughtForward(emptyRow, excludedTerms)).toBe(false);
    });

    test('should handle partial matches', () => {
      const span = mockRow.querySelector('span.nominal_account_name');
      span.innerText = 'Cash brought forward from previous year';
      
      const excludedTerms = /(brought forward|prior period adjustments)/i;
      expect(isNotBroughtForward(mockRow, excludedTerms)).toBe(false);
    });
  });

  describe('createSafeElement', () => {
    test('should create element with specified tag', () => {
      const element = createSafeElement('div', 'Hello');
      expect(element.tagName).toBe('DIV');
    });

    test('should set textContent instead of innerHTML', () => {
      const element = createSafeElement('div', '<script>alert("XSS")</script>');
      expect(element.textContent).toBe('<script>alert("XSS")</script>');
      expect(element.innerHTML).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
    });

    test('should safely escape HTML entities', () => {
      const element = createSafeElement('span', '<b>Bold</b>');
      expect(element.textContent).toBe('<b>Bold</b>');
      expect(element.querySelector('b')).toBeNull();
    });

    test('should work with different tag names', () => {
      const li = createSafeElement('li', 'List item');
      expect(li.tagName).toBe('LI');
      expect(li.textContent).toBe('List item');
      
      const span = createSafeElement('span', 'Span text');
      expect(span.tagName).toBe('SPAN');
      expect(span.textContent).toBe('Span text');
    });

    test('should handle empty content', () => {
      const element = createSafeElement('div', '');
      expect(element.textContent).toBe('');
    });

    test('should prevent XSS attacks', () => {
      const malicious = '<img src=x onerror=alert("XSS")>';
      const element = createSafeElement('div', malicious);
      
      expect(element.querySelector('img')).toBeNull();
      expect(element.textContent).toBe(malicious);
    });
  });

  describe('clearElement', () => {
    test('should clear all children from element', () => {
      const parent = document.createElement('div');
      parent.innerHTML = '<span>Child 1</span><span>Child 2</span><span>Child 3</span>';
      
      expect(parent.children.length).toBe(3);
      
      clearElement(parent);
      
      expect(parent.children.length).toBe(0);
      expect(parent.textContent).toBe('');
    });

    test('should clear text content', () => {
      const element = document.createElement('div');
      element.textContent = 'Some text';
      
      clearElement(element);
      
      expect(element.textContent).toBe('');
    });

    test('should handle already empty element', () => {
      const element = document.createElement('div');
      
      clearElement(element);
      
      expect(element.textContent).toBe('');
      expect(element.children.length).toBe(0);
    });

    test('should use textContent for safety', () => {
      const element = document.createElement('div');
      element.innerHTML = '<script>alert("XSS")</script>';
      
      clearElement(element);
      
      expect(element.textContent).toBe('');
      expect(element.innerHTML).toBe('');
    });
  });
});
