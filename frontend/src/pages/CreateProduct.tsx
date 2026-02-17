import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { CATEGORIES } from '../constants/categories';
import { ImageUpload } from '../components/common/ImageUpload';
import { productService } from '../services/productService';
import type { ApiError } from '../types';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const;

const CreateProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    images: [] as File[],
  });

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

    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await productService.create(formData);

      if (response.data.data) {
        navigate(`/products/${response.data.data.id}`);
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
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Create New Product</h1>
          <p className="text-text-secondary">List your item and reach potential buyers</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
            />

            <div className="w-full">
              <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-2">
                Description
                <span className="text-orange ml-1">*</span>
              </label>
              <textarea
                id="description"
                className={`w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 resize-y min-h-[120px] ${
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
            />

            <div className="w-full">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Category
                <span className="text-orange ml-1">*</span>
              </label>
              <select
                id="category"
                className={`w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 ${
                  errors.category ? 'border-red-500 focus:ring-red-500' : ''
                } ${!formData.category ? 'text-text-muted' : ''}`}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} className="text-text-primary">
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
                htmlFor="condition"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Condition
                <span className="text-orange ml-1">*</span>
              </label>
              <select
                id="condition"
                className={`w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 ${
                  errors.condition ? 'border-red-500 focus:ring-red-500' : ''
                } ${!formData.condition ? 'text-text-muted' : ''}`}
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                required
              >
                <option value="">Select condition</option>
                {CONDITIONS.map((condition) => (
                  <option key={condition} value={condition} className="text-text-primary">
                    {condition}
                  </option>
                ))}
              </select>
              {errors.condition && (
                <p className="mt-2 text-sm text-red-500">{errors.condition}</p>
              )}
            </div>

            <ImageUpload
              images={formData.images}
              onChange={(images) => setFormData({ ...formData, images })}
              error={errors.images}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
              <Link to="/profile" className="flex-1">
                <Button type="button" variant="secondary" size="md" fullWidth>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
};

export default CreateProduct;
