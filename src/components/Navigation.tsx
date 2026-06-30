import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ClipboardList, 
  MessageSquare, 
  Briefcase, 
  User, 
  Bell, 
  Settings, 
  LogOut, 
  UserCheck, 
  Users,
  Compass
} from 'lucide-react';
import { Avatar, Badge } from './UI';
import { useAuth } from '../lib/auth/useAuth';
import { getRedirectPath } from '../lib/auth/roleRedirect';
import { getUserNotifications, markNotificationAsRead } from '../lib/notifications';
import type { Notification } from '../lib/supabase/types';
import { getUnreadMessagesCount, subscribeToConversations } from '../lib/chat';
import { supabase } from '../lib/supabase/client';
import { APP_ROUTES, buildAppRoute, navigateTo } from '../lib/navigation';

// === NOTIFICATION BELL ===
export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    try { setNotifications(await getUserNotifications(user.id)); }
    catch (error) { console.warn('Impossibile caricare le notifiche:', error); }
  };
  useEffect(() => {
    void loadNotifications();
    if (!user) return;
    const channel = supabase.channel(`notifications:${user.id}:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => void loadNotifications())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2.5 rounded-full hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950"
        id="notification-bell"
      >
        <Bell size={20} className="text-zinc-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 bg-zinc-950 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white animate-scale">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2.5 w-80 bg-white border border-zinc-100 rounded-3xl shadow-xl z-40 p-4 animate-fade-in origin-top-right">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-50 mb-2">
              <span className="font-semibold text-zinc-950 text-sm">Notifiche</span>
              {unreadCount > 0 && (
                <button 
                  onClick={() => void Promise.all(notifications.filter(item=>!item.read).map(item=>markNotificationAsRead(item.id))).then(loadNotifications)}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                >
                  Segna come lette
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto flex flex-col gap-2.5 py-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-zinc-400">Nessuna notifica presente</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => void markNotificationAsRead(notif.id).then(loadNotifications)}
                    className={`p-3 rounded-2xl transition-colors cursor-pointer text-left ${notif.read ? 'bg-white hover:bg-zinc-50' : 'bg-zinc-50/70 hover:bg-zinc-50'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold ${notif.read ? 'text-zinc-700' : 'text-zinc-950'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[9px] text-zinc-400 font-medium whitespace-nowrap">{new Date(notif.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{notif.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// === BOTTOM NAVIGATION (MOBILE-FIRST) ===
export const BottomNavigation: React.FC = () => {
  const { user, profile } = useAuth();
  const [unreadChats, setUnreadChats] = useState(0);
  useEffect(() => {
    if (!user) { setUnreadChats(0); return; }
    const refresh = () => void getUnreadMessagesCount(user.id).then(setUnreadChats).catch(() => setUnreadChats(0));
    refresh();
    return subscribeToConversations(user.id, refresh);
  }, [user?.id]);

  const navItems = [
    { to: profile ? getRedirectPath(profile.role) : buildAppRoute(APP_ROUTES.home), label: 'Home', icon: Home },
    { to: buildAppRoute(APP_ROUTES.requests), label: 'Richieste', icon: ClipboardList },
    { to: buildAppRoute(APP_ROUTES.chat), label: 'Chat', icon: MessageSquare, hasBadge: unreadChats > 0, badgeCount: unreadChats },
    { to: buildAppRoute(APP_ROUTES.jobs), label: 'Lavoro', icon: Briefcase },
    { to: buildAppRoute(APP_ROUTES.profile), label: 'Profilo', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-zinc-950/95 backdrop-blur-md rounded-[2rem] p-1.5 px-3.5 shadow-2xl flex items-center justify-between z-50 border border-white/10">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 min-w-[62px] relative ${
              isActive 
                ? 'bg-white/15 text-white shadow-inner font-extrabold' 
                : 'text-zinc-400 hover:text-white font-medium'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon size={18} className="mb-0.5" />
              {item.hasBadge && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-red-500 text-[9px] text-white rounded-full flex items-center justify-center border border-zinc-950 font-black">
                  {item.badgeCount}
                </span>
              )}
            </div>
            <span className="text-[9px] uppercase tracking-wider scale-90">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

// === SIDEBAR (DESKTOP GRID) ===
export const Sidebar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const homePath = profile ? getRedirectPath(profile.role) : buildAppRoute(APP_ROUTES.home);

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigateTo(navigate, APP_ROUTES.login, { replace: true });
    }
  };

  const menuItems = [
    { path: homePath, label: 'Home', icon: Home },
    { path: buildAppRoute(APP_ROUTES.requests), label: 'Richieste Clienti', icon: ClipboardList },
    { path: buildAppRoute(APP_ROUTES.chat), label: 'Messaggi Chat', icon: MessageSquare },
    { path: buildAppRoute(APP_ROUTES.jobs), label: 'Offerte Lavoro', icon: Briefcase },
    { path: buildAppRoute(APP_ROUTES.professionals), label: 'Professionisti', icon: UserCheck },
    { path: buildAppRoute(APP_ROUTES.candidates), label: 'Candidati', icon: Users },
    { path: buildAppRoute(APP_ROUTES.profile), label: 'Mio Profilo', icon: User },
    { path: buildAppRoute(APP_ROUTES.settings), label: 'Impostazioni', icon: Settings },
  ];

  const roleLabels = {
    client: { label: 'Cliente', color: 'bg-zinc-900 text-white border-zinc-900' },
    professional: { label: 'Professionista', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    company: { label: 'Azienda', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    candidate: { label: 'Candidato', color: 'bg-amber-50 text-amber-700 border-amber-100' }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-zinc-100 p-6 overflow-y-auto z-10 select-none">
      {/* Brand logo */}
      <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigateTo(navigate, homePath)}>
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900 italic">instaMax</span>
      </div>

      {/* Real authenticated profile. Role changes are available only in Profile. */}
      <button type="button" onClick={() => navigateTo(navigate, APP_ROUTES.profile)} className="mb-6 p-4 rounded-3xl bg-zinc-50 border border-zinc-100 flex flex-col gap-3 text-left hover:border-blue-200 transition">
        <div className="flex items-center gap-3">
          <Avatar src={profile?.avatar_url ?? undefined} name={profile?.full_name ?? 'Completa il tuo profilo'} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-900 truncate">{profile?.full_name || 'Completa il tuo profilo'}</p>
            {profile?.email && <p className="text-[10px] text-zinc-400 truncate mt-0.5">{profile.email}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ruolo</span>
          <div className={`text-center py-1.5 px-3 rounded-full text-[11px] font-bold border ${roleLabels[profile?.role ?? 'client'].color}`}>
            {roleLabels[profile?.role ?? 'client'].label}
          </div>
        </div>
      </button>

      {/* Nav Menu */}
      <nav className="flex-1 flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-102' 
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 font-medium'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="pt-4 border-t border-zinc-50 mt-4">
        <button 
          onClick={() => void handleLogout()}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          <span>Esci / Cambia account</span>
        </button>
      </div>
    </aside>
  );
};
