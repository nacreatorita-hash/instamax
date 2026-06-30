import { supabase } from './supabase/client';
import type { Conversation, RequestProposal, ServiceRequest, ServiceReview } from './supabase/types';

export async function getRequestProposals(requestId: string) {
  const { data, error } = await supabase.from('request_proposals')
    .select('*,provider_profile:profiles!request_proposals_professional_user_id_fkey(id,full_name,avatar_url,city,province)')
    .eq('request_id', requestId).order('created_at');
  if (error) throw error;
  const proposals = (data ?? []) as unknown as RequestProposal[];
  const professionalIds = proposals.filter(item=>item.professional_role==='professional').map(item=>item.professional_user_id);
  const companyIds = proposals.filter(item=>item.professional_role==='company').map(item=>item.professional_user_id);
  const [professionalResult, companyResult] = await Promise.all([
    professionalIds.length ? supabase.from('professional_profiles').select('user_id,business_name,years_experience,verified,rating,total_reviews,pricing_mode,hourly_rate').in('user_id',professionalIds) : Promise.resolve({data:[],error:null}),
    companyIds.length ? supabase.from('company_profiles').select('user_id,company_name,verified,rating,total_reviews,pricing_mode,hourly_rate').in('user_id',companyIds) : Promise.resolve({data:[],error:null}),
  ]);
  if (professionalResult.error) throw professionalResult.error;
  if (companyResult.error) throw companyResult.error;
  return proposals.map(item=>({
    ...item,
    professional_details: professionalResult.data?.find(row=>row.user_id===item.professional_user_id) ?? null,
    company_details: companyResult.data?.find(row=>row.user_id===item.professional_user_id) ?? null,
  })) as RequestProposal[];
}

export async function submitRequestProposal(requestId:string,message:string,availability:string){
  const{data,error}=await supabase.rpc('submit_request_proposal',{p_request_id:requestId,p_message:message||null,p_availability:availability||null});
  if(error)throw error;return data as RequestProposal;
}
export async function withdrawRequestProposal(requestId:string){const{data,error}=await supabase.rpc('withdraw_request_proposal',{p_request_id:requestId});if(error)throw error;return data as RequestProposal;}
export async function selectRequestProfessional(requestId:string,providerUserId:string){const{data,error}=await supabase.rpc('select_request_professional',{p_request_id:requestId,p_professional_user_id:providerUserId});if(error)throw error;return data as Conversation;}
export async function confirmRequestStart(requestId:string){const{data,error}=await supabase.rpc('confirm_request_start',{p_request_id:requestId});if(error)throw error;return data as ServiceRequest;}
export async function confirmRequestCompletion(requestId:string){const{data,error}=await supabase.rpc('confirm_request_completion',{p_request_id:requestId});if(error)throw error;return data as ServiceRequest;}
export async function cancelServiceRequest(requestId:string){const{data,error}=await supabase.rpc('cancel_service_request',{p_request_id:requestId});if(error)throw error;return data as ServiceRequest;}
export async function getServiceReview(requestId:string){const{data,error}=await supabase.from('reviews').select('*').eq('request_id',requestId).eq('review_type','service_client_to_professional').maybeSingle();if(error)throw error;return data as ServiceReview|null;}
export async function submitServiceReview(requestId:string,input:{rating:number;comment:string;punctuality?:number|null;professionalism?:number|null;workQuality?:number|null;priceClarity?:number|null;communication?:number|null}){const{data,error}=await supabase.rpc('submit_service_review',{p_request_id:requestId,p_rating:input.rating,p_comment:input.comment||null,p_punctuality:input.punctuality??null,p_professionalism:input.professionalism??null,p_work_quality:input.workQuality??null,p_price_clarity:input.priceClarity??null,p_communication:input.communication??null});if(error)throw error;return data as ServiceReview;}

export function subscribeToRequestWorkflow(requestId:string,onChange:()=>void){const channel=supabase.channel(`request-workflow:${requestId}:${crypto.randomUUID()}`).on('postgres_changes',{event:'*',schema:'public',table:'request_proposals',filter:`request_id=eq.${requestId}`},onChange).on('postgres_changes',{event:'UPDATE',schema:'public',table:'service_requests',filter:`id=eq.${requestId}`},onChange).subscribe();return()=>{void supabase.removeChannel(channel);};}
