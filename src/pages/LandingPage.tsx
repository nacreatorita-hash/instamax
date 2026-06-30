import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Hammer,
  HardHat,
  Leaf,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Paintbrush,
  Search,
  ShieldCheck,
  Snowflake,
  Star,
  UserRound,
  Wrench,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Card } from '../components/UI';
import { SmartRequestAssistant } from '../components/SmartRequestAssistant';
import { CITIES } from '../data';
import { supabase } from '../lib/supabase/client';
import type { Category } from '../lib/supabase/types';
import { APP_ROUTES, navigateTo } from '../lib/navigation';

const mainCards = [
  {
    title: 'Cerco un Pro',
    description: 'Pubblica una richiesta e ricevi risposte dai professionisti disponibili vicino a te.',
    cta: 'Pubblica richiesta',
    role: 'client' as const,
    route: APP_ROUTES.requestNew,
    icon: Search,
    accent: 'blue',
  },
  {
    title: 'Offro Servizi',
    description: 'Trova nuovi clienti, gestisci richieste locali e fai crescere la tua attività.',
    cta: 'Entra come professionista',
    role: 'professional' as const,
    route: APP_ROUTES.dashboard,
    icon: Wrench,
    accent: 'emerald',
  },
  {
    title: 'Cerco Lavoro',
    description: 'Scopri offerte nella tua zona e candidati con un profilo completo e professionale.',
    cta: 'Sfoglia offerte',
    role: 'candidate' as const,
    route: APP_ROUTES.jobs,
    icon: BriefcaseBusiness,
    accent: 'violet',
  },
  {
    title: 'Cerco Staff',
    description: 'Pubblica offerte, ricevi candidature e parla con profili qualificati in chat.',
    cta: 'Pubblica offerta',
    role: 'company' as const,
    route: APP_ROUTES.jobNew,
    icon: Building2,
    accent: 'amber',
  },
];

const steps = [
  {
    title: 'Scrivi cosa ti serve',
    text: 'Descrivi il problema o il lavoro da fare con poche informazioni chiare.',
    icon: Hammer,
  },
  {
    title: 'Scegli comune e categoria',
    text: 'Indica la zona e il tipo di professionista che stai cercando.',
    icon: MapPin,
  },
  {
    title: 'Parla in chat con i professionisti',
    text: 'Ricevi risposte, confronta profili e organizza tutto dalla chat interna.',
    icon: MessageCircle,
  },
];

const benefits = [
  'Posizione precisa privata',
  'Chat interna sicura',
  'Professionisti della zona',
  'Richieste rapide',
  'Profili e recensioni',
];

const popularCategories = [
  { name: 'Idraulico', icon: Wrench },
  { name: 'Elettricista', icon: Zap },
  { name: 'Fabbro', icon: Hammer },
  { name: 'Caldaie', icon: HardHat },
  { name: 'Climatizzatori', icon: Snowflake },
  { name: 'Imbianchino', icon: Paintbrush },
  { name: 'Giardiniere', icon: Leaf },
  { name: 'Muratore', icon: Building2 },
];

const accentClasses: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
  violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveRole } = useApp();
  const [smartCategories, setSmartCategories] = useState<Category[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const result = await supabase.from('categories').select('*').eq('active', true).order('name');
        if (result.error) throw result.error;
        setSmartCategories((result.data ?? []) as Category[]);
      } catch (error) {
        console.warn('Categorie non disponibili:', error);
      }
    })();
  }, []);

  const go = (role: 'client' | 'professional' | 'company' | 'candidate', route: string) => {
    setActiveRole(role);
    navigateTo(navigate, route);
  };

  return (
    <div className="min-h-screen bg-white pb-20 text-zinc-950 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/85 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button type="button" onClick={() => navigateTo(navigate, APP_ROUTES.home)} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/25">
              <Zap size={18} className="text-white" />
            </span>
            <span className="text-xl font-black italic tracking-tight">instaMax</span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigateTo(navigate, APP_ROUTES.login)} className="text-xs font-bold">
              Login
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigateTo(navigate, APP_ROUTES.register)} className="text-xs font-bold">
              Registrazione
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden border-b border-zinc-100 bg-[radial-gradient(circle_at_top_left,#eff6ff,transparent_34%),linear-gradient(180deg,#fafafa,white)] px-5 py-14 md:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-blue-600 shadow-sm">
                Servizi locali, lavoro e professionisti
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.03] tracking-tight text-zinc-950 md:text-6xl">
                Trova subito il professionista giusto
              </h1>
              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-zinc-600 md:text-lg">
                Descrivi il problema, scegli la zona e ricevi risposte dai professionisti disponibili vicino a te.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => go('client', APP_ROUTES.requestNew)} className="justify-center px-7">
                  Pubblica una richiesta <ArrowRight size={18} />
                </Button>
                <Button size="lg" variant="outline" onClick={() => go('professional', APP_ROUTES.register)} className="justify-center px-7">
                  Registrati come professionista
                </Button>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                {['Richieste rapide', 'Chat protetta', 'Zona privata'].map(item => (
                  <div key={item} className="rounded-2xl border border-zinc-100 bg-white/80 p-3 text-center shadow-sm">
                    <p className="text-[11px] font-black text-zinc-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-white bg-white/80 p-3 shadow-2xl shadow-blue-950/10 backdrop-blur">
              <SmartRequestAssistant categories={smartCategories} compact />
            </div>
          </div>
        </section>

        <section className="px-5 py-14 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Scegli la tua area</span>
                <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Una piattaforma, quattro esigenze</h2>
              </div>
              <p className="max-w-md text-sm font-medium leading-6 text-zinc-500">
                Clienti, professionisti, aziende e candidati entrano nello stesso marketplace con percorsi semplici e dedicati.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {mainCards.map(card => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.title}
                    onClick={() => go(card.role, card.route)}
                    className="group flex min-h-[280px] cursor-pointer flex-col justify-between rounded-[2rem] border border-zinc-100 bg-white p-7 shadow-lg shadow-zinc-200/50 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-950/10"
                  >
                    <div>
                      <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${accentClasses[card.accent]}`}>
                        <Icon size={24} />
                      </div>
                      <h3 className="text-xl font-black tracking-tight">{card.title}</h3>
                      <p className="mt-3 text-sm font-medium leading-6 text-zinc-500">{card.description}</p>
                    </div>
                    <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-zinc-950 transition-transform group-hover:translate-x-1">
                      {card.cta} <ArrowRight size={16} />
                    </span>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-100 bg-zinc-50 px-5 py-14 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Come funziona</span>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Dal bisogno alla conversazione in pochi passaggi</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-[2rem] border border-zinc-100 bg-white p-7 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                        <Icon size={20} />
                      </span>
                      <span className="text-4xl font-black text-zinc-100">0{index + 1}</span>
                    </div>
                    <h3 className="mt-6 text-lg font-black">{step.title}</h3>
                    <p className="mt-3 text-sm font-medium leading-6 text-zinc-500">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-5 py-14 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Perché usare instaMax</span>
              <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Pensata per lavorare bene, senza esporre dati inutili</h2>
              <p className="mt-4 text-sm font-medium leading-7 text-zinc-500">
                instaMax protegge le informazioni personali, mantiene le conversazioni dentro la piattaforma e rende più veloce il contatto tra domanda e offerta locale.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => (
                <div key={benefit} className={`rounded-[1.75rem] border p-5 ${index === 0 ? 'border-blue-100 bg-blue-50' : 'border-zinc-100 bg-white'} shadow-sm`}>
                  <CheckCircle2 className={index === 0 ? 'text-blue-600' : 'text-emerald-600'} size={22} />
                  <h3 className="mt-4 text-sm font-black">{benefit}</h3>
                  <p className="mt-2 text-xs font-medium leading-5 text-zinc-500">
                    Gestisci richieste, contatti e informazioni con un flusso chiaro e mobile-first.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-100 bg-zinc-50 px-5 py-14 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Categorie più richieste</span>
                <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Trova subito il mestiere giusto</h2>
              </div>
              <Button variant="outline" onClick={() => go('client', APP_ROUTES.requests)} className="self-start md:self-auto">
                Esplora richieste
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {popularCategories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => go('client', APP_ROUTES.requestNew)}
                    className="group rounded-[1.75rem] border border-zinc-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                      <Icon size={20} />
                    </span>
                    <span className="mt-4 block text-sm font-black">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-5 py-14">
          <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-zinc-950 p-8 text-white shadow-2xl shadow-zinc-950/20 md:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/70">
                  <Star size={13} /> Presenza locale
                </span>
                <h2 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">Attiva la tua zona e inizia a ricevere contatti</h2>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-zinc-300">
                  instaMax lavora per comune e provincia: le richieste arrivano alle persone giuste, senza mostrare indirizzi precisi nella fase pubblica.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CITIES.slice(0, 12).map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => go('client', APP_ROUTES.requestNew)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-200 transition hover:bg-white hover:text-zinc-950"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 bg-white px-5 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                <Zap size={18} className="text-white" />
              </span>
              <span className="text-xl font-black italic tracking-tight">instaMax</span>
            </div>
            <p className="mt-4 max-w-md text-sm font-medium leading-7 text-zinc-500">
              Marketplace locale per richieste di servizi, professionisti, offerte di lavoro e candidature.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Accesso</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm font-bold text-zinc-700">
              <button type="button" onClick={() => navigateTo(navigate, APP_ROUTES.login)} className="text-left hover:text-blue-600">Login</button>
              <button type="button" onClick={() => navigateTo(navigate, APP_ROUTES.register)} className="text-left hover:text-blue-600">Registrazione</button>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Informazioni</h3>
            <div className="mt-4 flex flex-col gap-3 text-sm font-bold text-zinc-700">
              <a href="/privacy.html" className="hover:text-blue-600">Privacy</a>
              <a href="/terms.html" className="hover:text-blue-600">Termini</a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-3 border-t border-zinc-100 pt-6 text-xs font-semibold text-zinc-400 sm:flex-row">
          <span>© 2026 instaMax. Tutti i diritti riservati.</span>
          <span>Servizi locali, lavoro e professionisti in un’unica piattaforma.</span>
        </div>
      </footer>
    </div>
  );
};
