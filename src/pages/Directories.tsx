import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, MapPin, Search, ShieldCheck } from 'lucide-react';
import { Avatar, Badge, Card, RatingStars } from '../components/UI';
import { supabase } from '../lib/supabase/client';
import type { PricingMode } from '../lib/supabase/types';

type DirectoryProfessional = {
  id: string; business_name: string | null; bio: string | null; verified: boolean; rating: number; total_reviews: number;
  pricing_mode: PricingMode; hourly_rate: number | null;
  profiles: { full_name: string; avatar_url: string | null; city: string | null; province: string | null } | null;
  professional_categories: Array<{ categories: { name: string } | null }>;
  service_areas: Array<{ city: string; province: string }>;
};

export const ProfessionalsDirectory: React.FC = () => {
  const [items, setItems] = useState<DirectoryProfessional[]>([]);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { void (async()=>{try{const{data,error:loadError}=await supabase.from('professional_profiles').select('id,business_name,bio,verified,rating,total_reviews,pricing_mode,hourly_rate,profiles!professional_profiles_user_id_fkey(full_name,avatar_url,city,province),professional_categories(categories(name)),service_areas(city,province)');if(loadError)throw loadError;setItems((data??[]) as unknown as DirectoryProfessional[]);}catch(err:any){setError(err.message);}finally{setLoading(false);}})(); }, []);
  const cities = useMemo(()=>Array.from(new Set(items.flatMap(item=>item.service_areas.map(area=>area.city)))).sort(),[items]);
  const filtered = useMemo(()=>items.filter(item=>{
    const haystack = `${item.profiles?.full_name??''} ${item.business_name??''} ${item.professional_categories.map(row=>row.categories?.name??'').join(' ')}`.toLowerCase();
    return (!query.trim()||haystack.includes(query.trim().toLowerCase())) && (city==='all'||item.service_areas.some(area=>area.city===city));
  }),[items,query,city]);

  return <div className="min-h-screen bg-zinc-50/60 pb-28"><header className="border-b border-zinc-100 bg-white px-6 py-6"><div className="mx-auto max-w-7xl"><h1 className="text-2xl font-black">Professionisti</h1><p className="mt-1 text-sm text-zinc-500">Trova profili reali e servizi disponibili nella tua zona.</p></div></header><main className="mx-auto max-w-7xl space-y-6 p-5 md:p-8">
    <div className="grid gap-3 rounded-3xl border border-zinc-100 bg-white p-4 md:grid-cols-[1fr_240px]"><div className="relative"><Search className="absolute left-4 top-3.5 text-zinc-400" size={17}/><input className="w-full rounded-2xl bg-zinc-50 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nome, attività o categoria"/></div><select className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-semibold" value={city} onChange={event=>setCity(event.target.value)}><option value="all">Tutti i comuni</option>{cities.map(value=><option key={value}>{value}</option>)}</select></div>
    {error&&<p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
    {loading?<p className="py-14 text-center text-sm text-zinc-400">Caricamento professionisti…</p>:filtered.length?<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item=><Card key={item.id} className="flex h-full flex-col p-6"><div className="flex items-start justify-between"><Avatar size="lg" name={item.profiles?.full_name??'Professionista'} src={item.profiles?.avatar_url??undefined}/>{item.verified&&<Badge variant="success"><ShieldCheck size={12}/> Verificato</Badge>}</div><h2 className="mt-4 text-lg font-black">{item.business_name||item.profiles?.full_name||'Professionista instaMax'}</h2><div className="mt-2"><RatingStars rating={Number(item.rating)||0} count={item.total_reviews}/></div><div className="mt-4 flex flex-wrap gap-2">{item.professional_categories.map(row=>row.categories?.name).filter(Boolean).map(name=><Badge key={name} variant="gray">{name}</Badge>)}</div>{item.bio&&<p className="mt-4 line-clamp-3 text-sm leading-relaxed text-zinc-500">{item.bio}</p>}<div className="mt-auto pt-5"><p className="font-black text-zinc-900">{item.pricing_mode==='hourly'&&item.hourly_rate?`Da ${Number(item.hourly_rate).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})} €/ora`:'Prezzo da concordare'}</p><p className="mt-1 text-[11px] leading-relaxed text-zinc-400">La tariffa è indicativa e può variare in base al tipo di intervento.</p>{item.service_areas[0]&&<p className="mt-3 flex items-center gap-1 text-xs font-semibold text-zinc-500"><MapPin size={13}/>{item.service_areas[0].city} ({item.service_areas[0].province}){item.service_areas.length>1?` +${item.service_areas.length-1}`:''}</p>}</div></Card>)}</div>:<Card hoverEffect={false} className="py-14 text-center"><AlertCircle className="mx-auto text-zinc-300"/><h2 className="mt-3 font-black">Nessun professionista trovato</h2><p className="mt-1 text-sm text-zinc-500">Prova a modificare categoria o comune.</p></Card>}
  </main></div>;
};

// Kept for compatibility with older imports; the active candidate page lives in Candidates.tsx.
export const CandidatesDirectory = () => null;
