import '@testing-library/jest-dom/vitest';
import { server } from '../src/mocks/server';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Suppress jsdom "Could not parse CSS stylesheet" errors from third-party CSS (e.g. Swiper)
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Could not parse CSS stylesheet')) {
    return;
  }
  originalConsoleError(...args);
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
