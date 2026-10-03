# NACOS 100 Project Memory

## Architecture
- **Framework:** Next.js 16 (App Router)
- **Database/Auth:** Supabase
- **Styling:** Tailwind CSS (Minimal monochrome + NACOS green `#1E8E2E`)
- **Payments:** Paystack API (via `/api/checkout/paystack`)
- **Job Scheduling:** `pg_cron` (Supabase DB)

## Current State (As of completion)
- Core user auth and verification (Whitelist CSV import & Manual verification) implemented.
- Cart logic, coin ledger (100 coins initial grant), and checkout validation fully working.
- Automatic campaign closing implemented via Postgres `pg_cron` scheduling.
- Seller application and approval workflow completed.
- Role Based Access Control (RBAC) securely locked down under `admin_roles`.
- Security audit logs tracking administrative actions across the application.
- Paystack webhook HMAC verification successfully mitigating spoofed requests.

## Known Gotchas / Lessons Learned
- **Type errors with Supabase arrays**: Next.js App Router API parameters expect `Promise<{ id: string }>` in the latest versions, which requires `await params` before accessing `id`.
- **Cart/Order Immutable Snapshotting**: `order_items` must capture snapshot fields like `coin_price_snapshot` rather than foreign-key referencing the product prices, because product prices may mutate over time, whereas historical orders must not change.
- **Paystack Webhook Signatures**: Paystack webhook payloads must be verified against `crypto.createHmac('sha512', secret).update(body).digest('hex')` to prevent manipulation.

## Future Plans / Handoff
- Implement the seller dashboard once approved sellers want to manage their own products.
- Real-time stock counting (if moving away from `PREORDER` inventory mode).
