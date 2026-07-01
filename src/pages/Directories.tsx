import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, BriefcaseBusiness, ChevronRight, MapPin, Search, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Badge, Button, Card, RatingStars } from '../components/UI';
import { APP_ROUTES, buildAppRoute, navigateTo } from '../lib/navigation';
import { supabase } from '../lib/supabase/client';
import type { PricingMode } from '../lib/supabase/types';

type DirectoryProfessional = {
  id: string;
  business_name: string | null;
  bio: string | null;
  years_experience: number;
  verified: boolean;
  rating: number;
  total_reviews: number;
  pricing_mode: PricingMode;
  hourly_rate: number | null;
  profiles: { full_name: string; avatar_url: string | null; city: string | null; province: string | null } | null;
  professional_categories: Array<{ categories: { name: string } | null }>;
  service_areas: Array<{ city: string; province: string }>;
};

const professionalSelect = 'id,business_name,bio,years_experience,verified,rating,total_reviews,pricing_mode,hourly_rate,profiles!professional_profiles_user_id_fkey(full_name,avatar_url,city,province),professional_categories(categories(name)),service_areas(city,province)';

const displayName = (item: DirectoryProfessional) => item.business_name || item.profiles?.full_name || 'Professionista instaMax';

const Price = ({ item }: { item: DirectoryProfessional }) => (
  <>
    <p className="font-black text-zinc-900">
      {item.pricing_mode === 'hourly' && item.hourly_rate
        ? `Da ${Number(item.hourly_rate).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/ora`
        : 'Prezzo da concordare'}
    </p>
    <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">La tariffa è indicativa e può variare in base al tipo di intervento.</p>
  </>
);

export const ProfessionalsDirectory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return id ? <ProfessionalDetail id={id} /> : <ProfessionalList />;
};

const ProfessionalList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<DirectoryProfessional[]>([]);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const { data, error: loadError } = await supabase.from('professional_profiles').select(professionalSelect);
        if (loadError) throw loadError;
        setItems((data ?? []) as unknown as DirectoryProfessional[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossibile caricare i professionisti.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cities = useMemo(() => Array.from(new Set(items.flatMap(item => item.service_areas.map(area => area.city)))).sort(), [items]);
  const filtered = useMemo(() => items.filter(item => {
    const haystack = `${item.profiles?.full_name ?? ''} ${item.business_name ?? ''} ${item.professional_categories.map(row => row.categories?.name ?? '').join(' ')}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && (city === 'all' || item.service_areas.some(area => area.city === city));
  }), [items, query, city]);

  const openProfile = (professionalId: string) => navigateTo(navigate, buildAppRoute(`/professionals/${professionalId}`));

  return <div className="min-h-screen bg-zinc-50/60 pb-28">
    <header className="border-b border-zinc-100 bg-white px-6 py-6"><div className="mx-auto max-w-7xl"><h1 className="text-2xl font-black">Professionisti</h1><p className="mt-1 text-sm text-zinc-500">Trova profili reali e servizi disponibili nella tua zona.</p></div></header>
    <main className="mx-auto max-w-7xl space-y-6 p-5 md:p-8">
      <div className="grid gap-3 rounded-3xl border border-zinc-100 bg-white p-4 md:grid-cols-[1fr_240px]">
        <div className="relative"><Search className="absolute left-4 top-3.5 text-zinc-400" size={17}/><input className="w-full rounded-2xl bg-zinc-50 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nome, attività o categoria"/></div>
        <select className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-semibold" value={city} onChange={event => setCity(event.target.value)}><option value="all">Tutti i comuni</option>{cities.map(value => <option key={value}>{value}</option>)}</select>
      </div>
      {error && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
      {loading ? <p className="py-14 text-center text-sm text-zinc-400">Caricamento professionisti…</p> : filtered.length ?
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item =>
          <button key={item.id} type="button" onClick={() => openProfile(item.id)} className="group h-full rounded-[2rem] text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" aria-label={`Apri il profilo di ${displayName(item)}`}>
            <Card className="flex h-full flex-col p-6 transition duration-200 group-hover:-translate-y-1 group-hover:border-blue-200 group-hover:shadow-xl">
              <div className="flex items-start justify-between"><Avatar size="lg" name={item.profiles?.full_name ?? 'Professionista'} src={item.profiles?.avatar_url ?? undefined}/>{item.verified && <Badge variant="success"><ShieldCheck size={12}/> Verificato</Badge>}</div>
              <div className="mt-4 flex items-center justify-between gap-3"><h2 className="text-lg font-black">{displayName(item)}</h2><ChevronRight className="shrink-0 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-blue-600" size={20}/></div>
              <div className="mt-2"><RatingStars rating={Number(item.rating) || 0} count={item.total_reviews}/></div>
              <div className="mt-4 flex flex-wrap gap-2">{item.professional_categories.map(row => row.categories?.name).filter(Boolean).map(name => <Badge key={name} variant="gray">{name}</Badge>)}</div>
              {item.bio && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-zinc-500">{item.bio}</p>}
              <div className="mt-auto pt-5"><Price item={item}/>{item.service_areas[0] && <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-zinc-500"><MapPin size={13}/>{item.service_areas[0].city} ({item.service_areas[0].province}){item.service_areas.length > 1 ? ` +${item.service_areas.length - 1}` : ''}</p>}<p className="mt-4 text-xs font-black text-blue-600">Visualizza profilo</p></div>
            </Card>
          </button>)}</div> :
        <Card hoverEffect={false} className="py-14 text-center"><AlertCircle className="mx-auto text-zinc-300"/><h2 className="mt-3 font-black">Nessun professionista trovato</h2><p className="mt-1 text-sm text-zinc-500">Prova a modificare categoria o comune.</p></Card>}
    </main>
  </div>;
};

const ProfessionalDetail = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const [item, setItem] = useState<DirectoryProfessional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const { data, error: loadError } = await supabase.from('professional_profiles').select(professionalSelect).eq('id', id).maybeSingle();
        if (loadError) throw loadError;
        if (!data) throw new Error('Profilo professionale non trovato.');
        setItem(data as unknown as DirectoryProfessional);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossibile caricare il profilo.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return <div className="min-h-screen bg-zinc-50/60 pb-28">
    <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 px-5 py-4 backdrop-blur-xl"><div className="mx-auto max-w-5xl"><button type="button" onClick={() => navigateTo(navigate, APP_ROUTES.professionals)} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100" aria-label="Torna ai professionisti"><ArrowLeft size={18}/> Professionisti</button></div></header>
    <main className="mx-auto max-w-5xl p-5 md:p-8">
      {loading && <p className="py-20 text-center text-sm font-semibold text-zinc-400">Caricamento profilo…</p>}
      {error && <Card hoverEffect={false} className="py-14 text-center"><AlertCircle className="mx-auto text-red-400"/><h1 className="mt-3 text-lg font-black">Profilo non disponibile</h1><p className="mt-2 text-sm text-zinc-500">{error}</p><Button className="mt-6" variant="outline" onClick={() => navigateTo(navigate, APP_ROUTES.professionals)}>Torna all’elenco</Button></Card>}
      {item && <div className="space-y-5">
        <Card hoverEffect={false} className="overflow-hidden p-0"><div className="h-28 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 md:h-36"/><div className="px-6 pb-7 md:px-9"><div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end"><div className="rounded-full bg-white p-1.5 shadow-lg"><Avatar size="xl" name={item.profiles?.full_name ?? 'Professionista'} src={item.profiles?.avatar_url ?? undefined}/></div><div className="flex-1 sm:pb-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black md:text-3xl">{displayName(item)}</h1>{item.verified && <Badge variant="success"><ShieldCheck size={12}/> Profilo verificato</Badge>}</div><div className="mt-2"><RatingStars rating={Number(item.rating) || 0} count={item.total_reviews}/></div></div></div></div></Card>
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5"><Card hoverEffect={false}><h2 className="text-lg font-black">Presentazione</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-600">{item.bio || 'Questo professionista non ha ancora aggiunto una presentazione.'}</p></Card><Card hoverEffect={false}><h2 className="text-lg font-black">Servizi offerti</h2><div className="mt-4 flex flex-wrap gap-2">{item.professional_categories.length ? item.professional_categories.map(row => row.categories?.name).filter(Boolean).map(name => <Badge key={name} variant="info">{name}</Badge>) : <p className="text-sm text-zinc-500">Nessun servizio indicato.</p>}</div></Card></div>
          <div className="space-y-5"><Card hoverEffect={false}><h2 className="text-lg font-black">Informazioni</h2><div className="mt-4 space-y-4"><div className="flex gap-3"><BriefcaseBusiness className="mt-0.5 text-blue-600" size={18}/><div><p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Esperienza</p><p className="mt-1 text-sm font-bold">{item.years_experience > 0 ? `${item.years_experience} ${item.years_experience === 1 ? 'anno' : 'anni'}` : 'Da definire'}</p></div></div><div className="flex gap-3"><MapPin className="mt-0.5 text-blue-600" size={18}/><div><p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Zone servite</p><div className="mt-1 flex flex-wrap gap-1.5">{item.service_areas.length ? item.service_areas.map(area => <span key={`${area.city}-${area.province}`} className="text-sm font-bold">{area.city} ({area.province})</span>) : <span className="text-sm text-zinc-500">Non indicate</span>}</div></div></div></div></Card><Card hoverEffect={false}><h2 className="mb-3 text-lg font-black">Tariffa indicativa</h2><Price item={item}/></Card></div>
        </div>
      </div>}
    </main>
  </div>;
};

// Kept for compatibility with older imports; the active candidate page lives in Candidates.tsx.
export const CandidatesDirectory = () => null;
