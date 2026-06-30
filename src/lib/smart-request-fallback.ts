import type { Category } from './supabase/types';
import type { SmartRequestAnalysis, SmartRequestInput } from './smart-request';

type Rule = {
  slugHints: string[];
  keywords: string[];
  title: string;
  urgency: SmartRequestAnalysis['suggestedUrgency'];
};

const rules: Rule[] = [
  {
    slugHints: ['idraulico', 'idraulica'],
    keywords: ['tubo', 'perdita', 'acqua', 'rubinetto', 'scarico', 'lavandino', 'allagamento', 'cucina'],
    title: 'Perdita o problema idraulico',
    urgency: 'urgente',
  },
  {
    slugHints: ['elettricista', 'elettrico'],
    keywords: ['corrente', 'luce', 'elettric', 'salvavita', 'presa', 'scintille', 'blackout'],
    title: 'Problema elettrico in casa',
    urgency: 'oggi',
  },
  {
    slugHints: ['fabbro', 'serratura'],
    keywords: ['porta', 'serratura', 'chiave', 'bloccata', 'fuori casa', 'serratura'],
    title: 'Porta o serratura bloccata',
    urgency: 'urgente',
  },
  {
    slugHints: ['climatizzatori', 'condizionatore', 'clima'],
    keywords: ['condizionatore', 'climatizzatore', 'split', 'perde acqua'],
    title: 'Assistenza condizionatore',
    urgency: 'oggi',
  },
  {
    slugHints: ['caldaia', 'termoidraulico'],
    keywords: ['caldaia', 'termosifone', 'riscaldamento', 'errore caldaia'],
    title: 'Assistenza caldaia',
    urgency: 'oggi',
  },
  {
    slugHints: ['imbianchino', 'pittore', 'tinteggiatura'],
    keywords: ['tinteggiare', 'imbiancare', 'pittura', 'pareti', 'verniciare'],
    title: 'Tinteggiatura casa',
    urgency: 'questa_settimana',
  },
  {
    slugHints: ['giardiniere', 'giardinaggio'],
    keywords: ['giardino', 'siepe', 'prato', 'potare', 'giardiniere'],
    title: 'Intervento di giardinaggio',
    urgency: 'questa_settimana',
  },
];

function findCategory(categories: Category[], rule?: Rule) {
  if (!rule) return categories[0] ?? null;
  return categories.find(category => {
    const haystack = `${category.slug} ${category.name}`.toLowerCase();
    return rule.slugHints.some(hint => haystack.includes(hint));
  }) ?? categories[0] ?? null;
}

export function analyzeServiceRequestFallback(input: SmartRequestInput, categories: Category[]): SmartRequestAnalysis {
  const text = input.text.trim();
  const normalized = text.toLowerCase();
  const rule = rules.find(item => item.keywords.some(keyword => normalized.includes(keyword)));
  const category = findCategory(categories, rule);
  const matchedKeywords = rule?.keywords.filter(keyword => normalized.includes(keyword)).slice(0, 6) ?? [];
  const confidence = rule && category ? 0.62 : 0.35;

  return {
    suggestedCategorySlug: category?.slug ?? '',
    suggestedTitle: rule?.title ?? text.slice(0, 80),
    suggestedDescription: `Il cliente segnala: ${text}`,
    suggestedUrgency: rule?.urgency ?? 'non_urgente',
    confidence,
    matchedKeywords,
    needsManualReview: confidence < 0.6,
    source: 'fallback',
  };
}
