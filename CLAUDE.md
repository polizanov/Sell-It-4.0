# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sell-It 4.0 is a marketplace web application for buying and selling products. It uses an npm workspaces monorepo with two packages: `backend/` and `frontend/`.

## Commands

All commands are run from the project root using the `-w` workspace flag.

### Development
```bash
npm run dev                    # Start both backend and frontend concurrently
npm run dev -w backend         # Backend only (nodemon, port from PORT env var, default 5000)
npm run dev -w frontend        # Frontend only (Vite, port 5173)
```

### Build
```bash
npm run build -w backend       # TypeScript -> dist/
npm run build -w frontend      # TypeScript check + Vite build -> dist/
```

### Test
```bash
npm run test -w backend                              # Jest tests (requires MongoDB)
npm run test -w frontend                             # Vitest tests
npm run test:e2e -w frontend                         # Playwright E2E (auto-starts both servers)
npx jest tests/auth.test.ts -w backend               # Single backend test file
npx vitest run tests/unit/authStore.test.ts -w frontend  # Single frontend test file
```

### Lint
```bash
npm run lint -w backend        # ESLint backend
npm run lint -w frontend       # ESLint frontend
```

## Architecture

### Backend (`backend/`)

Express.js REST API with TypeScript and MongoDB (Mongoose).

**Request flow:** Routes → Middleware (validate, auth) → Controllers → Services → Models

- **Config** (`src/config/`): Environment validation via Zod (`environment.ts`), MongoDB connection (`database.ts`), Cloudinary SDK (`cloudinary.ts`)
- **Middleware** (`src/middleware/`): JWT auth via `protect` middleware (`authMiddleware.ts`), Zod request body validation (`validate.ts`), global error handler with `AppError` class (`errorHandler.ts`), Multer+Cloudinary file upload (`upload.ts`)
- **Routes** (`src/routes/`): Aggregated in `index.ts`, mounted at `/api`. Zod validation schemas are defined inline in route files (e.g., `authRoutes.ts`), not in a separate directory.
- **Types** (`src/types/`): `AuthRequest` extends Express `Request` with `user?: JwtPayload`; `ApiResponse<T>` is the standard response envelope
- **Tests** (`tests/`): Jest + Supertest. Tests live in `backend/tests/` (not `src/`). Setup in `tests/setup.ts` handles MongoDB connection cleanup.

Env vars are validated at startup with Zod in `config/environment.ts` — the app exits if validation fails. Refer to `backend/.env.example` for required variables.

### Frontend (`frontend/`)

React 19 SPA with TypeScript, Vite, Tailwind CSS, Zustand, and React Router v7.

- **State management**: Zustand store (`src/store/authStore.ts`) — handles auth state, persists JWT token in localStorage
- **API client**: Axios instance (`src/services/api.ts`) with request interceptor (attaches Bearer token) and response interceptor (auto-logout on 401)
- **Routing**: BrowserRouter in `App.tsx`. Protected routes use `ProtectedRoute` wrapper component.
- **Styling**: Tailwind CSS with custom dark theme. Color tokens defined in `tailwind.config.js`: `dark-*` (backgrounds/surfaces), `orange-*` (primary CTA), `text-*` (typography)
- **Testing**: Tests live in `frontend/tests/` — `unit/`, `integration/`, and `e2e/` subdirectories. Vitest + Testing Library for unit/integration; Playwright for E2E. All Vitest tests use MSW (Mock Service Worker) — handlers in `src/mocks/handlers.ts`, setup in `tests/setup.ts` starts/resets/closes the MSW server.
- **Path alias**: `@` maps to `./src` (configured in `vite.config.ts`)
- **Dev proxy**: Vite proxies `/api` requests to the backend (port read from `BACKEND_PORT` env var, default 5000)

### Shared Patterns

- Both workspaces define types in `src/types/index.ts`
- Backend API responses follow `{ success: boolean, message: string, data?: T }` envelope
- Backend uses `express-async-handler` for async route handlers and `AppError` for operational errors
- Frontend env vars must be prefixed with `VITE_` (Vite convention)
- Prettier: single quotes, trailing commas, 100 char print width, 2 space indent
