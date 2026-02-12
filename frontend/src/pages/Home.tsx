import { Link } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { ProductGrid } from '../components/products/ProductGrid';
import { mockProducts } from '../data/mockProducts';

const Home = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Show featured products (first 4)
  const featuredProducts = mockProducts.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
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
              <Link to="/products">
                <Button variant="primary" size="lg" className="min-w-[200px] bg-gradient-cta hover:bg-gradient-cta-hover shadow-lg shadow-orange/30">
                  Browse Products
                </Button>
              </Link>
              <Link to={isAuthenticated ? '/create-product' : '/login'}>
                <Button variant="secondary" size="lg" className="min-w-[200px]">
                  Start Selling
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Featured Products Section */}
      <section className="bg-dark-bg">
        <PageContainer>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              Featured Products
            </h2>
            <p className="text-text-secondary">
              Check out some of our latest listings
            </p>
          </div>

          <ProductGrid products={featuredProducts} />

          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="primary" size="md">
                View All Products
              </Button>
            </Link>
          </div>
        </PageContainer>
      </section>

      {/* Features Section */}
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
    </div>
  );
};

export default Home;
