import{ supabase }from'./supabase/client';
export type JobInput={title:string;description:string;category_id:string;city:string;province:string;contract_type:string;experience_required:string;availability_required:string;salary_range?:string|null};
export async function createJobPost(ownerId:string,ownerRole:'company'|'professional',x:JobInput){const{data,error}=await supabase.from('job_posts').insert({...x,owner_id:ownerId,owner_role:ownerRole,role_type:x.contract_type,status:'open'}).select().single();if(error)throw error;return data;}
export async function updateJobPost(id:string,x:Partial<JobInput>&{status?:string}){const{data,error}=await supabase.from('job_posts').update(x).eq('id',id).select().single();if(error)throw error;return data;}
export const closeJobPost=(id:string)=>updateJobPost(id,{status:'closed'});export const pauseJobPost=(id:string)=>updateJobPost(id,{status:'paused'});
export async function getJobPosts(){const{data,error}=await supabase.from('job_posts').select('*,categories(id,name)').eq('status','open').order('created_at',{ascending:false});if(error)throw error;return data??[];}
export async function getJobPostById(id:string){const{data,error}=await supabase.from('job_posts').select('*,categories(id,name)').eq('id',id).single();if(error)throw error;return data;}
export async function getJobPostsForOwner(ownerId:string){const{data,error}=await supabase.from('job_posts').select('*,categories(id,name)').eq('owner_id',ownerId).order('created_at',{ascending:false});if(error)throw error;return data??[];}
export const getCompatibleJobsForCandidate=getJobPosts;
