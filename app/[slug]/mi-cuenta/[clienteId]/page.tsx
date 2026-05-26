import { notFound } from 'next/navigation';
import Link from 'next/link';

async function getClientData(slug: string, clientId: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/public/${slug}/client/${clientId}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_confirmation: { label: 'Pendiente', color: '#f59e0b' },
  scheduled: { label: 'Confirmada', color: '#10b981' },
  completed: { label: 'Completada', color: '#6366f1' },
  cancelled: { label: 'Cancelada', color: '#ef4444' },
  no_show: { label: 'No asistió', color: '#6b7280' },
};

export default async function ClientAccountPage({
  params,
}: {
  params: Promise<{ slug: string; clienteId: string }>;
}) {
  const { slug, clienteId } = await params;
  const data = await getClientData(slug, clienteId);
  if (!data) notFound();

  const { client, appointments } = data;
  const loyaltyDots = Array.from({ length: 5 }, (_, i) => i < client.loyaltyPoints);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#161616', borderBottom: '1px solid #2a2a2a', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href={`/${slug}`} style={{ color: '#666', textDecoration: 'none', fontSize: 20 }}>←</a>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Mi cuenta</h1>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px' }}>
        {/* Client card */}
        <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#0a0a0a', fontWeight: 700 }}>
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20 }}>{client.name}</h2>
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>{client.phone}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 20 }}>
            <div style={{ background: '#0a0a0a', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#C9A84C' }}>{client.totalVisits}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>Visitas</p>
            </div>
            <div style={{ background: '#0a0a0a', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#10b981' }}>{client.loyaltyRedeemed}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>Canjeados</p>
            </div>
            <div style={{ background: '#0a0a0a', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{client.loyaltyPoints}/5</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>Puntos</p>
            </div>
          </div>

          {/* Loyalty bar */}
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#666' }}>Progreso fidelización</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {loyaltyDots.map((filled, i) => (
                <div key={i} style={{
                  flex: 1, height: 8, borderRadius: 4,
                  background: filled ? '#C9A84C' : '#2a2a2a',
                }} />
              ))}
            </div>
            {client.loyaltyPoints >= 5 && (
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#C9A84C', fontWeight: 600 }}>
                🎉 ¡Tienes un corte gratis! Muéstraselo al barbero.
              </p>
            )}
          </div>
        </div>

        {/* Book again */}
        <Link href={`/${slug}/reservar`} style={{
          display: 'block', background: '#C9A84C', color: '#0a0a0a', fontWeight: 700,
          padding: '14px', borderRadius: 8, textDecoration: 'none', textAlign: 'center',
          fontSize: 15, marginBottom: 28,
        }}>
          + Reservar nueva cita
        </Link>

        {/* Appointment history */}
        <h3 style={{ fontSize: 16, marginBottom: 14, color: '#aaa' }}>Historial de citas</h3>
        {appointments.length === 0 ? (
          <p style={{ color: '#555', fontSize: 14 }}>Sin citas registradas</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {appointments.map((appt: {
              id: string; scheduledAt: string; service: string | null;
              price: number | null; status: string; barberName: string | null;
            }) => {
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
                        {appt.service ?? 'Corte'}
                        {appt.barberName ? ` · ${appt.barberName}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 12, color: statusInfo.color, fontWeight: 600 }}>
                        {statusInfo.label}
                      </span>
                      {appt.price != null && (
                        <span style={{ fontSize: 13, color: '#C9A84C' }}>S/ {appt.price.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
