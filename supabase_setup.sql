-- Chạy toàn bộ trong Supabase > SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.admin_users(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table if not exists public.stories(id uuid primary key default gen_random_uuid(), title text not null, category text not null, summary text not null default '', content text not null, image_url text, image_path text, is_featured boolean not null default false, is_published boolean not null default false, author_name text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists stories_published_created_idx on public.stories(is_published,created_at desc);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admin_users where user_id=(select auth.uid())); $$;
alter table public.admin_users enable row level security;
alter table public.stories enable row level security;
drop policy if exists "admins can read own admin row" on public.admin_users;
create policy "admins can read own admin row" on public.admin_users for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "public can read published stories" on public.stories;
create policy "public can read published stories" on public.stories for select to anon,authenticated using(is_published=true or public.is_admin());
drop policy if exists "admins can insert stories" on public.stories;
create policy "admins can insert stories" on public.stories for insert to authenticated with check(public.is_admin());
drop policy if exists "admins can update stories" on public.stories;
create policy "admins can update stories" on public.stories for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admins can delete stories" on public.stories;
create policy "admins can delete stories" on public.stories for delete to authenticated using(public.is_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('story-images','story-images',true,5242880,array['image/jpeg','image/png','image/webp','image/gif']) on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];
drop policy if exists "public can view story images" on storage.objects;
create policy "public can view story images" on storage.objects for select to anon,authenticated using(bucket_id='story-images');
drop policy if exists "admins can upload story images" on storage.objects;
create policy "admins can upload story images" on storage.objects for insert to authenticated with check(bucket_id='story-images' and public.is_admin());
drop policy if exists "admins can update story images" on storage.objects;
create policy "admins can update story images" on storage.objects for update to authenticated using(bucket_id='story-images' and public.is_admin()) with check(bucket_id='story-images' and public.is_admin());
drop policy if exists "admins can delete story images" on storage.objects;
create policy "admins can delete story images" on storage.objects for delete to authenticated using(bucket_id='story-images' and public.is_admin());
-- Tạo tài khoản tại Authentication > Users, sau đó cấp quyền bằng UID:
-- insert into public.admin_users(user_id) values('UID-THUC-TE') on conflict do nothing;
