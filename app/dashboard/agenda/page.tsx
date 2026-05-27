'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, XCircle, UserX, Loader2, CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { buildWaMessage, type ShopWaData } from '@/src/lib/whatsapp-manual';

type AppointmentRow = {
  appointment: {
    id: string; scheduledAt: string; status: string;
    service: string | null; price: number | null; notes: string | null;
  };
  client: { id: string; name: string; phone: string } | null;
  barber: { id: string; name: string } | null;
};

type Barber = { id: string; name: string; isActive: boolean };
type Client = { id: string; name: string; phone: string };

const STATUS_CONFIG = {
  pending_confirmation: { label: 'Por confirmar', color: '#f59e0b' },
  scheduled:  { label: 'Confirmada',  color: '#3b82f6' },
  completed:  { label: 'Completada', color: '#22c55e' },
  cancelled:  { label: 'Cancelada',  color: '#ef4444' },
  no_show:    { label: 'No asistió', color: '#f59e0b' },
} as const;

type PendingAction = {
  id: string; scheduledAt: string; service: string | null; price: number | null;
  notes: string | null; source: string | null;
  clientId: string; clientName: string; clientPhone: string;
  barberName: string | null;
};

function PendingPanel({ onRefresh }: { onRefresh: () => void }) {
  const [pending, setPending] = useState<PendingAction[]>([]);
  const [acting, setActing] = useState<string | null>(null);
  const [shop, setShop] = useState<ShopWaData | null>(null);
  const [waOpened, setWaOpened] = useState<Record<string, { message: string; clientId: string }>>({});
  const [waConfirmed, setWaConfirmed] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    fetch('/api/dashboard/pending-actions').then(r => r.json()).then(setPending).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/dashboard/settings').then(r => r.json()).then(setShop).catch(() => {});
  }, []);

  if (pending.length === 0) return null;

  const act = async (id: string, action: 'confirm' | 'reject') => {
    setActing(id);
    await fetch(`/api/dashboard/appointments/${id}/${action}`, { method: 'POST' });
    load();
    onRefresh();
    setActing(null);
  };

  const handleWaClick = (p: PendingAction) => {
    if (!shop) return;
    const dt = new Date(p.scheduledAt);
    const { url, message } = buildWaMessage(shop, 'confirmacion', p.clientPhone, {
      clientName: p.clientName,
      date: dt.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }),
      time: dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      service: p.service ?? 'Corte',
      barberName: p.barberName ?? '',
    });
    window.open(url, '_blank');
    setWaOpened(prev => ({ ...prev, [p.id]: { message, clientId: p.clientId } }));
  };

  const handleWaConfirm = async (id: string, confirmed: boolean) => {
    const wa = waOpened[id];
    if (!wa) return;
    await fetch('/api/dashboard/whatsapp-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: wa.clientId, type: 'confirmacion', message: wa.message, confirmed }),
    });
    setWaOpened(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (confirmed) setWaConfirmed(prev => new Set(prev).add(id));
  };

  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: '#1a1500', borderColor: '#f59e0b40' }}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} />
        <h2 className="text-sm font-bold" style={{ color: '#f59e0b' }}>
          Solicitudes pendientes de confirmación ({pending.length})
        </h2>
      </div>
      <div className="space-y-3">
        {pending.map(p => {
          const dt = new Date(p.scheduledAt);
          const dateStr = dt.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
          const timeStr = dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
          const waState = waOpened[p.id];
          const waDone = waConfirmed.has(p.id);
          return (
            <div key={p.id} className="rounded-xl border p-3" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-white text-sm">{p.clientName}</p>
                  <p className="text-xs" style={{ color: '#a0a0a0' }}>
                    {dateStr} · {timeStr}
                    {p.service && ` · ${p.service}`}
                    {p.barberName && ` · ${p.barberName}`}
                  </p>
                  {p.notes && <p className="text-xs mt-0.5 italic" style={{ color: '#666' }}>"{p.notes}"</p>}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: '#2a2a2a', color: '#aaa' }}>
                  Web
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleWaClick(p)}
                  disabled={!shop}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: '#25D36620', color: waDone ? '#22c55e' : '#25D366', border: `1px solid ${waDone ? '#22c55e30' : '#25D36630'}` }}>
                  {waDone ? '✓ Enviado' : '📱 WhatsApp'}
                </button>
                <button onClick={() => act(p.id, 'confirm')} disabled={acting === p.id}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                  style={{ backgroundColor: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e30' }}>
                  {acting === p.id ? '...' : '✓ Confirmar'}
                </button>
                <button onClick={() => act(p.id, 'reject')} disabled={acting === p.id}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold"
                  style={{ backgroundColor: '#ef444420', color: '#ef4444', border: '1px solid #ef444430' }}>
                  ✕ Rechazar
                </button>
              </div>
              {/* Prompt de confirmación de envío */}
              {waState && !waDone && (
                <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#25D36610', border: '1px solid #25D36620' }}>
                  <span className="text-xs flex-1" style={{ color: '#a0a0a0' }}>¿Enviaste el mensaje?</span>
                  <button onClick={() => handleWaConfirm(p.id, true)}
                    className="text-xs font-bold px-2 py-1 rounded-md"
                    style={{ backgroundColor: '#25D36630', color: '#25D366' }}>
                    Sí, lo envié
                  </button>
                  <button onClick={() => handleWaConfirm(p.id, false)}
                    className="text-xs px-2 py-1 rounded-md"
                    style={{ color: '#555' }}>
                    No
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? { label: status, color: '#a0a0a0' };
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function NewCitaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [barberId, setBarberId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [service, setService] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v2/clients').then(r => r.json()).then(setClients).catch(() => {});
    fetch('/api/v2/barbers').then(r => r.json()).then(setBarbers).catch(() => {});
  }, []);

  const filteredClients = clientSearch
    ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !date || !time) { setError('Completa los campos requeridos'); return; }
    setLoading(true);
    setError('');

    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    const res = await fetch('/api/v2/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: selectedClient.id,
        barberId: barberId || undefined,
        scheduledAt,
        service: service || undefined,
        price: price ? Number(price) : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Error al crear cita'); setLoading(false); return; }
    onCreated();
    onClose();
  };

  const inputStyle = "w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder:text-[#555] outline-none transition-all";
  const inputBase = { backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md rounded-2xl border p-5 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
        <h2 className="text-lg font-bold text-white mb-4">Nueva cita</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#a0a0a0' }}>Cliente *</label>
            {selectedClient ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#0a0a0a', border: '1px solid #C9A84C' }}>
                <span className="text-sm text-white">{selectedClient.name}</span>
                <button type="button" onClick={() => { setSelectedClient(null); setClientSearch(''); }}
                  className="text-xs" style={{ color: '#555555' }}>✕</button>
              </div>
            ) : (
              <div className="relative">
                <input className={inputStyle} style={inputBase} placeholder="Buscar cliente..."
                  value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
                {filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg border overflow-hidden" style={{ backgroundColor: '#1c1c1c', borderColor: '#2a2a2a' }}>
                    {filteredClients.slice(0, 5).map(c => (
                      <button key={c.id} type="button" onClick={() => { setSelectedClient(c); setClientSearch(''); }}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#2a2a2a] transition-colors">
                        {c.name} <span className="text-xs" style={{ color: '#555555' }}>{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Barbero */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#a0a0a0' }}>Barbero</label>
            <select value={barberId} onChange={e => setBarberId(e.target.value)}
              className={inputStyle} style={inputBase}>
              <option value="">Sin asignar</option>
              {barbers.filter(b => b.isActive).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#a0a0a0' }}>Fecha *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className={inputStyle} style={inputBase}
                onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#a0a0a0' }}>Hora *</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required
                className={inputStyle} style={inputBase}
                onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
            </div>
          </div>

          {/* Servicio y precio */}
          <input className={inputStyle} style={inputBase} placeholder="Servicio (ej: Corte clásico)"
            value={service} onChange={e => setService(e.target.value)}
            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          <input type="number" className={inputStyle} style={inputBase} placeholder="Precio S/ (opcional)"
            value={price} onChange={e => setPrice(e.target.value)}
            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />

          {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#1c1c1c', color: '#a0a0a0' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/v2/appointments?date=${date}`);
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/v2/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchAppointments();
    setUpdating(null);
  };

  const navigateDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split('T')[0]);
  };

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      {/* Pending confirmations panel */}
      <PendingPanel onRefresh={fetchAppointments} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Agenda</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}>
          <Plus className="w-4 h-4" /> Nueva cita
        </button>
      </div>

      {/* Navegación de fecha */}
      <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
        <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors" style={{ color: '#a0a0a0' }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-white capitalize">{displayDate}</p>
          <button onClick={() => setDate(new Date().toISOString().split('T')[0])}
            className="text-[10px] hover:underline mt-0.5" style={{ color: '#C9A84C' }}>
            Hoy
          </button>
        </div>
        <button onClick={() => navigateDate(1)} className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors" style={{ color: '#a0a0a0' }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de citas */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: '#161616' }} />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <CalendarDays className="w-8 h-8 mx-auto mb-2" style={{ color: '#2a2a2a' }} />
          <p className="text-sm" style={{ color: '#555555' }}>No hay citas para este día.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(({ appointment: appt, client, barber }) => (
            <div key={appt.id} className="rounded-2xl border p-4 transition-all" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm" style={{ color: '#C9A84C' }}>
                      {new Date(appt.scheduledAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="text-white font-semibold text-sm mt-1">{client?.name ?? '—'}</p>
                  <p className="text-xs" style={{ color: '#555555' }}>
                    {appt.service ?? 'Corte'} {barber && `· ${barber.name}`}
                    {appt.price && ` · S/ ${appt.price}`}
                  </p>
                </div>
              </div>

              {appt.status === 'pending_confirmation' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={async () => { setUpdating(appt.id); await fetch(`/api/dashboard/appointments/${appt.id}/confirm`, { method: 'POST' }); await fetchAppointments(); setUpdating(null); }}
                    disabled={updating === appt.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ backgroundColor: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e30' }}>
                    {updating === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Confirmar
                  </button>
                  <button onClick={async () => { setUpdating(appt.id); await fetch(`/api/dashboard/appointments/${appt.id}/reject`, { method: 'POST' }); await fetchAppointments(); setUpdating(null); }}
                    disabled={updating === appt.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ backgroundColor: '#ef444420', color: '#ef4444', border: '1px solid #ef444430' }}>
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </div>
              )}
              {appt.status === 'scheduled' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateStatus(appt.id, 'completed')} disabled={updating === appt.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ backgroundColor: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e30' }}>
                    {updating === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Completar
                  </button>
                  <button onClick={() => updateStatus(appt.id, 'no_show')} disabled={updating === appt.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ backgroundColor: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b30' }}>
                    <UserX className="w-3.5 h-3.5" /> No asistió
                  </button>
                  <button onClick={() => updateStatus(appt.id, 'cancelled')} disabled={updating === appt.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ backgroundColor: '#ef444420', color: '#ef4444', border: '1px solid #ef444430' }}>
                    <XCircle className="w-3.5 h-3.5" /> Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewCitaModal onClose={() => setShowModal(false)} onCreated={fetchAppointments} />
      )}
    </div>
  );
}
