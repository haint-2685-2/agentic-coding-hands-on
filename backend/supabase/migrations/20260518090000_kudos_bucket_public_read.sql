-- Make the `kudos` bucket public-readable so feed images render via the
-- public storage URL pattern (`/storage/v1/object/public/kudos/...`).
-- Sender-only RLS read policy is replaced with an authenticated-read policy,
-- since every kudo in the feed is visible to all authenticated users anyway
-- and the existing policy blocked anyone except the sender from viewing
-- attached images. Upload/delete remain owner-only.

update storage.buckets set public = true where id = 'kudos';

drop policy if exists kudos_user_read on storage.objects;

create policy kudos_authenticated_read on storage.objects
  for select to authenticated
  using (bucket_id = 'kudos');
