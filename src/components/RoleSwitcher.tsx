import React, { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Building2, UserRound, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from './UI';
import { useAuth } from '../lib/auth/useAuth';
import { changeMyRole } from '../lib/supabase/auth';
import { getRedirectPath } from '../lib/auth/roleRedirect';
import type { UserRole } from '../lib/supabase/types';

const roles: Array<{ value: UserRole; label: string; description: string; icon: React.ReactNode }> = [
  { value: 'client', label: 'Cliente', description: 'Cerco professionisti e pubblico richieste.', icon: <UserRound size={20}/> },
  { value: 'professional', label: 'Professionista', description: 'Offro servizi e ricevo lavori compatibili.', icon: <Wrench size={20}/> },
  { value: 'company', label: 'Azienda', description: 'Pubblico offerte e cerco personale.', icon: <Building2 size={20}/> },
  { value: 'candidate', label: 'Candidato', description: 'Cerco lavoro e invio candidature.', icon: <BriefcaseBusiness size={20}/> },
];

export const RoleSwitcher: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserRole>(profile?.role ?? 'client');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!profile) return null;
  const submit = async () => {
    if (selected === profile.role) return setMessage('Questo è già il tuo ruolo attivo.');
    setLoading(true); setError(''); setMessage('');
    try {
      const updated = await changeMyRole(selected);
      await refreshProfile();
      setMessage(`Ruolo cambiato in ${roles.find(item=>item.value===selected)?.label}.`);
      window.setTimeout(() => navigate(getRedirectPath(updated.role), { replace: true }), 500);
    } catch (err:any) { setError(err.message || 'Impossibile cambiare ruolo.'); }
    finally { setLoading(false); }
  };

  return <Card hoverEffect={false} className="p-6 md:p-8">
    <div className="mb-5"><h2 className="text-lg font-black text-zinc-950">Come vuoi usare instaMax?</h2><p className="mt-1 text-sm leading-relaxed text-zinc-500">Puoi cambiare area in qualsiasi momento. I dati già pubblicati non vengono eliminati.</p></div>
    {error&&<div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
    {message&&<div className="mb-4 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</div>}
    <div className="grid gap-3 sm:grid-cols-2">{roles.map(role=>{const active=selected===role.value;return <button type="button" key={role.value} onClick={()=>setSelected(role.value)} className={`flex items-start gap-3 rounded-3xl border p-4 text-left transition ${active?'border-blue-500 bg-blue-50 ring-2 ring-blue-100':'border-zinc-100 bg-white hover:border-blue-200'}`}><span className={`rounded-2xl p-2.5 ${active?'bg-blue-600 text-white':'bg-zinc-100 text-zinc-600'}`}>{role.icon}</span><span><span className="block text-sm font-black text-zinc-900">{role.label}{profile.role===role.value&&<span className="ml-2 text-[10px] uppercase tracking-wider text-blue-600">Attivo</span>}</span><span className="mt-1 block text-xs leading-relaxed text-zinc-500">{role.description}</span></span></button>;})}</div>
    <div className="mt-5 flex justify-end"><Button onClick={submit} disabled={loading||selected===profile.role}>{loading?'Cambio in corso…':<>Passa a questa area <ArrowRight size={16}/></>}</Button></div>
  </Card>;
};
