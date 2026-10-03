-- Enable Row-Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nacos_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Campaigns
-- Anyone can view live campaigns
CREATE POLICY "Anyone can view live campaigns" ON campaigns
  FOR SELECT USING (status IN ('SCHEDULED', 'LIVE', 'ENDING', 'ENDED', 'FINALIZING', 'FULFILLMENT', 'COMPLETED'));

-- 3. Coin Ledger
-- Users can only view their own coin ledger entries
CREATE POLICY "Users can view own coin ledger" ON coin_ledger
  FOR SELECT USING (user_id = auth.uid());

-- 4. Products & Catalog
-- Anyone can view published products
CREATE POLICY "Anyone can view published products" ON products
  FOR SELECT USING (status = 'PUBLISHED' AND visibility = 'PUBLIC');

CREATE POLICY "Anyone can view published product media" ON product_media
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_media.product_id AND products.status = 'PUBLISHED')
  );

CREATE POLICY "Anyone can view published product option groups" ON product_option_groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_option_groups.product_id AND products.status = 'PUBLISHED')
  );

CREATE POLICY "Anyone can view published product option values" ON product_option_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_option_groups pog
      JOIN products p ON p.id = pog.product_id
      WHERE pog.id = product_option_values.group_id AND p.status = 'PUBLISHED'
    )
  );

CREATE POLICY "Anyone can view published product variants" ON product_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products WHERE products.id = product_variants.product_id AND products.status = 'PUBLISHED')
  );

CREATE POLICY "Anyone can view published variant option values" ON variant_option_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id = variant_option_values.variant_id AND p.status = 'PUBLISHED'
    )
  );

-- 5. Carts and Cart Items
-- Users can view, create, update, and delete their own carts and items
CREATE POLICY "Users can view own carts" ON carts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own carts" ON carts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own carts" ON carts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own cart items" ON cart_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own cart items" ON cart_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid() AND carts.status = 'OPEN')
  );

CREATE POLICY "Users can update own cart items" ON cart_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid() AND carts.status = 'OPEN')
  );

CREATE POLICY "Users can delete own cart items" ON cart_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid() AND carts.status = 'OPEN')
  );

-- 6. Orders and Order Items
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Users can view own order item options" ON order_item_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.id = order_item_options.order_item_id AND o.user_id = auth.uid()
    )
  );

-- 7. Payments
-- Users can view their own payment records
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())
  );

-- 8. Share Tokens
-- Users can view their own share tokens
CREATE POLICY "Users can view own share tokens" ON share_tokens
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = share_tokens.order_id AND orders.user_id = auth.uid())
  );

-- Public can view share tokens to load the sanitized page (backend will enforce data projection)
CREATE POLICY "Public can view valid share tokens" ON share_tokens
  FOR SELECT USING (revoked = FALSE AND (expires_at IS NULL OR expires_at > NOW()));

-- 9. Legal Acceptances
-- Users can view and insert their own legal acceptances
CREATE POLICY "Users can view own legal acceptances" ON legal_acceptances
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own legal acceptances" ON legal_acceptances
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- NOTE: Administrative policies (for SUPER_ADMIN, CATALOG_ADMIN, etc.) are omitted here for brevity
-- and should be managed via secure database functions or a separate admin role checking layer.
