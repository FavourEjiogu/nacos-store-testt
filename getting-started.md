# Getting Started with NACOS Store

## Prerequisites
- Node.js (v20+ recommended)
- npm or yarn
- Supabase CLI installed locally
- Docker (required for running Supabase locally)

## Local Setup

1. **Clone and Install**
   ```bash
   git clone <repository_url>
   cd nacos-store
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env.local` and populate it:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   PAYSTACK_SECRET_KEY=...
   PAYSTACK_PUBLIC_KEY=...
   ```

3. **Database Setup**
   Ensure Docker is running, then initialize Supabase:
   ```bash
   npx supabase start
   ```
   This will spin up the local Postgres database, apply all migrations, and run the seed files to set up demo users and catalog items.

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Immediate Tasks
- Explore the `/admin` dashboard.
- Create a test student account and navigate the `/onboarding` flow.
- Add items to the cart and test the transactional checkout process.
- Review the `supabase/migrations/` to understand the security policies and RPC flows for checkout and membership verification.
