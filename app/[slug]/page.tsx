import { notFound } from 'next/navigation';
import Link from 'next/link';

async function getShopData(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.AUTH_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/public/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

const DAY_LABELS: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
};
const DAY_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export default async function PublicShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopData(slug);
  if (!shop) notFound();

  const openDays = DAY_ORDER.filter(d => shop.openingHours?.[d] && !shop.openingHours[d].closed);
  const closedDays = DAY_ORDER.filter(d => shop.openingHours?.[d]?.closed);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Hero */}
      <div style={{
        background: shop.coverPhoto ? `url(${shop.coverPhoto}) center/cover` : 'linear-gradient(135deg, #161616 0%, #1c1c1c 100%)',
        borderBottom: '1px solid #2a2a2a',
        padding: '60px 24px 40px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {shop.coverPhoto && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
        )}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#C9A84C', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
            fontSize: 32,
          }}>✂️</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#fff' }}>{shop.name}</h1>
          {shop.city && <p style={{ margin: '4px 0 0', color: '#C9A84C', fontSize: 14 }}>{shop.city}</p>}
          {shop.description && (
            <p style={{ margin: '16px auto 0', maxWidth: 520, color: '#aaa', fontSize: 15, lineHeight: 1.6 }}>
              {shop.description}
            </p>
          )}
          <Link href={`/${slug}/reservar`} style={{
            display: 'inline-block', marginTop: 28,
            background: '#C9A84C', color: '#0a0a0a', fontWeight: 700,
            padding: '14px 36px', borderRadius: 8, textDecoration: 'none',
            fontSize: 16, letterSpacing: 0.5,
          }}>
            Reservar ahora
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          {/* Info card */}
          {(shop.address || shop.phone) && (
            <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', color: '#C9A84C', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Información</h3>
              {shop.address && (
                <p style={{ margin: '0 0 8px', fontSize: 14, color: '#ccc' }}>📍 {shop.address}</p>
              )}
              {shop.phone && (
                <a href={`tel:${shop.phone}`} style={{ color: '#C9A84C', fontSize: 14, textDecoration: 'none' }}>
                  📞 {shop.phone}
                </a>
              )}
            </div>
          )}

          {/* Hours card */}
          {shop.openingHours && (
            <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', color: '#C9A84C', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Horarios</h3>
              {openDays.map(d => (
                <div key={d} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: '#aaa' }}>{DAY_LABELS[d]}</span>
                  <span style={{ color: '#e5e5e5' }}>
                    {shop.openingHours[d].open} – {shop.openingHours[d].close}
                  </span>
                </div>
              ))}
              {closedDays.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  Cerrado: {closedDays.map(d => DAY_LABELS[d]).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Services */}
        {shop.services?.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 16, color: '#fff' }}>Servicios</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {shop.services.map((svc: { id: string; name: string; price: string; durationMinutes: number }) => (
                <div key={svc.id} style={{
                  background: '#161616', border: '1px solid #2a2a2a',
                  borderRadius: 10, padding: '16px 20px',
                }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#e5e5e5' }}>{svc.name}</p>
                  <p style={{ margin: '6px 0 0', color: '#C9A84C', fontWeight: 700 }}>
                    S/ {Number(svc.price).toFixed(0)}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>{svc.durationMinutes} min</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barbers */}
        {shop.barbers?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, marginBottom: 16, color: '#fff' }}>Nuestro equipo</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {shop.barbers.map((b: { id: string; name: string }) => (
                <div key={b.id} style={{
                  background: '#161616', border: '1px solid #2a2a2a',
                  borderRadius: 10, padding: '12px 20px', fontSize: 14, color: '#e5e5e5',
                }}>
                  ✂️ {b.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA bottom */}
        <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #2a2a2a' }}>
          <Link href={`/${slug}/reservar`} style={{
            display: 'inline-block',
            background: '#C9A84C', color: '#0a0a0a', fontWeight: 700,
            padding: '14px 48px', borderRadius: 8, textDecoration: 'none',
            fontSize: 16,
          }}>
            Reservar mi cita
          </Link>
          <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
            Proceso rápido · Sin registro · Confirmación inmediata
          </p>
        </div>
      </div>
    </div>
  );
}
