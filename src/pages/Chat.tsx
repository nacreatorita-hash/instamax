import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, RefreshCw, Search, ShieldCheck, WifiOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Badge, Button, Card } from '../components/UI';
import {
  ChatInput,
  ChatWindow,
  CloseConversationButton,
  ConversationList,
  MessageBubble,
} from '../components/ChatUI';
import { useAuth } from '../lib/auth/useAuth';
import {
  closeConversation,
  getConversationById,
  getConversationReference,
  getMessages,
  getUserConversations,
  markMessagesAsRead,
  sendLocationMessage,
  sendMediaMessage,
  sendTextMessage,
  subscribeToConversations,
  subscribeToMessages,
} from '../lib/chat';
import { uploadChatMedia } from '../lib/chat-media';
import { createLocationNotification, createMessageNotification } from '../lib/notifications';
import type { ChatMessage, Conversation } from '../lib/supabase/types';
import { APP_ROUTES, buildAppRoute, navigateTo } from '../lib/navigation';

type RealtimeHealth = 'connecting' | 'live' | 'fallback';

export const Chat: React.FC = () => {
  const { id } = useParams();
  return id ? <ChatDetail id={id} /> : <ChatList />;
};

const ChatList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Conversation[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [realtime, setRealtime] = useState<RealtimeHealth>('connecting');

  const load = useCallback(async (background = false) => {
    if (!user) {
      setLoading(false);
      setItems([]);
      return;
    }

    if (background) setRefreshing(true);
    else setLoading(true);

    try {
      setError('');
      setItems(await getUserConversations(user.id));
    } catch (err: any) {
      setError(err.message || 'Non riesco a caricare le conversazioni.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
    if (!user) return;

    return subscribeToConversations(
      user.id,
      () => void load(true),
      status => {
        if (status === 'SUBSCRIBED') setRealtime('live');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setRealtime('fallback');
      },
    );
  }, [load, user?.id]);

  const filtered = useMemo(
    () => items.filter(conversation =>
      `${conversation.other_profile?.full_name ?? ''} ${getConversationReference(conversation)} ${conversation.last_message ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
    [items, query],
  );

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-28">
      <header className="border-b border-zinc-100 bg-white px-5 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black">Messaggi</h1>
              <p className="mt-1 text-sm text-zinc-500">Conversazioni private, senza mostrare numero o dati personali.</p>
            </div>
            <RealtimePill status={realtime} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-5 md:p-8">
        {error && <Notice text={error} />}

        <div className="mb-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={17} />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Cerca conversazioni"
              className="w-full rounded-2xl border border-zinc-100 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => void load(true)}
            className="rounded-2xl border border-zinc-100 bg-white px-4 text-zinc-500 hover:text-zinc-950"
            aria-label="Aggiorna conversazioni"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading
          ? <Loading label="Caricamento conversazioni…" />
          : filtered.length
            ? <ConversationList items={filtered} onOpen={conversationId => navigateTo(navigate, buildAppRoute(`/chat/${conversationId}`))} />
            : (
              <Card hoverEffect={false} className="py-14 text-center">
                <MessageCircle className="mx-auto text-blue-600" size={34} />
                <h2 className="mt-4 text-lg font-black">Nessuna conversazione ancora.</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                  Quando contatterai o sarai contattato, le chat appariranno qui.
                </p>
              </Card>
            )}
      </main>
    </div>
  );
};

const ChatDetail = ({ id }: { id: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [realtime, setRealtime] = useState<RealtimeHealth>('connecting');
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (background = false) => {
    if (!user) {
      setLoading(false);
      setError('Effettua l’accesso per leggere questa conversazione.');
      return;
    }

    if (!background) setLoading(true);

    try {
      const [loadedConversation, loadedMessages] = await Promise.all([
        getConversationById(id, user.id),
        getMessages(id),
      ]);
      setConversation(loadedConversation);
      setMessages(loadedMessages);
      await markMessagesAsRead(id);
    } catch (err: any) {
      setError(err.message || 'Conversazione non trovata o permessi insufficienti.');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    setError('');
    void load();

    return subscribeToMessages(
      id,
      () => void load(true),
      status => {
        if (status === 'SUBSCRIBED') setRealtime('live');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setRealtime('fallback');
      },
    );
  }, [id, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const appendOrReplaceMessage = (message: ChatMessage) => {
    setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]);
  };

  const send = async () => {
    if (!user) return;
    if (conversation?.status !== 'open') {
      setError('La conversazione è chiusa: non puoi inviare nuovi messaggi.');
      return;
    }

    const body = text;
    setSending(true);
    setError('');
    setText('');

    try {
      const sent = await sendTextMessage(id, user.id, body);
      appendOrReplaceMessage(sent);
      await createMessageNotification(id, body).catch(() => {});
      void load(true);
    } catch (err: any) {
      setText(body);
      setError(err.message || 'Messaggio non inviato. Controlla la connessione e riprova.');
    } finally {
      setSending(false);
    }
  };

  const media = async (file: File) => {
    if (!user) return;
    if (conversation?.status !== 'open') return setError('La conversazione è chiusa.');

    setSending(true);
    setError('');

    try {
      const uploaded = await uploadChatMedia(id, user.id, file);
      const sent = await sendMediaMessage(id, user.id, {
        ...uploaded,
        name: file.name,
        size: file.size,
      });
      appendOrReplaceMessage(sent);
      await createMessageNotification(id, uploaded.type === 'image' ? 'Immagine' : 'Allegato').catch(() => {});
      void load(true);
    } catch (err: any) {
      setError(err.message || 'Allegato non inviato.');
    } finally {
      setSending(false);
    }
  };

  const location = () => {
    if (!user) return;
    if (conversation?.status !== 'open') return setError('La conversazione è chiusa.');
    if (!window.confirm('Vuoi condividere volontariamente la tua posizione precisa solo con questa persona?')) return;
    if (!navigator.geolocation) return setError('Geolocalizzazione non disponibile.');

    setSending(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const sent = await sendLocationMessage(id, user.id, position.coords.latitude, position.coords.longitude);
          appendOrReplaceMessage(sent);
          await createLocationNotification(id).catch(() => {});
          void load(true);
        } catch (err: any) {
          setError(err.message || 'Posizione non inviata.');
        } finally {
          setSending(false);
        }
      },
      () => {
        setError('Permesso posizione negato o posizione non disponibile.');
        setSending(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const close = async () => {
    if (!window.confirm('Chiudere la conversazione? Gli allegati saranno programmati per la cancellazione tra 30 giorni.')) return;
    try {
      setConversation(await closeConversation(id));
      await load(true);
    } catch (err: any) {
      setError(err.message || 'Impossibile chiudere la conversazione.');
    }
  };

  if (loading) return <Loading label="Caricamento chat…" />;
  if (!conversation) {
    return (
      <div className="p-8">
        <Notice text={error || 'Conversazione non trovata.'} />
        <Button variant="outline" onClick={() => navigateTo(navigate, APP_ROUTES.chat)} className="mt-3">
          Torna ai messaggi
        </Button>
      </div>
    );
  }

  const closed = conversation.status !== 'open';

  return (
    <div className="flex h-[calc(100vh-5.5rem)] flex-col bg-white md:h-[calc(100vh-4rem)]">
      <header className="flex items-center gap-3 border-b border-zinc-100 bg-white p-3 md:px-6">
        <button onClick={() => navigateTo(navigate, APP_ROUTES.chat)} className="rounded-full p-2 hover:bg-zinc-100" aria-label="Torna alle conversazioni">
          <ArrowLeft size={19} />
        </button>
        <Avatar
          name={conversation.other_profile?.full_name ?? 'Utente'}
          src={conversation.other_profile?.avatar_url ?? undefined}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-black">{conversation.other_profile?.full_name ?? 'Utente instaMax'}</h1>
          <p className="truncate text-[11px] font-semibold text-blue-600">{getConversationReference(conversation)}</p>
        </div>
        <Badge variant={closed ? 'gray' : 'success'}>
          {conversation.status === 'archived' ? 'Archiviata' : closed ? 'Chiusa' : 'Aperta'}
        </Badge>
        <CloseConversationButton disabled={closed} onClick={close} />
      </header>

      <div className="flex items-center justify-between gap-2 bg-emerald-50 px-4 py-2 text-[11px] font-semibold text-emerald-700">
        <span className="flex items-center gap-2">
          <ShieldCheck size={14} /> Chat privata: telefono, email e posizione non sono condivisi automaticamente.
        </span>
        <RealtimePill status={realtime} compact />
      </div>

      {error && <Notice text={error} />}

      <ChatWindow>
        {messages.length
          ? messages.map(message => <MessageBubble key={message.id} message={message} mine={message.sender_id === user?.id} />)
          : (
            <div className="m-auto text-center">
              <MessageCircle className="mx-auto text-zinc-300" />
              <p className="mt-2 text-sm font-bold text-zinc-500">Inizia la conversazione</p>
            </div>
          )}
        <div ref={endRef} />
      </ChatWindow>

      {closed && (
        <div className="bg-zinc-100 p-3 text-center text-xs font-bold text-zinc-500">
          Conversazione chiusa: puoi leggere lo storico, ma non inviare nuovi messaggi.
        </div>
      )}

      <ChatInput
        value={text}
        onChange={setText}
        onSend={send}
        onFile={media}
        onLocation={location}
        disabled={closed}
        sending={sending}
      />
    </div>
  );
};

const RealtimePill = ({ status, compact = false }: { status: RealtimeHealth; compact?: boolean }) => {
  if (status === 'fallback') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
        <WifiOff size={12} /> Aggiorna se serve
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${status === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'} px-2.5 py-1 font-bold ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'live' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
      {status === 'live' ? 'Realtime' : 'Connessione…'}
    </span>
  );
};

const Notice = ({ text }: { text: string }) => (
  <div className="m-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
    {text}
  </div>
);

const Loading = ({ label }: { label: string }) => (
  <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-zinc-400">
    <RefreshCw className="mr-2 animate-spin" size={17} /> {label}
  </div>
);
