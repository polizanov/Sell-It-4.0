import { Link } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProductGrid } from '../components/products/ProductGrid';
import { mockProducts } from '../data/mockProducts';

const MyProfile = () => {
  const user = useAuthStore((state) => state.user);

  // Filter products by current user (for demo, using sellerId '1')
  const userProducts = mockProducts.filter((product) => product.sellerId === '1');

  if (!user) {
    return null;
  }

  // Get user initials for avatar
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-orange flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-white">{initials}</span>
            </div>

            {/* User Details */}
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                My Products
              </h2>
              <p className="text-text-secondary">
                {userProducts.length} {userProducts.length === 1 ? 'listing' : 'listings'}
              </p>
            </div>
            <Link to="/create-product">
              <Button variant="primary" size="md">
                Create New Product
              </Button>
            </Link>
          </div>

          {userProducts.length > 0 ? (
            <ProductGrid products={userProducts} />
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
                <p className="text-text-muted mb-6">
                  You haven't listed any products. Start selling today!
                </p>
                <Link to="/create-product">
                  <Button variant="primary" size="md">
                    Create Your First Product
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default MyProfile;
