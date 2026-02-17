# Sell-It-4.0 Frontend

React 19 SPA built with TypeScript, Vite, Tailwind CSS, Zustand, and React Router v7.

## Getting Started

### 1. Install dependencies (from project root)

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the `.env` file:

| Variable                       | Description                          |
| ------------------------------ | ------------------------------------ |
| `VITE_API_URL`                 | Backend API URL (default: `http://localhost:5005/api`) |
| `BACKEND_PORT`                 | Backend port for Vite proxy (default: `5005`) |
| `VITE_CLOUDINARY_CLOUD_NAME`   | Cloudinary cloud name               |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset            |

### 3. Start the dev server

```bash
npm run dev -w frontend
```

The app starts on `http://localhost:5173`. API calls to `/api` are proxied to the backend.

## Scripts

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start Vite dev server                 |
| `npm run build`      | Type-check and build for production   |
| `npm run preview`    | Preview production build locally      |
| `npm run test`       | Run Vitest unit/integration tests     |
| `npm run test:watch` | Run Vitest in watch mode              |
| `npm run test:e2e`   | Run Playwright end-to-end tests       |
| `npm run lint`       | Lint source files with ESLint         |

## Pages & Routes

| Route                 | Page             | Access           |
| --------------------- | ---------------- | ---------------- |
| `/`                   | Home             | Public           |
| `/login`              | Login            | Public           |
| `/register`           | Register         | Public           |
| `/verify-email`       | VerifyEmail      | Public           |
| `/products/:id`       | ProductDetail    | Public           |
| `/products/:id/edit`  | EditProduct      | Verified + Phone |
| `/profile/:username`  | UserProfile      | Public           |
| `/profile`            | MyProfile        | Protected        |
| `/create-product`     | CreateProduct    | Verified + Phone |
| `/favourites`         | MyFavourites     | Verified         |

**Access levels:**
- **Public** — no login required
- **Protected** (`ProtectedRoute`) — requires login
- **Verified** (`VerifiedRoute`) — requires login + email verification
- **Verified + Phone** (`VerifiedRoute requirePhone`) — requires login + email + phone verification

## File Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/                  # Route guards and auth modals
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── VerifiedRoute.tsx
│   │   │   ├── VerifyPromptModal.tsx
│   │   │   ├── ChangePasswordModal.tsx
│   │   │   ├── DeleteAccountModal.tsx
│   │   │   ├── PhoneVerificationModal.tsx
│   │   │   ├── ProfilePhotoModal.tsx
│   │   │   └── ProfileSettingsMenu.tsx
│   │   ├── common/                # Reusable UI components (barrel export via index.ts)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── EditImageManager.tsx
│   │   │   ├── PhoneInput.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── CreateProductFAB.tsx
│   │   │   ├── VerificationBanner.tsx
│   │   │   └── ...
│   │   ├── layout/                # App shell (barrel export via index.ts)
│   │   │   ├── Navigation.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── PageContainer.tsx
│   │   ├── product/               # Product create/edit forms and modals
│   │   │   ├── CreateProductForm.tsx
│   │   │   ├── CreateProductModal.tsx
│   │   │   ├── EditProductForm.tsx
│   │   │   └── EditProductModal.tsx
│   │   └── products/              # Product listings (barrel export via index.ts)
│   │       ├── ProductGrid.tsx
│   │       ├── ProductCard.tsx
│   │       ├── FilterSidebar.tsx
│   │       └── MobileFilterDrawer.tsx
│   ├── constants/
│   │   ├── categories.ts          # Product category definitions
│   │   └── conditions.ts          # Product condition definitions
│   ├── data/                      # Static data
│   ├── hooks/
│   │   └── useMouseGradient.ts    # Mouse-follow gradient effect hook
│   ├── mocks/
│   │   ├── browser.ts             # MSW browser worker (dev)
│   │   ├── handlers.ts            # MSW request handlers
│   │   └── server.ts              # MSW node server (tests)
│   ├── pages/
│   │   ├── Home.tsx               # Product listings with filtering
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── VerifyEmail.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── CreateProduct.tsx
│   │   ├── EditProduct.tsx
│   │   ├── MyProfile.tsx
│   │   ├── UserProfile.tsx
│   │   └── MyFavourites.tsx
│   ├── services/
│   │   ├── api.ts                 # Axios instance with JWT interceptors
│   │   ├── authService.ts         # Auth API calls
│   │   ├── productService.ts      # Product API calls
│   │   └── favouriteService.ts    # Favourite API calls
│   ├── store/
│   │   ├── authStore.ts           # Zustand auth state (JWT in localStorage)
│   │   └── favouritesStore.ts     # Zustand favourites state
│   ├── styles/
│   │   └── index.css              # Tailwind CSS directives
│   ├── types/
│   │   └── index.ts               # Shared TypeScript interfaces
│   ├── utils/                     # Utility functions
│   ├── App.tsx                    # Root component with routing
│   ├── main.tsx                   # Application entry point
│   └── vite-env.d.ts
├── tests/
│   ├── setup.ts                   # Vitest setup (MSW lifecycle)
│   ├── unit/                      # Unit tests
│   ├── integration/               # Component integration tests
│   └── e2e/                       # Playwright E2E tests (phased)
│       ├── global-setup.ts
│       ├── global-teardown.ts
│       ├── phase1-empty-state/    # Tests with no data
│       ├── phase2-setup/          # Tests that create data (auth, products)
│       └── phase3-with-data/      # Tests that rely on existing data
├── .env.example
├── index.html
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
└── vite.config.ts
```

## Testing

### Unit & Integration Tests (Vitest)

```bash
npm run test -w frontend          # Single run
npm run test:watch -w frontend    # Watch mode
```

Tests use MSW (Mock Service Worker) to mock API responses. Mock handlers are defined in `src/mocks/handlers.ts`.

### End-to-End Tests (Playwright)

```bash
npx playwright install chromium   # First time only
npm run test:e2e -w frontend
```

E2E tests are organized in three phases that run sequentially:
1. **phase1-empty-state** — tests with no data in the database
2. **phase2-setup** — tests that create users, products, etc.
3. **phase3-with-data** — tests that rely on data from phase 2

## Key Libraries

| Library              | Purpose                              |
| -------------------- | ------------------------------------ |
| React Router v7      | Client-side routing                  |
| Zustand              | Lightweight state management         |
| Axios                | HTTP client with interceptors        |
| Tailwind CSS         | Utility-first styling (dark theme)   |
| Swiper               | Touch-friendly carousels/sliders     |
| libphonenumber-js    | Phone number validation              |
| react-phone-number-input | International phone input component |
| MSW                  | API mocking for tests                |
