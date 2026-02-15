 Homepage Reorganization Plan                                           

 Context

 The current homepage (/) displays a Hero section, Featured Products (4 items), and a Features section (benefits grid). The All Products page (/products) contains the full product listing with infinite scroll, search, and filtering capabilities.

 This plan reorganizes the application to consolidate all products on the homepage with conditional rendering:
 - Non-authenticated users: See Hero → Features (benefits) → Full Product Listing with Filters (infinite scroll)
 - Authenticated users: See Full Product Listing with Filters immediately (no Hero, no Features)

 Important: The Featured Products section (showing only 4 products) will be completely removed. After the Hero and Features sections, users will see the full product listing with search, category filter, and infinite scroll.

 This change improves user experience by reducing navigation steps while providing a welcoming landing page for new visitors.

 Task Decomposition & Delegation

 This is a frontend-only task. The work will be delegated as follows:

 ┌─────┬─────────────────────────────────────────────────────────────────────────────────┬─────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │  #  │                                   Sub-problem                                   │     Expert      │                                                                                 Description                                                                                  │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────┼─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 1   │ Refactor Home.tsx with conditional rendering and infinite scroll                │ Frontend Expert │ Merge AllProducts.tsx logic into Home.tsx, add conditional rendering for Hero/Features based on auth state, implement infinite scroll, search, and filtering on the homepage │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────┼─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 2   │ Update routing and navigation components                                        │ Frontend Expert │ Add redirect from /products to /, remove "All Products" links from Navbar and MobileMenu                                                                                     │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────┼─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 3   │ Test the implementation (end-to-end testing and verify all acceptance criteria) │ QA Expert       │ Verify conditional rendering works correctly for authenticated/non-authenticated users, test infinite scroll, search, filtering, and routing changes                         │
 └─────┴─────────────────────────────────────────────────────────────────────────────────┴─────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 Execution Strategy:
 - Sub-problems 1 and 2 will be executed sequentially by the Frontend Expert (same expert type, cannot run in parallel)
 - Sub-problem 3 (QA Expert) will be executed after Frontend work is complete to verify the implementation

 Implementation Steps

 1. Refactor Home.tsx to Include All Products Logic

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/Home.tsx

 Changes:
 1. Add imports from AllProducts.tsx:
   - useState, useRef, useCallback (add to existing import)
   - Product, PaginationInfo types
 2. Replace FeaturedSkeleton with ProductGridSkeleton from AllProducts.tsx (8 cards instead of 4)
 3. Remove Featured Products state and logic:
   - Remove featuredProducts state
   - Remove isLoadingFeatured state
   - Remove featured products fetch effect (lines 44-56)
 4. Add All Products state management:
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
 5. Add effects from AllProducts.tsx:
   - Debounce effect (lines 51-56)
   - Fetch categories effect (lines 59-63)
   - Fetch products effect (lines 66-95)
   - IntersectionObserver effect (lines 121-136)
 6. Add loadMore callback (lines 98-118)
 7. Update JSX structure (layout flow):
 <div className="min-h-screen">
   {/* 1. Hero Section - NON-AUTHENTICATED ONLY */}
   {!isAuthenticated && (
     <section className="relative bg-gradient-hero...">
       {/* Existing hero content (lines 61-88) */}
       {/* Update "Browse Products" button to scroll to products */}
     </section>
   )}

   {/* 2. Features/Benefits Section - NON-AUTHENTICATED ONLY */}
   {!isAuthenticated && (
     <section className="bg-dark-surface border-t border-dark-border">
       {/* Existing features grid (lines 117-149) */}
     </section>
   )}

   {/* 3. Full Product Listing with Search & Filters - ALWAYS VISIBLE */}
   {/* NOTE: Featured Products section (lines 91-113) is COMPLETELY REMOVED */}
   <section className="bg-dark-bg">
     <PageContainer>
       {/* Add page header for authenticated users only */}
       {isAuthenticated && (
         <div className="mb-8">
           <h1 className="text-3xl font-bold text-text-primary mb-2">All Products</h1>
           <p className="text-text-secondary">Browse all available listings</p>
         </div>
       )}

       {/* Search and Filter Bar (from AllProducts lines 148-192) */}
       {/* Results Count & Clear Filters (from AllProducts lines 195-214) */}
       {/* Error State (from AllProducts lines 217-221) */}
       {/* Products Grid with ALL products (from AllProducts line 224) */}
       {/* Sentinel for infinite scroll (from AllProducts line 227) */}
       {/* Loading spinner for pagination (from AllProducts lines 230-253) */}
     </PageContainer>
   </section>
 </div>
 8. Update "Browse Products" button in Hero to smooth scroll:
 <Button
   variant="primary"
   size="lg"
   onClick={() => {
     const productsSection = document.querySelector('section.bg-dark-bg');
     productsSection?.scrollIntoView({ behavior: 'smooth' });
   }}
   className="min-w-[200px] bg-gradient-cta hover:bg-gradient-cta-hover shadow-lg shadow-orange/30"
 >
   Browse Products
 </Button>
 9. Remove Featured Products section (lines 91-113) entirely

 2. Add Redirect from /products to /

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/App.tsx

 Changes:
 1. Add Navigate import from 'react-router':
 import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
 2. Update the /products route (line 35):
 <Route path="/products" element={<Navigate to="/" replace />} />

 3. Update Navigation Links

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/components/layout/Navbar.tsx

 Changes:
 - Remove the "All Products" navigation link
 - Keep only "Home" link (products are now on homepage)

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/components/layout/MobileMenu.tsx

 Changes:
 - Remove the "All Products" navigation link
 - Keep only "Home" link

 4. Optional: Delete AllProducts.tsx

 File: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/AllProducts.tsx

 Since this page is no longer needed (redirects to homepage), it can be deleted after successful implementation and testing. Keep the import in App.tsx until you're ready to remove it.

 Critical Files

 - /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/Home.tsx - Main refactor: merge AllProducts logic, add conditional rendering
 - /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/pages/AllProducts.tsx - Source for infinite scroll implementation
 - /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/App.tsx - Add redirect
 - /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/components/layout/Navbar.tsx - Remove link
 - /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/components/layout/MobileMenu.tsx - Remove link

 Existing Utilities to Reuse

 - ProductGrid component: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/components/products/ProductGrid.tsx
 - ProductCard component: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/components/products/ProductCard.tsx
 - productService.getAll(): /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/services/productService.ts
 - productService.getCategories(): /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/services/productService.ts
 - useAuthStore: /Users/d.polizanov/Documents/Projects/sellit-4.0/frontend/src/store/authStore.ts

 Verification Steps

 End-to-End Testing

 1. As Non-Authenticated User:
   - Visit homepage (/)
   - ✓ Verify Hero section is visible with "Welcome to Sell-It" heading
   - ✓ Verify Features section is visible with 3 benefit cards
   - ✓ Verify "Browse Products" button smooth scrolls to products section
   - ✓ Verify all products are displayed below Features section
   - ✓ Verify search bar and category filter work
   - ✓ Scroll down and verify infinite scroll loads more products
   - ✓ Navigate to /products and verify redirect to /
 2. As Authenticated User:
   - Login to the application
   - Visit homepage (/)
   - ✓ Verify Hero section is NOT visible
   - ✓ Verify Features section is NOT visible
   - ✓ Verify products section appears immediately at the top
   - ✓ Verify "All Products" page header is visible
   - ✓ Verify search and filter functionality works
   - ✓ Scroll down and verify infinite scroll loads more products
   - ✓ Navigate to /products and verify redirect to /
 3. Navigation:
   - ✓ Verify "All Products" link is removed from desktop navigation
   - ✓ Verify "All Products" link is removed from mobile menu
   - ✓ Verify "Home" link still works and displays products
 4. Functionality:
   - ✓ Test search with debounce (type and wait 300ms)
   - ✓ Test category filtering
   - ✓ Test "Clear Filters" button
   - ✓ Test infinite scroll loads next page
   - ✓ Test loading states (skeleton, spinner)
   - ✓ Test error handling (disconnect network, refresh)
   - ✓ Test on mobile, tablet, and desktop viewports

 Unit Testing (if applicable)

 Run existing frontend tests:
 npm run test -w frontend

 Ensure no regressions in:
 - Authentication state management
 - Product fetching logic
 - Infinite scroll implementation