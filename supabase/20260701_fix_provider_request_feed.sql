-- Return the provider feed with an explicit category/area match.
-- The caller must be the authenticated provider; RLS remains enabled as defence in depth.
create or replace function public.get_compatible_requests_for_user(p_user_id uuid default auth.uid())
returns setof public.service_requests
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'forbidden';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('professional', 'company')
  ) then
    return;
  end if;

  return query
    select r.*
    from public.service_requests r
    where r.status in ('open', 'awaiting_client_choice')
      and public.provider_matches_request(auth.uid(), r)
    order by
      case r.urgency
        when 'urgent' then 0
        when 'today' then 1
        when 'tomorrow' then 2
        when 'week' then 3
        else 4
      end,
      r.created_at desc;
end;
$$;

revoke all on function public.get_compatible_requests_for_user(uuid) from public, anon;
grant execute on function public.get_compatible_requests_for_user(uuid) to authenticated;
