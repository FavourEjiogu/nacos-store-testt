-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  matric_number TEXT,
  nacos_id TEXT,
  nacos_id_normalized TEXT,
  department TEXT,
  level TEXT,
  hostel_id UUID,
  hostel_name_snapshot TEXT,
  phone TEXT,
  email TEXT,
  verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
  seller_status TEXT DEFAULT 'NONE' CHECK (seller_status IN ('NONE', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ
);

-- NACOS_MEMBERS (Whitelist)
CREATE TABLE nacos_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nacos_id TEXT UNIQUE NOT NULL,
  nacos_id_normalized TEXT UNIQUE NOT NULL,
  full_name TEXT,
  matric_number TEXT,
  chapter TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAMPAIGNS
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'LIVE', 'ENDING', 'ENDED', 'FINALIZING', 'FULFILLMENT', 'COMPLETED', 'ARCHIVED')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  initial_coin_grant INTEGER DEFAULT 100,
  currency TEXT DEFAULT 'NGN',
  timezone TEXT DEFAULT 'Africa/Lagos',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COIN LEDGER
CREATE TABLE coin_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) NOT NULL,
  amount INTEGER NOT NULL,
  direction TEXT CHECK (direction IN ('CREDIT', 'DEBIT', 'REVERSAL', 'ADJUSTMENT')) NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  idempotency_key TEXT UNIQUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_coin_ledger_user_id ON coin_ledger(user_id);
CREATE INDEX idx_coin_ledger_campaign_id ON coin_ledger(campaign_id);
CREATE INDEX idx_coin_ledger_idempotency_key ON coin_ledger(idempotency_key);
CREATE INDEX idx_coin_ledger_created_at ON coin_ledger(created_at);

-- PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id),
  type TEXT DEFAULT 'PHYSICAL' CHECK (type IN ('PHYSICAL', 'SERVICE', 'DIGITAL', 'TICKET', 'PICKUP')),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  visibility TEXT DEFAULT 'PUBLIC',
  fulfillment_type TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- PRODUCT MEDIA
CREATE TABLE product_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID, -- References product_variants but we will create it later, so keeping it UUID for now without constraint
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT OPTION GROUPS
CREATE TABLE product_option_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_type TEXT DEFAULT 'BUTTON' CHECK (display_type IN ('SWATCH', 'BUTTON', 'DROPDOWN')),
  sort_order INTEGER DEFAULT 0,
  required BOOLEAN DEFAULT TRUE
);

-- PRODUCT OPTION VALUES
CREATE TABLE product_option_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES product_option_groups(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB
);

-- PRODUCT VARIANTS
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT,
  coin_price INTEGER DEFAULT 0,
  cash_price_kobo INTEGER DEFAULT 0,
  pricing_mode TEXT DEFAULT 'COINS_ONLY' CHECK (pricing_mode IN ('COINS_ONLY', 'CASH_ONLY', 'COINS_PLUS_CASH')),
  stock_policy TEXT DEFAULT 'PREORDER' CHECK (stock_policy IN ('UNLIMITED', 'PREORDER', 'LIMITED_STOCK')),
  stock_quantity INTEGER DEFAULT 0,
  max_quantity_per_order INTEGER,
  image_media_id UUID REFERENCES product_media(id),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint that was skipped above
ALTER TABLE product_media ADD CONSTRAINT fk_variant_id FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

-- VARIANT OPTION VALUES (Relation)
CREATE TABLE variant_option_values (
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  option_value_id UUID REFERENCES product_option_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, option_value_id)
);

-- CARTS
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) NOT NULL,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FROZEN', 'CONVERTED', 'EXPIRED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  frozen_at TIMESTAMPTZ,
  UNIQUE (user_id, campaign_id)
);

-- CART ITEMS
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cart_id, product_id, variant_id)
);

-- ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) NOT NULL,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PAYMENT_PENDING', 'CONFIRMED', 'PROCESSING', 'PACKING', 'READY_FOR_COLLECTION', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'PARTIALLY_FULFILLED')),
  payment_status TEXT DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  coin_total INTEGER DEFAULT 0,
  cash_total_kobo INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  hostel_name_snapshot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID, -- Kept loose to preserve historical records even if product deleted
  variant_id UUID,
  seller_id UUID,
  product_name_snapshot TEXT NOT NULL,
  variant_label_snapshot TEXT,
  sku_snapshot TEXT,
  quantity INTEGER NOT NULL,
  coin_unit_price INTEGER DEFAULT 0,
  coin_total INTEGER DEFAULT 0,
  cash_unit_price_kobo INTEGER DEFAULT 0,
  cash_total_kobo INTEGER DEFAULT 0,
  fulfillment_type TEXT,
  metadata JSONB
);

-- ORDER ITEM OPTIONS
CREATE TABLE order_item_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  option_name TEXT NOT NULL
);

-- PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  reference TEXT NOT NULL,
  amount_kobo INTEGER NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED')),
  provider_transaction_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  UNIQUE (provider, reference)
);

-- SHARE TOKENS
CREATE TABLE share_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- LEGAL ACCEPTANCES
CREATE TABLE legal_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_hash TEXT,
  user_agent TEXT
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  before_data JSONB,
  after_data JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
