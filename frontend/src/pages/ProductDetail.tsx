import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { AxiosError } from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EditProductModal } from '../components/product/EditProductModal';
import { productService } from '../services/productService';
import { useAuthStore } from '../store/authStore';
import { useFavouritesStore } from '../store/favouritesStore';
import type { Product, ApiError } from '../types';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-dark-bg">
    <PageContainer className="py-8">
      {/* Back link skeleton */}
      <div className="h-5 w-36 bg-dark-surface rounded animate-pulse mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-square w-full bg-dark-surface rounded-lg animate-pulse" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square w-full bg-dark-surface rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <div className="h-9 w-3/4 bg-dark-surface rounded animate-pulse mb-4" />
            <div className="h-10 w-32 bg-dark-surface rounded animate-pulse mb-4" />
            <div className="flex gap-2">
              <div className="h-7 w-24 bg-dark-surface rounded-full animate-pulse" />
              <div className="h-7 w-20 bg-dark-surface rounded-full animate-pulse" />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="h-6 w-32 bg-dark-surface rounded animate-pulse mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-dark-surface rounded animate-pulse" />
              <div className="h-4 w-full bg-dark-surface rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-dark-surface rounded animate-pulse" />
            </div>
          </div>

          {/* Product Details */}
          <div className="border-t border-dark-border pt-6">
            <div className="h-6 w-36 bg-dark-surface rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-dark-surface rounded animate-pulse" />
                  <div className="h-4 w-28 bg-dark-surface rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Seller Information */}
          <div className="border-t border-dark-border pt-6">
            <div className="h-6 w-40 bg-dark-surface rounded animate-pulse mb-4" />
            <div className="bg-dark-surface rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-dark-elevated rounded-full animate-pulse" />
                <div>
                  <div className="h-5 w-32 bg-dark-elevated rounded animate-pulse mb-2" />
                  <div className="h-4 w-28 bg-dark-elevated rounded animate-pulse" />
                </div>
              </div>
              <div className="h-12 w-full bg-dark-elevated rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  </div>
);

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { isFavourite, toggleFavourite } = useFavouritesStore();
  const [isTogglingFavourite, setIsTogglingFavourite] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setError('No product ID provided');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const data = await productService.getById(id);
        if (!cancelled) {
          setProduct(data);
        }
      } catch (err) {
        if (cancelled) return;

        const axiosError = err as AxiosError<ApiError>;
        const status = axiosError.response?.status;
        const message = axiosError.response?.data?.message || 'Failed to load product';

        if (status === 404) {
          setNotFound(true);
        } else {
          setError(message);
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
  }, [id]);

  const refreshProduct = async () => {
    if (!id) return;

    try {
      const data = await productService.getById(id);
      setProduct(data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      const message = axiosError.response?.data?.message || 'Failed to reload product';
      setError(message);
    }
  };

  // Loading state
  if (isLoading) {
    return <ProductDetailSkeleton />;
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

  // Error state
  if (error || !product) {
    return (
      <PageContainer className="py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Something Went Wrong</h1>
          <p className="text-text-secondary mb-8">{error || 'An unexpected error occurred'}</p>
          <Link to="/products">
            <Button variant="primary">Back to Products</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const isVerified = user?.isVerified !== false;
  const isOwner = isAuthenticated && user?.id === product?.sellerId;
  const showFavouriteButton = isAuthenticated && isVerified && !isOwner && product !== null;
  const showOwnerActions = isOwner && isVerified;
  const isFavourited = product ? isFavourite(product.id) : false;

  const handleToggleFavourite = async () => {
    if (!product || isTogglingFavourite) return;
    setIsTogglingFavourite(true);
    try {
      await toggleFavourite(product.id);
    } finally {
      setIsTogglingFavourite(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await productService.delete(product!.id);
      navigate('/products', { replace: true });
    } catch {
      setError('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const conditionColors = {
    New: 'bg-green-500/20 text-green-400',
    'Like New': 'bg-blue-500/20 text-blue-400',
    Good: 'bg-yellow-500/20 text-yellow-400',
    Fair: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <PageContainer className="py-8">
        {/* Back to Products Link */}
        <Link
          to="/products"
          className="inline-flex items-center text-text-secondary hover:text-orange transition-colors mb-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Products
        </Link>

        {/* Product Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Swiper */}
            <Swiper
              modules={[Navigation, Thumbs, Keyboard]}
              navigation
              thumbs={{ swiper: thumbsSwiper }}
              keyboard={{ enabled: true }}
              className="rounded-lg overflow-hidden bg-dark-surface"
              spaceBetween={10}
            >
              {product.images.map((image, index) => (
                <SwiperSlide key={index}>
                  <div className="aspect-square w-full">
                    <img
                      src={image}
                      alt={`${product.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Thumbnails Swiper */}
            <Swiper
              onSwiper={setThumbsSwiper}
              modules={[Thumbs]}
              spaceBetween={10}
              slidesPerView={4}
              watchSlidesProgress
              className="thumbs-swiper"
            >
              {product.images.map((image, index) => (
                <SwiperSlide key={index} className="cursor-pointer">
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-dark-surface">
                    <img
                      src={image}
                      alt={`${product.title} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                  {product.title}
                </h1>
                {showFavouriteButton && (
                  <button
                    onClick={handleToggleFavourite}
                    disabled={isTogglingFavourite}
                    aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
                    className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                      isTogglingFavourite ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      isFavourited
                        ? 'text-red-500 hover:text-red-400'
                        : 'text-text-muted hover:text-red-500'
                    }`}
                  >
                    <svg
                      className="w-7 h-7"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill={isFavourited ? 'currentColor' : 'none'}
                        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                      />
                    </svg>
                  </button>
                )}
                {showOwnerActions && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex-shrink-0 p-2 rounded-lg transition-colors text-text-muted hover:text-orange"
                      aria-label="Edit product"
                    >
                      <svg
                        className="w-7 h-7"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      aria-label="Delete product"
                      className="flex-shrink-0 p-2 rounded-lg transition-colors text-text-muted hover:text-red-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-7 h-7"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {isAuthenticated && !isVerified && (
                <p className="text-amber-300 text-sm mt-2">
                  Verify your email to {isOwner ? 'manage this product' : 'add products to favourites'}.
                </p>
              )}
              <div className="text-4xl font-bold text-orange mb-4">
                ${product.price.toFixed(2)}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-dark-elevated text-text-secondary rounded-full text-sm">
                  {product.category}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    conditionColors[product.condition]
                  }`}
                >
                  {product.condition}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Description</h2>
              <p className="text-text-secondary leading-relaxed">{product.description}</p>
            </div>

            {/* Product Details */}
            <div className="border-t border-dark-border pt-6">
              <h2 className="text-xl font-semibold text-text-primary mb-3">Product Details</h2>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-text-muted">Category:</dt>
                  <dd className="text-text-secondary font-medium">{product.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Condition:</dt>
                  <dd className="text-text-secondary font-medium">{product.condition}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Posted:</dt>
                  <dd className="text-text-secondary font-medium">
                    {new Date(product.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Seller Information */}
            <div className="border-t border-dark-border pt-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Seller Information</h2>
              <div className="bg-dark-surface rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-orange"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <Link
                      to={`/profile/${product.sellerUsername}`}
                      className="text-lg font-semibold text-text-primary hover:text-orange transition-colors"
                    >
                      {product.sellerName}
                    </Link>
                    <p className="text-text-muted text-sm">
                      Member since {new Date(product.createdAt).getFullYear()}
                    </p>
                  </div>
                </div>
                <Link to={`/profile/${product.sellerUsername}`}>
                  <Button variant="primary" fullWidth>
                    Contact Seller
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Product"
        message={`Are you sure you want to delete "${product?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
      />

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        productId={product.id}
        productData={{
          title: product.title,
          description: product.description,
          price: product.price,
          category: product.category,
          condition: product.condition,
          images: product.images,
          sellerId: product.sellerId,
        }}
        onSuccess={refreshProduct}
      />
    </div>
  );
};

export default ProductDetail;
