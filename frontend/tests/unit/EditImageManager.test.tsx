import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditImageManager } from '../../src/components/common/EditImageManager';

const defaultProps = {
  existingImages: [],
  newImages: [],
  onExistingImagesChange: vi.fn(),
  onNewImagesChange: vi.fn(),
};

describe('EditImageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock alert
    global.alert = vi.fn();
  });

  // --------------------------------------------------------------------------
  // Light Variant Tests
  // --------------------------------------------------------------------------
  describe('Light Variant', () => {
    it('uses white background with light variant', () => {
      const { container } = render(<EditImageManager {...defaultProps} variant="light" />);

      const addButton = screen.getByRole('button', { name: /add image/i });
      expect(addButton).toHaveClass('bg-gray-50');
      expect(addButton).toHaveClass('hover:bg-white');
    });

    it('uses gray borders with light variant', () => {
      const { container } = render(<EditImageManager {...defaultProps} variant="light" />);

      const addButton = screen.getByRole('button', { name: /add image/i });
      expect(addButton).toHaveClass('border-gray-300');
    });

    it('uses gray text with light variant', () => {
      const { container } = render(<EditImageManager {...defaultProps} variant="light" />);

      const addButton = screen.getByRole('button', { name: /add image/i });
      expect(addButton).toHaveClass('text-gray-400');
    });

    it('displays existing images with light variant styling', () => {
      const props = {
        ...defaultProps,
        existingImages: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      };

      const { container } = render(<EditImageManager {...props} variant="light" />);

      const images = screen.getAllByAltText(/existing image/i);
      expect(images).toHaveLength(2);

      // Check that the parent container has light variant classes
      const imageContainer = images[0].closest('.group');
      expect(imageContainer).toHaveClass('border-gray-300');
      expect(imageContainer).toHaveClass('bg-gray-50');
    });

    it('shows light variant label styling', () => {
      render(<EditImageManager {...defaultProps} variant="light" />);

      const label = screen.getByText(/product images/i);
      expect(label).toHaveClass('text-gray-700');
    });

    it('shows light variant remove button styling', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        existingImages: ['https://example.com/image1.jpg'],
      };

      render(<EditImageManager {...props} variant="light" />);

      const removeButton = screen.getByRole('button', { name: /remove existing image/i });
      expect(removeButton).toHaveClass('bg-white/90');
      expect(removeButton).toHaveClass('text-gray-700');
    });

    it('applies hover state to add button with light variant', () => {
      render(<EditImageManager {...defaultProps} variant="light" />);

      const addButton = screen.getByRole('button', { name: /add image/i });
      expect(addButton).toHaveClass('hover:border-orange');
      expect(addButton).toHaveClass('hover:text-orange');
    });
  });

  // --------------------------------------------------------------------------
  // Dark Variant Tests (No Regression)
  // --------------------------------------------------------------------------
  describe('Dark Variant (Default)', () => {
    it('uses dark background when variant is dark', () => {
      render(<EditImageManager {...defaultProps} variant="dark" />);

      const addButton = screen.getByRole('button', { name: /add image/i });
      expect(addButton).toHaveClass('bg-dark-elevated');
      expect(addButton).toHaveClass('hover:bg-dark-surface');
    });

    it('uses dark borders when variant is dark', () => {
      render(<EditImageManager {...defaultProps} variant="dark" />);

      const addButton = screen.getByRole('button', { name: /add image/i });
      expect(addButton).toHaveClass('border-dark-border');
    });

    it('uses dark variant as default when no variant specified', () => {
      render(<EditImageManager {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add image/i });
      expect(addButton).toHaveClass('bg-dark-elevated');
    });

    it('displays existing images with dark variant styling', () => {
      const props = {
        ...defaultProps,
        existingImages: ['https://example.com/image1.jpg'],
      };

      render(<EditImageManager {...props} variant="dark" />);

      const image = screen.getByAltText(/existing image/i);
      const imageContainer = image.closest('.group');
      expect(imageContainer).toHaveClass('border-dark-border');
      expect(imageContainer).toHaveClass('bg-dark-elevated');
    });

    it('shows dark variant label styling', () => {
      render(<EditImageManager {...defaultProps} variant="dark" />);

      const label = screen.getByText(/product images/i);
      expect(label).toHaveClass('text-text-secondary');
    });

    it('shows dark variant remove button styling', () => {
      const props = {
        ...defaultProps,
        existingImages: ['https://example.com/image1.jpg'],
      };

      render(<EditImageManager {...props} variant="dark" />);

      const removeButton = screen.getByRole('button', { name: /remove existing image/i });
      expect(removeButton).toHaveClass('bg-dark-bg/80');
      expect(removeButton).toHaveClass('text-text-primary');
    });
  });

  // --------------------------------------------------------------------------
  // Functionality Tests (Both Variants)
  // --------------------------------------------------------------------------
  describe('Core Functionality', () => {
    it('displays existing images', () => {
      const props = {
        ...defaultProps,
        existingImages: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      };

      render(<EditImageManager {...props} />);

      const images = screen.getAllByAltText(/existing image/i);
      expect(images).toHaveLength(3);
    });

    it('displays new images', async () => {
      const file1 = new File(['dummy'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['dummy'], 'test2.jpg', { type: 'image/jpeg' });

      const props = {
        ...defaultProps,
        newImages: [file1, file2],
      };

      render(<EditImageManager {...props} />);

      await waitFor(() => {
        const images = screen.getAllByAltText(/new image/i);
        expect(images).toHaveLength(2);
      });
    });

    it('calls onExistingImagesChange when removing existing image', async () => {
      const user = userEvent.setup();
      const onExistingImagesChange = vi.fn();
      const props = {
        ...defaultProps,
        existingImages: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        onExistingImagesChange,
      };

      render(<EditImageManager {...props} />);

      const removeButton = screen.getAllByRole('button', { name: /remove existing image/i })[0];
      await user.click(removeButton);

      expect(onExistingImagesChange).toHaveBeenCalledWith(['https://example.com/image2.jpg']);
    });

    it('calls onNewImagesChange when removing new image', async () => {
      const user = userEvent.setup();
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const onNewImagesChange = vi.fn();

      const props = {
        ...defaultProps,
        newImages: [file],
        onNewImagesChange,
      };

      render(<EditImageManager {...props} />);

      await waitFor(() => {
        expect(screen.getByAltText(/new image/i)).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove new image/i });
      await user.click(removeButton);

      expect(onNewImagesChange).toHaveBeenCalledWith([]);
    });

    it('calls onNewImagesChange when adding new images', async () => {
      const user = userEvent.setup();
      const onNewImagesChange = vi.fn();

      render(<EditImageManager {...defaultProps} onNewImagesChange={onNewImagesChange} />);

      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      expect(onNewImagesChange).toHaveBeenCalledWith([file]);
    });

    it('limits total images to maxImages prop', async () => {
      const user = userEvent.setup();
      const onNewImagesChange = vi.fn();
      const props = {
        ...defaultProps,
        existingImages: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        onNewImagesChange,
        maxImages: 3,
      };

      render(<EditImageManager {...props} />);

      const files = [
        new File(['dummy'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['dummy'], 'test2.jpg', { type: 'image/jpeg' }),
      ];
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, files);

      // Should only add 1 file because we already have 2 existing and max is 3
      expect(onNewImagesChange).toHaveBeenCalledWith([files[0]]);
    });

    it('hides add button when at max images', () => {
      const props = {
        ...defaultProps,
        existingImages: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
        maxImages: 3,
      };

      render(<EditImageManager {...props} />);

      expect(screen.queryByRole('button', { name: /add image/i })).not.toBeInTheDocument();
    });

    it('shows add button when below max images', () => {
      const props = {
        ...defaultProps,
        existingImages: ['https://example.com/image1.jpg'],
        maxImages: 3,
      };

      render(<EditImageManager {...props} />);

      expect(screen.getByRole('button', { name: /add image/i })).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
      const props = {
        ...defaultProps,
        error: 'At least one image is required',
      };

      render(<EditImageManager {...props} />);

      expect(screen.getByText('At least one image is required')).toBeInTheDocument();
    });

    it('shows max images count in label', () => {
      render(<EditImageManager {...defaultProps} maxImages={5} />);

      expect(screen.getByText(/max 5/i)).toBeInTheDocument();
    });

    it('uses default max of 5 when not specified', () => {
      render(<EditImageManager {...defaultProps} />);

      expect(screen.getByText(/max 5/i)).toBeInTheDocument();
    });

    it('alerts user when file is too large', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert');

      render(<EditImageManager {...defaultProps} />);

      // Create a file larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, largeFile);

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('exceeds 5MB limit')
      );
    });

    it('rejects file that is not an image', async () => {
      const user = userEvent.setup();
      const onNewImagesChange = vi.fn();

      render(<EditImageManager {...defaultProps} onNewImagesChange={onNewImagesChange} />);

      const textFile = new File(['dummy'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, textFile);

      // Should not call onNewImagesChange for invalid file
      expect(onNewImagesChange).not.toHaveBeenCalled();
    });

    it('creates object URLs for new images', async () => {
      const user = userEvent.setup();
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const props = {
        ...defaultProps,
        newImages: [file],
      };

      render(<EditImageManager {...props} />);

      await waitFor(() => {
        expect(createObjectURLSpy).toHaveBeenCalledWith(file);
      });
    });

    it('revokes object URLs on unmount', () => {
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const props = {
        ...defaultProps,
        newImages: [file],
      };

      const { unmount } = render(<EditImageManager {...props} />);

      unmount();

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('resets file input after selection', async () => {
      const user = userEvent.setup();

      render(<EditImageManager {...defaultProps} />);

      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      expect(input.value).toBe('');
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('handles empty existingImages array', () => {
      render(<EditImageManager {...defaultProps} existingImages={[]} />);

      expect(screen.queryByAltText(/existing image/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add image/i })).toBeInTheDocument();
    });

    it('handles empty newImages array', () => {
      render(<EditImageManager {...defaultProps} newImages={[]} />);

      expect(screen.queryByAltText(/new image/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add image/i })).toBeInTheDocument();
    });

    it('handles both existing and new images together', async () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const props = {
        ...defaultProps,
        existingImages: ['https://example.com/image1.jpg'],
        newImages: [file],
      };

      render(<EditImageManager {...props} />);

      expect(screen.getByAltText(/existing image/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByAltText(/new image/i)).toBeInTheDocument();
      });
    });

    it('handles multiple file selection', async () => {
      const user = userEvent.setup();
      const onNewImagesChange = vi.fn();

      render(<EditImageManager {...defaultProps} onNewImagesChange={onNewImagesChange} />);

      const files = [
        new File(['dummy'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['dummy'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['dummy'], 'test3.jpg', { type: 'image/jpeg' }),
      ];
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, files);

      expect(onNewImagesChange).toHaveBeenCalledWith(files);
    });

    it('handles custom maxImages value', () => {
      const props = {
        ...defaultProps,
        existingImages: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        maxImages: 10,
      };

      render(<EditImageManager {...props} />);

      expect(screen.getByText(/max 10/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add image/i })).toBeInTheDocument();
    });
  });
});
