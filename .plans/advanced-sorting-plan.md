Plan: Advanced Sorting & Condition Filtering with Sidebar             

 Context

 The Home page currently supports search and category filtering, but has no sorting UI (backend supports 4 sort options that are unused) and no condition filtering.
 Users need a sort <select> with 6 options and condition checkboxes, presented in a left sidebar on desktop and a slide-out drawer on mobile.

 ---
 Delegation Table

 ┌─────┬─────────────────────────────────────────────────────────────────────────────────────────┬──────────┬────────────┐
 │  #  │                                       Sub-problem                                       │  Expert  │ Depends On │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼──────────┼────────────┤
 │ 1   │ Backend: add title sort options + condition query filter                                │ Backend  │ —          │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼──────────┼────────────┤
 │ 2   │ Frontend: constants, types, service, FilterSidebar, MobileFilterDrawer, Home.tsx layout │ Frontend │ #1         │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼──────────┼────────────┤
 │ 3   │ Update tests (backend, MSW, integration, e2e)                                           │ QA       │ #1, #2     │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼──────────┼────────────┤
 │ 4   │ Run all tests and fix failures                                                          │ QA       │ #3         │
 └─────┴─────────────────────────────────────────────────────────────────────────────────────────┴──────────┴────────────┘

 ---
 Step 1: Backend Changes

 1a. Modify backend/src/controllers/productController.ts

 Add title sort options (lines 13-18) — add title_asc and title_desc:
 const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
   newest: { createdAt: -1 },
   oldest: { createdAt: 1 },
   title_asc: { title: 1 },
   title_desc: { title: -1 },
   price_asc: { price: 1 },
   price_desc: { price: -1 },
 };

 Add condition filter — inside getAllProducts (after existing search filter ~line 87), parse condition query param:
 const condition = req.query.condition as string | undefined;
 if (condition) {
   const conditions = condition.split(',').map((c) => c.trim());
   const validConditions = ['New', 'Like New', 'Good', 'Fair'];
   const filtered = conditions.filter((c) => validConditions.includes(c));
   if (filtered.length > 0) {
     filter.condition = { $in: filtered };
   }
 }

 1b. Modify backend/src/models/Product.ts

 Add indexes after existing ones (~line 80):
 productSchema.index({ title: 1 });
 productSchema.index({ condition: 1, createdAt: -1 });

 ---
 Step 2: Frontend Changes

 2a. Modify frontend/src/types/index.ts

 Update ProductListParams (line 62-68):
 export interface ProductListParams {
   page?: number;
   limit?: number;
   category?: string;
   search?: string;
   sort?: 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'price_asc' | 'price_desc';
   condition?: string[];
 }

 2b. Modify frontend/src/services/productService.ts

 After line 96 (if (params.sort) ...), add:
 if (params.condition && params.condition.length > 0) {
   searchParams.set('condition', params.condition.join(','));
 }

 2c. Create frontend/src/constants/conditions.ts

 export const PRODUCT_CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const;
 export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

 2d. Create frontend/src/components/products/FilterSidebar.tsx

 Shared component for both desktop sidebar and mobile drawer.

 Props: sort, onSortChange, selectedConditions, onConditionsChange

 Content:
 1. "Sort By" label + <select> with 6 options:
   - Newest, Oldest, A-Z, Z-A, Price: Low to High, Price: High to Low
 2. "Condition" label + 4 checkboxes (New, Like New, Good, Fair)

 Styling: Dark theme — bg-dark-elevated, border-dark-border, text-text-primary, accent-orange for checkboxes. Follow existing select patterns in Home.tsx search bar.

 2e. Create frontend/src/components/products/MobileFilterDrawer.tsx

 Slide-in drawer from the left. Follow the exact pattern from MobileMenu.tsx (lines 67-80):
 - Backdrop: fixed inset-0 bg-black/70 backdrop-blur-sm z-40
 - Panel: fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-dark-surface border-r border-dark-border z-50 transform transition-transform
 - Header with "Filters" title + close button
 - Body renders <FilterSidebar> content
 - Lock body scroll when open, close on Escape key

 2f. Modify frontend/src/pages/Home.tsx — Major layout change

 New state variables (after line 51):
 const [selectedSort, setSelectedSort] = useState('newest');
 const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
 const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

 Update both getAll calls (lines 69-74 and 100-105) to pass sort and condition:
 productService.getAll({
   page: 1,
   category: selectedCategory || undefined,
   search: debouncedSearch || undefined,
   sort: selectedSort as ProductListParams['sort'],
   condition: selectedConditions.length > 0 ? selectedConditions : undefined,
 })

 Update dependency arrays — add selectedSort, selectedConditions to both effects (line 93) and loadMore callback (line 116).

 Update Clear Filters — also reset selectedSort to 'newest' and selectedConditions to []. Update visibility condition to include selectedSort !== 'newest' ||
 selectedConditions.length > 0.

 Restructure layout — after category chips and results count:

 ┌──────────────────────────────────────┐
 │ Search bar (full width)              │
 │ Category chips slider (full width)   │
 │ [Filters btn mobile] Results + Clear │
 ├──────────┬───────────────────────────┤
 │ Sidebar  │ Product Grid              │
 │ (desktop)│ (flex-1)                  │
 │ w-60     │                           │
 │ sticky   │                           │
 └──────────┴───────────────────────────┘


 - Mobile "Filters" button: lg:hidden, shows filter count badge when active
 - Desktop sidebar: hidden lg:block w-60 shrink-0 with sticky top-28
 - Product grid + sentinel + loading spinner: flex-1 min-w-0
 - Render <MobileFilterDrawer> at end of component

 2g. Modify frontend/src/components/products/ProductGrid.tsx

 Adjust grid columns for narrower container with sidebar (line 36):

 Before: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
 After:  grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3


 2h. Modify frontend/src/pages/Home.tsx — ProductGridSkeleton

 Match the same column change at line 14:

 Before: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
 After:  grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3


 ---
 Step 3: Test Updates

 3a. MSW Handlers (frontend/src/mocks/handlers.ts)

 In the GET /products handler (~line 539), add:
 - Read sort and condition from URL params
 - Filter by condition ($in logic — filter products where condition is in the list)
 - Sort using comparator functions for all 6 sort options

 3b. Backend Tests (backend/tests/product.test.ts)

 Add tests for:
 - title_asc sorting (A-Z title order)
 - title_desc sorting (Z-A title order)
 - Single condition filter (?condition=New)
 - Multiple conditions (?condition=New,Like New)
 - Combined condition + category filter
 - Invalid condition values ignored
 - All-invalid condition values returns all products

 3c. Frontend Integration Tests (frontend/tests/integration/Home.test.tsx)

 Add tests for:
 - Sort select renders with 6 options
 - Condition checkboxes render (New, Like New, Good, Fair)
 - Changing sort sends sort param to API
 - Checking a condition sends condition param
 - Clear Filters resets sort and conditions

 3d. E2E Tests (homepage-authenticated.spec.ts, homepage-unauthenticated.spec.ts)

 Add tests for:
 - Sort select is visible and changes product order
 - Condition checkboxes filter products
 - Clear Filters resets sort and conditions

 ---
 Critical Files

 ┌──────────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────┐
 │                                 File                                 │                   Action                    │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ backend/src/controllers/productController.ts                         │ Modify — add title sort + condition filter  │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ backend/src/models/Product.ts                                        │ Modify — add indexes                        │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/src/types/index.ts                                          │ Modify — extend ProductListParams           │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/src/services/productService.ts                              │ Modify — add condition param                │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/src/constants/conditions.ts                                 │ Create — condition constants                │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/src/components/products/FilterSidebar.tsx                   │ Create — sort select + condition checkboxes │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/src/components/products/MobileFilterDrawer.tsx              │ Create — slide-out drawer                   │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/src/pages/Home.tsx                                          │ Modify — state, layout, wiring              │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/src/components/products/ProductGrid.tsx                     │ Modify — adjust grid columns                │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/src/mocks/handlers.ts                                       │ Modify — sort + condition support           │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ backend/tests/product.test.ts                                        │ Modify — new sort/filter tests              │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/tests/integration/Home.test.tsx                             │ Modify — sidebar tests                      │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/tests/e2e/phase3-with-data/homepage-authenticated.spec.ts   │ Modify — filter e2e tests                   │
 ├──────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ frontend/tests/e2e/phase3-with-data/homepage-unauthenticated.spec.ts │ Modify — filter e2e tests                   │
 └──────────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────┘

 ---
 Verification

 npm run test -w backend
 npm run test -w frontend
 npm run test:e2e -w frontend
 npm run build -w backend
 npm run build -w frontend


 Visual checks:
 - Desktop: sidebar visible on left with sort select (default "Newest") and 4 condition checkboxes
 - Mobile: "Filters" button visible, opens slide-out drawer with same controls
 - Changing sort re-fetches products in new order
 - Checking conditions filters by selected conditions (OR logic)
 - Clear Filters resets sort to Newest, unchecks all conditions
 - Infinite scroll passes sort/condition params for subsequent pages