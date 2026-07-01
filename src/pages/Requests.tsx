import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ImagePlus, LockKeyhole, Plus, Search, ShieldCheck, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Select, Textarea } from '../components/UI';
import { MunicipalityAutocomplete } from '../components/MunicipalityAutocomplete';
import { RequestCard } from '../components/Cards';
import { SmartRequestAssistant } from '../components/SmartRequestAssistant';
import { useAuth } from '../lib/auth/useAuth';
import { supabase } from '../lib/supabase/client';
import type { Category, RequestStatus, RequestUrgency, ServiceRequest } from '../lib/supabase/types';
import type { Municipality } from '../lib/municipalities';
import { createServiceRequest, getCompatibleRequestsForProvider, getRequestsForClient, subscribeToCompatibleRequests, uploadRequestMedia } from '../lib/requests';
import { createRequestNotifications } from '../lib/notifications';
import { APP_ROUTES, buildAppRoute, navigateTo } from '../lib/navigation';

const urgencyOptions = [
  { value: 'urgent', label: 'Urgente' }, { value: 'today', label: 'Oggi' },
  { value: 'tomorrow', label: 'Entro domani' }, { value: 'week', label: 'Questa settimana' },
  { value: 'not_urgent', label: 'Non urgente' },
];

export const Requests: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = location.pathname === '/requests/new';
  const [categories, setCategories] = useState<Category[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [providerReady, setProviderReady] = useState<boolean | null>(null);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [municipality, setMunicipality] = useState<Municipality | null>(null);
  const [urgency, setUrgency] = useState<RequestUrgency>('week');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    void Promise.all([
      supabase.from('categories').select('*').eq('active', true).order('name'),
    ]).then(([categoryResult]) => {
      if (categoryResult.error) throw categoryResult.error;
      setCategories((categoryResult.data ?? []) as Category[]);
    }).catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (isNew || !user || !profile) { setLoading(false); return; }
    if (!['client', 'professional', 'company'].includes(profile.role)) { setLoading(false); return; }
    setLoading(true);
    const load = async () => {
      if (profile.role === 'client') {
        setProviderReady(null);
        setRequests(await getRequestsForClient(user.id));
        return;
      }
      const profileTable = profile.role === 'professional' ? 'professional_profiles' : 'company_profiles';
      const categoriesTable = profile.role === 'professional' ? 'professional_categories' : 'company_categories';
      const areasTable = profile.role === 'professional' ? 'service_areas' : 'company_service_areas';
      const ownerColumn = profile.role === 'professional' ? 'professional_id' : 'company_id';
      const { data: provider, error: providerError } = await supabase.from(profileTable).select('id').eq('user_id', user.id).maybeSingle();
      if (providerError) throw providerError;
      if (!provider) { setProviderReady(false); setRequests([]); return; }
      const [categoryResult, areaResult] = await Promise.all([
        supabase.from(categoriesTable).select('id', { count: 'exact', head: true }).eq(ownerColumn, provider.id),
        supabase.from(areasTable).select('id', { count: 'exact', head: true }).eq(ownerColumn, provider.id),
      ]);
      if (categoryResult.error) throw categoryResult.error;
      if (areaResult.error) throw areaResult.error;
      setProviderReady(Boolean(categoryResult.count && areaResult.count));
      setRequests(await getCompatibleRequestsForProvider(user.id));
    };
    void load().catch(err => setError(err.message)).finally(() => setLoading(false));
    if (profile.role !== 'client') return subscribeToCompatibleRequests(() => void load().catch(err => setError(err.message)));
  }, [isNew, user, profile]);

  const filtered = useMemo(() => requests.filter(item => {
    const query = search.trim().toLowerCase();
    return (!query || item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query))
      && (filterCategory === 'all' || item.category_id === filterCategory)
      && (filterCity === 'all' || item.city === filterCity)
      && (filterUrgency === 'all' || item.urgency === filterUrgency)
      && (filterStatus === 'all' || item.status === filterStatus);
  }), [requests, search, filterCategory, filterCity, filterUrgency, filterStatus]);

  const selectFiles = (incoming: FileList | null) => {
    setError('');
    const next = Array.from(incoming ?? []);
    if (files.length + next.length > 5) return setError('Puoi allegare al massimo 5 file.');
    for (const file of next) {
      const isVideo = file.type.startsWith('video/');
      if (!file.type.startsWith('image/') && !isVideo) return setError(`${file.name}: formato non consentito.`);
      if (file.size > (isVideo ? 25 : 5) * 1024 * 1024) return setError(`${file.name}: file troppo grande.`);
    }
    setFiles(current => [...current, ...next]);
  };

  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setSuccess('');
    if (!user || profile?.role !== 'client') return setError('Solo un cliente autenticato può pubblicare richieste.');
    if (!title.trim() || !categoryId || !municipality || !description.trim() || !urgency) {
      return setError('Completa tutti i campi obbligatori.');
    }
    const numericBudget = budget === '' ? null : Number(budget);
    if (numericBudget !== null && (!Number.isFinite(numericBudget) || numericBudget < 0)) return setError('Inserisci un budget valido.');
    setPublishing(true);
    try {
      const created = await createServiceRequest(user.id, {
        title, category_id: categoryId, municipality_code: municipality.code, city: municipality.name,
        province_code: municipality.provinceCode, province: municipality.provinceName,
        urgency, description, budget: numericBudget,
      });
      if (files.length) await uploadRequestMedia(user.id, created.id, files);
      await createRequestNotifications(created.id).catch(err => console.warn('Notifiche non create:', err));
      setSuccess('Richiesta pubblicata con successo.');
      window.setTimeout(() => navigateTo(navigate, buildAppRoute(`/requests/${created.id}`)), 700);
    } catch (err: any) {
      setError(err.message || 'Pubblicazione non riuscita. Controlla i dati inseriti e riprova.');
    } finally { setPublishing(false); }
  };

  if (isNew) {
    if (profile?.role !== 'client') return <RoleUnavailable text="Solo i clienti possono pubblicare una richiesta." />;
    return <div className="min-h-screen bg-zinc-50/60 pb-28">
      <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3"><button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-zinc-100"><ArrowLeft size={19}/></button><div><h1 className="text-lg font-black text-zinc-950">Pubblica una richiesta</h1><p className="text-xs font-medium text-zinc-400">Descrivi il lavoro, senza condividere l’indirizzo preciso</p></div></div>
      </header>
      <main className="mx-auto max-w-3xl p-5 md:p-8">
        <div className="mb-5 flex gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-blue-800"><LockKeyhole className="mt-0.5 shrink-0" size={19}/><div><p className="text-sm font-bold">La tua privacy viene prima</p><p className="mt-1 text-xs leading-relaxed text-blue-700">Mostreremo soltanto comune e provincia. Telefono e indirizzo esatto non saranno pubblicati.</p></div></div>
        <div className="mb-8">
          <SmartRequestAssistant
            categories={categories}
            initialCity={profile?.city ?? ''}
            initialProvince={profile?.province ?? ''}
            compact
          />
        </div>
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">oppure compila manualmente</span>
          <div className="h-px flex-1 bg-zinc-200" />
        </div>
        <Card hoverEffect={false} className="p-5 md:p-8"><form onSubmit={publish} className="space-y-5">
          {error && <Notice kind="error" text={error}/>} {success && <Notice kind="success" text={success}/>}
          <Input label="Titolo richiesta *" value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} placeholder="Es. Cerco idraulico per perdita in cucina"/>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Categoria *" value={categoryId} onChange={e=>setCategoryId(e.target.value)} options={[{value:'',label:'Seleziona una categoria'},...categories.map(c=>({value:c.id,label:c.name}))]}/>
            <MunicipalityAutocomplete value={municipality} onChange={setMunicipality} label="Comune / zona" required/>
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><Select label="Urgenza *" value={urgency} onChange={e=>setUrgency(e.target.value as RequestUrgency)} options={urgencyOptions}/><Input label="Budget indicativo (€)" type="number" min="0" step="0.01" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Facoltativo"/></div>
          <Textarea label="Descrizione *" value={description} onChange={e=>setDescription(e.target.value)} rows={6} maxLength={2000} placeholder="Spiega il problema, il risultato desiderato e ogni dettaglio utile…"/>
          <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Foto o video (facoltativi)</p><label className="flex cursor-pointer flex-col items-center rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-7 text-center transition hover:border-blue-400 hover:bg-blue-50/40"><ImagePlus size={26} className="text-blue-600"/><span className="mt-2 text-sm font-bold text-zinc-800">Aggiungi fino a 5 file</span><span className="mt-1 text-xs text-zinc-400">Immagini max 5 MB · Video max 25 MB</span><input className="hidden" type="file" multiple accept="image/*,video/*" onChange={e=>selectFiles(e.target.files)}/></label>
            {files.length > 0 && <div className="mt-3 space-y-2">{files.map((file,index)=><div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-700"><span className="truncate">{file.name}</span><button type="button" onClick={()=>setFiles(items=>items.filter((_,i)=>i!==index))} className="p-1 text-zinc-400 hover:text-red-500"><X size={15}/></button></div>)}</div>}
          </div>
          <Button fullWidth size="lg" disabled={publishing}>{publishing ? 'Pubblicazione in corso…' : <><CheckCircle2 size={18}/> Pubblica richiesta</>}</Button>
        </form></Card>
      </main>
    </div>;
  }

  if (!profile || !['client','professional','company'].includes(profile.role)) return <RoleUnavailable text="Le richieste operative sono disponibili per clienti, professionisti e aziende." />;

  return <div className="min-h-screen bg-zinc-50/60 pb-28">
    <header className="border-b border-zinc-100 bg-white px-5 py-6"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-black text-zinc-950">{profile.role === 'client' ? 'Le mie richieste' : 'Richieste compatibili'}</h1><p className="mt-1 text-sm text-zinc-500">{profile.role === 'client' ? 'Qui trovi esclusivamente le richieste che hai pubblicato.' : 'Richieste dei clienti filtrate in base alle tue categorie professionali e zone operative.'}</p></div>{profile.role === 'client' && <Button onClick={()=>navigateTo(navigate, APP_ROUTES.requestNew)}><Plus size={16}/> Nuova richiesta</Button>}</div></header>
    <main className="mx-auto max-w-7xl space-y-6 p-5 md:p-8">
      {error && <Notice kind="error" text={error}/>}
      <div className="grid gap-3 rounded-3xl border border-zinc-100 bg-white p-4 md:grid-cols-5"><div className="relative md:col-span-2"><Search className="absolute left-3 top-3.5 text-zinc-400" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca nel titolo o descrizione" className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"/></div><FilterSelect value={filterCategory} onChange={setFilterCategory} options={[['all','Tutte le categorie'],...categories.map(c=>[c.id,c.name])] as string[][]}/><FilterSelect value={filterCity} onChange={setFilterCity} options={[['all','Tutti i comuni'],...Array.from(new Set<string>(requests.map(r=>r.city))).map(city=>[city,city])] as string[][]}/><FilterSelect value={filterUrgency} onChange={setFilterUrgency} options={[['all','Tutte le urgenze'],...urgencyOptions.map(o=>[o.value,o.label])] as string[][]}/></div>
      {profile.role === 'client' && <div className="max-w-xs"><FilterSelect value={filterStatus} onChange={setFilterStatus} options={[['all','Tutti gli stati'],['open','Aperte'],['awaiting_client_choice','Da assegnare'],['assigned','Assegnate'],['in_progress','In corso'],['awaiting_completion','Da confermare'],['completed','Completate'],['cancelled','Annullate']]}/></div>}
      {loading ? <div className="py-20 text-center text-sm font-semibold text-zinc-400">Caricamento richieste…</div> : filtered.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map(item=><RequestCard key={item.id} request={item}/>)}</div> : <EmptyState provider={profile.role!=='client'} profileComplete={providerReady !== false} onCreate={()=>navigateTo(navigate, APP_ROUTES.requestNew)} onProfile={()=>navigateTo(navigate, APP_ROUTES.profile)}/>}
    </main>
  </div>;
};

const Notice = ({kind,text}:{kind:'error'|'success';text:string}) => <div className={`rounded-2xl border p-4 text-sm font-semibold ${kind==='error'?'border-red-100 bg-red-50 text-red-700':'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>{text}</div>;
const FilterSelect = ({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:string[][]}) => <select value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-700 outline-none focus:border-blue-500">{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>;
const RoleUnavailable = ({text}:{text:string}) => <div className="flex min-h-[70vh] items-center justify-center p-6"><Card className="max-w-md text-center"><ShieldCheck className="mx-auto text-blue-600" size={34}/><h1 className="mt-4 text-lg font-black">Funzione non disponibile</h1><p className="mt-2 text-sm leading-relaxed text-zinc-500">{text}</p></Card></div>;
const EmptyState = ({provider,profileComplete,onCreate,onProfile}:{provider:boolean;profileComplete:boolean;onCreate:()=>void;onProfile:()=>void}) => <Card className="mx-auto max-w-lg border-dashed py-14 text-center" hoverEffect={false}><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Search size={25}/></div><h2 className="mt-4 text-lg font-black text-zinc-950">{provider?(profileComplete?'Nessuna nuova richiesta compatibile':'Completa il tuo profilo professionale'):'Nessuna richiesta pubblicata'}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">{provider?(profileComplete?'Al momento non ci sono nuove richieste compatibili nella tua zona.':'Completa categorie e zone operative per visualizzare le richieste compatibili.'):'Quando avrai bisogno di un professionista, pubblica qui la tua prima richiesta.'}</p>{provider&&!profileComplete?<Button className="mt-5" onClick={onProfile}>Completa il profilo</Button>:!provider&&<Button className="mt-5" onClick={onCreate}><Plus size={16}/> Pubblica la prima richiesta</Button>}</Card>;
