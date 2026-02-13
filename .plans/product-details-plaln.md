 Plan: Product Details Page — Dynamic Data from API

 Context

 The ProductDetail.tsx page currently renders product data from mockProducts (hardcoded static data). The backend has a Product model and create/categories endpoints but no "get by ID" endpoint. This plan adds the backend endpoint, wires the frontend to fetch from the API, and adds comprehensive tests. The frontend Product type uses flat sellerId/sellerName
 while the backend returns seller: { _id, name } — the service layer will map between these shapes.

 ---
 Delegation (delegate-implementation skill)

 ┌─────┬─────────────────────────────────────────────────────────────────────────────────────────┬─────────────────┬───────────────────┐
 │  #  │                                       Sub-problem                                       │     Expert      │    Depends on     │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────────┤
 │ 1   │ Add GET /api/products/:id backend endpoint                                              │ Backend Expert  │ —                 │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────────┤
 │ 2   │ Wire ProductDetail.tsx to fetch from API (service, MSW handler, page rework)            │ Frontend Expert │ #1 (API contract) │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────────┤
 │ 3   │ Write all tests (backend + frontend: unit, integration, security, E2E) and execute them │ QA Expert       │ #1, #2            │
 └─────┴─────────────────────────────────────────────────────────────────────────────────────────┴─────────────────┴───────────────────┘

 Execution order: #1 and #2 can run simultaneously (agreed API contract below). #3 runs after both complete.

 API Contract (source of truth for Backend + Frontend)

 GET /api/products/:id (public, no auth required)

 Response 200:
 {
   "success": true,
   "message": "Product retrieved successfully",    s
   "data": {
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
 }

 Response 400 (invalid ObjectId format):
 { "success": false, "message": "Invalid product ID" }

 Response 404 (valid ObjectId but not found):
 { "success": false, "message": "Product not found" }

 ---
 Sub-problem 1: Backend — GET /api/products/:id

 Files to modify:

 - backend/src/controllers/productController.ts — Add getProductById controller
 - backend/src/routes/productRoutes.ts — Add GET /:id route

 Implementation:

 1. getProductById controller in productController.ts:
   - Validate req.params.id with mongoose.isValidObjectId() → throw AppError('Invalid product ID', 400) if invalid
   - Product.findById(id).populate('seller', 'name')
   - If not found → throw AppError('Product not found', 404)
   - Return 200 with product data (same shape as createProduct response)
 2. Route in productRoutes.ts:
   - Add router.get('/:id', getProductById) — public, no auth
   - IMPORTANT: Must be placed AFTER router.get('/categories', ...) so /categories isn't matched as an :id param

 ---
 Sub-problem 2: Frontend — Wire ProductDetail to API

 Files to modify:

 - frontend/src/services/productService.ts — Add getById method and response mapper
 - frontend/src/mocks/handlers.ts — Add GET /products/:id MSW handler
 - frontend/src/pages/ProductDetail.tsx — Replace mock data with API fetch

 Implementation:

 1. productService.ts — Add getById and mapper:
 // Map backend seller object to flat frontend Product type
 function mapProductResponse(data: ProductResponseData): Product {
   return {
     id: data.id,
     title: data.title,
     description: data.description,
     price: data.price,
     images: data.images,
     category: data.category,
     condition: data.condition as Product['condition'],
     sellerId: data.seller._id,
     sellerName: data.seller.name,
     createdAt: data.createdAt,
   };
 }

 getById: async (id: string): Promise<Product> => {
   const res = await api.get<ProductResponse>(`/products/${id}`);
   return mapProductResponse(res.data.data!);
 }
 2. handlers.ts — Add MSW handler:
   - http.get(\${API_BASE}/products/:id`, ...)` — look up in mock products array OR return mock data with that ID
   - IMPORTANT: Must be placed AFTER the /products/categories handler (MSW matches in order)
 3. ProductDetail.tsx — Rework to fetch from API:
   - Add states: product: Product | null, isLoading: boolean, error: string | null
   - useEffect fetches productService.getById(id) on mount/id change
   - Loading state: Skeleton with animate-pulse placeholders for image, title, price, description, details, seller
   - Error state: Show error message with "Back to Products" link
   - Not found: Keep existing "Product Not Found" UI (triggered by 404 from API → caught as error)
   - Success: Render product data same as current template, but from API state instead of mockProducts
   - Remove import { mockProducts } — no longer needed for this page

 ---
 Sub-problem 3: Tests (QA Expert)

 Backend tests — Add to backend/tests/product.test.ts:

 GET /api/products/:id tests:
 - Returns 200 with full product data for existing product (verify all fields including populated seller)
 - Returns 404 for valid ObjectId that doesn't exist
 - Returns 400 for invalid ObjectId format (e.g., "invalid-id", "123")
 - Returns 400 for ObjectId-like string with special characters (security: path traversal attempt)

 Security tests:
 - SQL/NoSQL injection in ID parameter (e.g., {"$gt":""}) returns 400
 - XSS in ID parameter returns 400

 Frontend unit tests — Add to frontend/tests/unit/productService.test.ts:

 - getById returns mapped Product with flat sellerId/sellerName
 - getById throws on 404 (product not found)
 - getById throws on 400 (invalid ID)

 Frontend integration tests — Create frontend/tests/integration/ProductDetail.test.tsx:

 - Shows loading skeleton while fetching
 - Renders product details after successful fetch (title, price, images, description, category, condition, seller name)
 - Shows "Product Not Found" when API returns 404
 - Shows error message when API returns 500
 - "Back to Products" link navigates to /products
 - Image gallery renders all product images

 Frontend E2E tests — Create frontend/tests/e2e/productDetail.spec.ts:

 - Product detail page loads and displays product data
 - Shows "Product Not Found" for non-existent product ID
 - "Back to Products" link works
 - Image gallery navigation works

 Execution:

 npm run build -w backend && npm run build -w frontend
 npm run lint -w backend && npm run lint -w frontend
 npm run test -w backend
 npm run test -w frontend
 npm run test:e2e -w frontend

 ---
 Critical Files Reference

 - backend/src/controllers/productController.ts — Existing controllers, add getProductById
 - backend/src/routes/productRoutes.ts — Existing routes, add GET /:id
 - backend/src/middleware/errorHandler.ts — AppError class for 400/404 errors
 - backend/src/models/Product.ts — Product model with seller ref to User
 - frontend/src/services/productService.ts — Existing service, add getById + mapper
 - frontend/src/pages/ProductDetail.tsx — Main page to rework
 - frontend/src/types/index.ts — Product type (flat sellerId/sellerName)
 - frontend/src/mocks/handlers.ts — MSW handlers, add GET by ID
 - backend/tests/product.test.ts — Existing tests, add GET by ID tests