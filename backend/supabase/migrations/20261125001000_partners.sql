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
