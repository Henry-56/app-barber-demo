'use client';

import { useState, useEffect, useCallback } from 'react';
import { buildWaMessage, type ShopWaData } from '@/src/lib/whatsapp-manual';

type Reminder = {
  id: string; scheduledAt: string; service: string | null;
  clientId: string | null; clientName: string | null; clientPhone: string | null; barberName: string | null;
};
type SimpleClient = {
  id: string; name: string; phone: string;
  loyaltyPoints: number; lastVisitAt?: string | null;
};
type Actions = {
  reminders: Reminder[];
  noShows: Reminder[];
  loyalty: SimpleClient[];
  inactive: SimpleClient[];
  total: number;
};

type WaTrack = Record<string, 'opened' | 'confirmed'>;

export default function ActionsPanel() {
  const [actions, setActions] = useState<Actions | null>(null);
  const [shop, setShop] = useState<ShopWaData | null>(null);
  const [waTrack, setWaTrack] = useState<WaTrack>({});
  const [waMessages, setWaMessages] = useState<Record<string, { message: string; clientId: string | null }>>({});

  const load = useCallback(() => {
    fetch('/api/dashboard/whatsapp-actions').then(r => r.json()).then(setActions).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    fetch('/api/dashboard/settings').then(r => r.json()).then(setShop).catch(() => {});
  }, [load]);

  const openWa = (key: string, type: 'recordatorio' | 'fidelizacion' | 'recuperacion', phone: string, clientId: string | null, vars: Record<string, string>) => {
    if (!shop || !phone) return;
    const { url, message } = buildWaMessage(shop, type, phone, vars);
    window.open(url, '_blank');
    setWaTrack(t => ({ ...t, [key]: 'opened' }));
    setWaMessages(m => ({ ...m, [key]: { message, clientId } }));
  };

  const confirmWa = async (key: string, confirmed: boolean, type: string) => {
    const wa = waMessages[key];
    if (!wa) return;
    await fetch('/api/dashboard/whatsapp-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: wa.clientId, type, message: wa.message, confirmed }),
    });
    setWaTrack(t => ({ ...t, [key]: confirmed ? 'confirmed' : 'opened' }));
    if (confirmed) setWaMessages(m => { const n = { ...m }; delete n[key]; return n; });
  };

  if (!actions || actions.total === 0) return null;

  const WaButton = ({ trackKey, label, onClick }: { trackKey: string; label: string; onClick: () => void }) => {
    const state = waTrack[trackKey];
    if (state === 'confirmed') return <span className="text-xs font-medium" style={{ color: '#22c55e' }}>✓ Enviado</span>;
    return (
      <div>
        <button onClick={onClick} className="text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: '#25D36620', color: '#25D366', border: '1px solid #25D36630' }}>
          {label}
        </button>
        {state === 'opened' && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs" style={{ color: '#666' }}>¿Enviaste?</span>
            <button onClick={() => confirmWa(trackKey, true, trackKey.split('-')[0])}
              className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#25D36630', color: '#25D366' }}>Sí</button>
            <button onClick={() => confirmWa(trackKey, false, trackKey.split('-')[0])}
              className="text-xs px-2 py-0.5 rounded" style={{ color: '#555' }}>No</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' }}>
        <span className="text-sm font-bold text-white">📋 Acciones de hoy</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#C9A84C20', color: '#C9A84C' }}>
          {actions.total} pendientes
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
        {/* Recordatorios */}
        {actions.reminders.map(r => {
          const dt = new Date(r.scheduledAt);
          const key = `recordatorio-${r.id}`;
          return (
            <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{r.clientName ?? '—'}</p>
                <p className="text-xs" style={{ color: '#a0a0a0' }}>
                  Cita mañana · {dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  {r.service && ` · ${r.service}`}
                </p>
              </div>
              <WaButton trackKey={key} label="📱 Recordatorio"
                onClick={() => r.clientPhone && openWa(key, 'recordatorio', r.clientPhone, r.clientId, {
                  clientName: r.clientName ?? '',
                  date: dt.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }),
                  time: dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                  service: r.service ?? 'Corte',
                  barberName: r.barberName ?? '',
                })} />
            </div>
          );
        })}

        {/* Fidelización completa */}
        {actions.loyalty.map(c => {
          const key = `fidelizacion-${c.id}`;
          return (
            <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs" style={{ color: '#22c55e' }}>🎉 Completó 5 sellos — corte gratis</p>
              </div>
              <WaButton trackKey={key} label="📱 Corte gratis"
                onClick={() => openWa(key, 'fidelizacion', c.phone, c.id, { clientName: c.name })} />
            </div>
          );
        })}

        {/* Clientes inactivos */}
        {actions.inactive.map(c => {
          const key = `recuperacion-${c.id}`;
          const days = c.lastVisitAt ? Math.floor((Date.now() - new Date(c.lastVisitAt).getTime()) / 86_400_000) : null;
          return (
            <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs" style={{ color: '#f59e0b' }}>
                  Inactivo{days ? ` · ${days} días sin visita` : ''} · {c.loyaltyPoints}/5 sellos
                </p>
              </div>
              <WaButton trackKey={key} label="📱 Recuperar"
                onClick={() => openWa(key, 'recuperacion', c.phone, c.id, { clientName: c.name })} />
            </div>
          );
        })}

        {/* No-shows */}
        {actions.noShows.map(r => {
          const dt = new Date(r.scheduledAt);
          const key = `recuperacion-noshow-${r.id}`;
          return (
            <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{r.clientName ?? '—'}</p>
                <p className="text-xs" style={{ color: '#ef4444' }}>
                  No asistió · {dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <WaButton trackKey={key} label="📱 Reagendar"
                onClick={() => r.clientPhone && openWa(key, 'recuperacion', r.clientPhone, r.clientId, { clientName: r.clientName ?? '' })} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
