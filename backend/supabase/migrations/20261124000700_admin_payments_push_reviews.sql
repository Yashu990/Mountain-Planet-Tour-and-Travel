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
