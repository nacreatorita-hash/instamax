-- HandyGo Milestone 4: private realtime chat

alter table public.conversations
  add column if not exists request_id uuid null references public.service_requests(id) on delete cascade,
  add column if not exists job_post_id uuid null references public.job_posts(id) on delete cascade,
  add column if not exists participant_one uuid null references public.profiles(id) on delete cascade,
  add column if not exists participant_two uuid null references public.profiles(id) on delete cascade,
  add column if not exists status text default 'open',
  add column if not exists last_message text null,
  add column if not exists last_message_at timestamptz null,
  add column if not exists closed_at timestamptz null,
  add column if not exists updated_at timestamptz default now();

update public.conversations set participant_one = sender_id where participant_one is null;
update public.conversations set participant_two = recipient_id where participant_two is null;
alter table public.conversations drop constraint if exists conversations_status_check;
alter table public.conversations add constraint conversations_status_check check (status in ('open','closed','archived'));
create unique index if not exists conversations_request_participants_unique
  on public.conversations(request_id, least(participant_one, participant_two), greatest(participant_one, participant_two))
  where request_id is not null;
create unique index if not exists conversations_job_participants_unique
  on public.conversations(job_post_id, least(participant_one, participant_two), greatest(participant_one, participant_two))
  where job_post_id is not null;
create index if not exists conversations_participant_one_idx on public.conversations(participant_one,last_message_at desc);
create index if not exists conversations_participant_two_idx on public.conversations(participant_two,last_message_at desc);
drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

alter table public.messages alter column text drop not null;
alter table public.messages
  add column if not exists body text null,
  add column if not exists message_type text default 'text',
  add column if not exists attachment_url text null,
  add column if not exists attachment_path text null,
  add column if not exists attachment_name text null,
  add column if not exists attachment_size integer null,
  add column if not exists location_lat numeric null,
  add column if not exists location_lng numeric null,
  add column if not exists location_label text null,
  add column if not exists is_read boolean default false,
  add column if not exists delete_after timestamptz null;
update public.messages set body = text where body is null and text is not null;
alter table public.messages drop constraint if exists messages_message_type_check;
alter table public.messages add constraint messages_message_type_check
  check (message_type in ('text','image','video','file','location','system'));
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at);
create index if not exists messages_expired_media_idx on public.messages(delete_after) where attachment_path is not null;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Participants read conversations" on public.conversations for select to authenticated
using (auth.uid() in (participant_one,participant_two));
create policy "Participants create direct conversations" on public.conversations for insert to authenticated
with check (auth.uid() in (participant_one,participant_two) and request_id is null);
create policy "Participants update conversations" on public.conversations for update to authenticated
using (auth.uid() in (participant_one,participant_two)) with check (auth.uid() in (participant_one,participant_two));

create policy "Participants read messages" on public.messages for select to authenticated
using (exists(select 1 from public.conversations c where c.id=messages.conversation_id and auth.uid() in (c.participant_one,c.participant_two)));
create policy "Participants send to open conversations" on public.messages for insert to authenticated
with check (sender_id=auth.uid() and exists(select 1 from public.conversations c where c.id=messages.conversation_id and c.status='open' and auth.uid() in (c.participant_one,c.participant_two)));
create policy "Recipients mark messages read" on public.messages for update to authenticated
using (sender_id<>auth.uid() and exists(select 1 from public.conversations c where c.id=messages.conversation_id and auth.uid() in (c.participant_one,c.participant_two)))
with check (sender_id<>auth.uid());

create or replace function public.get_or_create_request_conversation(requested_request_id uuid)
returns public.conversations language plpgsql security definer set search_path=''
as $$
declare target public.service_requests; prof public.professional_profiles; result public.conversations;
begin
  select * into target from public.service_requests where id=requested_request_id and status='open';
  if target.id is null then raise exception 'request unavailable'; end if;
  select * into prof from public.professional_profiles where user_id=auth.uid();
  if prof.id is null then raise exception 'professional profile required'; end if;
  if not exists(select 1 from public.professional_categories pc join public.service_areas sa on sa.professional_id=pc.professional_id
    where pc.professional_id=prof.id and pc.category_id=target.category_id and lower(sa.city)=lower(target.city) and lower(sa.province)=lower(target.province))
  then raise exception 'request not compatible'; end if;
  select * into result from public.conversations c where c.request_id=target.id and
    least(c.participant_one,c.participant_two)=least(target.client_id,auth.uid()) and greatest(c.participant_one,c.participant_two)=greatest(target.client_id,auth.uid());
  if result.id is null then
    insert into public.conversations(request_id,participant_one,participant_two,status,last_message,last_message_at)
    values(target.id,target.client_id,auth.uid(),'open','Conversazione avviata per questa richiesta',now()) returning * into result;
    insert into public.messages(conversation_id,sender_id,body,text,message_type,is_read)
    values(result.id,auth.uid(),'Conversazione avviata per questa richiesta','Conversazione avviata per questa richiesta','system',false);
    insert into public.notifications(user_id,type,request_id,title,content)
    values(target.client_id,'new_message',target.id,'Un professionista ti ha contattato','Un professionista ti ha contattato per la tua richiesta');
  end if;
  return result;
end; $$;
revoke all on function public.get_or_create_request_conversation(uuid) from public,anon;
grant execute on function public.get_or_create_request_conversation(uuid) to authenticated;

create or replace function public.notify_chat_event(requested_conversation_id uuid,event_type text,event_title text,event_content text)
returns void language plpgsql security definer set search_path=''
as $$ declare c public.conversations; recipient uuid; begin
 select * into c from public.conversations where id=requested_conversation_id and auth.uid() in(participant_one,participant_two);
 if c.id is null then raise exception 'conversation forbidden'; end if;
 recipient:=case when c.participant_one=auth.uid() then c.participant_two else c.participant_one end;
 insert into public.notifications(user_id,type,request_id,title,content) values(recipient,event_type,c.request_id,event_title,left(event_content,180));
end; $$;
revoke all on function public.notify_chat_event(uuid,text,text,text) from public,anon;
grant execute on function public.notify_chat_event(uuid,text,text,text) to authenticated;

create or replace function public.close_my_conversation(requested_conversation_id uuid)
returns public.conversations language plpgsql security definer set search_path=''
as $$ declare c public.conversations; recipient uuid; begin
 select * into c from public.conversations where id=requested_conversation_id and auth.uid() in(participant_one,participant_two) for update;
 if c.id is null then raise exception 'conversation forbidden'; end if;
 if c.status<>'open' then return c; end if;
 update public.conversations set status='closed',closed_at=now(),last_message='Conversazione chiusa',last_message_at=now() where id=c.id returning * into c;
 update public.messages set delete_after=now()+interval '30 days' where conversation_id=c.id and attachment_path is not null;
 insert into public.messages(conversation_id,sender_id,body,text,message_type,is_read)
 values(c.id,auth.uid(),'Conversazione chiusa. Gli allegati saranno eliminati automaticamente dopo 30 giorni.','Conversazione chiusa. Gli allegati saranno eliminati automaticamente dopo 30 giorni.','system',false);
 recipient:=case when c.participant_one=auth.uid() then c.participant_two else c.participant_one end;
 insert into public.notifications(user_id,type,request_id,title,content) values(recipient,'conversation_closed',c.request_id,'Conversazione chiusa','La conversazione è stata chiusa');
 return c;
end; $$;
revoke all on function public.close_my_conversation(uuid) from public,anon;
grant execute on function public.close_my_conversation(uuid) to authenticated;

create or replace function public.mark_conversation_messages_read(requested_conversation_id uuid)
returns integer language plpgsql security definer set search_path=''
as $$ declare affected integer; begin
 if not exists(select 1 from public.conversations c where c.id=requested_conversation_id and auth.uid() in(c.participant_one,c.participant_two)) then raise exception 'conversation forbidden'; end if;
 update public.messages set is_read=true where conversation_id=requested_conversation_id and sender_id<>auth.uid() and not is_read;
 get diagnostics affected=row_count; return affected;
end; $$;
revoke all on function public.mark_conversation_messages_read(uuid) from public,anon;
grant execute on function public.mark_conversation_messages_read(uuid) to authenticated;

create or replace function public.update_conversation_after_message()
returns trigger language plpgsql security definer set search_path=''
as $$ begin update public.conversations set last_message=coalesce(new.body,case when new.message_type='location' then 'Posizione condivisa' else 'Allegato' end),last_message_at=new.created_at where id=new.conversation_id; return new; end; $$;
drop trigger if exists messages_update_conversation on public.messages;
create trigger messages_update_conversation after insert on public.messages for each row execute function public.update_conversation_after_message();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('chat-media','chat-media',false,26214400,array['image/jpeg','image/png','image/webp','video/mp4','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Chat participants upload media" on storage.objects for insert to authenticated
with check(bucket_id='chat-media' and exists(select 1 from public.conversations c where c.id=(storage.foldername(name))[1]::uuid and auth.uid() in(c.participant_one,c.participant_two)) and (storage.foldername(name))[2]=auth.uid()::text);
create policy "Chat participants read media" on storage.objects for select to authenticated
using(bucket_id='chat-media' and exists(select 1 from public.conversations c where c.id=(storage.foldername(name))[1]::uuid and auth.uid() in(c.participant_one,c.participant_two)));
create policy "Chat senders delete media" on storage.objects for delete to authenticated
using(bucket_id='chat-media' and (storage.foldername(name))[2]=auth.uid()::text);

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
