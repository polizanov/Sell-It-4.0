 Plan: Email Verification-Based Access Control                                                                                                                                                                                                                                                                                                                             

 Context

 Currently, unverified users are completely blocked from logging in (backend returns 403). The user wants unverified users to be able to log in but with limited access: they cannot create, edit, or delete products, and cannot add products to favourites. Unverified users should NOT see "Create Product" or "My Favourites" nav links at all. A verification warning
 banner should appear under the header on the homepage and profile page. When unverified users try restricted actions, they see a clear "verify your email" message.

 ---
 Backend Changes

 1. backend/src/controllers/authController.ts — Allow unverified login

 Remove lines 67-69 (the verification gate in the login handler):
 if (!user.isVerified) {
   throw new AppError('Please verify your email before logging in', 403);
 }

 The login response already returns isVerified (line 81), so the frontend uses it for UI decisions.

 2. backend/src/middleware/authMiddleware.ts — Add requireVerified middleware

 Add a new exported middleware after the existing protect function. Runs AFTER protect, queries DB to check isVerified (so verification lifts immediately without re-login).

 New imports: asyncHandler from express-async-handler, User from ../models/User.

 3. backend/src/routes/productRoutes.ts — Gate create/update/delete

 Add requireVerified after protect on POST, PUT, DELETE routes. Place before upload.array() to skip file processing for unverified users.

 4. backend/src/routes/favouriteRoutes.ts — Gate add/remove favourite

 Add requireVerified after protect on POST and DELETE routes. GET routes unchanged.

 ---
 UI/UX Design Guidance (Sub-problem #2 — no code, research only)

 The UI/UX Designer provides design recommendations that the Frontend Expert will implement.

 5. VerificationBanner design

 Guidance needed for the dismissible warning banner that appears under the header for unverified users:
 - Visual weight and color scheme (yellow/amber warning tones on dark theme)
 - Spacing, padding, and how it integrates below the fixed navbar
 - Icon choice (warning triangle vs envelope vs shield)
 - Dismiss button placement and behavior
 - Typography (font size, weight for the message)
 - Accessibility considerations (ARIA roles, contrast ratios)

 6. VerificationRequired page design

 Guidance needed for the full-page "Email Verification Required" message shown on restricted pages:
 - Layout and visual hierarchy (icon, heading, message, CTA button)
 - Icon style and size (email envelope, shield, or lock)
 - Message tone and wording
 - Consistency with existing error/not-found states (e.g., ProductDetail 404 page)

 7. Inline verification hints design

 Guidance for the small inline hint shown on ProductDetail for unverified users (where favourite/edit/delete buttons would normally appear):
 - Text color, size, and placement
 - Wording for owner vs non-owner context

 ---
 Frontend Changes

 8. CREATE frontend/src/components/common/VerificationBanner.tsx

 Dismissible (session-based via useState) warning banner for unverified users. Implements UI/UX Designer's recommendations from #5.

 - Only renders when: isAuthenticated && user?.isVerified === false && !isDismissed
 - Layout: warning icon + text message + dismiss X button
 - Text: "Your email is not verified. Please check your inbox to verify your email and unlock all features."

 9. CREATE frontend/src/components/common/VerificationRequired.tsx

 Full-page message component shown on restricted pages for unverified users. Implements UI/UX Designer's recommendations from #6.

 - Props: message?: string, backTo?: string, backLabel?: string
 - Layout: PageContainer > Card > centered content with email icon, "Email Verification Required" heading, message text, and back button

 10. CREATE frontend/src/components/auth/VerifiedRoute.tsx — Route guard

 A wrapper component similar to ProtectedRoute but additionally checks isVerified. Renders <VerificationRequired /> for unverified users.

 export const VerifiedRoute = ({ children }: { children: React.ReactNode }) => {
   const { isAuthenticated, isLoading, user } = useAuthStore();
   if (isLoading) return <LoadingSpinner />;
   if (!isAuthenticated) return <Navigate to="/login" replace />;
   if (user?.isVerified === false) return <VerificationRequired />;
   return <>{children}</>;
 };

 11. MODIFY frontend/src/App.tsx

 Two changes:
 1. Add <VerificationBanner /> between <Navigation /> and <Routes> (under the header, visible globally)
 2. Replace <ProtectedRoute> with <VerifiedRoute> on /create-product, /products/:id/edit, /favourites. Keep <ProtectedRoute> for /profile.

 12. MODIFY frontend/src/components/layout/Navbar.tsx — Hide restricted links

 For unverified users (user?.isVerified === false), hide "Create Product" and "My Favourites" links entirely. Keep "My Profile" and "Logout" visible.

 13. MODIFY frontend/src/components/layout/MobileMenu.tsx — Same as Navbar

 Hide "Create Product" and "My Favourites" links for unverified users.

 14. MODIFY frontend/src/pages/MyProfile.tsx — Hide create buttons

 Hide "Create New Product" buttons entirely at lines 170-174 and 210-213 (wrap with {user?.isVerified !== false && (...)}). For the empty state, show different text for unverified: "Verify your email to start listing products."

 15. MODIFY frontend/src/pages/ProductDetail.tsx — Hide buttons for unverified

 Update visibility logic:
 const isVerified = user?.isVerified !== false;
 const showFavouriteButton = isAuthenticated && isVerified && !isOwner && product !== null;
 const showOwnerActions = isOwner && isVerified;
 Change {isOwner && ( to {showOwnerActions && (. Add inline hint (implements #7's design):
 {isAuthenticated && !isVerified && (
   <p className="text-yellow-500 text-sm mt-2">
     Verify your email to {isOwner ? 'manage this product' : 'add products to favourites'}.
   </p>
 )}

 16. MODIFY frontend/src/pages/VerifyEmail.tsx — Update auth store on success

 - Import useAuthStore, update store when verification succeeds while logged in: setUser({ ...user, isVerified: true })
 - Change success message to: "Your email has been successfully verified. You now have full access to all features."
 - Change CTA: "Go to Homepage" (link /) if authenticated, "Go to Login" (link /login) if not

 17. MODIFY frontend/src/pages/Home.tsx — Update "Start Selling" CTA

 Link to /create-product only if isAuthenticated && user?.isVerified !== false, otherwise link to /login.

 Note: CreateProduct, EditProduct, and MyFavourites pages need no in-component verification checks — the VerifiedRoute wrapper in App.tsx handles it at the route level.

 ---
 Delegation

 ┌─────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────────────┬────────────────────┬────────────┐
 │  #  │                                                           Sub-problem                                                            │     Expert      │    Writes code?    │ Depends on │
 ├─────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────┼────────────┤
 │ 1   │ Backend: remove login gate, add requireVerified middleware, apply to routes                                                      │ Backend Expert  │ Yes                │ —          │
 ├─────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────┼────────────┤
 │ 2   │ Design guidance: VerificationBanner layout, VerificationRequired page, inline hints, color/spacing/accessibility recommendations │ UI/UX Designer  │ No (research only) │ —          │
 ├─────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────┼────────────┤
 │ 3   │ Frontend: create components, modify all pages, update nav links (implements #2's recommendations)                                │ Frontend Expert │ Yes                │ #1, #2     │
 ├─────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────────────┼────────────┤
 │ 4   │ Tests: backend middleware tests, frontend unit/integration tests, MSW handler updates                                            │ QA Expert       │ Yes                │ #1, #3     │
 └─────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴─────────────────┴────────────────────┴────────────┘

 Execution: #1 and #2 run simultaneously. #3 runs after both (uses #2's design guidance). #4 runs after #1 and #3.

 ---
 Files Reference

 ┌─────────────────────────────────────────────────────────┬────────┬────────────────────────────────────────────────────────────┐
 │                          File                           │ Action │                          Summary                           │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ backend/src/controllers/authController.ts               │ MODIFY │ Remove lines 67-69 (unverified login block)                │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ backend/src/middleware/authMiddleware.ts                │ MODIFY │ Add requireVerified middleware                             │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ backend/src/routes/productRoutes.ts                     │ MODIFY │ Add requireVerified to POST, PUT, DELETE                   │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ backend/src/routes/favouriteRoutes.ts                   │ MODIFY │ Add requireVerified to POST, DELETE                        │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ frontend/src/components/common/VerificationBanner.tsx   │ CREATE │ Dismissible warning banner under header                    │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ frontend/src/components/common/VerificationRequired.tsx │ CREATE │ Full-page verification message                             │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ frontend/src/components/auth/VerifiedRoute.tsx          │ CREATE │ Route guard: auth + verification check                     │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ frontend/src/App.tsx                                    │ MODIFY │ Add VerificationBanner under Navigation, use VerifiedRoute │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ frontend/src/components/layout/Navbar.tsx               │ MODIFY │ Hide Create Product & Favourites for unverified            │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ frontend/src/components/layout/MobileMenu.tsx           │ MODIFY │ Hide Create Product & Favourites for unverified            │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ frontend/src/pages/Home.tsx                             │ MODIFY │ Update "Start Selling" CTA for unverified                  │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ frontend/src/pages/MyProfile.tsx                        │ MODIFY │ Hide create product buttons for unverified                 │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ frontend/src/pages/ProductDetail.tsx                    │ MODIFY │ Hide favourite/edit/delete for unverified, add hint        │
 ├─────────────────────────────────────────────────────────┼────────┼────────────────────────────────────────────────────────────┤
 │ frontend/src/pages/VerifyEmail.tsx                      │ MODIFY │ Update auth store on success, update messaging             │
 └─────────────────────────────────────────────────────────┴────────┴────────────────────────────────────────────────────────────┘

 ---
 Verification

 npm run build -w backend && npm run build -w frontend
 npm run test -w backend
 npm run test -w frontend

 Manual testing:
 1. Register a new user (don't verify email) -> should be able to login
 2. See verification banner under header on every page
 3. Navbar should NOT show "Create Product" or "My Favourites" links
 4. Visit /profile -> "Create New Product" button hidden
 5. Navigate to /create-product directly -> see "Email Verification Required" page
 6. Visit a product detail -> no favourite button, no edit/delete buttons, see inline hint
 7. Navigate to /favourites directly -> see "Email Verification Required" page
 8. Verify email -> all restrictions lifted, banner disappears, nav links appear