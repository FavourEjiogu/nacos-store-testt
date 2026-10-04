-- 1. Create a trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'), new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists, drop if it does, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. RBAC Model
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'CATALOG_ADMIN', 'MEMBER_VERIFIER', 'FULFILLMENT_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN', 'SELLER')),
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view roles" ON admin_roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role IN ('SUPER_ADMIN', 'SUPPORT_ADMIN'))
  );

CREATE POLICY "Super admins can manage roles" ON admin_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- 3. Add necessary indexes for lookups
CREATE INDEX idx_profiles_nacos_id_norm ON profiles(nacos_id_normalized);
CREATE INDEX idx_nacos_members_id_norm ON nacos_members(nacos_id_normalized);
CREATE INDEX idx_admin_roles_user_id ON admin_roles(user_id);

-- 4. Correct missing Cart Items User ID reference
-- Actually, cart_items doesn't need user_id because cart_id -> carts -> user_id maps it.
-- But to fix the API route querying cart_items by user_id, we will fix the API route code, NOT the schema.
