Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 User Authentication with Gmail Email Verification                                                                                                                                                                                                                                                                                                                         

 Context

 The app needs user auth (register, login) with Gmail email verification. The backend already has User model, auth controller, JWT middleware, and Gmail email service — all functional. The frontend has Login/Register pages and auth store — but they use mock data (no real API calls) and lack an email verification page. Product functionality will be handled
 separately later.

 Plan

 Phase 1: Backend — Auth Enhancements

 1. Add isVerified to login response — modify backend/src/controllers/authController.ts
 - Add isVerified: user.isVerified to the login response data object (line 68-73)

 2. Add GET /api/auth/me endpoint — modify auth controller + routes
 - New getMe handler in backend/src/controllers/authController.ts: finds user by req.user.userId, returns id/name/email/isVerified
 - Add route router.get('/me', protect, getMe) in backend/src/routes/authRoutes.ts
 - Purpose: restore user session on page refresh from persisted JWT

 Phase 2: Frontend — Services & Types

 3. Update types — modify frontend/src/types/index.ts
 - Add isVerified?: boolean to User and AuthResponse.data

 4. Create auth service — frontend/src/services/authService.ts
 - register(data) → POST /auth/register
 - login(data) → POST /auth/login
 - verifyEmail(token) → GET /auth/verify-email/:token
 - getMe() → GET /auth/me
 - Uses existing api axios instance from frontend/src/services/api.ts

 Phase 3: Frontend — Auth Store & Route Guards

 5. Update auth store — modify frontend/src/store/authStore.ts
 - Add isLoading state (true when token exists but user not yet fetched)
 - Add initializeAuth() action: calls authService.getMe() to restore session on app load
 - On failure: clear token + set isAuthenticated false

 6. Update ProtectedRoute — modify frontend/src/components/auth/ProtectedRoute.tsx
 - Add isLoading check — show spinner while initializeAuth runs, prevents flash redirect to /login

 Phase 4: Frontend — Pages

 7. Connect Login page to API — modify frontend/src/pages/Login.tsx
 - Replace mock login (lines 56-70) with authService.login() call
 - Add isSubmitting state, disable button + show "Logging in..." text
 - Pass isVerified to auth store on success
 - Show backend error messages (including 403 "verify email first")

 8. Connect Register page to API — modify frontend/src/pages/Register.tsx
 - Replace mock login with authService.register() call
 - Do NOT auto-login after register (email verification required first)
 - On success: show "Check your email" screen with link to /login

 9. Create VerifyEmail page — frontend/src/pages/VerifyEmail.tsx
 - Reads ?token= query param from URL (email links to {CLIENT_URL}/verify-email?token={token})
 - Calls authService.verifyEmail(token) on mount
 - Shows loading spinner → success (with "Go to Login" link) → or error state

 10. Update App.tsx — modify frontend/src/App.tsx
 - Add useEffect to call initializeAuth() on mount
 - Add /verify-email route → VerifyEmail page (public route)

 11. Update MSW handlers — modify frontend/src/mocks/handlers.ts
 - Add mock handlers for auth endpoints (register, login, verify-email, me) for frontend tests

 Phase 5: Backend Tests

 12. Backend integration tests — create backend/tests/auth.test.ts
 - Uses Jest + Supertest against the Express app with real MongoDB (test database)
 - Mock sendVerificationEmail to avoid sending real emails during tests
 - Test setup: connect to test DB, clear User collection before each test

 Test cases (valid data):
 - Register with valid name/email/password → 201, returns user data
 - Verify email with valid token → 200, user becomes verified
 - Login with verified user → 200, returns JWT + user data with isVerified=true
 - Get /me with valid JWT → 200, returns user profile

 Test cases (invalid data):
 - Register with missing fields → 400, validation errors
 - Register with existing email → 400, "User already exists"
 - Register with short password (< 6 chars) → 400
 - Register with invalid email format → 400
 - Login with wrong password → 401
 - Login with non-existent email → 401
 - Login with unverified email → 403, "verify email" message
 - Verify email with invalid/expired token → 400
 - Get /me without token → 401
 - Get /me with invalid token → 401

 Cleanup: afterAll — delete all test users from DB, close connection

 Phase 6: Frontend Unit Tests

 13. Auth store tests — create frontend/tests/unit/authStore.test.ts
 - Uses Vitest
 - Test login() sets user, token, isAuthenticated
 - Test logout() clears state and localStorage
 - Test initializeAuth() with valid token (mock API) restores user
 - Test initializeAuth() with invalid token clears state

 14. Auth service tests — create frontend/tests/unit/authService.test.ts
 - Uses Vitest + MSW
 - Test each service function calls correct endpoint with correct data
 - Test error handling

 Phase 7: Frontend Integration Tests

 15. Login page tests — create frontend/tests/integration/Login.test.tsx
 - Uses Vitest + Testing Library + MSW
 - Test renders login form
 - Test shows validation errors for empty fields
 - Test shows validation error for invalid email
 - Test successful login → calls store.login + navigates to /
 - Test failed login (401) → shows error message
 - Test unverified user login (403) → shows "verify email" message

 16. Register page tests — create frontend/tests/integration/Register.test.tsx
 - Test renders register form
 - Test shows validation errors (empty, short password, password mismatch)
 - Test successful registration → shows "check your email" screen
 - Test failed registration (409 duplicate email) → shows error

 17. VerifyEmail page tests — create frontend/tests/integration/VerifyEmail.test.tsx
 - Test shows loading state initially
 - Test successful verification → shows success + "Go to Login" link
 - Test failed verification → shows error message
 - Test missing token → shows error

 Phase 8: E2E Tests

 18. Auth E2E tests — create frontend/tests/e2e/auth.spec.ts
 - Uses Playwright against running frontend + backend
 - Update playwright.config.ts to also start backend server
 - Test full registration flow: fill form → submit → see "check email" message
 - Test login with invalid credentials → see error
 - Test login form validation (empty fields)
 - Test navigation: unauthenticated user redirected from /profile to /login

 Phase 9: Cleanup

 19. Delete test records from database
 - After all tests pass, run a cleanup script/command to remove any test users created during e2e tests from the real database
 - Backend tests use a test DB or cleanup in afterAll, so no manual cleanup needed there

 Files Summary
 ┌────────┬─────────────────────────────────────────────────┐
 │ Action │                      File                       │
 ├────────┼─────────────────────────────────────────────────┤
 │ MODIFY │ backend/src/controllers/authController.ts       │
 ├────────┼─────────────────────────────────────────────────┤
 │ MODIFY │ backend/src/routes/authRoutes.ts                │
 ├────────┼─────────────────────────────────────────────────┤
 │ CREATE │ backend/tests/auth.test.ts                      │
 ├────────┼─────────────────────────────────────────────────┤
 │ MODIFY │ frontend/src/types/index.ts                     │
 ├────────┼─────────────────────────────────────────────────┤
 │ CREATE │ frontend/src/services/authService.ts            │
 ├────────┼─────────────────────────────────────────────────┤
 │ MODIFY │ frontend/src/store/authStore.ts                 │
 ├────────┼─────────────────────────────────────────────────┤
 │ MODIFY │ frontend/src/components/auth/ProtectedRoute.tsx │
 ├────────┼─────────────────────────────────────────────────┤
 │ MODIFY │ frontend/src/pages/Login.tsx                    │
 ├────────┼─────────────────────────────────────────────────┤
 │ MODIFY │ frontend/src/pages/Register.tsx                 │
 ├────────┼─────────────────────────────────────────────────┤
 │ CREATE │ frontend/src/pages/VerifyEmail.tsx              │
 ├────────┼─────────────────────────────────────────────────┤
 │ MODIFY │ frontend/src/App.tsx                            │
 ├────────┼─────────────────────────────────────────────────┤
 │ MODIFY │ frontend/src/mocks/handlers.ts                  │
 ├────────┼─────────────────────────────────────────────────┤
 │ CREATE │ frontend/tests/unit/authStore.test.ts           │
 ├────────┼─────────────────────────────────────────────────┤
 │ CREATE │ frontend/tests/unit/authService.test.ts         │
 ├────────┼─────────────────────────────────────────────────┤
 │ CREATE │ frontend/tests/integration/Login.test.tsx       │
 ├────────┼─────────────────────────────────────────────────┤
 │ CREATE │ frontend/tests/integration/Register.test.tsx    │
 ├────────┼─────────────────────────────────────────────────┤
 │ CREATE │ frontend/tests/integration/VerifyEmail.test.tsx │
 ├────────┼─────────────────────────────────────────────────┤
 │ CREATE │ frontend/tests/e2e/auth.spec.ts                 │
 ├────────┼─────────────────────────────────────────────────┤
 │ MODIFY │ frontend/playwright.config.ts                   │
 └────────┴─────────────────────────────────────────────────┘
 Verification

 1. npm test -w backend — all backend integration tests pass (valid + invalid data)
 2. npm test -w frontend — all frontend unit + integration tests pass
 3. npx playwright test -w frontend — E2E tests pass
 4. npm run build -w backend && npm run build -w frontend — no TS errors
 5. Manual flow: Register → Gmail email received → click verify link → login → access protected routes
 6. Confirm test database is cleaned up (no test records remain)