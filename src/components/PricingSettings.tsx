import React, { useEffect, useState } from 'react';
import { BadgeEuro, Check } from 'lucide-react';
import { Button, Card, Input, Select } from './UI';
import { supabase } from '../lib/supabase/client';
import type { PricingMode, UserRole } from '../lib/supabase/types';

export const PricingSettings = ({ userId, role }: { userId: string; role: Extract<UserRole, 'professional' | 'company'> }) => {
  const table = role === 'professional' ? 'professional_profiles' : 'company_profiles';
  const [mode, setMode] = useState<PricingMode>('negotiable');
  const [rate, setRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const { data, error: loadError } = await supabase.from(table).select('pricing_mode,hourly_rate').eq('user_id', userId).single();
        if (loadError) throw loadError;
        setMode((data.pricing_mode ?? 'negotiable') as PricingMode);
        setRate(data.hourly_rate == null ? '' : String(data.hourly_rate));
      } catch (err: any) { setError(err.message); }
    })();
  }, [table, userId]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    const numericRate = Number(rate.replace(',', '.'));
    if (mode === 'hourly' && (!Number.isFinite(numericRate) || numericRate <= 0)) {
      return setError('Inserisci un costo orario maggiore di zero.');
    }
    setSaving(true);
    const { error: saveError } = await supabase.from(table).update({
      pricing_mode: mode,
      hourly_rate: mode === 'hourly' ? numericRate : null,
      currency: 'EUR',
    }).eq('user_id', userId);
    setSaving(false);
    if (saveError) return setError(saveError.message);
    setNotice('Tariffe aggiornate.');
  };

  return <Card hoverEffect={false} className="p-6 md:p-8">
    <div className="mb-5 flex items-start gap-3"><span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><BadgeEuro size={21}/></span><div><h2 className="text-lg font-black">Tariffe</h2><p className="mt-1 text-sm text-zinc-500">Indica come preferisci concordare il prezzo dei servizi.</p></div></div>
    <form onSubmit={save} className="space-y-4">
      {error&&<p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {notice&&<p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{notice}</p>}
      <Select label="Modalità prezzo" value={mode} onChange={event=>setMode(event.target.value as PricingMode)} options={[{value:'negotiable',label:'Da concordare'},{value:'hourly',label:'Costo orario'}]}/>
      {mode === 'hourly' ? <Input label="Costo orario (€ / ora)" type="number" min="0.01" step="0.01" value={rate} onChange={event=>setRate(event.target.value)} placeholder="Es. 25,00" required/> : <p className="rounded-2xl bg-zinc-50 p-4 text-sm font-semibold text-zinc-600">Prezzo da concordare con il cliente</p>}
      <p className="text-xs leading-relaxed text-zinc-400">La tariffa è indicativa e può variare in base al tipo di intervento.</p>
      <Button disabled={saving}>{saving?'Salvataggio…':<><Check size={16}/> Salva tariffe</>}</Button>
    </form>
  </Card>;
};
