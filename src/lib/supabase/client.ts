import { createClient } from '@supabase/supabase-js';

// Support both Vite standard and user requested NEXT_PUBLIC_ env prefixes for maximum flexibility
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Fallback values to avoid app crashing during initial cold-build if keys are not yet provided
const actualUrl = supabaseUrl || 'https://placeholder-project-id.supabase.co';
const actualKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-anon-key';

if (!isSupabaseConfigured) {
  console.warn('instaMax Warning: Supabase environment variables are not fully configured yet. Please configure them in your .env or Settings.');
}

export const supabase = createClient(actualUrl, actualKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // PKCE returns the authorization code in the query string, so it does not
    // conflict with React Router's hash-based routes.
    flowType: 'pkce',
  }
});
