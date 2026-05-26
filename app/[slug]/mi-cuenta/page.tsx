'use client';

import { useState, use } from 'react';
import Link from 'next/link';

type Appointment = {
  id: string; scheduledAt: string; service: string | null;
  price: number | null; status: string; barberName: string | null;
};

type Client = {
  id: string; name: string; phone: string;
  totalVisits: number; loyaltyPoints: number; loyaltyRedeemed: number;
};

type AccountData = { client: Client; appointments: Appointment[] };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_confirmation: { label: 'Pendiente', color: '#f59e0b' },
  scheduled: { label: 'Confirmada', color: '#10b981' },
  completed: { label: 'Completada', color: '#6366f1' },
  cancelled: { label: 'Cancelada', color: '#ef4444' },
  no_show: { label: 'No asistió', color: '#6b7280' },
};

const gold = '#C9A84C';

export default function MiCuentaPhonePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AccountData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setNotFound(false);
    setData(null);

    const res = await fetch(`/api/public/${slug}/lookup?phone=${encodeURIComponent(phone.trim())}`);
    const lookup = await res.json();

    if (!lookup.found) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const res2 = await fetch(`/api/public/${slug}/client/${lookup.clientId}`);
    if (!res2.ok) { setLoading(false); setNotFound(true); return; }

    setData(await res2.json());
    setLoading(false);
  };

  const loyaltyDots = data ? Array.from({ length: 5 }, (_, i) => i < data.client.loyaltyPoints) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#161616', borderBottom: '1px solid #2a2a2a', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href={`/${slug}`} style={{ color: '#666', textDecoration: 'none', fontSize: 20 }}>←</a>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Mi cuenta</h1>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px' }}>

        {/* Phone lookup form */}
        {!data && (
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 6 }}>Accede a tu cuenta</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Ingresa el número de WhatsApp con el que hiciste tu reserva.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={phone}
                onChange={e => { setPhone(e.target.value); setNotFound(false); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ej: 987 654 321"
                type="tel"
                style={{
                  width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a',
                  borderRadius: 8, padding: '14px', color: '#e5e5e5', fontSize: 16,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleSearch}
                disabled={!phone.trim() || loading}
                style={{
                  background: !phone.trim() || loading ? '#333' : gold,
                  color: '#0a0a0a', fontWeight: 700, padding: '14px', borderRadius: 8,
                  border: 'none', cursor: !phone.trim() || loading ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                }}>
                {loading ? 'Buscando...' : 'Buscar mi cuenta'}
              </button>

              {notFound && (
                <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#aaa', marginBottom: 12 }}>
                    No encontramos una cuenta con ese número.
                  </p>
                  <Link href={`/${slug}/reservar`} style={{
                    display: 'inline-block', background: gold, color: '#0a0a0a',
                    fontWeight: 700, padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14,
                  }}>
                    ¿Quieres agendar tu primera cita?
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account view */}
        {data && (
          <div>
            {/* Client card */}
            <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 14, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#0a0a0a', fontWeight: 700 }}>
                  {data.client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>{data.client.name}</h2>
                  <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>{data.client.phone}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20 }}>
                <div style={{ background: '#0a0a0a', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: gold }}>{data.client.totalVisits}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>Visitas</p>
                </div>
                <div style={{ background: '#0a0a0a', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#10b981' }}>{data.client.loyaltyRedeemed}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>Canjeados</p>
                </div>
                <div style={{ background: '#0a0a0a', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{data.client.loyaltyPoints}/5</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>Puntos</p>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#666' }}>Progreso fidelización</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {loyaltyDots.map((filled, i) => (
                    <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: filled ? gold : '#2a2a2a' }} />
                  ))}
                </div>
                {data.client.loyaltyPoints >= 5 && (
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: gold, fontWeight: 600 }}>
                    🎉 ¡Tienes un corte gratis! Muéstraselo al barbero.
                  </p>
                )}
              </div>
            </div>

            <Link href={`/${slug}/reservar`} style={{
              display: 'block', background: gold, color: '#0a0a0a', fontWeight: 700,
              padding: '14px', borderRadius: 8, textDecoration: 'none', textAlign: 'center',
              fontSize: 15, marginBottom: 28,
            }}>
              + Reservar nueva cita
            </Link>

            <h3 style={{ fontSize: 16, marginBottom: 14, color: '#aaa' }}>Historial de citas</h3>
            {data.appointments.length === 0 ? (
              <p style={{ color: '#555', fontSize: 14 }}>Sin citas registradas</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.appointments.map(appt => {
                  const dt = new Date(appt.scheduledAt);
                  const statusInfo = STATUS_LABELS[appt.status] ?? { label: appt.status, color: '#aaa' };
                  return (
                    <div key={appt.id} style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>
                            {dt.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {' · '}
                            {dt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#aaa' }}>
                            {appt.service ?? 'Corte'}{appt.barberName ? ` · ${appt.barberName}` : ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{ fontSize: 12, color: statusInfo.color, fontWeight: 600 }}>{statusInfo.label}</span>
                          {appt.price != null && (
                            <span style={{ fontSize: 13, color: gold }}>S/ {appt.price.toFixed(0)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={() => { setData(null); setPhone(''); setNotFound(false); }}
              style={{ marginTop: 20, background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13 }}>
              ← Buscar con otro número
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
