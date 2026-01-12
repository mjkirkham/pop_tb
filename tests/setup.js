/**
 * Test Setup File
 * Sets up global mocks and utilities for testing
 */

// Mock browser APIs
global.chrome = {
  runtime: {
    lastError: null,
    onInstalled: { addListener: jest.fn() },
    onMessage: { addListener: jest.fn() }
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        callback({});
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
      })
    }
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      callback([{ id: 1, url: 'https://example.com' }]);
    }),
    sendMessage: jest.fn((tabId, message, callback) => {
      if (callback) callback({ status: 'success' });
    }),
    onUpdated: { addListener: jest.fn() }
  },
  scripting: {
    executeScript: jest.fn((injection, callback) => {
      if (callback) callback([{ result: true }]);
    })
  }
};

// Mock browser (Firefox) API
global.browser = {
  runtime: {
    lastError: null,
    onInstalled: { addListener: jest.fn() },
    onMessage: { addListener: jest.fn() }
  },
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve())
    }
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([{ id: 1, url: 'https://example.com' }])),
    sendMessage: jest.fn(() => Promise.resolve({ status: 'success' })),
    onUpdated: { addListener: jest.fn() }
  },
  scripting: {
    executeScript: jest.fn(() => Promise.resolve([{ result: true }]))
  }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});
