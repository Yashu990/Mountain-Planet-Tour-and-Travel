-- Extra stay details used by the app's Agoda-style filters.
alter table public.stays add column if not exists star_rating int check (star_rating is null or star_rating between 1 and 5);
alter table public.stays add column if not exists free_cancellation boolean not null default false;
alter table public.stays add column if not exists breakfast_included boolean not null default false;
