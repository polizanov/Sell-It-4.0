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
| `VITE_API_URL`                 | Backend API URL (default: `http://localhost:5000/api`) |
| `VITE_CLOUDINARY_CLOUD_NAME`   | Cloudinary cloud name               |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset            |

### 3. Start the dev server

```bash
npm run dev -w frontend
```

The app starts on `http://localhost:5173`. API calls to `/api` are proxied to the backend at port 5000.

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

## File Structure

```
frontend/
├── public/
│   └── vite.svg                 # Favicon
├── src/
│   ├── components/
│   │   └── common/              # Reusable UI components
│   ├── hooks/                   # Custom React hooks
│   ├── mocks/
│   │   ├── browser.ts           # MSW browser worker (dev)
│   │   ├── handlers.ts          # MSW request handlers
│   │   └── server.ts            # MSW node server (tests)
│   ├── pages/
│   │   └── Home.tsx             # Home page
│   ├── services/
│   │   └── api.ts               # Axios instance with JWT interceptors
│   ├── store/
│   │   └── authStore.ts         # Zustand auth state management
│   ├── styles/
│   │   └── index.css            # Tailwind CSS directives
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces
│   ├── utils/                   # Utility functions
│   ├── App.tsx                  # Root component with routing
│   ├── main.tsx                 # Application entry point
│   └── vite-env.d.ts           # Vite environment type declarations
├── tests/
│   ├── e2e/
│   │   └── home.spec.ts        # Playwright E2E tests
│   ├── integration/            # Component integration tests
│   ├── unit/                   # Unit tests
│   └── setup.ts                # Vitest setup (MSW lifecycle)
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

E2E tests are in `tests/e2e/` and run against the dev server.

## Key Libraries

| Library        | Purpose                    |
| -------------- | -------------------------- |
| React Router   | Client-side routing        |
| Zustand        | Lightweight state management |
| Axios          | HTTP client with interceptors |
| Tailwind CSS   | Utility-first styling      |
| MSW            | API mocking for tests/dev  |
