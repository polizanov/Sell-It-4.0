import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { mockProducts } from '../data/mockProducts';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  // Find the product
  const product = mockProducts.find((p) => p.id === id);

  // Handle product not found
  if (!product) {
    return (
      <PageContainer className="py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Product Not Found
          </h1>
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
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                {product.title}
              </h1>
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
              <h2 className="text-xl font-semibold text-text-primary mb-3">
                Description
              </h2>
              <p className="text-text-secondary leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="border-t border-dark-border pt-6">
              <h2 className="text-xl font-semibold text-text-primary mb-3">
                Product Details
              </h2>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-text-muted">Category:</dt>
                  <dd className="text-text-secondary font-medium">
                    {product.category}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Condition:</dt>
                  <dd className="text-text-secondary font-medium">
                    {product.condition}
                  </dd>
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
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Seller Information
              </h2>
              <div className="bg-dark-surface rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-4">
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
                    <h3 className="text-lg font-semibold text-text-primary">
                      {product.sellerName}
                    </h3>
                    <p className="text-text-muted text-sm">
                      Member since{' '}
                      {new Date(product.createdAt).getFullYear()}
                    </p>
                  </div>
                </div>
                <Button variant="primary" fullWidth>
                  Contact Seller
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default ProductDetail;
