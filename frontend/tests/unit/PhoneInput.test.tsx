import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneInput } from '../../src/components/common/PhoneInput';

// Mock react-phone-number-input to render a simple input element
vi.mock('react-phone-number-input', () => ({
  default: ({
    id,
    value,
    onChange,
    className,
  }: {
    id?: string;
    value: string;
    onChange: (value: string | undefined) => void;
    className?: string;
  }) => (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value || undefined)}
      data-testid="phone-input"
      className={className}
    />
  ),
}));

vi.mock('react-phone-number-input/style.css', () => ({}));

describe('PhoneInput', () => {
  it('renders label when provided', () => {
    render(<PhoneInput label="Phone Number" value="" onChange={vi.fn()} />);

    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    const label = screen.getByText('Phone Number');
    expect(label.tagName).toBe('LABEL');
  });

  it('does not render label when not provided', () => {
    const { container } = render(<PhoneInput value="" onChange={vi.fn()} />);

    expect(container.querySelector('label')).not.toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    render(
      <PhoneInput
        label="Phone Number"
        value=""
        onChange={vi.fn()}
        error="Phone number is required"
      />,
    );

    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
  });

  it('does not show error message when error prop is not provided', () => {
    const { container } = render(
      <PhoneInput label="Phone Number" value="" onChange={vi.fn()} />,
    );

    // No error paragraph should be rendered
    const errorP = container.querySelector('.text-red-600');
    expect(errorP).not.toBeInTheDocument();
  });

  it('calls onChange handler when input value changes', () => {
    const handleChange = vi.fn();

    render(
      <PhoneInput label="Phone Number" value="" onChange={handleChange} />,
    );

    const input = screen.getByTestId('phone-input');
    fireEvent.change(input, { target: { value: '+359888123456' } });

    expect(handleChange).toHaveBeenCalledWith('+359888123456');
  });
});
