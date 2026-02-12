import { Link } from 'react-router';
import { Card } from '../common/Card';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link to={`/products/${product.id}`} className="block group">
      <Card hover className="h-full transition-all duration-300 group-hover:bg-gradient-card-hover">
        {/* Product Image */}
        <div className="w-full h-48 bg-dark-elevated rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
          {product.images && product.images.length > 0 ? (
            <>
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Image count badge */}
              {product.images.length > 1 && (
                <div className="absolute top-2 right-2 bg-dark-bg/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-text-secondary flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {product.images.length}
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <svg
                className="w-16 h-16 text-text-muted mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-text-muted">No image</p>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-text-primary line-clamp-2 group-hover:text-orange transition-colors">
              {product.title}
            </h3>
            <span className="text-orange font-bold text-xl whitespace-nowrap">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-text-muted px-2 py-1 bg-dark-elevated rounded-md inline-block">
              {product.category}
            </span>
            <span className="text-sm text-text-muted px-2 py-1 bg-dark-elevated rounded-md inline-block">
              {product.condition}
            </span>
          </div>

          <p className="text-sm text-text-secondary line-clamp-2 min-h-[2.5rem]">
            {product.description}
          </p>

          <div className="mt-4 pt-4 border-t border-dark-border">
            <span className="text-orange font-medium group-hover:underline">
              View Details →
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
