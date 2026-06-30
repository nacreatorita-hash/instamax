import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../lib/auth/useAuth';
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Check, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldAlert, 
  Database, 
  Key, 
  BellRing,
  HelpCircle,
  LogOut,
  CreditCard
} from 'lucide-react';
import { Button, Input, Select, Textarea, Card, Avatar, Badge } from '../components/UI';
import { ProfessionalSetup } from '../components/ProfessionalSetup';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { CandidateSetup } from '../components/CandidateSetup';
import { APP_ROUTES, navigateTo } from '../lib/navigation';

// === USER PROFILE VIEW ===
export const Profile: React.FC = () => {
  const { user, profile, updateUserProfile } = useAuth();
  const { activeRole, profiles, updateProfile: syncAppProfile } = useApp();
  
  // Fallback to offline / Milestone 1 profile if Supabase is not connected/signed in
  const currentProfile = profile ? {
    name: profile.full_name,
    email: profile.email,
    phone: profile.phone || '',
    location: profile.city && profile.province ? `${profile.city} (${profile.province})` : '',
    city: profile.city || '',
    province: profile.province || '',
    bio: '',
    avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    skills: [] as string[],
    hourlyRate: undefined as number | undefined,
    companyName: ''
  } : {
    name: profiles[activeRole]?.name || 'Utente Ospite',
    email: profiles[activeRole]?.email || 'ospite@instamax.it',
    phone: profiles[activeRole]?.phone || '',
    location: profiles[activeRole]?.location || 'Salerno',
    city: profiles[activeRole]?.location?.split('(')[0]?.trim() || 'Salerno',
    province: 'SA',
    bio: profiles[activeRole]?.bio || '',
    avatar: profiles[activeRole]?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    skills: profiles[activeRole]?.skills || [],
    hourlyRate: profiles[activeRole]?.hourlyRate,
    companyName: profiles[activeRole]?.companyName || ''
  };

  const [name, setName] = useState(currentProfile.name);
  const [email, setEmail] = useState(currentProfile.email);
  const [phone, setPhone] = useState(currentProfile.phone);
  const [city, setCity] = useState(currentProfile.city);
  const [province, setProvince] = useState(currentProfile.province);
  const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatar);
  const [bio, setBio] = useState(currentProfile.bio);
  
  const [skillsStr, setSkillsStr] = useState(currentProfile.skills ? currentProfile.skills.join(', ') : '');
  const [hourlyRate, setHourlyRate] = useState(currentProfile.hourlyRate ? currentProfile.hourlyRate.toString() : '');
  const [companyName, setCompanyName] = useState(currentProfile.companyName || '');

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if profile loads dynamically
  useEffect(() => {
    if (profile) {
      setName(profile.full_name);
      setEmail(profile.email);
      setPhone(profile.phone || '');
      setCity(profile.city || '');
      setProvince(profile.province || '');
      setAvatarUrl(profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSaved(false);
    
    try {
      if (user && profile) {
        // Save to Supabase real Database
        await updateUserProfile({
          full_name: name,
          phone: phone || null,
          city: city || null,
          province: province || null,
          avatar_url: avatarUrl || null
        });

        // Sync with local state
        syncAppProfile(profile.role, {
          name,
          email,
          phone,
          location: city ? `${city} (${province})` : '',
          avatar: avatarUrl
        });
      } else {
        // Fallback for demo sandbox mode
        const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(s => s !== '') : undefined;
        const rate = hourlyRate ? parseFloat(hourlyRate) : undefined;

        syncAppProfile(activeRole, {
          name,
          email,
          phone,
          bio,
          location: city ? `${city} (${province})` : 'Salerno',
          skills,
          hourlyRate: rate,
          companyName: companyName || undefined,
          avatar: avatarUrl
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Errore durante il salvataggio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="select-none min-h-screen bg-transparent pb-24 md:pb-12">
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-100 px-6 py-5 sticky top-0 z-20 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-950 tracking-tight font-display">Il mio profilo</h1>
          <p className="text-xs text-zinc-400 font-semibold mt-0.5">Gestisci le informazioni del tuo profilo attivo</p>
        </div>
        {saved && (
          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1.5 animate-fade-in">
            <Check size={14} /> Salvato
          </span>
        )}
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-semibold">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <RoleSwitcher />

        {/* Profile Card Summary */}
        <Card className="p-6 border border-zinc-100/80 bg-white flex flex-col sm:flex-row items-center gap-5">
          <Avatar src={avatarUrl} name={name} size="xl" />
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-lg font-black text-zinc-950 font-display">{name}</h2>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
              Ruolo: {profile ? (
                profile.role === 'client' ? 'Cliente' : profile.role === 'professional' ? 'Professionista' : profile.role === 'company' ? 'Azienda' : 'Candidato'
              ) : (
                activeRole === 'client' ? 'Cliente' : activeRole === 'professional' ? 'Professionista' : activeRole === 'company' ? 'Azienda' : 'Candidato'
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 pt-2 text-xs text-zinc-500 font-medium">
              {(city || province) && (
                <span className="flex items-center gap-1"><MapPin size={12} /> {city} {province && `(${province})`}</span>
              )}
              {phone && <span className="flex items-center gap-1"><Phone size={12} /> {phone}</span>}
              <span className="flex items-center gap-1"><Mail size={12} /> {email}</span>
            </div>
          </div>
        </Card>

        {/* Form Details */}
        <Card className="p-8 border border-zinc-100/80 bg-white">
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-4">Informazioni personali</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome e Cognome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
              <Input
                label="Indirizzo Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                disabled={true} // Email non modificabile direttamente per sicurezza
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Numero di Telefono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Città"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={loading}
                />
                <Input
                  label="Provincia"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  required
                  maxLength={2}
                  disabled={loading}
                />
              </div>
            </div>

            <Input
              label="URL Avatar (Link Immagine)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Inserisci link URL immagine"
              disabled={loading}
            />

            {!profile && activeRole === 'company' && (
              <Input
                label="Nome dell'Azienda"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
              />
            )}

            {!profile && activeRole === 'professional' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100/50">
                <Input
                  label="Tariffa Oraria Media (€/h)"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  type="number"
                  disabled={loading}
                />
                <Input
                  label="Le tue specializzazioni (Separate da virgola)"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="es. Idraulico, Caldaie, Climatizzatori"
                  disabled={loading}
                />
              </div>
            )}

            {!profile && activeRole === 'candidate' && (
              <div className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100/50">
                <Input
                  label="Competenze Tecniche (Separate da virgola)"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="es. React, Figma, Tailwind, Copywriting"
                  disabled={loading}
                />
              </div>
            )}

            {!profile && (
              <Textarea
                label="Biografia / Presentazione pubblica"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
                disabled={loading}
              />
            )}

            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <Button type="submit" variant="primary" className="font-bold py-3 flex items-center gap-2" disabled={loading}>
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Salva Modifiche
              </Button>
            </div>
          </form>
        </Card>
        {profile?.role === 'professional' && user && <ProfessionalSetup userId={user.id} />}
        {profile?.role === 'candidate' && user && <CandidateSetup userId={user.id} />}
      </div>
    </div>
  );
};

// === SETTINGS VIEW ===
export const Settings: React.FC = () => {
  const { user, profile, subscription, signOut } = useAuth();
  const { activeRole } = useApp();
  const navigate = useNavigate();

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true);

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigateTo(navigate, APP_ROUTES.login);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'client': return 'Cliente';
      case 'professional': return 'Professionista / Artigiano';
      case 'company': return 'Azienda';
      case 'candidate': return 'Candidato (Cerco lavoro)';
      default: return r;
    }
  };

  return (
    <div className="select-none min-h-screen bg-transparent pb-24 md:pb-12">
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-100 px-6 py-5 sticky top-0 z-20 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-950 tracking-tight font-display">Impostazioni</h1>
          <p className="text-xs text-zinc-400 font-semibold mt-0.5">Configura le preferenze del tuo account</p>
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Account Info Details */}
        <Card className="p-6 border border-zinc-100/80 bg-white">
          <h3 className="text-sm font-extrabold text-zinc-950 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4 font-display">
            <UserIcon size={18} className="text-blue-600" /> Informazioni Account
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-zinc-50">
              <span className="font-semibold text-zinc-500">Stato Autenticazione</span>
              <span className={`font-bold text-xs px-2.5 py-1 rounded-full ${user ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {user ? 'Collegato con Supabase' : 'Sessione Locale Demo'}
              </span>
            </div>

            {user && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-zinc-50">
                  <span className="font-semibold text-zinc-500">ID Utente (UID)</span>
                  <span className="font-mono text-xs text-zinc-400 break-all">{user.id}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-zinc-50">
                  <span className="font-semibold text-zinc-500">Indirizzo Email</span>
                  <span className="font-medium text-zinc-800">{user.email}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-zinc-50">
                  <span className="font-semibold text-zinc-500">Ruolo Abilitato</span>
                  <span className="font-bold text-zinc-800">{getRoleLabel(profile?.role || activeRole)}</span>
                </div>
              </>
            )}

            {/* Subscription Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
              <span className="font-semibold text-zinc-500 flex items-center gap-1.5"><CreditCard size={15} /> Piano di abbonamento</span>
              <div className="flex items-center gap-2 mt-1 sm:mt-0">
                <span className="font-black text-xs uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                  {subscription ? subscription.plan : 'free'}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">
                  (Stato: {subscription ? subscription.status : 'Attivo'})
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications config */}
        <Card className="p-6 border border-zinc-100/80 bg-white">
          <h3 className="text-sm font-extrabold text-zinc-950 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4 font-display">
            <BellRing size={18} className="text-zinc-600" /> Notifiche & Comunicazioni
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-800">Notifiche Email</h4>
                <p className="text-[11px] text-zinc-400">Ricevi notifiche di preventivi o contatti via email.</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifyEmail} 
                onChange={() => setNotifyEmail(!notifyEmail)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-800">Notifiche SMS</h4>
                <p className="text-[11px] text-zinc-400">Notifiche urgenti di pronto intervento via cellulare.</p>
              </div>
              <input 
                type="checkbox" 
                checked={notifySms} 
                onChange={() => setNotifySms(!notifySms)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
              />
            </div>
          </div>
        </Card>

        {/* Privacy config */}
        <Card className="p-6 border border-zinc-100/80 bg-white">
          <h3 className="text-sm font-extrabold text-zinc-950 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4 font-display">
            <ShieldAlert size={18} className="text-zinc-600" /> Privacy & Trasparenza
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-zinc-800">Profilo pubblico indicizzabile</h4>
              <p className="text-[11px] text-zinc-400">Permetti ai motori di ricerca esterni di indicizzare il tuo profilo instaMax.</p>
            </div>
            <input 
              type="checkbox" 
              checked={profilePublic} 
              onChange={() => setProfilePublic(!profilePublic)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
            />
          </div>
        </Card>

        {/* Database & Supabase Architecture Status */}
        <Card className="p-6 border border-zinc-100/80 bg-white space-y-4">
          <h3 className="text-sm font-extrabold text-zinc-950 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3 font-display">
            <Database size={18} className="text-emerald-600" /> Architettura del Database Supabase (Attiva)
          </h3>

          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
            L'integrazione di <strong>Supabase (PostgreSQL)</strong> è attiva! Il sistema gestisce in tempo reale le politiche di sicurezza <strong>Row Level Security (RLS)</strong>, la crittografia delle credenziali utenti ed i profili separati per cliente, professionista, azienda e candidato.
          </p>

          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex flex-col gap-2">
            <div className="flex items-start gap-2.5 text-xs text-zinc-700">
              <Key size={14} className="text-zinc-400 mt-0.5" />
              <div>
                <p className="font-bold text-zinc-800">Controllo d'accesso granulare</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  I profili professionali, aziendali e di candidatura sono legati ad una policy RLS che ne limita la scrittura al solo proprietario del record, garantendo riservatezza assoluta.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Logout Control */}
        <div className="pt-4 flex justify-center">
          <Button 
            onClick={handleLogout} 
            variant="danger" 
            className="w-full sm:w-auto px-10 py-3.5 font-bold flex items-center justify-center gap-2 rounded-2xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700 transition-all shadow-none hover:shadow-lg hover:shadow-red-500/10"
            disabled={loggingOut}
          >
            {loggingOut ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <LogOut size={16} />
            )}
            Disconnetti Account (Logout)
          </Button>
        </div>
      </div>
    </div>
  );
};
