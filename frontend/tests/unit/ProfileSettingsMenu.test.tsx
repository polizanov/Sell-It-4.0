import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileSettingsMenu } from '../../src/components/auth/ProfileSettingsMenu';

describe('ProfileSettingsMenu', () => {
  const mockOnChangePhoto = vi.fn();
  const mockOnChangePassword = vi.fn();
  const mockOnDeleteAccount = vi.fn();

  beforeEach(() => {
    mockOnChangePhoto.mockClear();
    mockOnChangePassword.mockClear();
    mockOnDeleteAccount.mockClear();
  });

  const renderMenu = () => {
    return render(
      <ProfileSettingsMenu
        onChangePhoto={mockOnChangePhoto}
        onChangePassword={mockOnChangePassword}
        onDeleteAccount={mockOnDeleteAccount}
      />,
    );
  };

  it('renders gear icon button', () => {
    renderMenu();

    const button = screen.getByRole('button', { name: /profile settings/i });
    expect(button).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    renderMenu();

    const button = screen.getByRole('button', { name: /profile settings/i });
    fireEvent.click(button);

    expect(screen.getByText('Change Photo')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('shows 3 menu items when dropdown is open', () => {
    renderMenu();

    const gearButton = screen.getByRole('button', { name: /profile settings/i });
    fireEvent.click(gearButton);

    const menuButtons = screen.getAllByRole('button');
    // gear button + 3 menu items = 4 buttons
    expect(menuButtons).toHaveLength(4);
  });

  it('does not show dropdown initially', () => {
    renderMenu();

    expect(screen.queryByText('Change Photo')).not.toBeInTheDocument();
    expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
  });

  it('calls onChangePhoto callback when Change Photo is clicked', () => {
    renderMenu();

    const gearButton = screen.getByRole('button', { name: /profile settings/i });
    fireEvent.click(gearButton);

    fireEvent.click(screen.getByText('Change Photo'));

    expect(mockOnChangePhoto).toHaveBeenCalledTimes(1);
  });

  it('calls onChangePassword callback when Change Password is clicked', () => {
    renderMenu();

    const gearButton = screen.getByRole('button', { name: /profile settings/i });
    fireEvent.click(gearButton);

    fireEvent.click(screen.getByText('Change Password'));

    expect(mockOnChangePassword).toHaveBeenCalledTimes(1);
  });

  it('calls onDeleteAccount callback when Delete Account is clicked', () => {
    renderMenu();

    const gearButton = screen.getByRole('button', { name: /profile settings/i });
    fireEvent.click(gearButton);

    fireEvent.click(screen.getByText('Delete Account'));

    expect(mockOnDeleteAccount).toHaveBeenCalledTimes(1);
  });

  it('closes dropdown after selecting an option', () => {
    renderMenu();

    const gearButton = screen.getByRole('button', { name: /profile settings/i });
    fireEvent.click(gearButton);

    expect(screen.getByText('Change Photo')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Change Photo'));

    // Dropdown should be closed after selection
    expect(screen.queryByText('Change Photo')).not.toBeInTheDocument();
    expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Account')).not.toBeInTheDocument();
  });

  it('closes dropdown on click outside', () => {
    renderMenu();

    const gearButton = screen.getByRole('button', { name: /profile settings/i });
    fireEvent.click(gearButton);

    expect(screen.getByText('Change Photo')).toBeInTheDocument();

    // Click outside the menu
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('Change Photo')).not.toBeInTheDocument();
  });

  it('toggles dropdown on repeated gear button clicks', () => {
    renderMenu();

    const gearButton = screen.getByRole('button', { name: /profile settings/i });

    // Open
    fireEvent.click(gearButton);
    expect(screen.getByText('Change Photo')).toBeInTheDocument();

    // Close
    fireEvent.click(gearButton);
    expect(screen.queryByText('Change Photo')).not.toBeInTheDocument();
  });

  it('sets aria-expanded attribute correctly', () => {
    renderMenu();

    const gearButton = screen.getByRole('button', { name: /profile settings/i });
    expect(gearButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(gearButton);
    expect(gearButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(gearButton);
    expect(gearButton).toHaveAttribute('aria-expanded', 'false');
  });
});
