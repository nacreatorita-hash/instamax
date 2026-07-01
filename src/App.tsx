/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  useLocation,
  Navigate
} from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './lib/auth/AuthProvider';
import { ProtectedRoute } from './lib/auth/ProtectedRoute';
import { useAuth } from './lib/auth/useAuth';
import { getRedirectPath } from './lib/auth/roleRedirect';

// Import Layout Components
import { Sidebar, BottomNavigation, NotificationBell } from './components/Navigation';

// Import Pages
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const Auth = lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Requests = lazy(() => import('./pages/Requests').then(module => ({ default: module.Requests })));
const RequestDetail = lazy(() => import('./pages/RequestDetail').then(module => ({ default: module.RequestDetail })));
const Jobs = lazy(() => import('./pages/Jobs').then(module => ({ default: module.Jobs })));
const ProfessionalsDirectory = lazy(() => import('./pages/Directories').then(module => ({ default: module.ProfessionalsDirectory })));
const CandidatesDirectory = lazy(() => import('./pages/Candidates').then(module => ({ default: module.Candidates })));
const Chat = lazy(() => import('./pages/Chat').then(module => ({ default: module.Chat })));
const Profile = lazy(() => import('./pages/ProfileSettings').then(module => ({ default: module.Profile })));
const Settings = lazy(() => import('./pages/ProfileSettings').then(module => ({ default: module.Settings })));

const PageLoader = () => (
  <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center" role="status" aria-label="Caricamento pagina">
    <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
  </div>
);

const RoleSynchronizer = () => {
  const { profile } = useAuth();
  const { activeRole, setActiveRole } = useApp();
  useEffect(() => {
    if (profile && profile.role !== activeRole) setActiveRole(profile.role);
  }, [profile, activeRole, setActiveRole]);
  return null;
};

const RoleDashboardRedirect = () => {
  const { profile } = useAuth();
  return profile ? <Navigate to={getRedirectPath(profile.role)} replace /> : <PageLoader />;
};

const PublicHome = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user && profile) return <Navigate to={getRedirectPath(profile.role)} replace />;
  return <LandingPage />;
};

// === CONDITIONAL LAYOUT WRAPPER ===
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Hide platform navigation and bars on landing page and auth views
  const isPublicRoute = 
    location.pathname === '/' || 
    location.pathname === '/login' || 
    location.pathname === '/register';

  if (isPublicRoute) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Fixed Left Sidebar on Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Universal Desktop Top bar */}
        <header className="hidden md:flex h-16 bg-white border-b border-zinc-100 px-8 items-center justify-end sticky top-0 z-30 select-none">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-zinc-400">Area personale</span>
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Persistent Bottom Tab-Bar on Mobile Screens */}
      <BottomNavigation />
    </div>
  );
};

// === ROUTING TREE ===
function AppRoutes() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicHome />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />

        {/* Dashboards (Resolve client/professional/company/candidate views) */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleDashboardRedirect /></ProtectedRoute>} />
        <Route path="/dashboard/client" element={<ProtectedRoute allowedRoles={['client']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/professional" element={<ProtectedRoute allowedRoles={['professional']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/company" element={<ProtectedRoute allowedRoles={['company']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/candidate" element={<ProtectedRoute allowedRoles={['candidate']}><Dashboard /></ProtectedRoute>} />

        {/* Requests Logs & Creation Form */}
        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/requests/new" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />

        {/* Career Opportunities */}
        <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
        <Route path="/jobs/new" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />

        {/* Search Directories */}
        <Route path="/candidates" element={<ProtectedRoute><CandidatesDirectory /></ProtectedRoute>} />
        <Route path="/candidates/:id" element={<ProtectedRoute><CandidatesDirectory /></ProtectedRoute>} />
        <Route path="/professionals" element={<ProtectedRoute><ProfessionalsDirectory /></ProtectedRoute>} />
        <Route path="/professionals/:id" element={<ProtectedRoute><ProfessionalsDirectory /></ProtectedRoute>} />

        {/* Chat System */}
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/massimo" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

        {/* Profiles & Configurations */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Fallback to Public Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <RoleSynchronizer />
          <AppRoutes />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}
