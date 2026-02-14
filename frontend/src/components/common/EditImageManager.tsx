import { useRef, useMemo, useEffect } from 'react';

interface EditImageManagerProps {
  existingImages: string[];
  newImages: File[];
  onExistingImagesChange: (images: string[]) => void;
  onNewImagesChange: (images: File[]) => void;
  maxImages?: number;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const EditImageManager = ({
  existingImages,
  newImages,
  onExistingImagesChange,
  onNewImagesChange,
  maxImages = 5,
  error,
}: EditImageManagerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create object URLs synchronously so they're available during render
  const objectUrls = useMemo(() => newImages.map((image) => URL.createObjectURL(image)), [newImages]);

  // Revoke old URLs on change/unmount
  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [objectUrls]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name}: not an image file`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name}: exceeds 5MB limit`);
        return;
      }
      newFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      alert(`Invalid files:\n${invalidFiles.join('\n')}`);
    }

    const totalCurrent = existingImages.length + newImages.length;
    const remaining = maxImages - totalCurrent;
    const filesToAdd = newFiles.slice(0, remaining);

    if (filesToAdd.length > 0) {
      onNewImagesChange([...newImages, ...filesToAdd]);
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExistingImage = (index: number) => {
    const updated = existingImages.filter((_, i) => i !== index);
    onExistingImagesChange(updated);
  };

  const removeNewImage = (index: number) => {
    const updated = newImages.filter((_, i) => i !== index);
    onNewImagesChange(updated);
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-text-secondary mb-2">
        Product Images
        <span className="text-orange ml-1">*</span>
        <span className="text-text-muted ml-2 font-normal">(max {maxImages})</span>
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Existing images (Cloudinary URLs) */}
        {existingImages.map((url, index) => (
          <div
            key={`existing-${index}`}
            className="relative aspect-square rounded-lg overflow-hidden border border-dark-border bg-dark-elevated group"
          >
            <img
              src={url}
              alt={`Existing image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeExistingImage(index)}
              className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-dark-bg/80 text-text-primary hover:bg-red-600 hover:text-white transition-colors duration-200"
              aria-label={`Remove existing image ${index + 1}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        ))}

        {/* New images (File objects) */}
        {newImages.map((image, index) => (
          <div
            key={`new-${image.name}-${image.size}-${index}`}
            className="relative aspect-square rounded-lg overflow-hidden border border-dark-border bg-dark-elevated group"
          >
            <img
              src={objectUrls[index]}
              alt={`New image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeNewImage(index)}
              className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-dark-bg/80 text-text-primary hover:bg-red-600 hover:text-white transition-colors duration-200"
              aria-label={`Remove new image ${index + 1}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        ))}

        {/* Add Image button */}
        {totalImages < maxImages && (
          <button
            type="button"
            onClick={handleAddClick}
            className="aspect-square rounded-lg border-2 border-dashed border-dark-border bg-dark-elevated hover:border-orange hover:bg-dark-surface transition-all duration-200 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-orange cursor-pointer"
            aria-label="Add image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path
                fillRule="evenodd"
                d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium">Add Image</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};
