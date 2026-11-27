-- Partner bookings (phase 3): room calendar (closed days, special prices), live server-side
-- price + availability, booking requests routed to the partner (accept / decline within 2 hours),
-- and the guest's choice of paying in the app or at the property. Commission = partner's %.
--
--  traveller: request_stay_booking ──▶ status 'requested', partner_status 'pending' (2h deadline)
--  partner:   partner_respond(accept) ──▶ pay at property: 'confirmed' · pay in app: 'accepted' (awaiting payment)
--             partner_respond(decline, note) ──▶ 'cancelled' (+ note shown to the traveller)
--  traveller: cancel_booking (existing) frees the rooms again.
-- Prices are always computed here — never sent by the phone.

-- ---------- bookings: partner fields ----------
alter table public.bookings add column if not exists partner_id uuid references public.partners (id) on delete set null;
alter table public.bookings add column if not exists room_id uuid references public.stay_rooms (id) on delete set null;
alter table public.bookings add column if not exists rooms_count int not null default 1 check (rooms_count between 1 and 50);
alter table public.bookings add column if not exists nights int check (nights is null or nights between 1 and 60);
alter table public.bookings add column if not exists total_npr int check (total_npr is null or total_npr >= 0);
alter table public.bookings add column if not exists commission_npr int check (commission_npr is null or commission_npr >= 0);
alter table public.bookings add column if not exists pay_at_property boolean not null default false;
alter table public.bookings add column if not exists partner_status text check (partner_status in ('pending', 'accepted', 'declined'));
alter table public.bookings add column if not exists partner_deadline timestamptz;
alter table public.bookings add column if not exists partner_responded_at timestamptz;
alter table public.bookings add column if not exists partner_note text check (char_length(partner_note) <= 500);
create index if not exists bookings_partner_idx on public.bookings (partner_id, start_date);
create index if not exists bookings_room_dates_idx on public.bookings (room_id, start_date, end_date);

-- ---------- room calendar (only days that differ from the room's normal price / units) ----------
create table if not exists public.room_calendar (
  room_id   uuid not null references public.stay_rooms (id) on delete cascade,
  day       date not null,
  price_npr int check (price_npr is null or price_npr between 100 and 10000000),   -- special price, null = normal price
  closed    boolean not null default false,                                         -- no rooms of this type that night
  primary key (room_id, day)
);
alter table public.room_calendar enable row level security;
grant select on public.room_calendar to anon, authenticated;
grant all on public.room_calendar to service_role;
drop policy if exists "read calendar of visible rooms" on public.room_calendar;
create policy "read calendar of visible rooms" on public.room_calendar for select to anon, authenticated
  using (exists (select 1 from public.stay_rooms r where r.id = room_id));   -- stay_rooms / stays RLS decide

-- Owner of a room (approved partner whose listing it is).
create or replace function public.owns_room(room uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.stay_rooms r where r.id = room and (select public.owns_stay(r.stay_slug)));
$$;
revoke all on function public.owns_room(uuid) from public;
grant execute on function public.owns_room(uuid) to authenticated;

-- Per-night view of a room: effective price, closed, how many already booked, how many it has.
create or replace function public.room_nights(room uuid, check_in date, check_out date)
returns table (day date, price_npr int, closed boolean, booked int, units int)
language sql stable security definer set search_path = '' as $$
  select d::date,
         coalesce(c.price_npr, r.price_npr),
         coalesce(c.closed, false),
         coalesce((select sum(b.rooms_count)::int from public.bookings b
                    where b.room_id = r.id and b.status <> 'cancelled' and b.partner_status is distinct from 'declined'
                      and b.start_date <= d::date and b.end_date > d::date), 0),
         r.units
    from public.stay_rooms r
    cross join generate_series(check_in, check_out - 1, interval '1 day') d
    left join public.room_calendar c on c.room_id = r.id and c.day = d::date
   where r.id = room;
$$;
revoke all on function public.room_nights(uuid, date, date) from public, anon, authenticated;

-- Live quote for travellers: is it free, and what does it cost (server-side price)?
create or replace function public.quote_stay(room uuid, check_in date, check_out date, rooms int default 1)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r record; n int; total int := 0; bad int := 0; nightly jsonb := '[]'::jsonb; x record;
begin
  select sr.*, s.status as stay_status, s.published, s.partner_id into r
    from public.stay_rooms sr join public.stays s on s.slug = sr.stay_slug where sr.id = room;
  if r.id is null or r.partner_id is null or r.stay_status <> 'live' or not r.published then
    return jsonb_build_object('available', false, 'reason', 'This room isn''t available to book right now.');
  end if;
  if check_in is null or check_out is null or check_out <= check_in then
    return jsonb_build_object('available', false, 'reason', 'Please choose check-in and check-out dates.');
  end if;
  if check_in < current_date then return jsonb_build_object('available', false, 'reason', 'Check-in can''t be in the past.'); end if;
  n := check_out - check_in;
  if n > 30 then return jsonb_build_object('available', false, 'reason', 'For stays longer than 30 nights, please contact us.'); end if;
  if rooms < 1 or rooms > r.units then
    return jsonb_build_object('available', false, 'reason', format('This property has %s of this room type.', r.units));
  end if;
  for x in select * from public.room_nights(room, check_in, check_out) loop
    total := total + x.price_npr * rooms;
    nightly := nightly || jsonb_build_object('day', x.day, 'price_npr', x.price_npr);
    if x.closed or x.booked + rooms > x.units then bad := bad + 1; end if;
  end loop;
  if bad > 0 then
    return jsonb_build_object('available', false, 'nights', n, 'reason',
      case when bad = n then 'Fully booked for these dates. Try other dates or another room.'
           else format('Not available on %s of your %s nights. Try other dates or another room.', bad, n) end);
  end if;
  return jsonb_build_object('available', true, 'nights', n, 'rooms', rooms, 'total_npr', total, 'nightly', nightly);
end $$;
revoke all on function public.quote_stay(uuid, date, date, int) from public;
grant execute on function public.quote_stay(uuid, date, date, int) to anon, authenticated;

-- Traveller sends a booking request for a partner room (must be signed in).
create or replace function public.request_stay_booking(
  room uuid, check_in date, check_out date, rooms int, guests int, pay_at_property boolean,
  guest_name text, guest_email text, guest_phone text default null, notes text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); r record; q jsonb; pct numeric; ref text; new_id uuid;
begin
  if uid is null then raise exception 'Please sign in to book.'; end if;
  -- serialise bookings for this room so two people can't take the last room at once
  select sr.*, s.slug as s_slug, s.kind as s_kind, s.city as s_city, s.name as s_name, s.partner_id as s_partner
    into r from public.stay_rooms sr join public.stays s on s.slug = sr.stay_slug where sr.id = room for update of sr;
  if r.id is null then raise exception 'This room isn''t available to book right now.'; end if;
  if guests < 1 or guests > r.max_guests * rooms then
    raise exception 'This room fits up to % guests per room. Add a room or choose a bigger room.', r.max_guests;
  end if;
  q := public.quote_stay(room, check_in, check_out, rooms);
  if not (q->>'available')::boolean then raise exception '%', q->>'reason'; end if;
  select commission_pct into pct from public.partners where id = r.s_partner;
  ref := 'MP-' || upper(left(r.s_kind, 1)) || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
  insert into public.bookings (reference, user_id, kind, name, email, phone, start_date, end_date, location, guests,
                               details, notes, stay_slug, room_id, partner_id, rooms_count, nights, total_npr, commission_npr,
                               pay_at_property, partner_status, partner_deadline, status)
  values (ref, uid, r.s_kind, left(trim(guest_name), 80), lower(trim(guest_email)), nullif(trim(coalesce(guest_phone, '')), ''),
          check_in, check_out, r.s_city, guests,
          jsonb_build_object('stay', r.s_name, 'room', r.name, 'rooms', rooms, 'nights', (q->>'nights')::int,
                             'payment', case when pay_at_property then 'Pay at property' else 'Pay in app' end),
          nullif(left(trim(coalesce(notes, '')), 2000), ''), r.s_slug, room, r.s_partner, rooms, (q->>'nights')::int,
          (q->>'total_npr')::int, round((q->>'total_npr')::int * coalesce(pct, 10) / 100.0)::int,
          coalesce(pay_at_property, false), 'pending', now() + interval '2 hours', 'requested')
  returning id into new_id;
  return jsonb_build_object('id', new_id, 'reference', ref, 'total_npr', (q->>'total_npr')::int, 'nights', (q->>'nights')::int);
end $$;
revoke all on function public.request_stay_booking(uuid, date, date, int, int, boolean, text, text, text, text) from public, anon;
grant execute on function public.request_stay_booking(uuid, date, date, int, int, boolean, text, text, text, text) to authenticated;

-- Partner's own bookings. Guest phone / email only after the partner has accepted.
create or replace function public.partner_bookings()
returns table (id uuid, reference text, status text, partner_status text, partner_deadline timestamptz, created_at timestamptz,
               start_date date, end_date date, nights int, rooms_count int, guests int, room_name text,
               total_npr int, commission_npr int, pay_at_property boolean, guest_name text, guest_email text, guest_phone text,
               notes text, partner_note text)
language sql stable security definer set search_path = '' as $$
  select b.id, b.reference, b.status, b.partner_status, b.partner_deadline, b.created_at, b.start_date, b.end_date, b.nights,
         b.rooms_count, b.guests, coalesce(r.name, b.details->>'room'), b.total_npr, b.commission_npr, b.pay_at_property, b.name,
         case when b.partner_status = 'accepted' then b.email end,
         case when b.partner_status = 'accepted' then b.phone end,
         b.notes, b.partner_note
    from public.bookings b
    join public.partners p on p.id = b.partner_id
    left join public.stay_rooms r on r.id = b.room_id
   where p.owner_id = (select auth.uid()) and p.status = 'approved'
   order by (b.partner_status = 'pending') desc, b.start_date;
$$;
revoke all on function public.partner_bookings() from public, anon;
grant execute on function public.partner_bookings() to authenticated;

create or replace function public.partner_respond(booking uuid, accept boolean, note text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare b record; st text;
begin
  select bk.* into b from public.bookings bk join public.partners p on p.id = bk.partner_id
   where bk.id = booking and p.owner_id = (select auth.uid()) and p.status = 'approved' for update of bk;
  if b.id is null then raise exception 'Booking not found.'; end if;
  if b.partner_status <> 'pending' or b.status <> 'requested' then raise exception 'This booking has already been answered or cancelled.'; end if;
  if not accept and coalesce(trim(note), '') = '' then raise exception 'Please tell the guest why, e.g. “Fully booked that night”.'; end if;
  st := case when not accept then 'cancelled' when b.pay_at_property then 'confirmed' else 'accepted' end;
  update public.bookings
     set partner_status = case when accept then 'accepted' else 'declined' end,
         partner_responded_at = now(), partner_note = nullif(left(trim(coalesce(note, '')), 500), ''), status = st,
         team_note = case when accept then team_note else 'The property couldn’t accept this booking: ' || left(trim(note), 400) end
   where id = b.id;
  return st;
end $$;
revoke all on function public.partner_respond(uuid, boolean, text) from public, anon;
grant execute on function public.partner_respond(uuid, boolean, text) to authenticated;

-- Partner's calendar for one room: every day in the range with price, closed and bookings.
create or replace function public.room_calendar_view(room uuid, from_day date, to_day date)
returns table (day date, price_npr int, closed boolean, booked int, units int, special boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (select public.owns_room(room)) and not (select public.is_admin()) then raise exception 'Not your room.'; end if;
  if to_day - from_day > 400 then raise exception 'Range too long.'; end if;
  return query
    select n.day, n.price_npr, n.closed, n.booked, n.units,
           exists (select 1 from public.room_calendar c where c.room_id = room and c.day = n.day and c.price_npr is not null)
      from public.room_nights(room, from_day, to_day + 1) n;
end $$;
revoke all on function public.room_calendar_view(uuid, date, date) from public, anon;
grant execute on function public.room_calendar_view(uuid, date, date) to authenticated;

-- Partner changes days: open / close, set a special price, or go back to the normal price.
drop function if exists public.set_room_days(uuid, date[], boolean, int, boolean);
create or replace function public.set_room_days(room uuid, days date[], set_closed boolean default null, set_price int default null, reset_price boolean default false)
returns int
language plpgsql security definer set search_path = '' as $$
declare d date; n int := 0;
begin
  if not (select public.owns_room(room)) then raise exception 'Not your room.'; end if;
  if array_length(days, 1) is null or array_length(days, 1) > 400 then raise exception 'Choose between 1 and 400 days.'; end if;
  if set_price is not null and (set_price < 100 or set_price > 10000000) then raise exception 'Price must be at least Rs 100.'; end if;
  foreach d in array days loop
    if d < current_date then continue; end if;
    insert into public.room_calendar as c (room_id, day, price_npr, closed)
    values (room, d, case when reset_price then null else set_price end, coalesce(set_closed, false))
    on conflict (room_id, day) do update
      set price_npr = case when reset_price then null when set_price is not null then set_price else c.price_npr end,
          closed    = coalesce(set_closed, c.closed);
    n := n + 1;
  end loop;
  delete from public.room_calendar rc where rc.room_id = room and rc.price_npr is null and rc.closed = false;  -- tidy: back to normal
  return n;
end $$;
revoke all on function public.set_room_days(uuid, date[], boolean, int, boolean) from public, anon;
grant execute on function public.set_room_days(uuid, date[], boolean, int, boolean) to authenticated;
