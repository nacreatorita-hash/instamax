// Types for HandyGo database models

export type UserRole = 'client' | 'professional' | 'company' | 'candidate';
export type PricingMode = 'hourly' | 'negotiable';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  municipality_code: string | null;
  province_code: string | null;
  province: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  active: boolean;
  created_at?: string;
}

export interface ItalianLocation {
  id: string;
  city: string;
  province: string;
  region: string | null;
  active: boolean;
}

export interface ProfessionalProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  vat_number: string | null;
  bio: string | null;
  status: 'available' | 'busy' | 'not_available';
  years_experience: number;
  verified: boolean;
  rating: number;
  total_reviews: number;
  pricing_mode: PricingMode;
  hourly_rate: number | null;
  currency: 'EUR';
  created_at?: string;
  updated_at?: string;
}

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  vat_number: string | null;
  bio: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  verified: boolean;
  rating: number;
  total_reviews: number;
  pricing_mode: PricingMode;
  hourly_rate: number | null;
  currency: 'EUR';
  created_at?: string;
  updated_at?: string;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  main_job_title: string | null;
  skills: string[];
  years_experience: number;
  driving_license: string | null;
  has_car: boolean;
  available_now: boolean;
  available_travel: boolean;
  bio: string | null;
  cv_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'professional_pro' | 'company_business' | 'candidate_premium';
  status: string;
  started_at?: string;
  expires_at?: string | null;
}

export type RequestUrgency = 'urgent' | 'today' | 'tomorrow' | 'week' | 'not_urgent';
export type RequestStatus = 'open' | 'awaiting_client_choice' | 'assigned' | 'in_progress' | 'awaiting_completion' | 'completed' | 'cancelled';

export interface RequestMedia {
  id: string;
  request_id: string;
  file_url: string;
  file_type: string;
  file_name: string | null;
  file_size: number | null;
  storage_path: string | null;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  client_id: string;
  category_id: string;
  title: string;
  description: string;
  city: string;
  municipality_code: string | null;
  province_code: string | null;
  province: string;
  urgency: RequestUrgency;
  budget: number | null;
  status: RequestStatus;
  assigned_user_id: string | null;
  assigned_at: string | null;
  started_at: string | null;
  client_start_confirmed: boolean;
  professional_start_confirmed: boolean;
  client_completion_confirmed: boolean;
  professional_completion_confirmed: boolean;
  client_completed_at: string | null;
  professional_completed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, 'id' | 'name' | 'slug' | 'icon'> | null;
  request_media?: RequestMedia[];
}

export type ProposalStatus = 'pending' | 'selected' | 'rejected' | 'withdrawn';
export interface RequestProposal {
  id: string;
  request_id: string;
  professional_user_id: string;
  professional_role: 'professional' | 'company';
  message: string | null;
  proposed_availability: string | null;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
  provider_profile?: Pick<Profile, 'id'|'full_name'|'avatar_url'|'city'|'province'> | null;
  professional_details?: Pick<ProfessionalProfile,'business_name'|'years_experience'|'verified'|'rating'|'total_reviews'|'pricing_mode'|'hourly_rate'> | null;
  company_details?: Pick<CompanyProfile,'company_name'|'verified'|'pricing_mode'|'hourly_rate'|'rating'|'total_reviews'> | null;
}

export interface ServiceReview {
  id: string; request_id: string; reviewer_id: string; reviewed_id: string; rating: number;
  comment: string | null; review_type: 'service_client_to_professional'; punctuality: number | null;
  professionalism: number | null; work_quality: number | null; price_clarity: number | null;
  communication: number | null; created_at: string; updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  request_id: string | null;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
}

export type ConversationStatus = 'open' | 'closed' | 'archived';
export type MessageType = 'text' | 'image' | 'video' | 'file' | 'location' | 'system';
export interface Conversation {
  id:string; request_id:string|null; job_post_id:string|null; participant_one:string; participant_two:string;
  status:ConversationStatus; last_message:string|null; last_message_at:string|null; closed_at:string|null;
  created_at:string; updated_at:string; service_requests?:Pick<ServiceRequest,'id'|'title'|'status'>|null;
  job_posts?:{ id:string; title:string }|null;
  other_profile?:Pick<Profile,'id'|'full_name'|'avatar_url'>|null; unread_count?:number;
}
export interface ChatMessage {
  id:string; conversation_id:string; sender_id:string; body:string|null; message_type:MessageType;
  attachment_url:string|null; attachment_path:string|null; attachment_name:string|null; attachment_size:number|null;
  location_lat:number|null; location_lng:number|null; location_label:string|null; is_read:boolean;
  delete_after:string|null; created_at:string;
}
