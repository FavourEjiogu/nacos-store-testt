-- Seed data for testing NACOS 100

-- Create a dummy campaign
INSERT INTO campaigns (id, name, slug, description, status, starts_at, ends_at, initial_coin_grant)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'NACOS 100 Pilot',
  'nacos-100-pilot',
  'The first ever coin-based NACOS merch drop.',
  'LIVE',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '13 days',
  100
) ON CONFLICT (id) DO NOTHING;

-- Insert a test profile (assuming they signed up, we can't seed auth.users easily here without pgcrypto or API, so we skip and just rely on real users)

-- Insert mock products
INSERT INTO products (id, name, slug, type, short_description, description, status, visibility, featured)
VALUES
(
  '22222222-2222-2222-2222-222222222221',
  'NACOS Classic Hoodie',
  'nacos-classic-hoodie',
  'PHYSICAL',
  'Premium heavyweight hoodie with NACOS embroidery.',
  'Stay warm and represent. This 400gsm heavyweight hoodie features a minimal NACOS logo embroidered on the chest. Perfect for late-night coding sessions.',
  'PUBLISHED',
  'PUBLIC',
  TRUE
),
(
  '22222222-2222-2222-2222-222222222222',
  'Hackathon Survival Kit',
  'hackathon-survival-kit',
  'PHYSICAL',
  'Energy drinks, stickers, and a stress ball.',
  'Everything you need to survive a 48-hour hackathon. Includes 2 energy drinks, a pack of 10 exclusive dev stickers, and a branded stress ball.',
  'PUBLISHED',
  'PUBLIC',
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- Product Option Groups (e.g., Size for Hoodie)
INSERT INTO product_option_groups (id, product_id, name, display_type)
VALUES
(
  '33333333-3333-3333-3333-333333333331',
  '22222222-2222-2222-2222-222222222221',
  'Size',
  'BUTTON'
) ON CONFLICT (id) DO NOTHING;

-- Option Values
INSERT INTO product_option_values (id, group_id, label, value, sort_order)
VALUES
('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'Medium', 'M', 1),
('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', 'Large', 'L', 2),
('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331', 'X-Large', 'XL', 3)
ON CONFLICT (id) DO NOTHING;

-- Variants
INSERT INTO product_variants (id, product_id, sku, coin_price, cash_price_kobo, pricing_mode, stock_policy)
VALUES
-- Hoodie Variants (Costs 80 coins)
('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222221', 'HOODIE-M', 80, 0, 'COINS_ONLY', 'UNLIMITED'),
('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222221', 'HOODIE-L', 80, 0, 'COINS_ONLY', 'UNLIMITED'),
('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222221', 'HOODIE-XL', 80, 0, 'COINS_ONLY', 'UNLIMITED'),

-- Survival Kit Variant (Costs 30 coins, meaning if you buy hoodie + kit you need 110 coins, forcing a Paystack checkout for the remaining 10 coins or cash_price!)
-- Wait, the spec says "Checkout via Paystack: Support for carts that exceed coin balance or require extra cash".
-- We can set pricing mode to COINS_PLUS_CASH or COINS_ONLY. If a cart exceeds balance, the remaining coins convert to cash at a fixed rate (e.g., 1 coin = 100 NGN) during checkout.
('55555555-5555-5555-5555-555555555554', '22222222-2222-2222-2222-222222222222', 'KIT-01', 30, 0, 'COINS_ONLY', 'UNLIMITED')
ON CONFLICT (id) DO NOTHING;

-- Map variant to option values for Hoodie
INSERT INTO variant_option_values (variant_id, option_value_id)
VALUES
('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441'),
('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444442'),
('55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444443')
ON CONFLICT (variant_id, option_value_id) DO NOTHING;

-- Product Media
INSERT INTO product_media (id, product_id, storage_path, public_url, is_primary)
VALUES
(
  '66666666-6666-6666-6666-666666666661',
  '22222222-2222-2222-2222-222222222221',
  'dummy',
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop',
  TRUE
),
(
  '66666666-6666-6666-6666-666666666662',
  '22222222-2222-2222-2222-222222222222',
  'dummy',
  'https://images.unsplash.com/photo-1628191140046-568eb90dcc68?q=80&w=1000&auto=format&fit=crop',
  TRUE
) ON CONFLICT (id) DO NOTHING;
