import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Star, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  ExternalLink, 
  Briefcase 
} from 'lucide-react';
import { 
  RequestItem, 
  ProfessionalItem, 
  CandidateItem, 
  JobItem, 
  ChatThread 
} from '../types';
import { Card, Badge, Avatar, RatingStars, Button } from './UI';
import { useApp } from '../context/AppContext';
import type { ServiceRequest } from '../lib/supabase/types';

// === REQUEST CARD ===
interface RequestCardProps {
  request: RequestItem | ServiceRequest;
  onStatusChange?: (id: string, status: RequestItem['status']) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, onStatusChange }) => {
  const { activeRole, chats, sendChatMessage } = useApp();
  const navigate = useNavigate();

  if ('client_id' in request) {
    const urgencyLabels = { urgent: 'Urgente', today: 'Oggi', tomorrow: 'Entro domani', week: 'Questa settimana', not_urgent: 'Non urgente' };
    const statusLabels = { open: 'Aperta', in_progress: 'In corso', closed: 'Chiusa', cancelled: 'Annullata' };
    const elapsed = (() => {
      const seconds = Math.max(0, Math.floor((Date.now() - new Date(request.created_at).getTime()) / 1000));
      if (seconds < 60) return 'Adesso';
      if (seconds < 3600) return `${Math.floor(seconds / 60)} min fa`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)} ore fa`;
      return `${Math.floor(seconds / 86400)} giorni fa`;
    })();
    const cover = request.request_media?.find(media => media.file_type.startsWith('image/'));
    return (
      <Card className="overflow-hidden p-0 flex flex-col">
        {cover && <img src={cover.file_url} alt="Anteprima richiesta" className="h-40 w-full object-cover" />}
        <div className="p-5 flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={request.status === 'open' ? 'success' : request.status === 'in_progress' ? 'info' : 'gray'}>
              {statusLabels[request.status]}
            </Badge>
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1"><Clock size={12} /> {elapsed}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{request.categories?.name ?? 'Servizio'}</span>
            <h3 className="mt-1 text-base font-extrabold leading-snug text-zinc-950">{request.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">{request.description}</p>
          </div>
          <div className="mt-auto grid grid-cols-2 gap-3 rounded-2xl bg-zinc-50 p-3">
            <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5"><MapPin size={13} /> {request.city} ({request.province})</span>
            <span className="text-xs font-bold text-zinc-700 text-right">{request.budget == null ? 'Budget libero' : `€${request.budget}`}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Badge variant={request.urgency === 'urgent' ? 'warning' : 'gray'}>{urgencyLabels[request.urgency]}</Badge>
            <Button size="sm" onClick={() => navigate(`/requests/${request.id}`)}>Dettagli <ArrowRight size={14} /></Button>
          </div>
        </div>
      </Card>
    );
  }

  const statusColors = {
    pending: 'warning' as const,
    accepted: 'info' as const,
    completed: 'success' as const,
    cancelled: 'gray' as const,
  };

  const statusLabels = {
    pending: 'In attesa di offerte',
    accepted: 'Assegnato / In corso',
    completed: 'Completato',
    cancelled: 'Annullato',
  };

  const handleContactClient = () => {
    // Find or create a mock chat with the client
    navigate('/chat');
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={request.clientName} src={request.clientAvatar} size="sm" />
          <div>
            <h4 className="text-xs font-bold text-zinc-900">{request.clientName}</h4>
            <p className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
              <Clock size={10} /> {request.date}
            </p>
          </div>
        </div>
        <Badge variant={statusColors[request.status]}>
          {statusLabels[request.status]}
        </Badge>
      </div>

      <div className="mt-1">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
          {request.category}
        </span>
        <h3 className="text-base font-bold text-zinc-950 tracking-tight leading-snug">
          {request.title}
        </h3>
        <p className="text-sm text-zinc-600 mt-2 line-clamp-3 leading-relaxed">
          {request.description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-50 my-1 bg-zinc-50/50 rounded-2xl px-4">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-zinc-400" />
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-zinc-400 block leading-none">Località</span>
            <span className="text-xs font-bold text-zinc-700 truncate block mt-0.5">{request.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold text-xs">€</div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-zinc-400 block leading-none">Budget</span>
            <span className="text-xs font-bold text-zinc-900 block mt-0.5">€{request.budget}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-1">
        <span className="text-xs font-bold text-zinc-500">
          {request.bidsCount > 0 ? `${request.bidsCount} offerte ricevute` : 'Nessuna offerta'}
        </span>
        
        {activeRole === 'client' && request.status === 'pending' && onStatusChange && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onStatusChange(request.id, 'completed')}
            className="text-xs"
          >
            Segna come completato
          </Button>
        )}

        {activeRole === 'professional' && request.status === 'pending' && (
          <Button 
            size="sm" 
            variant="primary" 
            onClick={handleContactClient}
            className="text-xs"
          >
            Proponiti
          </Button>
        )}
      </div>
    </Card>
  );
};

// === PROFESSIONAL CARD ===
interface ProfessionalCardProps {
  professional: ProfessionalItem;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ professional }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-3">
          <Avatar 
            name={professional.name} 
            src={professional.avatar} 
            size="md" 
            isOnline={professional.isOnline} 
          />
          <div className="text-right">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Tariffa Media</span>
            <span className="text-lg font-black text-zinc-950">€{professional.hourlyRate}<span className="text-xs font-normal text-zinc-400">/h</span></span>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-base font-bold text-zinc-950 leading-tight">{professional.name}</h3>
          <p className="text-xs font-semibold text-zinc-500 mt-1">{professional.title}</p>
          
          <div className="mt-2.5">
            <RatingStars rating={professional.rating} count={professional.reviewsCount} />
          </div>

          <p className="text-xs text-zinc-600 mt-3 line-clamp-3 leading-relaxed">
            {professional.bio}
          </p>
        </div>

        {/* Skills wrapper */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {professional.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="px-2 py-0.5 bg-zinc-50 border border-zinc-100 rounded-full text-[10px] font-semibold text-zinc-500">
              {skill}
            </span>
          ))}
          {professional.skills.length > 3 && (
            <span className="px-2 py-0.5 bg-zinc-50 rounded-full text-[10px] font-bold text-zinc-400">
              +{professional.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-zinc-50 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
          <MapPin size={12} /> {professional.location}
        </span>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => navigate('/chat')}
          className="text-xs font-bold py-2 px-4 rounded-full flex items-center gap-1"
        >
          Contatta <ArrowRight size={12} />
        </Button>
      </div>
    </Card>
  );
};

// === CANDIDATE CARD ===
interface CandidateCardProps {
  candidate: CandidateItem;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-3">
          <Avatar 
            name={candidate.name} 
            src={candidate.avatar} 
            size="md" 
          />
          <Badge variant={candidate.isAvailable ? 'success' : 'gray'}>
            {candidate.isAvailable ? 'Disponibile subito' : 'Impegnato'}
          </Badge>
        </div>

        <div className="mt-4">
          <h3 className="text-base font-bold text-zinc-950 leading-tight">{candidate.name}</h3>
          <p className="text-xs font-semibold text-zinc-500 mt-1 flex items-center gap-1">
            <Briefcase size={12} className="text-zinc-400" /> {candidate.desiredRole}
          </p>
          
          <div className="mt-2.5">
            <RatingStars rating={candidate.rating} />
          </div>

          <p className="text-xs text-zinc-600 mt-3 line-clamp-3 leading-relaxed">
            {candidate.bio}
          </p>
        </div>

        {/* Skills list */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {candidate.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="px-2 py-0.5 bg-zinc-50 border border-zinc-100 rounded-full text-[10px] font-semibold text-zinc-500">
              {skill}
            </span>
          ))}
          {candidate.skills.length > 3 && (
            <span className="px-2 py-0.5 bg-zinc-50 rounded-full text-[10px] font-bold text-zinc-400">
              +{candidate.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-zinc-50 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
          <MapPin size={12} /> {candidate.location}
        </span>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => navigate('/chat')}
          className="text-xs font-bold py-2 px-4 rounded-full flex items-center gap-1"
        >
          Colloquio <ArrowRight size={12} />
        </Button>
      </div>
    </Card>
  );
};

// === JOB CARD ===
interface JobCardProps {
  job: JobItem;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { activeRole } = useApp();
  const navigate = useNavigate();

  const handleApply = () => {
    alert(`Candidatura inviata con successo per la posizione: ${job.title} presso ${job.companyName}!`);
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={job.companyName} src={job.companyLogo} size="sm" />
          <div>
            <h4 className="text-sm font-bold text-zinc-950 leading-tight">{job.companyName}</h4>
            <p className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
              <Calendar size={10} /> Inserito il {job.date}
            </p>
          </div>
        </div>
        <Badge variant={job.type === 'Remoto' ? 'success' : 'info'}>
          {job.type}
        </Badge>
      </div>

      <div>
        <h3 className="text-base font-extrabold text-zinc-950 tracking-tight leading-snug">
          {job.title}
        </h3>
        <p className="text-sm text-zinc-600 mt-2 line-clamp-3 leading-relaxed">
          {job.description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-50 my-1 bg-zinc-50/50 rounded-2xl px-4">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-zinc-400" />
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-zinc-400 block leading-none">Località</span>
            <span className="text-xs font-bold text-zinc-700 truncate block mt-0.5">{job.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold text-xs">€</div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-zinc-400 block leading-none">Retribuzione</span>
            <span className="text-xs font-bold text-zinc-900 block mt-0.5 truncate">{job.salary}</span>
          </div>
        </div>
      </div>

      {/* Requirements preview */}
      <div>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Requisiti chiave</span>
        <ul className="flex flex-col gap-1.5">
          {job.requirements.slice(0, 2).map((req, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 mt-1.5 flex-shrink-0" />
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-4 mt-1 pt-2 border-t border-zinc-50">
        <span className="text-xs font-bold text-zinc-500">
          {job.applicationsCount > 0 ? `${job.applicationsCount} candidature ricevute` : 'Nessun candidato'}
        </span>
        
        {activeRole === 'candidate' && (
          <Button 
            size="sm" 
            variant="primary" 
            onClick={handleApply}
            className="text-xs"
          >
            Candidati ora
          </Button>
        )}
      </div>
    </Card>
  );
};

// === CHAT PREVIEW CARD ===
interface ChatPreviewCardProps {
  thread: ChatThread;
  isActive: boolean;
  onClick: () => void;
}

export const ChatPreviewCard: React.FC<ChatPreviewCardProps> = ({ thread, isActive, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-3xl border transition-all duration-200 cursor-pointer flex items-center gap-3 select-none ${
        isActive 
          ? 'bg-zinc-900 border-zinc-900 text-white shadow-md scale-[1.01]' 
          : 'bg-white border-zinc-100 text-zinc-800 hover:bg-zinc-50'
      }`}
    >
      <Avatar src={thread.recipientAvatar} name={thread.recipientName} size="md" />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <h4 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-zinc-950'}`}>
            {thread.recipientName}
          </h4>
          <span className={`text-[10px] font-semibold shrink-0 ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>
            {thread.lastMessageTime}
          </span>
        </div>
        <p className={`text-[10px] font-bold tracking-wide uppercase mt-0.5 ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>
          {thread.recipientRole}
        </p>
        <p className={`text-xs truncate mt-1.5 ${isActive ? 'text-zinc-200' : 'text-zinc-500 font-medium'}`}>
          {thread.lastMessage}
        </p>
      </div>

      {!isActive && thread.unreadCount > 0 && (
        <span className="h-5 w-5 rounded-full bg-zinc-950 text-white font-black text-[10px] flex items-center justify-center">
          {thread.unreadCount}
        </span>
      )}
    </div>
  );
};
