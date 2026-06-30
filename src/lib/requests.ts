import { supabase } from './supabase/client';
import type { RequestMedia, ServiceRequest } from './supabase/types';

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

export async function getCompatibleRequestsForProvider(userId: string) {
  const { data, error } = await supabase
    .rpc('get_compatible_requests_for_user', { p_user_id: userId })
    .select(requestSelect);
  if (error) throw error;
  const urgencyWeight: Record<ServiceRequest['urgency'], number> = {
    urgent: 0, today: 1, tomorrow: 2, week: 3, not_urgent: 4,
  };
  return ((data ?? []) as ServiceRequest[]).sort((a, b) =>
    urgencyWeight[a.urgency] - urgencyWeight[b.urgency]
    || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export const getCompatibleRequestsForProfessional = getCompatibleRequestsForProvider;

export function subscribeToCompatibleRequests(onChange: () => void) {
  const channel = supabase.channel(`compatible-requests:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
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
