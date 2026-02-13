Plan: Products Listing & Featured Products — API Integration with Infinite Scroll                                                                                                                                                                                                                                                                                         

 Context

 AllProducts.tsx and Home.tsx render products from mockProducts (hardcoded static data). The backend has no "list products" endpoint. This plan adds a paginated GET /api/products backend endpoint, wires both pages to fetch from the API, implements infinite scroll (12 per page) on the All Products page, and adds comprehensive tests. MyProfile.tsx also uses
 mockProducts but is out of scope for now — mockProducts.ts is kept.

 ---
 Delegation

 ┌─────┬────────────────────────────────────────────────────────────────────────┬─────────────────┬───────────────────┐
 │  #  │                              Sub-problem                               │     Expert      │    Depends on     │
 ├─────┼────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────────┤
 │ 1   │ Add GET /api/products paginated backend endpoint                       │ Backend Expert  │ —                 │
 ├─────┼────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────────┤
 │ 2   │ Wire AllProducts + Home to fetch from API, add infinite scroll         │ Frontend Expert │ #1 (API contract) │
 ├─────┼────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────────┤
 │ 3   │ Write and run all tests (backend, unit, integration, performance, E2E) │ QA Expert       │ #1, #2            │
 └─────┴────────────────────────────────────────────────────────────────────────┴─────────────────┴───────────────────┘

 Execution: #1 and #2 run simultaneously (agreed API contract below). #3 runs after both complete.

 ---
 API Contract (source of truth for Backend + Frontend)

 GET /api/products (public, no auth required)

 Query parameters (all optional):

 ┌──────────┬────────┬─────────┬───────────────────────────────────────────────┐
 │  Param   │  Type  │ Default │                  Description                  │
 ├──────────┼────────┼─────────┼───────────────────────────────────────────────┤
 │ page     │ number │ 1       │ Page number (1-based, min 1)                  │
 ├──────────┼────────┼─────────┼───────────────────────────────────────────────┤
 │ limit    │ number │ 12      │ Items per page (clamped 1–50)                 │
 ├──────────┼────────┼─────────┼───────────────────────────────────────────────┤
 │ category │ string │ —       │ Filter by exact category name                 │
 ├──────────┼────────┼─────────┼───────────────────────────────────────────────┤
 │ search   │ string │ —       │ Case-insensitive regex on title + description │
 ├──────────┼────────┼─────────┼───────────────────────────────────────────────┤
 │ sort     │ string │ newest  │ newest, oldest, price_asc, price_desc         │
 └──────────┴────────┴─────────┴───────────────────────────────────────────────┘

 Response 200:
 {
   "success": true,
   "message": "Products retrieved successfully",
   "data": {
     "products": [
       {
         "id": "ObjectId string",
         "title": "string",
         "description": "string",
         "price": 29.99,
         "images": ["url1", "url2"],
         "category": "string",
         "condition": "New | Like New | Good | Fair",
         "seller": { "_id": "ObjectId string", "name": "string" },
         "createdAt": "ISO date string"
       }
     ],
     "pagination": {
       "currentPage": 1,
       "totalPages": 5,
       "totalProducts": 58,
       "limit": 12,
       "hasMore": true
     }
   }
 }

 ---
 Sub-problem 1: Backend — GET /api/products

 Files to modify

 - backend/src/controllers/productController.ts — Add getAllProducts controller
 - backend/src/routes/productRoutes.ts — Add GET / route
 - backend/src/models/Product.ts — Add indexes for query performance

 Implementation

 1. Indexes in Product.ts — Add after schema definition:
   - productSchema.index({ createdAt: -1 }) — default sort
   - productSchema.index({ category: 1, createdAt: -1 }) — category filter + sort

 2. getAllProducts controller in productController.ts:
   - Parse & sanitize query params: page (min 1, default 1), limit (clamp 1–50, default 12), category, search, sort
   - Build filter object: if category → filter.category = category; if search → filter.$or = [{ title: regex }, { description: regex }] (case-insensitive)
   - Build sort: newest → { createdAt: -1 }, oldest → { createdAt: 1 }, price_asc → { price: 1 }, price_desc → { price: -1 }
   - Run Promise.all([Product.find(filter).sort().skip().limit().populate('seller', 'name'), Product.countDocuments(filter)])
   - Return 200 with { products, pagination: { currentPage, totalPages, totalProducts, limit, hasMore } }
   - Wrap with asyncHandler, use Request type (public, no auth)
 3. Route in productRoutes.ts:
   - Add router.get('/', getAllProducts) — BEFORE GET /categories and GET /:id

 ---
 Sub-problem 2: Frontend — AllProducts + Home API Integration

 Files to modify

 - frontend/src/services/productService.ts — Add getAll method
 - frontend/src/types/index.ts — Add PaginationInfo and ProductListParams types
 - frontend/src/mocks/handlers.ts — Add GET /products MSW handler
 - frontend/src/pages/AllProducts.tsx — Replace mock data with API + infinite scroll
 - frontend/src/pages/Home.tsx — Replace mock data with API call

 Implementation

 1. Types in frontend/src/types/index.ts:
 export interface PaginationInfo {
   currentPage: number;
   totalPages: number;
   totalProducts: number;
   limit: number;
   hasMore: boolean;
 }

 export interface ProductListParams {
   page?: number;
   limit?: number;
   category?: string;
   search?: string;
   sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
 }
 2. productService.ts — Add getAll method:
   - Build URLSearchParams from ProductListParams
   - Call api.get<ProductListResponse>('/products?...')
   - Map each product through existing mapProductResponse (seller flattening)
   - Return { products: Product[], pagination: PaginationInfo }
 3. MSW handler in handlers.ts:
   - Add http.get(API_BASE + '/products', ...) — BEFORE the /:id handler
   - Include ~15 default mock products for testing pagination (12 page 1, 3 page 2)
   - Support page, limit, category, search query params
   - Return paginated response matching the API contract
 4. AllProducts.tsx — Rewrite with infinite scroll:
   - Remove mockProducts import
   - State: products, pagination, isLoading, isLoadingMore, error, searchQuery, debouncedSearch, selectedCategory, categories
   - Fetch categories from productService.getCategories() on mount
   - Fetch products from productService.getAll() — resets to page 1 when filters change
   - Debounce search input (300ms) to avoid excessive API calls
   - Infinite scroll: IntersectionObserver on a sentinel <div ref={sentinelRef}> at bottom of grid. rootMargin: '200px' for preloading. When sentinel visible and pagination.hasMore, call loadMore() which fetches next page and appends to products array.
   - Loading state: ProductGridSkeleton with 8 animate-pulse card placeholders
   - Loading more: Spinner at bottom while appending next page
   - Error state: Error message in red
   - Results count: "Showing X of Y products" using pagination metadata
   - Keep existing search input, category dropdown, and "Clear Filters" button
 5. Home.tsx — Replace featured products:
   - Remove mockProducts import
   - Add state: featuredProducts, isLoadingFeatured
   - useEffect calls productService.getAll({ page: 1, limit: 4, sort: 'newest' })
   - Show 4-card skeleton while loading, then ProductGrid with fetched products
   - Silently handle errors (featured section is non-critical)
 6. Do NOT delete frontend/src/data/mockProducts.ts — still used by MyProfile.tsx (out of scope)

 ---
 Sub-problem 3: Tests

 Backend tests — Add to backend/tests/product.test.ts

 describe('GET /api/products') — Create ~15 test products in beforeAll, then test:
 - Default pagination: returns 12 products, page 1, totalProducts=15, hasMore=true
 - Page 2: returns remaining 3 products, hasMore=false
 - Custom limit: ?limit=5 returns 5 products, totalPages=3
 - Category filter: all returned products match the category
 - Search filter: case-insensitive match on title
 - Combined search + category filters
 - Sort newest (default): createdAt descending
 - Sort price_asc: prices ascending
 - Empty results: non-matching category returns empty array with totalProducts=0
 - Limit clamping: ?limit=100 → pagination.limit=50
 - Invalid page defaults to 1: ?page=-1 → currentPage=1
 - Public endpoint: no auth required
 - Products include populated seller name

 Performance tests — Insert 200 products in beforeAll, then:
 - Paginated response within 200ms for 200 products
 - Filtered + searched response within 200ms
 - Last page returns correct remainder count

 Frontend unit tests — Add to frontend/tests/unit/productService.test.ts

 describe('getAll'):
 - Returns mapped products with flat sellerId/sellerName + pagination metadata
 - Sends query parameters correctly (verify captured URL)
 - Returns empty products array when no results

 Frontend integration tests — Create frontend/tests/integration/AllProducts.test.tsx

 - Renders products after API fetch
 - Shows skeleton loader while loading
 - Shows "No Products Found" for empty results
 - Shows "Showing X of Y products" count
 - Filters by category via API (verify query param sent)
 - Shows error state when API fails

 Frontend integration tests — Create frontend/tests/integration/Home.test.tsx

 - Fetches and displays featured products (verifies limit=4 param)
 - Shows skeleton while loading
 - Gracefully handles API error

 Frontend E2E tests — Create frontend/tests/e2e/allProducts.spec.ts

 - All Products page loads and displays products from API
 - Category filter works
 - Search works (with debounce)
 - Clear Filters works
 - Home page displays featured products from API

 Test execution

 npm run build -w backend && npm run build -w frontend
 npm run lint -w backend && npm run lint -w frontend
 npm run test -w backend
 npm run test -w frontend
 npm run test:e2e -w frontend

 ---
 Critical Files Reference

 ┌──────────────────────────────────────────────┬───────────────────────────────────────┐
 │                     File                     │                 Role                  │
 ├──────────────────────────────────────────────┼───────────────────────────────────────┤
 │ backend/src/models/Product.ts                │ Add indexes                           │
 ├──────────────────────────────────────────────┼───────────────────────────────────────┤
 │ backend/src/controllers/productController.ts │ Add getAllProducts                    │
 ├──────────────────────────────────────────────┼───────────────────────────────────────┤
 │ backend/src/routes/productRoutes.ts          │ Add GET / route                       │
 ├──────────────────────────────────────────────┼───────────────────────────────────────┤
 │ frontend/src/types/index.ts                  │ Add PaginationInfo, ProductListParams │
 ├──────────────────────────────────────────────┼───────────────────────────────────────┤
 │ frontend/src/services/productService.ts      │ Add getAll, reuse mapProductResponse  │
 ├──────────────────────────────────────────────┼───────────────────────────────────────┤
 │ frontend/src/mocks/handlers.ts               │ Add GET /products MSW handler         │
 ├──────────────────────────────────────────────┼───────────────────────────────────────┤
 │ frontend/src/pages/AllProducts.tsx           │ Rewrite with API + infinite scroll    │
 ├──────────────────────────────────────────────┼───────────────────────────────────────┤
 │ frontend/src/pages/Home.tsx                  │ Replace mock data with API            │
 ├──────────────────────────────────────────────┼───────────────────────────────────────┤
 │ frontend/tests/setup.ts                      │ May need IntersectionObserver mock    │
 ├──────────────────────────────────────────────┼───────────────────────────────────────┤
 │ backend/tests/product.test.ts                │ Add list + performance tests          │
 └──────────────────────────────────────────────┴───────────────────────────────────────┘