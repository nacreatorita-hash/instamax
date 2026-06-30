-- HandyGo Milestone 5: jobs, digital CV and applications
alter table public.job_posts add column if not exists owner_id uuid references public.profiles(id) on delete cascade,
 add column if not exists owner_role text, add column if not exists category_id uuid references public.categories(id),
 add column if not exists contract_type text, add column if not exists experience_required text,
 add column if not exists availability_required text, add column if not exists status text default 'open',
 add column if not exists updated_at timestamptz default now();
update public.job_posts jp set owner_id=cp.user_id,owner_role='company' from public.company_profiles cp where jp.company_id=cp.id and jp.owner_id is null;
alter table public.job_posts drop constraint if exists job_posts_owner_role_check;
alter table public.job_posts add constraint job_posts_owner_role_check check(owner_role in('company','professional'));
alter table public.job_posts drop constraint if exists job_posts_status_check;
alter table public.job_posts add constraint job_posts_status_check check(status in('open','closed','paused'));
drop trigger if exists job_posts_set_updated_at on public.job_posts;
create trigger job_posts_set_updated_at before update on public.job_posts for each row execute function public.set_updated_at();

alter table public.candidate_profiles add column if not exists city text,add column if not exists province text,
 add column if not exists visibility text default 'public';
alter table public.candidate_profiles drop constraint if exists candidate_profiles_visibility_check;
alter table public.candidate_profiles add constraint candidate_profiles_visibility_check check(visibility in('public','private'));
create table if not exists public.candidate_portfolio(id uuid primary key default gen_random_uuid(),candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,file_url text not null,storage_path text,file_type text,description text,created_at timestamptz default now());
create table if not exists public.saved_candidates(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id) on delete cascade,candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,created_at timestamptz default now(),unique(owner_id,candidate_id));
alter table public.job_applications add column if not exists message text,add column if not exists updated_at timestamptz default now();
update public.job_applications set status='sent' where status='applied';
alter table public.job_applications drop constraint if exists job_applications_status_check;
alter table public.job_applications add constraint job_applications_status_check check(status in('sent','viewed','shortlisted','rejected','hired'));
drop trigger if exists job_applications_set_updated_at on public.job_applications;
create trigger job_applications_set_updated_at before update on public.job_applications for each row execute function public.set_updated_at();
alter table public.candidate_portfolio enable row level security;alter table public.saved_candidates enable row level security;

drop policy if exists "Allow read for candidates if authenticated" on public.candidate_profiles;
create policy "Candidates read own profile" on public.candidate_profiles for select to authenticated using(user_id=auth.uid());
create policy "Employers read public or applied candidates" on public.candidate_profiles for select to authenticated using(visibility='public' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('company','professional')) or exists(select 1 from public.job_applications a join public.job_posts j on j.id=a.job_id where a.candidate_id=candidate_profiles.id and j.owner_id=auth.uid()));

create policy "Authenticated read open jobs" on public.job_posts for select to authenticated using(status='open' or owner_id=auth.uid());
create policy "Employers create jobs" on public.job_posts for insert to authenticated with check(owner_id=auth.uid() and owner_role in('company','professional') and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role=owner_role));
create policy "Owners update jobs" on public.job_posts for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "Owners delete jobs" on public.job_posts for delete to authenticated using(owner_id=auth.uid());

create policy "Candidates create applications" on public.job_applications for insert to authenticated with check(exists(select 1 from public.candidate_profiles cp where cp.id=candidate_id and cp.user_id=auth.uid()) and exists(select 1 from public.job_posts j where j.id=job_id and j.status='open'));
create policy "Candidates read applications" on public.job_applications for select to authenticated using(exists(select 1 from public.candidate_profiles cp where cp.id=candidate_id and cp.user_id=auth.uid()));
create policy "Owners read applications" on public.job_applications for select to authenticated using(exists(select 1 from public.job_posts j where j.id=job_id and j.owner_id=auth.uid()));
create policy "Owners update applications" on public.job_applications for update to authenticated using(exists(select 1 from public.job_posts j where j.id=job_id and j.owner_id=auth.uid()));
create policy "Portfolio owner manages" on public.candidate_portfolio for all to authenticated using(exists(select 1 from public.candidate_profiles cp where cp.id=candidate_id and cp.user_id=auth.uid())) with check(exists(select 1 from public.candidate_profiles cp where cp.id=candidate_id and cp.user_id=auth.uid()));
create policy "Employers read visible portfolio" on public.candidate_portfolio for select to authenticated using(exists(select 1 from public.candidate_profiles cp where cp.id=candidate_id and (cp.visibility='public' or exists(select 1 from public.job_applications a join public.job_posts j on j.id=a.job_id where a.candidate_id=cp.id and j.owner_id=auth.uid()))));
create policy "Employers manage saved candidates" on public.saved_candidates for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid() and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('company','professional')));

create or replace function public.notify_job_owner(requested_application_id uuid,event_title text,event_content text) returns void language plpgsql security definer set search_path='' as $$ declare owner uuid;begin select j.owner_id into owner from public.job_applications a join public.job_posts j on j.id=a.job_id join public.candidate_profiles cp on cp.id=a.candidate_id where a.id=requested_application_id and cp.user_id=auth.uid();if owner is null then raise exception 'forbidden';end if;insert into public.notifications(user_id,type,title,content)values(owner,'new_job_application',event_title,event_content);end;$$;
grant execute on function public.notify_job_owner(uuid,text,text) to authenticated;
create or replace function public.notify_application_candidate(requested_application_id uuid,event_content text) returns void language plpgsql security definer set search_path='' as $$ declare recipient uuid;begin select cp.user_id into recipient from public.job_applications a join public.job_posts j on j.id=a.job_id join public.candidate_profiles cp on cp.id=a.candidate_id where a.id=requested_application_id and j.owner_id=auth.uid();if recipient is null then raise exception 'forbidden';end if;insert into public.notifications(user_id,type,title,content)values(recipient,'application_status_changed','Candidatura aggiornata',event_content);end;$$;
grant execute on function public.notify_application_candidate(uuid,text) to authenticated;
create unique index if not exists conversations_job_participants_unique
  on public.conversations(job_post_id, least(participant_one, participant_two), greatest(participant_one, participant_two))
  where job_post_id is not null;
create or replace function public.get_or_create_candidate_conversation(requested_candidate_id uuid,requested_job_id uuid default null) returns public.conversations language plpgsql security definer set search_path='' as $$ declare candidate_user uuid;c public.conversations;begin if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('company','professional'))then raise exception 'employer required';end if;select user_id into candidate_user from public.candidate_profiles where id=requested_candidate_id and (visibility='public' or exists(select 1 from public.job_applications a join public.job_posts j on j.id=a.job_id where a.candidate_id=requested_candidate_id and j.owner_id=auth.uid()));if candidate_user is null then raise exception 'candidate unavailable';end if;select * into c from public.conversations where least(participant_one,participant_two)=least(auth.uid(),candidate_user) and greatest(participant_one,participant_two)=greatest(auth.uid(),candidate_user) and job_post_id is not distinct from requested_job_id; if c.id is null then insert into public.conversations(job_post_id,participant_one,participant_two,status,last_message,last_message_at)values(requested_job_id,auth.uid(),candidate_user,'open','Conversazione avviata per questa candidatura',now())returning * into c;insert into public.messages(conversation_id,sender_id,body,text,message_type)values(c.id,auth.uid(),'Conversazione avviata per questa candidatura','Conversazione avviata per questa candidatura','system');insert into public.notifications(user_id,type,title,content)values(candidate_user,'candidate_contacted','Nuova opportunità di lavoro','Hai ricevuto un messaggio per un’opportunità di lavoro');end if;return c;end;$$;
grant execute on function public.get_or_create_candidate_conversation(uuid,uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('candidate-files','candidate-files',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])on conflict(id)do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Candidates upload own files" on storage.objects for insert to authenticated with check(bucket_id='candidate-files' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "Candidate files authorized read" on storage.objects for select to authenticated using(bucket_id='candidate-files' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.candidate_profiles cp where cp.user_id::text=(storage.foldername(name))[1] and ((cp.visibility='public' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('company','professional'))) or exists(select 1 from public.job_applications a join public.job_posts j on j.id=a.job_id where a.candidate_id=cp.id and j.owner_id=auth.uid())))));
create policy "Candidates delete own files" on storage.objects for delete to authenticated using(bucket_id='candidate-files' and (storage.foldername(name))[1]=auth.uid()::text);
