 Plan: Improve E2E Tests with Phased Execution

 Context

 All 13 e2e test files currently run fully in parallel with no ordering guarantee. There is no coverage of empty-state UI views.
  Tests that assert "Showing X of Y products" can be flaky if they run before products are created. We need to reorganize tests
 into sequential phases so empty-state tests execute first against a clean database, then product creation populates data, then
 remaining tests run.

 Additionally: allProducts.spec.ts is obsolete (All Products page is gone, listing is on homepage now) and 4 "All Products link
 is removed" tests in navigation.spec.ts are no longer needed.


 Delegation Table

 ┌─────┬──────────────────────────────────────────────────────────────────────────────────────────────────┬─────────┬──────────┐
 │  #  │                                           Sub-problem                                            │ Expert  │ Depends  │
 │     │                                                                                                  │         │    On    │
 ├─────┼──────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┼──────────┤
 │ 1   │ Create global-setup.ts, restructure playwright.config.ts into 3 phased projects, move existing   │ QA      │ --       │
 │     │ files into phase dirs, delete allProducts.spec.ts, clean up navigation.spec.ts                   │ Expert  │          │
 ├─────┼──────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┼──────────┤
 │ 2   │ Create empty-states.spec.ts with all empty DB view tests                                         │ QA      │ #1       │
 │     │                                                                                                  │ Expert  │          │
 ├─────┼──────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┼──────────┤
 │ 3   │ Run e2e tests and fix any failures                                                               │ QA      │ #2       │
 │     │                                                                                                  │ Expert  │          │
 └─────┴──────────────────────────────────────────────────────────────────────────────────────────────────┴─────────┴──────────┘

 All sub-problems use QA Expert, so they run sequentially.

 ---
 Step 1: Config + File Restructure

 1a. New file: frontend/tests/e2e/global-setup.ts

 - Mirror global-teardown.ts logic — connect to test MongoDB, drop all collections
 - Ensures a clean DB before Phase 1

 1b. Modify: frontend/playwright.config.ts

 - Add globalSetup: './tests/e2e/global-setup.ts'
 - Replace single chromium project with 3 phased projects using dependencies:
   - phase1-empty-state → testDir: ./tests/e2e/phase1-empty-state
   - phase2-setup → testDir: ./tests/e2e/phase2-setup, depends on phase1
   - phase3-with-data → testDir: ./tests/e2e/phase3-with-data, depends on phase2

 1c. Delete: frontend/tests/e2e/allProducts.spec.ts

 - All Products page no longer exists; its test cases are already covered by homepage tests

 1d. Modify: frontend/tests/e2e/navigation.spec.ts

 Remove these 4 tests before moving:
 - "All Products" link is removed from desktop navigation (unauthenticated) (lines 7-29)
 - "All Products" link is removed from desktop navigation (authenticated) (lines 31-78)
 - "All Products" link is removed from mobile menu (unauthenticated) (lines 97-119)
 - "All Products" link is removed from mobile menu (authenticated) (lines 121-170)

 1e. Move files into phase directories

 frontend/tests/e2e/
   global-setup.ts                      (NEW)
   global-teardown.ts                   (existing, unchanged)
   phase1-empty-state/
     empty-states.spec.ts               (NEW - Step 2)
   phase2-setup/
     auth.spec.ts                       (moved)
     createProduct.spec.ts              (moved)
     unverifiedUser.spec.ts             (moved)
   phase3-with-data/
     home.spec.ts                       (moved)
     homepage-unauthenticated.spec.ts   (moved)
     homepage-authenticated.spec.ts     (moved)
     productDetail.spec.ts              (moved)
     deleteProduct.spec.ts              (moved)
     editProduct.spec.ts                (moved)
     navigation.spec.ts                 (moved, cleaned up)
     favourites.spec.ts                 (moved)
     userProfile.spec.ts                (moved)


 Phase rationale:
 - Phase 1: Empty state tests only — DB guaranteed clean by global-setup
 - Phase 2: Auth, create product, unverified user — create users/products as side effects
 - Phase 3: Tests that benefit from data (homepage listings, product detail, edit, delete, favourites, nav, profiles)

 ---
 Step 2: Create Empty State Tests

 New file: frontend/tests/e2e/phase1-empty-state/empty-states.spec.ts

 Test cases:

 #: 1
 Describe block: Home (unauthenticated, no products)
 Test: Shows empty product count
 Asserts: "Showing 0 of 0 products" or "No products found" (Home.tsx:331-332)
 ────────────────────────────────────────
 #: 2
 Describe block: Home (unauthenticated, no products)
 Test: Shows "No Products Found" in grid
 Asserts: "No Products Found" + "There are no products to display at the moment." (ProductGrid.tsx:26,29)
 ────────────────────────────────────────
 #: 3
 Describe block: Home (authenticated, no products)
 Test: Shows empty products for logged-in user
 Asserts: Same assertions as #1 and #2
 ────────────────────────────────────────
 #: 4
 Describe block: My Favourites (no favourites)
 Test: Shows empty favourites with heart icon
 Asserts: "No favourites yet" + "Browse products and tap the heart icon to save them here." (MyFavourites.tsx:146-148)
 ────────────────────────────────────────
 #: 5
 Describe block: My Favourites (no favourites)
 Test: Browse Products button navigates to home
 Asserts: Click "Browse Products" → URL becomes /
 ────────────────────────────────────────
 #: 6
 Describe block: My Favourites (no favourites)
 Test: Shows "0 saved products" count
 Asserts: "0 saved products" (MyFavourites.tsx:115)
 ────────────────────────────────────────
 #: 7
 Describe block: My Profile (verified, no products)
 Test: Shows "No Products Yet" for verified user
 Asserts: "No Products Yet" + "You haven't listed any products yet..." (MyProfile.tsx:205,210) + "0 listings"
 ────────────────────────────────────────
 #: 8
 Describe block: My Profile (unverified, no products)
 Test: Shows verify email prompt
 Asserts: "No Products Yet" + "Verify your email to start listing products." (MyProfile.tsx:205,209)

 Patterns used:

 - API-based registration/login (faster than UI flow, consistent with existing tests)
 - Date.now() for unique user identifiers
 - /api/auth/test-set-verified endpoint for unverified user setup

 ---
 Step 3: Run & Fix

 Run npm run test:e2e -w frontend and fix any failures in the new or moved tests.

 ---
 Execution Flow

 1. globalSetup → drops all MongoDB collections (clean slate)
 2. Web servers start (backend:5005, frontend:5173)
 3. Phase 1 → empty-states.spec.ts runs against empty DB
 4. Phase 2 → auth.spec.ts, createProduct.spec.ts, unverifiedUser.spec.ts run (populate DB)
 5. Phase 3 → all remaining tests run with data present
 6. globalTeardown → drops all collections (cleanup)

 ---
 Critical Files

 ┌────────────────────────────────────────────────────────────┬────────────────────────────────────────────────┐
 │                            File                            │                     Action                     │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ frontend/playwright.config.ts                              │ Modify — add globalSetup, 3 phased projects    │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ frontend/tests/e2e/global-setup.ts                         │ Create — drop collections before tests         │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ frontend/tests/e2e/global-teardown.ts                      │ Reference only — pattern to follow             │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ frontend/tests/e2e/phase1-empty-state/empty-states.spec.ts │ Create — all empty state test cases            │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ frontend/tests/e2e/allProducts.spec.ts                     │ Delete — page no longer exists                 │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ frontend/tests/e2e/navigation.spec.ts                      │ Modify — remove 4 "All Products removed" tests │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ frontend/src/components/products/ProductGrid.tsx           │ Reference — "No Products Found" (line 26)      │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ frontend/src/pages/MyFavourites.tsx                        │ Reference — "No favourites yet" (line 146)     │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ frontend/src/pages/MyProfile.tsx                           │ Reference — "No Products Yet" (line 205)       │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ frontend/src/pages/Home.tsx                                │ Reference — "Showing X of Y" (line 331)        │
 ├────────────────────────────────────────────────────────────┼────────────────────────────────────────────────┤
 │ All 12 remaining .spec.ts files                            │ Move into phase2/phase3 subdirectories         │
 └────────────────────────────────────────────────────────────┴────────────────────────────────────────────────┘

 Verification

 npm run test:e2e -w frontend


 Expected: Phase 1 passes (empty states), Phase 2 passes (auth/creation), Phase 3 passes (all data-dependent tests). No
 allProducts.spec.ts runs. Navigation tests no longer check for removed "All Products" link.