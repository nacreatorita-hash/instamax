-- HandyGo Supabase Row Level Security (RLS) Policies
-- Milestone 2 Row Level Security Setup

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.italian_locations enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.professional_categories enable row level security;
alter table public.service_areas enable row level security;
alter table public.company_profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.service_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.job_posts enable row level security;
alter table public.job_applications enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.favorites enable row level security;

-- ========================================================
-- 1. PROFILES POLICIES
-- ========================================================

-- Authenticated users may resolve public rows; column grants expose only the
-- minimal public fields. get_my_profile() returns private fields for auth.uid().
create policy "Allow authenticated profile discovery"
  on public.profiles for select
  using (auth.uid() is not null);

-- Users can update only their own profile
create policy "Allow update for own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ========================================================
-- 2. PROFESSIONAL_PROFILES POLICIES
-- ========================================================

-- Everyone can view professional profiles
create policy "Allow public read for professional profiles"
  on public.professional_profiles for select
  using (true);

-- Users can insert their own professional profile
create policy "Allow insert for own professional profile"
  on public.professional_profiles for insert
  with check (auth.uid() = user_id);

-- Users can update their own professional profile
create policy "Allow update for own professional profile"
  on public.professional_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own professional profile
create policy "Allow delete for own professional profile"
  on public.professional_profiles for delete
  using (auth.uid() = user_id);


-- ========================================================
-- 3. COMPANY_PROFILES POLICIES
-- ========================================================

-- Everyone can view company profiles
create policy "Allow public read for company profiles"
  on public.company_profiles for select
  using (true);

-- Users can insert their own company profile
create policy "Allow insert for own company profile"
  on public.company_profiles for insert
  with check (auth.uid() = user_id);

-- Users can update their own company profile
create policy "Allow update for own company profile"
  on public.company_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Allow delete for own company profile"
  on public.company_profiles for delete
  using (auth.uid() = user_id);


-- ========================================================
-- 4. CANDIDATE_PROFILES POLICIES
-- ========================================================

-- Authenticated users can view candidate profiles
create policy "Allow read for candidates if authenticated"
  on public.candidate_profiles for select
  using (auth.uid() is not null);

-- Users can insert their own candidate profile
create policy "Allow insert for own candidate profile"
  on public.candidate_profiles for insert
  with check (auth.uid() = user_id);

-- Users can update their own candidate profile
create policy "Allow update for own candidate profile"
  on public.candidate_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Allow delete for own candidate profile"
  on public.candidate_profiles for delete
  using (auth.uid() = user_id);


-- ========================================================
-- 5. CATEGORIES POLICIES
-- ========================================================

-- Anyone can read categories
create policy "Allow public read for categories"
  on public.categories for select
  using (true);

-- ========================================================
-- 6. ITALIAN_LOCATIONS POLICIES
-- ========================================================

-- Anyone can read italian locations
create policy "Allow public read for italian_locations"
  on public.italian_locations for select
  using (true);

-- ========================================================
-- 7. SUBSCRIPTIONS POLICIES
-- ========================================================

-- Users can read only their own subscriptions
create policy "Allow select for own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ========================================================
-- Helper policies for supporting tables (Categories, Areas etc)
-- ========================================================

create policy "Allow select for professional categories"
  on public.professional_categories for select using (true);

create policy "Allow insert/update/delete for own professional categories"
  on public.professional_categories for all
  using (
    exists (
      select 1 from public.professional_profiles
      where id = professional_categories.professional_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.professional_profiles
      where id = professional_categories.professional_id and user_id = auth.uid()
    )
  );

create policy "Allow select for service areas"
  on public.service_areas for select using (true);

create policy "Allow insert/update/delete for own service areas"
  on public.service_areas for all
  using (
    exists (
      select 1 from public.professional_profiles
      where id = service_areas.professional_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.professional_profiles
      where id = service_areas.professional_id and user_id = auth.uid()
    )
  );
