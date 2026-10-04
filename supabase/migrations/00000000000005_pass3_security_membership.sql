-- 1. Create a function to verify membership against the authoritative whitelist
CREATE OR REPLACE FUNCTION verify_membership()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_nacos_id_norm TEXT;
  v_status TEXT;
  v_whitelist_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user's profile and normalized nacos_id
  SELECT nacos_id_normalized, verification_status INTO v_nacos_id_norm, v_status
  FROM profiles WHERE id = v_user_id;

  IF v_status = 'VERIFIED' THEN
    RETURN TRUE;
  END IF;

  IF v_status IN ('REJECTED', 'SUSPENDED') THEN
    RAISE EXCEPTION 'User is ineligible for verification';
  END IF;

  IF v_nacos_id_norm IS NULL THEN
    RAISE EXCEPTION 'NACOS ID is not set on profile';
  END IF;

  -- Check authoritative whitelist
  SELECT id INTO v_whitelist_id 
  FROM nacos_members 
  WHERE nacos_id_normalized = v_nacos_id_norm AND status = 'ACTIVE';

  IF FOUND THEN
    UPDATE profiles SET verification_status = 'VERIFIED', verified_at = NOW() WHERE id = v_user_id;
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Membership not found in active whitelist';
  END IF;
END;
$$;

-- 2. Modify grant_initial_coins to strictly enforce VERIFIED status
CREATE OR REPLACE FUNCTION grant_initial_coins(target_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator
AS $$
DECLARE
  v_user_id UUID;
  v_verification_status TEXT;
  v_idempotency_key TEXT;
  v_campaign_amount INTEGER;
  v_campaign_status TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get verification status
  SELECT verification_status INTO v_verification_status 
  FROM profiles WHERE id = v_user_id;

  -- STRICT ENFORCEMENT
  IF v_verification_status != 'VERIFIED' THEN
    RAISE EXCEPTION 'User must be VERIFIED to receive campaign coins. Current status: %', COALESCE(v_verification_status, 'NULL');
  END IF;

  -- Get campaign info
  SELECT initial_coin_grant, status INTO v_campaign_amount, v_campaign_status
  FROM campaigns WHERE id = target_campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;

  IF v_campaign_status NOT IN ('LIVE', 'SCHEDULED') THEN
    RAISE EXCEPTION 'Campaign is not active for grants';
  END IF;

  -- Generate idempotency key
  v_idempotency_key := 'initial-grant:' || target_campaign_id::text || ':' || v_user_id::text;

  -- Check if already granted (idempotency key is unique)
  IF EXISTS (SELECT 1 FROM coin_ledger WHERE idempotency_key = v_idempotency_key) THEN
    RETURN TRUE; -- Already granted, return success
  END IF;

  -- Insert ledger entry
  INSERT INTO coin_ledger (
    user_id,
    campaign_id,
    amount,
    direction,
    reason,
    reference_type,
    idempotency_key,
    created_by
  ) VALUES (
    v_user_id,
    target_campaign_id,
    v_campaign_amount,
    'CREDIT',
    'campaign_initial_grant',
    'campaign_join',
    v_idempotency_key,
    v_user_id
  );

  RETURN TRUE;
END;
$$;
