import { supabase } from './supabase/client';
import type { CompanyProfile } from './supabase/types';
import type { Municipality } from './municipalities';

export async function getCompanyProfile(userId: string) {
  const { data, error } = await supabase.from('company_profiles').select('*').eq('user_id', userId).single();
  if (error) throw error;
  return data as CompanyProfile;
}

export async function updateCompanyProfile(userId: string, input: Partial<CompanyProfile>) {
  const { data, error } = await supabase.from('company_profiles').update(input)
    .eq('user_id', userId).select().single();
  if (error) throw error;
  return data as CompanyProfile;
}

export async function getCompanyCategories(companyId: string) {
  const { data, error } = await supabase.from('company_categories').select('category_id').eq('company_id', companyId);
  if (error) throw error;
  return (data ?? []).map(row => row.category_id as string);
}

export async function setCompanyCategories(companyId: string, categoryIds: string[]) {
  const { error: deleteError } = await supabase.from('company_categories').delete().eq('company_id', companyId);
  if (deleteError) throw deleteError;
  if (!categoryIds.length) return;
  const { error } = await supabase.from('company_categories').insert(categoryIds.map(categoryId => ({ company_id: companyId, category_id: categoryId })));
  if (error) throw error;
}

export async function getCompanyServiceAreas(companyId: string) {
  const { data, error } = await supabase.from('company_service_areas').select('municipality_code,city,province_code,province').eq('company_id', companyId).order('city');
  if (error) throw error;
  return (data ?? []) as Array<{ municipality_code: string | null; city: string; province_code: string | null; province: string }>;
}

export async function setCompanyServiceAreas(companyId: string, areas: Municipality[]) {
  const { error: deleteError } = await supabase.from('company_service_areas').delete().eq('company_id', companyId);
  if (deleteError) throw deleteError;
  if (!areas.length) return;
  const { error } = await supabase.from('company_service_areas').insert(areas.map(area => ({ company_id: companyId, municipality_code: area.code, city: area.name, province_code: area.provinceCode, province: area.provinceName })));
  if (error) throw error;
}
