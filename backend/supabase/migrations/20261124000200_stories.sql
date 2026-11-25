-- Traveller Stories (from the website's supabase/stories.sql, extended for the app).
--   * anyone can submit a story + upload photos
--   * new stories are hidden until approved (Table Editor → stories → tick "approved")
--   * visitors only read approved stories; a signed-in author can also see their own pending ones
-- Safe to run on a project that already ran the website's stories.sql.

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 60),
  country text check (char_length(country) <= 60),
  trip text check (char_length(trip) <= 120),
  rating int not null default 5 check (rating between 1 and 5),
  story text not null check (char_length(story) between 1 and 2000),
  photos text[] not null default '{}' check (cardinality(photos) <= 6),
  approved boolean not null default false
);

-- New in the app: link a story to its author when they are signed in.
alter table public.stories add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists stories_approved_idx on public.stories (approved, created_at desc);

alter table public.stories enable row level security;

drop policy if exists "read approved stories" on public.stories;
create policy "read approved stories" on public.stories
  for select to anon, authenticated using (approved = true);

drop policy if exists "authors read own stories" on public.stories;
create policy "authors read own stories" on public.stories
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "submit stories for review" on public.stories;
create policy "submit stories for review" on public.stories
  for insert to anon, authenticated
  with check (approved = false and (user_id is null or user_id = (select auth.uid())));

drop policy if exists "authors delete own stories" on public.stories;
create policy "authors delete own stories" on public.stories
  for delete to authenticated using (user_id = (select auth.uid()));

-- Public bucket for story photos (max 5 MB each, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-photos', 'story-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "anyone can upload story photos" on storage.objects;
create policy "anyone can upload story photos" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'story-photos');
