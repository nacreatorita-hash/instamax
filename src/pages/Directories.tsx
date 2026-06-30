import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import { ProfessionalCard, CandidateCard } from '../components/Cards';
import { Card } from '../components/UI';
import { CITIES } from '../data';

// === PROFESSIONALS DIRECTORY ===
export const ProfessionalsDirectory: React.FC = () => {
  const { professionals } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  const filtered = professionals.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCity = selectedCity === 'all' || p.location === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="select-none min-h-screen bg-zinc-50/50 pb-24 md:pb-12">
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-100 px-6 py-5 sticky top-0 z-20">
        <h1 className="text-xl font-extrabold text-zinc-950 tracking-tight">Cerca Professionisti & Artigiani</h1>
        <p className="text-xs text-zinc-400 font-semibold mt-0.5">Sfoglia specialisti pronti a intervenire per le tue necessità</p>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filters Panel */}
        <div className="bg-white p-4 rounded-3xl border border-zinc-100 flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-3 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Cerca per nome, qualifica o skill (es. Idraulico, Caldaie)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-100 focus:border-zinc-900 rounded-2xl focus:outline-none focus:bg-white transition-all"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-100 focus:border-zinc-900 rounded-2xl focus:outline-none focus:bg-white font-medium cursor-pointer"
            >
              <option value="all">Tutte le Città</option>
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Output */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-zinc-100 p-8 max-w-md mx-auto">
            <AlertCircle size={32} className="mx-auto text-zinc-400 mb-3" />
            <h3 className="font-bold text-zinc-900 text-sm">Nessun professionista trovato</h3>
            <p className="text-xs text-zinc-400 mt-1">Nessun profilo soddisfa i tuoi criteri di ricerca in questo momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <ProfessionalCard key={p.id} professional={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// === CANDIDATES DIRECTORY ===
export const CandidatesDirectory: React.FC = () => {
  const { candidates } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  const filtered = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.desiredRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCity = selectedCity === 'all' || c.location === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="select-none min-h-screen bg-zinc-50/50 pb-24 md:pb-12">
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-100 px-6 py-5 sticky top-0 z-20">
        <h1 className="text-xl font-extrabold text-zinc-950 tracking-tight">Cerca Candidati e Profili</h1>
        <p className="text-xs text-zinc-400 font-semibold mt-0.5">Trova talenti eccezionali con le competenze adatte alla tua azienda</p>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-zinc-100 flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-3 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Cerca per nome, ruolo desiderato o tecnologia (es. Figma, React)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-100 focus:border-zinc-900 rounded-2xl focus:outline-none focus:bg-white transition-all"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-100 focus:border-zinc-900 rounded-2xl focus:outline-none focus:bg-white font-medium cursor-pointer"
            >
              <option value="all">Tutte le Città</option>
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Output Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-zinc-100 p-8 max-w-md mx-auto">
            <AlertCircle size={32} className="mx-auto text-zinc-400 mb-3" />
            <h3 className="font-bold text-zinc-900 text-sm">Nessun candidato trovato</h3>
            <p className="text-xs text-zinc-400 mt-1">La ricerca non ha prodotto risultati. Modifica i parametri inseriti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(c => (
              <CandidateCard key={c.id} candidate={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
