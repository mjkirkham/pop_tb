# Testing Guide

## Overview

This project uses **Jest 27** as the testing framework with **jsdom** for DOM testing. Tests are located in the `/tests` directory, mirroring the `/src` structure.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests verbosely
npm run test:verbose
```

## Test Structure

```
tests/
├── setup.js                 # Global test setup and mocks
└── lib/
    ├── validator.test.js    # Validation logic tests
    ├── utils.test.js        # Utility function tests
    └── storage.test.js      # Storage module tests
```

## Coverage Status

### Tested Modules (100% coverage):
- ✅ `src/lib/constants.js` - Configuration and constants
- ✅ `src/lib/storage.js` - Storage operations
- ✅ `src/lib/utils.js` - Utility functions
- ✅ `src/lib/validator.js` - Input validation

### Modules Needing Tests:
- ⏳ `src/lib/browserAPI.js` - Browser API abstraction (12% covered)
- ⏳ `src/lib/contentScriptInjector.js` - Script injection (0% covered)
- ⏳ `src/lib/theme.js` - Theme management (0% covered)
- ⏳ `src/ui/popup.js` - Popup UI controller (0% covered)
- ⏳ `src/content/content.js` - Content script (0% covered)
- ⏳ `src/background/background.js` - Background script (0% covered)

## Writing Tests

### Test File Template

```javascript
/**
 * Tests for Module Name
 */

import { functionToTest } from '../../src/lib/module.js';

describe('Module Name', () => {
  describe('functionToTest', () => {
    test('should do something expected', () => {
      const result = functionToTest('input');
      expect(result).toBe('expected output');
    });
  });
});
```

### Browser API Mocks

Browser APIs are automatically mocked in `tests/setup.js`:
- `chrome.storage.local` (Chrome callback-style)
- `browser.storage.local` (Firefox Promise-style)
- `chrome.tabs` and `browser.tabs`
- `chrome.scripting` and `browser.scripting`
- `window.matchMedia` for theme tests

### Best Practices

1. **Test one thing at a time** - Each test should verify one specific behavior
2. **Use descriptive names** - Test names should clearly state what's being tested
3. **Arrange-Act-Assert** - Set up, execute, verify pattern
4. **Test edge cases** - Empty inputs, null values, boundary conditions
5. **Mock external dependencies** - Browser APIs, DOM elements, async operations

## Coverage Thresholds

The project enforces minimum coverage thresholds:
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

Current overall coverage: **22.27%** (61 tests)

## Known Issues

- Node.js v12.22.12 is used, which requires Jest 27 (not the latest version)
- Some console warnings about Node version are expected but can be ignored
- Coverage thresholds will fail until more modules are tested

## Next Steps

1. Add tests for `contentScriptInjector.js`
2. Add tests for `theme.js`
3. Add integration tests for `popup.js`
4. Add integration tests for `content.js`
5. Reach 80%+ overall coverage
