
ALTER FUNCTION public.set_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Restrict storage listing to authenticated users only
DROP POLICY IF EXISTS "post-images public read" ON storage.objects;
CREATE POLICY "post-images read auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'post-images');
CREATE POLICY "post-images read anon by path" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'post-images');
