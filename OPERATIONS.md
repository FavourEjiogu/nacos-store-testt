# Operations Manual

## Campaign Management
- **Setup**: Define campaign dates, initial coin grant (default 100), and store announcement in the admin dashboard.
- **Member Verification**: Upload a CSV of valid NACOS IDs or manually approve users who register as pending.
- **Product Publishing**: Admins create products, configure option groups (e.g., Color, Size), generate variants, and set pricing (Coins, Cash, or both).

## Finalization & Fulfillment
- **Campaign Close**: The system will automatically block new orders at the deadline. Carts are frozen and converted into orders.
- **Paystack Reconciliation**: Review pending payments. Monitor the Paystack webhook status for successful payments.
- **Packing Lists**: Use the Fulfillment Center to group orders by Hostel, Product, or Seller. Export CSV lists for physical packing.

## Seller Management
- Approved NACOSites can act as sellers.
- Admins review seller proposals before publishing them to the store.

## Customer Support
- **Coin Adjustments**: Modify a user's balance through the audited admin flow (requires reason and notes).
- **Refunds**: If an item is unavailable, issue a coin reversal via the system, and a cash refund via Paystack (if applicable).
