import { supabase } from './supabase/client';
import type { ChatMessage, MessageType } from './supabase/types';

const allowed=['image/jpeg','image/png','image/webp','video/mp4','application/pdf'];
export function validateChatFile(file:File){
  if(!allowed.includes(file.type))throw new Error('Formato non consentito. Usa JPG, PNG, WebP, MP4 o PDF.');
  const max=file.type.startsWith('image/')?5:file.type.startsWith('video/')?25:10;
  if(file.size>max*1024*1024)throw new Error(`File troppo grande. Limite ${max} MB.`);
}
export async function uploadChatMedia(conversationId:string,userId:string,file:File){
  validateChatFile(file); const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
  const path=`${conversationId}/${userId}/${crypto.randomUUID()}-${safe}`;
  const {error}=await supabase.storage.from('chat-media').upload(path,file,{contentType:file.type}); if(error)throw error;
  const {data,error:signedError}=await supabase.storage.from('chat-media').createSignedUrl(path,60*60*24); if(signedError)throw signedError;
  const type:MessageType=file.type.startsWith('image/')?'image':file.type.startsWith('video/')?'video':'file';
  return {path,url:data.signedUrl,type};
}
export async function getChatMediaSignedUrl(path:string){const {data,error}=await supabase.storage.from('chat-media').createSignedUrl(path,3600);if(error)throw error;return data.signedUrl;}
export async function scheduleConversationMediaDeletion(conversationId:string){const {error}=await supabase.from('messages').update({delete_after:new Date(Date.now()+30*86400000).toISOString()}).eq('conversation_id',conversationId).not('attachment_path','is',null);if(error)throw error;}
export async function getExpiredChatMediaRecords(){const {data,error}=await supabase.from('messages').select('*').lt('delete_after',new Date().toISOString()).not('attachment_path','is',null);if(error)throw error;return(data??[]) as ChatMessage[];}
