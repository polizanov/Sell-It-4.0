import { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { ProductGrid } from '../components/products/ProductGrid';
import { mockProducts } from '../data/mockProducts';

const AllProducts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Get unique categories from products
  const categories = Array.from(new Set(mockProducts.map((p) => p.category)));

  // Filter products based on search and category (static UI for now)
  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            All Products
          </h1>
          <p className="text-text-secondary">
            Browse all available listings
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-dark-elevated border border-dark-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent transition-all duration-200 ${
                !selectedCategory ? 'text-text-muted' : ''
              }`}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category} className="text-text-primary">
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-text-secondary">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}
              className="text-orange hover:text-orange-hover text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        <ProductGrid products={filteredProducts} />
      </div>
    </PageContainer>
  );
};

export default AllProducts;
