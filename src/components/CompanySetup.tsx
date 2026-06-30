import React, { useEffect, useState } from 'react';
import { Building2, Check, MapPin, Wrench } from 'lucide-react';
import { Button, Card, Input, Textarea } from './UI';
import { supabase } from '../lib/supabase/client';
import type { Category, CompanyProfile, ItalianLocation } from '../lib/supabase/types';
import { getCompanyCategories, getCompanyProfile, getCompanyServiceAreas, setCompanyCategories, setCompanyServiceAreas, updateCompanyProfile } from '../lib/companies';

export const CompanySetup = ({ userId }: { userId: string }) => {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<ItalianLocation[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { void (async () => {
    try {
      const [loaded, categoryResult, locationResult] = await Promise.all([
        getCompanyProfile(userId),
        supabase.from('categories').select('*').eq('active', true).order('name'),
        supabase.from('italian_locations').select('*').eq('active', true).order('city'),
      ]);
      if (categoryResult.error) throw categoryResult.error;
      if (locationResult.error) throw locationResult.error;
      setCompany(loaded); setName(loaded.company_name ?? ''); setBio(loaded.bio ?? ''); setWebsite(loaded.website ?? '');
      setCategories((categoryResult.data ?? []) as Category[]); setLocations((locationResult.data ?? []) as ItalianLocation[]);
      const [categoryIds, areas] = await Promise.all([getCompanyCategories(loaded.id), getCompanyServiceAreas(loaded.id)]);
      setSelectedCategories(categoryIds); setSelectedAreas(areas.map(area => `${area.city}|${area.province}`));
    } catch (err: any) { setError(err.message); }
  })(); }, [userId]);

  const toggle = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => setter(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!company) return; setSaving(true); setError(''); setMessage('');
    try {
      await updateCompanyProfile(userId, { company_name: name.trim(), bio: bio.trim() || null, website: website.trim() || null });
      await setCompanyCategories(company.id, selectedCategories);
      await setCompanyServiceAreas(company.id, selectedAreas.map(key => { const [city, province] = key.split('|'); return { city, province }; }));
      setMessage('Profilo aziendale aggiornato.');
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  return <Card hoverEffect={false} className="p-6 md:p-8"><div className="mb-6 flex items-start gap-3"><span className="rounded-2xl bg-blue-50 p-3 text-blue-600"><Building2 size={21}/></span><div><h2 className="text-lg font-black">Servizi e zone operative aziendali</h2><p className="mt-1 text-sm text-zinc-500">Categorie e comuni determinano quali richieste riceverà l'azienda.</p></div></div>
    <form onSubmit={save} className="space-y-6">{error&&<p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}{message&&<p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</p>}
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Nome azienda" value={name} onChange={event=>setName(event.target.value)} required/><Input label="Sito web" value={website} onChange={event=>setWebsite(event.target.value)} placeholder="https://"/></div>
      <Textarea label="Presentazione aziendale" value={bio} onChange={event=>setBio(event.target.value)} rows={4}/>
      <ChoiceGrid title="Categorie di servizio" icon={<Wrench size={17}/>} items={categories.map(c=>({value:c.id,label:c.name}))} selected={selectedCategories} onToggle={value=>toggle(value,setSelectedCategories)}/>
      <ChoiceGrid title="Comuni / zone operative" icon={<MapPin size={17}/>} items={locations.map(l=>({value:`${l.city}|${l.province}`,label:`${l.city} (${l.province})`}))} selected={selectedAreas} onToggle={value=>toggle(value,setSelectedAreas)}/>
      {(selectedCategories.length===0||selectedAreas.length===0)&&<p className="rounded-2xl bg-amber-50 p-4 text-xs font-semibold text-amber-700">Seleziona almeno una categoria e un comune per ricevere richieste compatibili.</p>}
      <Button fullWidth size="lg" disabled={saving}>{saving?'Salvataggio…':<><Check size={17}/> Salva configurazione aziendale</>}</Button>
    </form>
  </Card>;
};

const ChoiceGrid=({title,icon,items,selected,onToggle}:{title:string;icon:React.ReactNode;items:{value:string;label:string}[];selected:string[];onToggle:(value:string)=>void})=><fieldset><legend className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-500">{icon}{title}</legend><div className="max-h-64 overflow-y-auto rounded-3xl border border-zinc-100 bg-zinc-50 p-3"><div className="grid gap-2 sm:grid-cols-2">{items.map(item=>{const active=selected.includes(item.value);return <button type="button" key={item.value} onClick={()=>onToggle(item.value)} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs font-bold transition ${active?'border-blue-200 bg-blue-600 text-white':'border-zinc-100 bg-white text-zinc-700 hover:border-blue-200'}`}><span>{item.label}</span>{active&&<Check size={14}/>}</button>;})}</div></div></fieldset>;
