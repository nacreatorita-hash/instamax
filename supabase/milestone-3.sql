-- HandyGo - Milestone 3: service requests, compatible feed, media and notifications
-- Run once in Supabase SQL Editor after schema.sql and rls-policies.sql.

alter table public.service_requests
  add column if not exists budget numeric(10,2) null,
  add column if not exists updated_at timestamptz default now();

alter table public.service_requests drop constraint if exists service_requests_urgency_check;
alter table public.service_requests add constraint service_requests_urgency_check
  check (urgency in ('urgent', 'today', 'tomorrow', 'week', 'not_urgent'));

alter table public.service_requests drop constraint if exists service_requests_status_check;
update public.service_requests set status = 'open' where status = 'pending';
update public.service_requests set status = 'in_progress' where status = 'assigned';
update public.service_requests set status = 'closed' where status = 'completed';
alter table public.service_requests add constraint service_requests_status_check
  check (status in ('open', 'in_progress', 'closed', 'cancelled'));

drop trigger if exists service_requests_set_updated_at on public.service_requests;
create trigger service_requests_set_updated_at before update on public.service_requests
for each row execute function public.set_updated_at();

create table if not exists public.request_media (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  file_url text not null,
  file_type text not null,
  file_name text null,
  file_size integer null,
  storage_path text null,
  created_at timestamptz default now()
);

alter table public.notifications
  add column if not exists type text default 'general',
  add column if not exists request_id uuid null references public.service_requests(id) on delete cascade;

create index if not exists idx_service_requests_client on public.service_requests(client_id);
create index if not exists idx_service_requests_match on public.service_requests(status, category_id, city, province);
create index if not exists idx_request_media_request on public.request_media(request_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read, created_at desc);

alter table public.request_media enable row level security;

drop policy if exists "Client manages own requests" on public.service_requests;
drop policy if exists "Professionals read compatible open requests" on public.service_requests;
create policy "Client creates own requests" on public.service_requests for insert
  to authenticated with check (
    client_id = auth.uid() and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'client'
    )
  );
create policy "Client reads own requests" on public.service_requests for select
  to authenticated using (client_id = auth.uid());
create policy "Client updates own requests" on public.service_requests for update
  to authenticated using (client_id = auth.uid()) with check (client_id = auth.uid());
create policy "Client deletes own requests" on public.service_requests for delete
  to authenticated using (client_id = auth.uid());
create policy "Professionals read compatible open requests" on public.service_requests for select
  to authenticated using (
    status = 'open' and exists (
      select 1
      from public.professional_profiles pp
      join public.professional_categories pc on pc.professional_id = pp.id
      join public.service_areas sa on sa.professional_id = pp.id
      where pp.user_id = auth.uid()
        and pp.status <> 'not_available'
        and pc.category_id = service_requests.category_id
        and lower(sa.city) = lower(service_requests.city)
        and lower(sa.province) = lower(service_requests.province)
    )
  );

create policy "Owners manage request media" on public.request_media for all
  to authenticated using (
    exists (select 1 from public.service_requests r where r.id = request_media.request_id and r.client_id = auth.uid())
  ) with check (
    exists (select 1 from public.service_requests r where r.id = request_media.request_id and r.client_id = auth.uid())
  );
create policy "Professionals read compatible request media" on public.request_media for select
  to authenticated using (
    exists (select 1 from public.service_requests r where r.id = request_media.request_id)
  );

drop policy if exists "Users read own notifications" on public.notifications;
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications for select
  to authenticated using (user_id = auth.uid());
create policy "Users update own notifications" on public.notifications for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Security-definer function: creates notifications only for genuinely matching professionals.
create or replace function public.notify_compatible_professionals(requested_request_id uuid)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  target public.service_requests;
  category_name text;
  inserted_count integer;
begin
  select * into target from public.service_requests
  where id = requested_request_id and client_id = auth.uid();
  if target.id is null then raise exception 'request not found or forbidden'; end if;
  select name into category_name from public.categories where id = target.category_id;

  insert into public.notifications (user_id, type, request_id, title, content)
  select distinct pp.user_id, 'new_request', target.id,
    'Nuova richiesta nella tua zona',
    'Cerco ' || coalesce(category_name, 'un professionista') || ' a ' || target.city
  from public.professional_profiles pp
  join public.professional_categories pc on pc.professional_id = pp.id and pc.category_id = target.category_id
  join public.service_areas sa on sa.professional_id = pp.id
    and lower(sa.city) = lower(target.city) and lower(sa.province) = lower(target.province)
  where pp.status <> 'not_available'
    and not exists (
      select 1 from public.notifications n
      where n.user_id = pp.user_id and n.request_id = target.id and n.type = 'new_request'
    );
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
revoke all on function public.notify_compatible_professionals(uuid) from public, anon;
grant execute on function public.notify_compatible_professionals(uuid) to authenticated;

create or replace function public.get_compatible_professionals(requested_request_id uuid)
returns table(user_id uuid, professional_id uuid)
language sql stable security definer set search_path = ''
as $$
  select distinct pp.user_id, pp.id
  from public.service_requests r
  join public.professional_categories pc on pc.category_id = r.category_id
  join public.professional_profiles pp on pp.id = pc.professional_id
  join public.service_areas sa on sa.professional_id = pp.id
  where r.id = requested_request_id
    and r.client_id = auth.uid()
    and pp.status <> 'not_available'
    and lower(sa.city) = lower(r.city)
    and lower(sa.province) = lower(r.province);
$$;
revoke all on function public.get_compatible_professionals(uuid) from public, anon;
grant execute on function public.get_compatible_professionals(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-media', 'request-media', false, 26214400,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Request owners upload media" on storage.objects;
drop policy if exists "Visible request media can be read" on storage.objects;
drop policy if exists "Request owners delete media" on storage.objects;
create policy "Request owners upload media" on storage.objects for insert to authenticated
with check (bucket_id = 'request-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Visible request media can be read" on storage.objects for select to authenticated
using (
  bucket_id = 'request-media' and exists (
    select 1 from public.request_media rm where rm.storage_path = name
  )
);
create policy "Request owners delete media" on storage.objects for delete to authenticated
using (bucket_id = 'request-media' and (storage.foldername(name))[1] = auth.uid()::text);
