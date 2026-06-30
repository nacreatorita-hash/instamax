import React from 'react';
import { Bot, BriefcaseBusiness, Building2, ClipboardList, MessageSquare, Search, UserRound, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card } from '../components/UI';
import { useAuth } from '../lib/auth/useAuth';
import { APP_ROUTES, navigateTo } from '../lib/navigation';
import type { UserRole } from '../lib/supabase/types';

const roleLabels: Record<UserRole, string> = {
  client: 'Cliente', professional: 'Professionista', company: 'Azienda', candidate: 'Candidato',
};

const roleIntro: Record<UserRole, { title: string; text: string; icon: React.ReactNode }> = {
  client: { title: 'Di cosa hai bisogno oggi?', text: 'Pubblica una richiesta oppure chiedi a Massimo di prepararla con te.', icon: <UserRound size={23}/> },
  professional: { title: 'Nuove opportunità nella tua zona', text: 'Consulta le richieste compatibili con categorie e comuni configurati nel profilo.', icon: <Wrench size={23}/> },
  company: { title: 'Servizi e persone per la tua azienda', text: 'Gestisci le richieste compatibili oppure pubblica una nuova offerta di lavoro.', icon: <Building2 size={23}/> },
  candidate: { title: 'Trova la prossima opportunità', text: 'Consulta le offerte, completa il curriculum e parla con le aziende in chat.', icon: <BriefcaseBusiness size={23}/> },
};

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  if (!profile) return null;
  const intro = roleIntro[profile.role];
  const actions = getActions(profile.role);

  return <div className="min-h-screen bg-zinc-50/60 pb-28">
    <header className="border-b border-zinc-100 bg-white px-6 py-6"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><div><h1 className="text-2xl font-black">Ciao, {profile.full_name}</h1><p className="mt-1 text-sm text-zinc-500">La tua area personale instaMax</p></div><Badge variant="info">{roleLabels[profile.role]}</Badge></div></header>
    <main className="mx-auto max-w-6xl space-y-6 p-5 md:p-8">
      <Card hoverEffect={false} className="overflow-hidden border-blue-100 bg-gradient-to-br from-blue-600 to-blue-800 p-7 text-white md:p-9"><div className="flex max-w-2xl items-start gap-4"><span className="rounded-2xl bg-white/15 p-3">{intro.icon}</span><div><h2 className="text-2xl font-black">{intro.title}</h2><p className="mt-2 leading-relaxed text-blue-100">{intro.text}</p></div></div></Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{actions.map(action=><Card key={action.route} className="flex flex-col items-start p-6"><span className="rounded-2xl bg-zinc-100 p-3 text-zinc-800">{action.icon}</span><h2 className="mt-5 text-lg font-black">{action.title}</h2><p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">{action.text}</p><Button className="mt-5" variant={action.primary?'primary':'outline'} onClick={()=>navigateTo(navigate,action.route)}>{action.cta}</Button></Card>)}</div>
    </main>
  </div>;
};

function getActions(role: UserRole) {
  const common = [
    { title: 'Massimo AI', text: 'Chiedi aiuto sulle funzioni di instaMax e prepara una richiesta guidata.', cta: 'Parla con Massimo', route: APP_ROUTES.massimo, icon: <Bot size={21}/>, primary: true },
    { title: 'Messaggi', text: 'Continua le conversazioni private con utenti, professionisti e aziende.', cta: 'Apri la chat', route: APP_ROUTES.chat, icon: <MessageSquare size={21}/> },
    { title: 'Il mio profilo', text: 'Aggiorna informazioni, foto e impostazioni del tuo profilo.', cta: 'Gestisci profilo', route: APP_ROUTES.profile, icon: <UserRound size={21}/> },
  ];
  if (role === 'client') return [{ title: 'Pubblica una richiesta', text: 'Descrivi il problema e raggiungi i professionisti compatibili della tua zona.', cta: 'Nuova richiesta', route: APP_ROUTES.requestNew, icon: <ClipboardList size={21}/>, primary: true }, ...common];
  if (role === 'professional') return [{ title: 'Richieste clienti', text: 'Visualizza solo i lavori compatibili con le tue categorie e zone operative.', cta: 'Vedi richieste', route: APP_ROUTES.requests, icon: <Search size={21}/>, primary: true }, ...common];
  if (role === 'company') return [{ title: 'Richieste clienti', text: 'Consulta gli interventi compatibili con i servizi offerti dall’azienda.', cta: 'Vedi richieste', route: APP_ROUTES.requests, icon: <Search size={21}/>, primary: true }, { title: 'Pubblica un’offerta', text: 'Crea una nuova opportunità di lavoro per i candidati.', cta: 'Nuova offerta', route: APP_ROUTES.jobNew, icon: <BriefcaseBusiness size={21}/> }, ...common];
  return [{ title: 'Offerte di lavoro', text: 'Scopri le opportunità disponibili e invia la tua candidatura.', cta: 'Cerca lavoro', route: APP_ROUTES.jobs, icon: <BriefcaseBusiness size={21}/>, primary: true }, ...common];
}
