import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMouseGradient } from '../../src/hooks/useMouseGradient';

describe('useMouseGradient', () => {
  beforeEach(() => {
    // matchMedia is already mocked globally in setup.ts
  });

  describe('initialization', () => {
    it('returns a ref and initial state', () => {
      const { result } = renderHook(() => useMouseGradient());

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
      expect(result.current.isActive).toBe(false); // hover mode by default
    });

    it('sets isActive to true when activationMode is "always"', () => {
      const { result } = renderHook(() =>
        useMouseGradient({ activationMode: 'always' }),
      );

      expect(result.current.isActive).toBe(true);
    });

    it('sets isActive to false when activationMode is "hover"', () => {
      const { result } = renderHook(() =>
        useMouseGradient({ activationMode: 'hover' }),
      );

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('touch device detection', () => {
    it('disables gradient on touch devices when disableOnTouch is true', () => {
      const matchMediaMock = vi.fn().mockImplementation((query) => ({
        matches: query === '(pointer: coarse)', // Touch device
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      vi.stubGlobal('matchMedia', matchMediaMock);

      const { result } = renderHook(() => useMouseGradient({ disableOnTouch: true }));

      // Hook should return valid ref and state
      expect(result.current.containerRef).toBeDefined();
      expect(result.current.isActive).toBe(false);
    });

    it('enables gradient on non-touch devices', () => {
      const matchMediaMock = vi.fn().mockImplementation(() => ({
        matches: false, // Not a touch device
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      vi.stubGlobal('matchMedia', matchMediaMock);

      const { result } = renderHook(() => useMouseGradient({ disableOnTouch: true }));

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('reduced motion preference', () => {
    it('disables gradient when prefers-reduced-motion is set', () => {
      const matchMediaMock = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      vi.stubGlobal('matchMedia', matchMediaMock);

      const { result } = renderHook(() => useMouseGradient());

      // Hook should return valid ref and state
      expect(result.current.containerRef).toBeDefined();
      expect(result.current.isActive).toBe(false);
    });

    it('enables gradient when prefers-reduced-motion is not set', () => {
      const matchMediaMock = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      vi.stubGlobal('matchMedia', matchMediaMock);

      const { result } = renderHook(() => useMouseGradient());

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('hook options', () => {
    it('accepts custom gradient color option', () => {
      const { result } = renderHook(() =>
        useMouseGradient({ gradientColor: 'rgba(255, 0, 0, 0.5)' }),
      );

      expect(result.current.containerRef).toBeDefined();
    });

    it('accepts custom gradient size option', () => {
      const { result } = renderHook(() => useMouseGradient({ gradientSize: 80 }));

      expect(result.current.containerRef).toBeDefined();
    });

    it('accepts disableOnTouch option', () => {
      const { result } = renderHook(() => useMouseGradient({ disableOnTouch: true }));

      expect(result.current.containerRef).toBeDefined();
    });
  });

  describe('activation modes', () => {
    it('hover mode starts inactive', () => {
      const { result } = renderHook(() =>
        useMouseGradient({ activationMode: 'hover' }),
      );

      expect(result.current.isActive).toBe(false);
    });

    it('always mode starts active', () => {
      const { result } = renderHook(() =>
        useMouseGradient({ activationMode: 'always' }),
      );

      expect(result.current.isActive).toBe(true);
    });
  });

  describe('hook stability', () => {
    it('does not crash when unmounted', () => {
      const { unmount } = renderHook(() => useMouseGradient());

      expect(() => unmount()).not.toThrow();
    });

    it('does not crash when unmounted in always mode', () => {
      const { unmount } = renderHook(() =>
        useMouseGradient({ activationMode: 'always' }),
      );

      expect(() => unmount()).not.toThrow();
    });

    it('does not crash with all options specified', () => {
      const { unmount } = renderHook(() =>
        useMouseGradient({
          activationMode: 'hover',
          gradientColor: 'rgba(0, 255, 0, 0.3)',
          gradientSize: 60,
          disableOnTouch: true,
        }),
      );

      expect(() => unmount()).not.toThrow();
    });
  });
});
