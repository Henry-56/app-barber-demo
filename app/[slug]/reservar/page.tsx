'use client';

import { useState, useEffect, use } from 'react';

type Shop = {
  id: string; name: string; slug: string; appointmentDuration: number;
  openingHours: Record<string, { open: string; close: string; closed: boolean }>;
  maxAdvanceDays: number; minAdvanceHours: number;
  depositEnabled: boolean | null;
  depositAmount: string | null;
  depositMandatory: boolean | null;
  paymentQrUrl: string | null;
  paymentPhone: string | null;
  paymentMethodLabel: string | null;
  barbers: { id: string; name: string }[];
  services: { id: string; name: string; price: string; durationMinutes: number }[];
};

type Step = 'phone' | 'service' | 'barber' | 'date' | 'time' | 'payment' | 'done';

type FoundClient = { clientId: string; name: string; loyaltyPoints: number };

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
  const [shopNotFound, setShopNotFound] = useState(false);
  const [step, setStep] = useState<Step>('phone');

  // Phone step state
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [foundClient, setFoundClient] = useState<FoundClient | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [newName, setNewName] = useState('');
  const [phoneChecked, setPhoneChecked] = useState(false);

  // Booking state
  const [selectedService, setSelectedService] = useState<Shop['services'][0] | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Shop['barbers'][0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [resultClientId, setResultClientId] = useState<string>('');
  const [depositPaidResult, setDepositPaidResult] = useState<boolean>(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/public/${slug}`)
      .then(r => { if (!r.ok) { setShopNotFound(true); return null; } return r.json(); })
      .then(data => {
        if (!data) return;
        setShop(data);
        const dates: string[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDays = data.maxAdvanceDays ?? 14;
        for (let i = 0; i <= maxDays; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dayName = DAY_NAMES[d.getDay()];
          const cfg = data.openingHours?.[dayName];
          if (cfg && !cfg.closed) dates.push(d.toISOString().split('T')[0]);
        }
        setAvailableDates(dates);
      });
  }, [slug]);

  useEffect(() => {
    if (!selectedDate || !shop) return;
    setSlotsLoading(true);
    const p = new URLSearchParams({ date: selectedDate });
    if (selectedBarber) p.set('barberId', selectedBarber.id);
    fetch(`/api/public/${slug}/availability?${p}`)
      .then(r => r.json())
      .then(data => { setSlots(data.slots ?? []); setSlotsLoading(false); });
  }, [selectedDate, selectedBarber, slug, shop]);

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getDate()} de ${MONTH_NAMES[dt.getMonth()]}`;
  };

  const handlePhoneContinue = async () => {
    if (!phoneInput.trim()) return;
    setPhoneLoading(true);
    const res = await fetch(`/api/public/${slug}/lookup?phone=${encodeURIComponent(phoneInput.trim())}`);
    const data = await res.json();
    setPhoneLoading(false);
    setPhoneChecked(true);
    if (data.found) {
      setFoundClient({ clientId: data.clientId, name: data.name, loyaltyPoints: data.loyaltyPoints });
      setIsNewClient(false);
    } else {
      setFoundClient(null);
      setIsNewClient(true);
    }
  };

  const handleProceedToBooking = () => {
    if (foundClient || (isNewClient && newName.trim())) {
      setStep('service');
    }
  };

  const handleSubmit = async (depositPaid: boolean) => {
    setSubmitting(true);
    const clientName = foundClient ? foundClient.name : newName.trim();
    const res = await fetch(`/api/public/${slug}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phoneInput.trim(),
        name: clientName,
        barberId: selectedBarber?.id ?? null,
        serviceId: selectedService?.id ?? null,
        date: selectedDate,
        time: selectedTime,
        notes: notes.trim() || null,
        depositPaid,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) {
      setResultClientId(data.clientId);
      setDepositPaidResult(depositPaid);
      setStep('done');
    }
  };

  const copyPhone = async () => {
    if (!shop?.paymentPhone) return;
    await navigator.clipboard.writeText(shop.paymentPhone);
    setPhoneCopied(true);
    setTimeout(() => setPhoneCopied(false), 2000);
  };

  if (shopNotFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ color: '#e5e5e5', fontSize: 18, fontWeight: 700 }}>Barbería no encontrada</p>
        <p style={{ color: '#666', fontSize: 14 }}>El enlace que usaste no corresponde a ninguna barbería registrada.</p>
        <a href="/" style={{ color: '#C9A84C', fontSize: 14 }}>Volver al inicio</a>
      </div>
    );
  }

  if (!shop) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#555' }}>Cargando...</p>
      </div>
    );
  }

  const progressSteps: Step[] = ['service', 'barber', 'date', 'time'];
  const stepIndex = progressSteps.indexOf(step as typeof progressSteps[0]);

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

      {/* Progress bar — steps service/barber/date/time */}
      {stepIndex >= 0 && step !== 'done' && (
        <div style={{ display: 'flex', gap: 4, padding: '20px 24px 0', maxWidth: 560, margin: '0 auto' }}>
          {progressSteps.map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= stepIndex ? gold : '#2a2a2a',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      )}

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px' }}>

        {/* ── STEP: PHONE ── */}
        {step === 'phone' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>¿Cuál es tu número de WhatsApp?</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Usamos tu número para guardar tu historial y puntos de fidelización.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                value={phoneInput}
                onChange={e => { setPhoneInput(e.target.value); setPhoneChecked(false); setFoundClient(null); setIsNewClient(false); }}
                onKeyDown={e => e.key === 'Enter' && handlePhoneContinue()}
                placeholder="Ej: 987 654 321"
                type="tel"
                style={{
                  width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a',
                  borderRadius: 8, padding: '14px', color: '#e5e5e5', fontSize: 16,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />

              {!phoneChecked && (
                <button
                  onClick={handlePhoneContinue}
                  disabled={!phoneInput.trim() || phoneLoading}
                  style={{
                    background: !phoneInput.trim() || phoneLoading ? '#333' : gold,
                    color: '#0a0a0a', fontWeight: 700, padding: '14px', borderRadius: 8,
                    border: 'none', cursor: !phoneInput.trim() || phoneLoading ? 'not-allowed' : 'pointer',
                    fontSize: 16, width: '100%',
                  }}>
                  {phoneLoading ? 'Buscando...' : 'Continuar'}
                </button>
              )}

              {phoneChecked && foundClient && (
                <div>
                  <div style={{ background: '#0d1f0d', border: '1px solid #22c55e44', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#22c55e', fontSize: 15 }}>
                      ¡Hola {foundClient.name}! 👋
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#aaa' }}>
                      Tienes {foundClient.loyaltyPoints}/5 sellos acumulados
                    </p>
                  </div>
                  <button onClick={handleProceedToBooking} style={{
                    background: gold, color: '#0a0a0a', fontWeight: 700, padding: '14px', borderRadius: 8,
                    border: 'none', cursor: 'pointer', fontSize: 16, width: '100%',
                  }}>
                    Elegir servicio →
                  </button>
                </div>
              )}

              {phoneChecked && isNewClient && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#1a140a', border: '1px solid #C9A84C44', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#C9A84C' }}>¡Bienvenido! ¿Cuál es tu nombre?</p>
                  </div>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && newName.trim() && handleProceedToBooking()}
                    placeholder="Tu nombre completo *"
                    autoFocus
                    style={{
                      width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a',
                      borderRadius: 8, padding: '14px', color: '#e5e5e5', fontSize: 15,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={handleProceedToBooking}
                    disabled={!newName.trim()}
                    style={{
                      background: !newName.trim() ? '#333' : gold,
                      color: '#0a0a0a', fontWeight: 700, padding: '14px', borderRadius: 8,
                      border: 'none', cursor: !newName.trim() ? 'not-allowed' : 'pointer',
                      fontSize: 16, width: '100%',
                    }}>
                    Continuar →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP: SERVICE ── */}
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
                    color: '#e5e5e5', textAlign: 'left', width: '100%',
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
                style={{ background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 12, padding: '14px', cursor: 'pointer', color: '#666', fontSize: 14 }}>
                Continuar sin elegir servicio
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: BARBER ── */}
        {step === 'barber' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>¿Con quién prefieres?</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Elige un barbero o cualquiera disponible</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {shop.barbers.map(b => (
                <button key={b.id} onClick={() => { setSelectedBarber(b); setStep('date'); }}
                  style={{
                    ...cardStyle, padding: '16px 20px', cursor: 'pointer', border: '1px solid #2a2a2a',
                    display: 'flex', alignItems: 'center', gap: 14, color: '#e5e5e5', width: '100%',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = gold)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✂️</div>
                  <span style={{ fontWeight: 600 }}>{b.name}</span>
                </button>
              ))}
              <button onClick={() => { setSelectedBarber(null); setStep('date'); }}
                style={{ background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 12, padding: '14px', cursor: 'pointer', color: '#666', fontSize: 14 }}>
                Cualquier barbero disponible
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: DATE ── */}
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

        {/* ── STEP: TIME ── */}
        {step === 'time' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>¿A qué hora?</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
              {formatDate(selectedDate)}{selectedBarber ? ` · ${selectedBarber.name}` : ''}
            </p>
            {slotsLoading ? (
              <p style={{ color: '#555', textAlign: 'center', padding: 32 }}>Verificando disponibilidad...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                {slots.map(slot => (
                  <button key={slot.time} disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
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

            {selectedTime && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: '#aaa', display: 'block', marginBottom: 6 }}>Nota para el barbero (opcional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Alguna indicación especial..."
                  rows={2}
                  style={{
                    width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a',
                    borderRadius: 8, padding: '12px 14px', color: '#e5e5e5', fontSize: 14,
                    outline: 'none', resize: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {selectedTime && (
              <button
                onClick={() => shop.depositEnabled ? setStep('payment') : handleSubmit(false)}
                disabled={submitting}
                style={{
                  background: submitting ? '#333' : gold,
                  color: '#0a0a0a', fontWeight: 700, padding: '14px', borderRadius: 8,
                  border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: 16, width: '100%',
                }}>
                {submitting ? 'Enviando...' : shop.depositEnabled ? 'Continuar al pago →' : 'Confirmar reserva'}
              </button>
            )}

            <button onClick={() => setStep('date')} style={{ marginTop: 16, background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14 }}>
              ← Cambiar día
            </button>
          </div>
        )}

        {/* ── STEP: PAYMENT ── */}
        {step === 'payment' && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Paga el anticipo</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
              Para confirmar tu cita, paga el anticipo de{' '}
              <strong style={{ color: gold }}>S/{Number(shop.depositAmount ?? 0).toFixed(0)}</strong>{' '}
              por {shop.paymentMethodLabel ?? 'Yape'}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* QR de imagen */}
              {shop.paymentQrUrl && (
                <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
                  <p style={{ margin: '0 0 14px', fontSize: 13, color: '#aaa' }}>
                    Escanea el código QR y paga S/{Number(shop.depositAmount ?? 0).toFixed(0)}
                  </p>
                  <img
                    src={shop.paymentQrUrl}
                    alt={`QR ${shop.paymentMethodLabel ?? 'Yape'}`}
                    style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto', display: 'block', background: '#fff', borderRadius: 8, padding: 8 }}
                  />
                </div>
              )}

              {/* Número de teléfono */}
              {shop.paymentPhone && (
                <div style={{ ...cardStyle, padding: 20 }}>
                  {shop.paymentQrUrl && (
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#aaa' }}>O también puedes enviar por {shop.paymentMethodLabel ?? 'Yape'}:</p>
                  )}
                  {!shop.paymentQrUrl && (
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#aaa' }}>Envía por {shop.paymentMethodLabel ?? 'Yape'} al número:</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>📱 {shop.paymentPhone}</span>
                    <button
                      onClick={copyPhone}
                      style={{
                        background: phoneCopied ? '#22c55e20' : '#2a2a2a',
                        border: `1px solid ${phoneCopied ? '#22c55e30' : '#3a3a3a'}`,
                        borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                        color: phoneCopied ? '#22c55e' : '#aaa', fontSize: 13, fontWeight: 600,
                      }}>
                      {phoneCopied ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Instrucción */}
              <p style={{ margin: 0, fontSize: 13, color: '#555', textAlign: 'center' }}>
                Una vez que realices el pago, presiona el botón de abajo.
              </p>

              {/* Botón: ya pagué */}
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                style={{
                  background: submitting ? '#333' : gold,
                  color: '#0a0a0a', fontWeight: 700, padding: '16px', borderRadius: 10,
                  border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 16, width: '100%',
                }}>
                {submitting ? 'Enviando...' : `Ya pagué S/${Number(shop.depositAmount ?? 0).toFixed(0)} →`}
              </button>

              {/* Botón: pagar el día (solo si no es obligatorio) */}
              {!shop.depositMandatory && (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  style={{
                    background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 10,
                    padding: '14px', cursor: 'pointer', color: '#666', fontSize: 14, width: '100%',
                  }}>
                  Prefiero pagar todo el día de mi cita
                </button>
              )}

              <button onClick={() => setStep('time')} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: 13 }}>
                ← Volver a elegir hora
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', paddingTop: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 26, marginBottom: 8 }}>¡Reserva enviada!</h2>

            {depositPaidResult ? (
              <>
                <p style={{ color: '#aaa', fontSize: 15, marginBottom: 4 }}>
                  Tu anticipo está <strong style={{ color: '#a855f7' }}>pendiente de verificación</strong>.
                </p>
                <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
                  La barbería verificará tu pago y confirmará la cita a la brevedad.
                </p>
              </>
            ) : (
              <>
                <p style={{ color: '#aaa', fontSize: 15, marginBottom: 4 }}>
                  Tu cita está <strong style={{ color: gold }}>pendiente de confirmación</strong>.
                </p>
                <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
                  La barbería confirmará tu reserva a la brevedad.
                </p>
              </>
            )}

            {/* Loyalty summary */}
            {(foundClient || isNewClient) && (
              <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 10, padding: 16, marginBottom: 20, textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#aaa' }}>
                  Tu tarjeta de fidelización:{' '}
                  <strong style={{ color: gold }}>
                    {foundClient ? foundClient.loyaltyPoints : 0}/5 sellos
                  </strong>
                </p>
              </div>
            )}

            <p style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>Guarda tu link personal:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href={`/${slug}/mi-cuenta/${resultClientId}`}
                style={{
                  display: 'block', background: '#161616', border: `1px solid ${gold}`,
                  borderRadius: 8, padding: '14px', color: gold, textDecoration: 'none', fontWeight: 600,
                }}>
                Ver mis citas y puntos
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
