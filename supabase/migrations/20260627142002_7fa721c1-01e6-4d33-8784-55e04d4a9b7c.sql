
CREATE POLICY "log-logos public read" ON storage.objects FOR SELECT USING (bucket_id = 'log-logos');
CREATE POLICY "log-logos auth insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'log-logos' AND auth.role() = 'authenticated');
CREATE POLICY "log-logos auth update" ON storage.objects FOR UPDATE USING (bucket_id = 'log-logos' AND auth.role() = 'authenticated');
CREATE POLICY "log-logos auth delete" ON storage.objects FOR DELETE USING (bucket_id = 'log-logos' AND auth.role() = 'authenticated');
