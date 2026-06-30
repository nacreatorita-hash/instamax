import React from 'react';
import { Badge, Input, Select, Textarea } from './UI';
import type { Category } from '../lib/supabase/types';
import type { GeminiUrgency, SmartRequestDraft } from '../lib/smart-request';

const urgencyOptions: Array<{ value: GeminiUrgency; label: string }> = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'oggi', label: 'Oggi' },
  { value: 'entro_domani', label: 'Entro domani' },
  { value: 'questa_settimana', label: 'Questa settimana' },
  { value: 'non_urgente', label: 'Non urgente' },
];

export const SmartRequestSummary = ({
  draft,
  categories,
  onChange,
}: {
  draft: SmartRequestDraft;
  categories: Category[];
  onChange: (draft: SmartRequestDraft) => void;
}) => {
  const confidence = Math.round((draft.confidence || 0) * 100);

  return (
    <div className="space-y-4 rounded-[2rem] border border-zinc-100 bg-white p-4 shadow-xl shadow-zinc-200/40 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">Riepilogo modificabile</p>
          <h3 className="mt-1 text-lg font-black text-zinc-950">Controlla prima di pubblicare</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={draft.source === 'fallback' ? 'warning' : 'success'}>
            {draft.source === 'fallback' ? 'Classificazione base' : 'Analisi AI'}
          </Badge>
          <Badge variant={draft.needsManualReview ? 'warning' : 'info'}>{confidence}% confidenza</Badge>
        </div>
      </div>

      {draft.needsManualReview && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">
          Controlla categoria e urgenza: l’analisi non è completamente sicura.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Categoria suggerita"
          value={draft.categoryId ?? ''}
          onChange={event => onChange({ ...draft, categoryId: event.target.value })}
          options={[
            { value: '', label: 'Seleziona categoria' },
            ...categories.map(category => ({ value: category.id, label: category.name })),
          ]}
        />
        <Select
          label="Urgenza stimata"
          value={draft.suggestedUrgency}
          onChange={event => onChange({ ...draft, suggestedUrgency: event.target.value as GeminiUrgency })}
          options={urgencyOptions}
        />
      </div>

      <Input
        label="Titolo"
        value={draft.suggestedTitle}
        maxLength={100}
        onChange={event => onChange({ ...draft, suggestedTitle: event.target.value })}
      />

      <Textarea
        label="Descrizione"
        rows={5}
        maxLength={2000}
        value={draft.suggestedDescription}
        onChange={event => onChange({ ...draft, suggestedDescription: event.target.value })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Comune"
          value={draft.city}
          placeholder="Es. Angri"
          onChange={event => onChange({ ...draft, city: event.target.value })}
        />
        <Input
          label="Provincia"
          value={draft.province}
          placeholder="Es. SA"
          maxLength={2}
          onChange={event => onChange({ ...draft, province: event.target.value.toUpperCase() })}
        />
      </div>

      {draft.matchedKeywords.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">Parole chiave rilevate</p>
          <div className="flex flex-wrap gap-2">
            {draft.matchedKeywords.map(keyword => (
              <span key={keyword} className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold text-zinc-600">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
