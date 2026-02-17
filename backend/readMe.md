# Sell-It-4.0 Backend

Express.js REST API with TypeScript, MongoDB, JWT authentication, email verification (Gmail), and phone verification (Twilio SMS).

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
| `ALLOWED_ORIGINS`        | Comma-separated allowed origins for CORS (production) |
| `NODE_ENV`               | `development`, `production`, or `test` |
| `TWILIO_ACCOUNT_SID`     | Twilio account SID (optional)      |
| `TWILIO_AUTH_TOKEN`      | Twilio auth token (optional)       |
| `TWILIO_PHONE_NUMBER`    | Twilio sender phone number (optional) |

### 3. Start the dev server

```bash
npm run dev -w backend
```

The server starts with auto-reload via Nodemon. Port is read from the `PORT` env var.

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

### Auth (`/api/auth`)

| Method | Route                          | Auth | Description                    |
| ------ | ------------------------------ | ---- | ------------------------------ |
| POST   | `/register`                    | No   | Register a new user            |
| POST   | `/login`                       | No   | Login and receive JWT          |
| GET    | `/verify-email/:token`         | No   | Verify email address           |
| POST   | `/resend-verification`         | No   | Resend verification email      |
| GET    | `/me`                          | Yes  | Get current user profile       |
| POST   | `/send-phone-verification`     | Yes  | Send SMS verification code     |
| POST   | `/verify-phone`                | Yes  | Verify phone with 6-digit code |
| POST   | `/change-password`             | Yes  | Change password                |
| DELETE  | `/account`                     | Yes  | Delete user account            |
| POST   | `/profile-photo`               | Yes  | Upload profile photo           |

### Products (`/api/products`)

| Method | Route              | Auth       | Description                    |
| ------ | ------------------ | ---------- | ------------------------------ |
| GET    | `/`                | No         | Get all products (with filters)|
| POST   | `/`                | Verified + Phone | Create a product         |
| GET    | `/categories`      | No         | Get available categories       |
| GET    | `/user/:username`  | No         | Get products by user           |
| GET    | `/:id`             | No         | Get product by ID              |
| PUT    | `/:id`             | Verified + Phone | Update a product         |
| DELETE | `/:id`             | Verified + Phone | Delete a product         |

### Favourites (`/api/favourites`)

| Method | Route              | Auth       | Description                    |
| ------ | ------------------ | ---------- | ------------------------------ |
| GET    | `/`                | Yes        | Get user's favourites          |
| GET    | `/ids`             | Yes        | Get favourite product IDs      |
| POST   | `/:productId`      | Verified   | Add product to favourites      |
| DELETE | `/:productId`      | Verified   | Remove product from favourites |

### Other

| Method | Route              | Description                    |
| ------ | ------------------ | ------------------------------ |
| GET    | `/api/health`      | Health check with DB status    |

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── cloudinary.ts        # Cloudinary SDK configuration
│   │   ├── database.ts          # MongoDB/Mongoose connection
│   │   └── environment.ts       # Env variable validation (Zod)
│   ├── constants/
│   │   └── categories.ts        # Product category enum
│   ├── controllers/
│   │   ├── authController.ts    # Auth request handlers
│   │   ├── productController.ts # Product CRUD handlers
│   │   └── favouriteController.ts # Favourite handlers
│   ├── middleware/
│   │   ├── authMiddleware.ts    # JWT verification (protect, requireVerified, requirePhoneVerified)
│   │   ├── errorHandler.ts      # Global error handler + AppError class
│   │   ├── upload.ts            # Multer + Cloudinary file upload
│   │   └── validate.ts          # Zod request body validation
│   ├── models/
│   │   ├── User.ts              # User schema
│   │   ├── Product.ts           # Product schema
│   │   └── Favourite.ts         # Favourite schema
│   ├── routes/
│   │   ├── authRoutes.ts        # Auth route definitions + Zod schemas
│   │   ├── productRoutes.ts     # Product route definitions + Zod schemas
│   │   ├── favouriteRoutes.ts   # Favourite route definitions
│   │   └── index.ts             # Route aggregator
│   ├── services/
│   │   ├── emailService.ts      # Nodemailer Gmail transport
│   │   └── smsService.ts        # Twilio SMS service
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces
│   ├── utils/
│   │   ├── logger.ts            # Winston logger
│   │   └── productHelpers.ts    # Product query helpers
│   ├── app.ts                   # Express app setup (middleware, routes)
│   └── server.ts                # Server entry point (DB connect + listen)
├── tests/
│   ├── setup.ts                 # Jest global setup (MongoDB cleanup)
│   ├── auth.test.ts             # Auth endpoint tests
│   ├── auth-edge-cases.test.ts  # Auth edge case tests
│   ├── product.test.ts          # Product endpoint tests
│   ├── favourite.test.ts        # Favourite endpoint tests
│   ├── phone-verification.test.ts # Phone verification tests
│   ├── profile-settings.test.ts # Profile settings tests
│   └── requireVerified.test.ts  # Verification middleware tests
├── .env.example
├── jest.config.ts
├── nodemon.json
├── package.json
└── tsconfig.json
```

## Architecture

Request flow: **Routes -> Middleware -> Controllers -> Services -> Models**

- **Routes** define endpoints, attach Zod validation schemas (inline) and auth middleware
- **Middleware** handles cross-cutting concerns: `protect` (JWT auth), `requireVerified` (email verified), `requirePhoneVerified` (phone verified), `validate` (Zod), `errorHandler` (global errors), `upload` (file uploads)
- **Controllers** handle request/response logic
- **Services** contain business logic (email sending, SMS sending)
- **Models** define Mongoose schemas and database interactions

Rate limiting is applied per-route group with tiered limits (strict for auth, moderate for favourites, public for products). Rate limiting is disabled in test mode.
