// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock the fetch API
global.fetch = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.resetAllMocks();
});

// Add any global test setup here

// Mock MessageEvent
global.MessageEvent = class MessageEvent {
  constructor(type, init) {
    this.type = type;
    this.data = init.data;
    this.target = init.target || null;
    this.currentTarget = init.currentTarget || null;
  }
};

// Mock querySelector
if (typeof document.querySelector !== 'function') {
  document.querySelector = jest.fn();
}

// For Next.js
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    pathname: '/',
    asPath: '/',
    events: {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    },
    push: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
  }),
})); 