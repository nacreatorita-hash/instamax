import React, { createContext, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import type { Profile, Subscription, UserRole } from '../supabase/types';
import { getRedirectPath } from './roleRedirect';
import { PENDING_REQUEST_KEY } from '../smart-request';
import { APP_ROUTES, buildAppRoute } from '../navigation';
import { 
  getCurrentProfile, 
  getSubscription,
  signInWithEmail as apiSignInWithEmail,
  signUpWithEmail as apiSignUpWithEmail,
  signInWithGoogle as apiSignInWithGoogle,
  completeOAuthOnboarding,
  signOut as apiSignOut,
  updateProfile as apiUpdateProfile
} from '../supabase/auth';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<any>;
  signInWithGoogle: (role?: UserRole) => Promise<any>;
  signOut: () => Promise<void>;
  updateUserProfile: (profileData: Partial<Profile>) => Promise<Profile>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const completePendingOAuth = async () => {
    const pendingRole = localStorage.getItem('handygo_pending_oauth_role') as UserRole | null;
    if (!pendingRole) return;
    try {
      await completeOAuthOnboarding(pendingRole);
    } catch (error) {
      // Role completion is optional onboarding work and must never invalidate
      // an otherwise valid Google session.
      console.warn('OAuth role onboarding skipped:', error);
    } finally {
      localStorage.removeItem('handygo_pending_oauth_role');
    }
  };

  // Function to load the user profile and subscription from the database
  const loadUserData = async (currentUser: User) => {
    try {
      const userProfile = await getCurrentProfile(currentUser.id);
      setProfile(userProfile);

      if (userProfile) {
        const userSub = await getSubscription(currentUser.id);
        setSubscription(userSub);
      }
      return userProfile;
    } catch (err) {
      console.error('Error loading user profile or subscription:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserData(user);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const syncSessionUser = async (sessionUser: User | null) => {
      try {
        if (cancelled) return;
        setUser(sessionUser);
        if (sessionUser) {
          await completePendingOAuth();
          const restoredProfile = await loadUserData(sessionUser);

          // OAuth returns outside the HashRouter so the PKCE query remains
          // readable. Once the session is stored, clean the callback marker
          // and enter the role-specific dashboard.
          const callbackUrl = new URL(window.location.href);
          if (callbackUrl.searchParams.get('oauth_callback') === 'google') {
            const targetPath = restoredProfile
              ? localStorage.getItem(PENDING_REQUEST_KEY) && restoredProfile.role === 'client'
                ? buildAppRoute(APP_ROUTES.requestNew)
                : getRedirectPath(restoredProfile.role)
              : buildAppRoute(APP_ROUTES.dashboard);

            window.history.replaceState({}, document.title, window.location.pathname);
            window.location.hash = targetPath;
          }
        } else {
          setProfile(null);
          setSubscription(null);
        }
      } catch (error) {
        console.error('Auth state synchronization error:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Listen early so OAuth/session restoration events are not missed.
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Supabase recommends avoiding awaited API calls directly inside the
        // auth callback. Deferring prevents a lock while the OAuth exchange is
        // still persisting the new session.
        window.setTimeout(() => {
          void syncSessionUser(session?.user || null);
        }, 0);
      }
    );

    // getSession() also completes the OAuth code exchange on return.
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        await syncSessionUser(data.session?.user || null);
      } catch (err) {
        console.error('Initial session check error:', err);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void initSession();

    return () => {
      cancelled = true;
      authSubscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiSignInWithEmail(email, password);
      if (data.user) {
        setUser(data.user);
        await loadUserData(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    setLoading(true);
    try {
      const data = await apiSignUpWithEmail(email, password, fullName, role);
      if (data.user && data.session) {
        setUser(data.user);
        setProfile(data.profile);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (role?: UserRole) => {
    setLoading(true);
    try {
      return await apiSignInWithGoogle(role);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await apiSignOut();
      setUser(null);
      setProfile(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (profileData: Partial<Profile>) => {
    if (!user) throw new Error('Utente non autenticato.');
    try {
      const updated = await apiUpdateProfile(user.id, profileData);
      setProfile(updated);
      return updated;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        subscription,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateUserProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
