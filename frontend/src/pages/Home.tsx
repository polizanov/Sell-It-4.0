import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { ProductGrid } from '../components/products/ProductGrid';
import { productService } from '../services/productService';
import type { Product, PaginationInfo } from '../types';

/** Skeleton placeholder for the product grid while loading */
const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="bg-dark-surface border border-dark-border rounded-xl p-4 animate-pulse"
      >
        <div className="w-full h-48 bg-dark-elevated rounded-lg mb-4" />
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="h-5 bg-dark-elevated rounded w-2/3" />
            <div className="h-6 bg-dark-elevated rounded w-16" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 bg-dark-elevated rounded w-20" />
            <div className="h-6 bg-dark-elevated rounded w-16" />
          </div>
          <div className="h-4 bg-dark-elevated rounded w-full" />
          <div className="h-4 bg-dark-elevated rounded w-3/4" />
          <div className="pt-4 border-t border-dark-border">
            <div className="h-4 bg-dark-elevated rounded w-28" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Home = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories on mount
  useEffect(() => {
    productService.getCategories().then((res) => {
      setCategories(res.data.data);
    });
  }, []);

  // Fetch products — resets to page 1 when filters change
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');

    productService
      .getAll({
        page: 1,
        category: selectedCategory || undefined,
        search: debouncedSearch || undefined,
      })
      .then((res) => {
        if (!cancelled) {
          setProducts(res.products);
          setPagination(res.pagination);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load products');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, selectedCategory]);

  // Load more products (next page)
  const loadMore = useCallback(() => {
    if (!pagination || !pagination.hasMore || isLoadingMore) return;
    setIsLoadingMore(true);

    productService
      .getAll({
        page: pagination.currentPage + 1,
        category: selectedCategory || undefined,
        search: debouncedSearch || undefined,
      })
      .then((res) => {
        setProducts((prev) => [...prev, ...res.products]);
        setPagination(res.pagination);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load more products');
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [pagination, isLoadingMore, selectedCategory, debouncedSearch]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="min-h-screen">
      {/* Hero Section - NON-AUTHENTICATED ONLY */}
      {!isAuthenticated && (
        <section className="relative bg-gradient-hero border-b border-dark-border overflow-hidden">
        {/* Orange gradient overlay */}
        <div className="absolute inset-0 bg-gradient-hero-orange pointer-events-none" />

        <PageContainer className="py-20 md:py-32 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6">
              Welcome to <span className="text-orange">Sell-It</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-10">
              Your trusted marketplace for buying and selling anything, easily
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="primary"
                size="lg"
                className="min-w-[200px] bg-gradient-cta hover:bg-gradient-cta-hover shadow-lg shadow-orange/30"
                onClick={() => {
                  const productsSection = document.querySelector('section.bg-dark-bg');
                  productsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Browse Products
              </Button>
              <Link to={isAuthenticated && user?.isVerified !== false ? '/create-product' : '/login'}>
                <Button variant="secondary" size="lg" className="min-w-[200px]">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
        </section>
      )}

      {/* Features Section - NON-AUTHENTICATED ONLY */}
      {!isAuthenticated && (
        <section className="bg-dark-surface border-t border-dark-border">
        <PageContainer className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Easy to Sell</h3>
              <p className="text-text-secondary">List your items in minutes and reach buyers instantly</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Secure Trading</h3>
              <p className="text-text-secondary">Safe and secure platform for all your transactions</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Growing Community</h3>
              <p className="text-text-secondary">Join thousands of buyers and sellers today</p>
            </div>
          </div>
        </PageContainer>
        </section>
      )}

      {/* Full Product Listing - ALWAYS VISIBLE */}
      <section className="bg-dark-bg">
        <PageContainer>
          {/* Page header for authenticated users only */}
          {isAuthenticated && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-text-primary mb-2">All Products</h1>
              <p className="text-text-secondary">Browse all available listings</p>
            </div>
          )}

          <div className="space-y-8">
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

            {/* Results Count & Clear Filters */}
            <div className="flex items-center justify-between">
              <p className="text-text-secondary">
                {isLoading
                  ? 'Loading products...'
                  : pagination
                    ? `Showing ${products.length} of ${pagination.totalProducts} products`
                    : 'No products found'}
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

            {/* Error State */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Products Grid */}
            {isLoading ? <ProductGridSkeleton /> : <ProductGrid products={products} />}

            {/* Infinite Scroll Sentinel */}
            <div ref={sentinelRef} />

            {/* Loading More Spinner */}
            {isLoadingMore && (
              <div className="flex justify-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-orange"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>
        </PageContainer>
      </section>
    </div>
  );
};

export default Home;
