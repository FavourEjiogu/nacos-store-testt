-- commit: feat: integrate inventory stock deduction into atomic checkout rpc
CREATE OR REPLACE FUNCTION checkout_cart(p_campaign_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id UUID;
  v_cart_status TEXT;
  v_total_coins INTEGER := 0;
  v_total_cash_kobo INTEGER := 0;
  v_available_coins INTEGER := 0;
  v_campaign_status TEXT;
  v_campaign_ends_at TIMESTAMPTZ;
  v_order_id UUID;
  v_order_number TEXT;
  v_item RECORD;
  v_payment_status TEXT;
BEGIN
  -- Enforce caller identity: p_user_id must be the authenticated session user
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'User identity mismatch or not authenticated';
  END IF;

  -- 1. Verify campaign is still accepting submissions at the server level
  SELECT status, ends_at INTO v_campaign_status, v_campaign_ends_at
  FROM campaigns WHERE id = p_campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  IF v_campaign_status NOT IN ('LIVE', 'SCHEDULED') THEN
    RAISE EXCEPTION 'Campaign is not open for submissions (status: %)', v_campaign_status;
  END IF;

  IF NOW() > v_campaign_ends_at THEN
    RAISE EXCEPTION 'Campaign has expired. The drop closed at %', v_campaign_ends_at;
  END IF;

  -- 2. Get user's cart with row lock to prevent concurrent checkout
  SELECT id, status INTO v_cart_id, v_cart_status
  FROM carts
  WHERE user_id = p_user_id AND campaign_id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found for this campaign';
  END IF;

  IF v_cart_status != 'OPEN' THEN
    RAISE EXCEPTION 'Cart is already %', v_cart_status;
  END IF;

  -- 3. Calculate totals from authoritative product_variants data
  -- Only include active variants for published products
  SELECT 
    COALESCE(SUM(pv.coin_price * ci.quantity), 0),
    COALESCE(SUM(pv.cash_price_kobo * ci.quantity), 0)
  INTO v_total_coins, v_total_cash_kobo
  FROM cart_items ci
  JOIN product_variants pv ON ci.variant_id = pv.id AND pv.active = TRUE
  JOIN products p ON ci.product_id = p.id AND p.status = 'PUBLISHED'
  WHERE ci.cart_id = v_cart_id;

  -- 4. Check available coins — CREDIT increases balance, everything else decreases it
  SELECT COALESCE(SUM(
    CASE direction
      WHEN 'CREDIT' THEN amount
      ELSE -amount
    END
  ), 0) INTO v_available_coins
  FROM coin_ledger
  WHERE user_id = p_user_id AND campaign_id = p_campaign_id;

  IF v_available_coins < v_total_coins THEN
    RAISE EXCEPTION 'Insufficient coins. Have %, need %', v_available_coins, v_total_coins;
  END IF;

  -- 5. Create Order
  v_order_number := 'N100-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  v_payment_status := CASE WHEN v_total_cash_kobo > 0 THEN 'PENDING' ELSE 'PAID' END;

  INSERT INTO orders (
    order_number, user_id, campaign_id, status, payment_status,
    coin_total, cash_total_kobo, currency
  ) VALUES (
    v_order_number, p_user_id, p_campaign_id, 'CONFIRMED', v_payment_status,
    v_total_coins, v_total_cash_kobo, 'NGN'
  ) RETURNING id INTO v_order_id;

  -- 6. Snapshot items and process inventory deduction
  FOR v_item IN 
    SELECT 
      ci.product_id, ci.variant_id, ci.quantity, 
      p.name AS product_name, pv.sku AS variant_sku,
      pv.coin_price, pv.cash_price_kobo, pv.stock_policy, pv.stock_quantity,
      (SELECT string_agg(pov.label, ' / ' ORDER BY pog.sort_order)
       FROM variant_option_values vov
       JOIN product_option_values pov ON vov.option_value_id = pov.id
       JOIN product_option_groups pog ON pov.group_id = pog.id
       WHERE vov.variant_id = pv.id) AS variant_label
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.cart_id = v_cart_id
    FOR UPDATE OF pv -- Lock the variants being modified
  LOOP
    -- Inventory Check & Deduction
    IF v_item.stock_policy = 'LIMITED_STOCK' THEN
      IF v_item.stock_quantity < v_item.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product % (SKU: %)', v_item.product_name, v_item.variant_sku;
      END IF;
      
      -- Decrement inventory
      UPDATE product_variants 
      SET stock_quantity = stock_quantity - v_item.quantity 
      WHERE id = v_item.variant_id;
    END IF;

    -- Snapshot into order_items
    INSERT INTO order_items (
      order_id, product_id, variant_id, product_name_snapshot,
      variant_label_snapshot, sku_snapshot, quantity,
      coin_unit_price, coin_total, cash_unit_price_kobo, cash_total_kobo
    ) VALUES (
      v_order_id, v_item.product_id, v_item.variant_id, v_item.product_name,
      v_item.variant_label, v_item.variant_sku, v_item.quantity,
      v_item.coin_price, v_item.coin_price * v_item.quantity,
      v_item.cash_price_kobo, v_item.cash_price_kobo * v_item.quantity
    );
  END LOOP;

  -- 7. Debit Ledger
  IF v_total_coins > 0 THEN
    INSERT INTO coin_ledger (
      user_id, campaign_id, amount, direction, reason,
      reference_type, reference_id, idempotency_key, created_by
    ) VALUES (
      p_user_id, p_campaign_id, v_total_coins, 'DEBIT', 'checkout',
      'order', v_order_id::text,
      'checkout-' || v_order_id::text,
      p_user_id
    );
  END IF;

  -- 8. Close Cart
  UPDATE carts SET status = 'CONVERTED', updated_at = NOW() WHERE id = v_cart_id;
  DELETE FROM cart_items WHERE cart_id = v_cart_id;

  RETURN v_order_id;
END;
$$;
