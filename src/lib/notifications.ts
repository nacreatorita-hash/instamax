import { supabase } from './supabase/client';
import type { Notification } from './supabase/types';

export async function createNotification(input: Pick<Notification, 'user_id' | 'title' | 'content'> & Partial<Notification>) {
  const { data, error } = await supabase.from('notifications').insert(input).select().single();
  if (error) throw error;
  return data as Notification;
}

export async function createRequestNotifications(requestId: string) {
  const { data, error } = await supabase.rpc('notify_compatible_professionals', { requested_request_id: requestId });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function getUserNotifications(userId: string) {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(30);
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationAsRead(id: string) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

async function notifyChat(conversationId:string,type:string,title:string,content:string){const {error}=await supabase.rpc('notify_chat_event',{requested_conversation_id:conversationId,event_type:type,event_title:title,event_content:content});if(error)throw error;}
export const createMessageNotification=(conversationId:string,preview:string)=>notifyChat(conversationId,'new_message','Nuovo messaggio',preview);
export const createLocationNotification=(conversationId:string)=>notifyChat(conversationId,'location_shared','Posizione condivisa in chat','È stata condivisa una posizione nella conversazione privata');
export const createConversationClosedNotification=(conversationId:string)=>notifyChat(conversationId,'conversation_closed','Conversazione chiusa','La conversazione è stata chiusa');
