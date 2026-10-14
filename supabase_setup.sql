-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor.
-- Tạo bảng, RLS, bucket ảnh và chính sách truy cập.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  summary text check (summary is null or char_length(summary) <= 500),
  content text not null,
  author text,
  location text,
  source text,
  year_label text,
  image_url text,
  category_id uuid references public.categories(id) on delete restrict,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stories_published_created_idx
  on public.stories (published, created_at desc);
create index if not exists stories_category_idx on public.stories(category_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.stories enable row level security;

drop policy if exists "admins read admin list" on public.admin_users;
create policy "admins read admin list" on public.admin_users
for select to authenticated using (public.is_admin());

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
for select to anon, authenticated using (true);
drop policy if exists "admins insert categories" on public.categories;
create policy "admins insert categories" on public.categories
for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update categories" on public.categories;
create policy "admins update categories" on public.categories
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete categories" on public.categories;
create policy "admins delete categories" on public.categories
for delete to authenticated using (public.is_admin());

drop policy if exists "public read published stories" on public.stories;
create policy "public read published stories" on public.stories
for select to anon, authenticated using (published = true or public.is_admin());
drop policy if exists "admins insert stories" on public.stories;
create policy "admins insert stories" on public.stories
for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update stories" on public.stories;
create policy "admins update stories" on public.stories
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete stories" on public.stories;
create policy "admins delete stories" on public.stories
for delete to authenticated using (public.is_admin());

-- Bucket ảnh công khai để ảnh bìa hiển thị trên website.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-images', 'story-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "public view story images" on storage.objects;
create policy "public view story images" on storage.objects
for select to anon, authenticated using (bucket_id = 'story-images');

drop policy if exists "admins upload story images" on storage.objects;
create policy "admins upload story images" on storage.objects
for insert to authenticated with check (bucket_id = 'story-images' and public.is_admin());

drop policy if exists "admins update story images" on storage.objects;
create policy "admins update story images" on storage.objects
for update to authenticated using (bucket_id = 'story-images' and public.is_admin())
with check (bucket_id = 'story-images' and public.is_admin());

drop policy if exists "admins delete story images" on storage.objects;
create policy "admins delete story images" on storage.objects
for delete to authenticated using (bucket_id = 'story-images' and public.is_admin());

-- Thể loại ban đầu; chạy một lần, có thể sửa sau trong giao diện quản trị.
insert into public.categories(name) values
 ('Truyền thuyết'), ('Cổ tích'), ('Truyện cười'), ('Giai thoại'),
 ('Truyện danh nhân'), ('Truyện giải thích địa danh')
on conflict (name) do nothing;
