# Sell-It-4.0 Backend

Express.js REST API with TypeScript, MongoDB, JWT authentication, and Gmail email verification.

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

| Variable                 | Description                        |
| ------------------------ | ---------------------------------- |
| `PORT`                   | Server port (default: 5000)        |
| `MONGODB_URI`            | MongoDB connection string          |
| `JWT_SECRET`             | Secret key for signing JWTs        |
| `JWT_EXPIRES_IN`         | Token expiration (e.g. `7d`)       |
| `GMAIL_USER`             | Gmail address for sending emails   |
| `GMAIL_APP_PASSWORD`     | Gmail app password                 |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary cloud name              |
| `CLOUDINARY_API_KEY`     | Cloudinary API key                 |
| `CLOUDINARY_API_SECRET`  | Cloudinary API secret              |
| `CLIENT_URL`             | Frontend URL (default: `http://localhost:5173`) |
| `NODE_ENV`               | `development`, `production`, or `test` |

### 3. Start the dev server

```bash
npm run dev -w backend
```

The server starts on `http://localhost:5000` with auto-reload via Nodemon.

## Scripts

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `npm run dev`        | Start dev server with Nodemon    |
| `npm run build`      | Compile TypeScript to `dist/`    |
| `npm run start`      | Run compiled production build    |
| `npm run test`       | Run Jest tests                   |
| `npm run test:watch` | Run Jest in watch mode           |
| `npm run lint`       | Lint source files with ESLint    |

## API Endpoints

### Auth

| Method | Route                        | Description              |
| ------ | ---------------------------- | ------------------------ |
| POST   | `/api/auth/register`         | Register a new user      |
| POST   | `/api/auth/login`            | Login and receive JWT    |
| GET    | `/api/auth/verify-email/:token` | Verify email address  |
| GET    | `/api/health`                | Health check             |

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── cloudinary.ts        # Cloudinary SDK configuration
│   │   ├── database.ts          # MongoDB/Mongoose connection
│   │   └── environment.ts       # Env variable validation (Zod)
│   ├── controllers/
│   │   └── authController.ts    # Auth request handlers
│   ├── middleware/
│   │   ├── authMiddleware.ts    # JWT verification
│   │   ├── errorHandler.ts      # Global error handler + AppError class
│   │   ├── upload.ts            # Multer + Cloudinary file upload
│   │   └── validate.ts          # Zod request body validation
│   ├── models/
│   │   └── User.ts              # Mongoose User schema
│   ├── routes/
│   │   ├── authRoutes.ts        # Auth route definitions
│   │   └── index.ts             # Route aggregator
│   ├── services/
│   │   └── emailService.ts      # Nodemailer Gmail transport
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces
│   ├── utils/
│   │   └── logger.ts            # Winston logger
│   ├── app.ts                   # Express app setup (middleware, routes)
│   └── server.ts                # Server entry point (DB connect + listen)
├── tests/
│   ├── integration/             # API integration tests (Supertest)
│   ├── unit/                    # Unit tests
│   └── setup.ts                 # Jest global setup
├── .env.example
├── jest.config.ts
├── nodemon.json
├── package.json
└── tsconfig.json
```

## Architecture

Request flow: **Routes -> Controllers -> Services -> Models**

- **Routes** define endpoints and attach validation/auth middleware
- **Controllers** handle request/response logic
- **Services** contain business logic (email, uploads, etc.)
- **Models** define Mongoose schemas and database interactions
- **Middleware** handles cross-cutting concerns (auth, validation, errors, uploads)
