Plan: Edit Product — Backend API, Edit Page, Image Management                                                                                                                                                                                                                                                                                                             

 Context

 Product owners need to edit their listings. The feature adds a PUT /api/products/:id endpoint (owner-only), an "Edit Product" button on the ProductDetail page (visible only to the owner), and a dedicated /products/:id/edit page with a pre-populated form. The main complexity is image handling: the edit form must display existing Cloudinary URLs alongside newly
 added File objects, track which existing images to keep/remove, and send both to the backend.

 ---
 API Contract

 PUT /api/products/:id — Update product (requires auth + ownership)

 Request: multipart/form-data

 ┌────────────────┬────────┬───────────────────────────────────────┐
 │     Field      │  Type  │                 Notes                 │
 ├────────────────┼────────┼───────────────────────────────────────┤
 │ title          │ string │ 3-100 chars                           │
 ├────────────────┼────────┼───────────────────────────────────────┤
 │ description    │ string │ 10-2000 chars                         │
 ├────────────────┼────────┼───────────────────────────────────────┤
 │ price          │ string │ Positive number                       │
 ├────────────────┼────────┼───────────────────────────────────────┤
 │ category       │ string │ 1-50 chars                            │
 ├────────────────┼────────┼───────────────────────────────────────┤
 │ condition      │ string │ New / Like New / Good / Fair          │
 ├────────────────┼────────┼───────────────────────────────────────┤
 │ existingImages │ string │ JSON array of Cloudinary URLs to keep │
 ├────────────────┼────────┼───────────────────────────────────────┤
 │ images         │ File[] │ Optional new image uploads            │
 └────────────────┴────────┴───────────────────────────────────────┘

 Responses:
 - 200: { success, message: "Product updated successfully", data: { id, title, ... seller: { _id, name, username }, createdAt } }
 - 400: Invalid ID / validation error / image count < 1 or > 5 / existingImages URL not in product
 - 401: Not authenticated
 - 403: Not the product owner ("You are not authorized to edit this product")
 - 404: Product not found

 ---
 Delegation

 ┌─────┬─────────────────────────────────────────────────────────────────────────────────────────────┬─────────────────┬───────────────┐
 │  #  │                                         Sub-problem                                         │     Expert      │  Depends on   │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────┤
 │ 1   │ updateProduct controller, Zod schema, PUT route                                             │ Backend Expert  │ —             │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────┤
 │ 2   │ productService.update, EditImageManager, EditProduct page, ProductDetail edit button, route │ Frontend Expert │ #1 (contract) │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼───────────────┤
 │ 3   │ MSW handler, backend tests, frontend unit/integration tests                                 │ QA Expert       │ #1, #2        │
 └─────┴─────────────────────────────────────────────────────────────────────────────────────────────┴─────────────────┴───────────────┘

 Execution: #1 and #2 run simultaneously. #3 runs after both complete.

 ---
 Sub-problem 1: Backend

 Files to modify

 backend/src/controllers/productController.ts — Add updateProduct controller:
 - Validate ObjectId with mongoose.isValidObjectId(id)
 - Find product (404 if missing)
 - Verify ownership: product.seller.toString() !== req.user!.userId → 403
 - Parse existingImages from req.body.existingImages via JSON.parse() (default to [])
 - Validate each URL in existingImages exists in product.images (prevents URL injection)
 - Upload new files via uploadToCloudinary() (same pattern as createProduct)
 - Combine: allImages = [...existingImages, ...newImageUrls]
 - Validate total: 1-5 images
 - Update product fields, product.save(), populate seller, return 200

 backend/src/routes/productRoutes.ts — Add:
 - updateProductSchema: same fields as createProductSchema + existingImages: z.string().optional()
 - Route: router.put('/:id', protect, upload.array('images', 5), validate(updateProductSchema), updateProduct)
 - Import updateProduct from controller
 - Place PUT before GET /:id to group write operations

 ---
 Sub-problem 2: Frontend

 Files to create

 frontend/src/components/common/EditImageManager.tsx — New component for mixed image types:
 - Props: existingImages: string[], newImages: File[], onExistingImagesChange, onNewImagesChange, maxImages?, error?
 - Renders existing images (from URLs) with remove buttons
 - Renders new images (from File objects with URL.createObjectURL, same pattern as ImageUpload.tsx)
 - Shows "Add Image" button when total < maxImages
 - Same grid styling as ImageUpload: grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3
 - Same file validation: image/* only, 5MB max

 frontend/src/pages/EditProduct.tsx — Edit form page (mirrors CreateProduct.tsx):
 - Fetches product via productService.getById(id) on mount
 - Verifies ownership: authStore.user?.id === product.sellerId (shows "not authorized" if not)
 - Pre-fills form with product data (title, description, price.toFixed(2), category, condition)
 - Initializes existingImages from product.images, newImages as []
 - Uses EditImageManager instead of ImageUpload
 - Same validation as CreateProduct (images check: existingImages.length + newImages.length === 0)
 - Submits via productService.update(id, { ...formData, existingImages, newImages })
 - On success: navigates to /products/${id}
 - Heading: "Edit Product", submit button: "Save Changes" / "Saving..."
 - Cancel button: links to /products/${id} (not /profile)
 - Loading/error/not-found states follow ProductDetail patterns

 Files to modify

 frontend/src/services/productService.ts — Add:
 - UpdateProductData interface: { title, description, price, category, condition, existingImages: string[], newImages: File[] }
 - update(id, data) method: builds FormData (same as create), adds existingImages as JSON.stringify(), uses api.put()

 frontend/src/pages/ProductDetail.tsx — Add "Edit Product" button:
 - Visible only when isOwner is true
 - Place after the badges div, before the Description section
 - <Link to={/products/${product.id}/edit}><Button variant="secondary" size="md">Edit Product</Button></Link>

 frontend/src/App.tsx — Add protected route:
 - Import EditProduct
 - Add <Route path="/products/:id/edit" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
 - Place before /products/:id route

 ---
 Sub-problem 3: Tests & MSW

 Files to modify

 frontend/src/mocks/handlers.ts — Add http.put handler for ${API_BASE}/products/:id:
 - Auth check, find product, ownership check, extract FormData fields, update in-memory, return 200

 backend/tests/product.test.ts — Add describe('PUT /api/products/:id'):
 - 200 update with valid data (existing + new images)
 - 200 keep only existing images (no new uploads)
 - 200 replace all images with new uploads (empty existingImages)
 - 401 without / invalid auth
 - 403 non-owner
 - 404 non-existent product
 - 400 invalid ObjectId, validation errors, 0 images, >5 images, URL injection

 frontend/tests/unit/productService.test.ts — Add describe('update'):
 - Sends FormData, returns updated product
 - 401 unauth, 403 non-owner

 Files to create

 frontend/tests/integration/EditProduct.test.tsx — Integration tests:
 - Renders form pre-filled with product data
 - Shows not authorized for non-owner
 - Shows not found for missing product
 - Validates required fields
 - Shows "Saving..." during submission
 - Successful submit navigates to product detail
 - Failed submit shows error
 - Displays existing images
 - Cancel links to product detail

 frontend/tests/integration/ProductDetail.test.tsx — Add tests:
 - Shows "Edit Product" button for owner
 - Hides "Edit Product" button for non-owner
 - Hides "Edit Product" button for unauthenticated user

 frontend/tests/e2e/editProduct.spec.ts — E2E test:
 - Owner can edit product and see updated data

 ---
 Verification

 npm run build -w backend && npm run build -w frontend
 npm run test -w backend
 npm run test -w frontend
 npm run test:e2e -w frontend

 ---
 Critical Files Reference

 ┌─────────────────────────────────────────────────────┬─────────────────────────────────────────┐
 │                        File                         │                  Role                   │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ backend/src/controllers/productController.ts        │ MODIFY: add updateProduct controller    │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ backend/src/routes/productRoutes.ts                 │ MODIFY: add Zod schema + PUT route      │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ frontend/src/services/productService.ts             │ MODIFY: add update() method             │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ frontend/src/components/common/EditImageManager.tsx │ CREATE: mixed URL + File image manager  │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ frontend/src/pages/EditProduct.tsx                  │ CREATE: edit product form page          │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ frontend/src/pages/ProductDetail.tsx                │ MODIFY: add "Edit Product" owner button │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ frontend/src/App.tsx                                │ MODIFY: add /products/:id/edit route    │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ frontend/src/mocks/handlers.ts                      │ MODIFY: add PUT handler                 │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ backend/tests/product.test.ts                       │ MODIFY: add PUT test suite              │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ frontend/tests/unit/productService.test.ts          │ MODIFY: add update tests                │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ frontend/tests/integration/EditProduct.test.tsx     │ CREATE: edit page tests                 │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ frontend/tests/integration/ProductDetail.test.tsx   │ MODIFY: add edit button tests           │
 ├─────────────────────────────────────────────────────┼─────────────────────────────────────────┤
 │ frontend/tests/e2e/editProduct.spec.ts              │ CREATE: E2E edit flow test              │
 └─────────────────────────────────────────────────────┴─────────────────────────────────────────┘