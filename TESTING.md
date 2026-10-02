# Testing Strategy

The NACOS 100 platform requires strict testing of the core e-commerce engine and its campaign constraints.

## Unit & Integration Tests (Vitest)
- Test cart budget enforcement (prevent checkout if coins < required).
- Test idempotency of coin ledger grants.
- Test atomic inventory updates.

## E2E Tests (Playwright)
- **Registration Flow**: Signup -> Verify NACOS ID -> Onboarding -> Receive 100 coins.
- **Cart Constraints**: Attempt adding items beyond 100 coins and confirm clear error validation.
- **Finalization**: Confirm that mutating carts fails after the campaign ends.
- **Payments**: Mock Paystack integration and test successful webhook updates.
- **Downloads**: Verify PDF generation lists items without monetary values.
- **Sharing**: Validate sanitized read-only order links.

## Manual & Security QA
- Attempt to manipulate client-side prices and verify server rejection.
- Attempt duplicate NACOS ID registration.
- Verify RLS policies using unauthenticated or mismatched-user API requests.
- Test across responsive matrix (320px to 1440px wide).
- Test under slow network conditions (3G).
