Plan: Phone Verification with Country Code Selector                                                                                                                              │
     │                                                                                                                                                                                  │
     │ Context                                                                                                                                                                          │
     │                                                                                                                                                                                  │
     │ Currently, Sell-It requires only email verification to unlock product creation. The user wants to add mandatory phone verification specifically for product creation. Users      │
     │ provide their phone number (with a country code selector) during registration, receive a 6-digit OTP via Twilio SMS, and must verify it via a popup modal. Both email AND phone  │
     │ must be verified to create/edit/delete products. Other features (favourites, login) remain unchanged — they only require email verification. Phone numbers are unique per user   │
     │ (one number, one user).                                                                                                                                                          │
     │                                                                                                                                                                                  │
     │ Scope of phone verification gate:                                                                                                                                                │
     │ - Product create/edit/delete: requires BOTH email + phone verified                                                                                                               │
     │ - Browse products, view product details, like/favourite products: phone NOT required (email-only)                                                                                │
     │ - Favourites page, navbar links, login: email-only (unchanged)                                                                                                                   │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Delegation Table                                                                                                                                                                 │
     │                                                                                                                                                                                  │
     │ ┌─────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────────────┬────────────┐ │
     │ │  #  │                                                               Sub-problem                                                               │      Agent      │ Depends On │ │
     │ ├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────┤ │
     │ │ 1   │ Backend: model, config, SMS service, controller, routes, middleware                                                                     │ backend-expert  │ —          │ │
     │ ├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────┤ │
     │ │ 2   │ Backend: tests (auth, phone-verification, requireVerified, product, favourites)                                                         │ qa-expert       │ #1         │ │
     │ ├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────┤ │
     │ │ 3   │ Frontend: types, services, store, PhoneInput, PhoneVerificationModal, VerifyPromptModal                                                 │ frontend-expert │ #1         │ │
     │ ├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────┤ │
     │ │ 4   │ Frontend: Register, Login, VerifyEmail, VerificationBanner, VerifiedRoute, VerificationRequired, FAB, MyProfile, ProductDetail, App.tsx │ frontend-expert │ #3         │ │
     │ ├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────┤ │
     │ │ 5   │ Frontend: MSW handlers update                                                                                                           │ frontend-expert │ #3         │ │
     │ ├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────┤ │
     │ │ 6   │ Frontend: unit + integration tests                                                                                                      │ qa-expert       │ #4, #5     │ │
     │ ├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────────────┼────────────┤ │
     │ │ 7   │ E2E tests                                                                                                                               │ qa-expert       │ #4, #5     │ │
     │ └─────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴─────────────────┴────────────┘ │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Step 1 — Backend: Model, Config, SMS Service                                                                                                                                     │
     │                                                                                                                                                                                  │
     │ 1a. Install dependencies                                                                                                                                                         │
     │                                                                                                                                                                                  │
     │ npm install twilio libphonenumber-js -w backend                                                                                                                                  │
     │                                                                                                                                                                                  │
     │                                                                                                                                                                                  │
     │ 1b. Environment config                                                                                                                                                           │
     │                                                                                                                                                                                  │
     │ File: backend/src/config/environment.ts                                                                                                                                          │
     │ - Add optional Twilio env vars to the Zod schema: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (all z.string().optional())                                         │
     │                                                                                                                                                                                  │
     │ File: backend/.env.example                                                                                                                                                       │
     │ - Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER                                                                                                                 │
     │                                                                                                                                                                                  │
     │ 1c. User model                                                                                                                                                                   │
     │                                                                                                                                                                                  │
     │ File: backend/src/models/User.ts                                                                                                                                                 │
     │                                                                                                                                                                                  │
     │ Add to IUser interface and Mongoose schema:                                                                                                                                      │
     │ - phone: string — E.164 format (e.g. +359888123456), required, unique                                                                                                            │
     │ - isPhoneVerified: boolean — defaults to false                                                                                                                                   │
     │ - phoneVerificationCode?: string — SHA-256 hashed 6-digit OTP                                                                                                                    │
     │ - phoneVerificationExpiry?: Date — 10-minute expiry                                                                                                                              │
     │                                                                                                                                                                                  │
     │ 1d. SMS service                                                                                                                                                                  │
     │                                                                                                                                                                                  │
     │ New file: backend/src/services/smsService.ts                                                                                                                                     │
     │                                                                                                                                                                                  │
     │ - generateOTP(): returns cryptographically random 6-digit string                                                                                                                 │
     │ - sendVerificationSMS(to, code):                                                                                                                                                 │
     │   - test mode: no-op (return immediately)                                                                                                                                        │
     │   - dev mode: console.log the OTP                                                                                                                                                │
     │   - production: send via Twilio SDK                                                                                                                                              │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Step 2 — Backend: Controller, Routes, Middleware                                                                                                                                 │
     │                                                                                                                                                                                  │
     │ 2a. Auth controller                                                                                                                                                              │
     │                                                                                                                                                                                  │
     │ File: backend/src/controllers/authController.ts                                                                                                                                  │
     │                                                                                                                                                                                  │
     │ Modify register:                                                                                                                                                                 │
     │ - Accept phone from req.body                                                                                                                                                     │
     │ - Check duplicate phone: User.findOne({ phone }) → 400 if exists                                                                                                                 │
     │ - In test mode: set isPhoneVerified: true (alongside existing isVerified: true)                                                                                                  │
     │ - In non-test mode: generate OTP, hash with SHA-256, store phoneVerificationCode + phoneVerificationExpiry (10min), call sendVerificationSMS()                                   │
     │ - Include phone and isPhoneVerified in response                                                                                                                                  │
     │                                                                                                                                                                                  │
     │ Modify login:                                                                                                                                                                    │
     │ - Add isPhoneVerified: user.isPhoneVerified and phone: user.phone to response data                                                                                               │
     │                                                                                                                                                                                  │
     │ Modify getMe:                                                                                                                                                                    │
     │ - Add isPhoneVerified: user.isPhoneVerified and phone: user.phone to response data                                                                                               │
     │                                                                                                                                                                                  │
     │ Add sendPhoneVerification (new):                                                                                                                                                 │
     │ - Protected (requires JWT)                                                                                                                                                       │
     │ - Check user not already phone-verified                                                                                                                                          │
     │ - Generate OTP, hash, store, call sendVerificationSMS()                                                                                                                          │
     │ - Responds { success: true, message: 'Verification code sent' }                                                                                                                  │
     │                                                                                                                                                                                  │
     │ Add verifyPhone (new):                                                                                                                                                           │
     │ - Protected (requires JWT)                                                                                                                                                       │
     │ - Accept { code } from body                                                                                                                                                      │
     │ - Hash input code, compare with stored phoneVerificationCode                                                                                                                     │
     │ - Check not expired                                                                                                                                                              │
     │ - Set isPhoneVerified: true, clear code/expiry fields                                                                                                                            │
     │ - Responds { success: true, message: 'Phone verified successfully' }                                                                                                             │
     │                                                                                                                                                                                  │
     │ 2b. Auth routes                                                                                                                                                                  │
     │                                                                                                                                                                                  │
     │ File: backend/src/routes/authRoutes.ts                                                                                                                                           │
     │                                                                                                                                                                                  │
     │ Modify registerSchema:                                                                                                                                                           │
     │ - Add phone: z.string().refine(val => isValidPhoneNumber(val), { message: 'Invalid phone number' }) (using libphonenumber-js)                                                    │
     │                                                                                                                                                                                  │
     │ Add verifyPhoneSchema:                                                                                                                                                           │
     │ - code: z.string().length(6).regex(/^\d{6}$/)                                                                                                                                    │
     │                                                                                                                                                                                  │
     │ Add routes:                                                                                                                                                                      │
     │ - POST /auth/send-phone-verification — rate limited (5/15min), protect, sendPhoneVerification                                                                                    │
     │ - POST /auth/verify-phone — protect, validate(verifyPhoneSchema), verifyPhone                                                                                                    │
     │                                                                                                                                                                                  │
     │ Update test-set-verified endpoint:                                                                                                                                               │
     │ - Accept optional isPhoneVerified in body alongside existing isVerified                                                                                                          │
     │                                                                                                                                                                                  │
     │ 2c. Auth middleware                                                                                                                                                              │
     │                                                                                                                                                                                  │
     │ File: backend/src/middleware/authMiddleware.ts                                                                                                                                   │
     │                                                                                                                                                                                  │
     │ Keep requireVerified unchanged (email-only — used for favourites).                                                                                                               │
     │                                                                                                                                                                                  │
     │ Add new requirePhoneVerified middleware:                                                                                                                                         │
     │ export const requirePhoneVerified = asyncHandler(                                                                                                                                │
     │   async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {                                                                                               │
     │     const user = await User.findById(req.user!.userId);                                                                                                                          │
     │     if (!user) throw new AppError('User not found', 401);                                                                                                                        │
     │     if (!user.isPhoneVerified) {                                                                                                                                                 │
     │       throw new AppError('Please verify your phone number to perform this action', 403);                                                                                         │
     │     }                                                                                                                                                                            │
     │     next();                                                                                                                                                                      │
     │   }                                                                                                                                                                              │
     │ );                                                                                                                                                                               │
     │                                                                                                                                                                                  │
     │ 2d. Product routes                                                                                                                                                               │
     │                                                                                                                                                                                  │
     │ File: backend/src/routes/productRoutes.ts                                                                                                                                        │
     │                                                                                                                                                                                  │
     │ Add requirePhoneVerified to product create/update/delete (AFTER requireVerified):                                                                                                │
     │ - POST /products → protect, requireVerified, requirePhoneVerified, upload, validate, createProduct                                                                               │
     │ - PUT /products/:id → protect, requireVerified, requirePhoneVerified, upload, validate, updateProduct                                                                            │
     │ - DELETE /products/:id → protect, requireVerified, requirePhoneVerified, deleteProduct                                                                                           │
     │                                                                                                                                                                                  │
     │ Favourite routes stay unchanged (email-only).                                                                                                                                    │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Step 3 — Frontend: Types, Services, Store                                                                                                                                        │
     │                                                                                                                                                                                  │
     │ 3a. Install dependencies                                                                                                                                                         │
     │                                                                                                                                                                                  │
     │ npm install libphonenumber-js react-phone-number-input -w frontend                                                                                                               │
     │                                                                                                                                                                                  │
     │                                                                                                                                                                                  │
     │ 3b. Types                                                                                                                                                                        │
     │                                                                                                                                                                                  │
     │ File: frontend/src/types/index.ts                                                                                                                                                │
     │                                                                                                                                                                                  │
     │ Update User:                                                                                                                                                                     │
     │ export interface User {                                                                                                                                                          │
     │   id: string;                                                                                                                                                                    │
     │   name: string;                                                                                                                                                                  │
     │   username: string;                                                                                                                                                              │
     │   email: string;                                                                                                                                                                 │
     │   phone?: string;                                                                                                                                                                │
     │   isVerified?: boolean;                                                                                                                                                          │
     │   isPhoneVerified?: boolean;                                                                                                                                                     │
     │ }                                                                                                                                                                                │
     │                                                                                                                                                                                  │
     │ Update AuthResponse.data: add phone?: string and isPhoneVerified?: boolean                                                                                                       │
     │                                                                                                                                                                                  │
     │ 3c. Auth service                                                                                                                                                                 │
     │                                                                                                                                                                                  │
     │ File: frontend/src/services/authService.ts                                                                                                                                       │
     │                                                                                                                                                                                  │
     │ - Add phone: string to RegisterData                                                                                                                                              │
     │ - Add sendPhoneVerification: () => api.post('/auth/send-phone-verification')                                                                                                     │
     │ - Add verifyPhone: (code: string) => api.post('/auth/verify-phone', { code })                                                                                                    │
     │                                                                                                                                                                                  │
     │ 3d. Auth store                                                                                                                                                                   │
     │                                                                                                                                                                                  │
     │ File: frontend/src/store/authStore.ts                                                                                                                                            │
     │                                                                                                                                                                                  │
     │ - Update initializeAuth to include phone and isPhoneVerified when setting user from /me response                                                                                 │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Step 4 — Frontend: New Components                                                                                                                                                │
     │                                                                                                                                                                                  │
     │ 4a. PhoneInput component                                                                                                                                                         │
     │                                                                                                                                                                                  │
     │ New file: frontend/src/components/common/PhoneInput.tsx                                                                                                                          │
     │                                                                                                                                                                                  │
     │ Wrapper around react-phone-number-input that matches existing Input component styling:                                                                                           │
     │ - Props: label, value, onChange, error, variant ('light' | 'dark')                                                                                                               │
     │ - Uses 'light' variant by default (matching Register page)                                                                                                                       │
     │ - Default country: "BG"                                                                                                                                                          │
     │ - CSS overrides to match Input styling: bg-white border border-gray-300 rounded-lg text-gray-900                                                                                 │
     │ - Import react-phone-number-input/style.css                                                                                                                                      │
     │                                                                                                                                                                                  │
     │ 4b. PhoneVerificationModal                                                                                                                                                       │
     │                                                                                                                                                                                  │
     │ New file: frontend/src/components/auth/PhoneVerificationModal.tsx                                                                                                                │
     │                                                                                                                                                                                  │
     │ OTP verification modal — follows ConfirmDialog modal pattern (backdrop + centered card + escape key):                                                                            │
     │ - Props: isOpen, onClose, onVerified?                                                                                                                                            │
     │ - Shows user's phone (partially masked)                                                                                                                                          │
     │ - Single 6-digit text input (maxLength 6, numeric only)                                                                                                                          │
     │ - "Verify" button → calls authService.verifyPhone(code) → on success updates auth store setUser({...user, isPhoneVerified: true}) + calls onVerified                             │
     │ - "Resend Code" link → calls authService.sendPhoneVerification()                                                                                                                 │
     │ - Loading/error states                                                                                                                                                           │
     │ - Closes on backdrop click / Escape / X button                                                                                                                                   │
     │                                                                                                                                                                                  │
     │ 4c. VerifyPromptModal                                                                                                                                                            │
     │                                                                                                                                                                                  │
     │ New file: frontend/src/components/auth/VerifyPromptModal.tsx                                                                                                                     │
     │                                                                                                                                                                                  │
     │ Simple info modal shown when unverified user clicks FAB — follows ConfirmDialog pattern:                                                                                         │
     │ - Props: isOpen, onClose, needsEmail, needsPhone, onVerifyPhone                                                                                                                  │
     │ - Phone unverified: "Verify your phone number to add a product" + "Verify Now" button (triggers onVerifyPhone)                                                                   │
     │ - Email unverified: "Verify your email to add a product" + "Check your inbox" text                                                                                               │
     │ - Both: combined message                                                                                                                                                         │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Step 5 — Frontend: Page & Component Updates                                                                                                                                      │
     │                                                                                                                                                                                  │
     │ 5a. Register page                                                                                                                                                                │
     │                                                                                                                                                                                  │
     │ File: frontend/src/pages/Register.tsx                                                                                                                                            │
     │                                                                                                                                                                                  │
     │ - Add phone: '' to formData and errors state                                                                                                                                     │
     │ - Add phone validation in handleSubmit: required + isValidPhoneNumber() from libphonenumber-js                                                                                   │
     │ - Add PhoneInput field between Email and Password fields                                                                                                                         │
     │ - Include phone in authService.register() call                                                                                                                                   │
     │ - Update success screen: "Check Your Email" stays, add note: "You'll also need to verify your phone number after logging in."                                                    │
     │                                                                                                                                                                                  │
     │ 5b. Login page                                                                                                                                                                   │
     │                                                                                                                                                                                  │
     │ File: frontend/src/pages/Login.tsx                                                                                                                                               │
     │                                                                                                                                                                                  │
     │ - Include phone and isPhoneVerified when calling login() with user data from response                                                                                            │
     │                                                                                                                                                                                  │
     │ 5c. VerifyEmail page                                                                                                                                                             │
     │                                                                                                                                                                                  │
     │ File: frontend/src/pages/VerifyEmail.tsx                                                                                                                                         │
     │                                                                                                                                                                                  │
     │ - On success: if user still needs phone verification, show additional note: "You also need to verify your phone number to access all features."                                  │
     │                                                                                                                                                                                  │
     │ 5d. VerificationBanner                                                                                                                                                           │
     │                                                                                                                                                                                  │
     │ File: frontend/src/components/common/VerificationBanner.tsx                                                                                                                      │
     │                                                                                                                                                                                  │
     │ - Show when isVerified === false OR isPhoneVerified === false                                                                                                                    │
     │ - Dynamic message depending on which is unverified (email, phone, or both)                                                                                                       │
     │ - Add "Verify Phone" button that opens PhoneVerificationModal (only when phone is the issue)                                                                                     │
     │                                                                                                                                                                                  │
     │ 5e. VerifiedRoute                                                                                                                                                                │
     │                                                                                                                                                                                  │
     │ File: frontend/src/components/auth/VerifiedRoute.tsx                                                                                                                             │
     │                                                                                                                                                                                  │
     │ - Add optional requirePhone?: boolean prop (defaults to false)                                                                                                                   │
     │ - When requirePhone is true AND isPhoneVerified === false, render VerificationRequired with phone-specific message                                                               │
     │ - This keeps the existing email-only behavior for favourites route                                                                                                               │
     │                                                                                                                                                                                  │
     │ File: frontend/src/App.tsx                                                                                                                                                       │
     │ - Add requirePhone to product routes only:                                                                                                                                       │
     │ <Route path="/create-product" element={<VerifiedRoute requirePhone><CreateProduct /></VerifiedRoute>} />                                                                         │
     │ <Route path="/products/:id/edit" element={<VerifiedRoute requirePhone><EditProduct /></VerifiedRoute>} />                                                                        │
     │ - Favourites stays as-is: <VerifiedRoute><MyFavourites /></VerifiedRoute>                                                                                                        │
     │                                                                                                                                                                                  │
     │ 5f. VerificationRequired                                                                                                                                                         │
     │                                                                                                                                                                                  │
     │ File: frontend/src/components/common/VerificationRequired.tsx                                                                                                                    │
     │                                                                                                                                                                                  │
     │ - Add optional type prop ('email' | 'phone'), defaulting to 'email'                                                                                                              │
     │ - Phone variant: phone icon, "Phone Verification Required" heading, "Verify Now" button that opens PhoneVerificationModal                                                        │
     │                                                                                                                                                                                  │
     │ 5g. CreateProductFAB                                                                                                                                                             │
     │                                                                                                                                                                                  │
     │ File: frontend/src/components/common/CreateProductFAB.tsx                                                                                                                        │
     │                                                                                                                                                                                  │
     │ Behavior change — show FAB for ALL authenticated users:                                                                                                                          │
     │ - Remove the if (!isAuthenticated || user?.isVerified === false) return null guard                                                                                               │
     │ - Replace with if (!isAuthenticated) return null                                                                                                                                 │
     │ - On click: if fully verified (both email + phone) → open CreateProductModal (existing)                                                                                          │
     │ - On click: if NOT fully verified → open VerifyPromptModal                                                                                                                       │
     │ - Wire up VerifyPromptModal.onVerifyPhone → open PhoneVerificationModal                                                                                                          │
     │                                                                                                                                                                                  │
     │ 5h. Navbar + MobileMenu — NO CHANGES                                                                                                                                             │
     │                                                                                                                                                                                  │
     │ Favourites links stay email-verification-only (unchanged). Phone verification only gates product creation.                                                                       │
     │                                                                                                                                                                                  │
     │ 5i. MyProfile page                                                                                                                                                               │
     │                                                                                                                                                                                  │
     │ File: frontend/src/pages/MyProfile.tsx                                                                                                                                           │
     │                                                                                                                                                                                  │
     │ - Update the empty state message for users who have email verified but phone not verified: "Verify your phone to start listing products."                                        │
     │                                                                                                                                                                                  │
     │ 5j. ProductDetail page                                                                                                                                                           │
     │                                                                                                                                                                                  │
     │ File: frontend/src/pages/ProductDetail.tsx                                                                                                                                       │
     │                                                                                                                                                                                  │
     │ - Favourite button: stays email-only (unchanged)                                                                                                                                 │
     │ - Owner edit/delete actions: check both email + phone. Update showOwnerActions to require isPhoneVerified                                                                        │
     │ - Update warning text for owners who need phone verification                                                                                                                     │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Step 6 — Frontend: MSW Handlers                                                                                                                                                  │
     │                                                                                                                                                                                  │
     │ File: frontend/src/mocks/handlers.ts                                                                                                                                             │
     │                                                                                                                                                                                  │
     │ - Add phone, isPhoneVerified, phoneVerificationCode to in-memory user type                                                                                                       │
     │ - Register handler: accept phone, check uniqueness, store with isPhoneVerified: false, return in response                                                                        │
     │ - Login handler: add isPhoneVerified and phone to response                                                                                                                       │
     │ - Me handler: add isPhoneVerified and phone to response                                                                                                                          │
     │ - New handler POST /auth/send-phone-verification: validate auth, return success                                                                                                  │
     │ - New handler POST /auth/verify-phone: validate auth, check code === '123456' (hardcoded for tests), set isPhoneVerified: true, return success                                   │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Step 7 — Backend Tests                                                                                                                                                           │
     │                                                                                                                                                                                  │
     │ 7a. Mock smsService in all test files                                                                                                                                            │
     │                                                                                                                                                                                  │
     │ Add to every backend test file that imports auth (same pattern as emailService mock):                                                                                            │
     │ jest.mock('../src/services/smsService', () => ({                                                                                                                                 │
     │   sendVerificationSMS: jest.fn().mockResolvedValue(undefined),                                                                                                                   │
     │   generateOTP: jest.fn().mockReturnValue('123456'),                                                                                                                              │
     │ }));                                                                                                                                                                             │
     │                                                                                                                                                                                  │
     │ 7b. Update existing tests                                                                                                                                                        │
     │                                                                                                                                                                                  │
     │ All backend test files (auth.test.ts, auth-edge-cases.test.ts, requireVerified.test.ts, product.test.ts, favourite.test.ts):                                                     │
     │ - Add phone (unique per test) to all register request bodies                                                                                                                     │
     │ - Update assertions for new response fields                                                                                                                                      │
     │                                                                                                                                                                                  │
     │ 7c. New auth tests in auth.test.ts                                                                                                                                               │
     │                                                                                                                                                                                  │
     │ - Register with valid phone succeeds + returns isPhoneVerified: true (test mode)                                                                                                 │
     │ - Register with invalid phone format returns 400                                                                                                                                 │
     │ - Register with duplicate phone returns 400                                                                                                                                      │
     │ - Login returns isPhoneVerified field                                                                                                                                            │
     │ - /me returns phone and isPhoneVerified                                                                                                                                          │
     │                                                                                                                                                                                  │
     │ 7d. New test file: backend/tests/phone-verification.test.ts                                                                                                                      │
     │                                                                                                                                                                                  │
     │ - POST /auth/send-phone-verification: sends OTP (mock called), 401 without token, 400 if already verified                                                                        │
     │ - POST /auth/verify-phone: valid code verifies, invalid code returns 400, expired code returns 400, 400 if already verified, 400 for non-6-digit code                            │
     │                                                                                                                                                                                  │
     │ 7e. Update requireVerified tests                                                                                                                                                 │
     │                                                                                                                                                                                  │
     │ File: backend/tests/requireVerified.test.ts                                                                                                                                      │
     │ - Add scenario: email-verified + phone-NOT-verified → 403 on product creation (via requirePhoneVerified)                                                                         │
     │ - Add scenario: email-verified + phone-NOT-verified → 200 on favourites (phone not required)                                                                                     │
     │ - Add scenario: both verified → 200 on product creation                                                                                                                          │
     │ - Use test-set-verified with both isVerified and isPhoneVerified params                                                                                                          │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Step 8 — Frontend Tests                                                                                                                                                          │
     │                                                                                                                                                                                  │
     │ 8a. Unit tests to update                                                                                                                                                         │
     │                                                                                                                                                                                  │
     │ ┌──────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
     │ ─────┐                                                                                                                                                                           │
     │ │                   File                   │                                                                 Changes                                                             │
     │      │                                                                                                                                                                           │
     │ ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
     │ ─────┤                                                                                                                                                                           │
     │ │ tests/unit/authStore.test.ts             │ Add isPhoneVerified + phone to mock users; test initializeAuth sets them                                                            │
     │      │                                                                                                                                                                           │
     │ ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
     │ ─────┤                                                                                                                                                                           │
     │ │ tests/unit/authService.test.ts           │ Add tests for sendPhoneVerification(), verifyPhone(); update register test to include phone                                         │
     │      │                                                                                                                                                                           │
     │ ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
     │ ─────┤                                                                                                                                                                           │
     │ │ tests/unit/VerificationBanner.test.tsx   │ Test shows for phone-unverified; test combined message; update mocks                                                                │
     │      │                                                                                                                                                                           │
     │ ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
     │ ─────┤                                                                                                                                                                           │
     │ │ tests/unit/VerifiedRoute.test.tsx        │ Test requirePhone prop: blocks when isPhoneVerified: false; passes when both true; passes without requirePhone when only email      │
     │ verified │                                                                                                                                                                       │
     │ ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
     │ ─────┤                                                                                                                                                                           │
     │ │ tests/unit/VerificationRequired.test.tsx │ Test phone variant with phone icon + heading                                                                                        │
     │      │                                                                                                                                                                           │
     │ ├──────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
     │ ─────┤                                                                                                                                                                           │
     │ │ tests/unit/CreateProductFAB.test.tsx     │ Replace "hides for unverified" with "shows for all authenticated"; test popup on click when unverified; test modal opens when       │
     │ verified  │                                                                                                                                                                      │
     │ └──────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
     │ ─────┘                                                                                                                                                                           │
     │                                                                                                                                                                                  │
     │ 8b. New unit tests                                                                                                                                                               │
     │                                                                                                                                                                                  │
     │ ┌──────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────┐                                             │
     │ │                       File                       │                                     Tests                                     │                                             │
     │ ├──────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤                                             │
     │ │ tests/unit/PhoneInput.test.tsx (new)             │ Renders label; shows error; calls onChange                                    │                                             │
     │ ├──────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┤                                             │
     │ │ tests/unit/PhoneVerificationModal.test.tsx (new) │ Open/close; submit valid code; error on invalid; resend button; loading state │                                             │
     │ └──────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────┘                                             │
     │                                                                                                                                                                                  │
     │ 8c. Integration tests to update                                                                                                                                                  │
     │                                                                                                                                                                                  │
     │ ┌────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────┐                                         │
     │ │                  File                  │                                           Changes                                           │                                         │
     │ ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤                                         │
     │ │ tests/integration/Register.test.tsx    │ Expect phone field; test phone validation errors; include phone in successful registrations │                                         │
     │ ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤                                         │
     │ │ tests/integration/Login.test.tsx       │ Update mock users with isPhoneVerified                                                      │                                         │
     │ ├────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────┤                                         │
     │ │ tests/integration/VerifyEmail.test.tsx │ Check for phone verification note on success                                                │                                         │
     │ └────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────┘                                         │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Step 9 — E2E Tests                                                                                                                                                               │
     │                                                                                                                                                                                  │
     │ 9a. Auth spec                                                                                                                                                                    │
     │                                                                                                                                                                                  │
     │ File: frontend/tests/e2e/phase2-setup/auth.spec.ts                                                                                                                               │
     │ - Registration tests: fill phone field, test validation errors for empty/invalid phone                                                                                           │
     │                                                                                                                                                                                  │
     │ 9b. Unverified user spec                                                                                                                                                         │
     │                                                                                                                                                                                  │
     │ File: frontend/tests/e2e/phase2-setup/unverifiedUser.spec.ts                                                                                                                     │
     │ - Update test-set-verified calls to include isPhoneVerified: false                                                                                                               │
     │ - Add scenario: email verified, phone not verified — FAB shows popup "Verify your phone number"                                                                                  │
     │ - Add scenario: verification banner shows phone message                                                                                                                          │
     │ - Add scenario: /create-product shows phone verification required                                                                                                                │
     │                                                                                                                                                                                  │
     │ 9c. Create product spec + all phase3 specs                                                                                                                                       │
     │                                                                                                                                                                                  │
     │ Files: All E2E specs that register users                                                                                                                                         │
     │ - Include phone in registrations                                                                                                                                                 │
     │ - Update test-set-verified calls to set both isVerified: true and isPhoneVerified: true                                                                                          │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Critical Files Summary                                                                                                                                                           │
     │                                                                                                                                                                                  │
     │ ┌─────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────┐                                  │
     │ │                          File                           │                                      Action                                       │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ backend/src/models/User.ts                              │ Modify — add phone, isPhoneVerified, OTP fields                                   │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ backend/src/config/environment.ts                       │ Modify — add Twilio env vars                                                      │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ backend/src/services/smsService.ts                      │ Create — Twilio SMS + OTP generation                                              │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ backend/src/controllers/authController.ts               │ Modify — register/login/me + new sendPhoneVerification/verifyPhone                │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ backend/src/routes/authRoutes.ts                        │ Modify — register schema + new routes + test-set-verified                         │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ backend/src/middleware/authMiddleware.ts                │ Modify — add new requirePhoneVerified middleware (keep requireVerified unchanged) │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ backend/src/routes/productRoutes.ts                     │ Modify — add requirePhoneVerified to create/update/delete                         │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/types/index.ts                             │ Modify — User + AuthResponse types                                                │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/services/authService.ts                    │ Modify — RegisterData + new methods                                               │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/store/authStore.ts                         │ Modify — include phone fields                                                     │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/components/common/PhoneInput.tsx           │ Create — country code selector wrapper                                            │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/components/auth/PhoneVerificationModal.tsx │ Create — OTP modal                                                                │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/components/auth/VerifyPromptModal.tsx      │ Create — "verify to add product" popup                                            │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/pages/Register.tsx                         │ Modify — add phone field                                                          │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/pages/Login.tsx                            │ Modify — include phone fields in login                                            │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/pages/VerifyEmail.tsx                      │ Modify — note about phone verification                                            │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/components/common/VerificationBanner.tsx   │ Modify — support phone state                                                      │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/components/auth/VerifiedRoute.tsx          │ Modify — check isPhoneVerified                                                    │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/components/common/VerificationRequired.tsx │ Modify — phone variant                                                            │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/components/common/CreateProductFAB.tsx     │ Modify — show for all auth users, popup when unverified                           │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/App.tsx                                    │ Modify — add requirePhone prop to create/edit product routes                      │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/pages/MyProfile.tsx                        │ Modify — update unverified message                                                │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/pages/ProductDetail.tsx                    │ Modify — check both verifications                                                 │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ frontend/src/mocks/handlers.ts                          │ Modify — phone fields + new handlers                                              │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ backend/tests/phone-verification.test.ts                │ Create — phone OTP tests                                                          │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ All existing backend test files                         │ Modify — add phone to register calls, mock smsService                             │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ Multiple frontend test files                            │ Modify — update mocks, add phone tests                                            │                                  │
     │ ├─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤                                  │
     │ │ Multiple E2E test files                                 │ Modify — phone in registrations, new verification scenarios                       │                                  │
     │ └─────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────┘                                  │
     │                                                                                                                                                                                  │
     │ ---                                                                                                                                                                              │
     │ Verification                                                                                                                                                                     │
     │                                                                                                                                                                                  │
     │ # Backend                                                                                                                                                                        │
     │ npm run build -w backend                                                                                                                                                         │
     │ npm run test -w backend                                                                                                                                                          │
     │                                                                                                                                                                                  │
     │ # Frontend                                                                                                                                                                       │
     │ npm run build -w frontend                                                                                                                                                        │
     │ npm run test -w frontend                                                                                                                                                         │
     │                                                                                                                                                                                  │
     │ # E2E (starts both servers)                                                                                                                                                      │
     │ npm run test:e2e -w frontend                                                                                                                                