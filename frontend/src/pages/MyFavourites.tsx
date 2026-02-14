import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProductGrid } from '../components/products/ProductGrid';
import { favouriteService } from '../services/favouriteService';
import type { Product, PaginationInfo } from '../types';

const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="bg-dark-surface border border-dark-border rounded-xl p-4 animate-pulse"
      >
        <div className="w-full h-48 bg-dark-elevated rounded-lg mb-4" />
        <div className="space-y-3">
          <div className="h-5 bg-dark-elevated rounded w-2/3" />
          <div className="h-6 bg-dark-elevated rounded w-16" />
          <div className="h-4 bg-dark-elevated rounded w-full" />
        </div>
      </div>
    ))}
  </div>
);

const MyFavourites = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');

    favouriteService
      .getAll({ page: 1 })
      .then((res) => {
        if (!cancelled) {
          setProducts(res.products);
          setPagination(res.pagination);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load favourites');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!pagination || !pagination.hasMore || isLoadingMore) return;
    setIsLoadingMore(true);

    favouriteService
      .getAll({ page: pagination.currentPage + 1 })
      .then((res) => {
        setProducts((prev) => [...prev, ...res.products]);
        setPagination(res.pagination);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load more favourites');
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [pagination, isLoadingMore]);

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

  const productCount = pagination?.totalProducts ?? 0;

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">My Favourites</h1>
          <p className="text-text-secondary">
            {productCount} saved {productCount === 1 ? 'product' : 'products'}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <ProductGridSkeleton />
        ) : products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <Card>
            <div className="text-center py-12">
              <svg
                className="w-20 h-20 text-text-muted mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-text-secondary mb-2">No favourites yet</h3>
              <p className="text-text-muted mb-6">
                Browse products and tap the heart icon to save them here.
              </p>
              <Link to="/products">
                <Button variant="primary" size="md">
                  Browse Products
                </Button>
              </Link>
            </div>
          </Card>
        )}

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
  );
};

export default MyFavourites;
