# Implementation Audit Report

## Verified Repository Architecture
- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth

## 1. Schema / Code Mismatches (Critical)
- **Products:** Code expects `pricing_mode` and `image_urls` on products, but they do not exist in `initial_schema.sql`.
- **Variants:** Code expects `label` on variants, but the schema uses Option Groups / Option Values.
- **Cart vs Cart Items:** `/api/admin/campaign/finalize/route.ts` incorrectly queries `cart_items` by `user_id`, despite `cart_items` missing `user_id` (it relies on `cart_id` mapping to `carts.user_id`).

## 2. Authentication and Authorization Gaps (Critical)
- **Profile Insert Policy:** `rls_policies.sql` provides SELECT and UPDATE on `profiles`, but no INSERT policy, breaking client-side registration.
- **Admin APIs:** Missing server-side role validation. Code checks if the user exists but doesn't check their role, exposing admin endpoints.
- **Database RBAC:** Database comments note that admin policies were omitted, meaning direct database access is completely insecure.

## 3. Data Integrity & Economics Risks (High)
- **Coin Grants:** Previous AI implementation does not properly restrict grants using the authoritative `nacos_members` whitelist.
- **Checkout Transactions:** Client-side states dictate checkout prices instead of authoritative DB reads locking the ledger. 

## 4. UI/UX & Broken Flows (High)
- **Missing Pages:** Certain pages claimed by previous agents (e.g. `src/app/admin/members/page.tsx`) do not exist or were incorrectly pathed.
- **Campaign Countdown:** Fake, hardcoded countdowns exist on the frontend instead of syncing with `campaigns.ends_at`.

## Prioritized Remediation Plan
1. **Pass 1:** Complete forensic audit and plan. (Done)
2. **Pass 2:** Reconcile database schema to match application logic correctly (or adjust application to properly utilize the relational model). Add `INSERT` policies to `profiles` and create an admin role architecture.
3. **Pass 3:** Implement proper RBAC in RLS and API routes. Enforce NACOS Membership verification via server actions.
4. **Pass 4:** Correct the coin ledger transaction model to lock and compute on the server, ensuring double spending is impossible.
5. **Pass 5 & 6:** Build robust Store, Cart, and Admin tools following the schema.
6. **Pass 7+:** Refine UI, analytics, and security tests.
