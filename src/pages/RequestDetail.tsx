import React, { useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, Edit3, Euro, MapPin, MessageCircle, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, Input, Select, Textarea } from '../components/UI';
import { useAuth } from '../lib/auth/useAuth';
import { closeServiceRequest, deleteServiceRequest, getRequestById, updateServiceRequest } from '../lib/requests';
import type { RequestUrgency, ServiceRequest } from '../lib/supabase/types';
import { getOrCreateRequestConversation } from '../lib/chat';

const urgencyLabels = { urgent:'Urgente', today:'Oggi', tomorrow:'Entro domani', week:'Questa settimana', not_urgent:'Non urgente' };
const statusLabels = { open:'Aperta', in_progress:'In corso', closed:'Chiusa', cancelled:'Annullata' };

export const RequestDetail: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState<RequestUrgency>('week');

  const load = () => getRequestById(id).then(item => {
    setRequest(item);
    if (item) { setTitle(item.title); setDescription(item.description); setBudget(item.budget?.toString() ?? ''); setUrgency(item.urgency); }
  }).catch(err => setError(err.message)).finally(()=>setLoading(false));
  useEffect(() => { void load(); }, [id]);

  const owner = Boolean(user && request?.client_id === user.id);
  const elapsed = request ? formatElapsed(request.created_at) : '';
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      const numericBudget = budget === '' ? null : Number(budget);
      if (!title.trim() || !description.trim() || (numericBudget !== null && !Number.isFinite(numericBudget))) throw new Error('Controlla i dati inseriti.');
      const updated = await updateServiceRequest(id, { title, description, urgency, budget: numericBudget });
      setRequest(updated); setEditing(false);
    } catch (err:any) { setError(err.message); } finally { setSaving(false); }
  };
  const close = async () => { if (!window.confirm('Vuoi chiudere questa richiesta?')) return; try { setRequest(await closeServiceRequest(id)); } catch(err:any){setError(err.message);} };
  const remove = async () => { if (!window.confirm('Eliminare definitivamente la richiesta e i suoi allegati?')) return; try { await deleteServiceRequest(id); navigate('/requests'); } catch(err:any){setError(err.message);} };
  const contact = async () => { setContacting(true); setError(''); try { const conversation = await getOrCreateRequestConversation(id); navigate(`/chat/${conversation.id}`); } catch(err:any){ setError(err.message || 'Non puoi contattare il cliente per questa richiesta.'); } finally { setContacting(false); } };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center text-sm font-semibold text-zinc-400">Caricamento dettaglio…</div>;
  if (!request) return <div className="flex min-h-[70vh] items-center justify-center p-6"><Card className="max-w-md text-center"><XCircle className="mx-auto text-red-500"/><h1 className="mt-3 text-lg font-black">Richiesta non disponibile</h1><p className="mt-2 text-sm text-zinc-500">Non esiste oppure non hai i permessi per visualizzarla.</p><Button className="mt-5" onClick={()=>navigate('/requests')}>Torna alle richieste</Button></Card></div>;

  return <div className="min-h-screen bg-zinc-50/60 pb-28">
    <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 px-5 py-4 backdrop-blur-xl"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3"><button onClick={()=>navigate('/requests')} className="rounded-full p-2 hover:bg-zinc-100"><ArrowLeft size={19}/></button>{owner&&<div className="flex gap-2">{request.status==='open'&&<Button size="sm" variant="outline" onClick={()=>setEditing(v=>!v)}><Edit3 size={14}/> Modifica</Button>}<Button size="sm" variant="danger" onClick={remove}><Trash2 size={14}/></Button></div>}</div></header>
    <main className="mx-auto max-w-5xl space-y-5 p-5 md:p-8">
      {error&&<div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      <div className="flex flex-wrap items-center gap-2"><Badge variant={request.status==='open'?'success':request.status==='in_progress'?'info':'gray'}>{statusLabels[request.status]}</Badge><Badge variant={request.urgency==='urgent'?'warning':'gray'}>{urgencyLabels[request.urgency]}</Badge><span className="ml-auto text-xs font-semibold text-zinc-400">Pubblicata {elapsed}</span></div>
      {editing ? <Card hoverEffect={false}><form onSubmit={save} className="space-y-4"><Input label="Titolo" value={title} onChange={e=>setTitle(e.target.value)}/><Textarea label="Descrizione" value={description} onChange={e=>setDescription(e.target.value)} rows={6}/><div className="grid gap-4 sm:grid-cols-2"><Select label="Urgenza" value={urgency} onChange={e=>setUrgency(e.target.value as RequestUrgency)} options={Object.entries(urgencyLabels).map(([value,label])=>({value,label}))}/><Input label="Budget (€)" type="number" min="0" value={budget} onChange={e=>setBudget(e.target.value)}/></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setEditing(false)}>Annulla</Button><Button disabled={saving}>{saving?'Salvataggio…':'Salva modifiche'}</Button></div></form></Card> : <Card hoverEffect={false} className="p-6 md:p-9">
        <span className="text-xs font-black uppercase tracking-widest text-blue-600">{request.categories?.name ?? 'Servizio'}</span><h1 className="mt-2 text-2xl font-black leading-tight text-zinc-950 md:text-4xl">{request.title}</h1>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-y border-zinc-100 py-4 text-sm font-semibold text-zinc-600"><span className="flex items-center gap-2"><MapPin size={17} className="text-blue-600"/> {request.city} ({request.province})</span><span className="flex items-center gap-2"><Euro size={17} className="text-blue-600"/> {request.budget==null?'Budget da concordare':`€${request.budget}`}</span><span className="flex items-center gap-2"><CalendarClock size={17} className="text-blue-600"/> {new Date(request.created_at).toLocaleString('it-IT')}</span></div>
        <h2 className="mt-7 text-sm font-black text-zinc-900">Descrizione dell’intervento</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-600">{request.description}</p>
        <div className="mt-7 flex items-center gap-3 rounded-3xl bg-zinc-50 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-sm font-black text-white">CL</div><div><p className="text-sm font-bold text-zinc-900">Cliente instaMax</p><p className="text-xs text-zinc-400">Identità e contatti protetti</p></div><ShieldCheck className="ml-auto text-emerald-500" size={20}/></div>
      </Card>}
      {(request.request_media?.length??0)>0&&<Card hoverEffect={false}><h2 className="mb-4 text-sm font-black">Allegati</h2><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{request.request_media!.map(media=>media.file_type.startsWith('image/')?<img key={media.id} src={media.file_url} alt={media.file_name??'Allegato'} className="aspect-square w-full rounded-2xl object-cover"/>:<video key={media.id} src={media.file_url} controls className="aspect-square w-full rounded-2xl bg-black object-cover"/>)}</div></Card>}
      {owner&&request.status==='open'&&<Card hoverEffect={false} className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-sm font-black">Hai concluso o non ti serve più?</h2><p className="mt-1 text-xs text-zinc-500">Chiudi la richiesta: non apparirà più ai professionisti.</p></div><Button variant="outline" onClick={close}>Chiudi richiesta</Button></Card>}
      {profile?.role==='professional'&&<Button fullWidth size="lg" disabled={contacting||request.status!=='open'} onClick={contact}><MessageCircle size={18}/> {contacting?'Apertura chat…':'Contatta'}</Button>}
    </main>
  </div>;
};

function formatElapsed(date:string){const seconds=Math.max(0,Math.floor((Date.now()-new Date(date).getTime())/1000));if(seconds<60)return'adesso';if(seconds<3600)return`${Math.floor(seconds/60)} minuti fa`;if(seconds<86400)return`${Math.floor(seconds/3600)} ore fa`;return`${Math.floor(seconds/86400)} giorni fa`;}
