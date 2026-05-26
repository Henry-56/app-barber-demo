'use client';

import { useState, useEffect, use } from 'react';

type Shop = {
  id: string; name: string; slug: string; appointmentDuration: number;
  openingHours: Record<string, { open: string; close: string; closed: boolean }>;
  maxAdvanceDays: number; minAdvanceHours: number;
  barbers: { id: string; name: string }[];
  services: { id: string; name: string; price: string; durationMinutes: number }[];
};

type Step = 'service' | 'barber' | 'date' | 'time' | 'contact' | 'done';

const DAY_NAMES: Record<number, string> = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
  4: 'jueves', 5: 'viernes', 6: 'sabado',
};

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const gold = '#C9A84C';
const cardStyle = { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12 };

export default function ReservarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [shop, setShop] = useState<Shop | null>(null);
  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<Shop['services'][0] | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Shop['barbers'][0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ clientId: string } | null>(null);

  useEffect(() => {
    fetch(`/api/public/${slug}`)
      .then(r => r.json())
      .then(data => {
        setShop(data);
        // Compute available dates
        const dates: string[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDays = data.maxAdvanceDays ?? 14;
        for (let i = 0; i <= maxDays; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dayName = DAY_NAMES[d.getDay()];
          const cfg = data.openingHours?.[dayName];
          if (cfg && !cfg.closed) {
            dates.push(d.toISOString().split('T')[0]);
          }
        }
        setAvailableDates(dates);
      });
  }, [slug]);

  useEffect(() => {
    if (!selectedDate || !shop) return;
    setSlotsLoading(true);
    const params = new URLSearchParams({ date: selectedDate });
    if (selectedBarber) params.set('barberId', selectedBarber.id);
    fetch(`/api/public/${slug}/availability?${params}`)
      .then(r => r.json())
      .then(data => { setSlots(data.slots ?? []); setSlotsLoading(false); });
  }, [selectedDate, selectedBarber, slug, shop]);

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getDate()} de ${MONTH_NAMES[dt.getMonth()]}`;
  };

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientPhone.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/public/${slug}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        barberId: selectedBarber?.id ?? null,
        serviceId: selectedService?.id ?? null,
        date: selectedDate,
        time: selectedTime,
        notes: notes.trim() || null,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) {
      setResult({ clientId: data.clientId });
      setStep('done');
    }
  };

  if (!shop) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#555' }}>Cargando...</p>
      </div>
    );
  }

  const steps: Step[] = ['service', 'barber', 'date', 'time', 'contact'];
  const stepIndex = steps.indexOf(step as Step);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#161616', borderBottom: '1px solid #2a2a2a', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href={`/${slug}`} style={{ color: '#666', textDecoration: 'none', fontSize: 20 }}>←</a>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: '#666' }}>{shop.name}</p>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Reservar cita</h1>
        </div>
      </div>

      {step !== 'done' && (
        <div style={{ display: 'flex', gap: 4, padding: '20px 24px 0', maxWidth: 560, margin: '0 auto' }}>
          {steps.map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= stepIndex ? gold : '#2a2a2a',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      )}

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px' }}>

        {/* STEP: SERVICE */}
        {step === 'service' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>¿Qué servicio quieres?</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Selecciona un servicio o continúa sin elegir</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {shop.services.map(svc => (
                <button key={svc.id} onClick={() => { setSelectedService(svc); setStep('barber'); }}
                  style={{
                    ...cardStyle, padding: '16px 20px', cursor: 'pointer', border: '1px solid #2a2a2a',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: '#e5e5e5', textAlign: 'left', width: '100%', transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = gold)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{svc.name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>{svc.durationMinutes} min</p>
                  </div>
                  <span style={{ color: gold, fontWeight: 700 }}>S/ {Number(svc.price).toFixed(0)}</span>
                </button>
              ))}
              <button onClick={() => { setSelectedService(null); setStep('barber'); }}
                style={{
                  background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 12,
                  padding: '14px', cursor: 'pointer', color: '#666', fontSize: 14,
                }}>
                Continuar sin elegir servicio
              </button>
            </div>
          </div>
        )}

        {/* STEP: BARBER */}
        {step === 'barber' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>¿Con quién prefieres?</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Elige un barbero o cualquiera disponible</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {shop.barbers.map(b => (
                <button key={b.id} onClick={() => { setSelectedBarber(b); setStep('date'); }}
                  style={{
                    ...cardStyle, padding: '16px 20px', cursor: 'pointer', border: '1px solid #2a2a2a',
                    display: 'flex', alignItems: 'center', gap: 14,
                    color: '#e5e5e5', width: '100%',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = gold)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✂️</div>
                  <span style={{ fontWeight: 600 }}>{b.name}</span>
                </button>
              ))}
              <button onClick={() => { setSelectedBarber(null); setStep('date'); }}
                style={{
                  background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 12,
                  padding: '14px', cursor: 'pointer', color: '#666', fontSize: 14,
                }}>
                Cualquier barbero disponible
              </button>
            </div>
          </div>
        )}

        {/* STEP: DATE */}
        {step === 'date' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>¿Qué día?</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Próximos días disponibles</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {availableDates.map(d => {
                const dt = new Date(d + 'T00:00:00');
                const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][dt.getDay()];
                const isToday = d === new Date().toISOString().split('T')[0];
                return (
                  <button key={d} onClick={() => { setSelectedDate(d); setStep('time'); }}
                    style={{
                      ...cardStyle, padding: '14px 10px', cursor: 'pointer',
                      border: `1px solid ${selectedDate === d ? gold : '#2a2a2a'}`,
                      textAlign: 'center', color: '#e5e5e5',
                    }}>
                    <p style={{ margin: 0, fontSize: 11, color: gold, textTransform: 'uppercase' }}>{dayName}</p>
                    <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 18 }}>{dt.getDate()}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#666' }}>
                      {isToday ? 'Hoy' : MONTH_NAMES[dt.getMonth()].slice(0, 3)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP: TIME */}
        {step === 'time' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>¿A qué hora?</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
              {formatDate(selectedDate)}{selectedBarber ? ` · ${selectedBarber.name}` : ''}
            </p>
            {slotsLoading ? (
              <p style={{ color: '#555', textAlign: 'center', padding: 32 }}>Verificando disponibilidad...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {slots.map(slot => (
                  <button key={slot.time} disabled={!slot.available}
                    onClick={() => { setSelectedTime(slot.time); setStep('contact'); }}
                    style={{
                      ...cardStyle, padding: '12px 8px', cursor: slot.available ? 'pointer' : 'not-allowed',
                      border: `1px solid ${selectedTime === slot.time ? gold : slot.available ? '#2a2a2a' : '#1a1a1a'}`,
                      color: slot.available ? '#e5e5e5' : '#333',
                      textDecoration: slot.available ? 'none' : 'line-through',
                      fontSize: 14, fontWeight: 600,
                    }}>
                    {slot.time}
                  </button>
                ))}
                {slots.length === 0 && (
                  <p style={{ color: '#555', gridColumn: 'span 4', textAlign: 'center', padding: 24 }}>
                    No hay horarios disponibles para este día
                  </p>
                )}
              </div>
            )}
            <button onClick={() => setStep('date')} style={{ marginTop: 20, background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14 }}>
              ← Cambiar día
            </button>
          </div>
        )}

        {/* STEP: CONTACT */}
        {step === 'contact' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Tus datos</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
              {formatDate(selectedDate)} · {selectedTime}
              {selectedService ? ` · ${selectedService.name}` : ''}
              {selectedBarber ? ` · ${selectedBarber.name}` : ''}
            </p>
            <div style={{ background: '#161616', border: `1px solid ${gold}`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#aaa' }}>
                💡 Si ya reservaste antes, usa el mismo número para ver tu historial.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: '#aaa', display: 'block', marginBottom: 6 }}>Tu nombre *</label>
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Ej: Carlos López"
                  style={{
                    width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a',
                    borderRadius: 8, padding: '12px 14px', color: '#e5e5e5', fontSize: 15,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#aaa', display: 'block', marginBottom: 6 }}>WhatsApp / Celular *</label>
                <input
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="Ej: 987654321"
                  type="tel"
                  style={{
                    width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a',
                    borderRadius: 8, padding: '12px 14px', color: '#e5e5e5', fontSize: 15,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#aaa', display: 'block', marginBottom: 6 }}>Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Alguna indicación especial..."
                  rows={3}
                  style={{
                    width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a',
                    borderRadius: 8, padding: '12px 14px', color: '#e5e5e5', fontSize: 14,
                    outline: 'none', resize: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!clientName.trim() || !clientPhone.trim() || submitting}
                style={{
                  background: (!clientName.trim() || !clientPhone.trim() || submitting) ? '#333' : gold,
                  color: '#0a0a0a', fontWeight: 700, padding: '14px', borderRadius: 8,
                  border: 'none', cursor: (!clientName.trim() || !clientPhone.trim() || submitting) ? 'not-allowed' : 'pointer',
                  fontSize: 16, width: '100%',
                }}>
                {submitting ? 'Enviando...' : 'Confirmar reserva'}
              </button>
            </div>
          </div>
        )}

        {/* STEP: DONE */}
        {step === 'done' && result && (
          <div style={{ textAlign: 'center', paddingTop: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 26, marginBottom: 8 }}>¡Reserva enviada!</h2>
            <p style={{ color: '#aaa', fontSize: 15, marginBottom: 4 }}>
              Tu cita está <strong style={{ color: gold }}>pendiente de confirmación</strong>.
            </p>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>
              La barbería confirmará tu reserva a la brevedad.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href={`/${slug}/mi-cuenta/${result.clientId}`}
                style={{
                  display: 'block', background: '#161616', border: `1px solid ${gold}`,
                  borderRadius: 8, padding: '14px', color: gold, textDecoration: 'none',
                  fontWeight: 600,
                }}>
                Ver mis citas
              </a>
              <a href={`/${slug}`}
                style={{
                  display: 'block', background: 'transparent', border: '1px solid #2a2a2a',
                  borderRadius: 8, padding: '14px', color: '#aaa', textDecoration: 'none',
                }}>
                Volver al inicio
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
