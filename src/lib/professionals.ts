import { supabase } from './supabase/client';
import type { ProfessionalProfile } from './supabase/types';

export async function getProfessionalProfile(userId: string) {
  const { data, error } = await supabase.from('professional_profiles').select('*').eq('user_id', userId).single();
  if (error) throw error;
  return data as ProfessionalProfile;
}

export async function updateProfessionalProfile(userId: string, input: Partial<ProfessionalProfile>) {
  const { data, error } = await supabase.from('professional_profiles').update(input)
    .eq('user_id', userId).select().single();
  if (error) throw error;
  return data as ProfessionalProfile;
}

export async function getProfessionalCategories(professionalId: string) {
  const { data, error } = await supabase.from('professional_categories').select('category_id')
    .eq('professional_id', professionalId);
  if (error) throw error;
  return (data ?? []).map(row => row.category_id as string);
}

export async function setProfessionalCategories(professionalId: string, categoryIds: string[]) {
  const { error: deleteError } = await supabase.from('professional_categories').delete()
    .eq('professional_id', professionalId);
  if (deleteError) throw deleteError;
  if (!categoryIds.length) return;
  const { error } = await supabase.from('professional_categories').insert(
    categoryIds.map(categoryId => ({ professional_id: professionalId, category_id: categoryId }))
  );
  if (error) throw error;
}

export async function getServiceAreas(professionalId: string) {
  const { data, error } = await supabase.from('service_areas').select('city,province')
    .eq('professional_id', professionalId).order('city');
  if (error) throw error;
  return (data ?? []) as Array<{ city: string; province: string }>;
}

export async function setServiceAreas(professionalId: string, areas: Array<{ city: string; province: string }>) {
  const { error: deleteError } = await supabase.from('service_areas').delete().eq('professional_id', professionalId);
  if (deleteError) throw deleteError;
  if (!areas.length) return;
  const { error } = await supabase.from('service_areas').insert(
    areas.map(area => ({ professional_id: professionalId, city: area.city, province: area.province }))
  );
  if (error) throw error;
}

export async function getCompatibleProfessionalsForRequest(requestId: string) {
  const { data, error } = await supabase.rpc('get_compatible_professionals', { requested_request_id: requestId });
  if (error) throw error;
  return data ?? [];
}
