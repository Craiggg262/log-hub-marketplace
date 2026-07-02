ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;

DROP POLICY IF EXISTS "Public read log-logos" ON storage.objects;
CREATE POLICY "Public read log-logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'log-logos');

DROP POLICY IF EXISTS "Authenticated write log-logos" ON storage.objects;
CREATE POLICY "Authenticated write log-logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'log-logos');

DROP POLICY IF EXISTS "Authenticated update log-logos" ON storage.objects;
CREATE POLICY "Authenticated update log-logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'log-logos');