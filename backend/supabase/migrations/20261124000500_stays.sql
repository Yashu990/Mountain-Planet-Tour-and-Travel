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
