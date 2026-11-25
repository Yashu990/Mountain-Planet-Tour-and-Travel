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
