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
});
