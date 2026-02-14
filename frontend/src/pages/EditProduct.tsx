import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AxiosError } from 'axios';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { CategoryAutocomplete } from '../components/common/CategoryAutocomplete';
import { EditImageManager } from '../components/common/EditImageManager';
import { productService } from '../services/productService';
import { useAuthStore } from '../store/authStore';
import type { Product, ApiError } from '../types';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const;

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
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

  useEffect(() => {
    if (!id) {
      setLoadError('No product ID provided');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProduct = async () => {
      setIsLoading(true);
      setLoadError(null);
      setNotFound(false);
      setNotAuthorized(false);

      try {
        const data = await productService.getById(id);
        if (cancelled) return;

        // Verify ownership
        if (user?.id !== data.sellerId) {
          setNotAuthorized(true);
          setIsLoading(false);
          return;
        }

        setProduct(data);
        setFormData({
          title: data.title,
          description: data.description,
          price: data.price.toFixed(2),
          category: data.category,
          condition: data.condition,
        });
        setExistingImages(data.images);
      } catch (err) {
        if (cancelled) return;

        const axiosError = err as AxiosError<ApiError>;
        const status = axiosError.response?.status;
        const message = axiosError.response?.data?.message || 'Failed to load product';

        if (status === 404) {
          setNotFound(true);
        } else {
          setLoadError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

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
      const response = await productService.update(id!, {
        ...formData,
        existingImages,
        newImages,
      });

      if (response.data.data) {
        navigate(`/products/${id}`);
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

  // Loading state
  if (isLoading) {
    return (
      <PageContainer className="py-16">
        <div className="max-w-2xl mx-auto">
          <div className="h-9 w-48 bg-dark-surface rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-dark-surface rounded animate-pulse mb-8" />
          <div className="bg-dark-surface rounded-lg p-8 space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 w-full bg-dark-elevated rounded animate-pulse" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <PageContainer className="py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Product Not Found</h1>
          <p className="text-text-secondary mb-8">
            Sorry, the product you're looking for doesn't exist.
          </p>
          <Link to="/products">
            <Button variant="primary">Back to Products</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  // Not authorized state
  if (notAuthorized) {
    return (
      <PageContainer className="py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Not Authorized</h1>
          <p className="text-text-secondary mb-8">
            You are not authorized to edit this product.
          </p>
          <Link to="/products">
            <Button variant="primary">Back to Products</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (loadError || !product) {
    return (
      <PageContainer className="py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Something Went Wrong</h1>
          <p className="text-text-secondary mb-8">{loadError || 'An unexpected error occurred'}</p>
          <Link to="/products">
            <Button variant="primary">Back to Products</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Edit Product</h1>
          <p className="text-text-secondary">Update your product listing</p>
        </div>

        <Card>
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
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Description
                <span className="text-orange ml-1">*</span>
              </label>
              <textarea
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

            <CategoryAutocomplete
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              error={errors.category}
              required
            />

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

            <EditImageManager
              existingImages={existingImages}
              newImages={newImages}
              onExistingImagesChange={setExistingImages}
              onNewImagesChange={setNewImages}
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link to={`/products/${id}`} className="flex-1">
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

export default EditProduct;
