alter table public.kudo_image
  add column mime text not null default 'image/jpeg'
    check (mime in ('image/jpeg', 'image/png')),
  add column size_bytes int not null default 0
    check (size_bytes between 0 and 5242880);
