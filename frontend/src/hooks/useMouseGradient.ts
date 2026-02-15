import { useEffect, useRef, useState } from 'react';

export interface UseMouseGradientOptions {
  activationMode?: 'always' | 'hover';
  gradientColor?: string;
  gradientSize?: number;
  disableOnTouch?: boolean;
}

export interface UseMouseGradientReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
}

/**
 * Custom hook for creating a mouse-following gradient effect
 * Optimized for 60fps performance using requestAnimationFrame
 */
export const useMouseGradient = ({
  activationMode = 'hover',
  gradientColor = 'rgba(255, 87, 34, 0.15)',
  gradientSize = 50,
  disableOnTouch = true,
}: UseMouseGradientOptions = {}): UseMouseGradientReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(activationMode === 'always');
  const rafRef = useRef<number | null>(null);
  const mousePositionRef = useRef({ x: 50, y: 50 });
  const currentPositionRef = useRef({ x: 50, y: 50 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect touch devices
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (disableOnTouch && isTouchDevice) {
      return;
    }

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    // Animation loop for smooth interpolation
    const animate = () => {
      if (!container) return;

      // Smooth interpolation for smoother movement
      const lerp = 0.15;
      currentPositionRef.current.x +=
        (mousePositionRef.current.x - currentPositionRef.current.x) * lerp;
      currentPositionRef.current.y +=
        (mousePositionRef.current.y - currentPositionRef.current.y) * lerp;

      // Update CSS custom properties
      container.style.setProperty('--mouse-x', `${currentPositionRef.current.x}%`);
      container.style.setProperty('--mouse-y', `${currentPositionRef.current.y}%`);
      container.style.setProperty('--gradient-color', gradientColor);
      container.style.setProperty('--gradient-size', `${gradientSize}%`);

      rafRef.current = requestAnimationFrame(animate);
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp values between 0 and 100
      mousePositionRef.current = {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    };

    // Mouse enter/leave handlers for hover mode
    const handleMouseEnter = () => {
      if (activationMode === 'hover') {
        setIsActive(true);
      }
    };

    const handleMouseLeave = () => {
      if (activationMode === 'hover') {
        setIsActive(false);
        // Reset position to center when leaving
        mousePositionRef.current = { x: 50, y: 50 };
        currentPositionRef.current = { x: 50, y: 50 };
      }
    };

    // Attach event listeners
    container.addEventListener('mousemove', handleMouseMove);
    if (activationMode === 'hover') {
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    // Start animation loop
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      container.removeEventListener('mousemove', handleMouseMove);
      if (activationMode === 'hover') {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [activationMode, gradientColor, gradientSize, disableOnTouch]);

  return {
    containerRef,
    isActive,
  };
};
