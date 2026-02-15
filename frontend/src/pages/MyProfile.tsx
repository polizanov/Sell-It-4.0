import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProductGrid } from '../components/products/ProductGrid';
import { productService } from '../services/productService';
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

const MyProfile = () => {
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setIsLoading(true);
    setError('');

    productService
      .getByUsername(user.username, { page: 1 })
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
  }, [user]);

  const loadMore = useCallback(() => {
    if (!user || !pagination || !pagination.hasMore || isLoadingMore) return;
    setIsLoadingMore(true);

    productService
      .getByUsername(user.username, { page: pagination.currentPage + 1 })
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
  }, [user, pagination, isLoadingMore]);

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

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const productCount = pagination?.totalProducts ?? 0;

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Profile Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            My Profile
          </h1>
          <p className="text-text-secondary">
            Manage your account and listings
          </p>
        </div>

        {/* User Information Card */}
        <Card>
          <div className="flex items-start gap-6 flex-col sm:flex-row">
            <div className="w-24 h-24 rounded-full bg-orange flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                {user.name}
              </h2>
              <p className="text-text-secondary mb-1">
                @{user.username}
              </p>
              <p className="text-text-secondary mb-4">
                {user.email}
              </p>
              <div className="flex gap-3">
                <Button variant="primary" size="sm">
                  Edit Profile
                </Button>
                <Button variant="secondary" size="sm">
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Divider */}
        <div className="border-t border-dark-border"></div>

        {/* User Products Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-1">
              My Products
            </h2>
            <p className="text-text-secondary">
              {productCount} {productCount === 1 ? 'listing' : 'listings'}
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
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-text-secondary mb-2">
                  No Products Yet
                </h3>
                <p className="text-text-muted">
                  {user?.isVerified === false
                    ? 'Verify your email to start listing products.'
                    : "You haven't listed any products yet. Use the floating button to create your first listing!"}
                </p>
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
      </div>
    </PageContainer>
  );
};

export default MyProfile;
