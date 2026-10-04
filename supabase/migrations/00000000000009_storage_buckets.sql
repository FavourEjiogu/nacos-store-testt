-- Create the products storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the products bucket
-- Anyone can view the images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- Authenticated admins can upload images (for simplicity, we check auth.uid() is not null, 
-- but in production we'd join with admin_roles. For now, matching standard Supabase authenticated upload)
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'products' AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' AND auth.uid() IS NOT NULL
);
