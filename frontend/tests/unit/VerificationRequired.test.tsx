import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { VerificationRequired } from '../../src/components/common/VerificationRequired';

const renderComponent = (props = {}) => {
  return render(
    <MemoryRouter>
      <VerificationRequired {...props} />
    </MemoryRouter>,
  );
};

describe('VerificationRequired', () => {
  it('renders with default props', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: /email verification required/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/you need to verify your email address/i),
    ).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /go to homepage/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders with custom message', () => {
    renderComponent({ message: 'Custom verification message' });

    expect(screen.getByText('Custom verification message')).toBeInTheDocument();
  });

  it('renders with custom back link', () => {
    renderComponent({ backTo: '/products', backLabel: 'Back to Products' });

    const link = screen.getByRole('link', { name: /back to products/i });
    expect(link).toHaveAttribute('href', '/products');
  });

  it('phone variant shows "Phone Verification Required" heading', () => {
    renderComponent({ type: 'phone' });

    expect(
      screen.getByRole('heading', { name: /phone verification required/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/you need to verify your phone number/i),
    ).toBeInTheDocument();
  });

  it('phone variant shows phone icon (not email icon)', () => {
    const { container } = renderComponent({ type: 'phone' });

    // Phone icon contains the phone SVG path (M10.5 1.5H8.25...)
    const svgs = container.querySelectorAll('svg');
    const phoneIconPaths = Array.from(svgs).flatMap((svg) =>
      Array.from(svg.querySelectorAll('path')),
    );

    // Verify a phone icon path exists (path containing phone-specific coordinates)
    const hasPhonePath = phoneIconPaths.some((path) =>
      path.getAttribute('d')?.includes('M10.5 1.5H8.25'),
    );
    expect(hasPhonePath).toBe(true);

    // Verify email icon path is NOT present (email has M21.75 6.75v10.5)
    const hasEmailPath = phoneIconPaths.some((path) =>
      path.getAttribute('d')?.includes('M21.75 6.75v10.5'),
    );
    expect(hasEmailPath).toBe(false);
  });
});
