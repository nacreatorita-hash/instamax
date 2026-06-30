import { 
  UserProfile, 
  RequestItem, 
  ProfessionalItem, 
  CandidateItem, 
  JobItem, 
  ChatThread, 
  NotificationItem,
  UserRole
} from './types';

// Trades / Categories
export const CATEGORIES = [
  { id: 'idraulico', name: 'Idraulico', icon: 'Wrench', count: 124 },
  { id: 'elettricista', name: 'Elettricista', icon: 'Zap', count: 98 },
  { id: 'pittore', name: 'Imbianchino & Pittore', icon: 'Paintbrush', count: 86 },
  { id: 'giardiniere', name: 'Giardiniere', icon: 'Leaf', count: 54 },
  { id: 'pulizie', name: 'Impresa di Pulizie', icon: 'Sparkles', count: 142 },
  { id: 'falegname', name: 'Falegname', icon: 'Hammer', count: 32 },
  { id: 'sviluppatore', name: 'Sviluppatore Software', icon: 'Code', count: 210 },
  { id: 'designer', name: 'UX/UI Designer', icon: 'Palette', count: 115 },
  { id: 'assistenza', name: 'Assistenza Clienti', icon: 'Headphones', count: 78 },
  { id: 'marketing', name: 'Social Media Manager', icon: 'TrendingUp', count: 92 }
];

// Cities and Provinces
export const CITIES = [
  'Milano', 'Roma', 'Torino', 'Bologna', 'Firenze', 'Napoli', 'Palermo', 'Bari', 'Venezia', 'Genova'
];

// Default profiles for the 4 dashboard roles
export const DEFAULT_PROFILES: Record<UserRole, UserProfile> = {
  client: {
    id: 'u-client',
    name: 'Marco Rossi',
    email: 'marco.rossi@example.it',
    role: 'client',
    phone: '+39 333 123 4567',
    bio: 'Proprietario di appartamento a Milano Brera, cerco costantemente artigiani affidabili per manutenzione ordinaria e straordinaria.',
    location: 'Milano',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  },
  professional: {
    id: 'u-professional',
    name: 'Alessandro Bianchi',
    email: 'alessandro.idraulico@example.it',
    role: 'professional',
    phone: '+39 347 987 6543',
    bio: 'Idraulico professionista con oltre 12 anni di esperienza. Specializzato in impianti di riscaldamento, condizionamento e ristrutturazioni bagno complete. Lavoro pulito, rapido e garantito.',
    location: 'Torino',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    rating: 4.9,
    reviewsCount: 48,
    skills: ['Impianti Idraulici', 'Caldaie', 'Climatizzazione', 'Ristrutturazione Bagno', 'Emergenza Perdite'],
    hourlyRate: 35,
    experienceYears: 12
  },
  company: {
    id: 'u-company',
    name: 'Innovatech S.r.l.',
    email: 'hr@innovatech.it',
    role: 'company',
    phone: '+39 02 887766',
    bio: 'Agenzia digitale leader nella trasformazione tecnologica delle PMI italiane. Sviluppiamo soluzioni web, mobile ed AI ad alto impatto visivo e funzionale.',
    location: 'Milano',
    avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200',
    companyName: 'Innovatech S.r.l.',
    industry: 'Tecnologia / Software'
  },
  candidate: {
    id: 'u-candidate',
    name: 'Giulia Verdi',
    email: 'giulia.verdi.design@example.it',
    role: 'candidate',
    phone: '+39 329 555 4433',
    bio: 'UX/UI Designer con 4 anni di esperienza in agenzie creative. Appassionata di interaction design, design system raffinati e interfacce accessibili ispirate alla filosofia Apple.',
    location: 'Roma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    rating: 4.8,
    reviewsCount: 12,
    skills: ['Figma', 'UX Research', 'Design System', 'Tailwind CSS', 'Prototipazione'],
    experienceYears: 4
  }
};

// Seed Professionals (Professionisti Pubblici)
export const SEED_PROFESSIONALS: ProfessionalItem[] = [
  {
    id: 'p-1',
    name: 'Roberto Valente',
    title: 'Elettricista Certificato',
    rating: 4.8,
    reviewsCount: 32,
    bio: 'Installazione e manutenzione impianti elettrici civili e industriali. Domotica, videosorveglianza ed efficienza energetica. Pronto intervento 24/7.',
    hourlyRate: 30,
    skills: ['Impianti Elettrici', 'Domotica', 'Pronto Intervento', 'Certificazione 37/08', 'Antifurto'],
    location: 'Milano',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    isOnline: true,
    completedJobs: 114
  },
  {
    id: 'p-2',
    name: 'Lucia Esposito',
    title: 'Imbianchina & Decoratrice d\'Interni',
    rating: 4.9,
    reviewsCount: 54,
    bio: 'Tinteggiature moderne, velature, spatolati e posa carta da parati. Massima pulizia, cura dei dettagli e consulenza gratuita sulla scelta dei colori migliori per i tuoi ambienti.',
    hourlyRate: 25,
    skills: ['Tinteggiatura', 'Spatolato Veneziano', 'Carta da Parati', 'Cartongesso', 'Decorazioni'],
    location: 'Bologna',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    isOnline: true,
    completedJobs: 89
  },
  {
    id: 'p-3',
    name: 'Giovanni Moretti',
    title: 'Falegname Artigiano',
    rating: 4.7,
    reviewsCount: 19,
    bio: 'Creazione e restauro mobili in legno massiccio. Posa parquet, riparazione infissi e progettazione armadi su misura. Tradizione artigiana dal 1995.',
    hourlyRate: 40,
    skills: ['Restauro Mobili', 'Mobili su Misura', 'Parquet', 'Riparazione Infissi', 'Legno Massello'],
    location: 'Firenze',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    isOnline: false,
    completedJobs: 43
  },
  {
    id: 'p-4',
    name: 'Elena Sandri',
    title: 'Giardiniera & Landscape Designer',
    rating: 5.0,
    reviewsCount: 27,
    bio: 'Progettazione e manutenzione giardini, terrazzi e aree verdi condominiali. Impianti d\'irrigazione automatica, potatura alberi ad alto fusto ed eliminazione parassiti.',
    hourlyRate: 28,
    skills: ['Manutenzione Prato', 'Landscape Design', 'Potatura Fusti', 'Irrigazione Automatica', 'Fiori'],
    location: 'Roma',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    isOnline: true,
    completedJobs: 65
  }
];

// Seed Candidates (Candidati Pubblici)
export const SEED_CANDIDATES: CandidateItem[] = [
  {
    id: 'c-1',
    name: 'Francesco Neri',
    desiredRole: 'Sviluppatore React Full-Stack',
    experienceYears: 5,
    rating: 4.9,
    bio: 'Ingegnere informatico con 5 anni di esperienza nello sviluppo di web app scalabili in React, Node.js e Tailwind. Esperto di architetture serverless, SQL e NoSQL.',
    skills: ['React', 'Node.js', 'TypeScript', 'Next.js', 'PostgreSQL', 'AWS'],
    location: 'Milano',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    isAvailable: true
  },
  {
    id: 'c-2',
    name: 'Chiara Colombo',
    desiredRole: 'Social Media & Content Specialist',
    experienceYears: 3,
    rating: 4.7,
    bio: 'Creo strategie di comunicazione digitali incentrate sullo storytelling visivo e sulla crescita organica. Esperta di Instagram, TikTok, LinkedIn Ads e Copywriting persuasivo.',
    skills: ['Social Media Strategy', 'Copywriting', 'Canva', 'Meta Business Suite', 'Video Editing'],
    location: 'Torino',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    isAvailable: true
  },
  {
    id: 'c-3',
    name: 'Davide Russo',
    desiredRole: 'Customer Success Manager',
    experienceYears: 6,
    rating: 4.8,
    bio: 'Forte orientamento al cliente ed eccellenti doti comunicative. Gestione ticket complessi, onboarding clienti enterprise e riduzione del tasso di abbandono (churn rate).',
    skills: ['Zendesk', 'Intercom', 'CRM Salesforce', 'Problem Solving', 'Negoziazione'],
    location: 'Roma',
    avatar: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&q=80&w=200',
    isAvailable: false
  }
];

// Seed Requests (Richieste Clienti)
export const SEED_REQUESTS: RequestItem[] = [
  {
    id: 'req-1',
    title: 'Riparazione perdita tubo cucina',
    description: 'Ho una perdita d\'acqua importante sotto il lavello della cucina. L\'acqua gocciola costantemente bagnando il mobile in legno. Avrei bisogno di un idraulico con urgenza oggi stesso per sostituire la guarnizione o il sifone danneggiato.',
    category: 'Idraulico',
    status: 'pending',
    clientName: 'Marco Rossi',
    clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    date: '29 Giu 2026',
    budget: 80,
    location: 'Milano Brera',
    bidsCount: 3
  },
  {
    id: 'req-2',
    title: 'Installazione 3 applique a LED e dimmer',
    description: 'Cerco un elettricista per installare 3 nuove lampade da parete nel soggiorno e sostituire l\'interruttore classico con uno dimmerabile per regolare la luminosità. I punti luce sono già predisposti.',
    category: 'Elettricista',
    status: 'accepted',
    clientName: 'Laura Mastri',
    clientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    date: '27 Giu 2026',
    budget: 120,
    location: 'Roma Trastevere',
    bidsCount: 5,
    assignedTo: 'Roberto Valente'
  },
  {
    id: 'req-3',
    title: 'Tinteggiatura camera da letto matrimoniale',
    description: 'Necessito di imbiancare una camera da letto di circa 16mq. Colore bianco classico per soffitto e grigio tortora chiaro per le pareti laterali. Richiedo precisione, copertura mobili accurata e materiali inclusi nel preventivo.',
    category: 'Imbianchino & Pittore',
    status: 'completed',
    clientName: 'Stefano Brambilla',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    date: '15 Giu 2026',
    budget: 350,
    location: 'Milano Sempione',
    bidsCount: 6,
    assignedTo: 'Lucia Esposito'
  }
];

// Seed Jobs (Offerte di Lavoro delle Aziende)
export const SEED_JOBS: JobItem[] = [
  {
    id: 'job-1',
    title: 'Frontend Developer (React / Tailwind)',
    companyName: 'Innovatech S.r.l.',
    companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200',
    salary: '€35.000 - €42.000 / anno',
    type: 'Full-time',
    location: 'Milano / Ibrido',
    description: 'Innovatech è alla ricerca di uno Sviluppatore Frontend di talento per espandere il team di prodotto. Ti occuperai di sviluppare interfacce responsive ad alte prestazioni con particolare attenzione all\'esperienza utente e alle animazioni fluide.',
    date: '28 Giu 2026',
    requirements: [
      'Esperienza dimostrabile di almeno 3 anni con React e TypeScript',
      'Competenza profonda di Tailwind CSS e responsive design mobile-first',
      'Conoscenza di librerie di animazione (Motion o Framer Motion)',
      'Capacità di scrivere codice pulito, testato e documentato'
    ],
    applicationsCount: 8
  },
  {
    id: 'job-2',
    title: 'Senior UX/UI Designer',
    companyName: 'Creative Labs',
    companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=200',
    salary: '€45.000 - €52.000 / anno',
    type: 'Remoto',
    location: 'Remoto (Italia)',
    description: 'Cerchiamo un designer di livello assoluto in grado di tradurre flussi complessi in esperienze digitali incredibilmente semplici ed esteticamente sublimi. Il candidato ideale ha un forte focus sulla filosofia di design Apple (minimalismo, proporzioni, precisione tipografica).',
    date: '25 Giu 2026',
    requirements: [
      'Almeno 5 anni di esperienza come UX/UI Designer in contesti di prodotto o agenzia',
      'Portfolio eccezionale che dimostra cura maniacale per la tipografia, griglie e interazioni',
      'Padronanza assoluta di Figma (Design System avanzati, Auto Layout, Varianti)',
      'Esperienza in design di applicazioni mobile native e PWA'
    ],
    applicationsCount: 14
  },
  {
    id: 'job-3',
    title: 'Junior Social Media Manager',
    companyName: 'Glovo Italia S.p.A.',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=200',
    salary: '€24.000 - €28.000 / anno',
    type: 'Part-time',
    location: 'Milano Centro',
    description: 'Unisciti alla nostra divisione marketing per gestire i canali social locali, ideare campagne creative basate sui trend del momento e interagire con la community di driver, ristoranti e clienti finali.',
    date: '22 Giu 2026',
    requirements: [
      '1-2 anni di esperienza nella gestione professionale di TikTok e Instagram Reels',
      'Doti spiccate di editing video veloce direttamente da smartphone',
      'Eccellente scrittura creativa e ironia in linea con la brand identity',
      'Residenza a Milano per eventi e riprese live'
    ],
    applicationsCount: 22
  }
];

// Seed Chat Threads
export const SEED_CHATS: ChatThread[] = [
  {
    id: 'ch-1',
    recipientName: 'Alessandro Bianchi',
    recipientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    recipientRole: 'Idraulico Professionista',
    lastMessage: 'Perfetto, allora ci vediamo oggi verso le 15:30 al suo indirizzo.',
    lastMessageTime: '10:15',
    unreadCount: 1,
    messages: [
      { id: 'm1', sender: 'me', text: 'Buongiorno Alessandro, ho inviato una richiesta di pronto intervento per la perdita d\'acqua in cucina. È disponibile?', timestamp: '09:45' },
      { id: 'm2', sender: 'them', text: 'Buongiorno Marco! Sì, sono in zona Brera proprio adesso. Posso passare subito dopo pranzo a vedere l\'entità del danno.', timestamp: '10:02' },
      { id: 'm3', sender: 'me', text: 'Sarebbe fantastico, la ringrazio. C\'è acqua che cola e ho paura che rovini il mobile di legno sotto il lavabo.', timestamp: '10:08' },
      { id: 'm4', sender: 'them', text: 'Perfetto, allora ci vediamo oggi verso le 15:30 al suo indirizzo.', timestamp: '10:15' }
    ]
  },
  {
    id: 'ch-2',
    recipientName: 'Giulia Verdi',
    recipientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    recipientRole: 'Candidata UI/UX Designer',
    lastMessage: 'Grazie mille per il feedback positivo, sarei felice di fare un colloquio conoscitivo.',
    lastMessageTime: 'Ieri',
    unreadCount: 0,
    messages: [
      { id: 'm5', sender: 'me', text: 'Ciao Giulia, abbiamo ricevuto la tua candidatura per la posizione di Senior UX Designer. Il tuo portfolio è davvero splendido.', timestamp: 'Ieri 16:20' },
      { id: 'm6', sender: 'them', text: 'Grazie mille per il feedback positivo, sarei felice di fare un colloquio conoscitivo.', timestamp: 'Ieri 16:45' }
    ]
  }
];

// Seed Notifications
export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Nuova offerta ricevuta',
    description: 'Alessandro Bianchi ha risposto alla tua richiesta "Riparazione perdita tubo cucina" proponendo €35/ora.',
    type: 'success',
    time: '5 min fa',
    read: false
  },
  {
    id: 'n-2',
    title: 'Messaggio non letto',
    description: 'Hai un nuovo messaggio da Alessandro Bianchi nella chat.',
    type: 'message',
    time: '20 min fa',
    read: false
  },
  {
    id: 'n-3',
    title: 'Candidatura inviata con successo',
    description: 'La tua candidatura per "Frontend Developer" presso Innovatech S.r.l. è stata trasmessa.',
    type: 'info',
    time: '1 giorno fa',
    read: true
  }
];

// Helpers to read/write state with localStorage to support live persistence during testing
export function getStoredState<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(`handygo_${key}`);
    if (stored) return JSON.parse(stored) as T;
  } catch (e) {
    console.error('Error reading localStorage key', key, e);
  }
  return defaultValue;
}

export function setStoredState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`handygo_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage key', key, e);
  }
}

// Initialize stores with seed data if they do not exist
export function initializeStorage() {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem('handygo_active_role')) {
    localStorage.setItem('handygo_active_role', '"client"');
  }
  if (!localStorage.getItem('handygo_profiles')) {
    setStoredState('profiles', DEFAULT_PROFILES);
  }
  if (!localStorage.getItem('handygo_requests')) {
    setStoredState('requests', SEED_REQUESTS);
  }
  if (!localStorage.getItem('handygo_professionals')) {
    setStoredState('professionals', SEED_PROFESSIONALS);
  }
  if (!localStorage.getItem('handygo_candidates')) {
    setStoredState('candidates', SEED_CANDIDATES);
  }
  if (!localStorage.getItem('handygo_jobs')) {
    setStoredState('jobs', SEED_JOBS);
  }
  if (!localStorage.getItem('handygo_chats')) {
    setStoredState('chats', SEED_CHATS);
  }
  if (!localStorage.getItem('handygo_notifications')) {
    setStoredState('notifications', SEED_NOTIFICATIONS);
  }
}
