import { useState, FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CATEGORIES } from '../../constants/categories';
import { EditImageManager } from '../common/EditImageManager';
import { productService } from '../../services/productService';
import type { ApiError } from '../../types';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const;

interface EditProductFormProps {
  productId: string;
  initialData: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    existingImages: string[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditProductForm = ({ productId, initialData, onSuccess, onCancel }: EditProductFormProps) => {
  const [formData, setFormData] = useState({
    title: initialData.title,
    description: initialData.description,
    price: initialData.price.toFixed(2),
    category: initialData.category,
    condition: initialData.condition,
  });

  const [existingImages, setExistingImages] = useState<string[]>(initialData.existingImages);
  const [newImages, setNewImages] = useState<File[]>([]);

  const [errors, setErrors] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    images: '',
    general: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({
      title: '',
      description: '',
      price: '',
      category: '',
      condition: '',
      images: '',
      general: '',
    });

    // Validation
    let hasErrors = false;
    const newErrors = {
      title: '',
      description: '',
      price: '',
      category: '',
      condition: '',
      images: '',
      general: '',
    };

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
      hasErrors = true;
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      hasErrors = true;
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
      hasErrors = true;
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
      hasErrors = true;
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
      hasErrors = true;
    }

    if (!formData.condition) {
      newErrors.condition = 'Condition is required';
      hasErrors = true;
    }

    if (existingImages.length + newImages.length === 0) {
      newErrors.images = 'At least one image is required';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await productService.update(productId, {
        ...formData,
        existingImages,
        newImages,
      });

      if (response.data.data) {
        onSuccess();
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const message =
        axiosError.response?.data?.message || 'An unexpected error occurred. Please try again.';
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500 text-sm">
          {errors.general}
        </div>
      )}

      <Input
        type="text"
        label="Product Title"
        placeholder="e.g., Vintage Camera"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={errors.title}
        required
        variant="light"
      />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
          <span className="text-orange ml-1">*</span>
        </label>
        <textarea
          className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 resize-y min-h-[120px] ${
            errors.description ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          placeholder="Describe your product in detail..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
        {errors.description && (
          <p className="mt-2 text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      <Input
        type="number"
        label="Price"
        placeholder="0.00"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        error={errors.price}
        required
        min="0"
        step="0.01"
        variant="light"
      />

      <div className="w-full">
        <label
          htmlFor="modal-edit-category"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Category
          <span className="text-orange ml-1">*</span>
        </label>
        <select
          id="modal-edit-category"
          className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 ${
            errors.category ? 'border-red-500 focus:ring-red-500' : ''
          } ${!formData.category ? 'text-gray-400' : ''}`}
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
        >
          <option value="">Select category</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category} className="text-gray-900">
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-2 text-sm text-red-500">{errors.category}</p>
        )}
      </div>

      <div className="w-full">
        <label
          htmlFor="modal-edit-condition"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Condition
          <span className="text-orange ml-1">*</span>
        </label>
        <select
          id="modal-edit-condition"
          className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 ${
            errors.condition ? 'border-red-500 focus:ring-red-500' : ''
          } ${!formData.condition ? 'text-gray-400' : ''}`}
          value={formData.condition}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          required
        >
          <option value="">Select condition</option>
          {CONDITIONS.map((condition) => (
            <option key={condition} value={condition} className="text-gray-900">
              {condition}
            </option>
          ))}
        </select>
        {errors.condition && (
          <p className="mt-2 text-sm text-red-500">{errors.condition}</p>
        )}
      </div>

      <EditImageManager
        existingImages={existingImages}
        newImages={newImages}
        onExistingImagesChange={setExistingImages}
        onNewImagesChange={setNewImages}
        error={errors.images}
        variant="light"
      />

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="button"
          className="px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed w-full bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          disabled={isSubmitting}
          gradient
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};
