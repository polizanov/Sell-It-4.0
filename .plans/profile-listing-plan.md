 Plan: Profile Product Listing with Real API Data, Infinite Scroll, and Seller Profile Link                                                                                                                                                                                                                                                                                

 Context

 The MyProfile page currently uses hardcoded mock data (mockProducts.filter(p => p.sellerId === '1')). The user wants:
 1. Real API-backed product listings on the profile page, using username to find products
 2. Infinite scroll with 12 products per page (same pattern as AllProducts)
 3. A public user profile page at /profile/:username
 4. "Contact Seller" button in ProductDetail to link to /profile/:sellerUsername
 5. Full test coverage: unit, integration, e2e, and performance tests

 ---
 Delegation

 ┌─────┬──────────────────────────────────────────────────────────────────────────────────────────┬─────────────────┬───────────────┐
 │  #  │                                       Sub-problem                                        │     Expert      │  Depends on   │
 ├─────┼──────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────┤
 │ 1   │ Backend: new endpoint, seller populate update, index                                     │ Backend Expert  │ --            │
 ├─────┼──────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────┤
 │ 2   │ Frontend: types, service, pages (MyProfile rewrite, new UserProfile, ProductDetail link) │ Frontend Expert │ #1 (contract) │
 ├─────┼──────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────┤
 │ 3   │ Tests & MSW mocks (unit, integration, e2e, speed)                                        │ QA Expert       │ #1, #2        │
 └─────┴──────────────────────────────────────────────────────────────────────────────────────────┴─────────────────┴───────────────┘

 Execution: #1 and #2 run simultaneously (agreed API contract below). #3 runs after both.

 ---
 API Contract

 New endpoint: GET /api/products/user/:username?page=1&limit=12

 Response:
 {
   "success": true,
   "message": "User products retrieved successfully",
   "data": {
     "user": { "name": "John Smith", "username": "johnsmith", "memberSince": "2024-01-15T..." },
     "products": [{ "id": "...", "title": "...", ..., "seller": { "_id": "...", "name": "...", "username": "..." } }],
     "pagination": { "currentPage": 1, "totalPages": 2, "totalProducts": 15, "limit": 12, "hasMore": true }
   }
 }

 Returns 404 { success: false, message: "User not found" } for invalid username.

 Updated populate: All existing product endpoints now populate seller with 'name username' (was just 'name').

 ---
 Sub-problem 1: Backend

 Files to modify

 - backend/src/models/Product.ts -- Add index
 - backend/src/controllers/productController.ts -- Add getUserProducts, update populates
 - backend/src/routes/productRoutes.ts -- Add route

 Implementation

 1. Product.ts -- Add compound index after existing indexes:
 productSchema.index({ seller: 1, createdAt: -1 });
 2. productController.ts -- Update all 3 .populate('seller', 'name') calls to .populate('seller', 'name username') (lines 38, 92, 129). Add User import. Add new getUserProducts handler after getProductById:
   - Parse username from req.params, page/limit from req.query (defaults: page=1, limit=12, max 50)
   - User.findOne({ username: username.toLowerCase() }).select('name username createdAt') -- throw AppError('User not found', 404) if null
   - Query Product.find({ seller: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('seller', 'name username')
   - Return { user: { name, username, memberSince: user.createdAt }, products: [...], pagination: {...} }
 3. productRoutes.ts -- Import getUserProducts. Add router.get('/user/:username', getUserProducts) before router.get('/:id', ...) (route ordering matters).

 ---
 Sub-problem 2: Frontend

 Files to modify

 - frontend/src/types/index.ts -- Add sellerUsername, UserProfileInfo
 - frontend/src/services/productService.ts -- Update seller type, mapping, add getByUsername
 - frontend/src/pages/MyProfile.tsx -- Replace mock data with real API + infinite scroll
 - frontend/src/pages/UserProfile.tsx -- New file: public user profile page
 - frontend/src/pages/ProductDetail.tsx -- Link "Contact Seller" to seller profile
 - frontend/src/App.tsx -- Add /profile/:username route
 - frontend/src/data/mockProducts.ts -- Delete (only consumer is MyProfile, which will stop using it)

 Implementation

 1. types/index.ts:
   - Add sellerUsername: string to Product interface (after sellerName)
   - Add new interface:
   export interface UserProfileInfo {
   name: string;
   username: string;
   memberSince: string;
 }
 2. productService.ts:
   - Update ProductResponseData.seller to { _id: string; name: string; username: string }
   - Update mapProductResponse to include sellerUsername: data.seller.username
   - Add response types UserProductsResponseData and UserProductsResponse
   - Add new getByUsername method:
   getByUsername: async (username, params = {}) => Promise<{ user: UserProfileInfo; products: Product[]; pagination: PaginationInfo }>
   - Calls GET /products/user/${username}?page=...&limit=..., maps products through mapProductResponse
 3. MyProfile.tsx -- Major rewrite:
   - Remove mockProducts import, add useState, useEffect, useRef, useCallback imports
   - Add state: products, pagination, isLoading, isLoadingMore, error, sentinelRef
   - Fetch via productService.getByUsername(user.username, { page: 1 }) on mount
   - Add loadMore callback + IntersectionObserver (same pattern as AllProducts.tsx lines 98-136)
   - Product count uses pagination?.totalProducts ?? 0
   - Add skeleton loader, sentinel div, and loading-more spinner
   - Keep existing user info card (name, @username, email, Edit Profile, Change Password buttons)
   - Show empty state when !isLoading && products.length === 0 && !error
 4. UserProfile.tsx -- New public profile page:
   - Gets username from useParams
   - Fetches via productService.getByUsername(username)
   - Stores userInfo (UserProfileInfo), products, pagination, notFound state
   - Shows user card: avatar (initials from userInfo.name), name, @username, "Member since ..."
   - No email, Edit Profile, or Change Password (those are MyProfile-only)
   - 404 handling: shows "User Not Found" page
   - Same infinite scroll pattern as MyProfile
   - Empty state: "No Products Found" message
 5. ProductDetail.tsx -- Wrap "Contact Seller" button (line 348-350) in <Link to={/profile/${product.sellerUsername}}>. Also make seller name (line 340-342) a link to the profile.
 6. App.tsx -- Add import UserProfile and route <Route path="/profile/:username" element={<UserProfile />} /> before the /profile route.
 7. Delete frontend/src/data/mockProducts.ts (confirmed only consumer is MyProfile via grep).

 ---
 Sub-problem 3: Tests & MSW Mocks

 Files to modify

 - frontend/src/mocks/handlers.ts -- Add username to seller objects, add user products handler
 - backend/tests/product.test.ts -- Add user products tests, update seller assertions
 - frontend/tests/unit/productService.test.ts -- Add getByUsername tests, update seller mocks
 - frontend/tests/integration/ProductDetail.test.tsx -- Update seller mocks, add Contact Seller link test
 - frontend/tests/integration/UserProfile.test.tsx -- New file: UserProfile integration tests
 - frontend/tests/e2e/userProfile.spec.ts -- New file: E2E tests

 Implementation

 1. handlers.ts:
   - Add username to seller objects in defaultProducts (e.g., { _id: 'seller-1', name: 'John Smith', username: 'johnsmith' })
   - Add GET /api/products/user/:username handler: look up user from mock data + dynamic users, filter products by seller ID, paginate, return user info + products
   - Update create product handler to include username in seller response
 2. product.test.ts (backend):
   - Update existing seller assertions to also check for username property
   - Add describe('GET /api/products/user/:username') block with tests:
       - Returns user info + paginated products (12 of 15, hasMore=true)
     - Returns page 2 with remaining products
     - Returns 404 for non-existent username
     - Returns user info with empty products for user with 0 products
     - Case-insensitive username lookup
     - Populates seller with name and username
     - Public endpoint (no auth required)
     - Sorted by newest first
   - Add performance test: 200 products within 200ms
 3. productService.test.ts:
   - Update all mock seller objects to include username
   - Add assertions for sellerUsername in mapping tests
   - Add describe('getByUsername'): success with mapping, 404, page parameter
 4. ProductDetail.test.tsx:
   - Update mock seller objects to include username: 'johnsmith'
   - Add test: "Contact Seller button links to seller profile" -- assert <a href="/profile/johnsmith">
 5. UserProfile.test.tsx (new):
   - Renders user info and products on success
   - Shows "User Not Found" on 404
   - Shows empty state for user with 0 products
 6. userProfile.spec.ts (e2e, new):
   - "Contact Seller navigates to seller profile" -- register, create product, view detail, click Contact Seller, verify profile page
   - "Shows User Not Found for non-existent username"

 ---
 Verification

 npm run build -w backend && npm run build -w frontend
 npm run lint -w backend && npm run lint -w frontend
 npm run test -w backend
 npm run test -w frontend
 npm run test:e2e -w frontend

 ---
 Critical Files Reference

 ┌───────────────────────────────────────────────────┬──────────────────────────────────────────────────────────┐
 │                       File                        │                           Role                           │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ backend/src/models/Product.ts                     │ Add { seller: 1, createdAt: -1 } index                   │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ backend/src/controllers/productController.ts      │ Add getUserProducts, update populates to 'name username' │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ backend/src/routes/productRoutes.ts               │ Add GET /user/:username route (before /:id)              │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/src/types/index.ts                       │ Add sellerUsername to Product, add UserProfileInfo       │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/src/services/productService.ts           │ Update seller mapping, add getByUsername method          │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/src/pages/MyProfile.tsx                  │ Rewrite: replace mock data with API + infinite scroll    │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/src/pages/UserProfile.tsx                │ New: public profile page with infinite scroll            │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/src/pages/ProductDetail.tsx              │ Link "Contact Seller" to /profile/:sellerUsername        │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/src/App.tsx                              │ Add /profile/:username route                             │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/src/mocks/handlers.ts                    │ Add username to sellers, add user products handler       │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ backend/tests/product.test.ts                     │ User products tests + performance test                   │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/tests/unit/productService.test.ts        │ getByUsername tests, update seller mocks                 │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/tests/integration/ProductDetail.test.tsx │ Contact Seller link test                                 │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/tests/integration/UserProfile.test.tsx   │ New: UserProfile integration tests                       │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/tests/e2e/userProfile.spec.ts            │ New: E2E tests for seller profile flow                   │
 ├───────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ frontend/src/data/mockProducts.ts                 │ Delete (no longer needed)                                │