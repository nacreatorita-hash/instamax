import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../lib/auth/useAuth';
import { getRedirectPath } from '../lib/auth/roleRedirect';
import { PENDING_REQUEST_KEY } from '../lib/smart-request';
import { Button, Input, Select, Textarea, Card } from '../components/UI';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveRole, updateProfile: syncAppProfile } = useApp();
  const { user, profile, loading: authLoading, signIn, signUp, signInWithGoogle } = useAuth();

  const isLogin = location.pathname === '/login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'client' | 'professional' | 'company' | 'candidate'>('client');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [bio, setBio] = useState('');

  // Form error & success states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && profile) {
      setActiveRole(profile.role);
      if (localStorage.getItem(PENDING_REQUEST_KEY) && profile.role === 'client') {
        navigate('/requests/new', { replace: true });
        return;
      }
      navigate(getRedirectPath(profile.role), { replace: true });
    }
  }, [authLoading, user, profile, navigate, setActiveRole]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    // Validation
    if (!email || !password) {
      setErrorMsg('Per favore, inserisci tutti i campi obbligatori.');
      setLoading(false);
      return;
    }
    if (!isLogin && !name) {
      setErrorMsg('Per favore, inserisci il tuo nome completo.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La password deve contenere almeno 6 caratteri.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Authenticate user via Supabase
        const result = await signIn(email, password);
        setSuccessMsg('Accesso effettuato con successo!');
        
        // Retrieve actual profile role to route appropriately
        const userProfile = result.user?.user_metadata?.role || 'client';
        setActiveRole(userProfile);
        
        setTimeout(() => {
          if (localStorage.getItem(PENDING_REQUEST_KEY) && userProfile === 'client') {
            navigate('/requests/new');
            return;
          }
          navigate(getRedirectPath(userProfile));
        }, 1000);
      } else {
        // Sign up via Supabase
        const result = await signUp(email, password, name, role);
        setSuccessMsg(result.session
          ? 'Registrazione completata! Accesso in corso…'
          : 'Account creato. Controlla la tua email per confermare la registrazione.');
        
        // Sync app profile for backward compatibility with Milestone 1 state
        setActiveRole(role);
        syncAppProfile(role, {
          name: name,
          email: email,
          phone: phone || '+39 333 000 0000',
          bio: bio || 'Nuovo utente registrato su instaMax.',
          location: city ? `${city} (${province})` : 'Salerno'
        });

        if (result.session) {
          setTimeout(() => navigate(getRedirectPath(role)), 1200);
        }
      }
    } catch (err: any) {
      console.warn('Authentication request rejected:', err);
      setErrorMsg(err.message || 'Si è verificato un errore durante l\'autenticazione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await signInWithGoogle(isLogin ? undefined : role);
      setSuccessMsg('Reindirizzamento a Google...');
    } catch (err: any) {
      console.warn('Google authentication request rejected:', err);
      setErrorMsg(err.message || 'Impossibile accedere con Google. Riprova.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div 
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 cursor-pointer mb-6"
        >
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 italic font-display">instaMax</span>
        </div>
        
        <h2 className="text-center text-2xl font-black tracking-tight text-zinc-900 font-display">
          {isLogin ? 'Accedi al tuo account' : 'Crea il tuo profilo gratuito'}
        </h2>
        <p className="mt-2 text-center text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Milestone 2 • Collegamento Supabase
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 border border-zinc-100 shadow-2xl bg-white">
          {/* Error and Success Notifications */}
          {errorMsg && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-semibold">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-700 text-xs font-semibold">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <Input
                label="Nome e Cognome"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Mario Rossi"
                disabled={loading}
              />
            )}

            <Input
              label="Indirizzo Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="es. mario.rossi@gmail.com"
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />

            {!isLogin && (
              <Select
                label="Chi sei? (Seleziona Ruolo)"
                value={role}
                onChange={handleRoleChange}
                disabled={loading}
                options={[
                  { value: 'client', label: 'Cerco un professionista (Cliente)' },
                  { value: 'professional', label: 'Sono un professionista / Artigiano' },
                  { value: 'company', label: 'Rappresento un\'azienda (HR)' },
                  { value: 'candidate', label: 'Sto cercando lavoro (Candidato)' }
                ]}
              />
            )}

            {!isLogin && (
              <>
                <Input
                  label="Numero di Telefono"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="es. +39 333 1234567"
                  disabled={loading}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Città"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="es. Salerno"
                    disabled={loading}
                  />
                  <Input
                    label="Provincia"
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="es. SA"
                    maxLength={2}
                    disabled={loading}
                  />
                </div>

                <Textarea
                  label="Breve Bio / Presentazione"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="es. Idraulico abilitato da 10 anni / Sviluppatore appassionato..."
                  disabled={loading}
                />
              </>
            )}

            <Button type="submit" fullWidth className="py-3 font-bold flex items-center justify-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Attendere...</span>
                </>
              ) : (
                isLogin ? 'Accedi ora' : 'Registrati ed entra'
              )}
            </Button>
          </form>

          {/* Separation Divider */}
          <div className="relative my-6 flex py-1.5 items-center">
            <div className="flex-grow border-t border-zinc-100"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Oppure</span>
            <div className="flex-grow border-t border-zinc-100"></div>
          </div>

          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="py-3 flex items-center justify-center gap-2.5 border-zinc-200 hover:bg-zinc-50 font-bold text-zinc-700"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Continua con Google
          </Button>

          <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
            <button
              onClick={() => navigate(isLogin ? '/register' : '/login')}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
              disabled={loading}
            >
              {isLogin ? 'Non hai ancora un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
