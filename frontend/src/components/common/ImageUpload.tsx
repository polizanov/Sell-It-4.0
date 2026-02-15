import { useRef, useMemo, useEffect } from 'react';

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
  error?: string;
  variant?: 'dark' | 'light';
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ImageUpload = ({ images, onChange, maxImages = 5, error, variant = 'dark' }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create object URLs synchronously so they're available during render
  const objectUrls = useMemo(() => images.map((image) => URL.createObjectURL(image)), [images]);

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

    const remaining = maxImages - images.length;
    const filesToAdd = newFiles.slice(0, remaining);

    if (filesToAdd.length > 0) {
      onChange([...images, ...filesToAdd]);
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const imageContainerClasses = variant === 'light'
    ? 'relative aspect-square rounded-lg overflow-hidden border border-gray-300 bg-gray-50 group'
    : 'relative aspect-square rounded-lg overflow-hidden border border-dark-border bg-dark-elevated group';

  const addButtonClasses = variant === 'light'
    ? 'aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-orange hover:bg-white transition-all duration-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-orange cursor-pointer'
    : 'aspect-square rounded-lg border-2 border-dashed border-dark-border bg-dark-elevated hover:border-orange hover:bg-dark-surface transition-all duration-200 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-orange cursor-pointer';

  const removeButtonClasses = variant === 'light'
    ? 'absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-gray-700 hover:bg-red-600 hover:text-white transition-colors duration-200'
    : 'absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-dark-bg/80 text-text-primary hover:bg-red-600 hover:text-white transition-colors duration-200';

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <div
            key={`${image.name}-${image.size}-${index}`}
            className={imageContainerClasses}
          >
            <img
              src={objectUrls[index]}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className={removeButtonClasses}
              aria-label={`Remove image ${index + 1}`}
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

        {images.length < maxImages && (
          <button
            type="button"
            onClick={handleAddClick}
            className={addButtonClasses}
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
