'use client';

import React, { useState } from 'react';
import { MessageCircle, CheckCircle, XCircle, Trophy, Clock, Zap, ChevronDown } from 'lucide-react';
import { Client } from '../types';
import { CUTS_REQUIRED_FOR_FREE } from '@/src/constants';

type MessageType = 'free_cut' | 'close_to_free' | 'reminder';
type Outcome = 'responded' | 'came_back' | 'no_response';

type SentState = {
  logId: string;
  messageType: MessageType;
  outcome?: Outcome;
};

interface TodayQueueProps {
  clients: Client[];
  onOutreachSent: (clientId: string, messageType: MessageType) => Promise<string>;
  onOutcomeSet: (logId: string, outcome: Outcome) => Promise<void>;
}

const DEFAULT_FREQUENCY = 15;

function getDaysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

function getUrgencyScore(client: Client): number {
  const freq = client.avgFrequencyDays ?? DEFAULT_FREQUENCY;
  return getDaysSince(client.lastVisit) / freq;
}

function getMessageType(client: Client): MessageType {
  if (client.freeCutsAvailable > 0) return 'free_cut';
  if (client.cutsTowardsFree >= CUTS_REQUIRED_FOR_FREE - 1) return 'close_to_free';
  return 'reminder';
}

function buildMessage(client: Client, type: MessageType): string {
  const daysSince = getDaysSince(client.lastVisit);
  const cutsLeft = CUTS_REQUIRED_FOR_FREE - client.cutsTowardsFree;
  switch (type) {
    case 'free_cut':
      return `¡Hola ${client.name}! 💈 Te escribo de la barbería. ¡Tienes un corte GRATIS esperándote! ¿Cuándo puedes pasar? ✂️`;
    case 'close_to_free':
      return `¡Hola ${client.name}! 💈 Te falta solo ${cutsLeft} corte${cutsLeft !== 1 ? 's' : ''} para tu próximo corte GRATIS. ¡Pásate pronto! ✂️`;
    default:
      return `¡Hola ${client.name}! 💈 Hace ${daysSince} días que no te vemos. ¡Te esperamos en la barbería para tu próximo corte! ✂️`;
  }
}

export default function TodayQueue({ clients, onOutreachSent, onOutcomeSet }: TodayQueueProps) {
  const [sentMap, setSentMap] = useState<Record<string, SentState>>(() => {
    const init: Record<string, SentState> = {};
    clients.forEach(c => {
      if (c.pendingOutreach) {
        init[c.id] = {
          logId: c.pendingOutreach.id,
          messageType: c.pendingOutreach.messageType,
          outcome: c.pendingOutreach.outcome ?? undefined,
        };
      }
    });
    return init;
  });

  const [showUpcoming, setShowUpcoming] = useState(false);

  const scored = clients
    .map(c => ({ ...c, score: getUrgencyScore(c), daysSince: getDaysSince(c.lastVisit), msgType: getMessageType(c) }))
    .sort((a, b) => b.score - a.score);

  const urgent = scored.filter(c => c.score >= 1.0);
  const upcoming = scored.filter(c => c.score >= 0.7 && c.score < 1.0);
  const recoveredCount = Object.values(sentMap).filter(s => s.outcome === 'came_back').length;

  const handleWhatsApp = async (client: typeof scored[0]) => {
    const msg = buildMessage(client, client.msgType);
    const phone = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    const logId = await onOutreachSent(client.id, client.msgType);
    setSentMap(prev => ({ ...prev, [client.id]: { logId, messageType: client.msgType } }));
  };

  const handleOutcome = async (clientId: string, outcome: Outcome) => {
    const state = sentMap[clientId];
    if (!state) return;
    await onOutcomeSet(state.logId, outcome);
    setSentMap(prev => ({ ...prev, [clientId]: { ...prev[clientId], outcome } }));
  };

  function UrgencyBadge({ score }: { score: number }) {
    if (score >= 1.5) return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-rose-100 text-rose-700">Urgente</span>;
    if (score >= 1.0) return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-100 text-amber-700">Contactar hoy</span>;
    return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-500">Próximo</span>;
  }

  function MsgTypeBadge({ type }: { type: MessageType }) {
    if (type === 'free_cut') return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">🎁 Corte gratis disponible</span>;
    if (type === 'close_to_free') return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">⭐ Cerca del gratis</span>;
    return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">💈 Recordatorio</span>;
  }

  function DotColor({ score }: { score: number }) {
    const cls = score >= 1.5 ? 'bg-rose-500' : score >= 1.0 ? 'bg-amber-400' : 'bg-slate-300';
    return <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${cls}`} />;
  }

  function ClientCard({ client }: { client: typeof scored[0] }) {
    const freq = client.avgFrequencyDays ? Math.round(client.avgFrequencyDays) : DEFAULT_FREQUENCY;
    const daysOver = client.daysSince - freq;
    const sent = sentMap[client.id];

    return (
      <div className="p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <DotColor score={client.score} />
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 truncate">{client.name}</h3>
              <p className="text-xs text-slate-400">{client.phone}</p>
            </div>
          </div>
          <UrgencyBadge score={client.score} />
        </div>

        <div className="flex flex-wrap gap-2 mb-4 ml-5">
          <MsgTypeBadge type={client.msgType} />
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Cada {freq}d · {client.daysSince}d sin venir
            {daysOver > 0 && <span className="text-rose-600 font-semibold ml-0.5">(+{daysOver}d)</span>}
          </span>
        </div>

        <div className="ml-5">
          {!sent ? (
            <button
              onClick={() => handleWhatsApp(client)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-sm font-bold rounded-xl hover:bg-[#1ebd5b] transition-all active:scale-95 shadow-md shadow-green-200"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar WhatsApp
            </button>
          ) : sent.outcome ? (
            <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ${
              sent.outcome === 'came_back' ? 'bg-emerald-100 text-emerald-700' :
              sent.outcome === 'responded' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-500'
            }`}>
              {sent.outcome === 'came_back' && <><Trophy className="w-4 h-4" /> ¡Vino! ✓</>}
              {sent.outcome === 'responded' && <><CheckCircle className="w-4 h-4" /> Respondió ✓</>}
              {sent.outcome === 'no_response' && <><XCircle className="w-4 h-4" /> Sin respuesta</>}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">Mensaje enviado — ¿Qué pasó?</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleOutcome(client.id, 'came_back')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors active:scale-95">
                  <Trophy className="w-3.5 h-3.5" /> Vino
                </button>
                <button onClick={() => handleOutcome(client.id, 'responded')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors active:scale-95">
                  <CheckCircle className="w-3.5 h-3.5" /> Respondió
                </button>
                <button onClick={() => handleOutcome(client.id, 'no_response')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors active:scale-95">
                  <XCircle className="w-3.5 h-3.5" /> No respondió
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cola de hoy</h1>
        <p className="text-slate-500 mt-1">Clientes a contactar según su frecuencia real de visita.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-rose-600">{urgent.length}</p>
          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mt-0.5">Urgentes</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{upcoming.length}</p>
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">Próximos</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{recoveredCount}</p>
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">Recuperados</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Zap className="w-4 h-4 text-rose-500" />
          <h2 className="font-bold text-slate-900">Contactar ahora</h2>
          <span className="ml-auto text-xs font-bold text-slate-400">{urgent.length} clientes</span>
        </div>
        {urgent.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
            <p className="font-medium text-slate-700">¡Todo al día!</p>
            <p className="text-sm text-slate-400 mt-1">Ningún cliente fuera de su patrón normal.</p>
          </div>
        ) : (
          urgent.map(c => <ClientCard key={c.id} client={c} />)
        )}
      </div>

      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowUpcoming(v => !v)}
            className="w-full px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 hover:bg-slate-100 transition-colors"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-slate-900">Próximos a vencer</h2>
            <span className="ml-auto text-xs font-bold text-slate-400 mr-2">{upcoming.length} clientes</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUpcoming ? 'rotate-180' : ''}`} />
          </button>
          {showUpcoming && upcoming.map(c => <ClientCard key={c.id} client={c} />)}
        </div>
      )}
    </div>
  );
}
