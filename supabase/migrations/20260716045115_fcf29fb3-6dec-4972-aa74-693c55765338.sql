
CREATE POLICY "owner read overlays" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'overlays' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "owner insert overlays" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'overlays' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "owner update overlays" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'overlays' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "owner delete overlays" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'overlays' AND (storage.foldername(name))[1] = auth.uid()::text);
-- Public anon read so the /overlay/:pageId page (used by OBS) can load PNGs without login.
CREATE POLICY "anon read overlays" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'overlays');
