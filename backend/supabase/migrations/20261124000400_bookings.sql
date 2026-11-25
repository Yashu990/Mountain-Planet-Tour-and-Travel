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
