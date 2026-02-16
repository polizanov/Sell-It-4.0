import { ReactNode } from 'react';
import { useMouseGradient } from '@/hooks/useMouseGradient';

interface MouseFollowGradientProps {
  children: ReactNode;
  activationMode?: 'always' | 'hover';
  gradientColor?: string;
  gradientSize?: number;
  className?: string;
  disableOnMobile?: boolean;
}

/**
 * Wrapper component that adds a mouse-following gradient effect to its children
 * The gradient follows the mouse cursor with smooth interpolation
 */
export const MouseFollowGradient = ({
  children,
  activationMode = 'hover',
  gradientColor = 'rgba(255, 87, 34, 0.15)',
  gradientSize = 50,
  className = '',
  disableOnMobile = true,
}: MouseFollowGradientProps) => {
  const { containerRef, isActive } = useMouseGradient({
    activationMode,
    gradientColor,
    gradientSize,
    disableOnTouch: disableOnMobile,
  });

  return (
    <div ref={containerRef} className={`relative flex flex-col ${className}`}>
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse var(--gradient-size, ${gradientSize}%) var(--gradient-size, ${gradientSize}%) at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--gradient-color, ${gradientColor}) 0%, transparent 100%)`,
          opacity: isActive ? 1 : 0,
        }}
      />
      {/* Content */}
      <div className="relative z-10 flex-1">{children}</div>
    </div>
  );
};
