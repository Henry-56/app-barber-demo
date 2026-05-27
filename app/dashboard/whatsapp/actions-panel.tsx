'use client';

import { useState, useEffect, useCallback } from 'react';
import { buildWaMessage, type ShopWaData, type WaTemplateType } from '@/src/lib/whatsapp-manual';

type Reminder = {
  id: string; scheduledAt: string; service: string | null;
  clientId: string | null; clientName: string | null; clientPhone: string | null; barberName: string | null;
};
type SimpleClient = {
  id: string; name: string; phone: string;
  loyaltyPoints: number; lastVisitAt?: string | null; createdAt?: string;
};
type Actions = {
  reminders: Reminder[];
  noShows: Reminder[];
  loyalty: SimpleClient[];
  inactive: SimpleClient[];
  newClients: SimpleClient[];
  total: number;
};

type WaEntry = { message: string; clientId: string | null; appointmentId?: string };

export default function ActionsPanel() {
  const [actions, setActions] = useState<Actions | null>(null);
  const [shop, setShop] = useState<ShopWaData | null>(null);
  const [waOpened, setWaOpened] = useState<Record<string, WaEntry>>({});
  const [waDone, setWaDone] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    fetch('/api/dashboard/whatsapp-actions').then(r => r.json()).then(setActions).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    fetch('/api/dashboard/settings').then(r => r.json()).then(setShop).catch(() => {});
  }, [load]);

  const openWa = (
    key: string,
    type: WaTemplateType,
    phone: string,
    clientId: string | null,
    vars: Record<string, string>,
    appointmentId?: string,
  ) => {
    if (!shop || !phone) return;
    const { url, message } = buildWaMessage(shop, type, phone, vars);
    window.open(url, '_blank');
    setWaOpened(prev => ({ ...prev, [key]: { message, clientId, appointmentId } }));
  };

  const confirmWa = async (key: string, type: string, itemId: string, confirmed: boolean) => {
    const wa = waOpened[key];
    if (!wa) return;
    await fetch('/api/dashboard/whatsapp-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: wa.clientId,
        type,
        message: wa.message,
        confirmed,
        appointmentId: wa.appointmentId,
      }),
    });
    // Siempre limpiar el prompt tras responder
    setWaOpened(prev => { const n = { ...prev }; delete n[key]; return n; });
    if (confirmed) {
      setWaDone(prev => new Set(prev).add(key));
      // Eliminar el item del estado local para que desaparezca
      setActions(a => {
        if (!a) return a;
        const next = { ...a, total: a.total - 1 };
        if (type === 'recordatorio') next.reminders = a.reminders.filter(r => r.id !== itemId);
        else if (type === 'fidelizacion') next.loyalty = a.loyalty.filter(c => c.id !== itemId);
        else if (type === 'bienvenida') next.newClients = a.newClients.filter(c => c.id !== itemId);
        else if (type === 'recuperacion') {
          next.inactive = a.inactive.filter(c => c.id !== itemId);
          next.noShows = a.noShows.filter(r => r.id !== itemId);
        }
        return next;
      });
    }
  };

  if (!actions || actions.total === 0) return null;

  function WaButton({ trackKey, itemId, type, label, onClick }: {
    trackKey: string; itemId: string; type: string; label: string; onClick: () => void;
  }) {
    const isOpen = !!waOpened[trackKey];
    const isDone = waDone.has(trackKey);
    if (isDone) return <span className="text-xs font-medium" style={{ color: '#22c55e' }}>✓ Enviado</span>;
    return (
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <button
          onClick={onClick}
          className="text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
          style={{ backgroundColor: '#25D36620', color: '#25D366', border: '1px solid #25D36630' }}>
          {label}
        </button>
        {isOpen && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: '#666' }}>¿Enviaste?</span>
            <button
              onClick={() => confirmWa(trackKey, type, itemId, true)}
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ backgroundColor: '#25D36630', color: '#25D366' }}>
              Sí
            </button>
            <button
              onClick={() => confirmWa(trackKey, type, itemId, false)}
              className="text-xs px-2 py-0.5 rounded"
              style={{ color: '#555' }}>
              No
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' }}>
        <span className="text-sm font-bold text-white">📋 Acciones de hoy</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#C9A84C20', color: '#C9A84C' }}>
          {actions.total} pendientes
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>

        {/* Bienvenida — clientes nuevos */}
        {actions.newClients?.map(c => {
          const key = `bienvenida-${c.id}`;
          return (
            <div key={c.id} className="px-5 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs" style={{ color: '#3b82f6' }}>👋 Cliente nuevo — activar tarjeta fidelización</p>
              </div>
              <WaButton trackKey={key} itemId={c.id} type="bienvenida" label="📱 Bienvenida"
                onClick={() => openWa(key, 'bienvenida', c.phone, c.id, { clientName: c.name })} />
            </div>
          );
        })}

        {/* Recordatorios */}
        {actions.reminders.map(r => {
          const dt = new Date(r.scheduledAt);
          const key = `recordatorio-${r.id}`;
          return (
            <div key={r.id} className="px-5 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{r.clientName ?? '—'}</p>
                <p className="text-xs" style={{ color: '#a0a0a0' }}>
                  Cita mañana · {dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  {r.service && ` · ${r.service}`}
                </p>
              </div>
              <WaButton trackKey={key} itemId={r.id} type="recordatorio" label="📱 Recordatorio"
                onClick={() => r.clientPhone && openWa(key, 'recordatorio', r.clientPhone, r.clientId, {
                  clientName: r.clientName ?? '',
                  date: dt.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }),
                  time: dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                  service: r.service ?? 'Corte',
                  barberName: r.barberName ?? '',
                }, r.id)} />
            </div>
          );
        })}

        {/* Fidelización completa */}
        {actions.loyalty.map(c => {
          const key = `fidelizacion-${c.id}`;
          return (
            <div key={c.id} className="px-5 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs" style={{ color: '#22c55e' }}>🎉 Completó 5 sellos — corte gratis</p>
              </div>
              <WaButton trackKey={key} itemId={c.id} type="fidelizacion" label="📱 Corte gratis"
                onClick={() => openWa(key, 'fidelizacion', c.phone, c.id, { clientName: c.name })} />
            </div>
          );
        })}

        {/* Clientes inactivos */}
        {actions.inactive.map(c => {
          const key = `recuperacion-${c.id}`;
          const days = c.lastVisitAt ? Math.floor((Date.now() - new Date(c.lastVisitAt).getTime()) / 86_400_000) : null;
          return (
            <div key={c.id} className="px-5 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs" style={{ color: '#f59e0b' }}>
                  Inactivo{days ? ` · ${days} días sin visita` : ''} · {c.loyaltyPoints}/5 sellos
                </p>
              </div>
              <WaButton trackKey={key} itemId={c.id} type="recuperacion" label="📱 Recuperar"
                onClick={() => openWa(key, 'recuperacion', c.phone, c.id, { clientName: c.name })} />
            </div>
          );
        })}

        {/* No-shows */}
        {actions.noShows.map(r => {
          const dt = new Date(r.scheduledAt);
          const key = `recuperacion-noshow-${r.id}`;
          return (
            <div key={r.id} className="px-5 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{r.clientName ?? '—'}</p>
                <p className="text-xs" style={{ color: '#ef4444' }}>
                  No asistió · {dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <WaButton trackKey={key} itemId={r.id} type="recuperacion" label="📱 Reagendar"
                onClick={() => r.clientPhone && openWa(key, 'recuperacion', r.clientPhone, r.clientId, { clientName: r.clientName ?? '' })} />
            </div>
          );
        })}

      </div>
    </div>
  );
}
