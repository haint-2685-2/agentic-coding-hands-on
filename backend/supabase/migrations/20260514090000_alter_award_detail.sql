alter table public.award
  add column long_description_vi text not null default '',
  add column long_description_en text not null default '',
  add column long_description_ja text null,
  add column quantity smallint not null default 1 check (quantity between 1 and 100),
  add column unit_type text not null default 'Cá nhân'
    check (unit_type in ('Đơn vị', 'Tập thể', 'Cá nhân', 'Cá nhân hoặc Tập thể')),
  add column value_vnd bigint not null default 0 check (value_vnd >= 0),
  add column value_vnd_team bigint null check (value_vnd_team is null or value_vnd_team > 0);

-- Fill the 6 seeded rows with canonical values from spec.md.
update public.award set
  long_description_vi = 'Top Talent vinh danh các cá nhân xuất sắc trên mọi phương diện trong năm 2025.',
  long_description_en = 'Top Talent recognises individuals excellent across all dimensions in 2025.',
  quantity = 10, unit_type = 'Cá nhân', value_vnd = 7000000
where slug = 'top-talent';

update public.award set
  long_description_vi = 'Top Project trao cho các dự án xuất sắc nhất trong năm.',
  long_description_en = 'Top Project recognises the most outstanding projects of the year.',
  quantity = 2, unit_type = 'Tập thể', value_vnd = 15000000
where slug = 'top-project';

update public.award set
  long_description_vi = 'Top Project Leader trao cho các trưởng dự án xuất sắc.',
  long_description_en = 'Top Project Leader recognises outstanding project leaders.',
  quantity = 3, unit_type = 'Cá nhân', value_vnd = 7000000
where slug = 'top-project-leader';

update public.award set
  long_description_vi = 'Best Manager trao cho quản lý xuất sắc nhất.',
  long_description_en = 'Best Manager recognises the best manager of the year.',
  quantity = 1, unit_type = 'Cá nhân', value_vnd = 10000000
where slug = 'best-manager';

update public.award set
  long_description_vi = 'Signature 2025 - Creator vinh danh tác giả của Signature 2025.',
  long_description_en = 'Signature 2025 - Creator recognises the creator of Signature 2025.',
  quantity = 1, unit_type = 'Cá nhân hoặc Tập thể', value_vnd = 5000000, value_vnd_team = 8000000
where slug = 'signature-2025-creator';

update public.award set
  long_description_vi = 'MVP - Most Valuable Person, người có giá trị nhất trong năm.',
  long_description_en = 'MVP - Most Valuable Person of the year.',
  quantity = 1, unit_type = 'Cá nhân', value_vnd = 15000000
where slug = 'mvp';
