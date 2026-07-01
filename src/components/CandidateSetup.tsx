import React, { useEffect, useState } from 'react';
import { Check, FileUp, ImagePlus } from 'lucide-react';
import { Button, Card, Input, Select, Textarea } from './UI';
import { MunicipalityAutocomplete } from './MunicipalityAutocomplete';
import { findMunicipalityByLegacyLocation, type Municipality } from '../lib/municipalities';
import { getCandidateProfile, updateCandidateProfile, uploadCandidateCv, uploadCandidatePortfolio } from '../lib/candidates';

export const CandidateSetup = ({ userId }: { userId: string }) => {
  const [candidate, setCandidate] = useState<any>();
  const [municipality, setMunicipality] = useState<Municipality | null>(null);
  const [skills, setSkills] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const load = async () => {
    const item = await getCandidateProfile(userId);
    setCandidate(item);
    setSkills((item.skills ?? []).join(', '));
    setMunicipality(await findMunicipalityByLegacyLocation(item.city, item.province));
  };
  useEffect(() => { void load().catch(err => setError(err.message)); }, [userId]);
  if (!candidate) return <Card hoverEffect={false}>Caricamento curriculum…</Card>;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!candidate.main_job_title) return setError('Inserisci il mestiere principale.');
    if (!municipality) return setError('Seleziona un comune valido dall’elenco.');
    setSaving(true);
    try {
      await updateCandidateProfile(userId, {
        ...candidate,
        municipality_code: municipality.code, city: municipality.name,
        province_code: municipality.provinceCode, province: municipality.provinceName,
        skills: skills.split(',').map(item => item.trim()).filter(Boolean),
        years_experience: Number(candidate.years_experience) || 0,
      });
      setMessage('Curriculum aggiornato.');
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };
  const cv = async (file: File) => { try { const uploaded = await uploadCandidateCv(userId, file); await updateCandidateProfile(userId, { cv_url: uploaded.url }); await load(); setMessage('CV caricato.'); } catch (err: any) { setError(err.message); } };
  const portfolio = async (file: File) => { try { if ((candidate.candidate_portfolio?.length ?? 0) >= 10) throw new Error('Massimo 10 immagini.'); await uploadCandidatePortfolio(userId, candidate.id, file); await load(); setMessage('Immagine portfolio caricata.'); } catch (err: any) { setError(err.message); } };

  return <Card hoverEffect={false}><h2 className="text-lg font-black">Curriculum digitale</h2><p className="mt-1 text-sm text-zinc-500">Il tuo profilo professionale, senza mostrare automaticamente telefono o email.</p><form onSubmit={save} className="mt-5 space-y-4">{error && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message && <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}<Input label="Mestiere principale *" value={candidate.main_job_title ?? ''} onChange={event => setCandidate({...candidate, main_job_title:event.target.value})}/><Input label="Competenze, separate da virgola" value={skills} onChange={event => setSkills(event.target.value)}/><div className="grid gap-4 sm:grid-cols-2"><Input label="Anni esperienza" type="number" min="0" value={candidate.years_experience ?? 0} onChange={event => setCandidate({...candidate, years_experience:event.target.value})}/><MunicipalityAutocomplete value={municipality} onChange={setMunicipality} required/></div><Input label="Patente" value={candidate.driving_license ?? ''} onChange={event => setCandidate({...candidate, driving_license:event.target.value})}/><div className="grid gap-2 sm:grid-cols-3">{[['has_car','Automunito'],['available_now','Disponibile subito'],['available_travel','Disponibile a trasferte']].map(([key,label]) => <label key={key} className="flex items-center gap-2 rounded-2xl bg-zinc-50 p-3 text-sm font-bold"><input type="checkbox" checked={Boolean(candidate[key])} onChange={event => setCandidate({...candidate,[key]:event.target.checked})}/>{label}</label>)}</div><Textarea label="Presentazione" maxLength={1500} rows={6} value={candidate.bio ?? ''} onChange={event => setCandidate({...candidate,bio:event.target.value})}/><Select label="Visibilità" value={candidate.visibility ?? 'public'} onChange={event => setCandidate({...candidate,visibility:event.target.value})} options={[{value:'public',label:'Pubblico — visibile alle aziende'},{value:'private',label:'Privato — visibile solo dopo candidatura'}]}/><div className="grid gap-3 sm:grid-cols-2"><label className="cursor-pointer rounded-2xl border border-dashed p-4 text-center text-sm font-bold"><FileUp className="mx-auto mb-2"/>Carica CV PDF<input className="hidden" type="file" accept="application/pdf" onChange={event => { const file=event.target.files?.[0]; if(file) void cv(file); }}/></label><label className="cursor-pointer rounded-2xl border border-dashed p-4 text-center text-sm font-bold"><ImagePlus className="mx-auto mb-2"/>Aggiungi portfolio<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { const file=event.target.files?.[0]; if(file) void portfolio(file); }}/></label></div><Button fullWidth disabled={saving}><Check size={16}/>{saving?'Salvataggio…':'Salva curriculum'}</Button></form></Card>;
};
