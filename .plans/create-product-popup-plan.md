 Create Product UI Redesign - Floating Button + Modal Popup

 Context

 The current Create Product feature uses a dedicated route (/create-product) with a full-page form. This redesign transforms it into a more modern, app-like experience with a floating action button (FAB) that opens a modal overlay.

 Why this change:
 - Modern UX pattern - Floating action buttons provide quick access to primary actions without dedicating full navigation space
 - Improved discoverability - The circular button with + icon is a universally recognized pattern for "create new"
 - Better mobile experience - Saves navigation space and provides consistent access point regardless of scroll position
 - Visual hierarchy - Orange-themed modal popup creates clear focus on the creation task
 - Reduced navigation clutter - Removes the need for "Create Product" links in both desktop and mobile navigation

 User Requirements:
 1. Circular floating button positioned at bottom left of the page
 2. Button contains a "+" symbol that rotates 45 degrees on hover with smooth transition
 3. Clicking the button opens a modal/popup with orange background containing the create product form
 4. Remove the current /create-product route and navigation links

 Implementation Method - Delegation Table

 This task will be delegated using the delegate-implementation skill following the decomposition → expert identification → execution workflow.

 Task Decomposition

 Breaking down into non-overlapping sub-problems (maximum 5):

 ┌─────┬─────────────────────────────────────────────────────────────────────────────────────┬───────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │  #  │                               Sub-problem Description                               │    Expert     │                                                                                                                                        Acceptance Criteria                                                                                                                                         │
 │     │                                                                                     │   Assigned    │                                                                                                                                                                                                                                                                                                    │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────┼───────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 1   │ Design review: Evaluate FAB placement, modal layout, animations, colors, spacing,   │ UI-UX         │ - Design recommendations provided for FAB (size, position, shadow, z-index)- Modal layout guidance (proportions, spacing, responsive behavior)- Animation timing recommendations (rotation, transitions)- Color contrast verification for accessibility- Mobile responsive breakpoints defined     │
 │     │ and accessibility                                                                   │ Designer      │                                                                                                                                                                                                                                                                                                    │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────┼───────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 2   │ Implement CreateProductForm, CreateProductModal, CreateProductFAB components and    │ Frontend      │ - CreateProductForm.tsx created (extracted form logic)- CreateProductModal.tsx created (orange background, modal pattern)- CreateProductFAB.tsx created (bottom-left, rotation animation)- App.tsx updated (FAB added, route redirected)- Navbar.tsx and MobileMenu.tsx updated (links removed)-   │
 │     │ integrate into app                                                                  │ Expert        │ All components follow design recommendations from UI-UX Designer                                                                                                                                                                                                                                   │
 ├─────┼─────────────────────────────────────────────────────────────────────────────────────┼───────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ 3   │ Delete old CreateProduct tests, create new FAB/Modal tests, and run comprehensive   │ QA Expert     │ - Old CreateProduct.test.tsx deleted- New CreateProductFAB.test.tsx created with visibility and interaction tests- All backend tests pass (127+ tests)- All frontend tests pass (adjusted count)- Comprehensive test report provided (deleted, created, pass/fail)                                 │
 │     │ test suite                                                                          │               │                                                                                                                                                                                                                                                                                                    │
 └─────┴─────────────────────────────────────────────────────────────────────────────────────┴───────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 Expert Responsibilities

 UI-UX Designer (Sub-problem 1):
 - Review user requirements and existing design system (colors, components, patterns)
 - Analyze current ConfirmDialog modal pattern and provide recommendations for modal design
 - Specify FAB design details:
   - Exact positioning (bottom/left offset in px)
   - Size (diameter in px, mobile vs desktop)
   - Shadow depth and color
   - z-index value
   - Hover effects (scale, shadow changes)
   - Animation timing and easing for + rotation
 - Specify modal design details:
   - Orange background approach (solid vs gradient, which gradient)
   - Modal dimensions (max-width, max-height, padding)
   - Form container styling (white card vs direct on orange)
   - Spacing and typography inside modal
   - Close button styling and position
   - Responsive breakpoints and mobile adjustments
 - Verify color contrast meets WCAG AA standards:
   - White text on orange background
   - Form elements on orange or white card
   - Error messages visibility
 - Provide accessibility recommendations:
   - Focus states and tab order
   - ARIA labels and roles
   - Keyboard navigation patterns
 - Create design specification document or annotated recommendations for Frontend Expert
 - Prohibition: Do NOT use delegate-implementation skill - provide design guidance directly

 Frontend Expert (Sub-problem 2):
 - Follow design specifications from UI-UX Designer
 - Create /frontend/src/components/product/CreateProductForm.tsx:
   - Extract all form logic from CreateProduct.tsx
   - Accept props: onSuccess(productId), onCancel()
   - Maintain all existing validation and error handling
   - Use FormData submission to productService.create()
 - Create /frontend/src/components/product/CreateProductModal.tsx:
   - Implement modal following ConfirmDialog pattern and UI-UX Designer specs
   - Orange background (gradient or solid per design specs)
   - Integrate CreateProductForm with proper callbacks
   - Escape key and backdrop click handlers
   - Navigation on successful submission
 - Create /frontend/src/components/common/CreateProductFAB.tsx:
   - Circular button with exact sizing from design specs
   - Fixed positioning per design specs
       - symbol with 45° rotation on hover
   - Only visible to authenticated & verified users
   - Local state for modal open/close
 - Update /frontend/src/App.tsx:
   - Import and render CreateProductFAB after Footer
   - Redirect /create-product route to home
 - Update /frontend/src/components/layout/Navbar.tsx:
   - Remove "Create Product" link (lines ~39-43)
 - Update /frontend/src/components/layout/MobileMenu.tsx:
   - Remove "Create Product" link (lines ~95-99)
 - Ensure mobile responsiveness per design specs
 - Implement all accessibility features per UI-UX Designer recommendations
 - Prohibition: Do NOT use delegate-implementation skill - implement directly and autonomously

 QA Expert (Sub-problem 3):
 - Delete old test file: /frontend/tests/integration/CreateProduct.test.tsx
 - Create new test file: /frontend/tests/unit/CreateProductFAB.test.tsx
   - Test FAB renders for verified users only
   - Test FAB hidden for unverified users
   - Test FAB hidden for unauthenticated users
   - Test clicking FAB opens modal
   - Test modal closes on cancel/backdrop click
   - Test hover animations and accessibility features
 - Optionally create /frontend/tests/integration/CreateProductModal.test.tsx if valuable test cases need porting
 - Run backend test suite: npm run test -w backend
 - Run frontend test suite: npm run test -w frontend
 - Verify all tests pass
 - If failures occur, analyze and coordinate fixes with Frontend Expert
 - Provide comprehensive test report:
   - List of deleted tests with justification
   - List of new tests created with coverage summary
   - All test results (backend: 127+, frontend: adjusted count)
   - Any regressions or issues found
 - Prohibition: Do NOT use delegate-implementation skill - test and report directly

 Execution Strategy

 Sequential Execution:
 1. UI-UX Designer executes sub-problem 1 first (design review and specifications)
 2. Frontend Expert executes sub-problem 2 after UI-UX Designer completes (implementation)
 3. QA Expert executes sub-problem 3 after Frontend completes (testing and verification)

 Rationale:
 - Frontend Expert needs design specifications from UI-UX Designer before implementing
 - QA Expert depends on Frontend Expert completing all code changes before testing
 - Sequential approach ensures design consistency and no implementation conflicts
 - Clear handoff points between experts

 Concurrency Rules Applied:
 - ✅ Sequential execution (UI-UX → Frontend → QA) ensures proper dependencies
 - ✅ No same-expert parallelism violations
 - ✅ Clear dependency chain with design-first approach
 - ✅ Each expert completes their work before next expert starts

 ---
 Current State

 Current Implementation

 - Route: /create-product protected by VerifiedRoute wrapper (requires email verification)
 - Page Component: /frontend/src/pages/CreateProduct.tsx
 - Form Fields: title, description, price, category, condition, images (max 5)
 - Validation: Custom validation in handleSubmit (not using Zod on frontend)
 - Submission: Uses FormData for multipart upload via productService.create()
 - Navigation Links:
   - Navbar.tsx (line ~40) - "Create Product" link for verified users
   - MobileMenu.tsx (line ~96) - "Create Product" link for verified users

 Key Components to Reuse

 - ImageUpload.tsx - Multi-file upload with preview grid (max 5 images, 5MB each)
 - CategoryAutocomplete.tsx - API-powered category selection with keyboard navigation
 - ConfirmDialog.tsx - Modal pattern reference (fixed positioning, backdrop blur, z-50, escape/click-outside handlers)
 - Button.tsx - Existing button component with variants (primary, secondary, danger)
 - Input.tsx - Form input with dark/light variants and error support

 Theme Colors Available

 - Orange: #ff5722 (DEFAULT), #ff7043 (hover), #ff8a65 (light)
 - Gradients: gradient-cta: linear-gradient(135deg, #ff5722 0%, #ff7043 100%)
 - Dark theme: #0a0a0a (bg), #1a1a1a (surface), #2a2a2a (elevated)

 Technical Implementation Details

 1. CreateProductForm Component

 File: /frontend/src/components/product/CreateProductForm.tsx

 Purpose: Extract all form logic from CreateProduct.tsx into a reusable component.

 Props:
 interface CreateProductFormProps {
   onSuccess: (productId: string) => void;
   onCancel: () => void;
 }

 Implementation:
 - Extract entire form logic from CreateProduct.tsx
 - Maintain all existing validation (custom validation in handleSubmit)
 - Keep same form fields: title, description, price, category, condition, images
 - Use existing components: Input, ImageUpload, CategoryAutocomplete
 - Call onSuccess(productId) instead of direct navigation
 - Call onCancel() for cancel button
 - Preserve error handling and loading states
 - Use FormData submission to productService.create()

 2. CreateProductModal Component

 File: /frontend/src/components/product/CreateProductModal.tsx

 Purpose: Modal wrapper that displays the form in an orange-themed overlay.

 Props:
 interface CreateProductModalProps {
   isOpen: boolean;
   onClose: () => void;
 }

 Pattern (following ConfirmDialog):
 - Fixed inset-0 positioning with z-50
 - Backdrop with bg-black/60 + backdrop-blur-sm
 - Orange background for modal container (design specs from UI-UX Designer)
 - White card inside for form content (better readability)
 - Close button (X) in top-right corner
 - Escape key listener to close modal
 - Backdrop click to close modal
 - Max height with scrolling: max-h-[85vh] overflow-y-auto
 - On successful form submission: close modal + navigate to product detail

 Accessibility:
 - role="dialog" and aria-modal="true"
 - aria-labelledby pointing to header
 - Focus ring on close button
 - Keyboard navigation support

 3. CreateProductFAB Component

 File: /frontend/src/components/common/CreateProductFAB.tsx

 Purpose: Circular floating button at bottom left that opens the modal.

 Key Features:
 - Fixed positioning at bottom-left (exact specs from UI-UX Designer)
 - Circular design with orange gradient background
 - Large + symbol that rotates 45° on hover
 - Smooth transitions and animations (timing from UI-UX Designer)
 - Only visible to authenticated & verified users
 - Local state for modal open/close
 - Mobile responsive (smaller on mobile)

 Visibility Logic:
 const { isAuthenticated, user } = useAuthStore();
 if (!isAuthenticated || user?.isVerified === false) {
   return null;
 }

 4. App.tsx Integration

 File: /frontend/src/App.tsx

 Changes:
 1. Import CreateProductFAB
 2. Render FAB after Footer element
 3. Redirect /create-product route to home:
 <Route path="/create-product" element={<Navigate to="/" replace />} />

 5. Navigation Updates

 Navbar.tsx: Remove "Create Product" link (lines ~39-43)
 MobileMenu.tsx: Remove "Create Product" link (lines ~95-99)

 Critical Files

 New Files to Create:
 - /frontend/src/components/product/CreateProductForm.tsx - Extracted form logic
 - /frontend/src/components/product/CreateProductModal.tsx - Modal wrapper with orange theme
 - /frontend/src/components/common/CreateProductFAB.tsx - Floating action button
 - /frontend/tests/unit/CreateProductFAB.test.tsx - Unit tests for FAB

 Files to Modify:
 - /frontend/src/App.tsx - Add FAB, redirect route
 - /frontend/src/components/layout/Navbar.tsx - Remove Create Product link
 - /frontend/src/components/layout/MobileMenu.tsx - Remove Create Product link

 Files to Delete:
 - /frontend/tests/integration/CreateProduct.test.tsx - Old page tests
 - /frontend/src/pages/CreateProduct.tsx - Old page component (after verification)

 Reference Files:
 - /frontend/src/components/common/ConfirmDialog.tsx - Modal pattern reference
 - /frontend/src/components/common/ImageUpload.tsx - Image upload component
 - /frontend/src/components/common/CategoryAutocomplete.tsx - Category selection
 - /frontend/src/services/productService.ts - API integration
 - /frontend/tailwind.config.js - Theme colors and gradients

 Verification Steps

 1. Automated Testing

 # Backend tests
 npm run test -w backend

 # Frontend tests
 npm run test -w frontend

 # E2E tests (optional)
 npm run test:e2e -w frontend

 Expected:
 - All 127+ backend tests pass
 - All frontend tests pass (adjusted count after deletions)
 - New CreateProductFAB tests pass

 2. Manual Testing - Desktop

 FAB Visibility:
 1. ✓ Unauthenticated user - FAB not visible
 2. ✓ Verified user - FAB appears at bottom left
 3. ✓ Unverified user - FAB not visible
 4. ✓ FAB has orange gradient and shadow

 FAB Interaction:
 1. ✓ Hover - + symbol rotates 45 degrees smoothly
 2. ✓ Hover - scale increases (if specified by UI-UX Designer)
 3. ✓ Click - modal opens with orange background
 4. ✓ No overlap with footer or other elements

 Modal Testing:
 1. ✓ Orange gradient background displays correctly
 2. ✓ Form appears in white card (if specified)
 3. ✓ All form fields render (title, description, price, category, condition, images)
 4. ✓ Close button (X) works
 5. ✓ Escape key closes modal
 6. ✓ Backdrop click closes modal
 7. ✓ Modal scrolls if content exceeds viewport

 Form Functionality:
 1. ✓ Fill all fields - submission succeeds
 2. ✓ Missing title - shows error
 3. ✓ No images - shows error
 4. ✓ Upload multiple images - previews work
 5. ✓ Remove image - works correctly
 6. ✓ Category autocomplete - fetches categories
 7. ✓ Success - navigates to product detail AND closes modal
 8. ✓ Server error - shows error in modal

 Navigation:
 1. ✓ Navbar - "Create Product" link removed
 2. ✓ Other links still work
 3. ✓ Navigate to /create-product - redirects to home

 3. Manual Testing - Mobile

 Mobile FAB:
 1. ✓ FAB visible at bottom left (smaller size)
 2. ✓ No overlap with mobile menu/footer
 3. ✓ Tap FAB - modal opens
 4. ✓ Sufficient touch target (min 48px)

 Mobile Modal:
 1. ✓ Modal fits viewport
 2. ✓ Modal scrolls on small screens
 3. ✓ Form fields usable on mobile
 4. ✓ Image upload works
 5. ✓ Close button tappable
 6. ✓ Tap outside - closes

 Mobile Navigation:
 1. ✓ Hamburger menu - "Create Product" link removed
 2. ✓ Other menu links work
 3. ✓ FAB visible when menu open (correct z-index)

 4. Accessibility Testing

 Keyboard Navigation:
 1. ✓ Tab to FAB - focus ring visible
 2. ✓ Enter on FAB - modal opens
 3. ✓ Tab through form - proper order
 4. ✓ Escape - modal closes

 Screen Reader:
 1. ✓ FAB announces "Create new product"
 2. ✓ Modal announces as dialog
 3. ✓ Form labels associated with inputs
 4. ✓ Error messages announced

 Visual:
 1. ✓ Orange/white contrast meets WCAG AA
 2. ✓ Error messages have sufficient contrast
 3. ✓ Focus indicators visible

 5. Browser Compatibility

 1. ✓ Chrome/Edge - all features work
 2. ✓ Firefox - all features work
 3. ✓ Safari - all features work, backdrop-blur supported

 Expected Outcomes

 ✓ FAB appears at bottom left for verified users only
 ✓ + symbol rotates 45 degrees on hover with smooth transition
 ✓ Modal opens with orange background following design specs
 ✓ Form functionality identical to previous implementation
 ✓ Modal closes via X, Escape, or backdrop click
 ✓ Successful submission navigates and closes modal
 ✓ Navigation links removed from Navbar and MobileMenu
 ✓ /create-product route redirects to home
 ✓ All tests pass
 ✓ Mobile fully responsive
 ✓ Accessibility standards met
 ✓ Design follows UI-UX Designer recommendations