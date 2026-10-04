-- Local/demo seed data for NACOS Store.
-- Safe to run repeatedly. These are synthetic test records, not real member data.

INSERT INTO campaigns (id, name, slug, description, status, starts_at, ends_at, initial_coin_grant)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'NACOS 100 Pilot',
  'nacos-100-pilot',
  'The first coin-based NACOS merch drop.',
  'LIVE',
  NOW() - INTERVAL '1 hour',
  NOW() + INTERVAL '13 days',
  100
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  initial_coin_grant = EXCLUDED.initial_coin_grant;

INSERT INTO nacos_members (id, nacos_id, nacos_id_normalized, full_name, chapter, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'NACOS-DEMO-001', 'NACOS-DEMO-001', 'Demo NACOSite One', 'Bingham University', 'ACTIVE'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'NACOS-DEMO-002', 'NACOS-DEMO-002', 'Demo NACOSite Two', 'Bingham University', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  full_name = EXCLUDED.full_name,
  chapter = EXCLUDED.chapter;

INSERT INTO products (id, name, slug, type, short_description, description, status, visibility, featured)
VALUES
  ('22222222-2222-2222-2222-222222222221', 'NACOS Classic Hoodie', 'nacos-classic-hoodie', 'PHYSICAL',
   'Premium heavyweight hoodie with NACOS embroidery.',
   'A heavyweight NACOS hoodie built for campus days and late-night builds.',
   'PUBLISHED', 'PUBLIC', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Hackathon Survival Kit', 'hackathon-survival-kit', 'PHYSICAL',
   'Stickers, a stress ball and essentials for long build sessions.',
   'A small developer survival pack for events, hackathons and long project nights.',
   'PUBLISHED', 'PUBLIC', FALSE)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, visibility = EXCLUDED.visibility;

INSERT INTO product_option_groups (id, product_id, name, display_type, sort_order, required)
VALUES ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', 'Size', 'BUTTON', 0, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_option_values (id, group_id, label, value, sort_order)
VALUES
 ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'Medium', 'M', 1),
 ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', 'Large', 'L', 2),
 ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331', 'X-Large', 'XL', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, sku, coin_price, cash_price_kobo, pricing_mode, stock_policy, active)
VALUES
 ('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222221', 'HOODIE-M', 80, 0, 'COINS_ONLY', 'UNLIMITED', TRUE),
 ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222221', 'HOODIE-L', 80, 0, 'COINS_ONLY', 'UNLIMITED', TRUE),
 ('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222221', 'HOODIE-XL', 80, 0, 'COINS_ONLY', 'UNLIMITED', TRUE),
 ('55555555-5555-5555-5555-555555555554', '22222222-2222-2222-2222-222222222222', 'KIT-01', 30, 0, 'COINS_ONLY', 'UNLIMITED', TRUE)
ON CONFLICT (id) DO UPDATE SET active = EXCLUDED.active;

INSERT INTO variant_option_values (variant_id, option_value_id)
VALUES
 ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441'),
 ('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444442'),
 ('55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444443')
ON CONFLICT DO NOTHING;

INSERT INTO product_media (id, product_id, storage_path, public_url, is_primary)
VALUES
 ('66666666-6666-6666-6666-666666666661', '22222222-2222-2222-2222-222222222221', 'demo/nacos-hoodie.jpg',
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop', TRUE),
 ('66666666-6666-6666-6666-666666666662', '22222222-2222-2222-2222-222222222222', 'demo/hackathon-kit.jpg',
  'https://images.unsplash.com/photo-1628191140046-568eb90dcc68?q=80&w=1000&auto=format&fit=crop', TRUE)
ON CONFLICT (id) DO UPDATE SET public_url = EXCLUDED.public_url, is_primary = EXCLUDED.is_primary;
