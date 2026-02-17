# Sell-It-4.0

A full-stack marketplace application for buying and selling products.

## Tech Stack

- **Backend**: Express.js, TypeScript, MongoDB, JWT, Nodemailer (Gmail), Twilio (SMS)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Router v7
- **Testing**: Jest + Supertest (backend), Vitest + Playwright + MSW (frontend)

## Prerequisites

- Node.js 20+
- MongoDB running locally or a MongoDB Atlas connection string
- Gmail App Password for email verification
- Cloudinary account for image uploads
- Twilio account for SMS phone verification (optional in development)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env files and fill in your credentials:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Run both servers

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 5173) concurrently.

To run them individually:

```bash
npm run dev -w backend    # Backend only
npm run dev -w frontend   # Frontend only
```

### 4. Open the app

Navigate to `http://localhost:5173` in your browser. API requests to `/api` are proxied to the backend.

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start backend and frontend together  |
| `npm run build` | Build both workspaces                |
| `npm test`      | Run all tests                        |
| `npm run lint`  | Lint both workspaces                 |

## Features

- User registration with email and phone verification
- Product listings with image uploads (up to 5 per product)
- Advanced filtering by category, condition, and price range
- Favourites system
- User profiles with profile photo, change password, and delete account
- Responsive dark theme UI

## Project Structure

```
sellit-4.0/
├── backend/               # Express API server
├── frontend/              # React SPA
├── .github/workflows/     # CI/CD workflows
├── package.json           # Root workspace config (npm workspaces)
├── tsconfig.json          # Base TypeScript config
├── .prettierrc            # Code formatting
└── .gitignore
```

See [backend/readMe.md](backend/readMe.md) and [frontend/readMe.md](frontend/readMe.md) for workspace-specific documentation.
