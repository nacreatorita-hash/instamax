import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();

  // Premium loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Animated custom double ring loader */}
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <span className="text-sm font-bold tracking-tight text-zinc-900 italic font-display">instaMax</span>
          </div>
          <p className="text-xs text-zinc-400 font-semibold animate-pulse uppercase tracking-widest">Caricamento sessione...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-bold text-zinc-900">Profilo non disponibile</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            La sessione è valida, ma il profilo instaMax non è stato trovato. Verifica di aver eseguito lo schema SQL aggiornato su Supabase.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-6 rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold text-white"
          >
            Esci e torna al login
          </button>
        </div>
      </div>
    );
  }

  // If role is loaded and there are allowedRoles restrictions
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect user to their appropriate role dashboard if they are accessing the wrong dashboard
    return <Navigate to={`/dashboard/${profile.role}`} replace />;
  }

  return <>{children}</>;
};
