// Add any global setup needed for Jest tests
import '@testing-library/jest-dom';

// This extends Jest's expect method with methods for asserting on DOM nodes
// https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => ({ get: jest.fn() })),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:3003';
