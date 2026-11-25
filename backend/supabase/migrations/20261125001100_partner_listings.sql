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
