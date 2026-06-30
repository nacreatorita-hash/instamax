-- instaMax: compatible request matching, company service profiles, pricing and avatars.
-- Reversible: the final section documents the objects introduced by this migration.

begin;

create or replace function public.normalize_marketplace_text(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select regexp_replace(
    lower(trim(replace(replace(replace(coalesce(value, ''), chr(8217), chr(39)), chr(96), chr(39)), chr(180), chr(39)))),
    '\s+', ' ', 'g'
  );
$$;

create or replace function public.normalize_marketplace_province(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case public.normalize_marketplace_text(value)
    when 'salerno' then 'sa'
    when 'napoli' then 'na'
    when 'roma' then 'rm'
    when 'milano' then 'mi'
    when 'torino' then 'to'
    when 'bologna' then 'bo'
    when 'firenze' then 'fi'
    else public.normalize_marketplace_text(value)
  end;
$$;

alter table public.professional_profiles
  add column if not exists pricing_mode text not null default 'negotiable',
  add column if not exists hourly_rate numeric(10,2),
  add column if not exists currency text not null default 'EUR';

alter table public.company_profiles
  add column if not exists pricing_mode text not null default 'negotiable',
  add column if not exists hourly_rate numeric(10,2),
  add column if not exists currency text not null default 'EUR';

alter table public.professional_profiles drop constraint if exists professional_profiles_pricing_mode_check;
alter table public.professional_profiles add constraint professional_profiles_pricing_mode_check
  check (pricing_mode in ('hourly', 'negotiable'));
alter table public.professional_profiles drop constraint if exists professional_profiles_hourly_rate_check;
alter table public.professional_profiles add constraint professional_profiles_hourly_rate_check
  check ((pricing_mode = 'hourly' and hourly_rate > 0) or (pricing_mode = 'negotiable' and hourly_rate is null));
alter table public.professional_profiles drop constraint if exists professional_profiles_currency_check;
alter table public.professional_profiles add constraint professional_profiles_currency_check check (currency = 'EUR');

alter table public.company_profiles drop constraint if exists company_profiles_pricing_mode_check;
alter table public.company_profiles add constraint company_profiles_pricing_mode_check
  check (pricing_mode in ('hourly', 'negotiable'));
alter table public.company_profiles drop constraint if exists company_profiles_hourly_rate_check;
alter table public.company_profiles add constraint company_profiles_hourly_rate_check
  check ((pricing_mode = 'hourly' and hourly_rate > 0) or (pricing_mode = 'negotiable' and hourly_rate is null));
alter table public.company_profiles drop constraint if exists company_profiles_currency_check;
alter table public.company_profiles add constraint company_profiles_currency_check check (currency = 'EUR');

create table if not exists public.company_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (company_id, category_id)
);

create table if not exists public.company_service_areas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  city text not null,
  province text not null,
  created_at timestamptz not null default now(),
  unique (company_id, city, province)
);

create index if not exists idx_company_categories_category on public.company_categories(category_id, company_id);
create index if not exists idx_company_service_areas_match on public.company_service_areas
  (public.normalize_marketplace_text(city), public.normalize_marketplace_province(province), company_id);

alter table public.company_categories enable row level security;
alter table public.company_service_areas enable row level security;
grant select,insert,update,delete on public.company_categories to authenticated;
grant select,insert,update,delete on public.company_service_areas to authenticated;

drop policy if exists "Authenticated read company categories" on public.company_categories;
create policy "Authenticated read company categories" on public.company_categories for select
  to authenticated using (true);
drop policy if exists "Companies manage own categories" on public.company_categories;
create policy "Companies manage own categories" on public.company_categories for all
  to authenticated
  using (exists (select 1 from public.company_profiles cp where cp.id = company_id and cp.user_id = auth.uid()))
  with check (exists (select 1 from public.company_profiles cp where cp.id = company_id and cp.user_id = auth.uid()));

drop policy if exists "Authenticated read company service areas" on public.company_service_areas;
create policy "Authenticated read company service areas" on public.company_service_areas for select
  to authenticated using (true);
drop policy if exists "Companies manage own service areas" on public.company_service_areas;
create policy "Companies manage own service areas" on public.company_service_areas for all
  to authenticated
  using (exists (select 1 from public.company_profiles cp where cp.id = company_id and cp.user_id = auth.uid()))
  with check (exists (select 1 from public.company_profiles cp where cp.id = company_id and cp.user_id = auth.uid()));

-- A client sees only their own requests while their active role is client.
drop policy if exists "Client reads own requests" on public.service_requests;
create policy "Client reads own requests" on public.service_requests for select to authenticated
  using (client_id = auth.uid() and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'client'
  ));
drop policy if exists "Client updates own requests" on public.service_requests;
create policy "Client updates own requests" on public.service_requests for update to authenticated
  using (client_id = auth.uid() and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'client'
  ))
  with check (client_id = auth.uid() and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'client'
  ));
drop policy if exists "Client deletes own requests" on public.service_requests;
create policy "Client deletes own requests" on public.service_requests for delete to authenticated
  using (client_id = auth.uid() and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'client'
  ));

drop policy if exists "Professionals read compatible open requests" on public.service_requests;
drop policy if exists "Providers read compatible open requests" on public.service_requests;
create policy "Providers read compatible open requests" on public.service_requests for select to authenticated
using (
  status = 'open' and (
    exists (
      select 1
      from public.profiles p
      join public.professional_profiles pp on pp.user_id = p.id
      join public.professional_categories pc on pc.professional_id = pp.id
      join public.service_areas sa on sa.professional_id = pp.id
      where p.id = auth.uid()
        and p.role = 'professional'
        and pc.category_id = service_requests.category_id
        and public.normalize_marketplace_text(sa.city) = public.normalize_marketplace_text(service_requests.city)
        and public.normalize_marketplace_province(sa.province) = public.normalize_marketplace_province(service_requests.province)
    )
    or exists (
      select 1
      from public.profiles p
      join public.company_profiles cp on cp.user_id = p.id
      join public.company_categories cc on cc.company_id = cp.id
      join public.company_service_areas csa on csa.company_id = cp.id
      where p.id = auth.uid()
        and p.role = 'company'
        and cc.category_id = service_requests.category_id
        and public.normalize_marketplace_text(csa.city) = public.normalize_marketplace_text(service_requests.city)
        and public.normalize_marketplace_province(csa.province) = public.normalize_marketplace_province(service_requests.province)
    )
  )
);

create or replace function public.get_compatible_requests_for_user(p_user_id uuid default auth.uid())
returns setof public.service_requests
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare current_role text;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;
  select role into current_role from public.profiles where id = auth.uid();
  if current_role not in ('professional', 'company') then
    return;
  end if;
  return query
    select r.* from public.service_requests r
    where r.status in ('open','awaiting_client_choice')
    order by case r.urgency
      when 'urgent' then 0 when 'today' then 1 when 'tomorrow' then 2
      when 'week' then 3 else 4 end, r.created_at desc;
end;
$$;
revoke all on function public.get_compatible_requests_for_user(uuid) from public, anon;
grant execute on function public.get_compatible_requests_for_user(uuid) to authenticated;

create or replace function public.notify_compatible_professionals(requested_request_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare target public.service_requests; category_name text; inserted_count integer;
begin
  select * into target from public.service_requests
  where id = requested_request_id and client_id = auth.uid();
  if target.id is null then raise exception 'request not found or forbidden'; end if;
  select name into category_name from public.categories where id = target.category_id;

  insert into public.notifications (user_id, type, request_id, title, content)
  select provider.user_id, 'new_request', target.id,
    'Nuova richiesta nella tua zona',
    'Cerco ' || coalesce(category_name, 'un professionista') || ' a ' || target.city
  from (
    select distinct pp.user_id
    from public.professional_profiles pp
    join public.professional_categories pc on pc.professional_id = pp.id and pc.category_id = target.category_id
    join public.service_areas sa on sa.professional_id = pp.id
    where public.normalize_marketplace_text(sa.city) = public.normalize_marketplace_text(target.city)
      and public.normalize_marketplace_province(sa.province) = public.normalize_marketplace_province(target.province)
    union
    select distinct cp.user_id
    from public.company_profiles cp
    join public.company_categories cc on cc.company_id = cp.id and cc.category_id = target.category_id
    join public.company_service_areas csa on csa.company_id = cp.id
    where public.normalize_marketplace_text(csa.city) = public.normalize_marketplace_text(target.city)
      and public.normalize_marketplace_province(csa.province) = public.normalize_marketplace_province(target.province)
  ) provider
  where not exists (
    select 1 from public.notifications n
    where n.user_id = provider.user_id and n.request_id = target.id and n.type = 'new_request'
  );
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;
revoke all on function public.notify_compatible_professionals(uuid) from public, anon;
grant execute on function public.notify_compatible_professionals(uuid) to authenticated;

-- Proposal, assignment and two-party completion workflow.
alter table public.service_requests
  add column if not exists assigned_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists assigned_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists client_start_confirmed boolean not null default false,
  add column if not exists professional_start_confirmed boolean not null default false,
  add column if not exists client_completion_confirmed boolean not null default false,
  add column if not exists professional_completion_confirmed boolean not null default false,
  add column if not exists client_completed_at timestamptz,
  add column if not exists professional_completed_at timestamptz,
  add column if not exists completed_at timestamptz;

update public.service_requests set status = 'completed', completed_at = coalesce(completed_at, updated_at, created_at)
where status = 'closed';
alter table public.service_requests drop constraint if exists service_requests_status_check;
alter table public.service_requests add constraint service_requests_status_check check (status in (
  'open','awaiting_client_choice','assigned','in_progress','awaiting_completion','completed','cancelled'
));
create index if not exists idx_service_requests_assigned on public.service_requests(assigned_user_id, status);

create table if not exists public.request_proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  professional_user_id uuid not null references public.profiles(id) on delete cascade,
  professional_role text not null check (professional_role in ('professional','company')),
  message text,
  proposed_availability text,
  status text not null default 'pending' check (status in ('pending','selected','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, professional_user_id)
);
create index if not exists idx_request_proposals_request on public.request_proposals(request_id, status, created_at);
create index if not exists idx_request_proposals_provider on public.request_proposals(professional_user_id, status);
alter table public.request_proposals enable row level security;
grant select on public.request_proposals to authenticated;
drop trigger if exists request_proposals_set_updated_at on public.request_proposals;
create trigger request_proposals_set_updated_at before update on public.request_proposals
for each row execute function public.set_updated_at();

drop policy if exists "Providers read own proposals" on public.request_proposals;
create policy "Providers read own proposals" on public.request_proposals for select to authenticated
using (professional_user_id = auth.uid());
drop policy if exists "Clients read proposals for own requests" on public.request_proposals;
create policy "Clients read proposals for own requests" on public.request_proposals for select to authenticated
using (exists (select 1 from public.service_requests r where r.id = request_id and r.client_id = auth.uid()));
-- Writes are deliberately RPC-only.
revoke insert, update, delete on public.request_proposals from authenticated;

-- Compatible providers keep seeing a request while the client is collecting proposals.
drop policy if exists "Providers read compatible open requests" on public.service_requests;
create policy "Providers read compatible open requests" on public.service_requests for select to authenticated
using (
  status in ('open','awaiting_client_choice') and (
    exists (
      select 1 from public.profiles p
      join public.professional_profiles pp on pp.user_id = p.id
      join public.professional_categories pc on pc.professional_id = pp.id
      join public.service_areas sa on sa.professional_id = pp.id
      where p.id = auth.uid() and p.role = 'professional'
        and pc.category_id = service_requests.category_id
        and public.normalize_marketplace_text(sa.city) = public.normalize_marketplace_text(service_requests.city)
        and public.normalize_marketplace_province(sa.province) = public.normalize_marketplace_province(service_requests.province)
    ) or exists (
      select 1 from public.profiles p
      join public.company_profiles cp on cp.user_id = p.id
      join public.company_categories cc on cc.company_id = cp.id
      join public.company_service_areas csa on csa.company_id = cp.id
      where p.id = auth.uid() and p.role = 'company'
        and cc.category_id = service_requests.category_id
        and public.normalize_marketplace_text(csa.city) = public.normalize_marketplace_text(service_requests.city)
        and public.normalize_marketplace_province(csa.province) = public.normalize_marketplace_province(service_requests.province)
    )
  )
);
drop policy if exists "Assigned parties read requests" on public.service_requests;
create policy "Assigned parties read requests" on public.service_requests for select to authenticated
using (assigned_user_id = auth.uid());

-- Direct updates may edit descriptive fields only; workflow columns are RPC-only.
revoke update on public.service_requests from authenticated;
revoke delete on public.service_requests from authenticated;
grant update (title, description, city, province, urgency, budget) on public.service_requests to authenticated;

create or replace function public.provider_matches_request(provider_user uuid, target public.service_requests)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join public.professional_profiles pp on pp.user_id=p.id
    join public.professional_categories pc on pc.professional_id=pp.id
    join public.service_areas sa on sa.professional_id=pp.id
    where p.id=provider_user and p.role='professional' and pc.category_id=target.category_id
      and public.normalize_marketplace_text(sa.city)=public.normalize_marketplace_text(target.city)
      and public.normalize_marketplace_province(sa.province)=public.normalize_marketplace_province(target.province)
  ) or exists (
    select 1 from public.profiles p
    join public.company_profiles cp on cp.user_id=p.id
    join public.company_categories cc on cc.company_id=cp.id
    join public.company_service_areas csa on csa.company_id=cp.id
    where p.id=provider_user and p.role='company' and cc.category_id=target.category_id
      and public.normalize_marketplace_text(csa.city)=public.normalize_marketplace_text(target.city)
      and public.normalize_marketplace_province(csa.province)=public.normalize_marketplace_province(target.province)
  );
$$;
revoke all on function public.provider_matches_request(uuid, public.service_requests) from public, anon, authenticated;

create or replace function public.submit_request_proposal(p_request_id uuid, p_message text default null, p_availability text default null)
returns public.request_proposals language plpgsql security definer set search_path='' as $$
declare target public.service_requests; provider_role text; result public.request_proposals; provider_name text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into target from public.service_requests where id=p_request_id for update;
  if target.id is null or target.status not in ('open','awaiting_client_choice') then raise exception 'request unavailable'; end if;
  select role, full_name into provider_role, provider_name from public.profiles where id=auth.uid();
  if provider_role not in ('professional','company') then raise exception 'provider role required'; end if;
  if not public.provider_matches_request(auth.uid(), target) then raise exception 'request not compatible'; end if;
  insert into public.request_proposals(request_id,professional_user_id,professional_role,message,proposed_availability,status)
  values(target.id,auth.uid(),provider_role,nullif(left(trim(coalesce(p_message,'')),1000),''),nullif(left(trim(coalesce(p_availability,'')),240),''),'pending')
  on conflict(request_id,professional_user_id) do update set message=excluded.message,proposed_availability=excluded.proposed_availability,status='pending',updated_at=now()
  where request_proposals.status='withdrawn' returning * into result;
  if result.id is null then raise exception 'proposal already submitted'; end if;
  update public.service_requests set status='awaiting_client_choice' where id=target.id and status='open';
  insert into public.notifications(user_id,type,request_id,title,content)
  values(target.client_id,'request_proposal',target.id,'Nuovo professionista disponibile',coalesce(provider_name,'Un professionista')||' è disponibile per la tua richiesta.');
  return result;
end; $$;
revoke all on function public.submit_request_proposal(uuid,text,text) from public,anon;
grant execute on function public.submit_request_proposal(uuid,text,text) to authenticated;

create or replace function public.withdraw_request_proposal(p_request_id uuid)
returns public.request_proposals language plpgsql security definer set search_path='' as $$
declare result public.request_proposals;
begin
  update public.request_proposals set status='withdrawn'
  where request_id=p_request_id and professional_user_id=auth.uid() and status='pending'
  returning * into result;
  if result.id is null then raise exception 'pending proposal not found'; end if;
  return result;
end; $$;
revoke all on function public.withdraw_request_proposal(uuid) from public,anon;
grant execute on function public.withdraw_request_proposal(uuid) to authenticated;

create or replace function public.select_request_professional(p_request_id uuid,p_professional_user_id uuid)
returns public.conversations language plpgsql security definer set search_path='' as $$
declare target public.service_requests; proposal public.request_proposals; result public.conversations; chosen_name text;
begin
  select * into target from public.service_requests where id=p_request_id and client_id=auth.uid() for update;
  if target.id is null or target.status not in ('open','awaiting_client_choice') then raise exception 'request unavailable or forbidden'; end if;
  select * into proposal from public.request_proposals where request_id=target.id and professional_user_id=p_professional_user_id and status='pending' for update;
  if proposal.id is null then raise exception 'pending proposal not found'; end if;
  update public.service_requests set assigned_user_id=p_professional_user_id,assigned_at=now(),status='assigned' where id=target.id;
  update public.request_proposals set status=case when professional_user_id=p_professional_user_id then 'selected' else 'rejected' end
  where request_id=target.id and status='pending';
  select full_name into chosen_name from public.profiles where id=p_professional_user_id;
  select * into result from public.conversations c where c.request_id=target.id and
    least(c.participant_one,c.participant_two)=least(target.client_id,p_professional_user_id) and greatest(c.participant_one,c.participant_two)=greatest(target.client_id,p_professional_user_id);
  if result.id is null then
    insert into public.conversations(request_id,participant_one,participant_two,status,last_message,last_message_at)
    values(target.id,target.client_id,p_professional_user_id,'open','Professionista scelto dal cliente',now()) returning * into result;
  else
    update public.conversations set status='open',closed_at=null,last_message='Professionista scelto dal cliente',last_message_at=now() where id=result.id returning * into result;
  end if;
  insert into public.messages(conversation_id,sender_id,body,text,message_type,is_read)
  values(result.id,auth.uid(),'Il cliente ha scelto '||coalesce(chosen_name,'il professionista')||' per questa richiesta. Utilizzate la chat per concordare prezzo, disponibilità e dettagli dell’intervento.','Il cliente ha scelto '||coalesce(chosen_name,'il professionista')||' per questa richiesta. Utilizzate la chat per concordare prezzo, disponibilità e dettagli dell’intervento.','system',false);
  insert into public.notifications(user_id,type,request_id,title,content)
  select professional_user_id,case when professional_user_id=p_professional_user_id then 'proposal_selected' else 'proposal_rejected' end,target.id,
    case when professional_user_id=p_professional_user_id then 'Sei stato scelto per il lavoro' else 'Richiesta affidata' end,
    case when professional_user_id=p_professional_user_id then 'Il cliente ha scelto te. Apri la chat per concordare i dettagli.' else 'La richiesta è stata affidata a un altro professionista.' end
  from public.request_proposals where request_id=target.id;
  return result;
end; $$;
revoke all on function public.select_request_professional(uuid,uuid) from public,anon;
grant execute on function public.select_request_professional(uuid,uuid) to authenticated;

create or replace function public.confirm_request_start(p_request_id uuid)
returns public.service_requests language plpgsql security definer set search_path='' as $$
declare target public.service_requests; result public.service_requests; target_conversation_id uuid; text_message text;
begin
  select * into target from public.service_requests where id=p_request_id for update;
  if target.id is null or target.status not in ('assigned','in_progress') then raise exception 'request cannot be started'; end if;
  if auth.uid()=target.client_id then
    update public.service_requests set client_start_confirmed=true,status='in_progress',started_at=coalesce(started_at,now()) where id=target.id returning * into result;
  elsif auth.uid()=target.assigned_user_id then
    update public.service_requests set professional_start_confirmed=true,
      status=case when client_start_confirmed then 'in_progress' else status end,
      started_at=case when client_start_confirmed then coalesce(started_at,now()) else started_at end
    where id=target.id returning * into result;
  else raise exception 'forbidden'; end if;
  if result.status='in_progress' then text_message:='Il lavoro è iniziato. Utilizzate la chat per gli aggiornamenti.';
  else text_message:='Il professionista è pronto a iniziare. Il cliente deve confermare.'; end if;
  select id into target_conversation_id from public.conversations where request_id=target.id and auth.uid() in(participant_one,participant_two) limit 1;
  if target_conversation_id is not null then insert into public.messages(conversation_id,sender_id,body,text,message_type,is_read) values(target_conversation_id,auth.uid(),text_message,text_message,'system',false); end if;
  insert into public.notifications(user_id,type,request_id,title,content)
  values(case when auth.uid()=target.client_id then target.assigned_user_id else target.client_id end,'request_start',target.id,'Conferma inizio lavoro',text_message);
  return result;
end; $$;
revoke all on function public.confirm_request_start(uuid) from public,anon;
grant execute on function public.confirm_request_start(uuid) to authenticated;

create or replace function public.confirm_request_completion(p_request_id uuid)
returns public.service_requests language plpgsql security definer set search_path='' as $$
declare target public.service_requests; result public.service_requests; target_conversation_id uuid; text_message text; recipient uuid;
begin
  select * into target from public.service_requests where id=p_request_id for update;
  if target.id is null or target.status not in ('assigned','in_progress','awaiting_completion') then raise exception 'request cannot be completed'; end if;
  if auth.uid()=target.client_id then
    update public.service_requests set client_completion_confirmed=true,client_completed_at=coalesce(client_completed_at,now()) where id=target.id returning * into result;
    recipient:=target.assigned_user_id;
  elsif auth.uid()=target.assigned_user_id then
    update public.service_requests set professional_completion_confirmed=true,professional_completed_at=coalesce(professional_completed_at,now()) where id=target.id returning * into result;
    recipient:=target.client_id;
  else raise exception 'forbidden'; end if;
  if result.client_completion_confirmed and result.professional_completion_confirmed then
    update public.service_requests set status='completed',completed_at=coalesce(completed_at,now()) where id=target.id returning * into result;
    text_message:='Lavoro concluso. La richiesta è stata chiusa correttamente.';
  elsif result.client_completion_confirmed then
    update public.service_requests set status='awaiting_completion' where id=target.id returning * into result;
    text_message:='Il cliente ha indicato che il lavoro è terminato. Il professionista deve confermare la conclusione.';
  else
    update public.service_requests set status='awaiting_completion' where id=target.id returning * into result;
    text_message:='Il professionista ha indicato che il lavoro è terminato. Il cliente deve confermare la conclusione.';
  end if;
  select id into target_conversation_id from public.conversations where request_id=target.id and target.client_id in(participant_one,participant_two) and target.assigned_user_id in(participant_one,participant_two) limit 1;
  if target_conversation_id is not null then
    insert into public.messages(conversation_id,sender_id,body,text,message_type,is_read) values(target_conversation_id,auth.uid(),text_message,text_message,'system',false);
    if result.status='completed' then
      update public.conversations set status='closed',closed_at=now(),last_message=text_message,last_message_at=now() where id=target_conversation_id;
      update public.messages m set delete_after=now()+interval '30 days' where m.conversation_id=target_conversation_id and m.attachment_path is not null;
    end if;
  end if;
  insert into public.notifications(user_id,type,request_id,title,content)
  values(recipient,case when result.status='completed' then 'request_completed' else 'completion_confirmation' end,target.id,
    case when result.status='completed' then 'Lavoro completato' else 'Conferma conclusione lavoro' end,text_message);
  if result.status='completed' then
    insert into public.notifications(user_id,type,request_id,title,content) values(target.client_id,'review_requested',target.id,'Valuta il lavoro ricevuto','Il lavoro è concluso. Lascia una valutazione.');
  end if;
  return result;
end; $$;
revoke all on function public.confirm_request_completion(uuid) from public,anon;
grant execute on function public.confirm_request_completion(uuid) to authenticated;

create or replace function public.cancel_service_request(p_request_id uuid)
returns public.service_requests language plpgsql security definer set search_path='' as $$
declare result public.service_requests;
begin
  update public.service_requests set status='cancelled' where id=p_request_id and client_id=auth.uid()
    and status in('open','awaiting_client_choice','assigned') returning * into result;
  if result.id is null then raise exception 'request cannot be cancelled'; end if;
  update public.request_proposals set status='rejected' where request_id=p_request_id and status='pending';
  return result;
end; $$;
revoke all on function public.cancel_service_request(uuid) from public,anon;
grant execute on function public.cancel_service_request(uuid) to authenticated;

-- Request chats cannot be opened by a provider before selection and cannot be closed unilaterally.
create or replace function public.get_or_create_request_conversation(requested_request_id uuid)
returns public.conversations language plpgsql security definer set search_path='' as $$
declare target public.service_requests; result public.conversations;
begin
  select * into target from public.service_requests where id=requested_request_id;
  if target.id is null or target.assigned_user_id is null or auth.uid() not in(target.client_id,target.assigned_user_id) then raise exception 'conversation forbidden'; end if;
  select * into result from public.conversations where request_id=target.id and target.client_id in(participant_one,participant_two) and target.assigned_user_id in(participant_one,participant_two) limit 1;
  if result.id is null then raise exception 'conversation not created yet'; end if;
  return result;
end; $$;
revoke all on function public.get_or_create_request_conversation(uuid) from public,anon;
grant execute on function public.get_or_create_request_conversation(uuid) to authenticated;

create or replace function public.close_my_conversation(requested_conversation_id uuid)
returns public.conversations language plpgsql security definer set search_path='' as $$
declare c public.conversations; recipient uuid;
begin
  select * into c from public.conversations where id=requested_conversation_id and auth.uid() in(participant_one,participant_two) for update;
  if c.id is null then raise exception 'conversation forbidden'; end if;
  if c.request_id is not null and not exists(select 1 from public.service_requests r where r.id=c.request_id and r.status in('completed','cancelled')) then raise exception 'La chat del lavoro resta aperta fino alla conclusione confermata.'; end if;
  if c.status<>'open' then return c; end if;
  update public.conversations set status='closed',closed_at=now(),last_message='Conversazione chiusa',last_message_at=now() where id=c.id returning * into c;
  update public.messages set delete_after=now()+interval '30 days' where conversation_id=c.id and attachment_path is not null;
  recipient:=case when c.participant_one=auth.uid() then c.participant_two else c.participant_one end;
  insert into public.notifications(user_id,type,request_id,title,content) values(recipient,'conversation_closed',c.request_id,'Conversazione chiusa','La conversazione è stata chiusa');
  return c;
end; $$;
revoke all on function public.close_my_conversation(uuid) from public,anon;
grant execute on function public.close_my_conversation(uuid) to authenticated;

-- Service reviews are available only after both completion confirmations.
alter table public.reviews
  add column if not exists request_id uuid references public.service_requests(id) on delete cascade,
  add column if not exists review_type text,
  add column if not exists punctuality smallint,
  add column if not exists professionalism smallint,
  add column if not exists work_quality smallint,
  add column if not exists price_clarity smallint,
  add column if not exists communication smallint,
  add column if not exists updated_at timestamptz not null default now();
alter table public.reviews drop constraint if exists reviews_review_type_check;
alter table public.reviews add constraint reviews_review_type_check check(review_type is null or review_type='service_client_to_professional');
alter table public.reviews drop constraint if exists reviews_aspects_check;
alter table public.reviews add constraint reviews_aspects_check check(
  (punctuality is null or punctuality between 1 and 5) and (professionalism is null or professionalism between 1 and 5)
  and (work_quality is null or work_quality between 1 and 5) and (price_clarity is null or price_clarity between 1 and 5)
  and (communication is null or communication between 1 and 5)
);
create unique index if not exists reviews_service_request_unique on public.reviews(request_id) where review_type='service_client_to_professional';
alter table public.company_profiles add column if not exists rating numeric not null default 0 check(rating between 0 and 5), add column if not exists total_reviews integer not null default 0;
drop policy if exists "Authenticated read reviews" on public.reviews;
create policy "Authenticated read reviews" on public.reviews for select to authenticated using(true);
revoke insert,update,delete on public.reviews from authenticated;

create or replace function public.submit_service_review(p_request_id uuid,p_rating integer,p_comment text default null,p_punctuality integer default null,p_professionalism integer default null,p_work_quality integer default null,p_price_clarity integer default null,p_communication integer default null)
returns public.reviews language plpgsql security definer set search_path='' as $$
declare target public.service_requests; result public.reviews; reviewed_role text; avg_rating numeric; review_count integer;
begin
  if p_rating not between 1 and 5 then raise exception 'rating must be between 1 and 5'; end if;
  select * into target from public.service_requests where id=p_request_id and client_id=auth.uid() and status='completed' and assigned_user_id is not null;
  if target.id is null then raise exception 'completed request not found or forbidden'; end if;
  insert into public.reviews(request_id,reviewer_id,reviewed_id,rating,comment,review_type,punctuality,professionalism,work_quality,price_clarity,communication)
  values(target.id,auth.uid(),target.assigned_user_id,p_rating,nullif(left(trim(coalesce(p_comment,'')),1500),''),'service_client_to_professional',p_punctuality,p_professionalism,p_work_quality,p_price_clarity,p_communication)
  on conflict(request_id) where review_type='service_client_to_professional' do update set rating=excluded.rating,comment=excluded.comment,punctuality=excluded.punctuality,professionalism=excluded.professionalism,work_quality=excluded.work_quality,price_clarity=excluded.price_clarity,communication=excluded.communication,updated_at=now()
  where reviews.reviewer_id=auth.uid() and reviews.reviewed_id=target.assigned_user_id returning * into result;
  if result.id is null then raise exception 'review conflict'; end if;
  select avg(rating),count(*) into avg_rating,review_count from public.reviews where reviewed_id=target.assigned_user_id and review_type='service_client_to_professional';
  select role into reviewed_role from public.profiles where id=target.assigned_user_id;
  if reviewed_role='professional' then update public.professional_profiles set rating=avg_rating,total_reviews=review_count where user_id=target.assigned_user_id;
  elsif reviewed_role='company' then update public.company_profiles set rating=avg_rating,total_reviews=review_count where user_id=target.assigned_user_id; end if;
  return result;
end; $$;
revoke all on function public.submit_service_review(uuid,integer,text,integer,integer,integer,integer,integer) from public,anon;
grant execute on function public.submit_service_review(uuid,integer,text,integer,integer,integer,integer,integer) to authenticated;

-- Profile photos are private writes and public reads, with one folder per user.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 5242880,
  array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Realtime feed: ignore duplicate membership when already configured.
do $$ begin
  alter publication supabase_realtime add table public.service_requests;
exception when duplicate_object then null;
end $$;

commit;

-- Rollback outline (run only if this migration must be reverted):
-- drop function public.get_compatible_requests_for_user(uuid);
-- drop table public.company_service_areas; drop table public.company_categories;
-- alter table public.professional_profiles drop column pricing_mode, drop column hourly_rate, drop column currency;
-- alter table public.company_profiles drop column pricing_mode, drop column hourly_rate, drop column currency;
