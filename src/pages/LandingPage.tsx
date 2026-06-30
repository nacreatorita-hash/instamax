import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  Zap, 
  Paintbrush, 
  Leaf, 
  Sparkles, 
  Hammer, 
  Code, 
  Palette, 
  Headphones, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  CheckCircle, 
  MapPin, 
  Lock 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Card } from '../components/UI';
import { SmartRequestAssistant } from '../components/SmartRequestAssistant';
import { CATEGORIES, CITIES } from '../data';
import { supabase } from '../lib/supabase/client';
import type { Category } from '../lib/supabase/types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveRole } = useApp();
  const [smartCategories, setSmartCategories] = useState<Category[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const result = await supabase.from('categories').select('*').eq('active', true).order('name');
        if (result.error) throw result.error;
        setSmartCategories((result.data ?? []) as Category[]);
      } catch (error) {
        console.warn('Categorie smart request non disponibili:', error);
      }
    })();
  }, []);

  const handleRoleAction = (role: 'client' | 'professional' | 'company' | 'candidate', targetPath: string) => {
    setActiveRole(role);
    navigate(targetPath);
  };

  // Icon mapping helper
  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, React.FC<any>> = {
      Wrench, Zap, Paintbrush, Leaf, Sparkles, Hammer, Code, Palette, Headphones, TrendingUp
    };
    const IconComponent = icons[iconName] || Wrench;
    return <IconComponent size={24} className="text-zinc-900" />;
  };

  return (
    <div className="min-h-screen bg-white select-none pb-20 md:pb-0">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-zinc-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 italic">instaMax</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="font-semibold text-xs">
              Accedi
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/register')} className="font-bold text-xs">
              Registrati
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="px-6 py-16 md:py-24 bg-gradient-to-b from-zinc-50/50 to-white border-b border-zinc-50">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <Badge text="AI Request Assistant" />
          <h1 className="text-4xl md:text-6xl font-extrabold text-zinc-900 tracking-tight leading-tight mt-6 mb-4 max-w-3xl">
            Trova subito<br />
            <span className="text-blue-600">il professionista giusto.</span>
          </h1>
          <p className="text-base md:text-lg text-zinc-500 mt-2 max-w-xl leading-relaxed font-medium">
            Scrivi il problema, instaMax capisce di cosa hai bisogno e avvisa i professionisti della tua zona.
          </p>

          <div className="mt-10 w-full">
            <SmartRequestAssistant categories={smartCategories} />
          </div>

          {/* Core Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 w-full max-w-6xl px-2">
            <Card 
              onClick={() => handleRoleAction('client', '/requests/new')}
              className="group cursor-pointer p-8 bg-white border border-zinc-100 rounded-[2.25rem] shadow-xl shadow-zinc-200/50 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between h-64 text-left"
            >
              <div>
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <svg className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-950">Cerco un Pro</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Riparazioni, lezioni, design o pulizie in pochi click per casa o ufficio.</p>
              </div>
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform mt-4">
                Inizia ora <ArrowRight size={12} />
              </span>
            </Card>

            <Card 
              onClick={() => handleRoleAction('professional', '/dashboard')}
              className="group cursor-pointer p-8 bg-white border border-zinc-100 rounded-[2.25rem] shadow-xl shadow-zinc-200/50 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between h-64 text-left"
            >
              <div>
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors duration-300">
                  <svg className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-950">Offro Servizi</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Trova nuovi clienti nella tua zona e incrementa i tuoi guadagni.</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform mt-4">
                Trova lavoro <ArrowRight size={12} />
              </span>
            </Card>

            <Card 
              onClick={() => handleRoleAction('candidate', '/jobs')}
              className="group cursor-pointer p-8 bg-white border border-zinc-100 rounded-[2.25rem] shadow-xl shadow-zinc-200/50 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between h-64 text-left"
            >
              <div>
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors duration-300">
                  <svg className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-950">Cerco Lavoro</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Candidati alle opportunità pubblicate per svariati profili d'impiego.</p>
              </div>
              <span className="text-xs font-bold text-purple-600 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform mt-4">
                Sfoglia annunci <ArrowRight size={12} />
              </span>
            </Card>

            <Card 
              onClick={() => handleRoleAction('company', '/jobs/new')}
              className="group cursor-pointer p-8 bg-white border border-zinc-100 rounded-[2.25rem] shadow-xl shadow-zinc-200/50 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between h-64 text-left"
            >
              <div>
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-600 transition-colors duration-300">
                  <svg className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-950">Cerco Staff</h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Pubblica posizioni aziendali aperte e seleziona i migliori candidati.</p>
              </div>
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform mt-4">
                Pubblica annuncio <ArrowRight size={12} />
              </span>
            </Card>
          </div>
        </div>
      </section>

      {/* COME FUNZIONA SECTION */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Il Processo</span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-zinc-950 mt-2 tracking-tight">Come funziona instaMax?</h2>
          <p className="text-sm text-zinc-500 mt-2">Pochi passi, massima trasparenza e zero pensieri.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-14 w-14 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
              <span className="text-zinc-900 font-black text-lg">1</span>
            </div>
            <h3 className="text-base font-bold text-zinc-950">Pubblica una richiesta o annuncio</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed max-w-xs">
              Descrivi l\'intervento idraulico, il lavoro da fare, o la posizione aperta inserendo dettagli e budget indicativo.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="h-14 w-14 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
              <span className="text-zinc-900 font-black text-lg">2</span>
            </div>
            <h3 className="text-base font-bold text-zinc-950">Confronta profili e preventivi</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed max-w-xs">
              Ricevi proposte e messaggi in tempo reale. Leggi le recensioni storiche degli utenti per scegliere in totale sicurezza.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="h-14 w-14 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
              <span className="text-zinc-900 font-black text-lg">3</span>
            </div>
            <h3 className="text-base font-bold text-zinc-950">Esegui e paga sul sicuro</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed max-w-xs">
              Chatta direttamente, concorda l\'intervento e paga in totale tranquillità. Rilascia una valutazione a lavoro concluso.
            </p>
          </div>
        </div>
      </section>

      {/* CATEGORIE MESTIERI */}
      <section className="px-6 py-16 bg-zinc-50 border-y border-zinc-100/60">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Esplora</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-950 mt-1 tracking-tight">Categorie popolari</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleRoleAction('client', '/requests')}
              className="text-xs font-semibold whitespace-nowrap"
            >
              Vedi tutto
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
            {CATEGORIES.map((cat) => (
              <div 
                key={cat.id} 
                onClick={() => handleRoleAction('client', '/requests')}
                className="bg-white border border-zinc-100 rounded-3xl p-6 text-left cursor-pointer group shadow-lg shadow-zinc-200/20 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <div className="h-12 w-12 bg-zinc-50 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-50 transition-all duration-300 mb-4">
                  <div className="text-zinc-700 group-hover:text-blue-600 transition-colors">
                    {getCategoryIcon(cat.icon)}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-zinc-950">{cat.name}</h4>
                <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wide">{cat.count} Annunci</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VANTAGGI & PRIVACY/SICUREZZA */}
      <section className="px-6 py-16 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Sicurezza & Garanzie</span>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-950 mt-2 tracking-tight leading-tight">
            La tua tranquillità è il nostro impegno primario
          </h2>
          <p className="text-sm text-zinc-600 mt-4 leading-relaxed font-medium">
            Tutti i professionisti su instaMax affrontano controlli di sicurezza, verifica di certificazioni legali e recensioni autentiche scritte dai clienti reali.
          </p>

          <div className="flex flex-col gap-4 mt-8">
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-950">Profili Verificati</h4>
                <p className="text-xs text-zinc-500 mt-1">Dati fiscali, partita IVA e certificati professionali convalidati dal nostro team.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-950">Protezione Privacy e Comunicazioni</h4>
                <p className="text-xs text-zinc-500 mt-1">Scambia messaggi, foto, planimetrie e documenti in modo criptato all\'interno della piattaforma.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-950">Recensioni Certificate</h4>
                <p className="text-xs text-zinc-500 mt-1">Solo chi completa un lavoro reale su instaMax può lasciare una valutazione a fine opera.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits cards layout */}
        <div className="bg-zinc-50/70 border border-zinc-100 rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          <h3 className="text-lg font-extrabold text-zinc-950 tracking-tight">I vantaggi per te</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-zinc-200/40">
              <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wide">Gratuito all\'inizio</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-snug">Nessun costo fisso per iscriversi o pubblicare le proprie esigenze.</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-zinc-200/40">
              <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wide">Sempre con te</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-snug">Layout PWA fluido predisposto per essere installato su iOS e Android.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200/40">
              <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wide">Trasparenza 100%</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-snug">Tratta la tariffa oraria o a corpo direttamente in chat.</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200/40">
              <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wide">Assistenza 24/7</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-snug">Supporto clienti in italiano per guidarti in caso di controversie.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROVINCE / COMUNI SECTION */}
      <section className="px-6 py-16 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Diffusione locale</span>
            <h2 className="text-2xl font-extrabold text-zinc-950 mt-1 tracking-tight">Operativi in tutta Italia</h2>
            <p className="text-xs text-zinc-500 mt-1">Trova professionisti e lavori nelle principali aree metropolitane.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
            {CITIES.map((city) => (
              <span 
                key={city}
                onClick={() => handleRoleAction('client', '/requests')}
                className="px-4 py-2 bg-white hover:bg-zinc-900 hover:text-white transition-all duration-200 rounded-full text-xs font-bold text-zinc-600 border border-zinc-200/60 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <MapPin size={12} className="text-zinc-400" /> {city}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 text-zinc-400 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4 text-white">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-extrabold tracking-tight italic text-white font-display">instaMax</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
              La rivoluzione del lavoro on-demand e del matching professionale. Ispirato al design Apple, ottimizzato per smartphone.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Per gli Utenti</h4>
            <ul className="flex flex-col gap-2.5 text-xs">
              <li><span onClick={() => handleRoleAction('client', '/requests/new')} className="hover:text-white cursor-pointer transition-colors">Richiedi un intervento</span></li>
              <li><span onClick={() => handleRoleAction('professional', '/dashboard')} className="hover:text-white cursor-pointer transition-colors">Iscriviti come artigiano</span></li>
              <li><span onClick={() => handleRoleAction('candidate', '/jobs')} className="hover:text-white cursor-pointer transition-colors">Cerca annunci di lavoro</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Sicurezza & Regolamenti</h4>
            <ul className="flex flex-col gap-2.5 text-xs">
              <li><span className="hover:text-white cursor-pointer transition-colors">Informativa sulla Privacy</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Termini & Condizioni d\'Uso</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Informativa sui Cookie</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4">Milestone 1 Preview</h4>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <p className="text-[10px] text-zinc-400 leading-snug">
                Interfaccia statica responsive. Prossime milestone: Supabase DB, real-time chats, pagamenti e notifiche push native.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-zinc-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px]">
          <span>© 2026 instaMax S.r.l. Tutti i diritti riservati. P.IVA 12345678901.</span>
          <span>Sviluppato con passione per l\'eccellenza digitale.</span>
        </div>
      </footer>
    </div>
  );
};

// Simple badge helper within same file for simplicity
const Badge: React.FC<{ text: string }> = ({ text }) => {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide bg-zinc-100 text-zinc-800 border border-zinc-200/30 uppercase">
      {text}
    </span>
  );
};
