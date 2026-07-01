-- ISTAT municipality codes: gradual migration with legacy city/province fallback.
begin;

alter table public.profiles add column if not exists municipality_code text, add column if not exists province_code text;
alter table public.service_requests add column if not exists municipality_code text, add column if not exists province_code text;
alter table public.service_areas add column if not exists municipality_code text, add column if not exists province_code text;
alter table public.company_service_areas add column if not exists municipality_code text, add column if not exists province_code text;
alter table public.job_posts add column if not exists municipality_code text, add column if not exists province_code text;
alter table public.candidate_profiles add column if not exists municipality_code text, add column if not exists province_code text;
alter table public.italian_locations add column if not exists municipality_code text, add column if not exists province_code text;

create index if not exists idx_profiles_municipality_code on public.profiles(municipality_code);
create index if not exists idx_service_requests_match_code on public.service_requests(municipality_code, category_id, status);
create index if not exists idx_service_areas_municipality_code on public.service_areas(municipality_code);
create index if not exists idx_company_service_areas_municipality_code on public.company_service_areas(municipality_code);
create index if not exists idx_job_posts_municipality_code on public.job_posts(municipality_code);
create index if not exists idx_candidate_profiles_municipality_code on public.candidate_profiles(municipality_code);
create unique index if not exists service_areas_professional_municipality_unique
  on public.service_areas(professional_id, municipality_code) where municipality_code is not null;
create unique index if not exists company_areas_company_municipality_unique
  on public.company_service_areas(company_id, municipality_code) where municipality_code is not null;
create unique index if not exists italian_locations_municipality_code_unique
  on public.italian_locations(municipality_code) where municipality_code is not null;

create table if not exists public.municipality_migration_issues (
  id bigint generated always as identity primary key,
  source_table text not null,
  source_id text not null,
  city text,
  province text,
  reason text not null default 'Nessuna corrispondenza ISTAT univoca',
  created_at timestamptz not null default now(),
  unique(source_table, source_id)
);
alter table public.municipality_migration_issues enable row level security;

create or replace function public.remember_selected_municipality()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.municipality_code is not null and new.city is not null and new.province is not null then
    insert into public.italian_locations(city, province, region, active, municipality_code, province_code)
    values(new.city, new.province, null, true, new.municipality_code, new.province_code)
    on conflict(municipality_code) where municipality_code is not null do update set
      city=excluded.city, province=excluded.province, province_code=excluded.province_code, active=true;
  end if;
  return new;
end;
$$;

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','service_requests','service_areas','company_service_areas','job_posts','candidate_profiles'] loop
    execute format('drop trigger if exists remember_selected_municipality on public.%I', table_name);
    execute format('create trigger remember_selected_municipality after insert or update of municipality_code,city,province on public.%I for each row execute function public.remember_selected_municipality()', table_name);
  end loop;
end $$;

create or replace function public.require_new_service_area_municipality_code()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.municipality_code is null or new.municipality_code !~ '^\\d{6}$' then
    raise exception 'Seleziona un comune valido dall''elenco ISTAT';
  end if;
  return new;
end;
$$;
drop trigger if exists require_municipality_code on public.service_areas;
create trigger require_municipality_code before insert on public.service_areas for each row execute function public.require_new_service_area_municipality_code();
drop trigger if exists require_municipality_code on public.company_service_areas;
create trigger require_municipality_code before insert on public.company_service_areas for each row execute function public.require_new_service_area_municipality_code();

create or replace function public.provider_matches_request(provider_user uuid, target public.service_requests)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.professional_profiles pp on pp.user_id=p.id
    join public.professional_categories pc on pc.professional_id=pp.id
    join public.service_areas sa on sa.professional_id=pp.id
    where p.id=provider_user and p.role='professional' and pc.category_id=target.category_id
      and case
        when target.municipality_code is not null and sa.municipality_code is not null
          then target.municipality_code=sa.municipality_code
        else public.normalize_marketplace_text(sa.city)=public.normalize_marketplace_text(target.city)
          and public.normalize_marketplace_province(sa.province)=public.normalize_marketplace_province(target.province)
      end
  ) or exists (
    select 1 from public.profiles p
    join public.company_profiles cp on cp.user_id=p.id
    join public.company_categories cc on cc.company_id=cp.id
    join public.company_service_areas csa on csa.company_id=cp.id
    where p.id=provider_user and p.role='company' and cc.category_id=target.category_id
      and case
        when target.municipality_code is not null and csa.municipality_code is not null
          then target.municipality_code=csa.municipality_code
        else public.normalize_marketplace_text(csa.city)=public.normalize_marketplace_text(target.city)
          and public.normalize_marketplace_province(csa.province)=public.normalize_marketplace_province(target.province)
      end
  );
$$;
revoke all on function public.provider_matches_request(uuid, public.service_requests) from public, anon, authenticated;

-- Include location metadata supplied during email registration.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare selected_role text; selected_name text;
begin
  selected_role := coalesce(new.raw_user_meta_data ->> 'role', 'client');
  if selected_role not in ('client','professional','company','candidate') then selected_role := 'client'; end if;
  selected_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'),''),nullif(trim(new.raw_user_meta_data ->> 'name'),''),split_part(coalesce(new.email,'Utente instaMax'),'@',1));
  insert into public.profiles(id,role,full_name,email,avatar_url,municipality_code,city,province_code,province)
  values(new.id,selected_role,selected_name,coalesce(new.email,''),new.raw_user_meta_data ->> 'avatar_url',
    nullif(new.raw_user_meta_data ->> 'municipality_code',''),nullif(new.raw_user_meta_data ->> 'city',''),
    nullif(new.raw_user_meta_data ->> 'province_code',''),nullif(new.raw_user_meta_data ->> 'province',''));
  if selected_role='professional' then insert into public.professional_profiles(user_id) values(new.id);
  elsif selected_role='company' then insert into public.company_profiles(user_id,company_name) values(new.id,selected_name);
  elsif selected_role='candidate' then insert into public.candidate_profiles(user_id) values(new.id); end if;
  insert into public.subscriptions(user_id,plan,status) values(new.id,'free','active');
  return new;
end;
$$;

commit;
