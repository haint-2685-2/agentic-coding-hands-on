-- Storage bucket + RLS for kudo image uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kudos', 'kudos', false, 5242880, ARRAY['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists kudos_user_upload on storage.objects;
drop policy if exists kudos_user_read on storage.objects;
drop policy if exists kudos_user_delete on storage.objects;

create policy kudos_user_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kudos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy kudos_user_read on storage.objects
  for select to authenticated
  using (bucket_id = 'kudos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy kudos_user_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'kudos' and (storage.foldername(name))[1] = auth.uid()::text);
