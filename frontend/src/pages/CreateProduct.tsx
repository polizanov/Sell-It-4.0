import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

const CreateProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    image: null as File | null,
  });

  const [errors, setErrors] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    general: '',
  });

  const categories = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports',
    'Musical Instruments',
    'Books',
    'Toys & Games',
    'Other',
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({ title: '', description: '', price: '', category: '', general: '' });

    // Validation
    let hasErrors = false;
    const newErrors = { title: '', description: '', price: '', category: '', general: '' };

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

    if (!formData.category) {
      newErrors.category = 'Please select a category';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    // For now, just log the form data (API integration later)
    console.log('Create Product form submitted:', {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      image: formData.image,
    });

    // Show success message and redirect
    alert('Product created successfully! (This is a demo - API integration pending)');
    navigate('/profile');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Create New Product
          </h1>
          <p className="text-text-secondary">
            List your item and reach potential buyers
          </p>
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

            <div className="w-full">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Category
                <span className="text-orange ml-1">*</span>
              </label>
              <select
                className={`w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 ${
                  errors.category ? 'border-red-500 focus:ring-red-500' : ''
                } ${!formData.category ? 'text-text-muted' : ''}`}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
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
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Product Image
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-orange file:text-white file:cursor-pointer hover:file:bg-orange-hover focus:outline-none focus:ring-2 focus:ring-orange transition-all duration-200"
                />
              </div>
              {formData.image && (
                <p className="mt-2 text-sm text-text-secondary">
                  Selected: {formData.image.name}
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="primary" size="md" fullWidth>
                Create Product
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
