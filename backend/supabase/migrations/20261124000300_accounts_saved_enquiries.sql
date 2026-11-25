-- Accounts (profiles), saved trips that sync across devices, and trip enquiries.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 80),
  country     text check (char_length(country) <= 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- saved trips ----------
create table if not exists public.saved_trips (
  user_id    uuid not null references auth.users (id) on delete cascade,
  tour_slug  text not null references public.tours (slug) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tour_slug)
);

alter table public.saved_trips enable row level security;

drop policy if exists "manage own saved trips" on public.saved_trips;
create policy "manage own saved trips" on public.saved_trips
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------- trip enquiries ----------
-- Written only by the submit-enquiry Edge Function (service role), which also emails the team.
-- Signed-in users can read their own enquiries.
create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users (id) on delete set null,
  name        text not null check (char_length(name) between 1 and 80),
  email       text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  country     text check (char_length(country) <= 60),
  start_date  text check (char_length(start_date) <= 60),
  travellers  text check (char_length(travellers) <= 20),
  budget      text check (char_length(budget) <= 40),
  tour_slugs  text[] not null default '{}' check (cardinality(tour_slugs) <= 20),
  message     text check (char_length(message) <= 4000),
  source      text not null default 'app',
  status      text not null default 'new' check (status in ('new', 'replied', 'booked', 'closed')),
  emailed     boolean not null default false
);

create index if not exists enquiries_created_idx on public.enquiries (created_at desc);
create index if not exists enquiries_email_idx on public.enquiries (lower(email), created_at desc);

alter table public.enquiries enable row level security;

drop policy if exists "read own enquiries" on public.enquiries;
create policy "read own enquiries" on public.enquiries for select to authenticated using (user_id = (select auth.uid()));
