import{ supabase }from'./supabase/client';
export async function createJobApplicationNotification(id:string,title:string){const{error}=await supabase.rpc('notify_job_owner',{requested_application_id:id,event_title:'Nuova candidatura ricevuta',event_content:`Nuova candidatura per ${title}`});if(error)throw error;}
export async function createApplicationStatusNotification(id:string,status:string){const{error}=await supabase.rpc('notify_application_candidate',{requested_application_id:id,event_content:`La candidatura è ora: ${status}`});if(error)throw error;}
export async function createCandidateContactNotification(){return;}export async function createJobPostNearbyNotifications(){return 0;}
