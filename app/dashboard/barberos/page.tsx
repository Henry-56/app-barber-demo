'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Scissors, ToggleLeft, ToggleRight } from 'lucide-react';

type Barber = {
  id: string; name: string; phone: string | null; isActive: boolean;
  cutsThisMonth: number; createdAt: string;
};

function NewBarberModal({ onClose, onCreated }: { onClose: () => void; onCreated: (b: Barber) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/v2/barbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Error'); setLoading(false); return; }
    onCreated(data);
    onClose();
  };

  const inputStyle = "w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder:text-[#555] outline-none transition-all";
  const inputBase = { backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border p-6" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
        <h2 className="text-lg font-bold text-white mb-4">Nuevo barbero</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className={inputStyle} style={inputBase} placeholder="Nombre *" value={name}
            onChange={e => setName(e.target.value)} required
            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          <input className={inputStyle} style={inputBase} placeholder="Teléfono (opcional)" value={phone}
            onChange={e => setPhone(e.target.value)}
            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#1c1c1c', color: '#a0a0a0' }}>Cancelar</button>
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

export default function BarberosPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch('/api/v2/barbers').then(r => r.json()).then(data => { setBarbers(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/v2/barbers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    });
    setBarbers(prev => prev.map(b => b.id === id ? { ...b, isActive: !current } : b));
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Barberos</h1>
          <p className="text-sm mt-0.5" style={{ color: '#a0a0a0' }}>{barbers.length} en el equipo</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}>
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: '#161616' }} />
          ))}
        </div>
      ) : barbers.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <Scissors className="w-8 h-8 mx-auto mb-2" style={{ color: '#2a2a2a' }} />
          <p className="text-sm" style={{ color: '#555555' }}>Agrega tu primer barbero para asignar citas.</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
            {barbers.map(b => (
              <div key={b.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                  style={{ backgroundColor: b.isActive ? '#C9A84C20' : '#2a2a2a', color: b.isActive ? '#C9A84C' : '#555555' }}>
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{b.name}</p>
                  <p className="text-xs" style={{ color: '#555555' }}>
                    {b.phone ?? 'Sin teléfono'} · {b.cutsThisMonth} cortes este mes
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium hidden sm:block" style={{ color: b.isActive ? '#22c55e' : '#555555' }}>
                    {b.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <button onClick={() => toggleActive(b.id, b.isActive)} style={{ color: b.isActive ? '#22c55e' : '#555555' }}>
                    {b.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparativa del mes */}
      {barbers.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#2a2a2a' }}>
            <h2 className="font-semibold text-white text-sm">Cortes este mes</h2>
          </div>
          <div className="p-4 space-y-3">
            {[...barbers].sort((a, b) => b.cutsThisMonth - a.cutsThisMonth).map(b => {
              const max = Math.max(...barbers.map(x => x.cutsThisMonth), 1);
              const pct = (b.cutsThisMonth / max) * 100;
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium">{b.name}</span>
                    <span style={{ color: '#C9A84C' }}>{b.cutsThisMonth} cortes</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#C9A84C' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <NewBarberModal onClose={() => setShowModal(false)} onCreated={b => setBarbers(prev => [...prev, b])} />
      )}
    </div>
  );
}
