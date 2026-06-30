import React, { useEffect, useState } from 'react';
import { Bot, CheckCircle2, LockKeyhole, Send, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './UI';
import { QuickProblemChips } from './QuickProblemChips';
import { SmartRequestSummary } from './SmartRequestSummary';
import { useAuth } from '../lib/auth/useAuth';
import { createServiceRequest } from '../lib/requests';
import { createRequestNotifications } from '../lib/notifications';
import type { Category } from '../lib/supabase/types';
import {
  analyzeServiceRequest,
  clearPendingRequestDraft,
  getCategoryBySlug,
  mapGeminiUrgencyToRequestUrgency,
  readPendingRequestDraft,
  savePendingRequestDraft,
  type SmartRequestDraft,
} from '../lib/smart-request';

export const SmartRequestAssistant = ({
  categories,
  initialCity = '',
  initialProvince = '',
  compact = false,
}: {
  categories: Category[];
  initialCity?: string;
  initialProvince?: string;
  compact?: boolean;
}) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<SmartRequestDraft | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const pending = readPendingRequestDraft();
    if (pending && user && profile?.role === 'client') {
      setDraft({
        ...pending,
        city: pending.city || profile.city || initialCity,
        province: pending.province || profile.province || initialProvince,
      });
      setText(pending.originalText);
      setNotice('Bozza recuperata dopo il login. Controlla i dati e pubblica quando vuoi.');
    }
  }, [user?.id, profile?.role]);

  const analyze = async () => {
    setError('');
    setNotice('');
    setAnalyzing(true);

    try {
      const analysis = await analyzeServiceRequest({
        text,
        city: profile?.city || initialCity,
        province: profile?.province || initialProvince,
      }, categories);
      const category = getCategoryBySlug(categories, analysis.suggestedCategorySlug);
      setDraft({
        ...analysis,
        originalText: text.trim(),
        city: profile?.city || initialCity,
        province: profile?.province || initialProvince,
        categoryId: category?.id ?? '',
      });
      if (analysis.source === 'fallback') {
        setNotice('Analisi automatica non disponibile, abbiamo usato una classificazione base.');
      }
    } catch (err: any) {
      setError(err.message || 'Non riesco ad analizzare la richiesta.');
    } finally {
      setAnalyzing(false);
    }
  };

  const publish = async () => {
    if (!draft) return;
    setError('');
    setNotice('');

    if (!user) {
      savePendingRequestDraft(draft);
      navigate('/login');
      return;
    }

    if (profile?.role !== 'client') {
      setError('Solo un cliente può pubblicare una richiesta. Cambia ruolo dal profilo oppure usa un account cliente.');
      return;
    }

    if (!draft.categoryId) return setError('Seleziona una categoria prima di pubblicare.');
    if (!draft.city.trim()) return setError('Inserisci il comune prima di pubblicare.');
    if (!draft.province.trim()) return setError('Inserisci la provincia prima di pubblicare.');
    if (!draft.suggestedTitle.trim() || !draft.suggestedDescription.trim()) {
      return setError('Completa titolo e descrizione prima di pubblicare.');
    }

    setPublishing(true);
    try {
      const created = await createServiceRequest(user.id, {
        title: draft.suggestedTitle,
        description: draft.suggestedDescription,
        category_id: draft.categoryId,
        city: draft.city,
        province: draft.province,
        urgency: mapGeminiUrgencyToRequestUrgency(draft.suggestedUrgency),
        budget: null,
      });
      await createRequestNotifications(created.id).catch(err => console.warn('Notifiche non create:', err));
      clearPendingRequestDraft();
      setNotice('Richiesta pubblicata. Stiamo avvisando i professionisti compatibili nella tua zona.');
      window.setTimeout(() => navigate(`/requests/${created.id}`), 700);
    } catch (err: any) {
      setError(err.message || 'Richiesta non pubblicata. Riprova tra poco.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={`mx-auto w-full ${compact ? 'max-w-3xl' : 'max-w-4xl'}`}>
      <div className="rounded-[2.5rem] border border-zinc-100 bg-white p-4 shadow-2xl shadow-zinc-200/60 md:p-6">
        <div className="mb-4 flex items-start gap-3 rounded-[1.75rem] bg-zinc-950 p-4 text-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black">Di cosa hai bisogno?</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">
              Scrivi il problema e ti aiutiamo a trovare il professionista giusto nella tua zona.
            </p>
          </div>
        </div>

        <QuickProblemChips onPick={value => setText(value)} />

        <div className="mt-4 rounded-[2rem] border border-zinc-100 bg-zinc-50 p-3">
          <textarea
            value={text}
            onChange={event => setText(event.target.value.slice(0, 1000))}
            placeholder="Esempio: si è rotto il tubo della cucina…"
            rows={compact ? 4 : 5}
            className="w-full resize-none bg-transparent px-2 py-2 text-base font-semibold text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          <div className="flex flex-col gap-3 border-t border-zinc-200/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
              <LockKeyhole size={13} /> Non inserire indirizzo preciso, telefono o dati sensibili.
            </div>
            <Button onClick={analyze} disabled={analyzing || text.trim().length < 10}>
              {analyzing ? (
                <>
                  <Sparkles className="animate-pulse" size={16} /> Sto analizzando…
                </>
              ) : (
                <>
                  <Send size={16} /> Trova professionista
                </>
              )}
            </Button>
          </div>
        </div>

        {notice && <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-semibold text-amber-800">{notice}</div>}
        {error && <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}

        {draft && (
          <div className="mt-5 space-y-4">
            <SmartRequestSummary draft={draft} categories={categories} onChange={setDraft} />
            <Button fullWidth size="lg" onClick={publish} disabled={publishing}>
              {publishing ? 'Pubblicazione in corso…' : (
                <>
                  <CheckCircle2 size={18} /> Pubblica richiesta
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
