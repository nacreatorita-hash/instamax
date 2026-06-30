-- HandyGo: secure self-service role switching for authenticated users.
create or replace function public.change_my_role(requested_role text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if requested_role not in ('client', 'professional', 'company', 'candidate') then
    raise exception 'invalid role';
  end if;

  select * into current_profile from public.profiles where id = auth.uid() for update;
  if current_profile.id is null then raise exception 'profile not found'; end if;

  update public.profiles set role = requested_role where id = auth.uid();

  if requested_role = 'professional' then
    insert into public.professional_profiles (user_id)
    values (auth.uid()) on conflict (user_id) do nothing;
  elsif requested_role = 'company' then
    insert into public.company_profiles (user_id, company_name)
    values (auth.uid(), current_profile.full_name) on conflict (user_id) do nothing;
  elsif requested_role = 'candidate' then
    insert into public.candidate_profiles (user_id)
    values (auth.uid()) on conflict (user_id) do nothing;
  end if;

  select * into current_profile from public.profiles where id = auth.uid();
  return current_profile;
end;
$$;

revoke all on function public.change_my_role(text) from public, anon;
grant execute on function public.change_my_role(text) to authenticated;
