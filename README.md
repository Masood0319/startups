# Travest

Travest is a full-stack startup–investor platform that helps founders and investors discover each other, connect, message securely, and manage investments in one place.

## Highlights

- Role-based onboarding and dashboards for founders, investors, and fund managers.
- Verified profiles, connection requests, and messaging with notifications.
- Startup discovery with trending and recommended feeds.
- Secure payments powered by Stripe.
- Next.js App Router frontend with an Express + MongoDB backend.

## Tech Stack

- Frontend: Next.js (App Router), React, Tailwind CSS, Framer Motion.
- Backend: Node.js, Express, MongoDB with Mongoose, JWT auth.
- Payments: Stripe.
- Optional auth helpers: Supabase client helpers.

## Repo Structure

- `frontend/`: Next.js application and UI.
- `backend/`: Express API server and business logic.

## Quick Start

1. Install dependencies.

```bash
cd backend
npm install

cd ../frontend
npm install
```

2. Configure environment variables (see below).
3. Start the backend API.

```bash
cd backend
npm run dev
```

4. Start the frontend.

```bash
cd frontend
npm run dev
```

The frontend runs at `http://localhost:3000` and the backend at `http://localhost:5000` by default.

## Environment Variables

Create `backend/.env`:

```env
# Server
PORT=5000
CORS_ORIGIN=http://localhost:3000
CLIENT_ORIGIN=http://localhost:3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/DB_NAME
MONGODB_DB=startups

# Auth
JWT_SECRET=replace_me

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (password reset)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# Gmail transport (optional)
EMAIL_USER=
EMAIL_PASS=
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Notes:
- The frontend proxies `/api/*` requests to the backend using `NEXT_PUBLIC_API_URL`.
- Do not commit secrets. Use local environment files only.

## Scripts

Backend (`backend/package.json`):

- `npm run dev`: start the API server.
- `npm start`: start the API server.

Frontend (`frontend/package.json`):

- `npm run dev`: start the Next.js dev server.
- `npm run build`: production build.
- `npm run start`: start the production server.
- `npm run lint`: run ESLint.

## API Overview

The backend auto-registers routes under `/api` from `backend/src/routes`.

Key route groups:

- Auth: `/api/auth/*` (signup, login, verify, role, setup, me, logout, forgot password)
- Startups: `/api/startups`, `/api/startups/[id]`, `/api/startups/trending`, `/api/startups/recommended`
- Investors: `/api/investors`, `/api/investors/interested`
- Connections: `/api/connections/*` (request, accept/decline/withdraw/reject)
- Messaging: `/api/messaging`, `/api/messages/[connectionId]`
- Notifications: `/api/notifications/*`, `/api/notifications/summary`
- Payments: `/api/payments/*`, `/api/payments/webhooks`
- Dashboard: `/api/dashboard`, `/api/platform/stats`

A health check is available at `/health`.

## Payments

Stripe is used for peer-to-peer payments between users. For full setup instructions, see:

- `frontend/PAYMENT_SETUP_GUIDE.md`

## Security Notes

- JWT-based auth with HTTP-only cookies.
- Rate-limited auth, OTP, and password reset endpoints.
- Sensitive data should never be committed to the repo.

## Documentation

- Backend implementation details: `frontend/BACKEND_IMPLEMENTATION_SUMMARY.md`.

## License

License is not specified yet. Add a LICENSE file if you plan to open-source this project.
