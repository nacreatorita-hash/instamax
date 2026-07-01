import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, LoaderCircle, MapPin, Search, X } from 'lucide-react';
import { loadMunicipalities, normalizeMunicipalitySearch, type Municipality } from '../lib/municipalities';

type Props = {
  value: Municipality | null;
  onChange: (value: Municipality | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
};

export const MunicipalityAutocomplete: React.FC<Props> = ({
  value, onChange, label = 'Comune', placeholder = 'Inizia a scrivere il comune', required, disabled, error,
}) => {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value ? `${value.name} — ${value.provinceName}` : '');
  const [items, setItems] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => setQuery(value ? `${value.name} — ${value.provinceName}` : ''), [value]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const normalizedQuery = normalizeMunicipalitySearch(query.split('—')[0]);
  useEffect(() => {
    if (value || normalizedQuery.length < 2) { setItems([]); setOpen(false); return; }
    let current = true;
    setLoading(true);
    void loadMunicipalities().then(data => {
      if (!current) return;
      const startsWith: Municipality[] = [];
      const includes: Municipality[] = [];
      for (const item of data) {
        const name = normalizeMunicipalitySearch(item.name);
        if (name.startsWith(normalizedQuery)) startsWith.push(item);
        else if (name.includes(normalizedQuery)) includes.push(item);
        if (startsWith.length >= 20) break;
      }
      setItems([...startsWith, ...includes].slice(0, 20));
      setActiveIndex(-1);
      setOpen(true);
    }).finally(() => current && setLoading(false));
    return () => { current = false; };
  }, [normalizedQuery, value]);

  const select = (item: Municipality) => { onChange(item); setQuery(`${item.name} — ${item.provinceName}`); setOpen(false); };
  const invalid = required && !value && query.length > 0;
  const statusText = useMemo(() => loading ? 'Caricamento comuni…' : normalizedQuery.length < 2 ? 'Scrivi almeno 2 caratteri' : items.length ? `${items.length} risultati` : 'Nessun comune trovato', [loading, normalizedQuery.length, items.length]);

  return <div ref={rootRef} className="relative">
    {label && <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">{label}{required ? ' *' : ''}</label>}
    <div className={`flex items-center rounded-2xl border bg-white transition focus-within:ring-2 ${error || invalid ? 'border-red-300 focus-within:ring-red-100' : 'border-zinc-200 focus-within:border-blue-500 focus-within:ring-blue-100'}`}>
      <Search className="ml-4 shrink-0 text-zinc-400" size={17}/>
      <input id={id} value={query} disabled={disabled} autoComplete="off" role="combobox" aria-expanded={open} aria-controls={`${id}-listbox`} aria-autocomplete="list" aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm outline-none disabled:opacity-50" onFocus={() => !value && normalizedQuery.length >= 2 && setOpen(true)} onChange={event => { setQuery(event.target.value); if (value) onChange(null); }} onKeyDown={event => {
        if (!open || !items.length) return;
        if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(index => Math.min(index + 1, items.length - 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)); }
        if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); select(items[activeIndex]); }
        if (event.key === 'Escape') setOpen(false);
      }}/>
      {loading ? <LoaderCircle className="mr-4 animate-spin text-blue-600" size={17}/> : value ? <button type="button" onClick={() => { onChange(null); setQuery(''); }} className="mr-2 rounded-full p-2 text-zinc-400 hover:bg-zinc-100" aria-label="Rimuovi comune"><X size={16}/></button> : <ChevronDown className="mr-4 text-zinc-300" size={17}/>} 
    </div>
    {(error || invalid) && <p className="mt-1.5 text-xs font-semibold text-red-600">{error || 'Seleziona un comune valido dall’elenco.'}</p>}
    {open && <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-2xl"><p className="border-b border-zinc-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400" aria-live="polite">{statusText}</p><ul id={`${id}-listbox`} role="listbox" className="max-h-72 overflow-y-auto py-1">{items.map((item, index) => <li key={item.code} id={`${id}-option-${index}`} role="option" aria-selected={activeIndex === index}><button type="button" onMouseDown={event => event.preventDefault()} onClick={() => select(item)} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${activeIndex === index ? 'bg-blue-50 text-blue-800' : 'hover:bg-zinc-50'}`}><MapPin className="shrink-0 text-blue-600" size={16}/><span className="flex-1"><b>{item.name}</b><span className="text-zinc-500"> — {item.provinceName}</span></span>{value?.code === item.code && <Check size={15}/>}</button></li>)}</ul></div>}
  </div>;
};

export const MunicipalityMultiSelect = ({ values, onChange, label = 'Comuni / zone operative', required, disabled }: {
  values: Municipality[]; onChange: (values: Municipality[]) => void; label?: string; required?: boolean; disabled?: boolean;
}) => {
  const [draft, setDraft] = useState<Municipality | null>(null);
  const add = (item: Municipality | null) => {
    setDraft(null);
    if (item && !values.some(value => value.code === item.code)) onChange([...values, item]);
  };
  return <div className="space-y-3"><MunicipalityAutocomplete value={draft} onChange={add} label={label} required={required && values.length === 0} disabled={disabled} placeholder="Cerca e aggiungi un comune"/>{values.length > 0 && <div className="flex flex-wrap gap-2">{values.map(item => <span key={item.code} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800">{item.name} — {item.provinceName}<button type="button" disabled={disabled} onClick={() => onChange(values.filter(value => value.code !== item.code))} aria-label={`Rimuovi ${item.name}`} className="rounded-full p-0.5 hover:bg-blue-100"><X size={13}/></button></span>)}</div>}</div>;
};
