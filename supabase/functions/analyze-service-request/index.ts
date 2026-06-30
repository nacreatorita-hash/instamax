// Supabase Edge Function: analyze-service-request
// Secrets required:
//   supabase secrets set GEMINI_API_KEY=...

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type InputCategory = { name: string; slug: string };

type RequestPayload = {
  text?: unknown;
  city?: unknown;
  province?: unknown;
  categories?: unknown;
};

type AnalysisResult = {
  suggestedCategorySlug: string;
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedUrgency: 'urgente' | 'oggi' | 'entro_domani' | 'questa_settimana' | 'non_urgente';
  confidence: number;
  matchedKeywords: string[];
  needsManualReview: boolean;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const allowedUrgencies = ['urgente', 'oggi', 'entro_domani', 'questa_settimana', 'non_urgente'] as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sanitizeString(value: unknown, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function parseCategories(value: unknown): InputCategory[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => ({
      name: sanitizeString((item as Record<string, unknown>)?.name, 80),
      slug: sanitizeString((item as Record<string, unknown>)?.slug, 80),
    }))
    .filter(item => item.name && item.slug)
    .slice(0, 80);
}

function safeFallback(text: string, categories: InputCategory[]): AnalysisResult {
  const normalized = text.toLowerCase();
  const keywordRules: Array<{ slugHints: string[]; keywords: string[]; title: string; urgency: AnalysisResult['suggestedUrgency'] }> = [
    { slugHints: ['idraulico', 'idraulica'], keywords: ['tubo', 'perdita', 'acqua', 'lavandino', 'scarico', 'rubinetto', 'allagamento'], title: 'Problema idraulico da risolvere', urgency: normalized.includes('allag') || normalized.includes('perdita') ? 'urgente' : 'oggi' },
    { slugHints: ['elettricista', 'elettrico'], keywords: ['corrente', 'luce', 'elettric', 'salvavita', 'presa', 'scintille'], title: 'Problema elettrico in casa', urgency: normalized.includes('scint') ? 'urgente' : 'oggi' },
    { slugHints: ['fabbro', 'serratura'], keywords: ['porta', 'serratura', 'chiave', 'bloccata', 'fuori casa'], title: 'Porta o serratura bloccata', urgency: normalized.includes('fuori') || normalized.includes('blocc') ? 'urgente' : 'oggi' },
    { slugHints: ['climatizzatori', 'condizionatore', 'clima'], keywords: ['condizionatore', 'climatizzatore', 'split', 'perde acqua'], title: 'Assistenza condizionatore', urgency: 'oggi' },
    { slugHints: ['caldaia', 'termoidraulico'], keywords: ['caldaia', 'termosifone', 'riscaldamento'], title: 'Assistenza caldaia o riscaldamento', urgency: 'oggi' },
    { slugHints: ['imbianchino', 'pittore', 'tinteggiatura'], keywords: ['tinteggiare', 'imbiancare', 'pittura', 'pareti'], title: 'Tinteggiatura casa', urgency: 'questa_settimana' },
    { slugHints: ['giardiniere', 'giardinaggio'], keywords: ['giardino', 'siepe', 'prato', 'potare'], title: 'Intervento di giardinaggio', urgency: 'questa_settimana' },
  ];

  const matchedRule = keywordRules.find(rule => rule.keywords.some(keyword => normalized.includes(keyword)));
  const category = matchedRule
    ? categories.find(item => matchedRule.slugHints.some(hint => item.slug.includes(hint) || item.name.toLowerCase().includes(hint)))
    : null;
  const fallbackCategory = category ?? categories[0] ?? { slug: '', name: 'Servizio' };
  const keywords = matchedRule?.keywords.filter(keyword => normalized.includes(keyword)).slice(0, 5) ?? [];

  return {
    suggestedCategorySlug: fallbackCategory.slug,
    suggestedTitle: matchedRule?.title ?? text.slice(0, 70),
    suggestedDescription: `Il cliente segnala: ${text}`,
    suggestedUrgency: matchedRule?.urgency ?? 'non_urgente',
    confidence: matchedRule && category ? 0.62 : 0.35,
    matchedKeywords: keywords,
    needsManualReview: !matchedRule || !category,
  };
}

function normalizeResult(value: Record<string, unknown>, categories: InputCategory[], text: string): AnalysisResult {
  const categorySlugs = new Set(categories.map(item => item.slug));
  const fallback = safeFallback(text, categories);
  const categorySlug = sanitizeString(value.suggestedCategorySlug, 80);
  const urgency = allowedUrgencies.includes(value.suggestedUrgency as any)
    ? value.suggestedUrgency as AnalysisResult['suggestedUrgency']
    : fallback.suggestedUrgency;
  const confidence = Math.max(0, Math.min(1, Number(value.confidence) || fallback.confidence));

  return {
    suggestedCategorySlug: categorySlugs.has(categorySlug) ? categorySlug : fallback.suggestedCategorySlug,
    suggestedTitle: sanitizeString(value.suggestedTitle, 100) || fallback.suggestedTitle,
    suggestedDescription: sanitizeString(value.suggestedDescription, 700) || fallback.suggestedDescription,
    suggestedUrgency: urgency,
    confidence,
    matchedKeywords: Array.isArray(value.matchedKeywords)
      ? value.matchedKeywords.map(item => sanitizeString(item, 30)).filter(Boolean).slice(0, 8)
      : fallback.matchedKeywords,
    needsManualReview: Boolean(value.needsManualReview) || confidence < 0.6 || !categorySlugs.has(categorySlug),
  };
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Metodo non consentito.' }, 405);

  try {
    const payload = await request.json() as RequestPayload;
    const text = sanitizeString(payload.text, 1000);
    const city = sanitizeString(payload.city, 80);
    const province = sanitizeString(payload.province, 8).toUpperCase();
    const categories = parseCategories(payload.categories);

    if (text.length < 10) return jsonResponse({ error: 'Descrivi il problema con almeno 10 caratteri.' }, 400);
    if (!categories.length) return jsonResponse({ error: 'Nessuna categoria disponibile.' }, 400);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return jsonResponse({ ...safeFallback(text, categories), source: 'fallback' });
    }

    const prompt = `Sei un classificatore per una piattaforma italiana chiamata instaMax.
Devi trasformare una descrizione libera di un problema domestico o professionale in una richiesta strutturata.

Categorie disponibili, usa solo una di queste:
${categories.map(item => `- ${item.name} (${item.slug})`).join('\n')}

Comune/provincia eventualmente dichiarati dall'utente:
${city ? `${city}${province ? ` (${province})` : ''}` : 'non indicati'}

Testo problema:
${text}

Regole:
- Non inventare categorie.
- Non inventare dati personali.
- Non chiedere posizione precisa.
- Non dare consigli tecnici pericolosi.
- Non scrivere testo lungo.
- Rispondi solo in JSON valido.
- Non usare markdown.
- Non aggiungere spiegazioni fuori dal JSON.

Schema JSON obbligatorio:
{
  "suggestedCategorySlug": string,
  "suggestedTitle": string,
  "suggestedDescription": string,
  "suggestedUrgency": "urgente" | "oggi" | "entro_domani" | "questa_settimana" | "non_urgente",
  "confidence": number,
  "matchedKeywords": string[],
  "needsManualReview": boolean
}

Criteri urgenza:
- perdita acqua forte, allagamento, scintille, porta bloccata con persona fuori, emergenza: urgente
- problema da risolvere in giornata: oggi
- problema entro breve: entro_domani
- lavoro programmabile: questa_settimana
- richiesta generica o non urgente: non_urgente`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      return jsonResponse({ ...safeFallback(text, categories), source: 'fallback' });
    }

    const geminiJson = await geminiResponse.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof rawText !== 'string') {
      return jsonResponse({ ...safeFallback(text, categories), source: 'fallback' });
    }

    try {
      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      return jsonResponse({ ...normalizeResult(parsed, categories, text), source: 'gemini' });
    } catch {
      return jsonResponse({ ...safeFallback(text, categories), source: 'fallback' });
    }
  } catch {
    return jsonResponse({ error: 'Analisi non disponibile.' }, 500);
  }
});
