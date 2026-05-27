'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Star, Filter } from 'lucide-react';
import { buildWaMessage, type ShopWaData } from '@/src/lib/whatsapp-manual';

type Client = {
  id: string; name: string; phone: string;
  loyaltyPoints: number; loyaltyRedeemed: number;
  totalVisits: number; isInactive: boolean; lastVisitAt: string | null;
};

const LOYALTY_MAX = 5;

type FilterKey = 'all' | 'ready' | 'almost';

function LoyaltyCard({ client, shop, onWaSent }: { client: Client; shop: ShopWaData | null; onWaSent?: (id: string) => void }) {
  const pts = client.loyaltyPoints;
  const displayPts = pts;
  const isComplete = displayPts >= LOYALTY_MAX;
  const isAlmost = displayPts === LOYALTY_MAX - 1;
  const [waState, setWaState] = useState<'idle' | 'opened' | 'confirmed'>('idle');
  const [waMsg, setWaMsg] = useState('');

  const handleWaClick = () => {
    if (!shop) return;
    const { url, message } = buildWaMessage(shop, 'fidelizacion', client.phone, { clientName: client.name });
    window.open(url, '_blank');
    setWaMsg(message);
    setWaState('opened');
  };

  const handleWaConfirm = async (confirmed: boolean) => {
    await fetch('/api/dashboard/whatsapp-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, type: 'fidelizacion', message: waMsg, confirmed }),
    });
    setWaState(confirmed ? 'confirmed' : 'idle');
    if (confirmed && onWaSent) onWaSent(client.id);
  };

  return (
    <div className="rounded-2xl border p-4 transition-all hover:border-[#C9A84C40]" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-white text-sm">{client.name}</p>
          <p className="text-xs mt-0.5" style={{ color: '#555555' }}>{client.phone} · {client.totalVisits} visitas</p>
        </div>
        {isComplete && (
          <span className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>
            <Gift className="w-3 h-3" /> Listo
          </span>
        )}
        {isAlmost && !isComplete && (
          <span className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: '#C9A84C20', color: '#C9A84C' }}>
            <Star className="w-3 h-3" /> 1 más
          </span>
        )}
      </div>

      {/* Sellos animados */}
      <div className="flex gap-2">
        {Array.from({ length: LOYALTY_MAX }).map((_, i) => (
          <div key={i}
            className="flex-1 aspect-square rounded-lg border flex items-center justify-center transition-all"
            style={{
              backgroundColor: i < displayPts ? '#C9A84C' : '#0a0a0a',
              borderColor: i < displayPts ? '#C9A84C' : '#2a2a2a',
              transform: i < displayPts ? 'scale(1.05)' : 'scale(1)',
            }}>
            {i < displayPts ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#0a0a0a' }}>
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <span className="text-[10px] font-bold" style={{ color: '#555555' }}>{i + 1}</span>
            )}
          </div>
        ))}
        {/* Slot regalo */}
        <div className="flex-1 aspect-square rounded-lg border-2 border-dashed flex items-center justify-center"
          style={{ borderColor: client.loyaltyRedeemed > 0 ? '#C9A84C50' : '#2a2a2a' }}>
          <Gift className="w-4 h-4" style={{ color: client.loyaltyRedeemed > 0 ? '#C9A84C' : '#2a2a2a' }} />
        </div>
      </div>

      {client.loyaltyRedeemed > 0 && (
        <p className="text-xs mt-2" style={{ color: '#555555' }}>
          {client.loyaltyRedeemed} {client.loyaltyRedeemed === 1 ? 'canje' : 'canjes'} realizados
        </p>
      )}

      {/* Botón WhatsApp solo para clientes con 5 sellos */}
      {isComplete && (
        <div className="mt-3">
          {waState === 'confirmed' ? (
            <p className="text-xs font-medium" style={{ color: '#22c55e' }}>✓ Mensaje de corte gratis enviado</p>
          ) : (
            <>
              <button
                onClick={handleWaClick}
                disabled={!shop}
                className="w-full py-2 rounded-lg text-xs font-bold"
                style={{ backgroundColor: '#25D36620', color: '#25D366', border: '1px solid #25D36630' }}>
                📱 Avisar corte gratis por WhatsApp
              </button>
              {waState === 'opened' && (
                <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#25D36610', border: '1px solid #25D36620' }}>
                  <span className="text-xs flex-1" style={{ color: '#a0a0a0' }}>¿Enviaste el mensaje?</span>
                  <button onClick={() => handleWaConfirm(true)}
                    className="text-xs font-bold px-2 py-1 rounded-md"
                    style={{ backgroundColor: '#25D36630', color: '#25D366' }}>
                    Sí
                  </button>
                  <button onClick={() => handleWaConfirm(false)}
                    className="text-xs px-2 py-1 rounded-md" style={{ color: '#555' }}>
                    No
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function FidelizacionPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [shop, setShop] = useState<ShopWaData | null>(null);

  useEffect(() => {
    fetch('/api/v2/clients').then(r => r.json()).then(data => { setClients(data); setLoading(false); }).catch(() => setLoading(false));
    fetch('/api/dashboard/settings').then(r => r.json()).then(setShop).catch(() => {});
  }, []);

  const filtered = clients.filter(c => {
    if (filter === 'ready') return c.loyaltyPoints >= LOYALTY_MAX || (c.loyaltyPoints === 0 && c.loyaltyRedeemed > 0 && c.totalVisits >= LOYALTY_MAX);
    if (filter === 'almost') return c.loyaltyPoints === LOYALTY_MAX - 1;
    return true;
  });

  const readyCount = clients.filter(c => c.loyaltyPoints >= LOYALTY_MAX).length;
  const almostCount = clients.filter(c => c.loyaltyPoints === LOYALTY_MAX - 1).length;

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: clients.length },
    { key: 'ready', label: '5/5 — Listos', count: readyCount },
    { key: 'almost', label: '4/5 — Cerca', count: almostCount },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Fidelización</h1>
        <p className="text-sm mt-0.5" style={{ color: '#a0a0a0' }}>Tarjetas de sellos — 5 cortes = 1 gratis</p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <p className="text-3xl font-bold" style={{ color: '#22c55e' }}>{readyCount}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#a0a0a0' }}>listos para canjear</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <p className="text-3xl font-bold" style={{ color: '#C9A84C' }}>{almostCount}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#a0a0a0' }}>a 1 corte del gratis</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: filter === f.key ? '#C9A84C' : '#161616',
              color: filter === f.key ? '#0a0a0a' : '#a0a0a0',
              border: `1px solid ${filter === f.key ? '#C9A84C' : '#2a2a2a'}`,
            }}>
            <Filter className="w-3 h-3" />
            {f.label}
            {f.count > 0 && (
              <span className="ml-0.5 text-[10px] font-bold px-1 rounded-full"
                style={{ backgroundColor: filter === f.key ? '#0a0a0a20' : '#2a2a2a', color: filter === f.key ? '#0a0a0a' : '#555555' }}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: '#161616' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <Gift className="w-8 h-8 mx-auto mb-2" style={{ color: '#2a2a2a' }} />
          <p className="text-sm" style={{ color: '#555555' }}>
            {filter === 'ready' ? 'Ningún cliente ha completado 5 cortes aún.' :
             filter === 'almost' ? 'Ningún cliente está a 1 corte del gratis.' :
             'Aún no hay clientes registrados.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(c => <LoyaltyCard key={c.id} client={c} shop={shop} />)}
        </div>
      )}
    </div>
  );
}
