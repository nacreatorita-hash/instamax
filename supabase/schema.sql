-- HandyGo PostgreSQL Schema (Supabase)
-- Milestone 2 Database Setup

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('client', 'professional', 'company', 'candidate')),
  full_name text not null,
  email text not null,
  phone text null,
  avatar_url text null,
  city text null,
  province text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Categories Table
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text null,
  active boolean default true,
  created_at timestamptz default now()
);

-- 3. Italian Locations Table (Comuni e province)
create table public.italian_locations (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  province text not null,
  region text null,
  active boolean default true,
  unique (city, province)
);

-- 4. Professional Profiles Table
create table public.professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text null,
  vat_number text null,
  bio text null,
  status text default 'not_available' check (status in ('available', 'busy', 'not_available')),
  years_experience integer default 0,
  verified boolean default false,
  rating numeric default 0 check (rating >= 0 and rating <= 5),
  total_reviews integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Professional Categories (Many-to-Many)
create table public.professional_categories (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references public.professional_profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  created_at timestamptz default now(),
  unique (professional_id, category_id)
);

-- 6. Service Areas (Where professionals operate)
create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references public.professional_profiles(id) on delete cascade,
  city text not null,
  province text not null,
  created_at timestamptz default now(),
  unique (professional_id, city, province)
);

-- 7. Company Profiles Table
create table public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  company_name text not null,
  vat_number text null,
  bio text null,
  city text null,
  province text null,
  website text null,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. Candidate Profiles Table
create table public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  main_job_title text null,
  skills text[] default '{}',
  years_experience integer default 0,
  driving_license text null,
  has_car boolean default false,
  available_now boolean default false,
  available_travel boolean default false,
  bio text null,
  cv_url text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. Subscriptions Table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan text default 'free' check (plan in ('free', 'professional_pro', 'company_business', 'candidate_premium')),
  status text default 'active' check (status in ('active', 'cancelled', 'expired')),
  started_at timestamptz default now(),
  expires_at timestamptz null
);


-- === FUTURE MILESTONES SCHEMA (PREPARED BUT NOT USED YET) ===

-- 10. Service Requests Table
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text not null,
  city text not null,
  province text not null,
  urgency text default 'medium',
  status text default 'open', -- open, assigned, completed, cancelled
  created_at timestamptz default now()
);

-- 11. Conversations Table
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (sender_id, recipient_id)
);

-- 12. Messages Table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- 13. Job Posts Table (Offers from Companies)
create table public.job_posts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.company_profiles(id) on delete cascade,
  title text not null,
  description text not null,
  role_type text not null, -- full_time, part_time, contract, internship
  salary_range text null,
  city text not null,
  province text not null,
  created_at timestamptz default now()
);

-- 14. Job Applications Table (Candidates applying)
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.job_posts(id) on delete cascade,
  candidate_id uuid references public.candidate_profiles(id) on delete cascade,
  status text default 'applied', -- applied, interviewing, hired, rejected
  cover_letter text null,
  created_at timestamptz default now(),
  unique (job_id, candidate_id)
);

-- 15. Reviews Table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references public.profiles(id) on delete cascade,
  reviewed_id uuid references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text null,
  created_at timestamptz default now()
);

-- 16. Notifications Table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- 17. Favorites Table
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  favorite_user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, favorite_user_id)
);


-- === INDEXES FOR PERFORMANCE ===
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_city on public.profiles(city);
create index idx_profiles_province on public.profiles(province);
create index idx_categories_slug on public.categories(slug);
create index idx_italian_locations_city on public.italian_locations(city);
create index idx_italian_locations_province on public.italian_locations(province);
create index idx_professional_profiles_user on public.professional_profiles(user_id);
create index idx_professional_profiles_status on public.professional_profiles(status);
create index idx_service_areas_city on public.service_areas(city);
create index idx_service_areas_province on public.service_areas(province);
create index idx_candidate_profiles_title on public.candidate_profiles(main_job_title);
create index idx_candidate_profiles_now on public.candidate_profiles(available_now);

-- Public projection: authenticated users can discover other members without
-- exposing private fields such as email and phone from profiles.
create view public.public_profiles
with (security_invoker = true, security_barrier = true)
as
select id, role, full_name, avatar_url, city, province, created_at
from public.profiles;

revoke all on public.public_profiles from public, anon;
grant select on public.public_profiles to authenticated;

-- Authenticated clients may query only the public columns directly. Private
-- columns are available exclusively through get_my_profile() for auth.uid().
revoke select on public.profiles from anon, authenticated;
grant select (id, role, full_name, avatar_url, city, province, created_at)
on public.profiles to authenticated;

create or replace function public.get_my_profile()
returns public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.profiles where id = auth.uid();
$$;

revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

-- Keep updated_at consistent at database level.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger professional_profiles_set_updated_at before update on public.professional_profiles
for each row execute function public.set_updated_at();
create trigger company_profiles_set_updated_at before update on public.company_profiles
for each row execute function public.set_updated_at();
create trigger candidate_profiles_set_updated_at before update on public.candidate_profiles
for each row execute function public.set_updated_at();

-- Clients must never be able to escalate their role or replace their identity.
create or replace function public.protect_profile_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and current_user in ('anon', 'authenticated') and (
    new.id is distinct from old.id or
    new.role is distinct from old.role or
    new.email is distinct from old.email
  ) then
    raise exception 'id, role and email cannot be changed by the client';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_identity before update on public.profiles
for each row execute function public.protect_profile_identity();

-- Atomic bootstrap for email/password and OAuth users. This runs with elevated
-- privileges after auth.users is created, even when email confirmation is on.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role text;
  selected_name text;
begin
  selected_role := coalesce(new.raw_user_meta_data ->> 'role', 'client');
  if selected_role not in ('client', 'professional', 'company', 'candidate') then
    selected_role := 'client';
  end if;

  selected_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, 'Utente HandyGo'), '@', 1)
  );

  insert into public.profiles (id, role, full_name, email, avatar_url)
  values (
    new.id,
    selected_role,
    selected_name,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  if selected_role = 'professional' then
    insert into public.professional_profiles (user_id) values (new.id);
  elsif selected_role = 'company' then
    insert into public.company_profiles (user_id, company_name)
    values (new.id, selected_name);
  elsif selected_role = 'candidate' then
    insert into public.candidate_profiles (user_id) values (new.id);
  end if;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Google cannot attach arbitrary user metadata before the first OAuth signup.
-- This narrowly-scoped RPC completes the role chosen on the registration screen.
create or replace function public.complete_oauth_onboarding(requested_role text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles;
  auth_provider text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if requested_role not in ('client', 'professional', 'company', 'candidate') then
    raise exception 'invalid role';
  end if;

  select raw_app_meta_data ->> 'provider'
  into auth_provider
  from auth.users
  where id = auth.uid();

  select * into current_profile
  from public.profiles
  where id = auth.uid()
  for update;

  if auth_provider <> 'google' then
    raise exception 'OAuth onboarding is only available for Google accounts';
  end if;
  if current_profile.role <> 'client' or current_profile.created_at < now() - interval '30 minutes' then
    raise exception 'OAuth onboarding window is closed';
  end if;

  if requested_role <> 'client' then
    update public.profiles set role = requested_role where id = auth.uid();
    if requested_role = 'professional' then
      insert into public.professional_profiles (user_id) values (auth.uid()) on conflict (user_id) do nothing;
    elsif requested_role = 'company' then
      insert into public.company_profiles (user_id, company_name)
      values (auth.uid(), current_profile.full_name) on conflict (user_id) do nothing;
    elsif requested_role = 'candidate' then
      insert into public.candidate_profiles (user_id) values (auth.uid()) on conflict (user_id) do nothing;
    end if;
  end if;

  select * into current_profile from public.profiles where id = auth.uid();
  return current_profile;
end;
$$;

revoke all on function public.complete_oauth_onboarding(text) from public, anon;
grant execute on function public.complete_oauth_onboarding(text) to authenticated;
