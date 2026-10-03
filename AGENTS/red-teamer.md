# Architecture & Security Review (Red Teamer)

## Threats Mitigated
1. **Paystack Webhook Spoofing**: We implemented an HMAC SHA-512 signature check. Attackers cannot forge `payment_success` webhooks to trick the system into fulfilling unpaid orders.
2. **Horizontal Privilege Escalation**: Operations accessing order information or triggering admin states verify existence in the `admin_roles` table at the server level via `getUser()`. RLS policies also explicitly block `UPDATE` and `DELETE` on tables like `campaigns` or `coin_ledger` by non-super-admins.
3. **Double Spend / Ledger Tampering**: Coins are managed through the `coin_ledger` via Postgres insert triggers/RPCs, rather than a mutable `user.coins` column. This makes balance calculations deterministic and significantly hardens against race condition double-spends. 
4. **Idempotent Order Generation**: Campaign finalization checks the campaign status (`ACTIVE` vs `FINALIZED`). Subsequent calls are naturally blocked, preventing duplicate orders.

## Vulnerabilities & Areas for Improvement
1. **Denial of Wallet Balance Check**: `wallet/page.tsx` aggregates ledger entries dynamically (`SUM(amount)`). While fine for 1000 users, as ledgers grow, this `O(N)` accumulation per page load will become a bottleneck. We should create a materialized view or trigger-based `cached_balance` column if scaling beyond 10,000 members.
2. **Server-Side Request Forgery / File Upload**: The `NewProductForm` allows administrators to upload images. Supabase storage rules must be configured tightly to only accept `image/png`, `image/jpeg`, and `image/webp`, and reject excessive sizes, to prevent storage abuse.
3. **Admin Verification Rate Limiting**: The `MemberVerifyButton` does not have rate-limiting on the API layer beyond Supabase defaults. Malicious admins could write scripts to spam the mutation endpoint. 
4. **Stock Overselling**: The current default policy is `PREORDER`. If switching to `LIMITED_STOCK`, the cart finalization logic in `/api/admin/campaign/finalize` needs distributed locking (or Postgres `SELECT FOR UPDATE` advisory locks) across cart evaluations to prevent overselling highly requested items in the exact millisecond the campaign ends.
