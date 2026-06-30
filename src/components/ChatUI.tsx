import React from 'react';
import { ArrowRight, Check, CheckCheck, FileText, MapPin, Paperclip, Send, XCircle } from 'lucide-react';
import { Avatar, Badge, Button } from './UI';
import { getConversationReference } from '../lib/chat';
import type { ChatMessage, Conversation, ConversationStatus } from '../lib/supabase/types';

const statusMeta: Record<ConversationStatus, { label: string; variant: 'success' | 'gray' | 'warning' }> = {
  open: { label: 'Aperta', variant: 'success' },
  closed: { label: 'Chiusa', variant: 'gray' },
  archived: { label: 'Archiviata', variant: 'warning' },
};

export const UnreadBadge = ({ count }: { count: number }) =>
  count > 0
    ? (
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-black text-white">
        {count > 99 ? '99+' : count}
      </span>
    )
    : null;

export const ConversationCard = ({ conversation, onClick }: { conversation: Conversation; onClick: () => void; key?: React.Key }) => {
  const status = statusMeta[conversation.status] ?? statusMeta.open;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-3xl border border-zinc-100 bg-white p-4 text-left transition hover:border-blue-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
    >
      <Avatar
        name={conversation.other_profile?.full_name ?? 'Utente'}
        src={conversation.other_profile?.avatar_url ?? undefined}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-zinc-900">
            {conversation.other_profile?.full_name ?? 'Utente instaMax'}
          </p>
          <UnreadBadge count={conversation.unread_count ?? 0} />
        </div>

        <p className="mt-0.5 truncate text-xs font-semibold text-blue-600">
          {getConversationReference(conversation)}
        </p>

        <p className="mt-1 truncate text-xs text-zinc-400">
          {conversation.last_message ?? 'Inizia la conversazione'}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 text-right">
        <span className="block text-[10px] font-semibold text-zinc-400">
          {conversation.last_message_at
            ? new Date(conversation.last_message_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
            : ''}
        </span>
        <Badge variant={status.variant}>{status.label}</Badge>
        <ArrowRight className="text-zinc-300" size={16} />
      </div>
    </button>
  );
};

export const ConversationList = ({ items, onOpen }: { items: Conversation[]; onOpen: (id: string) => void }) => (
  <div className="space-y-3">
    {items.map(item => <ConversationCard key={item.id} conversation={item} onClick={() => onOpen(item.id)} />)}
  </div>
);

export const LocationMessageCard = ({ message }: { message: ChatMessage }) => (
  <a
    target="_blank"
    rel="noreferrer"
    href={`https://www.google.com/maps?q=${message.location_lat},${message.location_lng}`}
    className="block rounded-2xl bg-white/90 p-3 text-zinc-800 shadow-sm"
  >
    <div className="flex items-center gap-2 font-bold">
      <span className="rounded-xl bg-emerald-100 p-2 text-emerald-600"><MapPin size={17} /></span>
      <span>{message.location_label ?? 'Posizione condivisa'}</span>
    </div>
    <p className="mt-2 text-[11px] text-zinc-500">Apri in Google Maps</p>
  </a>
);

export const MediaMessagePreview = ({ message }: { message: ChatMessage }) => {
  if (message.message_type === 'image') {
    return <img src={message.attachment_url ?? ''} alt={message.attachment_name ?? 'Immagine'} className="max-h-64 w-full rounded-2xl object-cover" />;
  }

  if (message.message_type === 'video') {
    return <video src={message.attachment_url ?? ''} controls className="max-h-64 w-full rounded-2xl bg-black" />;
  }

  return (
    <a
      href={message.attachment_url ?? '#'}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-2xl bg-white/90 p-3 text-sm font-bold text-zinc-800"
    >
      <FileText size={20} />
      <span className="truncate">{message.attachment_name ?? 'Apri allegato'}</span>
    </a>
  );
};

export const MessageBubble = ({ message, mine }: { message: ChatMessage; mine: boolean; key?: React.Key }) => {
  if (message.message_type === 'system') {
    return (
      <div className="my-3 text-center text-[11px] font-semibold text-zinc-400">
        {message.body}
      </div>
    );
  }

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[84%] rounded-[1.5rem] px-4 py-3 ${
        mine
          ? 'rounded-br-md bg-blue-600 text-white'
          : 'rounded-bl-md border border-zinc-100 bg-white text-zinc-800 shadow-sm'
      }`}>
        {message.message_type === 'location'
          ? <LocationMessageCard message={message} />
          : ['image', 'video', 'file'].includes(message.message_type)
            ? <MediaMessagePreview message={message} />
            : <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>}

        <div className={`mt-1.5 flex justify-end gap-1.5 text-[9px] ${mine ? 'text-blue-100' : 'text-zinc-400'}`}>
          <span>{new Date(message.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
          {mine && (
            <span className="inline-flex items-center gap-0.5">
              {message.is_read ? <CheckCheck size={11} /> : <Check size={11} />}
              {message.is_read ? 'Letto' : 'Inviato'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const AttachmentButton = ({ onFile, disabled }: { onFile: (file: File) => void; disabled?: boolean }) => (
  <label
    title={disabled ? 'Disponibile nella prossima versione' : 'Allega file'}
    className={`rounded-full p-3 text-zinc-500 hover:bg-zinc-100 ${disabled ? 'pointer-events-none opacity-40' : 'cursor-pointer'}`}
  >
    <Paperclip size={20} />
    <input
      type="file"
      className="hidden"
      accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf"
      onChange={event => {
        const file = event.target.files?.[0];
        if (file) onFile(file);
        event.currentTarget.value = '';
      }}
    />
  </label>
);

export const ShareLocationButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <button
    disabled={disabled}
    title={disabled ? 'Disponibile nella prossima versione' : 'Condividi posizione'}
    onClick={onClick}
    className="rounded-full p-3 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
    aria-label="Condividi posizione"
  >
    <MapPin size={20} />
  </button>
);

export const CloseConversationButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <Button size="sm" variant="outline" disabled={disabled} onClick={onClick}>
    <XCircle size={14} /> Chiudi
  </Button>
);

export const ChatInput = ({
  value,
  onChange,
  onSend,
  onFile,
  onLocation,
  disabled,
  sending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFile: (file: File) => void;
  onLocation: () => void;
  disabled: boolean;
  sending: boolean;
}) => (
  <div className="border-t border-zinc-100 bg-white p-3">
    <div className="mx-auto flex max-w-4xl items-end gap-1">
      <AttachmentButton onFile={onFile} disabled={disabled || sending} />
      <ShareLocationButton onClick={onLocation} disabled={disabled || sending} />
      <div className="min-w-0 flex-1">
        <textarea
          value={value}
          onChange={event => onChange(event.target.value.slice(0, 2000))}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          maxLength={2000}
          disabled={disabled}
          rows={1}
          placeholder={disabled ? 'Conversazione chiusa' : 'Scrivi un messaggio…'}
          className="max-h-32 min-h-11 w-full resize-none rounded-2xl bg-zinc-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        />
        <p className="mt-1 text-right text-[10px] font-semibold text-zinc-300">{value.length}/2000</p>
      </div>
      <button
        disabled={disabled || sending || !value.trim()}
        onClick={onSend}
        className="rounded-full bg-blue-600 p-3 text-white shadow-lg shadow-blue-500/20 disabled:opacity-40"
        aria-label="Invia messaggio"
      >
        <Send size={19} />
      </button>
    </div>
  </div>
);

export const ChatWindow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-zinc-50 p-4 md:p-6">
    {children}
  </div>
);
