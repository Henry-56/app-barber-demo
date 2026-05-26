'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, MessageCircle, UserX, CheckCircle, Loader2 } from 'lucide-react';

type Client = {
  id: string; name: string; phone: string; notes?: string;
  lastVisitAt: string | null; totalVisits: number; noShowCount: number;
  isInactive: boolean; loyaltyPoints: number; loyaltyRedeemed: number;
  createdAt: string;
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}20`, color }}>
      {label}
    </span>
  );
}

function LoyaltyDots({ points }: { points: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-2.5 h-2.5 rounded-full border transition-all"
          style={{
            backgroundColor: i < points ? '#C9A84C' : 'transparent',
            borderColor: i < points ? '#C9A84C' : '#2a2a2a',
          }} />
      ))}
    </div>
  );
}

function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Client) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/v2/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, notes }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Error'); setLoading(false); return; }
    onCreated(data);
    onClose();
  };

  const inputStyle = "w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder:text-[#555] outline-none transition-all";
  const inputBaseStyle = { backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border p-6" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
        <h2 className="text-lg font-bold text-white mb-4">Nuevo cliente</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className={inputStyle} style={inputBaseStyle} placeholder="Nombre *" value={name}
            onChange={e => setName(e.target.value)} required
            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          <input className={inputStyle} style={inputBaseStyle} placeholder="Teléfono (ej: 987 654 321) *" value={phone}
            onChange={e => setPhone(e.target.value)} required
            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          <textarea className={inputStyle} style={inputBaseStyle} placeholder="Notas opcionales" rows={2}
            value={notes} onChange={e => setNotes(e.target.value)}
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);

  const fetchClients = useCallback(async () => {
    const res = await fetch(`/api/v2/clients?q=${encodeURIComponent(search)}&filter=${filter}`);
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Activos' },
    { key: 'inactive', label: 'Inactivos' },
  ] as const;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-sm mt-0.5" style={{ color: '#a0a0a0' }}>{clients.length} registrados</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}>
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {/* Buscador y filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#555555' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-[#555555] outline-none"
            style={{ backgroundColor: '#161616', border: '1px solid #2a2a2a' }}
            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
          />
        </div>
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: filter === f.key ? '#C9A84C' : '#161616',
                color: filter === f.key ? '#0a0a0a' : '#a0a0a0',
                border: `1px solid ${filter === f.key ? '#C9A84C' : '#2a2a2a'}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: '#161616' }} />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <p className="text-sm" style={{ color: '#555555' }}>
            {search ? 'No se encontraron clientes con esa búsqueda.' : 'Aún no hay clientes. ¡Agrega el primero!'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
            {clients.map(c => (
              <div key={c.id} className="px-5 py-4 flex items-center gap-4 hover:bg-[#1c1c1c] transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                  style={{ backgroundColor: '#2a2a2a', color: '#C9A84C' }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm">{c.name}</p>
                    <Badge label={c.isInactive ? 'Inactivo' : 'Activo'} color={c.isInactive ? '#ef4444' : '#22c55e'} />
                    {c.noShowCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                        {c.noShowCount} no-show{c.noShowCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#555555' }}>{c.phone} · {c.totalVisits} visitas · Última: {formatDate(c.lastVisitAt)}</p>
                  <div className="mt-1.5">
                    <LoyaltyDots points={c.loyaltyPoints} />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {c.isInactive && (
                    <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${c.name} 👋 Te extrañamos en la barbería. Tu tarjeta de fidelización sigue activa. ¿Cuándo vienes? ✂️`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-all hover:bg-[#25d36620]" title="Enviar WhatsApp de recuperación"
                      style={{ color: '#25d366' }}>
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <NewClientModal
          onClose={() => setShowModal(false)}
          onCreated={c => setClients(prev => [c, ...prev])}
        />
      )}
    </div>
  );
}
