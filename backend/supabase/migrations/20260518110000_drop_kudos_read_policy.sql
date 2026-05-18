-- Drop the `kudos_authenticated_read` RLS policy added in
-- 20260518090000_kudos_bucket_public_read.sql. It is dead code: that
-- same migration set `storage.buckets.public = true`, which causes
-- `/storage/v1/object/public/kudos/...` to bypass RLS. Keeping the policy
-- around made the security model confusing — anyone with a path can
-- already fetch the bytes, so make that intent explicit by dropping the
-- now-meaningless authenticated-read rule.
--
-- Upload + delete policies (owner-only) remain in place; only the read
-- gate was dead.

drop policy if exists kudos_authenticated_read on storage.objects;
