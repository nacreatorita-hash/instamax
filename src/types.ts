export type UserRole = 'client' | 'professional' | 'company' | 'candidate';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  bio: string;
  location: string;
  avatar: string;
  rating?: number;
  reviewsCount?: number;
  skills?: string[];
  hourlyRate?: number;
  experienceYears?: number;
  companyName?: string;
  industry?: string;
}

export interface RequestItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  clientName: string;
  clientAvatar?: string;
  date: string;
  budget: number;
  location: string;
  bidsCount: number;
  assignedTo?: string;
}

export interface ProfessionalItem {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviewsCount: number;
  bio: string;
  hourlyRate: number;
  skills: string[];
  location: string;
  avatar: string;
  isOnline: boolean;
  completedJobs: number;
}

export interface CandidateItem {
  id: string;
  name: string;
  desiredRole: string;
  experienceYears: number;
  rating: number;
  bio: string;
  skills: string[];
  location: string;
  avatar: string;
  cvUrl?: string;
  isAvailable: boolean;
}

export interface JobItem {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  salary: string;
  type: 'Full-time' | 'Part-time' | 'Contratto' | 'Remoto';
  location: string;
  description: string;
  date: string;
  requirements: string[];
  applicationsCount: number;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
}

export interface ChatThread {
  id: string;
  recipientName: string;
  recipientAvatar: string;
  recipientRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'message';
  time: string;
  read: boolean;
}
