 Plan: Add to Favourites — Model, API, Product Detail Heart Button, My Favourites Page

 Context

 Users need a way to save products they're interested in. The feature adds a "favourite" (heart) button on the product detail page — visible only to authenticated non-owners — and a "My Favourites" page with infinite scroll listing all favourited products. A separate Favourite Mongoose model (not an array on User) is used because the My Favourites page needs
 proper paginated queries with skip/limit/countDocuments.

 ---
 Delegation

 ┌─────┬────────────────────────────────────────────────────────────────────────────────┬─────────────────┬───────────────┐
 │  #  │                                  Sub-problem                                   │     Expert      │  Depends on   │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────┤
 │ 1   │ Favourite model, controller (add/remove/list/ids), routes, route registration  │ Backend Expert  │ —             │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────┤
 │ 2   │ Favourite service, Zustand store, ProductDetail heart button, MyFavourites     │ Frontend Expert │ #1 (contract) │
 │     │ page, routing, navbar links, auth store integration                            │                 │               │
 ├─────┼────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────┤
 │ 3   │ MSW handlers, backend tests, frontend unit/integration/security/e2e tests      │ QA Expert       │ #1, #2        │
 └─────┴────────────────────────────────────────────────────────────────────────────────┴─────────────────┴───────────────┘

 Execution: #1 and #2 run simultaneously (agreed API contract below). #3 runs after both complete.

 ---
 API Contract (source of truth for Backend + Frontend)

 All endpoints require authentication (protect middleware). All use standard { success, message, data? } envelope.

 POST /api/favourites/:productId — Add to favourites
 - 201: { success: true, message: "Product added to favourites", data: { id, productId, createdAt } }
 - 403: user is the product's seller ("You cannot favourite your own product")
 - 409: already favourited ("Product is already in your favourites")
 - 404: product not found
 - 400: invalid product ID format
 - 401: not authenticated

 DELETE /api/favourites/:productId — Remove from favourites
 - 200: { success: true, message: "Product removed from favourites" }
 - 404: favourite not found
 - 400: invalid product ID format
 - 401: not authenticated

 GET /api/favourites?page=1&limit=12 — Paginated favourited products
 - 200: { success: true, message: "...", data: { products: [...], pagination: { currentPage, totalPages, totalProducts, limit, hasMore } } }
 - Products populated with seller { _id, name, username } (same shape as existing product list endpoints)
 - Sorted by most recently favourited (Favourite.createdAt desc)
 - 401: not authenticated

 GET /api/favourites/ids — All favourite product IDs (lightweight)
 - 200: { success: true, message: "...", data: ["productId1", "productId2", ...] }
 - Used by frontend store for instant O(1) isFavourite checks
 - 401: not authenticated

 ---
 Sub-problem 1: Backend — Favourite Model, Controller, Routes

 Files to create

 - backend/src/models/Favourite.ts — Mongoose model
 - backend/src/controllers/favouriteController.ts — Four controller functions
 - backend/src/routes/favouriteRoutes.ts — Routes with protect middleware

 Files to modify

 - backend/src/routes/index.ts — Register favouriteRoutes at /favourites

 Implementation

 1. Favourite.ts — New model:
   - Interface IFavourite extends Document with user: ObjectId, product: ObjectId, createdAt, updatedAt
   - Schema with user (ref User, required) and product (ref Product, required), timestamps: true
   - Indexes: { user: 1, product: 1 } (unique compound — prevents duplicates at DB level), { user: 1, createdAt: -1 } (paginated listing query)
 2. favouriteController.ts — Four asyncHandler-wrapped controllers:
   - addFavourite: validate productId with mongoose.isValidObjectId(), find product (404 if missing), check product.seller.toString() !== req.user!.userId (403 if owner), check existing favourite (409 if duplicate), Favourite.create(), return 201
   - removeFavourite: validate ID, Favourite.findOneAndDelete({ user, product }), 404 if not found
   - getFavourites: same pagination pattern as getAllProducts (page clamped 1+, limit clamped 1-50, Promise.all([Favourite.find().sort().skip().limit().populate(), countDocuments()])), populate product with nested seller populate { path: 'product', populate: { path: 'seller', select: 'name username' } }, filter out null products (deleted), map to product
 response shape
   - getFavouriteIds: Favourite.find({ user }).select('product').lean(), map to string array
 3. favouriteRoutes.ts — All routes protected:
   - GET / → getFavourites
   - GET /ids → getFavouriteIds (must be before /:productId to avoid matching "ids" as param)
   - POST /:productId → addFavourite
   - DELETE /:productId → removeFavourite
 4. routes/index.ts — Add: import favouriteRoutes from './favouriteRoutes', router.use('/favourites', favouriteRoutes)

 ---
 Sub-problem 2: Frontend — Service, Store, Heart Button, Favourites Page, Routing, Nav

 Files to create

 - frontend/src/services/favouriteService.ts — API client
 - frontend/src/store/favouritesStore.ts — Zustand store with favourite IDs Set
 - frontend/src/pages/MyFavourites.tsx — Favourites page with infinite scroll

 Files to modify

 - frontend/src/pages/ProductDetail.tsx — Add heart/favourite button next to title
 - frontend/src/store/authStore.ts — Load favourite IDs on login/init, clear on logout
 - frontend/src/App.tsx — Add /favourites protected route
 - frontend/src/components/layout/Navbar.tsx — Add "My Favourites" link (authenticated)
 - frontend/src/components/layout/MobileMenu.tsx — Add "My Favourites" link (authenticated)

 Implementation

 1. favouriteService.ts — Follow productService.ts pattern:
   - getAll(params): GET /favourites?page=...&limit=..., map products through mapProductResponse
   - getIds(): GET /favourites/ids, return string[]
   - add(productId): POST /favourites/${productId}
   - remove(productId): DELETE /favourites/${productId}
   - Include local mapProductResponse (same mapper as in productService — duplicated to keep services self-contained per existing pattern)
 2. favouritesStore.ts — Zustand store:
   - State: favouriteIds: Set<string>, isLoaded: boolean
   - Actions: isFavourite(id) → favouriteIds.has(id), loadFavouriteIds() → calls favouriteService.getIds() and populates Set, toggleFavourite(id) → optimistic update (add/remove from Set immediately, revert on API error), clearFavourites() → reset
   - Optimistic toggle: update Set first, then call add/remove API, catch errors and revert
 3. ProductDetail.tsx — Add heart button:
   - Import useAuthStore and useFavouritesStore
   - Compute isOwner = isAuthenticated && user?.id === product.sellerId, showFavouriteButton = isAuthenticated && !isOwner
   - Add isTogglingFavourite state to prevent rapid double-clicks
   - Wrap title <h1> (line 266) in a flex row with the heart button:
   <div className="flex items-start justify-between gap-4">
   <h1>...</h1>
   {showFavouriteButton && <button aria-label="..."><HeartSVG /></button>}
 </div>
   - Heart SVG: fill={isFavourited ? 'currentColor' : 'none'} — solid red when favourited, outline when not
   - Colors: text-red-500 hover:text-red-400 when favourited, text-text-muted hover:text-red-500 when not
   - Button disabled during toggle (opacity-50 cursor-not-allowed)
 4. MyFavourites.tsx — Same infinite scroll pattern as MyProfile.tsx:
   - States: products, pagination, isLoading, isLoadingMore, error, sentinelRef
   - Initial fetch: favouriteService.getAll({ page: 1 }) in useEffect
   - loadMore callback + IntersectionObserver with rootMargin: '200px'
   - Empty state: heart icon + "No favourites yet" + "Browse products and tap the heart icon to save them here."
   - Error state: red banner (same pattern as MyProfile)
   - Skeleton loader: 8 animated placeholders (same ProductGridSkeleton pattern)
   - Loading more spinner at bottom (same SVG spinner pattern)
 5. authStore.ts — Integrate favourite loading:
   - Import useFavouritesStore
   - In login action: after setting state, call useFavouritesStore.getState().loadFavouriteIds()
   - In initializeAuth: after successful auth, call useFavouritesStore.getState().loadFavouriteIds()
   - In logout action: call useFavouritesStore.getState().clearFavourites()
 6. App.tsx — Add protected route (line 48, after create-product route):
 <Route path="/favourites" element={<ProtectedRoute><MyFavourites /></ProtectedRoute>} />
 7. Navbar.tsx — Add link in authenticated block (line 41, after My Profile):
 <Link to="/favourites" className={linkStyles('/favourites')}>My Favourites</Link>
 8. MobileMenu.tsx — Add link in authenticated block (line 101, after My Profile):
 <Link to="/favourites" className={linkStyles('/favourites')} onClick={closeMenu}>My Favourites</Link>

 ---
 Sub-problem 3: Tests & MSW Mocks

 Files to create

 - backend/tests/favourite.test.ts — Backend tests (unit + security)
 - frontend/tests/unit/favouriteService.test.ts — Service unit tests
 - frontend/tests/unit/favouritesStore.test.ts — Store unit tests
 - frontend/tests/integration/MyFavourites.test.tsx — MyFavourites page integration tests
 - frontend/tests/e2e/favourites.spec.ts — E2E Playwright tests

 Files to modify

 - frontend/src/mocks/handlers.ts — Add MSW handlers for all 4 favourite endpoints
 - frontend/tests/integration/ProductDetail.test.tsx — Add favourite button integration tests

 Implementation

 1. handlers.ts — Add in-memory favourites array + 4 handlers:
   - GET /favourites/ids (before /:productId): validate auth, return filtered product IDs
   - GET /favourites: validate auth, lookup products by favourite IDs, paginate with array slicing
   - POST /favourites/:productId: validate auth, check product exists, check not owner (compare seller._id to user id), check not duplicate, push to array, return 201
   - DELETE /favourites/:productId: validate auth, find & remove from array, 404 if not found
 2. favourite.test.ts (backend) — Two-user setup (userA owns products, userB favourites):

 2. POST /api/favourites/:productId:
   - 201 for non-owner adding favourite
   - 403 when owner tries to favourite own product
   - 409 when already favourited
   - 404 for non-existent product
   - 400 for invalid product ID format
   - 401 without auth token / with invalid token

 DELETE /api/favourites/:productId:
   - 200 removes favourite
   - 404 when favourite doesn't exist
   - 400 for invalid ID
   - 401 without auth

 GET /api/favourites:
   - Returns page 1 (12 of 15) with hasMore=true
   - Returns page 2 (3 remaining) with hasMore=false
   - Empty array for user with no favourites
   - Only returns authenticated user's favourites (user isolation)
   - Populates product with seller name/username
   - 401 without auth

 GET /api/favourites/ids:
   - Returns array of product ID strings
   - Empty array for user with no favourites
   - 401 without auth

 Security tests:
   - User A cannot see/remove User B's favourites (isolation)
   - NoSQL injection in productId rejected (invalid ObjectId → 400)
   - Owner cannot bypass 403 check
 3. favouriteService.test.ts — MSW override per test:
   - getAll: returns mapped products with pagination
   - getIds: returns string array
   - add: 201 success, 403 for own product, 409 for duplicate, 401 unauth
   - remove: 200 success, 404 not found, 401 unauth
 4. favouritesStore.test.ts — Direct Zustand state testing:
   - isFavourite returns false when empty, true after load
   - loadFavouriteIds populates Set from API
   - toggleFavourite adds when not present (optimistic), removes when present (optimistic)
   - toggleFavourite reverts on API error
   - clearFavourites empties Set, sets isLoaded=false
 5. ProductDetail.test.tsx — Add tests:
   - Shows heart button for authenticated non-owner
   - Does NOT show heart button for unauthenticated user
   - Does NOT show heart button for product owner
   - Shows filled heart when product is favourited (set useFavouritesStore state)
   - Shows outline heart when not favourited
   - Toggles heart fill on click
 6. MyFavourites.test.tsx — Integration tests:
   - Renders favourited products after fetch
   - Shows empty state when no favourites
   - Shows error on API failure
 7. favourites.spec.ts (e2e) — Full user journeys:
   - User can favourite a product and see it on My Favourites page
   - User can unfavourite a product
   - Owner does not see favourite button on own product

 ---
 Verification

 npm run build -w backend && npm run build -w frontend
 npm run lint -w backend && npm run lint -w frontend
 npm run test -w backend
 npm run test -w frontend
 npm run test:e2e -w frontend

 ---
 Critical Files Reference

 ┌──────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
 │                          File                            │                         Role                           │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ backend/src/models/Favourite.ts                          │ CREATE: Mongoose model (user+product, unique compound) │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ backend/src/controllers/favouriteController.ts           │ CREATE: add, remove, getFavourites, getFavouriteIds    │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ backend/src/routes/favouriteRoutes.ts                    │ CREATE: all routes with protect middleware              │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ backend/src/routes/index.ts                              │ MODIFY: register /favourites routes                    │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/src/services/favouriteService.ts                │ CREATE: API client (getAll, getIds, add, remove)       │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/src/store/favouritesStore.ts                    │ CREATE: Zustand store (Set of IDs, optimistic toggle)  │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/src/pages/MyFavourites.tsx                      │ CREATE: favourites page with infinite scroll            │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/src/pages/ProductDetail.tsx                     │ MODIFY: add heart button next to title (lines 265-268) │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/src/store/authStore.ts                          │ MODIFY: load/clear favourites on login/logout/init     │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/src/App.tsx                                     │ MODIFY: add /favourites protected route                │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/src/components/layout/Navbar.tsx                │ MODIFY: add My Favourites link (line 41)               │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/src/components/layout/MobileMenu.tsx            │ MODIFY: add My Favourites link (line 101)              │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/src/mocks/handlers.ts                           │ MODIFY: add 4 MSW favourite endpoint handlers          │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ backend/tests/favourite.test.ts                          │ CREATE: backend tests (CRUD + security + pagination)   │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/tests/unit/favouriteService.test.ts             │ CREATE: service unit tests                             │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/tests/unit/favouritesStore.test.ts              │ CREATE: store unit tests (optimistic toggle, revert)   │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/tests/integration/ProductDetail.test.tsx        │ MODIFY: add favourite button visibility/toggle tests   │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/tests/integration/MyFavourites.test.tsx         │ CREATE: favourites page integration tests              │
 ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ frontend/tests/e2e/favourites.spec.ts                    │ CREATE: E2E tests (favourite flow, unfavourite, owner) │
 └──────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────┘