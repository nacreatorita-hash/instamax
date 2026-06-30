-- Run from a trusted Supabase Edge Function or scheduled cron.
select id, conversation_id, attachment_path, delete_after
from public.messages where attachment_path is not null and delete_after < now()
order by delete_after;

-- After deleting each object from bucket chat-media, clear its references:
-- update public.messages set attachment_url=null, attachment_path=null
-- where id='<message-id>' and delete_after < now();
