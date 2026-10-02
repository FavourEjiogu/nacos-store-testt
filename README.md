# NACOS 100

NACOS 100 is a coin-based merch store campaign allowing NACOSites to spend 100 NACOS Coins over a 14-day window. Instead of forcing everyone to agree on one merch item, users can build their own cart.

## Features
- **Identity Verification**: Verifies NACOS ID before granting 100 coins.
- **Coin Ledger**: Immutable ledger of coin transactions.
- **14-Day Campaign**: Cart finalization only happens at the campaign's end.
- **Product Variants**: Full support for colors, sizes, and flavors.
- **Checkout via Paystack**: Support for carts that exceed coin balance or require extra cash.
- **Order Downloader**: Generates a shareable and downloadable list of selections.
- **Admin & Fulfillment**: Workspace to track orders by hostel, product, or seller.

## Tech Stack
- Next.js (App Router)
- Tailwind CSS
- TypeScript
- Supabase (Auth, Postgres, Storage, Edge Functions)
- Paystack

## Local Development
1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and add your Supabase and Paystack credentials.
4. Run `npm run dev`

For more information, see other `.md` files in this directory.
