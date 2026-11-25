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
