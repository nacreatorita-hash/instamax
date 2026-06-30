import { supabase } from './supabase/client';
import type { RequestMedia, RequestStatus, ServiceRequest } from './supabase/types';

export type ServiceRequestInput = Pick<ServiceRequest,
  'title' | 'description' | 'category_id' | 'city' | 'province' | 'urgency'
> & { budget?: number | null };

const requestSelect = '*, categories(id,name,slug,icon), request_media(*)';

export async function createServiceRequest(clientId: string, input: ServiceRequestInput) {
  const { data, error } = await supabase.from('service_requests').insert({
    client_id: clientId,
    title: input.title.trim(),
    description: input.description.trim(),
    category_id: input.category_id,
    city: input.city.trim(),
    province: input.province.trim().toUpperCase(),
    urgency: input.urgency,
    budget: input.budget ?? null,
    status: 'open',
  }).select(requestSelect).single();
  if (error) throw error;
  return data as ServiceRequest;
}

export async function updateServiceRequest(id: string, input: Partial<ServiceRequestInput>) {
  const payload = { ...input, province: input.province?.trim().toUpperCase() };
  const { data, error } = await supabase.from('service_requests').update(payload)
    .eq('id', id).select(requestSelect).single();
  if (error) throw error;
  return data as ServiceRequest;
}

export async function deleteServiceRequest(id: string) {
  const media = await getRequestMedia(id);
  const paths = media.map(item => item.storage_path).filter((path): path is string => Boolean(path));
  if (paths.length) await supabase.storage.from('request-media').remove(paths);
  const { error } = await supabase.from('service_requests').delete().eq('id', id);
  if (error) throw error;
}

export async function closeServiceRequest(id: string) {
  return setRequestStatus(id, 'closed');
}

export async function setRequestStatus(id: string, status: RequestStatus) {
  const { data, error } = await supabase.from('service_requests').update({ status })
    .eq('id', id).select(requestSelect).single();
  if (error) throw error;
  return data as ServiceRequest;
}

export async function getRequestById(id: string) {
  const { data, error } = await supabase.from('service_requests').select(requestSelect).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as ServiceRequest | null;
}

export async function getRequestsForClient(clientId: string) {
  const { data, error } = await supabase.from('service_requests').select(requestSelect)
    .eq('client_id', clientId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ServiceRequest[];
}

export async function getCompatibleRequestsForProfessional() {
  const { data, error } = await supabase.from('service_requests').select(requestSelect)
    .eq('status', 'open').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ServiceRequest[];
}

export async function uploadRequestMedia(clientId: string, requestId: string, files: File[]) {
  if (files.length > 5) throw new Error('Puoi caricare al massimo 5 allegati.');
  const uploaded: RequestMedia[] = [];
  for (const file of files) {
    const isVideo = file.type.startsWith('video/');
    const limit = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
    if ((!file.type.startsWith('image/') && !isVideo) || file.size > limit) {
      throw new Error(`${file.name}: formato o dimensione non consentita.`);
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const storagePath = `${clientId}/${requestId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('request-media').upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: signed, error: signedError } = await supabase.storage.from('request-media')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    if (signedError) throw signedError;
    const { data, error } = await supabase.from('request_media').insert({
      request_id: requestId,
      file_url: signed.signedUrl,
      file_type: file.type,
      file_name: file.name,
      file_size: file.size,
      storage_path: storagePath,
    }).select().single();
    if (error) {
      await supabase.storage.from('request-media').remove([storagePath]);
      throw error;
    }
    uploaded.push(data as RequestMedia);
  }
  return uploaded;
}

export async function deleteRequestMedia(media: RequestMedia) {
  if (media.storage_path) {
    const { error } = await supabase.storage.from('request-media').remove([media.storage_path]);
    if (error) throw error;
  }
  const { error } = await supabase.from('request_media').delete().eq('id', media.id);
  if (error) throw error;
}

export async function getRequestMedia(requestId: string) {
  const { data, error } = await supabase.from('request_media').select('*')
    .eq('request_id', requestId).order('created_at');
  if (error) throw error;
  return (data ?? []) as RequestMedia[];
}
