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

// Mock IntersectionObserver which is not available in jsdom.
// Required by components that use infinite scroll (e.g. AllProducts).
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  disconnect(): void {}
  observe(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve(): void {}
}
global.IntersectionObserver = MockIntersectionObserver;

// Mock matchMedia which is not available in jsdom.
// Required by components that use the useMouseGradient hook.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
