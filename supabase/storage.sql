-- ============================================================
-- WuWa Betting - Storage Policies Setup
-- Run AFTER creating storage buckets in Supabase Dashboard
-- ============================================================

-- Create buckets via Supabase Dashboard or API:
-- 1. character-images (public: false)
-- 2. event-covers (public: false)

-- Storage policies for character-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'character-images',
  'character-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies: Only admins can upload/delete
CREATE POLICY "Public can view character images" ON storage.objects
  FOR SELECT USING (bucket_id = 'character-images');

CREATE POLICY "Only admins can upload character images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'character-images' AND
    EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Only admins can update character images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'character-images' AND
    EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Only admins can delete character images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'character-images' AND
    EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid() AND is_active = true)
  );

-- Event covers
CREATE POLICY "Public can view event covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-covers');

CREATE POLICY "Only admins can upload event covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-covers' AND
    EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Only admins can update event covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'event-covers' AND
    EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Only admins can delete event covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-covers' AND
    EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid() AND is_active = true)
  );
