-- Mountain Planet: complete database setup (all migrations + starter data).
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run again.

-- ===== migrations/20261124000100_content.sql =====
-- Content: tours, guides and destinations shown in the app.
-- Edit these in Supabase → Table Editor; the app picks up changes on next launch.
-- Anyone can read published rows. Only the dashboard / service role can write.

create table if not exists public.tours (
  slug          text primary key check (slug ~ '^[a-z0-9-]+$'),
  title         text not null,
  region        text not null,
  category      text not null check (category in ('Trekking', 'Peak Climbing', 'Culture', 'Wildlife', 'Adventure', 'Heli Tours')),
  days          int  not null check (days > 0),
  price_usd     int  not null check (price_usd >= 0),
  difficulty    text not null check (difficulty in ('Easy', 'Moderate', 'Challenging', 'Strenuous')),
  max_alt_m     int  not null,
  season        text not null default '',
  img           text not null,            -- '/img/ebc.jpg' (bundled in the app) or a full https:// URL
  ratio         numeric not null default 1,
  rating        numeric(2,1) not null default 5 check (rating between 0 and 5),
  reviews       int  not null default 0,
  group_size    text not null default '',
  tags          text[] not null default '{}',
  summary       text not null default '',
  highlights    text[] not null default '{}',
  itinerary     jsonb not null default '[]',  -- [{ "day": "Day 1", "title": "..." }]
  includes      text[] not null default '{}',
  sort_order    int  not null default 0,
  published     boolean not null default true,
  updated_at    timestamptz not null default now()
);

create table if not exists public.guides (
  slug        text primary key check (slug ~ '^[a-z0-9-]+$'),
  title       text not null,
  kicker      text not null default '',
  img         text not null,
  ratio       numeric not null default 1,
  minutes     int  not null default 3,
  intro       text not null default '',
  sections    jsonb not null default '[]',  -- [{ "h": "Heading", "p": "Paragraph" }]
  sort_order  int  not null default 0,
  published   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table if not exists public.destinations (
  slug        text primary key check (slug ~ '^[a-z0-9-]+$'),
  name        text not null unique,
  area        text not null check (area in ('Mountains', 'Culture', 'Wildlife')),
  img         text not null,
  alt         text not null default '',   -- display altitude, e.g. '5,364 m'
  fact        text not null default '',
  best        text not null default '',
  q           text not null default '',   -- keyword used to match tours to this place
  story       text not null default '',
  highlights  text[] not null default '{}',
  sort_order  int  not null default 0,
  published   boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists tours_touch on public.tours;
create trigger tours_touch before update on public.tours for each row execute function public.touch_updated_at();
drop trigger if exists guides_touch on public.guides;
create trigger guides_touch before update on public.guides for each row execute function public.touch_updated_at();
drop trigger if exists destinations_touch on public.destinations;
create trigger destinations_touch before update on public.destinations for each row execute function public.touch_updated_at();

alter table public.tours enable row level security;
alter table public.guides enable row level security;
alter table public.destinations enable row level security;

drop policy if exists "read published tours" on public.tours;
create policy "read published tours" on public.tours for select to anon, authenticated using (published);
drop policy if exists "read published guides" on public.guides;
create policy "read published guides" on public.guides for select to anon, authenticated using (published);
drop policy if exists "read published destinations" on public.destinations;
create policy "read published destinations" on public.destinations for select to anon, authenticated using (published);

create index if not exists tours_order_idx on public.tours (sort_order);
create index if not exists guides_order_idx on public.guides (sort_order);
create index if not exists destinations_order_idx on public.destinations (sort_order);

-- ===== migrations/20261124000200_stories.sql =====
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

-- ===== migrations/20261124000300_accounts_saved_enquiries.sql =====
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

-- ===== migrations/20261124000400_bookings.sql =====
-- Bookings: hotels, homestays, cabs / vehicles, domestic flights and activity tickets.
-- A booking starts as a request; the team checks availability, sets a price (quote_usd) and
-- confirms it from the dashboard. Created only by the create-booking Edge Function.

create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  reference   text not null unique,                 -- shown to the customer, e.g. MP-H-7K3Q9
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  user_id     uuid references auth.users (id) on delete set null,
  kind        text not null check (kind in ('hotel', 'homestay', 'cab', 'flight', 'ticket')),
  status      text not null default 'requested' check (status in ('requested', 'quoted', 'confirmed', 'cancelled', 'completed')),
  -- contact
  name        text not null check (char_length(name) between 1 and 80),
  email       text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text check (char_length(phone) <= 30),
  -- when / where / who
  start_date  date not null,
  end_date    date check (end_date is null or end_date >= start_date),
  start_time  text check (start_time is null or start_time ~ '^\d{2}:\d{2}$'),
  location    text check (char_length(location) <= 120),       -- hotel city, homestay village, pickup point, flight origin, activity
  destination text check (char_length(destination) <= 120),    -- drop-off point, flight destination
  guests      int  not null default 1 check (guests between 1 and 60),
  details     jsonb not null default '{}',                      -- kind-specific choices (rooms, vehicle, comfort level…)
  notes       text check (char_length(notes) <= 2000),
  -- filled in by the team
  quote_usd   int check (quote_usd is null or quote_usd >= 0),
  team_note   text check (char_length(team_note) <= 2000),
  emailed     boolean not null default false
);

create index if not exists bookings_user_idx on public.bookings (user_id, created_at desc);
create index if not exists bookings_status_idx on public.bookings (status, start_date);
create index if not exists bookings_email_idx on public.bookings (lower(email), created_at desc);

drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();

alter table public.bookings enable row level security;

drop policy if exists "read own bookings" on public.bookings;
create policy "read own bookings" on public.bookings for select to authenticated using (user_id = (select auth.uid()));

-- Customers may cancel their own booking while it is still a request or a quote.
-- (A function instead of an UPDATE policy, so no other column can be changed.)
create or replace function public.cancel_booking(booking_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  new_status text;
begin
  update public.bookings
     set status = 'cancelled'
   where id = booking_id
     and user_id = (select auth.uid())
     and status in ('requested', 'quoted')
  returning status into new_status;
  if new_status is null then
    raise exception 'This booking can no longer be cancelled in the app. Please contact our team.';
  end if;
  return new_status;
end $$;

revoke all on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- ===== migrations/20261124000500_stays.sql =====
-- Stays: partner hotels and homestays shown in the app (Stays list + detail with "Reserve").
-- Rows with is_sample = true are placeholders shipped so the screens work out of the box;
-- the app badges them "Sample". Replace them with real partners and delete the samples.

create table if not exists public.stays (
  slug         text primary key check (slug ~ '^[a-z0-9-]+$'),
  kind         text not null check (kind in ('hotel', 'homestay')),
  name         text not null,
  city         text not null,                        -- e.g. Pokhara, Kathmandu, Ghandruk
  address      text not null default '',
  lat          double precision,
  lng          double precision,
  images       text[] not null default '{}',         -- '/img/...' bundled paths or https:// URLs; first is the cover
  rating       numeric(2,1) check (rating is null or rating between 0 and 5),
  reviews      int not null default 0,
  max_guests   int not null default 2 check (max_guests between 1 and 60),
  bedrooms     int not null default 1,
  beds         int not null default 1,
  baths        int not null default 1,
  price_usd_night int check (price_usd_night is null or price_usd_night >= 0),  -- null = price on request
  amenities    text[] not null default '{}',
  description  text not null default '',
  is_sample    boolean not null default false,
  sort_order   int not null default 0,
  published    boolean not null default true,
  updated_at   timestamptz not null default now()
);

drop trigger if exists stays_touch on public.stays;
create trigger stays_touch before update on public.stays for each row execute function public.touch_updated_at();

alter table public.stays enable row level security;
drop policy if exists "read published stays" on public.stays;
create policy "read published stays" on public.stays for select to anon, authenticated using (published);
create index if not exists stays_order_idx on public.stays (kind, sort_order);

-- A stay booking can point at a listing.
alter table public.bookings add column if not exists stay_slug text references public.stays (slug) on delete set null;

-- ===== migrations/20261124000600_stays_filters.sql =====
-- Extra stay details used by the app's Agoda-style filters.
alter table public.stays add column if not exists star_rating int check (star_rating is null or star_rating between 1 and 5);
alter table public.stays add column if not exists free_cancellation boolean not null default false;
alter table public.stays add column if not exists breakfast_included boolean not null default false;

-- ===== migrations/20261124000700_admin_payments_push_reviews.sql =====
-- Admin role, richer profiles, booking acceptance + payments, push tokens, reviews.

-- ---------- profiles: more fields + role ----------
alter table public.profiles add column if not exists phone text check (char_length(phone) <= 30);
alter table public.profiles add column if not exists nationality text check (char_length(nationality) <= 60);
alter table public.profiles add column if not exists currency text not null default 'USD' check (currency in ('USD', 'NPR', 'INR', 'EUR', 'GBP', 'AUD'));
alter table public.profiles add column if not exists role text not null default 'customer' check (role in ('customer', 'admin'));

-- Customers may edit their own profile but never their role.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, country, phone, nationality, currency) on public.profiles to authenticated;

-- Staff check used by policies and functions. Make someone staff in the dashboard:
--   update public.profiles set role = 'admin' where id = '<user id>';
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- bookings: accept + pay ----------
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('requested', 'quoted', 'accepted', 'paid', 'confirmed', 'cancelled', 'completed'));
alter table public.bookings add column if not exists payment_provider text check (payment_provider in ('khalti', 'stripe', 'cash', 'bank'));
alter table public.bookings add column if not exists payment_ref text check (char_length(payment_ref) <= 200);
alter table public.bookings add column if not exists paid_at timestamptz;
alter table public.bookings add column if not exists amount_paid numeric(12,2);
alter table public.bookings add column if not exists amount_currency text;

-- Customer accepts the price the team sent.
create or replace function public.accept_booking(booking_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare s text;
begin
  update public.bookings set status = 'accepted'
   where id = booking_id and user_id = (select auth.uid()) and status = 'quoted' and quote_usd is not null
  returning status into s;
  if s is null then raise exception 'This price can no longer be accepted. Please contact our team.'; end if;
  return s;
end $$;
revoke all on function public.accept_booking(uuid) from public, anon;
grant execute on function public.accept_booking(uuid) to authenticated;

-- Cancelling is also allowed after accepting (before payment).
create or replace function public.cancel_booking(booking_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare new_status text;
begin
  update public.bookings set status = 'cancelled'
   where id = booking_id and user_id = (select auth.uid()) and status in ('requested', 'quoted', 'accepted')
  returning status into new_status;
  if new_status is null then raise exception 'This booking can no longer be cancelled in the app. Please contact our team.'; end if;
  return new_status;
end $$;
revoke all on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- ---------- staff access ----------
drop policy if exists "staff read bookings" on public.bookings;
create policy "staff read bookings" on public.bookings for select to authenticated using ((select public.is_admin()));
drop policy if exists "staff update bookings" on public.bookings;
create policy "staff update bookings" on public.bookings for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "staff read enquiries" on public.enquiries;
create policy "staff read enquiries" on public.enquiries for select to authenticated using ((select public.is_admin()));
drop policy if exists "staff update enquiries" on public.enquiries;
create policy "staff update enquiries" on public.enquiries for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "staff read stories" on public.stories;
create policy "staff read stories" on public.stories for select to authenticated using ((select public.is_admin()));
drop policy if exists "staff update stories" on public.stories;
create policy "staff update stories" on public.stories for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "staff delete stories" on public.stories;
create policy "staff delete stories" on public.stories for delete to authenticated using ((select public.is_admin()));

drop policy if exists "staff read profiles" on public.profiles;
create policy "staff read profiles" on public.profiles for select to authenticated using ((select public.is_admin()));

-- ---------- push notification tokens ----------
create table if not exists public.push_tokens (
  token      text primary key check (char_length(token) <= 200),
  user_id    uuid not null references auth.users (id) on delete cascade,
  platform   text check (platform in ('ios', 'android')),
  created_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;
drop policy if exists "manage own push tokens" on public.push_tokens;
create policy "manage own push tokens" on public.push_tokens for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- reviews ----------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users (id) on delete set null,
  name        text not null check (char_length(name) between 1 and 60),
  country     text check (char_length(country) <= 60),
  tour_slug   text references public.tours (slug) on delete cascade,
  stay_slug   text references public.stays (slug) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  text        text not null check (char_length(text) between 10 and 2000),
  approved    boolean not null default false,
  check (num_nonnulls(tour_slug, stay_slug) = 1)
);
create index if not exists reviews_tour_idx on public.reviews (tour_slug, approved, created_at desc);
create index if not exists reviews_stay_idx on public.reviews (stay_slug, approved, created_at desc);
alter table public.reviews enable row level security;

drop policy if exists "read approved reviews" on public.reviews;
create policy "read approved reviews" on public.reviews for select to anon, authenticated using (approved or user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "write own review" on public.reviews;
create policy "write own review" on public.reviews for insert to authenticated with check (user_id = (select auth.uid()) and approved = false);
drop policy if exists "staff moderate reviews" on public.reviews;
create policy "staff moderate reviews" on public.reviews for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "delete own or staff review" on public.reviews;
create policy "delete own or staff review" on public.reviews for delete to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------- promo codes ----------
create table if not exists public.promo_codes (
  code         text primary key check (code ~ '^[A-Z0-9-]{3,30}$'),
  percent_off  int not null check (percent_off between 1 and 90),
  active       boolean not null default true,
  expires_on   date,
  note         text
);
alter table public.promo_codes enable row level security;  -- no public policies: checked only by the create-booking function
alter table public.bookings add column if not exists promo_code text references public.promo_codes (code) on delete set null;

-- ===== seed.sql =====
-- GENERATED by scripts/generate-seed.ts from mobile/src/data — do not edit by hand.
-- Re-running it upserts the content, so edits made in the dashboard to these rows are overwritten.

insert into public.tours (slug, title, region, category, days, price_usd, difficulty, max_alt_m, season, img, ratio, rating, reviews, group_size, tags, summary, highlights, itinerary, includes, sort_order) values
  ('everest-base-camp-trek', 'Everest Base Camp Trek', 'Everest (Khumbu)', 'Trekking', 14, 1450, 'Challenging', 5545, 'Mar–May · Sep–Dec', '/img/ebc.jpg', 1.45, 4.9, 412, '1–12', array['everest', 'khumbu', 'sherpa', 'kala patthar', 'namche', 'classic', 'iconic', 'bucket list'], 'Walk in the footsteps of legends through Sherpa villages, ancient monasteries and glacial valleys to the foot of the world’s highest mountain — then catch sunrise over Everest from Kala Patthar.', array['Scenic mountain flight to Lukla', 'Namche Bazaar & Tengboche Monastery', 'Sunrise over Everest from Kala Patthar (5,545m)', 'Stand at Everest Base Camp (5,364m)'], '[{"day":"Day 1","title":"Arrive in Kathmandu, welcome dinner"},{"day":"Day 2","title":"Fly to Lukla, trek to Phakding"},{"day":"Day 3–4","title":"Namche Bazaar + acclimatisation hike"},{"day":"Day 5–6","title":"Tengboche → Dingboche"},{"day":"Day 7","title":"Acclimatisation: Nangkartshang Peak"},{"day":"Day 8–9","title":"Lobuche → Gorak Shep → Everest Base Camp"},{"day":"Day 10","title":"Kala Patthar sunrise, descend to Pheriche"},{"day":"Day 11–12","title":"Return via Namche to Lukla"},{"day":"Day 13–14","title":"Fly to Kathmandu, departure"}]'::jsonb, array['Licensed English-speaking guide', 'Porter service (1 per 2 trekkers)', 'Lukla flights', 'Teahouse lodging & 3 meals daily', 'TIMS & national park permits'], 0),
  ('gokyo-lakes-trek', 'Gokyo Lakes & Gokyo Ri', 'Everest (Khumbu)', 'Trekking', 13, 1350, 'Challenging', 5357, 'Mar–May · Sep–Nov', '/img/gokyo.jpg', 0.72, 4.8, 156, '1–12', array['everest', 'lakes', 'turquoise', 'quiet', 'photography', 'glacier'], 'Trade the crowds for turquoise glacial lakes and the widest Himalayan panorama in Khumbu — four 8,000m giants in one view from Gokyo Ri.', array['Six sacred turquoise Gokyo lakes', 'Ngozumpa — Nepal’s longest glacier', 'Everest, Lhotse, Makalu & Cho Oyu from Gokyo Ri', 'Quieter alternative to EBC'], '[{"day":"Day 1–2","title":"Kathmandu → Lukla → Phakding"},{"day":"Day 3–4","title":"Namche Bazaar & acclimatisation"},{"day":"Day 5–7","title":"Dole → Machhermo → Gokyo"},{"day":"Day 8","title":"Gokyo Ri sunrise & fifth lake"},{"day":"Day 9–12","title":"Descend to Lukla"},{"day":"Day 13","title":"Fly to Kathmandu"}]'::jsonb, array['Licensed guide & porter', 'Lukla flights', 'Teahouse lodging & meals', 'All permits'], 1),
  ('everest-three-passes', 'Everest Three High Passes', 'Everest (Khumbu)', 'Trekking', 19, 1990, 'Strenuous', 5535, 'Apr–May · Oct–Nov', '/img/amadablam.jpg', 1.5, 4.9, 74, '2–10', array['everest', 'passes', 'adventure', 'experienced', 'renjo la', 'cho la', 'kongma la', 'ama dablam'], 'The ultimate Khumbu circuit: cross Kongma La, Cho La and Renjo La, linking Everest Base Camp with Gokyo for the most complete Everest experience.', array['Three passes above 5,300m', 'EBC + Kala Patthar + Gokyo Ri', 'Ama Dablam views all the way', 'Remote Lungden & Thame valleys'], '[{"day":"Day 1–4","title":"Kathmandu → Lukla → Namche"},{"day":"Day 5–8","title":"Dingboche, Chhukung & Kongma La"},{"day":"Day 9–11","title":"Everest Base Camp & Kala Patthar"},{"day":"Day 12–14","title":"Cho La pass to Gokyo"},{"day":"Day 15–16","title":"Renjo La to Lungden"},{"day":"Day 17–19","title":"Thame, Lukla, fly out"}]'::jsonb, array['Experienced high-pass guide', 'Porter', 'Flights', 'Lodging & meals', 'Permits & first-aid kit'], 2),
  ('annapurna-base-camp', 'Annapurna Base Camp Trek', 'Annapurna', 'Trekking', 11, 990, 'Moderate', 4130, 'Mar–May · Sep–Dec', '/img/annapurna.jpg', 0.68, 4.9, 288, '1–14', array['annapurna', 'abc', 'sanctuary', 'machhapuchhre', 'hot springs', 'pokhara', 'rhododendron'], 'Hike through rhododendron forests and Gurung villages into the Annapurna Sanctuary — a natural amphitheatre ringed by 7,000–8,000m peaks.', array['360° amphitheatre of Annapurna Sanctuary', 'Machhapuchhre (Fishtail) Base Camp', 'Natural hot springs at Jhinu Danda', 'Gurung culture in Chhomrong'], '[{"day":"Day 1–2","title":"Kathmandu → Pokhara"},{"day":"Day 3–4","title":"Drive to Nayapul, trek via Ghandruk"},{"day":"Day 5–6","title":"Chhomrong → Bamboo → Deurali"},{"day":"Day 7","title":"MBC → Annapurna Base Camp (4,130m)"},{"day":"Day 8–10","title":"Descend to Jhinu hot springs, Pokhara"},{"day":"Day 11","title":"Return to Kathmandu"}]'::jsonb, array['Licensed guide', 'Porter', 'Tourist bus / private transfer', 'Teahouse lodging & meals', 'ACAP & TIMS permits'], 3),
  ('ghorepani-poon-hill', 'Ghorepani Poon Hill Trek', 'Annapurna', 'Trekking', 5, 490, 'Easy', 3210, 'All year (best Oct–Apr)', '/img/poonhill.jpg', 1.4, 4.8, 331, '1–16', array['short', 'easy', 'family', 'beginner', 'sunrise', 'rhododendron', 'annapurna', 'pokhara', 'kids'], 'Nepal’s favourite short trek. Sunrise from Poon Hill lights up Dhaulagiri and Annapurna — perfect for first-timers and families.', array['Sunrise over Dhaulagiri & Annapurna', 'Blooming rhododendron forests (spring)', 'Magar & Gurung villages', 'Only 5 days from Pokhara'], '[{"day":"Day 1","title":"Pokhara → Nayapul → Tikhedhunga"},{"day":"Day 2","title":"Ulleri stone steps → Ghorepani"},{"day":"Day 3","title":"Poon Hill sunrise → Tadapani"},{"day":"Day 4","title":"Ghandruk village"},{"day":"Day 5","title":"Drive back to Pokhara"}]'::jsonb, array['Guide', 'Pokhara transfers', 'Lodging & meals', 'Permits'], 4),
  ('annapurna-circuit', 'Annapurna Circuit & Thorong La', 'Annapurna', 'Trekking', 14, 1190, 'Challenging', 5416, 'Mar–May · Oct–Nov', '/img/bridge.jpg', 1.5, 4.8, 197, '1–12', array['annapurna', 'circuit', 'thorong la', 'manang', 'muktinath', 'classic', 'suspension bridge'], 'One of the world’s great long-distance treks — subtropical valleys to the arid Tibetan plateau, crowned by the 5,416m Thorong La pass.', array['Cross Thorong La (5,416m)', 'Manang & Tilicho views', 'Sacred Muktinath temple', 'Dramatic suspension bridges'], '[{"day":"Day 1–2","title":"Kathmandu → Besisahar → Chame"},{"day":"Day 3–5","title":"Pisang → Manang (acclimatise)"},{"day":"Day 6–8","title":"Yak Kharka → Thorong Phedi"},{"day":"Day 9","title":"Thorong La → Muktinath"},{"day":"Day 10–12","title":"Jomsom, Marpha apple villages"},{"day":"Day 13–14","title":"Fly to Pokhara, Kathmandu"}]'::jsonb, array['Guide & porter', 'Jeep & flight transfers', 'Lodging & meals', 'ACAP & TIMS permits'], 5),
  ('manaslu-circuit', 'Manaslu Circuit Trek', 'Manaslu', 'Trekking', 14, 1690, 'Challenging', 5106, 'Mar–May · Sep–Nov', '/img/manaslu.jpg', 1.35, 4.9, 98, '2–12', array['manaslu', 'remote', 'off the beaten path', 'restricted', 'larkya la', 'tibetan', 'quiet'], 'A wild, restricted-area circuit around the world’s eighth-highest mountain, with Tibetan-Buddhist villages and the dramatic Larkya La pass.', array['Circle Mt. Manaslu (8,163m)', 'Larkya La pass (5,106m)', 'Tibetan villages of Samagaun & Samdo', 'Far fewer trekkers than Annapurna'], '[{"day":"Day 1–2","title":"Kathmandu → Machha Khola"},{"day":"Day 3–6","title":"Jagat → Deng → Namrung"},{"day":"Day 7–9","title":"Samagaun & acclimatisation"},{"day":"Day 10–11","title":"Samdo → Dharamsala"},{"day":"Day 12","title":"Larkya La → Bimthang"},{"day":"Day 13–14","title":"Dharapani → Kathmandu"}]'::jsonb, array['Restricted area permit', 'Licensed guide (mandatory)', 'Porter', 'Lodging & meals', 'Private jeep'], 6),
  ('langtang-valley', 'Langtang Valley Trek', 'Langtang', 'Trekking', 8, 720, 'Moderate', 4984, 'Mar–May · Sep–Dec', '/img/langtang.jpg', 0.7, 4.7, 143, '1–14', array['langtang', 'short', 'close to kathmandu', 'tamang', 'cheese', 'kyanjin', 'glacier'], 'The “valley of glaciers” just a drive from Kathmandu — Tamang heritage, yak-cheese factories and big views from Tserko Ri.', array['No flight needed', 'Kyanjin Gompa monastery', 'Tserko Ri viewpoint (4,984m)', 'Tamang culture & homestays'], '[{"day":"Day 1","title":"Drive to Syabrubesi"},{"day":"Day 2–3","title":"Lama Hotel → Langtang village"},{"day":"Day 4–5","title":"Kyanjin Gompa, Tserko Ri"},{"day":"Day 6–7","title":"Descend to Syabrubesi"},{"day":"Day 8","title":"Drive to Kathmandu"}]'::jsonb, array['Guide & porter', 'Private jeep', 'Lodging & meals', 'Langtang NP permit'], 7),
  ('upper-mustang', 'Upper Mustang — Forbidden Kingdom', 'Mustang', 'Trekking', 14, 2290, 'Moderate', 4010, 'Mar–Nov (great in monsoon)', '/img/mustang.jpg', 1, 4.9, 61, '2–10', array['mustang', 'lo manthang', 'desert', 'tibetan', 'restricted', 'monsoon', 'caves', 'culture'], 'Journey into the walled city of Lo Manthang — a hidden Tibetan kingdom of red cliffs, sky caves and ancient monasteries in the Himalayan rain shadow.', array['Walled city of Lo Manthang', 'Thousand-year-old sky caves', 'Rain-shadow — ideal monsoon trek', 'Tiji festival (May)'], '[{"day":"Day 1–3","title":"Kathmandu → Pokhara → Jomsom → Kagbeni"},{"day":"Day 4–7","title":"Chele → Syangboche → Charang"},{"day":"Day 8–9","title":"Lo Manthang & Chhoser caves"},{"day":"Day 10–12","title":"Ghami → Kagbeni → Jomsom"},{"day":"Day 13–14","title":"Fly to Pokhara, Kathmandu"}]'::jsonb, array['Restricted area permit', 'Guide & porter', 'Jomsom flights', 'Lodging & meals'], 8),
  ('island-peak-climbing', 'Island Peak Climbing (6,189m)', 'Everest (Khumbu)', 'Peak Climbing', 18, 2650, 'Strenuous', 6189, 'Apr–May · Oct–Nov', '/img/climb.jpg', 1.5, 4.9, 84, '2–8', array['climbing', 'summit', '6000', 'imja tse', 'mountaineering', 'expedition', 'ice axe', 'crampons'], 'Your first Himalayan summit. Combine Everest Base Camp with a guided ascent of Imja Tse, including pre-climb training on fixed ropes.', array['Summit a 6,000m+ peak', 'Pre-climb ice & rope training', 'Everest Base Camp included', 'Expert climbing Sherpa 1:2 ratio'], '[{"day":"Day 1–5","title":"Kathmandu → Lukla → Namche → Dingboche"},{"day":"Day 6–10","title":"EBC & Kala Patthar acclimatisation"},{"day":"Day 11–12","title":"Chhukung → Island Peak Base Camp, training"},{"day":"Day 13","title":"Summit day (6,189m)"},{"day":"Day 14–18","title":"Return to Lukla & Kathmandu"}]'::jsonb, array['Climbing permit', 'Climbing Sherpa', 'Group climbing gear', 'Tented base camp', 'Flights & permits'], 9),
  ('everest-heli-tour', 'Everest Helicopter Tour', 'Everest (Khumbu)', 'Heli Tours', 1, 1250, 'Easy', 5545, 'All year (clear mornings)', '/img/heli.jpg', 0.67, 5, 119, '1–5', array['helicopter', 'luxury', 'one day', 'short', 'no trekking', 'breakfast', 'everest view', 'family', 'senior'], 'See Everest up close in a single morning — fly over the Khumbu, land at Kala Patthar and enjoy breakfast with a view at Everest View Hotel.', array['Landing near Kala Patthar', 'Breakfast at Hotel Everest View', 'No trekking required', 'Back in Kathmandu by lunch'], '[{"day":"06:30","title":"Hotel pickup, Kathmandu domestic terminal"},{"day":"07:30","title":"Fly via Lukla over Khumbu Valley"},{"day":"08:30","title":"Photo landing at Kala Patthar"},{"day":"09:15","title":"Breakfast at Everest View Hotel"},{"day":"11:00","title":"Return to Kathmandu"}]'::jsonb, array['Shared or private charter seat', 'Breakfast', 'Hotel transfers', 'National park fee'], 10),
  ('kathmandu-heritage-tour', 'Kathmandu Valley Heritage Tour', 'Kathmandu Valley', 'Culture', 4, 420, 'Easy', 1400, 'All year', '/img/kathmandu.jpg', 1.5, 4.8, 205, '1–20', array['kathmandu', 'unesco', 'stupa', 'boudhanath', 'swayambhu', 'pashupatinath', 'culture', 'temples', 'family', 'city'], 'Seven UNESCO World Heritage sites in one valley — Boudhanath, Swayambhunath, Pashupatinath and the royal Durbar Squares with a local expert guide.', array['Boudhanath & Swayambhunath stupas', 'Evening aarti at Pashupatinath', 'Patan & Kathmandu Durbar Squares', 'Newari cooking experience'], '[{"day":"Day 1","title":"Arrival, Thamel walking tour"},{"day":"Day 2","title":"Swayambhu, Kathmandu Durbar Sq., Patan"},{"day":"Day 3","title":"Pashupatinath & Boudhanath"},{"day":"Day 4","title":"Newari cooking class, departure"}]'::jsonb, array['Heritage guide', 'Private vehicle', '3★/4★ hotel & breakfast', 'All entrance fees'], 11),
  ('bhaktapur-nagarkot', 'Bhaktapur & Nagarkot Sunrise', 'Kathmandu Valley', 'Culture', 2, 180, 'Easy', 2195, 'All year', '/img/bhaktapur.jpg', 1.5, 4.7, 88, '1–15', array['bhaktapur', 'nagarkot', 'sunrise', 'short', 'pottery', 'nyatapola', 'culture', 'weekend'], 'Wander the medieval city of Bhaktapur, try the famous “king curd”, then watch the Himalaya glow at sunrise from Nagarkot.', array['Nyatapola five-tier temple', 'Pottery square workshop', 'Himalayan sunrise at Nagarkot', 'Juju Dhau (king curd) tasting'], '[{"day":"Day 1","title":"Bhaktapur Durbar Square, drive to Nagarkot"},{"day":"Day 2","title":"Sunrise, Changu Narayan hike, return"}]'::jsonb, array['Guide', 'Private car', 'Resort stay with dinner & breakfast', 'Entrance fees'], 12),
  ('chitwan-jungle-safari', 'Chitwan Jungle Safari', 'Chitwan', 'Wildlife', 3, 350, 'Easy', 150, 'Oct–Mar best', '/img/chitwan.jpg', 0.75, 4.8, 176, '1–20', array['chitwan', 'safari', 'rhino', 'tiger', 'jungle', 'wildlife', 'family', 'kids', 'tharu', 'birds'], 'Track one-horned rhinos and Bengal tigers by jeep and canoe in a UNESCO-listed jungle, with Tharu cultural evenings by the river.', array['Jeep safari in Chitwan National Park', 'Canoe ride on the Rapti River', 'Jungle walk with naturalists', 'Tharu stick dance evening'], '[{"day":"Day 1","title":"Drive / fly to Chitwan, Tharu village walk"},{"day":"Day 2","title":"Canoe ride, jungle walk, jeep safari"},{"day":"Day 3","title":"Bird watching, depart"}]'::jsonb, array['Jungle lodge with all meals', 'Naturalist guide', 'Park permits', 'All safari activities'], 13),
  ('pokhara-lakeside-retreat', 'Pokhara Lakeside Retreat', 'Pokhara', 'Culture', 4, 380, 'Easy', 1600, 'All year', '/img/pokhara.jpg', 1, 4.7, 132, '1–20', array['pokhara', 'lake', 'relax', 'honeymoon', 'yoga', 'boating', 'sarangkot', 'family', 'couple'], 'Slow down beside Phewa Lake — boat to Tal Barahi temple, catch sunrise from Sarangkot and unwind with lakeside yoga.', array['Sarangkot sunrise', 'Boating on Phewa Lake', 'World Peace Pagoda', 'Optional yoga & spa'], '[{"day":"Day 1","title":"Fly / drive to Pokhara, lakeside evening"},{"day":"Day 2","title":"Sarangkot sunrise, Peace Pagoda, boating"},{"day":"Day 3","title":"Caves, waterfalls & free afternoon"},{"day":"Day 4","title":"Return to Kathmandu"}]'::jsonb, array['Lakeside hotel & breakfast', 'Private transfers', 'City guide', 'Boat ride'], 14),
  ('pokhara-paragliding', 'Paragliding over Pokhara', 'Pokhara', 'Adventure', 1, 95, 'Easy', 1600, 'Sep–May', '/img/paragliding.jpg', 1.5, 4.9, 264, '1+', array['paragliding', 'adventure', 'adrenaline', 'pokhara', 'one day', 'fly', 'short'], 'Soar from Sarangkot over Phewa Lake with the Annapurnas on the horizon — tandem flights with certified pilots, no experience needed.', array['30-min tandem flight', 'Annapurna & Fishtail views', 'GoPro photos & video', 'Certified pilots'], '[{"day":"Morning","title":"Pickup from Lakeside, drive to Sarangkot"},{"day":"Flight","title":"30 minutes of soaring over Phewa Lake"},{"day":"Landing","title":"Touch down at Lakeside"}]'::jsonb, array['Tandem pilot', 'Insurance', 'Transfers', 'Photos & video'], 15),
  ('trishuli-rafting', 'Trishuli River Rafting', 'Trishuli', 'Adventure', 2, 150, 'Easy', 500, 'Sep–Dec · Mar–May', '/img/rafting.jpg', 1, 4.6, 71, '4–16', array['rafting', 'river', 'adventure', 'camping', 'adrenaline', 'friends', 'weekend'], 'Grade III+ rapids, beach camping and bonfire nights on Nepal’s most popular whitewater river — conveniently en route to Pokhara or Chitwan.', array['Grade III–IV rapids', 'Riverside beach camp', 'Professional river guides', 'Combine with Chitwan or Pokhara'], '[{"day":"Day 1","title":"Drive to Charaudi, raft, beach camp"},{"day":"Day 2","title":"Morning rapids, continue to Pokhara/Chitwan"}]'::jsonb, array['Rafting gear & safety kayaker', 'Camping & meals', 'River guides', 'Transfers'], 16),
  ('lumbini-pilgrimage', 'Lumbini — Birthplace of Buddha', 'Lumbini', 'Culture', 3, 320, 'Easy', 150, 'Oct–Mar', '/img/lumbini.jpg', 1, 4.7, 54, '1–20', array['lumbini', 'buddha', 'pilgrimage', 'spiritual', 'meditation', 'monastery', 'unesco', 'peace'], 'A peaceful pilgrimage to the sacred garden where Siddhartha Gautama was born, with monasteries built by Buddhist nations from around the world.', array['Maya Devi Temple & Ashoka Pillar', 'International monastic zone', 'Morning meditation', 'Tilaurakot ancient palace ruins'], '[{"day":"Day 1","title":"Fly to Bhairahawa, evening at sacred garden"},{"day":"Day 2","title":"Maya Devi temple, monasteries by bicycle"},{"day":"Day 3","title":"Tilaurakot, return"}]'::jsonb, array['Hotel & breakfast', 'Guide', 'Flights', 'Entrance fees'], 17)
on conflict (slug) do update set title = excluded.title, region = excluded.region, category = excluded.category, days = excluded.days, price_usd = excluded.price_usd, difficulty = excluded.difficulty, max_alt_m = excluded.max_alt_m, season = excluded.season, img = excluded.img, ratio = excluded.ratio, rating = excluded.rating, reviews = excluded.reviews, group_size = excluded.group_size, tags = excluded.tags, summary = excluded.summary, highlights = excluded.highlights, itinerary = excluded.itinerary, includes = excluded.includes, sort_order = excluded.sort_order;

insert into public.guides (slug, title, kicker, img, ratio, minutes, intro, sections, sort_order) values
  ('best-time-to-trek-nepal', 'When is the best time to trek in Nepal?', 'Season Guide', '/img/hero.jpg', 0.67, 5, 'Nepal has four distinct trekking seasons. Here is how to pick the right one for the views, crowds and temperatures you prefer.', '[{"h":"Autumn (Sep–Nov) — the classic","p":"Post-monsoon skies are crystal clear, temperatures are mild and festivals like Dashain and Tihar fill villages with colour. It is the busiest season — book flights and lodges early."},{"h":"Spring (Mar–May) — rhododendrons","p":"Forests burst into red and pink rhododendron bloom. Warmer days, slightly hazier afternoons, and Everest expedition season brings energy to Base Camp."},{"h":"Winter (Dec–Feb) — quiet & crisp","p":"Cold at altitude but often very clear. Lower treks like Poon Hill, Langtang and cultural tours are wonderful and trails are peaceful."},{"h":"Monsoon (Jun–Aug) — go to the rain shadow","p":"Lush and green but cloudy in most regions. This is the perfect time for Upper Mustang and other rain-shadow areas north of the Himalaya."}]'::jsonb, 0),
  ('altitude-sickness-guide', 'Altitude sickness: how to stay safe above 3,000m', 'Safety', '/img/people.jpg', 1.45, 4, 'Acute Mountain Sickness (AMS) can affect anyone regardless of fitness. Our itineraries are designed around proven acclimatisation principles.', '[{"h":"Climb high, sleep low","p":"Above 3,000m we aim to raise sleeping altitude by no more than 300–500m per day, with a rest day every 1,000m."},{"h":"Know the symptoms","p":"Headache, nausea, dizziness, fatigue and poor sleep are early signs. Tell your guide immediately — never ascend with symptoms."},{"h":"Hydrate & go slow","p":"Drink 3–4 litres of water daily, avoid alcohol, and walk at a pace where you can still chat. “Bistarai, bistarai” — slowly, slowly."},{"h":"Our safety net","p":"Guides carry pulse oximeters and first-aid kits, and we coordinate helicopter evacuation through your travel insurance if ever needed."}]'::jsonb, 1),
  ('nepal-trekking-permits', 'Nepal visa & trekking permits explained', 'Travel Essentials', '/img/langtang.jpg', 0.9, 3, 'Most nationalities can get a Nepal tourist visa on arrival. Trekking areas then require one or more permits — we arrange all of them for you.', '[{"h":"Tourist visa","p":"Available on arrival at Kathmandu airport and land borders for 15, 30 or 90 days, or online in advance. Bring a passport valid for 6+ months."},{"h":"National park & conservation permits","p":"Everest requires the Sagarmatha National Park permit and Khumbu Pasang Lhamu municipality fee; Annapurna requires the ACAP permit."},{"h":"Restricted area permits","p":"Manaslu, Upper Mustang and some other regions require special permits and must be trekked with a licensed guide and at least two trekkers."},{"h":"We handle it","p":"Send us a passport copy and photo — Mountain Planet Nepal prepares all permits before you arrive."}]'::jsonb, 2)
on conflict (slug) do update set title = excluded.title, kicker = excluded.kicker, img = excluded.img, ratio = excluded.ratio, minutes = excluded.minutes, intro = excluded.intro, sections = excluded.sections, sort_order = excluded.sort_order;

insert into public.destinations (slug, name, area, img, alt, fact, best, q, story, highlights, sort_order) values
  ('everest', 'Everest', 'Mountains', '/img/ebc.jpg', '5,364 m', 'Base camp of the world’s highest peak, reached through Sherpa villages and Tengboche Monastery.', 'Mar–May, Sep–Nov', 'everest', 'Khumbu is the homeland of the Sherpa people and the gateway to the world’s highest mountain. Trails climb from Lukla past Namche Bazaar and Tengboche Monastery to Everest Base Camp at 5,364 m. Tenzing Norgay and Edmund Hillary first reached the summit in 1953.', array['Namche Bazaar, the Sherpa trading town', 'Tengboche Monastery with its Everest backdrop', 'Kala Patthar viewpoint at 5,545 m'], 0),
  ('annapurna', 'Annapurna', 'Mountains', '/img/annapurna.jpg', '4,130 m', 'Annapurna Base Camp sits inside a ring of giant peaks, with teahouses and hot springs on the way.', 'Mar–May, Oct–Nov', 'annapurna', 'The Annapurna Conservation Area is Nepal’s largest protected area, home to Gurung and Thakali villages, rhododendron forests and Annapurna I at 8,091 m. The sanctuary trail ends in a natural amphitheatre of peaks, watched over by Machapuchare, the sacred “Fishtail” mountain.', array['Hot springs at Jhinu Danda', 'Gurung villages such as Ghandruk', 'Machapuchare, a sacred peak closed to summit attempts'], 1),
  ('poon-hill', 'Poon Hill', 'Mountains', '/img/poonhill.jpg', '3,210 m', 'A short trek known for sunrise over Dhaulagiri and Annapurna.', 'Mar–May, Oct–Nov', 'poon hill', 'Poon Hill above Ghorepani is the easiest way to see the big Himalaya. A pre-dawn climb to 3,210 m shows the sun lighting Dhaulagiri (8,167 m) and the Annapurna range, after days walking through rhododendron forest, Nepal’s national flower.', array['Sunrise over Dhaulagiri and Annapurna', 'Rhododendron forests, best in spring', 'Ghorepani and Ghandruk villages'], 2),
  ('langtang', 'Langtang', 'Mountains', '/img/langtang.jpg', '3,870 m', 'Kyanjin Gompa valley, the closest big trek to Kathmandu.', 'Mar–May, Oct–Nov', 'langtang', 'Langtang is the valley closest to Kathmandu and the home of the Tamang people. Trails rise through bamboo and oak forest to Kyanjin Gompa at about 3,870 m. The valley was badly hit by the 2015 earthquake and has been rebuilt, and visiting supports local families.', array['Kyanjin Gompa monastery and yak cheese', 'Tamang culture and hospitality', 'Optional climb of Kyanjin Ri for wider views'], 3),
  ('gokyo-lakes', 'Gokyo Lakes', 'Mountains', '/img/gokyo.jpg', '5,357 m', 'Turquoise glacial lakes and the view from Gokyo Ri.', 'Mar–May, Sep–Nov', 'gokyo', 'Gokyo sits beside a chain of turquoise glacial lakes next to the Ngozumpa Glacier, the longest glacier in Nepal. Climbing Gokyo Ri at 5,357 m rewards you with views of Everest, Lhotse, Makalu and Cho Oyu.', array['Six main turquoise lakes', 'Gokyo Ri sunrise view', 'The Ngozumpa Glacier'], 4),
  ('manaslu', 'Manaslu', 'Mountains', '/img/manaslu.jpg', '5,106 m', 'Larkya La pass on a permit-only circuit around the eighth-highest peak on Earth.', 'Mar–May, Sep–Nov', 'manaslu', 'Manaslu, at 8,163 m the eighth highest mountain in the world, rises above a remote circuit through the Nubri and Tsum valleys and their Tibetan Buddhist villages. It needs a restricted-area permit and a licensed guide, so the trails stay quiet. The Larkya La pass reaches 5,106 m.', array['Samagaun village under the mountain', 'Mani walls and monasteries', 'Crossing Larkya La pass'], 5),
  ('upper-mustang', 'Upper Mustang', 'Mountains', '/img/mustang.jpg', '3,840 m', 'Lo Manthang, a walled Tibetan-style town. A special permit is required.', 'Apr–Oct', 'mustang', 'Upper Mustang was the walled Kingdom of Lo and opened to foreign visitors only in 1992. Its capital, Lo Manthang, sits at about 3,840 m among red cliffs, sky caves and old Tibetan Buddhist monasteries. It lies in the Himalayan rain shadow, so it stays dry in the monsoon.', array['The walled city of Lo Manthang', 'Cave monasteries and sky caves', 'The Kali Gandaki valley'], 6),
  ('kathmandu', 'Kathmandu', 'Culture', '/img/kathmandu.jpg', '1,400 m', 'Boudhanath, Swayambhunath, Pashupatinath and Durbar Square, all UNESCO World Heritage sites.', 'Oct–Nov, Mar–Apr', 'kathmandu', 'Kathmandu Valley holds seven UNESCO World Heritage monument zones within a few kilometres. Boudhanath is one of the largest stupas in the world, Swayambhunath looks over the city from a hilltop, and Pashupatinath is Nepal’s most sacred Hindu temple, on the Bagmati River.', array['Boudhanath stupa at dusk', 'Swayambhunath, the “Monkey Temple”', 'Patan and Kathmandu Durbar Squares'], 7),
  ('bhaktapur', 'Bhaktapur', 'Culture', '/img/bhaktapur.jpg', '1,400 m', 'A medieval Newar city of brick temples, pottery squares and Nyatapola Temple.', 'Oct–Apr', 'bhaktapur', 'Bhaktapur is a medieval Newar city of brick lanes and carved wooden windows. Nyatapola, a five-storey temple built in 1702, towers over Taumadhi Square, and local potters still shape clay by hand. Try juju dhau, the city’s famous “king of curds”.', array['Nyatapola temple', 'Pottery Square', 'Changu Narayan temple nearby'], 8),
  ('pokhara', 'Pokhara', 'Culture', '/img/pokhara.jpg', '822 m', 'Phewa Lake with the Annapurna range behind it. Base for paragliding and rafting.', 'Oct–Apr', 'pokhara', 'Pokhara wraps around Phewa Lake, with Machapuchare and the Annapurna range reflected in its water. Take a boat to the Tal Barahi temple on the island, climb to the World Peace Pagoda, or watch sunrise from Sarangkot.', array['Phewa Lake and Tal Barahi temple', 'Sunrise from Sarangkot', 'Paragliding and boating'], 9),
  ('lumbini', 'Lumbini', 'Culture', '/img/lumbini.jpg', '150 m', 'The birthplace of the Buddha, a UNESCO site with monasteries built by many countries.', 'Oct–Mar', 'lumbini', 'Lumbini is the birthplace of Siddhartha Gautama, the Buddha, and has been a UNESCO World Heritage site since 1997. The Maya Devi Temple marks the spot, beside an Ashoka pillar from the third century BCE and a zone of monasteries built by Buddhist nations.', array['Maya Devi Temple', 'The Ashoka pillar', 'Monastic Zone of international monasteries'], 10),
  ('chitwan', 'Chitwan', 'Wildlife', '/img/chitwan.jpg', '150 m', 'Jungle safaris for one-horned rhinos and Bengal tigers in a UNESCO-listed national park.', 'Oct–Mar', 'chitwan', 'Chitwan, Nepal’s first national park (1973), is a jungle of grassland and sal forest. Safaris can spot one-horned rhinos, deer, gharial crocodiles and, with luck, Bengal tigers. Nearby Tharu villages share stick dance and local food.', array['Jeep and canoe safaris', 'One-horned rhinoceros', 'Tharu stick dance'], 11)
on conflict (slug) do update set name = excluded.name, area = excluded.area, img = excluded.img, alt = excluded.alt, fact = excluded.fact, best = excluded.best, q = excluded.q, story = excluded.story, highlights = excluded.highlights, sort_order = excluded.sort_order;

-- Sample stays (is_sample = true): placeholders until real partner hotels / homestays are added.
insert into public.stays (slug, kind, name, city, address, images, rating, reviews, max_guests, bedrooms, beds, baths, price_usd_night, star_rating, free_cancellation, breakfast_included, amenities, description, is_sample, sort_order) values
  ('sample-lakeside-hotel-pokhara', 'hotel', 'Lakeside hotel, Pokhara', 'Pokhara', 'Lakeside, Pokhara, Gandaki Province', array['/img/pokhara.jpg', '/img/poonhill.jpg', '/img/annapurna.jpg', '/img/paragliding.jpg'], null, 0, 2, 1, 1, 1, null, null, false, true, array['Lake view', 'Breakfast', 'Wi-Fi', 'Airport pickup', 'Hot shower'], 'A calm base by Phewa Lake, a short walk from the boats and cafés, with the Annapurna range on clear mornings. Ideal before or after a trek.', true, 0),
  ('sample-heritage-hotel-kathmandu', 'hotel', 'Heritage hotel, Kathmandu', 'Kathmandu', 'Thamel, Kathmandu, Bagmati Province', array['/img/kathmandu.jpg', '/img/bhaktapur.jpg', '/img/people.jpg'], null, 0, 3, 1, 2, 1, null, null, false, true, array['Breakfast', 'Wi-Fi', 'Airport pickup', 'Luggage storage', 'Rooftop'], 'Walk to Thamel’s gear shops and Durbar Square. We use this kind of stay for arrival nights and trek briefings.', true, 1),
  ('sample-jungle-lodge-chitwan', 'hotel', 'Jungle lodge, Chitwan', 'Chitwan', 'Sauraha, Chitwan, Bagmati Province', array['/img/chitwan.jpg', '/img/rafting.jpg', '/img/people.jpg'], null, 0, 4, 2, 2, 1, null, null, false, true, array['All meals', 'Safari desk', 'Garden', 'Wi-Fi'], 'Wake up near the edge of Chitwan National Park, with jeep and canoe safaris arranged from the lodge.', true, 2),
  ('sample-gurung-homestay-ghandruk', 'homestay', 'Gurung family homestay, Ghandruk', 'Ghandruk', 'Ghandruk, Kaski, Gandaki Province', array['/img/annapurna.jpg', '/img/people.jpg', '/img/poonhill.jpg'], null, 0, 4, 2, 3, 1, null, null, false, true, array['Home-cooked dal bhat', 'Mountain view', 'Cultural evening', 'Hot shower'], 'Stay with a Gurung family in a stone-roofed village on the Annapurna trails. Meals are cooked at home and shared with the family.', true, 3),
  ('sample-newar-homestay-bhaktapur', 'homestay', 'Newar homestay, Bhaktapur', 'Bhaktapur', 'Old town, Bhaktapur, Bagmati Province', array['/img/bhaktapur.jpg', '/img/kathmandu.jpg'], null, 0, 2, 1, 1, 1, null, null, false, true, array['Breakfast', 'Old-town location', 'Cooking class on request'], 'A brick townhouse in the medieval old town, minutes from Nyatapola temple and Pottery Square.', true, 4),
  ('sample-tamang-homestay-langtang', 'homestay', 'Tamang homestay, Langtang', 'Langtang', 'Tamang Heritage Trail, Rasuwa, Bagmati Province', array['/img/langtang.jpg', '/img/people.jpg', '/img/bridge.jpg'], null, 0, 3, 1, 2, 1, null, null, false, true, array['All meals', 'Mountain view', 'Local guide on request'], 'Family-run rooms in a Tamang village close to Kathmandu. Staying here supports the community rebuilding after 2015.', true, 5)
on conflict (slug) do update set kind = excluded.kind, name = excluded.name, city = excluded.city, address = excluded.address, images = excluded.images, rating = excluded.rating, reviews = excluded.reviews, max_guests = excluded.max_guests, bedrooms = excluded.bedrooms, beds = excluded.beds, baths = excluded.baths, price_usd_night = excluded.price_usd_night, star_rating = excluded.star_rating, free_cancellation = excluded.free_cancellation, breakfast_included = excluded.breakfast_included, amenities = excluded.amenities, description = excluded.description, is_sample = excluded.is_sample, sort_order = excluded.sort_order;

-- ===== migrations/20261125000800_api_grants.sql =====
-- Give the app's roles access to the tables (newer Supabase projects no longer do this
-- automatically). Row Level Security on every table still decides WHICH rows each user
-- can see or change — these grants only make the tables reachable through the API.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;

-- Re-apply the profile rule: customers may edit their own profile, never their role.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, country, phone, nationality, currency) on public.profiles to authenticated;

-- ===== migrations/20261125000900_profile_photos.sql =====
-- Profile photos: an avatar_url on profiles and an `avatars` bucket where each user may only
-- write inside their own folder (avatars/<user id>/...). Photos are public so the app can show them.

alter table public.profiles add column if not exists avatar_url text check (char_length(avatar_url) <= 500);
grant update (avatar_url) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "users read own avatar files" on storage.objects;
create policy "users read own avatar files" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ===== migrations/20261125001000_partners.sql =====
-- Partner onboarding (phase 1): hotels and homestays apply, upload verification documents into a
-- PRIVATE bucket, accept the partner agreement, and staff approve or reject them.
--
--   draft ──submit──▶ submitted ──staff──▶ approved
--     ▲                   │
--     └──── edit ◀── rejected (with reason)
--
-- A partner can edit their own application only while it is draft or rejected, can never change
-- its status, commission or review fields, and can never see another partner's data or documents.

create table if not exists public.partners (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null unique references auth.users (id) on delete cascade,
  kind                text not null check (kind in ('hotel', 'homestay', 'cab', 'trek')),
  status              text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected', 'suspended')),
  -- business
  business_name       text not null check (char_length(business_name) between 2 and 120),
  owner_name          text check (char_length(owner_name) <= 80),
  email               text check (char_length(email) <= 200),
  phone               text check (char_length(phone) <= 30),
  whatsapp            text check (char_length(whatsapp) <= 30),
  city                text check (char_length(city) <= 80),
  address             text check (char_length(address) <= 300),
  pan_vat             text check (char_length(pan_vat) <= 30),
  rooms_count         int check (rooms_count is null or rooms_count between 1 and 2000),
  about               text check (char_length(about) <= 2000),
  -- payouts
  bank_name           text check (char_length(bank_name) <= 120),
  bank_account_name   text check (char_length(bank_account_name) <= 120),
  bank_account_number text check (char_length(bank_account_number) <= 40),
  bank_branch         text check (char_length(bank_branch) <= 120),
  -- agreement + review (set by functions / staff only)
  commission_pct      numeric(5,2) not null default 10 check (commission_pct between 0 and 50),
  agreement_version   text,
  agreement_accepted_at timestamptz,
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  reviewed_by         uuid references auth.users (id) on delete set null,
  review_note         text check (char_length(review_note) <= 1000),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists partners_status_idx on public.partners (status, submitted_at desc);
drop trigger if exists partners_touch on public.partners;
create trigger partners_touch before update on public.partners for each row execute function public.touch_updated_at();

create table if not exists public.partner_documents (
  id          uuid primary key default gen_random_uuid(),
  partner_id  uuid not null references public.partners (id) on delete cascade,
  doc_type    text not null check (doc_type in ('owner_id', 'pan_vat', 'company_registration', 'tourism_license', 'homestay_registration', 'bank_proof', 'property_photo', 'other')),
  path        text not null,             -- partner-docs/<owner id>/<file>
  file_name   text check (char_length(file_name) <= 200),
  mime        text check (char_length(mime) <= 80),
  created_at  timestamptz not null default now()
);
create index if not exists partner_documents_partner_idx on public.partner_documents (partner_id, doc_type);

alter table public.partners enable row level security;
alter table public.partner_documents enable row level security;

-- Grants (newer projects don't add them automatically). Partners may only write business fields.
grant select, insert, delete on public.partners to authenticated;
revoke update on public.partners from anon, authenticated;
grant update (kind, business_name, owner_name, email, phone, whatsapp, city, address, pan_vat, rooms_count, about,
              bank_name, bank_account_name, bank_account_number, bank_branch) on public.partners to authenticated;
grant select, insert, delete on public.partner_documents to authenticated;
grant all on public.partners, public.partner_documents to service_role;

-- partners: owner reads own; staff read all
drop policy if exists "partner reads own" on public.partners;
create policy "partner reads own" on public.partners for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));
-- owner creates their (single) application as a draft
drop policy if exists "partner creates draft" on public.partners;
create policy "partner creates draft" on public.partners for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'draft' and commission_pct = 10 and agreement_accepted_at is null and reviewed_at is null);
-- owner edits only while draft / rejected (column grants stop status & review changes)
drop policy if exists "partner edits draft" on public.partners;
create policy "partner edits draft" on public.partners for update to authenticated
  using (owner_id = (select auth.uid()) and status in ('draft', 'rejected'))
  with check (owner_id = (select auth.uid()) and status in ('draft', 'rejected'));
-- staff may correct business details; status / commission / review changes go through review_partner()
drop policy if exists "staff manage partners" on public.partners;
create policy "staff manage partners" on public.partners for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- documents: owner manages own while draft/rejected; staff read all
drop policy if exists "partner reads own docs" on public.partner_documents;
create policy "partner reads own docs" on public.partner_documents for select to authenticated
  using ((select public.is_admin()) or exists (select 1 from public.partners p where p.id = partner_id and p.owner_id = (select auth.uid())));
drop policy if exists "partner adds docs" on public.partner_documents;
create policy "partner adds docs" on public.partner_documents for insert to authenticated
  with check (exists (select 1 from public.partners p where p.id = partner_id and p.owner_id = (select auth.uid()) and p.status in ('draft', 'rejected'))
              and split_part(path, '/', 1) = (select auth.uid())::text);
drop policy if exists "partner removes docs" on public.partner_documents;
create policy "partner removes docs" on public.partner_documents for delete to authenticated
  using (exists (select 1 from public.partners p where p.id = partner_id and p.owner_id = (select auth.uid()) and p.status in ('draft', 'rejected')));

-- Submit: checks the required pieces, records the agreement, moves to 'submitted'.
create or replace function public.submit_partner_application(agreement text) returns text
language plpgsql security definer set search_path = '' as $$
declare p public.partners;
begin
  select * into p from public.partners where owner_id = (select auth.uid());
  if p.id is null then raise exception 'Please fill in your business details first.'; end if;
  if p.status not in ('draft', 'rejected') then raise exception 'This application has already been sent.'; end if;
  if coalesce(p.phone, '') = '' or coalesce(p.city, '') = '' or coalesce(p.address, '') = '' then
    raise exception 'Please add your phone number, city and address.'; end if;
  if coalesce(p.bank_account_number, '') = '' or coalesce(p.bank_name, '') = '' or coalesce(p.bank_account_name, '') = '' then
    raise exception 'Please add your bank details so we can pay you.'; end if;
  if not exists (select 1 from public.partner_documents where partner_id = p.id and doc_type = 'owner_id') then
    raise exception 'Please upload the owner''s citizenship or passport.'; end if;
  if not exists (select 1 from public.partner_documents where partner_id = p.id and doc_type = 'pan_vat') then
    raise exception 'Please upload your PAN / VAT certificate.'; end if;
  if p.kind = 'hotel' and not exists (select 1 from public.partner_documents where partner_id = p.id and doc_type in ('company_registration', 'tourism_license')) then
    raise exception 'Please upload your company registration or tourism licence.'; end if;
  if p.kind = 'homestay' and not exists (select 1 from public.partner_documents where partner_id = p.id and doc_type = 'homestay_registration') then
    raise exception 'Please upload your homestay registration.'; end if;
  if not exists (select 1 from public.partner_documents where partner_id = p.id and doc_type = 'property_photo') then
    raise exception 'Please add at least one photo of your property.'; end if;
  update public.partners
     set status = 'submitted', submitted_at = now(), agreement_version = left(agreement, 40), agreement_accepted_at = now(), review_note = null
   where id = p.id;
  return 'submitted';
end $$;
revoke all on function public.submit_partner_application(text) from public, anon;
grant execute on function public.submit_partner_application(text) to authenticated;

-- Staff decision. Rejections need a reason the partner will see.
create or replace function public.review_partner(partner_id uuid, decision text, note text default null) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.is_admin()) then raise exception 'Staff only.'; end if;
  if decision not in ('approved', 'rejected', 'suspended') then raise exception 'Unknown decision.'; end if;
  if decision = 'rejected' and coalesce(trim(note), '') = '' then raise exception 'Please give a reason so the partner can fix it.'; end if;
  update public.partners set status = decision, reviewed_at = now(), reviewed_by = (select auth.uid()), review_note = nullif(trim(note), '')
   where id = partner_id;
  if not found then raise exception 'Partner not found.'; end if;
  return decision;
end $$;
revoke all on function public.review_partner(uuid, text, text) from public, anon;
grant execute on function public.review_partner(uuid, text, text) to authenticated;

-- Private bucket for verification documents (never public; staff open them with signed links).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('partner-docs', 'partner-docs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "partners upload own docs" on storage.objects;
create policy "partners upload own docs" on storage.objects for insert to authenticated
  with check (bucket_id = 'partner-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "partners read own docs, staff read all" on storage.objects;
create policy "partners read own docs, staff read all" on storage.objects for select to authenticated
  using (bucket_id = 'partner-docs' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
drop policy if exists "partners delete own docs" on storage.objects;
create policy "partners delete own docs" on storage.objects for delete to authenticated
  using (bucket_id = 'partner-docs' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ===== migrations/20261125001100_partner_listings.sql =====
-- Partner listings (phase 2): an approved partner creates their hotel / homestay as a `stays` row,
-- adds room types with NPR prices and photos, and sends it for review. Staff approve → it is live.
--
--   draft ──submit──▶ pending ──staff──▶ live ⇄ paused (partner)
--     ▲                  │
--     └──── edit ◀── rejected (with note)
--
-- Existing rows (our samples / own listings) have no partner and keep showing as before.

-- ---------- stays: partner fields ----------
alter table public.stays add column if not exists partner_id uuid references public.partners (id) on delete cascade;
alter table public.stays add column if not exists status text not null default 'live' check (status in ('draft', 'pending', 'live', 'rejected', 'paused'));
alter table public.stays add column if not exists review_note text check (char_length(review_note) <= 1000);
alter table public.stays add column if not exists submitted_at timestamptz;
alter table public.stays add column if not exists reviewed_at timestamptz;
alter table public.stays add column if not exists check_in_time text check (check_in_time is null or check_in_time ~ '^\d{2}:\d{2}$');
alter table public.stays add column if not exists check_out_time text check (check_out_time is null or check_out_time ~ '^\d{2}:\d{2}$');
alter table public.stays add column if not exists house_rules text check (char_length(house_rules) <= 2000);
alter table public.stays add column if not exists price_from_npr int check (price_from_npr is null or price_from_npr >= 0);
create index if not exists stays_partner_idx on public.stays (partner_id);
create index if not exists stays_status_idx on public.stays (status, submitted_at desc);

-- One listing per partner for now (a partner = one property).
create unique index if not exists stays_one_per_partner on public.stays (partner_id) where partner_id is not null;

-- ---------- rooms ----------
create table if not exists public.stay_rooms (
  id                 uuid primary key default gen_random_uuid(),
  stay_slug          text not null references public.stays (slug) on delete cascade on update cascade,
  name               text not null check (char_length(name) between 2 and 80),     -- e.g. "Deluxe lake-view double"
  description        text check (char_length(description) <= 1000),
  max_guests         int not null default 2 check (max_guests between 1 and 20),
  beds               text check (char_length(beds) <= 80),                            -- e.g. "1 double bed"
  units              int not null default 1 check (units between 1 and 500),         -- how many rooms of this type
  price_npr          int not null check (price_npr between 100 and 10000000),        -- per room per night
  breakfast_included boolean not null default false,
  amenities          text[] not null default '{}',
  images             text[] not null default '{}',
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists stay_rooms_stay_idx on public.stay_rooms (stay_slug, sort_order);
drop trigger if exists stay_rooms_touch on public.stay_rooms;
create trigger stay_rooms_touch before update on public.stay_rooms for each row execute function public.touch_updated_at();

-- Keep the listing's "from" price and guest capacity in step with its rooms.
create or replace function public.sync_stay_from_rooms() returns trigger
language plpgsql security definer set search_path = '' as $$
declare s text := coalesce(new.stay_slug, old.stay_slug);
begin
  update public.stays st
     set price_from_npr = (select min(price_npr) from public.stay_rooms r where r.stay_slug = s),
         max_guests     = greatest(1, coalesce((select max(max_guests) from public.stay_rooms r where r.stay_slug = s), st.max_guests)),
         breakfast_included = coalesce((select bool_or(breakfast_included) from public.stay_rooms r where r.stay_slug = s), st.breakfast_included)
   where st.slug = s and st.partner_id is not null;
  return null;
end $$;
drop trigger if exists stay_rooms_sync on public.stay_rooms;
create trigger stay_rooms_sync after insert or update or delete on public.stay_rooms for each row execute function public.sync_stay_from_rooms();

-- ---------- who owns what ----------
create or replace function public.owns_stay(stay text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.stays s join public.partners p on p.id = s.partner_id
     where s.slug = stay and p.owner_id = (select auth.uid()) and p.status = 'approved'
  );
$$;
revoke all on function public.owns_stay(text) from public;
grant execute on function public.owns_stay(text) to authenticated;

-- ---------- stays policies ----------
alter table public.stay_rooms enable row level security;

-- Public: our own stays as before, partner stays only when live.
drop policy if exists "read published stays" on public.stays;
create policy "read published stays" on public.stays for select to anon, authenticated
  using (published and (partner_id is null or status = 'live'));
drop policy if exists "partner reads own stay" on public.stays;
create policy "partner reads own stay" on public.stays for select to authenticated
  using (partner_id in (select id from public.partners where owner_id = (select auth.uid())) or (select public.is_admin()));

-- An approved partner creates one draft listing for their own partner record.
drop policy if exists "partner creates listing" on public.stays;
create policy "partner creates listing" on public.stays for insert to authenticated
  with check (
    partner_id in (select id from public.partners where owner_id = (select auth.uid()) and status = 'approved')
    and status = 'draft' and is_sample = false and rating is null and reviews = 0
  );
-- Partners edit their listing's content (columns limited below); status changes go through functions.
drop policy if exists "partner edits listing" on public.stays;
create policy "partner edits listing" on public.stays for update to authenticated
  using ((select public.owns_stay(slug))) with check ((select public.owns_stay(slug)));
drop policy if exists "staff manage stays" on public.stays;
create policy "staff manage stays" on public.stays for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke insert, update, delete on public.stays from anon, authenticated;
grant insert (slug, partner_id, kind, name, city, address, lat, lng, images, description, amenities, star_rating, free_cancellation,
              breakfast_included, check_in_time, check_out_time, house_rules, bedrooms, beds, baths, max_guests, status, published, is_sample)
  on public.stays to authenticated;
grant update (name, city, address, lat, lng, images, description, amenities, star_rating, free_cancellation,
              check_in_time, check_out_time, house_rules, bedrooms, beds, baths)
  on public.stays to authenticated;

-- ---------- rooms policies ----------
grant select on public.stay_rooms to anon, authenticated;
grant insert, update, delete on public.stay_rooms to authenticated;
grant all on public.stay_rooms to service_role;

drop policy if exists "read rooms of visible stays" on public.stay_rooms;
create policy "read rooms of visible stays" on public.stay_rooms for select to anon, authenticated
  using (exists (select 1 from public.stays s where s.slug = stay_slug));   -- stays RLS decides visibility
drop policy if exists "partner manages own rooms" on public.stay_rooms;
create policy "partner manages own rooms" on public.stay_rooms for all to authenticated
  using ((select public.owns_stay(stay_slug))) with check ((select public.owns_stay(stay_slug)));
drop policy if exists "staff manage rooms" on public.stay_rooms;
create policy "staff manage rooms" on public.stay_rooms for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- status changes ----------
create or replace function public.submit_listing(stay text) returns text
language plpgsql security definer set search_path = '' as $$
declare s public.stays;
begin
  if not (select public.owns_stay(stay)) then raise exception 'This listing is not yours.'; end if;
  select * into s from public.stays where slug = stay;
  if s.status not in ('draft', 'rejected') then raise exception 'This listing has already been sent.'; end if;
  if coalesce(array_length(s.images, 1), 0) < 3 then raise exception 'Please add at least 3 photos of your property.'; end if;
  if char_length(coalesce(s.description, '')) < 40 then raise exception 'Please describe your property in a few sentences (at least 40 characters).'; end if;
  if not exists (select 1 from public.stay_rooms where stay_slug = stay) then raise exception 'Please add at least one room with its price.'; end if;
  update public.stays set status = 'pending', submitted_at = now(), review_note = null where slug = stay;
  return 'pending';
end $$;
revoke all on function public.submit_listing(text) from public, anon;
grant execute on function public.submit_listing(text) to authenticated;

-- Partner pauses / resumes a live listing (e.g. closed for the season).
create or replace function public.set_listing_paused(stay text, paused boolean) returns text
language plpgsql security definer set search_path = '' as $$
declare st text;
begin
  if not (select public.owns_stay(stay)) then raise exception 'This listing is not yours.'; end if;
  update public.stays set status = case when paused then 'paused' else 'live' end
   where slug = stay and status = case when paused then 'live' else 'paused' end
  returning status into st;
  if st is null then raise exception 'Only a live listing can be paused, and only a paused one resumed.'; end if;
  return st;
end $$;
revoke all on function public.set_listing_paused(text, boolean) from public, anon;
grant execute on function public.set_listing_paused(text, boolean) to authenticated;

create or replace function public.review_listing(stay text, decision text, note text default null) returns text
language plpgsql security definer set search_path = '' as $$
begin
  if not (select public.is_admin()) then raise exception 'Staff only.'; end if;
  if decision not in ('live', 'rejected', 'paused') then raise exception 'Unknown decision.'; end if;
  if decision = 'rejected' and coalesce(trim(note), '') = '' then raise exception 'Please tell the partner what to change.'; end if;
  update public.stays set status = decision, published = true, reviewed_at = now(), review_note = nullif(trim(note), '')
   where slug = stay and partner_id is not null;
  if not found then raise exception 'Listing not found.'; end if;
  return decision;
end $$;
revoke all on function public.review_listing(text, text, text) from public, anon;
grant execute on function public.review_listing(text, text, text) to authenticated;

-- ---------- listing photos (public, but only the owner writes into their folder) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "partners upload listing photos" on storage.objects;
create policy "partners upload listing photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
              and exists (select 1 from public.partners where owner_id = (select auth.uid()) and status = 'approved'));
drop policy if exists "partners read own listing photos" on storage.objects;
create policy "partners read own listing photos" on storage.objects for select to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "partners delete own listing photos" on storage.objects;
create policy "partners delete own listing photos" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
