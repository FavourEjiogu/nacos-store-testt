-- commit: feat: add trigger to prevent unauthorized profile verification updates
-- 1. Create a trigger to prevent unauthorized updates to privileged profile fields
CREATE OR REPLACE FUNCTION restrict_profile_updates()
RETURNS trigger AS $$
BEGIN
  -- If this is called from the client (authenticated user role)
  IF current_setting('role', true) = 'authenticated' THEN
    -- Force sensitive fields to remain unchanged by the user
    NEW.verification_status = OLD.verification_status;
    NEW.seller_status = OLD.seller_status;
    NEW.verified_at = OLD.verified_at;
    NEW.suspended_at = OLD.suspended_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_sensitive_profile_updates ON profiles;
CREATE TRIGGER prevent_sensitive_profile_updates
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION restrict_profile_updates();
