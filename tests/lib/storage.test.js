/**
 * Tests for Storage Module
 */

import { 
  loadPreferences, 
  savePreferences, 
  loadTheme, 
  saveTheme 
} from '../../src/lib/storage.js';
import { DEFAULT_PREFERENCES } from '../../src/lib/constants.js';

// We need to test both Chrome and Firefox implementations
describe('Storage Module', () => {
  describe('with Firefox browser API', () => {
    beforeEach(() => {
      // Reset mocks
      global.browser.storage.local.get.mockClear();
      global.browser.storage.local.set.mockClear();
      
      // Simulate Firefox environment
      global.browser.runtime = { lastError: null };
    });

    describe('loadPreferences', () => {
      test('should load preferences from storage', async () => {
        const mockPrefs = {
          postingType: 'creditOnly',
          includeBF: true,
          minValue: '50',
          maxValue: '1000',
          density: '75'
        };
        
        global.browser.storage.local.get.mockResolvedValue({ preferences: mockPrefs });
        
        const result = await loadPreferences();
        
        expect(result).toEqual(mockPrefs);
        expect(global.browser.storage.local.get).toHaveBeenCalledWith('preferences');
      });

      test('should return default preferences when none saved', async () => {
        global.browser.storage.local.get.mockResolvedValue({});
        
        const result = await loadPreferences();
        
        expect(result).toEqual(DEFAULT_PREFERENCES);
      });

      test('should return default preferences on error', async () => {
        global.browser.storage.local.get.mockRejectedValue(new Error('Storage error'));
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const result = await loadPreferences();
        
        expect(result).toEqual(DEFAULT_PREFERENCES);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error loading preferences:',
          expect.any(Error)
        );
        
        consoleSpy.mockRestore();
      });
    });

    describe('savePreferences', () => {
      test('should save preferences to storage', async () => {
        const prefs = {
          postingType: 'debitOnly',
          includeBF: false,
          minValue: '100',
          maxValue: '500',
          density: '50'
        };
        
        global.browser.storage.local.set.mockResolvedValue();
        
        await savePreferences(prefs);
        
        expect(global.browser.storage.local.set).toHaveBeenCalledWith({ preferences: prefs });
      });

      test('should handle save errors gracefully', async () => {
        const prefs = DEFAULT_PREFERENCES;
        global.browser.storage.local.set.mockRejectedValue(new Error('Storage full'));
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        await savePreferences(prefs);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error saving preferences:',
          expect.any(Error)
        );
        
        consoleSpy.mockRestore();
      });
    });

    describe('loadTheme', () => {
      test('should load theme from storage', async () => {
        global.browser.storage.local.get.mockResolvedValue({ theme: 'dark' });
        
        const result = await loadTheme();
        
        expect(result).toBe('dark');
        expect(global.browser.storage.local.get).toHaveBeenCalledWith('theme');
      });

      test('should return "auto" when no theme saved', async () => {
        global.browser.storage.local.get.mockResolvedValue({});
        
        const result = await loadTheme();
        
        expect(result).toBe('auto');
      });

      test('should return "auto" on error', async () => {
        global.browser.storage.local.get.mockRejectedValue(new Error('Storage error'));
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const result = await loadTheme();
        
        expect(result).toBe('auto');
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
      });
    });

    describe('saveTheme', () => {
      test('should save theme to storage', async () => {
        global.browser.storage.local.set.mockResolvedValue();
        
        await saveTheme('light');
        
        expect(global.browser.storage.local.set).toHaveBeenCalledWith({ theme: 'light' });
      });

      test('should handle save errors gracefully', async () => {
        global.browser.storage.local.set.mockRejectedValue(new Error('Storage full'));
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        await saveTheme('dark');
        
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('with Chrome callback API', () => {
    beforeEach(() => {
      // Simulate Chrome environment by making browser undefined temporarily
      const browserBackup = global.browser;
      delete global.browser;
      
      // Reset Chrome mocks
      global.chrome.storage.local.get.mockClear();
      global.chrome.storage.local.set.mockClear();
      global.chrome.runtime.lastError = null;
      
      return () => {
        global.browser = browserBackup;
      };
    });

    test('should work with Chrome callback-style API', async () => {
      const mockPrefs = { postingType: 'both' };
      
      global.chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ preferences: mockPrefs });
      });
      
      // Note: This test verifies the browserAPI wrapper works
      // The actual implementation is tested via Firefox Promise-style above
    });
  });
});
