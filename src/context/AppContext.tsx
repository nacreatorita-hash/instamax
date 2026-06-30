import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  RequestItem, 
  ProfessionalItem, 
  CandidateItem, 
  JobItem, 
  ChatThread, 
  NotificationItem,
  UserRole,
  ChatMessage
} from '../types';
import { 
  initializeStorage, 
  getStoredState, 
  setStoredState,
  DEFAULT_PROFILES
} from '../data';

interface AppContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  profiles: Record<UserRole, UserProfile>;
  updateProfile: (role: UserRole, updated: Partial<UserProfile>) => void;
  requests: RequestItem[];
  addRequest: (request: Omit<RequestItem, 'id' | 'clientName' | 'clientAvatar' | 'date' | 'bidsCount'>) => void;
  updateRequestStatus: (id: string, status: RequestItem['status']) => void;
  jobs: JobItem[];
  addJob: (job: Omit<JobItem, 'id' | 'companyName' | 'companyLogo' | 'date' | 'applicationsCount'>) => void;
  professionals: ProfessionalItem[];
  toggleProfessionalStatus: (id: string) => void;
  candidates: CandidateItem[];
  toggleCandidateStatus: (id: string) => void;
  chats: ChatThread[];
  sendChatMessage: (threadId: string, text: string) => void;
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize storage once before loading states
  useEffect(() => {
    initializeStorage();
  }, []);

  const [activeRole, setActiveRoleState] = useState<UserRole>(() => 
    getStoredState<UserRole>('active_role', 'client')
  );

  const [profiles, setProfiles] = useState<Record<UserRole, UserProfile>>(() => 
    getStoredState<Record<UserRole, UserProfile>>('profiles', DEFAULT_PROFILES)
  );

  const [requests, setRequests] = useState<RequestItem[]>(() => 
    getStoredState<RequestItem[]>('requests', [])
  );

  const [jobs, setJobs] = useState<JobItem[]>(() => 
    getStoredState<JobItem[]>('jobs', [])
  );

  const [professionals, setProfessionals] = useState<ProfessionalItem[]>(() => 
    getStoredState<ProfessionalItem[]>('professionals', [])
  );

  const [candidates, setCandidates] = useState<CandidateItem[]>(() => 
    getStoredState<CandidateItem[]>('candidates', [])
  );

  const [chats, setChats] = useState<ChatThread[]>(() => 
    getStoredState<ChatThread[]>('chats', [])
  );

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => 
    getStoredState<NotificationItem[]>('notifications', [])
  );

  // Sync state modifications to localStorage
  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem('handygo_active_role', JSON.stringify(role));
  };

  const updateProfile = (role: UserRole, updated: Partial<UserProfile>) => {
    setProfiles(prev => {
      const next = { ...prev, [role]: { ...prev[role], ...updated } };
      setStoredState('profiles', next);
      return next;
    });
  };

  const addRequest = (newReq: Omit<RequestItem, 'id' | 'clientName' | 'clientAvatar' | 'date' | 'bidsCount'>) => {
    const currentProfile = profiles.client;
    const item: RequestItem = {
      ...newReq,
      id: `req-${Date.now()}`,
      clientName: currentProfile.name,
      clientAvatar: currentProfile.avatar,
      date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
      bidsCount: 0
    };

    setRequests(prev => {
      const next = [item, ...prev];
      setStoredState('requests', next);
      return next;
    });

    // Create a notification for Professionals that a new job in their area is available
    const newNotification: NotificationItem = {
      id: `n-${Date.now()}`,
      title: 'Nuova richiesta pubblicata',
      description: `La tua richiesta "${newReq.title}" è attiva. I professionisti riceveranno la notifica.`,
      type: 'success',
      time: 'Ora',
      read: false
    };

    setNotifications(prev => {
      const next = [newNotification, ...prev];
      setStoredState('notifications', next);
      return next;
    });
  };

  const updateRequestStatus = (id: string, status: RequestItem['status']) => {
    setRequests(prev => {
      const next = prev.map(r => r.id === id ? { ...r, status } : r);
      setStoredState('requests', next);
      return next;
    });
  };

  const addJob = (newJob: Omit<JobItem, 'id' | 'companyName' | 'companyLogo' | 'date' | 'applicationsCount'>) => {
    const currentCompany = profiles.company;
    const item: JobItem = {
      ...newJob,
      id: `job-${Date.now()}`,
      companyName: currentCompany.companyName || currentCompany.name,
      companyLogo: currentCompany.avatar,
      date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
      applicationsCount: 0
    };

    setJobs(prev => {
      const next = [item, ...prev];
      setStoredState('jobs', next);
      return next;
    });

    const newNotification: NotificationItem = {
      id: `n-${Date.now()}`,
      title: 'Annuncio pubblicato',
      description: `La tua offerta di lavoro "${newJob.title}" è online e visibile ai candidati.`,
      type: 'success',
      time: 'Ora',
      read: false
    };

    setNotifications(prev => {
      const next = [newNotification, ...prev];
      setStoredState('notifications', next);
      return next;
    });
  };

  const toggleProfessionalStatus = (id: string) => {
    setProfessionals(prev => {
      const next = prev.map(p => p.id === id ? { ...p, isOnline: !p.isOnline } : p);
      setStoredState('professionals', next);
      return next;
    });
  };

  const toggleCandidateStatus = (id: string) => {
    setCandidates(prev => {
      const next = prev.map(c => c.id === id ? { ...c, isAvailable: !c.isAvailable } : c);
      setStoredState('candidates', next);
      return next;
    });
  };

  const sendChatMessage = (threadId: string, text: string) => {
    const message: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text,
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => {
      const next = prev.map(thread => {
        if (thread.id === threadId) {
          return {
            ...thread,
            lastMessage: text,
            lastMessageTime: message.timestamp,
            messages: [...thread.messages, message]
          };
        }
        return thread;
      });
      setStoredState('chats', next);
      return next;
    });

    // Simulate auto-reply from the other user after 1.5 seconds for incredible premium interactivity!
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: 'them',
        text: `Grazie per avermi contattato! Ho letto il tuo messaggio: "${text.length > 30 ? text.substring(0, 30) + '...' : text}". Ti risponderò al più presto per definire i dettagli.`,
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      };

      setChats(currentChats => {
        const updated = currentChats.map(thread => {
          if (thread.id === threadId) {
            return {
              ...thread,
              lastMessage: replyMessage.text,
              lastMessageTime: replyMessage.timestamp,
              unreadCount: thread.unreadCount + 1,
              messages: [...thread.messages, replyMessage]
            };
          }
          return thread;
        });
        setStoredState('chats', updated);
        return updated;
      });

      // Also trigger a notification
      setNotifications(currentNotifs => {
        const incomingThread = chats.find(c => c.id === threadId);
        const name = incomingThread ? incomingThread.recipientName : 'Professionista';
        const newNotif: NotificationItem = {
          id: `n-${Date.now()}`,
          title: `Nuovo messaggio da ${name}`,
          description: replyMessage.text,
          type: 'message',
          time: 'Ora',
          read: false
        };
        const nextNotifs = [newNotif, ...currentNotifs];
        setStoredState('notifications', nextNotifs);
        return nextNotifs;
      });
    }, 1500);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      setStoredState('notifications', next);
      return next;
    });
  };

  const clearNotifications = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      setStoredState('notifications', next);
      return next;
    });
  };

  return (
    <AppContext.Provider value={{
      activeRole,
      setActiveRole,
      profiles,
      updateProfile,
      requests,
      addRequest,
      updateRequestStatus,
      jobs,
      addJob,
      professionals,
      toggleProfessionalStatus,
      candidates,
      toggleCandidateStatus,
      chats,
      sendChatMessage,
      notifications,
      markNotificationAsRead,
      clearNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
