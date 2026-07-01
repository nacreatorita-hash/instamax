import React, { useEffect, useState } from 'react';
import { Check, MapPin, Settings2, Wrench } from 'lucide-react';
import { Button, Card, Input, Select, Textarea } from './UI';
import { MunicipalityMultiSelect } from './MunicipalityAutocomplete';
import { supabase } from '../lib/supabase/client';
import type { Category, ProfessionalProfile } from '../lib/supabase/types';
import { findMunicipalityByLegacyLocation, loadMunicipalities, type Municipality } from '../lib/municipalities';
import { getProfessionalCategories, getProfessionalProfile, getServiceAreas, setProfessionalCategories, setServiceAreas, updateProfessionalProfile } from '../lib/professionals';

export const ProfessionalSetup: React.FC<{ userId: string }> = ({ userId }) => {
  const [professional, setProfessional] = useState<ProfessionalProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<Municipality[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [years, setYears] = useState('0');
  const [status, setStatus] = useState<ProfessionalProfile['status']>('not_available');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { void (async () => {
    try {
      const [prof, categoryResult] = await Promise.all([
        getProfessionalProfile(userId),
        supabase.from('categories').select('*').eq('active', true).order('name'),
      ]);
      if (categoryResult.error) throw categoryResult.error;
      setProfessional(prof); setBusinessName(prof.business_name ?? ''); setBio(prof.bio ?? ''); setYears(String(prof.years_experience)); setStatus(prof.status);
      setCategories((categoryResult.data??[]) as Category[]);
      const [categoryIds, areas] = await Promise.all([getProfessionalCategories(prof.id), getServiceAreas(prof.id)]);
      const catalogue = await loadMunicipalities();
      const resolved = await Promise.all(areas.map(area => area.municipality_code
        ? catalogue.find(item => item.code === area.municipality_code) ?? null
        : findMunicipalityByLegacyLocation(area.city, area.province)));
      setSelectedCategories(categoryIds); setSelectedAreas(resolved.filter((item): item is Municipality => Boolean(item)));
    } catch(err:any){setError(err.message);} finally{setLoading(false);}
  })(); }, [userId]);

  const toggle = (value:string,setter:React.Dispatch<React.SetStateAction<string[]>>) => setter(current=>current.includes(value)?current.filter(item=>item!==value):[...current,value]);
  const save = async (event:React.FormEvent) => {
    event.preventDefault(); if(!professional)return; setSaving(true);setError('');setMessage('');
    try {
      await updateProfessionalProfile(userId,{business_name:businessName.trim()||null,bio:bio.trim()||null,years_experience:Math.max(0,Number(years)||0),status});
      await setProfessionalCategories(professional.id,selectedCategories);
      await setServiceAreas(professional.id, selectedAreas);
      setMessage('Profilo professionale aggiornato. Il feed è ora calibrato sulle tue preferenze.');
    }catch(err:any){setError(err.message);}finally{setSaving(false);}
  };

  if(loading)return <Card hoverEffect={false} className="text-center text-sm font-semibold text-zinc-400">Caricamento configurazione professionale…</Card>;
  return <Card hoverEffect={false} className="p-6 md:p-8"><div className="mb-6 flex items-start gap-3"><div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><Settings2 size={21}/></div><div><h2 className="text-lg font-black text-zinc-950">Profilo professionale e zone operative</h2><p className="mt-1 text-sm text-zinc-500">Queste impostazioni determinano quali richieste vedrai.</p></div></div>
    <form onSubmit={save} className="space-y-6">{error&&<div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}{message&&<div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Nome attività" value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="Es. Idraulica Rossi"/><Input label="Anni di esperienza" type="number" min="0" max="70" value={years} onChange={e=>setYears(e.target.value)}/></div>
      <Select label="Stato disponibilità" value={status} onChange={e=>setStatus(e.target.value as ProfessionalProfile['status'])} options={[{value:'available',label:'Disponibile'},{value:'busy',label:'Occupato'},{value:'not_available',label:'Non disponibile'}]}/>
      <Textarea label="Presentazione professionale" value={bio} onChange={e=>setBio(e.target.value)} rows={5} placeholder="Esperienza, certificazioni e modo di lavorare…"/>
      <ChoiceGrid title="Categorie di lavoro" icon={<Wrench size={17}/>} items={categories.map(c=>({value:c.id,label:c.name}))} selected={selectedCategories} onToggle={value=>toggle(value,setSelectedCategories)}/>
      <MunicipalityMultiSelect values={selectedAreas} onChange={setSelectedAreas} required/>
      {(selectedCategories.length===0||selectedAreas.length===0)&&<p className="rounded-2xl bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-700">Seleziona almeno una categoria e un comune per ricevere richieste compatibili.</p>}
      <Button fullWidth size="lg" disabled={saving}>{saving?'Salvataggio…':<><Check size={17}/> Salva configurazione professionale</>}</Button>
    </form>
  </Card>;
};

const ChoiceGrid=({title,icon,items,selected,onToggle}:{title:string;icon:React.ReactNode;items:{value:string;label:string}[];selected:string[];onToggle:(v:string)=>void})=><fieldset><legend className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-500">{icon}{title}</legend><div className="max-h-64 overflow-y-auto rounded-3xl border border-zinc-100 bg-zinc-50 p-3"><div className="grid gap-2 sm:grid-cols-2">{items.map(item=>{const active=selected.includes(item.value);return <button type="button" key={item.value} onClick={()=>onToggle(item.value)} className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs font-bold transition ${active?'border-blue-200 bg-blue-600 text-white':'border-zinc-100 bg-white text-zinc-700 hover:border-blue-200'}`}><span>{item.label}</span>{active&&<Check size={14}/>}</button>;})}</div></div></fieldset>;
