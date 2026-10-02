# Security Strategy

## Threat Model & Principles
- **Never trust the frontend**: The backend must recalculate cart totals, coin balances, product prices, and campaign deadlines.
- **Zero Trust Admin**: Hiding URLs is not sufficient. All admin RPCs and routes use role-based authorization in the database.
- **Row Level Security (RLS)**: Enforced across all tables.

## Data Minimization & Privacy
- Collect only what's required (Name, NACOS ID, Matric, Dept, Level, Hostel, Phone, Email).
- Share links expose a sanitized read-only projection of order details without personal identity.

## Abuse Controls
- Rate limits on signup, login, NACOS ID verifications, and payment initialization.
- Protection against concurrent cart checkouts or duplicate initial coin grants (idempotency keys).
- Webhook endpoints verify Paystack signatures and process events idempotently.

## Incident Response
1. Discover
2. Contain
3. Assess
4. Fix
5. Rotate Secrets
6. Verify
7. Document
8. Notify (if required)

## Backups
- Utilize Supabase database backup procedures. Document data exports for operational fallback.
