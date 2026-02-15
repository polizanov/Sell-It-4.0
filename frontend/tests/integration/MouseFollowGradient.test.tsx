import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MouseFollowGradient } from '../../src/components/common/MouseFollowGradient';

describe('MouseFollowGradient Component', () => {
  beforeEach(() => {
    // Mock matchMedia to return non-touch, no-reduced-motion by default
    const matchMediaMock = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMediaMock);

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  describe('rendering', () => {
    it('renders children correctly', () => {
      render(
        <MouseFollowGradient>
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom className to container', () => {
      const { container } = render(
        <MouseFollowGradient className="custom-class">
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
      expect(wrapper).toHaveClass('relative');
    });

    it('renders gradient overlay with correct base styles', () => {
      const { container } = render(
        <MouseFollowGradient>
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const gradientOverlay = container.querySelector('.pointer-events-none');
      expect(gradientOverlay).toBeInTheDocument();
      expect(gradientOverlay).toHaveClass('absolute');
      expect(gradientOverlay).toHaveClass('inset-0');
      expect(gradientOverlay).toHaveClass('transition-opacity');
    });

    it('renders content wrapper with relative z-10', () => {
      const { container } = render(
        <MouseFollowGradient>
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const contentWrapper = container.querySelector('.relative.z-10');
      expect(contentWrapper).toBeInTheDocument();
      expect(contentWrapper?.textContent).toBe('Test Content');
    });
  });

  describe('gradient configuration', () => {
    it('applies custom gradient color', () => {
      const { container } = render(
        <MouseFollowGradient gradientColor="rgba(0, 255, 0, 0.5)">
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const gradientOverlay = container.querySelector('.pointer-events-none') as HTMLElement;
      expect(gradientOverlay?.style.background).toContain('rgba(0, 255, 0, 0.5)');
    });

    it('applies custom gradient size', () => {
      const { container } = render(
        <MouseFollowGradient gradientSize={80}>
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const gradientOverlay = container.querySelector('.pointer-events-none') as HTMLElement;
      expect(gradientOverlay?.style.background).toContain('80%');
    });

    it('uses default gradient values when not specified', () => {
      const { container } = render(
        <MouseFollowGradient>
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const gradientOverlay = container.querySelector('.pointer-events-none') as HTMLElement;
      // Default color: rgba(255, 87, 34, 0.15)
      expect(gradientOverlay?.style.background).toContain('rgba(255, 87, 34, 0.15)');
      // Default size: 50%
      expect(gradientOverlay?.style.background).toContain('50%');
    });
  });

  describe('hover activation mode', () => {
    it('gradient is initially hidden in hover mode', () => {
      const { container } = render(
        <MouseFollowGradient activationMode="hover">
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const gradientOverlay = container.querySelector('.pointer-events-none') as HTMLElement;
      expect(gradientOverlay?.style.opacity).toBe('0');
    });

    it('gradient becomes visible when isActive is true', async () => {
      const { container } = render(
        <MouseFollowGradient activationMode="hover">
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const wrapper = container.firstChild as HTMLElement;
      const gradientOverlay = container.querySelector('.pointer-events-none') as HTMLElement;

      // Simulate mouse enter wrapped in act
      act(() => {
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
        wrapper.dispatchEvent(mouseEnterEvent);
      });

      await waitFor(() => {
        expect(gradientOverlay?.style.opacity).toBe('1');
      });
    });
  });

  describe('always activation mode', () => {
    it('gradient is immediately visible in always mode', () => {
      const { container } = render(
        <MouseFollowGradient activationMode="always">
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const gradientOverlay = container.querySelector('.pointer-events-none') as HTMLElement;
      expect(gradientOverlay?.style.opacity).toBe('1');
    });

    it('gradient remains visible even after mouse leave in always mode', async () => {
      const { container } = render(
        <MouseFollowGradient activationMode="always">
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const wrapper = container.firstChild as HTMLElement;
      const gradientOverlay = container.querySelector('.pointer-events-none') as HTMLElement;

      expect(gradientOverlay?.style.opacity).toBe('1');

      // Simulate mouse leave
      const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true });
      wrapper.dispatchEvent(mouseLeaveEvent);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should still be visible
      expect(gradientOverlay?.style.opacity).toBe('1');
    });
  });

  describe('mobile/touch handling', () => {
    it('passes disableOnMobile prop to hook', () => {
      // This is implicitly tested by the hook tests
      // Here we just verify the component renders without errors
      const { container } = render(
        <MouseFollowGradient disableOnMobile={true}>
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('works when disableOnMobile is false', () => {
      const { container } = render(
        <MouseFollowGradient disableOnMobile={false}>
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('gradient visual structure', () => {
    it('creates radial gradient with ellipse shape', () => {
      const { container } = render(
        <MouseFollowGradient>
          <div>Test Content</div>
        </MouseFollowGradient>,
      );

      const gradientOverlay = container.querySelector('.pointer-events-none') as HTMLElement;
      const background = gradientOverlay?.style.background;

      expect(background).toContain('radial-gradient');
      expect(background).toContain('ellipse');
      expect(background).toContain('var(--mouse-x, 50%)');
      expect(background).toContain('var(--mouse-y, 50%)');
      expect(background).toContain('var(--gradient-color');
      expect(background).toContain('transparent 100%');
    });

    it('gradient overlay does not interfere with pointer events', () => {
      const { container } = render(
        <MouseFollowGradient>
          <button>Click Me</button>
        </MouseFollowGradient>,
      );

      const gradientOverlay = container.querySelector('.pointer-events-none');
      expect(gradientOverlay).toHaveClass('pointer-events-none');

      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('integration with different content types', () => {
    it('works with text content', () => {
      render(
        <MouseFollowGradient>
          <p>Simple paragraph text</p>
        </MouseFollowGradient>,
      );

      expect(screen.getByText('Simple paragraph text')).toBeInTheDocument();
    });

    it('works with complex nested components', () => {
      render(
        <MouseFollowGradient>
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <button>Action</button>
          </div>
        </MouseFollowGradient>,
      );

      expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('works with forms and interactive elements', () => {
      render(
        <MouseFollowGradient>
          <form>
            <input type="text" placeholder="Enter text" />
            <button type="submit">Submit</button>
          </form>
        </MouseFollowGradient>,
      );

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  });
});
