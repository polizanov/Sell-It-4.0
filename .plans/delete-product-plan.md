Plan: Delete Product — Backend API, Confirmation Dialog, Cascade Cleanup

 Context

 Product owners need to delete their listings. The feature adds a DELETE /api/products/:id endpoint (owner-only), a trash icon button on the ProductDetail page (visible only to the owner, next to the edit icon), and a reusable ConfirmDialog component that appears when the delete icon is clicked. On deletion, associated favourites are also cleaned up.

 ---
 API Contract

 DELETE /api/products/:id — Delete product (requires auth + ownership)

 - 200: { success: true, message: "Product deleted successfully" }
 - 401: not authenticated
 - 403: not the product owner ("You are not authorized to delete this product")
 - 404: product not found
 - 400: invalid product ID format

 On success, the backend also deletes all Favourite documents referencing this product (cascade cleanup).

 ---
 Delegation

 ┌─────┬─────────────────────────────────────────────────────────────────────────────────────────┬─────────────────┬────────────────────────────┐
 │  #  │                                       Sub-problem                                       │     Expert      │         Depends on         │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────────────┤
 │ 1   │ deleteProduct controller, DELETE route                                                  │ Backend Expert  │ —                          │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────────────┤
 │ 2   │ ConfirmDialog and delete icon UX design guidance                                        │ UI/UX Designer  │ —                          │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────────────┤
 │ 3   │ ConfirmDialog component, productService.delete, delete button + dialog in ProductDetail │ Frontend Expert │ #1 (contract), #2 (design) │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────────────┤
 │ 4   │ MSW handler, backend tests, frontend unit/integration/e2e tests                         │ QA Expert       │ #1, #3                     │
 └─────┴─────────────────────────────────────────────────────────────────────────────────────────┴─────────────────┴────────────────────────────┘

 Execution: #1 and #2 run simultaneously. #3 runs after both complete. #4 runs after #1 and #3.

 ---
 Sub-problem 1: Backend

 Files to modify

 backend/src/controllers/productController.ts — Add deleteProduct controller:
 - Validate ObjectId with mongoose.isValidObjectId(id) → 400 if invalid
 - Find product by ID → 404 if not found
 - Ownership check: product.seller.toString() !== req.user!.userId → 403
 - Delete associated favourites: Favourite.deleteMany({ product: id }) (import from ../models/Favourite)
 - Delete product: Product.findByIdAndDelete(id)
 - Return 200 with success message

 backend/src/routes/productRoutes.ts — Add DELETE route:
 - router.delete('/:id', protect, deleteProduct)
 - Import deleteProduct from controller
 - Place after the PUT /:id route, before GET /:id
 - No Zod validation needed (productId comes from URL param, validated in controller)

 ---
 Sub-problem 2: UI/UX Design

 UI/UX Designer provides design guidance for:

 - ConfirmDialog component: Modal layout, spacing, visual hierarchy, backdrop treatment, button placement (cancel left vs right), color usage for destructive action emphasis, animation/transitions, accessibility considerations (focus trap, screen reader announcements)
 - Delete icon placement: Positioning relative to edit icon in the title row, icon size consistency, hover states, color transitions (muted → red on hover), spacing between action icons
 - Confirmation message UX: Wording for the destructive action warning, whether to include the product title in the message, tone of the copy
 - Post-deletion UX: Where to redirect after successful deletion, whether to show a success toast/notification

 The designer's recommendations feed into the Frontend Expert's implementation.

 ---
 Sub-problem 3: Frontend

 Files to create

 frontend/src/components/common/ConfirmDialog.tsx — Reusable confirmation dialog:
 - Props: isOpen: boolean, title: string, message: string, confirmLabel?: string (default "Delete"), cancelLabel?: string (default "Cancel"), onConfirm: () => void, onCancel: () => void, isLoading?: boolean, variant?: 'danger' | 'primary' (default "danger")
 - Renders a modal overlay when isOpen is true: dark backdrop (bg-black/70 backdrop-blur-sm), centered card
 - Card content: title (h2), message (p), two buttons — Cancel (secondary variant) and Confirm (danger variant, using existing Button component)
 - Confirm button shows isLoading state (disabled + "Deleting..." text)
 - Close on backdrop click (calls onCancel)
 - Close on Escape key (useEffect with keydown listener)
 - Uses role="dialog" and aria-modal="true" for accessibility
 - Follows dark theme: bg-dark-surface, border-dark-border, text-text-primary/text-text-secondary

 Files to modify

 frontend/src/services/productService.ts — Add delete method:
 - delete: (id: string) => api.delete<{ success: boolean; message: string }>(/products/${id})

 frontend/src/pages/ProductDetail.tsx — Add delete icon button + confirmation dialog:
 - Import ConfirmDialog and useNavigate
 - Add state: showDeleteDialog: boolean (default false), isDeleting: boolean (default false)
 - Add handleDelete async handler: set isDeleting(true), call productService.delete(product.id), on success navigate to /products, on error set error state, finally set isDeleting(false) and close dialog
 - Add trash icon button next to edit icon (inside the {isOwner && ...} block, line 317):
 {isOwner && (
   <>
     <Link to={...edit...} aria-label="Edit product">...</Link>
     <button onClick={() => setShowDeleteDialog(true)} aria-label="Delete product"
       className="flex-shrink-0 p-2 rounded-lg transition-colors text-text-muted hover:text-red-500">
       <TrashSVG />
     </button>
   </>
 )}
 - Add ConfirmDialog at the end of the component JSX (before closing </div>):
 <ConfirmDialog
   isOpen={showDeleteDialog}
   title="Delete Product"
   message={`Are you sure you want to delete "${product.title}"? This action cannot be undone.`}
   confirmLabel="Delete"
   onConfirm={handleDelete}
   onCancel={() => setShowDeleteDialog(false)}
   isLoading={isDeleting}
 />
 - Trash SVG icon: standard trash/bin outline (same w-7 h-7 sizing as edit/favourite icons)

 ---
 Sub-problem 4: Tests & MSW

 Files to modify

 frontend/src/mocks/handlers.ts — Add http.delete handler for ${API_BASE}/products/:id:
 - Auth check (Bearer token validation)
 - Find product in combined products array
 - Ownership check (seller._id matches authenticated user)
 - Remove product from array
 - Remove associated entries from favourites array
 - Return 200 success or appropriate error (401/403/404)

 backend/tests/product.test.ts — Add describe('DELETE /api/products/:id'):
 - 200: owner successfully deletes product
 - 200: verify product no longer exists after deletion (GET returns 404)
 - 200: verify associated favourites are cleaned up
 - 401: without auth token
 - 401: with invalid auth token
 - 403: non-owner cannot delete another user's product
 - 404: non-existent product (valid ObjectId)
 - 400: invalid ObjectId format

 frontend/tests/integration/ProductDetail.test.tsx — Add describe('Delete Product'):
 - Shows delete icon button for product owner
 - Does NOT show delete icon button for non-owner
 - Does NOT show delete icon button for unauthenticated user
 - Clicking delete icon shows confirmation dialog with product title
 - Clicking "Cancel" in dialog closes it without deleting
 - Clicking "Delete" in dialog calls API and navigates to /products on success
 - Shows error when delete API fails

 Files to create

 frontend/tests/unit/ConfirmDialog.test.tsx — Unit tests for the reusable component:
 - Renders when isOpen is true
 - Does not render when isOpen is false
 - Shows title and message text
 - Calls onConfirm when confirm button clicked
 - Calls onCancel when cancel button clicked
 - Calls onCancel when backdrop clicked
 - Calls onCancel on Escape key press
 - Shows loading state on confirm button when isLoading is true
 - Confirm button is disabled when isLoading

 frontend/tests/e2e/deleteProduct.spec.ts — E2E Playwright test:
 - Owner creates product, navigates to its detail, clicks delete icon, confirms in dialog, verifies redirect to /products
 - Non-owner does not see delete icon

 ---
 Verification

 npm run build -w backend && npm run build -w frontend
 npm run lint -w backend && npm run lint -w frontend
 npm run test -w backend
 npm run test -w frontend
 npm run test:e2e -w frontend

 ---
 Critical Files Reference

 ┌───────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┐
 │                       File                        │                                Role                                 │
 ├───────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ backend/src/controllers/productController.ts      │ MODIFY: add deleteProduct controller with cascade favourite cleanup │
 ├───────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ backend/src/routes/productRoutes.ts               │ MODIFY: add DELETE /:id route with protect middleware               │
 ├───────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ frontend/src/components/common/ConfirmDialog.tsx  │ CREATE: reusable confirmation dialog component                      │
 ├───────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ frontend/src/services/productService.ts           │ MODIFY: add delete() method                                         │
 ├───────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ frontend/src/pages/ProductDetail.tsx              │ MODIFY: add trash icon button + ConfirmDialog for owners            │
 ├───────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ frontend/src/mocks/handlers.ts                    │ MODIFY: add DELETE product MSW handler                              │
 ├───────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ backend/tests/product.test.ts                     │ MODIFY: add DELETE endpoint test suite                              │
 ├───────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ frontend/tests/unit/ConfirmDialog.test.tsx        │ CREATE: ConfirmDialog component unit tests                          │
 ├───────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ frontend/tests/integration/ProductDetail.test.tsx │ MODIFY: add delete button + dialog integration tests                │
 ├───────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤
 │ frontend/tests/e2e/deleteProduct.spec.ts          │ CREATE: E2E delete product flow test                                │
 └───────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────┘
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌