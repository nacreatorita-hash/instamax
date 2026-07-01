import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Car, MapPin, MessageCircle, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from '../components/UI';
import { MunicipalityAutocomplete } from '../components/MunicipalityAutocomplete';
import type { Municipality } from '../lib/municipalities';
import { useAuth } from '../lib/auth/useAuth';
import { getCandidateById, getCandidateProfile, getPublicCandidates, saveCandidate } from '../lib/candidates';
import { getOrCreateCandidateConversation } from '../lib/chat';
import { buildAppRoute, navigateTo } from '../lib/navigation';

export const Candidates: React.FC = () => {
  const { id } = useParams();
  return id ? <Detail id={id} /> : <List />;
};

const List = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [municipality, setMunicipality] = useState<Municipality | null>(null);

  useEffect(() => {
    void (profile?.role === 'candidate' && user
      ? getCandidateProfile(user.id).then(item => setItems([item]))
      : getPublicCandidates().then(setItems));
  }, [profile?.role, user?.id]);

  if (profile?.role === 'client') {
    return <Empty text="Area riservata ad aziende, professionisti e candidati" />;
  }

  const filtered = items.filter(candidate =>
    `${candidate.main_job_title} ${(candidate.skills ?? []).join(' ')} ${candidate.city}`
      .toLowerCase()
      .includes(query.toLowerCase()) && (!municipality || (candidate.municipality_code ? candidate.municipality_code === municipality.code : candidate.city === municipality.name)),
  );

  return (
    <Page title="Candidati" subtitle="Curriculum digitali per i mestieri della tua zona">
      <div className="grid gap-3 md:grid-cols-[1fr_320px]"><div className="relative">
        <Search className="absolute left-4 top-3.5 text-zinc-400" size={17} />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Cerca mestiere, competenza o comune"
          className="w-full rounded-2xl bg-white py-3 pl-11 pr-4 text-sm"
        />
      </div><MunicipalityAutocomplete value={municipality} onChange={setMunicipality} label="" placeholder="Filtra per comune"/></div>

      {filtered.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(candidate => (
            <Card key={candidate.id}>
              <Badge variant={candidate.available_now ? 'success' : 'gray'}>
                {candidate.available_now ? 'Disponibile subito' : 'Disponibilità da concordare'}
              </Badge>
              <h2 className="mt-3 text-lg font-black">{candidate.main_job_title || 'Curriculum da completare'}</h2>
              <p className="mt-1 text-xs font-bold text-zinc-500">
                <MapPin size={12} className="inline" /> {candidate.city || 'Zona non indicata'} {candidate.province && `(${candidate.province})`}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {(candidate.skills ?? []).slice(0, 5).map((skill: string) => <Badge key={skill}>{skill}</Badge>)}
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-zinc-500">{candidate.bio}</p>
              <Button fullWidth className="mt-4" onClick={() => navigateTo(navigate, buildAppRoute(`/candidates/${candidate.id}`))}>
                Vedi curriculum
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Empty text="Nessun candidato trovato" />
      )}
    </Page>
  );
};

const Detail = ({ id }: { id: string }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<any>();
  const [error, setError] = useState('');

  useEffect(() => {
    void getCandidateById(id).then(setCandidate).catch(err => setError(err.message));
  }, [id]);

  if (!candidate) return <Page title="Curriculum" subtitle="">{error || 'Caricamento…'}</Page>;

  const contact = async () => {
    try {
      const conversation = await getOrCreateCandidateConversation(id);
      navigateTo(navigate, buildAppRoute(`/chat/${conversation.id}`));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const save = async () => {
    if (!user) return;
    try {
      await saveCandidate(user.id, id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Page
      title={candidate.main_job_title || 'Candidato instaMax'}
      subtitle={`${candidate.city || ''} ${candidate.province ? `(${candidate.province})` : ''}`}
    >
      <Card hoverEffect={false}>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{candidate.years_experience || 0} anni esperienza</Badge>
          {candidate.has_car && <Badge variant="success"><Car size={12} /> Automunito</Badge>}
          {candidate.available_travel && <Badge>Trasferte</Badge>}
        </div>
        <h2 className="mt-6 font-black">Competenze</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(candidate.skills ?? []).map((skill: string) => <Badge key={skill}>{skill}</Badge>)}
        </div>
        <h2 className="mt-6 font-black">Presentazione</h2>
        <p className="mt-2 whitespace-pre-wrap leading-7 text-zinc-600">{candidate.bio || 'Nessuna presentazione inserita.'}</p>
        {candidate.cv_url && <a href={candidate.cv_url} target="_blank" className="mt-5 inline-block font-bold text-blue-600">Visualizza CV PDF</a>}
        {candidate.candidate_portfolio?.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {candidate.candidate_portfolio.map((item: any) => (
              <img key={item.id} src={item.file_url} className="aspect-square rounded-2xl object-cover" />
            ))}
          </div>
        )}
      </Card>

      {error && <div className="rounded-xl bg-red-50 p-3 text-red-700">{error}</div>}

      {['company', 'professional'].includes(profile?.role ?? '') && (
        <div className="flex gap-2">
          <Button className="flex-1" onClick={contact}><MessageCircle size={16} /> Contatta</Button>
          <Button variant="outline" onClick={save}><Bookmark size={16} /> Salva</Button>
        </div>
      )}
    </Page>
  );
};

const Page = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-zinc-50/60 pb-28">
    <header className="border-b bg-white px-5 py-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>
    </header>
    <main className="mx-auto max-w-6xl space-y-5 p-5 md:p-8">{children}</main>
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <Page title="Candidati" subtitle="">
    <Card hoverEffect={false} className="py-14 text-center">
      <h2 className="font-black">{text}</h2>
    </Card>
  </Page>
);
