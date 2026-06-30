import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase/client';
import type { ChatMessage, Conversation, MessageType } from './supabase/types';

const conversationSelect = '*, service_requests(id,title), job_posts(id,title)';

type RealtimeStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED';

function enrichRealtimeStatus(status: string): RealtimeStatus | null {
  return ['SUBSCRIBED', 'CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)
    ? (status as RealtimeStatus)
    : null;
}

function removeChannel(channel: RealtimeChannel) {
  void supabase.removeChannel(channel);
}

function privateReference(conversation: Conversation) {
  return conversation.service_requests?.title
    ?? conversation.job_posts?.title
    ?? 'Conversazione privata';
}

export function getConversationReference(conversation: Conversation) {
  return privateReference(conversation);
}

export async function getUserConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select(conversationSelect)
    .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;

  const rows = (data ?? []) as Conversation[];
  if (!rows.length) return [];

  const otherIds = [
    ...new Set(rows.map(c => c.participant_one === userId ? c.participant_two : c.participant_one)),
  ];

  const [{ data: profiles, error: profileError }, { data: unread, error: unreadError }] = await Promise.all([
    otherIds.length
      ? supabase.from('profiles').select('id,full_name,avatar_url').in('id', otherIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', rows.map(row => row.id))
      .neq('sender_id', userId)
      .eq('is_read', false),
  ]);

  if (profileError) throw profileError;
  if (unreadError) throw unreadError;

  return rows.map(conversation => {
    const otherId = conversation.participant_one === userId
      ? conversation.participant_two
      : conversation.participant_one;

    return {
      ...conversation,
      other_profile: profiles?.find(profile => profile.id === otherId) ?? null,
      unread_count: unread?.filter(message => message.conversation_id === conversation.id).length ?? 0,
    };
  });
}

export async function getConversationById(id: string, userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select(conversationSelect)
    .eq('id', id)
    .single();

  if (error) throw error;

  const conversation = data as Conversation;
  if (![conversation.participant_one, conversation.participant_two].includes(userId)) {
    throw new Error('Non hai i permessi per aprire questa conversazione.');
  }

  const otherId = conversation.participant_one === userId
    ? conversation.participant_two
    : conversation.participant_one;

  const { data: other, error: profileError } = await supabase
    .from('profiles')
    .select('id,full_name,avatar_url')
    .eq('id', otherId)
    .single();

  if (profileError) throw profileError;
  return { ...conversation, other_profile: other };
}

export async function getOrCreateRequestConversation(requestId: string) {
  const { data, error } = await supabase.rpc('get_or_create_request_conversation', {
    requested_request_id: requestId,
  });
  if (error) throw error;
  return data as Conversation;
}

export async function getOrCreateCandidateConversation(candidateId: string, jobId?: string | null) {
  const { data, error } = await supabase.rpc('get_or_create_candidate_conversation', {
    requested_candidate_id: candidateId,
    requested_job_id: jobId ?? null,
  });
  if (error) throw error;
  return data as Conversation;
}

export const getOrCreateJobConversation = (candidateId: string, jobId: string) =>
  getOrCreateCandidateConversation(candidateId, jobId);

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

async function insertMessage(
  payload: Partial<ChatMessage> & Pick<ChatMessage, 'conversation_id' | 'sender_id' | 'message_type'>,
) {
  const { data, error } = await supabase
    .from('messages')
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (/row-level security|violates row-level security/i.test(error.message)) {
      throw new Error('Non puoi inviare messaggi in questa conversazione.');
    }
    throw error;
  }

  return data as ChatMessage;
}

export async function sendTextMessage(conversationId: string, senderId: string, body: string) {
  const clean = body.trim();
  if (!clean) throw new Error('Scrivi un messaggio prima di inviarlo.');
  if (clean.length > 2000) throw new Error('Il messaggio può contenere massimo 2000 caratteri.');

  return insertMessage({
    conversation_id: conversationId,
    sender_id: senderId,
    body: clean,
    text: clean,
    message_type: 'text',
    is_read: false,
  } as any);
}

export async function sendMediaMessage(
  conversationId: string,
  senderId: string,
  input: { url: string; path: string; name: string; size: number; type: MessageType },
) {
  return insertMessage({
    conversation_id: conversationId,
    sender_id: senderId,
    message_type: input.type,
    attachment_url: input.url,
    attachment_path: input.path,
    attachment_name: input.name,
    attachment_size: input.size,
    is_read: false,
  });
}

export async function sendLocationMessage(
  conversationId: string,
  senderId: string,
  lat: number,
  lng: number,
  label?: string,
) {
  return insertMessage({
    conversation_id: conversationId,
    sender_id: senderId,
    message_type: 'location',
    body: 'Posizione condivisa',
    text: 'Posizione condivisa',
    location_lat: lat,
    location_lng: lng,
    location_label: label ?? 'Posizione condivisa',
    is_read: false,
  } as any);
}

export async function markMessagesAsRead(conversationId: string) {
  const { error } = await supabase.rpc('mark_conversation_messages_read', {
    requested_conversation_id: conversationId,
  });
  if (error) throw error;
}

export async function closeConversation(conversationId: string) {
  const { data, error } = await supabase.rpc('close_my_conversation', {
    requested_conversation_id: conversationId,
  });
  if (error) throw error;
  return data as Conversation;
}

export function subscribeToMessages(
  conversationId: string,
  onChange: () => void,
  onStatus?: (status: RealtimeStatus) => void,
) {
  const channel = supabase
    .channel(`messages:${conversationId}:${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      onChange,
    )
    .subscribe(status => {
      const normalized = enrichRealtimeStatus(status);
      if (normalized) onStatus?.(normalized);
    });

  return () => removeChannel(channel);
}

export function subscribeToConversations(
  userId: string,
  onChange: () => void,
  onStatus?: (status: RealtimeStatus) => void,
) {
  const channel = supabase
    .channel(`conversations:${userId}:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onChange)
    .subscribe(status => {
      const normalized = enrichRealtimeStatus(status);
      if (normalized) onStatus?.(normalized);
    });

  return () => removeChannel(channel);
}

export async function getUnreadMessagesCount(userId: string) {
  const conversations = await getUserConversations(userId);
  return conversations.reduce((total, conversation) => total + (conversation.unread_count ?? 0), 0);
}
