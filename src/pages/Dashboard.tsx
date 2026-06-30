import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  TrendingUp, 
  Clock, 
  Briefcase, 
  CheckCircle, 
  MapPin, 
  UserCheck, 
  DollarSign, 
  Award,
  Users,
  Search,
  MessageSquare
} from 'lucide-react';
import { Button, Card, Badge, Avatar, RatingStars, StatusToggle } from '../components/UI';
import { RequestCard, ProfessionalCard, CandidateCard, JobCard } from '../components/Cards';
import { useAuth } from '../lib/auth/useAuth';
import { APP_ROUTES, navigateTo } from '../lib/navigation';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { 
    activeRole, 
    setActiveRole, 
    profiles, 
    requests, 
    jobs, 
    professionals, 
    candidates,
    updateProfile,
    updateRequestStatus
  } = useApp();
  
  const navigate = useNavigate();
  const location = useLocation();

  // Route synchronization
  useEffect(() => {
    if (location.pathname === '/dashboard/client') setActiveRole('client');
    else if (location.pathname === '/dashboard/professional') setActiveRole('professional');
    else if (location.pathname === '/dashboard/company') setActiveRole('company');
    else if (location.pathname === '/dashboard/candidate') setActiveRole('candidate');
  }, [location.pathname, setActiveRole]);

  const currentProfile = profiles[activeRole];

  return (
    <div className="select-none min-h-screen bg-transparent pb-24 md:pb-12">
      {/* HEADER BAR */}
      <div className="bg-white border-b border-zinc-100 px-6 py-5 sticky top-0 z-20 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-2">
            Benvenuto, {profile?.full_name ?? currentProfile.name}
          </h1>
          <p className="text-xs text-zinc-400 font-semibold mt-0.5">
            Pannello di Controllo • {activeRole === 'client' ? 'Cliente' : activeRole === 'professional' ? 'Professionista' : activeRole === 'company' ? 'Azienda' : 'Candidato'}
          </p>
        </div>

        <Badge variant="info">Milestone 3</Badge>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {(activeRole === 'client' || activeRole === 'professional') && (
          <Card hoverEffect={false} className="flex flex-col items-start justify-between gap-4 border-blue-100 bg-gradient-to-br from-blue-50 to-white sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-black text-zinc-950">{activeRole === 'client' ? 'Hai bisogno di un intervento?' : 'Le opportunità giuste, nella tua zona'}</h2>
              <p className="mt-1 text-sm text-zinc-500">{activeRole === 'client' ? 'Pubblica comune, categoria e urgenza: il tuo indirizzo resta privato.' : 'Configura categorie e comuni nel profilo, poi consulta il feed compatibile.'}</p>
            </div>
            <div className="flex gap-2"><Button onClick={() => navigateTo(navigate, activeRole === 'client' ? APP_ROUTES.requestNew : APP_ROUTES.requests)}>{activeRole === 'client' ? 'Nuova richiesta' : 'Vedi richieste'}</Button>{activeRole === 'professional' && <Button variant="outline" onClick={()=>navigateTo(navigate, APP_ROUTES.profile)}>Configura profilo</Button>}</div>
          </Card>
        )}
        {activeRole === 'client' && <ClientDashboard />}
        {activeRole === 'professional' && <ProfessionalDashboard />}
        {activeRole === 'company' && <CompanyDashboard />}
        {activeRole === 'candidate' && <CandidateDashboard />}
      </div>
    </div>
  );
};

// ==========================================
// 1. CLIENT DASHBOARD (CLIENTE)
// ==========================================
const ClientDashboard: React.FC = () => {
  const { requests, professionals, updateRequestStatus } = useApp();
  const navigate = useNavigate();

  const myRequests = requests.filter(r => r.clientName === 'Marco Rossi');
  const pendingRequestsCount = myRequests.filter(r => r.status === 'pending').length;
  const completedRequestsCount = myRequests.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Richieste Totali</span>
          <span className="text-3xl font-black text-zinc-950 block mt-2">{myRequests.length}</span>
          <span className="text-[10px] font-semibold text-zinc-400 mt-1 flex items-center gap-1">
            <Clock size={10} /> Storico annunci
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Attive / Aperte</span>
          <span className="text-3xl font-black text-amber-600 block mt-2">{pendingRequestsCount}</span>
          <span className="text-[10px] font-semibold text-amber-500 mt-1 flex items-center gap-1">
            <TrendingUp size={10} /> Ricezione preventivi
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Completate</span>
          <span className="text-3xl font-black text-emerald-600 block mt-2">{completedRequestsCount}</span>
          <span className="text-[10px] font-semibold text-emerald-500 mt-1 flex items-center gap-1">
            <CheckCircle size={10} /> Interventi risolti
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 bg-zinc-950 text-white border-none shadow-lg">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Budget Speso</span>
          <span className="text-3xl font-black block mt-2">€430</span>
          <span className="text-[10px] font-semibold text-zinc-400 mt-1">Fatturato simulato</span>
        </Card>
      </div>

      {/* Main Grid: My requests and Online Professionals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">Le mie richieste di intervento</h2>
            <Button size="sm" onClick={() => navigateTo(navigate, APP_ROUTES.requestNew)} className="text-xs flex items-center gap-1.5 font-bold">
              <Plus size={14} /> Nuova Richiesta
            </Button>
          </div>

          {myRequests.length === 0 ? (
            <Card className="p-8 text-center border border-dashed border-zinc-200">
              <p className="text-xs text-zinc-500">Non hai ancora inserito nessuna richiesta di aiuto.</p>
              <Button size="sm" variant="outline" onClick={() => navigateTo(navigate, APP_ROUTES.requestNew)} className="mt-4 text-xs font-bold">
                Crea la prima adesso
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRequests.map(req => (
                <RequestCard 
                  key={req.id} 
                  request={req} 
                  onStatusChange={(id, status) => updateRequestStatus(id, status)} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar directory list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">Professionisti in evidenza</h2>
            <Link to={APP_ROUTES.professionals} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900">
              Vedi tutti
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {professionals.slice(0, 3).map(p => (
              <div key={p.id} className="bg-white border border-zinc-100 p-4 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} src={p.avatar} size="sm" isOnline={p.isOnline} />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">{p.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-semibold">{p.title}</p>
                    <div className="mt-1">
                      <RatingStars rating={p.rating} size={10} />
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => navigateTo(navigate, APP_ROUTES.chat)}
                  className="p-2.5 rounded-full"
                >
                  <MessageSquare size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. PROFESSIONAL DASHBOARD (PROFESSIONISTA)
// ==========================================
const ProfessionalDashboard: React.FC = () => {
  const { requests, professionals, toggleProfessionalStatus } = useApp();
  const navigate = useNavigate();

  const currentProf = professionals.find(p => p.id === 'p-1') || professionals[0];
  const pendingGigs = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Availability Bar & Stats */}
      <div className="bg-white border border-zinc-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={currentProf?.avatar} name={currentProf?.name} size="md" isOnline={currentProf?.isOnline} />
          <div>
            <h2 className="text-sm font-bold text-zinc-950">Sei online e visibile?</h2>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">Attiva per ricevere preventivi in tempo reale.</p>
          </div>
        </div>
        <StatusToggle 
          isOnline={currentProf?.isOnline || false} 
          onToggle={() => toggleProfessionalStatus(currentProf?.id)} 
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Lavori Completati</span>
          <span className="text-3xl font-black text-zinc-950 block mt-2">{currentProf?.completedJobs || 12}</span>
          <span className="text-[10px] font-semibold text-emerald-500 mt-1 flex items-center gap-1">
            <CheckCircle size={10} /> Servizi conclusi
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Valutazione</span>
          <span className="text-3xl font-black text-amber-500 block mt-2">{currentProf?.rating || 4.9}</span>
          <span className="text-[10px] font-semibold text-zinc-400 mt-1 flex items-center gap-1">
            <RatingStars rating={currentProf?.rating || 4.9} size={10} />
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Tariffa Oraria</span>
          <span className="text-3xl font-black text-zinc-950 block mt-2">€{currentProf?.hourlyRate || 30}<span className="text-xs font-normal">/h</span></span>
          <span className="text-[10px] font-semibold text-zinc-400 mt-1 flex items-center gap-1">
            <DollarSign size={10} /> Tariffa media consigliata
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 bg-zinc-950 text-white border-none shadow-lg">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Incassi Stimati</span>
          <span className="text-3xl font-black block mt-2">€2.480</span>
          <span className="text-[10px] font-semibold text-emerald-400 mt-1">Questo mese</span>
        </Card>
      </div>

      {/* Requests open for bids */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">Interventi e richieste aperte nella tua zona</h2>
          <Link to={APP_ROUTES.requests} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900">
            Vedi tutte
          </Link>
        </div>

        {pendingGigs.length === 0 ? (
          <Card className="p-8 text-center border border-dashed border-zinc-200">
            <p className="text-xs text-zinc-500">Non ci sono interventi attivi nella tua provincia in questo momento.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingGigs.slice(0, 3).map(req => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. COMPANY DASHBOARD (AZIENDA)
// ==========================================
const CompanyDashboard: React.FC = () => {
  const { jobs, candidates } = useApp();
  const navigate = useNavigate();

  const myJobs = jobs.filter(j => j.companyName === 'Innovatech S.r.l.');
  const totalApplications = myJobs.reduce((acc, current) => acc + current.applicationsCount, 0);

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Annunci Pubblicati</span>
          <span className="text-3xl font-black text-zinc-950 block mt-2">{myJobs.length}</span>
          <span className="text-[10px] font-semibold text-zinc-400 mt-1 flex items-center gap-1">
            <Briefcase size={10} /> Ricerche attive
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Candidature Ricevute</span>
          <span className="text-3xl font-black text-blue-600 block mt-2">{totalApplications}</span>
          <span className="text-[10px] font-semibold text-blue-500 mt-1 flex items-center gap-1">
            <TrendingUp size={10} /> Interesse registrato
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Colloqui Fissati</span>
          <span className="text-3xl font-black text-emerald-600 block mt-2">3</span>
          <span className="text-[10px] font-semibold text-emerald-500 mt-1 flex items-center gap-1">
            <UserCheck size={10} /> In agenda
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 bg-zinc-950 text-white border-none shadow-lg">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Tempo di Assunzione</span>
          <span className="text-3xl font-black block mt-2">12gg</span>
          <span className="text-[10px] font-semibold text-zinc-400 mt-1">Efficienza media</span>
        </Card>
      </div>

      {/* Posted jobs vs Hot candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">Le nostre ricerche attive</h2>
            <Button size="sm" onClick={() => navigateTo(navigate, APP_ROUTES.jobNew)} className="text-xs font-bold flex items-center gap-1.5">
              <Plus size={14} /> Pubblica Annuncio
            </Button>
          </div>

          {myJobs.length === 0 ? (
            <Card className="p-8 text-center border border-dashed border-zinc-200">
              <p className="text-xs text-zinc-500">Non hai ancora pubblicato nessun annuncio di lavoro.</p>
              <Button size="sm" variant="outline" onClick={() => navigateTo(navigate, APP_ROUTES.jobNew)} className="mt-4 text-xs font-bold">
                Crea il primo adesso
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {myJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar directory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">Candidati caldi in zona</h2>
            <Link to={APP_ROUTES.candidates} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900">
              Vedi tutti
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {candidates.slice(0, 3).map(c => (
              <div key={c.id} className="bg-white border border-zinc-100 p-4 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} src={c.avatar} size="sm" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">{c.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-semibold">{c.desiredRole}</p>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">Esp: {c.experienceYears} anni</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => navigateTo(navigate, APP_ROUTES.chat)}
                  className="p-2.5 rounded-full"
                >
                  <MessageSquare size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. CANDIDATE DASHBOARD (CANDIDATO)
// ==========================================
const CandidateDashboard: React.FC = () => {
  const { jobs, candidates, toggleCandidateStatus } = useApp();
  const navigate = useNavigate();

  const currentCand = candidates.find(c => c.id === 'u-candidate') || candidates[0];

  return (
    <div className="space-y-6">
      {/* Availability */}
      <div className="bg-white border border-zinc-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={currentCand?.avatar} name={currentCand?.name} size="md" />
          <div>
            <h2 className="text-sm font-bold text-zinc-950">Sei disponibile a nuove proposte?</h2>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">Ricevi notifiche quando un\'azienda ti visualizza.</p>
          </div>
        </div>
        <StatusToggle 
          isOnline={currentCand?.isAvailable || false} 
          onToggle={() => toggleCandidateStatus(currentCand?.id || 'u-candidate')} 
          onlineLabel="Disponibile Subito"
          offlineLabel="Lavoro Trovato"
        />
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Candidature Inviate</span>
          <span className="text-3xl font-black text-zinc-950 block mt-2">4</span>
          <span className="text-[10px] font-semibold text-zinc-400 mt-1 flex items-center gap-1">
            <Clock size={10} /> Ultime 2 settimane
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Colloqui Fissati</span>
          <span className="text-3xl font-black text-emerald-600 block mt-2">1</span>
          <span className="text-[10px] font-semibold text-emerald-500 mt-1 flex items-center gap-1">
            <CheckCircle size={10} /> Da sostenere
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Visite Profilo</span>
          <span className="text-3xl font-black text-blue-600 block mt-2">42</span>
          <span className="text-[10px] font-semibold text-blue-500 mt-1 flex items-center gap-1">
            <TrendingUp size={10} /> Interesse aziende
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-28 bg-zinc-950 text-white border-none shadow-lg">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">RAL Desiderata</span>
          <span className="text-3xl font-black block mt-2">€38k</span>
          <span className="text-[10px] font-semibold text-zinc-400 mt-1">RAL media consigliata</span>
        </Card>
      </div>

      {/* Recommended Jobs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">Annunci consigliati in base alle tue skill</h2>
          <Link to={APP_ROUTES.jobs} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900">
            Vedi tutti
          </Link>
        </div>

        {jobs.length === 0 ? (
          <Card className="p-8 text-center border border-dashed border-zinc-200">
            <p className="text-xs text-zinc-500">Non ci sono offerte corrispondenti al momento.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.slice(0, 3).map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
