import { supabase } from './supabase/client';
import type { Category, RequestUrgency } from './supabase/types';
import { analyzeServiceRequestFallback } from './smart-request-fallback';

export const PENDING_REQUEST_KEY = 'handygo_pending_request';

export type GeminiUrgency = 'urgente' | 'oggi' | 'entro_domani' | 'questa_settimana' | 'non_urgente';

export type SmartRequestInput = {
  text: string;
  city?: string;
  province?: string;
};

export type SmartRequestAnalysis = {
  suggestedCategorySlug: string;
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedUrgency: GeminiUrgency;
  confidence: number;
  matchedKeywords: string[];
  needsManualReview: boolean;
  source?: 'gemini' | 'fallback';
};

export type SmartRequestDraft = SmartRequestAnalysis & {
  originalText: string;
  city: string;
  province: string;
  categoryId?: string;
};

export const quickProblemSuggestions = [
  'Perdita acqua in cucina',
  'Non funziona la corrente',
  'Porta bloccata',
  'Caldaia in errore',
  'Condizionatore perde acqua',
  'Devo tinteggiare casa',
  'Ho bisogno di un giardiniere',
  'Devo riparare una serratura',
];

export function mapGeminiUrgencyToRequestUrgency(urgency: GeminiUrgency): RequestUrgency {
  const map: Record<GeminiUrgency, RequestUrgency> = {
    urgente: 'urgent',
    oggi: 'today',
    entro_domani: 'tomorrow',
    questa_settimana: 'week',
    non_urgente: 'not_urgent',
  };
  return map[urgency];
}

export function mapRequestUrgencyToGeminiUrgency(urgency: RequestUrgency): GeminiUrgency {
  const map: Record<RequestUrgency, GeminiUrgency> = {
    urgent: 'urgente',
    today: 'oggi',
    tomorrow: 'entro_domani',
    week: 'questa_settimana',
    not_urgent: 'non_urgente',
  };
  return map[urgency];
}

export function getCategoryBySlug(categories: Category[], slug: string) {
  return categories.find(category => category.slug === slug) ?? null;
}

export function savePendingRequestDraft(draft: SmartRequestDraft) {
  localStorage.setItem(PENDING_REQUEST_KEY, JSON.stringify(draft));
}

export function readPendingRequestDraft() {
  const raw = localStorage.getItem(PENDING_REQUEST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SmartRequestDraft;
  } catch {
    localStorage.removeItem(PENDING_REQUEST_KEY);
    return null;
  }
}

export function clearPendingRequestDraft() {
  localStorage.removeItem(PENDING_REQUEST_KEY);
}

export async function analyzeServiceRequest(input: SmartRequestInput, categories: Category[]) {
  const cleanText = input.text.trim();
  if (cleanText.length < 10) throw new Error('Descrivi il problema con almeno 10 caratteri.');
  if (cleanText.length > 1000) throw new Error('Descrizione troppo lunga: massimo 1000 caratteri.');
  if (!categories.length) throw new Error('Categorie non disponibili.');

  const categoryPayload = categories.map(category => ({
    name: category.name,
    slug: category.slug,
  }));

  try {
    const { data, error } = await supabase.functions.invoke<SmartRequestAnalysis>('analyze-service-request', {
      body: {
        text: cleanText,
        city: input.city?.trim() || undefined,
        province: input.province?.trim().toUpperCase() || undefined,
        categories: categoryPayload,
      },
    });

    if (error) throw error;
    if (!data?.suggestedTitle || !data.suggestedCategorySlug) throw new Error('Risposta analisi non valida.');

    return data;
  } catch {
    return analyzeServiceRequestFallback({ ...input, text: cleanText }, categories);
  }
}
