# instaMax

> Nota: brand pubblico aggiornato in **instaMax**. Le chiavi tecniche esistenti come `handygo_pending_request` restano invariate per compatibilità.

Dominio pubblico previsto: `instamax.it`.

Il progetto include un workflow GitHub Pages in `.github/workflows/deploy.yml` e `public/CNAME` per collegare il dominio custom.

## Milestone 6 — assistente intelligente richieste con Gemini

La home e `#/requests/new` includono una chat iniziale: l'utente descrive il problema in linguaggio naturale, instaMax prova ad analizzarlo con la Supabase Edge Function `analyze-service-request` e mostra un riepilogo modificabile prima della pubblicazione.

La chiave Gemini non va mai nel frontend. Deve essere salvata solo nei secrets Supabase:

```bash
supabase secrets set GEMINI_API_KEY=LA_TUA_CHIAVE
supabase functions deploy analyze-service-request
```

Test rapido della funzione:

```bash
supabase functions invoke analyze-service-request --body '{"text":"Si è rotto il tubo della cucina","categories":[{"name":"Idraulico","slug":"idraulico"}]}'
```

Se Gemini non è disponibile, il frontend usa `src/lib/smart-request-fallback.ts`: il sito non si blocca e mostra “Analisi automatica non disponibile, abbiamo usato una classificazione base.”

Flusso utente:

1. Apri la home o `#/requests/new`.
2. Scrivi il problema, ad esempio “Si è rotto il tubo della cucina”.
3. Premi **Trova professionista**.
4. Controlla categoria, titolo, descrizione, urgenza, comune e provincia.
5. Premi **Pubblica richiesta**.
6. La richiesta viene salvata in `service_requests` e viene richiamata la funzione notifiche compatibili esistente.

Se l'utente non è loggato, la bozza viene salvata in `localStorage` con chiave `handygo_pending_request`; dopo login come cliente viene recuperata in `#/requests/new`.

Privacy: l'assistente chiede solo comune e provincia. Non usa geolocalizzazione precisa, non richiede telefono/email e invia a Gemini solo testo problema, categorie disponibili ed eventuale comune/provincia.

## Milestone 5 — area Lavoro

Esegui `supabase/milestone-5.sql` dopo le migrazioni precedenti. Crea schema e RLS per annunci, candidature, curriculum, portfolio, candidati salvati e bucket privato `candidate-files`.

Test: accedi come azienda/professionista e pubblica da `#/jobs/new`; accedi come candidato, completa il curriculum in `#/profile` e candidati dal dettaglio annuncio. L’owner può aggiornare lo stato e aprire la chat. Da `#/candidates` aziende e professionisti possono filtrare, salvare e contattare profili pubblici. Impostando `visibility=private`, il candidato sparisce dalla directory ma resta visibile agli owner degli annunci cui si è candidato.

Il bucket accetta PDF fino a 10 MB e immagini JPG/PNG/WebP fino a 5 MB. I file sono salvati in `<user_id>/cv` o `<user_id>/portfolio`; nessun telefono viene mostrato e il contatto passa dalla chat interna.

## Milestone 4 — chat privata Realtime

Esegui `supabase/milestone-4.sql` dopo le migrazioni precedenti. Lo script aggiorna conversazioni e messaggi, abilita RLS e Realtime, crea il bucket privato `chat-media` e le funzioni protette per apertura e chiusura chat.

Test consigliato:

1. Configura un professionista con categoria e comune compatibili con una richiesta aperta.
2. Dal dettaglio richiesta premi **Contatta**: viene creata una conversazione privata e notificato il cliente.
3. Accedi dai due account e verifica messaggi Realtime, badge lettura e lista conversazioni.
4. Prova JPG/PNG/WebP fino a 5 MB, MP4 fino a 25 MB e PDF fino a 10 MB.
5. Premi **Condividi posizione**, conferma esplicitamente e verifica la card Google Maps. La posizione non viene mai raccolta automaticamente.
6. Chiudi la conversazione e verifica che gli allegati ricevano `delete_after` a 30 giorni mentre il testo resta disponibile.

GitHub Pages non può eseguire processi pianificati. `supabase/cleanup-expired-chat-media.sql` elenca gli allegati scaduti; in produzione va eseguito da una Supabase Edge Function, `pg_cron` o un cron esterno attendibile che elimini prima l’oggetto Storage e poi azzeri i riferimenti nel messaggio.

Il bucket `chat-media` è privato: caricamento e lettura sono consentiti soltanto ai partecipanti; il percorso è `<conversation_id>/<sender_id>/...` per consentire eliminazione e audit futuri.

Marketplace mobile-first per clienti, professionisti, aziende e candidati. Il progetto corrente usa React 19, Vite, TypeScript, Tailwind CSS e Supabase ed è compatibile con hosting statico tramite `HashRouter`.

## Avvio locale

```bash
npm install
npm run dev
```

L'app usa le variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` in `.env.local`. Sono supportati anche i prefissi `NEXT_PUBLIC_`.

## Deploy GitHub Pages

In locale l'app legge Supabase da `.env.local`, ma GitHub Pages non carica questo file. Per il deploy bisogna quindi creare due Repository Secrets su GitHub:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Percorso GitHub:

`Repository -> Settings -> Secrets and variables -> Actions -> New repository secret`

Il workflow `.github/workflows/deploy.yml` passa questi Secrets a `npm run build` tramite variabili d'ambiente:

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

Non inserire mai le chiavi Supabase direttamente nel codice. Dopo aver creato o aggiornato i Secrets, rilancia il workflow GitHub Pages oppure fai un nuovo push su `main`.

### Navigazione in produzione

GitHub Pages ospita l'app come sito statico, quindi instaMax usa `HashRouter` per rendere affidabili le pagine interne anche dopo refresh o apertura diretta.

Le rotte tecniche pubblicate sono del tipo:

- `/#/dashboard`
- `/#/requests`
- `/#/chat`
- `/#/jobs`
- `/#/professionals`
- `/#/candidates`
- `/#/profile`
- `/#/settings`

Questo dettaglio non deve essere gestito dagli utenti: la navigazione avviene cliccando menu, bottom navigation, pulsanti e card dell'app. I link interni sono centralizzati in `src/lib/navigation.ts` per mantenere compatibilità con GitHub Pages e ridurre correzioni manuali future.

## Configurazione Supabase

Su un progetto nuovo esegui nel SQL Editor, in ordine:

1. `supabase/schema.sql`
2. `supabase/rls-policies.sql`
3. `supabase/seed.sql`
4. `supabase/milestone-3.sql`

La quarta migrazione aggiorna `service_requests`, crea `request_media`, il bucket privato `request-media`, le policy RLS e le funzioni di matching e notifica.

## Google OAuth

Abilita Google in Authentication → Providers. In Google Cloud usa come callback `https://<project-ref>.supabase.co/auth/v1/callback`. In Supabase aggiungi gli URL locali e pubblici consentiti. instaMax usa PKCE per evitare conflitti con le rotte hash.

Per mostrare il brand pubblico corretto nella schermata Google, configura in Google Cloud → OAuth consent screen:

- App name: `instaMax`
- Application home page: `https://instamax.it`
- Privacy policy: `https://instamax.it/privacy.html`
- Terms of service: `https://instamax.it/terms.html`
- Authorized domain: `instamax.it`

Nota: se il callback OAuth resta quello Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`), Google o Supabase possono ancora mostrare il dominio tecnico del progetto in alcuni passaggi di sicurezza. Per eliminarlo completamente serve configurare un dominio custom Supabase/Auth, ad esempio `auth.instamax.it`, e aggiornare poi il redirect URI del client Google.

## Test Milestone 3

### Cliente

1. Accedi come `client` e apri `#/requests/new`.
2. Inserisci titolo, categoria, comune, urgenza e descrizione; il budget è facoltativo.
3. Carica al massimo 5 file: immagini fino a 5 MB, video fino a 25 MB.
4. Pubblica e verifica il redirect a `#/requests/<id>`.
5. Controlla che siano mostrati solo comune e provincia, mai telefono o indirizzo preciso.
6. Prova modifica, chiusura ed eliminazione.

### Professionista

1. Accedi come `professional` e apri `#/profile`.
2. Imposta disponibilità, categorie e comuni serviti.
3. Apri `#/requests`: la RLS restituisce solo richieste aperte compatibili.
4. Il pulsante Contatta mostra il messaggio previsto in attesa della chat della Milestone 4.

### Notifiche e Storage

Pubblica una richiesta che coincide con categoria e zona di un professionista disponibile. La campanella del professionista deve mostrare “Nuova richiesta nella tua zona” e consentire di segnare la notifica come letta.

Il bucket è privato. I file sono salvati in `<client_id>/<request_id>/...`; nel database restano URL, MIME type, nome, dimensione e `storage_path`.

## Verifica codice

```bash
npm run typecheck
npm run build
```
