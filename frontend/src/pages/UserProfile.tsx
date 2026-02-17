import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { AxiosError } from 'axios';
import { PageContainer } from '../components/layout/PageContainer';
import { MouseFollowGradient } from '../components/common/MouseFollowGradient';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProductGrid } from '../components/products/ProductGrid';
import { productService } from '../services/productService';
import type { Product, PaginationInfo, UserProfileInfo, ApiError } from '../types';

const ProfileSkeleton = () => (
  <PageContainer>
    <div className="space-y-8">
      <div className="h-8 w-48 bg-dark-surface rounded animate-pulse" />
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 animate-pulse">
        <div className="flex items-start gap-6 flex-col sm:flex-row">
          <div className="w-24 h-24 rounded-full bg-dark-elevated" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 bg-dark-elevated rounded" />
            <div className="h-5 w-32 bg-dark-elevated rounded" />
            <div className="h-4 w-40 bg-dark-elevated rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-dark-surface border border-dark-border rounded-xl p-4 animate-pulse"
          >
            <div className="w-full h-48 bg-dark-elevated rounded-lg mb-4" />
            <div className="space-y-3">
              <div className="h-5 bg-dark-elevated rounded w-2/3" />
              <div className="h-6 bg-dark-elevated rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </PageContainer>
);

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [userInfo, setUserInfo] = useState<UserProfileInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setNotFound(false);

    productService
      .getByUsername(username, { page: 1 })
      .then((res) => {
        if (!cancelled) {
          setUserInfo(res.user);
          setProducts(res.products);
          setPagination(res.pagination);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const axiosError = err as AxiosError<ApiError>;
        if (axiosError.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(axiosError.response?.data?.message || 'Failed to load profile');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const loadMore = useCallback(() => {
    if (!username || !pagination || !pagination.hasMore || isLoadingMore) return;
    setIsLoadingMore(true);

    productService
      .getByUsername(username, { page: pagination.currentPage + 1 })
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
  }, [username, pagination, isLoadingMore]);

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

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (notFound) {
    return (
      <PageContainer className="py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">User Not Found</h1>
          <p className="text-text-secondary mb-8">
            Sorry, the user you're looking for doesn't exist.
          </p>
          <Link to="/products">
            <Button variant="primary">Browse Products</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  if (error || !userInfo) {
    return (
      <PageContainer className="py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Something Went Wrong</h1>
          <p className="text-text-secondary mb-8">{error || 'An unexpected error occurred'}</p>
          <Link to="/products">
            <Button variant="primary">Browse Products</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const initials = userInfo.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const productCount = pagination?.totalProducts ?? 0;

  return (
    <div className="relative overflow-hidden min-h-screen flex flex-col">
      <MouseFollowGradient
        activationMode="always"
        gradientColor="rgba(255, 87, 34, 0.12)"
        gradientSize={60}
        className="flex-1"
      >
        <PageContainer>
          <div className="space-y-8">
            {/* Profile Header */}
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Seller Profile
              </h1>
            </div>

            {/* User Information Card */}
            <Card>
              <div className="flex items-start gap-6 flex-col sm:flex-row">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-orange flex items-center justify-center flex-shrink-0">
                  {userInfo.profilePhoto ? (
                    <img
                      src={userInfo.profilePhoto}
                      alt={userInfo.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">{initials}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-text-primary mb-1">
                    {userInfo.name}
                  </h2>
                  <p className="text-text-secondary mb-1">
                    @{userInfo.username}
                  </p>
                  <p className="text-text-muted text-sm">
                    Member since{' '}
                    {new Date(userInfo.memberSince).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Card>

            {/* Divider */}
            <div className="border-t border-dark-border"></div>

            {/* User Products Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-1">
                  Products
                </h2>
                <p className="text-text-secondary">
                  {productCount} {productCount === 1 ? 'listing' : 'listings'}
                </p>
              </div>

              {products.length > 0 ? (
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
                      No Products Found
                    </h3>
                    <p className="text-text-muted">
                      This user hasn't listed any products yet.
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
      </MouseFollowGradient>
    </div>
  );
};

export default UserProfile;
