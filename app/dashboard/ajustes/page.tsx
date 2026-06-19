'use client';

import { useState, useEffect } from 'react';

type Service = { id: string; name: string; price: string; durationMinutes: number; isActive: boolean; sortOrder: number };
type Shop = {
  id: string; name: string; slug: string; slugChanged: boolean;
  description: string | null; address: string | null; city: string | null; phone: string | null;
  coverPhoto: string | null; appointmentDuration: number;
  maxAdvanceDays: number; minAdvanceHours: number;
  openingHours: Record<string, { open: string; close: string; closed: boolean }> | null;
  whatsappTemplateConfirmacion: string | null;
  whatsappTemplateRecuperacion: string | null;
  whatsappTemplateFidelizacion: string | null;
  whatsappTemplateBienvenida: string | null;
  depositEnabled: boolean | null;
  depositAmount: string | null;
  depositMandatory: boolean | null;
  paymentQrUrl: string | null;
  paymentPhone: string | null;
  paymentMethodLabel: string | null;
};

const gold = '#C9A84C';
const cardStyle = { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 12, padding: 24, marginBottom: 20 };
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a',
  borderRadius: 8, padding: '10px 14px', color: '#e5e5e5', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { fontSize: 13, color: '#aaa', display: 'block', marginBottom: 6 };

const DAY_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DAY_LABELS: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
};
const DEFAULT_HOURS = {
  lunes: { open: '08:00', close: '20:00', closed: false },
  martes: { open: '08:00', close: '20:00', closed: false },
  miercoles: { open: '08:00', close: '20:00', closed: false },
  jueves: { open: '08:00', close: '20:00', closed: false },
  viernes: { open: '08:00', close: '20:00', closed: false },
  sabado: { open: '08:00', close: '20:00', closed: false },
  domingo: { open: '08:00', close: '20:00', closed: true },
};

type Tab = 'perfil' | 'servicios' | 'horarios' | 'reservas' | 'whatsapp' | 'anticipo';

export default function AjustesPage() {
  const [tab, setTab] = useState<Tab>('perfil');
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [slug, setSlug] = useState('');

  // Reservation settings
  const [appointmentDuration, setAppointmentDuration] = useState(30);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(14);
  const [minAdvanceHours, setMinAdvanceHours] = useState(2);

  // Hours
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(DEFAULT_HOURS);

  // WhatsApp templates
  const [tplConfirmacion, setTplConfirmacion] = useState('');
  const [tplRecuperacion, setTplRecuperacion] = useState('');
  const [tplFidelizacion, setTplFidelizacion] = useState('');
  const [tplBienvenida, setTplBienvenida] = useState('');

  // Anticipo
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMandatory, setDepositMandatory] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentMethodLabel, setPaymentMethodLabel] = useState('Yape');
  const [qrUploading, setQrUploading] = useState(false);
  const [depositError, setDepositError] = useState('');

  // New service form
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');
  const [newSvcDuration, setNewSvcDuration] = useState('30');

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/settings').then(r => r.json()),
      fetch('/api/dashboard/settings/services').then(r => r.json()),
    ]).then(([s, svcs]) => {
      setShop(s);
      setName(s.name ?? '');
      setDescription(s.description ?? '');
      setAddress(s.address ?? '');
      setCity(s.city ?? '');
      setPhone(s.phone ?? '');
      setSlug(s.slug ?? '');
      setAppointmentDuration(s.appointmentDuration ?? 30);
      setMaxAdvanceDays(s.maxAdvanceDays ?? 14);
      setMinAdvanceHours(s.minAdvanceHours ?? 2);
      setHours(s.openingHours ?? DEFAULT_HOURS);
      setTplConfirmacion(s.whatsappTemplateConfirmacion ?? '');
      setTplRecuperacion(s.whatsappTemplateRecuperacion ?? '');
      setTplFidelizacion(s.whatsappTemplateFidelizacion ?? '');
      setTplBienvenida(s.whatsappTemplateBienvenida ?? '');
      setDepositEnabled(s.depositEnabled ?? false);
      setDepositAmount(s.depositAmount ? String(Number(s.depositAmount)) : '');
      setDepositMandatory(s.depositMandatory ?? false);
      setPaymentQrUrl(s.paymentQrUrl ?? '');
      setPaymentPhone(s.paymentPhone ?? '');
      setPaymentMethodLabel(s.paymentMethodLabel ?? 'Yape');
      setServices(svcs);
    });
  }, []);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveProfile = async () => {
    setSaving(true);
    await fetch('/api/dashboard/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, address, city, phone, slug }),
    });
    setSaving(false);
    showSaved();
  };

  const saveReservations = async () => {
    setSaving(true);
    await fetch('/api/dashboard/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentDuration, maxAdvanceDays, minAdvanceHours }),
    });
    setSaving(false);
    showSaved();
  };

  const saveHours = async () => {
    setSaving(true);
    await fetch('/api/dashboard/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openingHours: hours }),
    });
    setSaving(false);
    showSaved();
  };

  const saveTemplates = async () => {
    setSaving(true);
    await fetch('/api/dashboard/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        whatsappTemplateConfirmacion: tplConfirmacion,
        whatsappTemplateRecuperacion: tplRecuperacion,
        whatsappTemplateFidelizacion: tplFidelizacion,
        whatsappTemplateBienvenida: tplBienvenida,
      }),
    });
    setSaving(false);
    showSaved();
  };

  const saveDeposit = async () => {
    setDepositError('');
    if (depositEnabled && !paymentQrUrl && !paymentPhone) {
      setDepositError('Configura al menos un método de pago (QR o número de teléfono) para activar el anticipo.');
      return;
    }
    setSaving(true);
    await fetch('/api/dashboard/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositEnabled,
        depositAmount: depositAmount ? Number(depositAmount) : 0,
        depositMandatory,
        paymentQrUrl,
        paymentPhone,
        paymentMethodLabel,
      }),
    });
    setSaving(false);
    showSaved();
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setDepositError('La imagen debe ser menor a 3MB');
      return;
    }
    setQrUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/dashboard/upload-qr', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setPaymentQrUrl(data.url);
      else setDepositError(data.error ?? 'Error al subir imagen');
    } catch {
      setDepositError('Error al subir imagen');
    }
    setQrUploading(false);
    e.target.value = '';
  };

  const addService = async () => {
    if (!newSvcName || !newSvcPrice) return;
    const res = await fetch('/api/dashboard/settings/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSvcName, price: Number(newSvcPrice), durationMinutes: Number(newSvcDuration) }),
    });
    const svc = await res.json();
    setServices(prev => [...prev, svc]);
    setNewSvcName(''); setNewSvcPrice(''); setNewSvcDuration('30');
  };

  const toggleService = async (svc: Service) => {
    await fetch(`/api/dashboard/settings/services/${svc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !svc.isActive }),
    });
    setServices(prev => prev.map(s => s.id === svc.id ? { ...s, isActive: !s.isActive } : s));
  };

  const deleteService = async (id: string) => {
    await fetch(`/api/dashboard/settings/services/${id}`, { method: 'DELETE' });
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'servicios', label: 'Servicios' },
    { key: 'horarios', label: 'Horarios' },
    { key: 'reservas', label: 'Reservas' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'anticipo', label: 'Anticipo' },
  ];

  if (!shop) {
    return <div style={{ padding: 32, color: '#555' }}>Cargando ajustes...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 680, color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Ajustes</h1>
        {shop.slug && (
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#666' }}>
            Página pública:{' '}
            <a href={`/${shop.slug}`} target="_blank" rel="noreferrer" style={{ color: gold }}>
              /{shop.slug}
            </a>
          </p>
        )}
      </div>

      {saved && (
        <div style={{ background: '#0d2a1a', border: '1px solid #10b981', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#10b981', fontSize: 14 }}>
          ✓ Guardado correctamente
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #2a2a2a', paddingBottom: 0, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '10px 16px', fontSize: 14, fontWeight: tab === t.key ? 700 : 400,
            color: tab === t.key ? gold : '#666', whiteSpace: 'nowrap',
            borderBottom: tab === t.key ? `2px solid ${gold}` : '2px solid transparent',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PERFIL */}
      {tab === 'perfil' && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>Información de la barbería</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nombre de la barbería</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>
                Slug (URL){' '}
                {shop.slugChanged && <span style={{ color: '#ef4444', fontSize: 11 }}>· Ya no se puede cambiar</span>}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#555', fontSize: 14 }}>barberflow.app/</span>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  disabled={shop.slugChanged}
                  style={{ ...inputStyle, opacity: shop.slugChanged ? 0.5 : 1 }}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <input value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Dirección</label>
              <input value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
            </div>
            <button onClick={saveProfile} disabled={saving} style={{
              background: gold, color: '#0a0a0a', fontWeight: 700, padding: '12px',
              borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
            }}>
              {saving ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        </div>
      )}

      {/* SERVICIOS */}
      {tab === 'servicios' && (
        <div>
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Servicios</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#666' }}>Los servicios aparecen en tu página pública de reservas</p>
            {services.length === 0 ? (
              <p style={{ color: '#555', fontSize: 14 }}>Sin servicios aún</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {services.map(svc => (
                  <div key={svc.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 14px',
                    opacity: svc.isActive ? 1 : 0.5,
                  }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{svc.name}</span>
                      <span style={{ marginLeft: 12, color: gold }}>S/ {Number(svc.price).toFixed(0)}</span>
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>{svc.durationMinutes} min</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleService(svc)} style={{
                        background: 'transparent', border: `1px solid ${svc.isActive ? '#2a2a2a' : '#10b981'}`,
                        borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                        color: svc.isActive ? '#666' : '#10b981', fontSize: 12,
                      }}>
                        {svc.isActive ? 'Ocultar' : 'Activar'}
                      </button>
                      <button onClick={() => deleteService(svc.id)} style={{
                        background: 'transparent', border: '1px solid #ef4444', borderRadius: 6,
                        padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: 12,
                      }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Agregar servicio</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input value={newSvcName} onChange={e => setNewSvcName(e.target.value)} placeholder="Ej: Corte clásico" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Precio (S/)</label>
                <input value={newSvcPrice} onChange={e => setNewSvcPrice(e.target.value)} type="number" min="0" placeholder="25" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Duración (min)</label>
                <input value={newSvcDuration} onChange={e => setNewSvcDuration(e.target.value)} type="number" min="15" step="15" style={inputStyle} />
              </div>
            </div>
            <button onClick={addService} disabled={!newSvcName || !newSvcPrice} style={{
              background: (!newSvcName || !newSvcPrice) ? '#333' : gold,
              color: '#0a0a0a', fontWeight: 700, padding: '10px 20px',
              borderRadius: 8, border: 'none', cursor: (!newSvcName || !newSvcPrice) ? 'not-allowed' : 'pointer', fontSize: 14,
            }}>
              + Agregar
            </button>
          </div>
        </div>
      )}

      {/* HORARIOS */}
      {tab === 'horarios' && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Horarios de atención</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#666' }}>Define los días y horas que atiendes clientes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DAY_ORDER.map(day => {
              const cfg = hours[day] ?? { open: '08:00', close: '20:00', closed: false };
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 90, fontSize: 14, color: cfg.closed ? '#555' : '#e5e5e5' }}>{DAY_LABELS[day]}</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!cfg.closed}
                      onChange={() => setHours(h => ({ ...h, [day]: { ...cfg, closed: !cfg.closed } }))}
                      style={{ accentColor: gold }}
                    />
                    <span style={{ fontSize: 13, color: '#aaa' }}>Abierto</span>
                  </label>
                  {!cfg.closed && (
                    <>
                      <input type="time" value={cfg.open}
                        onChange={e => setHours(h => ({ ...h, [day]: { ...cfg, open: e.target.value } }))}
                        style={{ ...inputStyle, width: 110 }}
                      />
                      <span style={{ color: '#555', fontSize: 14 }}>–</span>
                      <input type="time" value={cfg.close}
                        onChange={e => setHours(h => ({ ...h, [day]: { ...cfg, close: e.target.value } }))}
                        style={{ ...inputStyle, width: 110 }}
                      />
                    </>
                  )}
                  {cfg.closed && <span style={{ fontSize: 13, color: '#555' }}>Cerrado</span>}
                </div>
              );
            })}
          </div>
          <button onClick={saveHours} disabled={saving} style={{
            marginTop: 20, background: gold, color: '#0a0a0a', fontWeight: 700, padding: '12px 24px',
            borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
          }}>
            {saving ? 'Guardando...' : 'Guardar horarios'}
          </button>
        </div>
      )}

      {/* RESERVAS */}
      {tab === 'reservas' && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Configuración de reservas</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#666' }}>Controla cómo los clientes pueden agendar citas online</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Duración de cita por defecto (minutos)</label>
              <select value={appointmentDuration} onChange={e => setAppointmentDuration(Number(e.target.value))}
                style={{ ...inputStyle }}>
                {[15, 20, 30, 45, 60, 90].map(v => (
                  <option key={v} value={v}>{v} min</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Máximo de días en advance para reservar</label>
              <input type="number" value={maxAdvanceDays} min={1} max={60}
                onChange={e => setMaxAdvanceDays(Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mínimo de horas de anticipación</label>
              <input type="number" value={minAdvanceHours} min={0} max={48}
                onChange={e => setMinAdvanceHours(Number(e.target.value))} style={inputStyle} />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#555' }}>Horas mínimas antes de la cita para que el cliente pueda reservar</p>
            </div>
            <button onClick={saveReservations} disabled={saving} style={{
              background: gold, color: '#0a0a0a', fontWeight: 700, padding: '12px',
              borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
            }}>
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </div>
      )}

      {/* WHATSAPP */}
      {tab === 'whatsapp' && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Plantillas WhatsApp</h2>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#666' }}>
            Estas plantillas se usan para los mensajes Click-to-Send. Puedes usar:{' '}
            <code style={{ background: '#2a2a2a', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
              {'{{clientName}}, {{date}}, {{time}}, {{service}}, {{barberName}}, {{shopName}}, {{bookingUrl}}'}
            </code>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {[
              { label: 'Confirmación de cita', value: tplConfirmacion, set: setTplConfirmacion },
              { label: 'Recuperación (cliente inactivo)', value: tplRecuperacion, set: setTplRecuperacion },
              { label: 'Fidelización (corte gratis)', value: tplFidelizacion, set: setTplFidelizacion },
              { label: 'Bienvenida (primera visita)', value: tplBienvenida, set: setTplBienvenida },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label style={labelStyle}>{label}</label>
                <textarea value={value} onChange={e => set(e.target.value)} rows={4}
                  placeholder="Escribe tu plantilla aquí..."
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            ))}
            <button onClick={saveTemplates} disabled={saving} style={{
              background: gold, color: '#0a0a0a', fontWeight: 700, padding: '12px',
              borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
            }}>
              {saving ? 'Guardando...' : 'Guardar plantillas'}
            </button>
          </div>
        </div>
      )}

      {/* ANTICIPO */}
      {tab === 'anticipo' && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Cobro de anticipo al agendar</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#666' }}>
            El cliente paga directo a tu Yape o Plin. Tú confirmas el pago manualmente desde la Agenda.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Toggle principal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#0a0a0a', borderRadius: 10, border: '1px solid #2a2a2a' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Activar cobro de anticipo</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#666' }}>
                  Se mostrará al cliente al agendar desde tu página pública
                </p>
              </div>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: depositEnabled ? gold : '#555' }}>
                  {depositEnabled ? 'Activo' : 'Inactivo'}
                </span>
                <input type="checkbox" checked={depositEnabled} onChange={e => setDepositEnabled(e.target.checked)}
                  style={{ accentColor: gold, width: 18, height: 18 }} />
              </label>
            </div>

            {depositEnabled && (
              <>
                {/* Monto */}
                <div>
                  <label style={labelStyle}>Monto del anticipo (S/)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#aaa', fontSize: 14 }}>S/</span>
                    <input type="number" value={depositAmount} min="1" step="1"
                      onChange={e => setDepositAmount(e.target.value)}
                      placeholder="Ej: 15"
                      style={{ ...inputStyle, width: 120 }} />
                  </div>
                </div>

                {/* Obligatorio */}
                <div style={{ padding: '14px 16px', background: '#0a0a0a', borderRadius: 10, border: '1px solid #2a2a2a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>¿Es obligatorio pagar para agendar?</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#666' }}>
                        {depositMandatory
                          ? 'El cliente debe pagar el anticipo para confirmar la cita'
                          : 'El cliente puede elegir "pagar el día de la cita"'}
                      </p>
                    </div>
                    <input type="checkbox" checked={depositMandatory} onChange={e => setDepositMandatory(e.target.checked)}
                      style={{ accentColor: gold, width: 18, height: 18 }} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 16 }}>
                  <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Métodos de pago disponibles</p>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: '#666' }}>
                    El cliente verá todos los métodos que configures aquí al mismo tiempo.
                  </p>

                  {/* QR de imagen */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ ...labelStyle, fontWeight: 600 }}>QR de imagen (Yape o Plin)</label>
                    {paymentQrUrl && (
                      <div style={{ marginBottom: 12 }}>
                        <img src={paymentQrUrl} alt="QR de pago" style={{
                          width: 160, height: 160, objectFit: 'contain',
                          border: '1px solid #2a2a2a', borderRadius: 8, background: '#fff', display: 'block',
                        }} />
                        <button type="button" onClick={() => setPaymentQrUrl('')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, marginTop: 6, padding: 0 }}>
                          Quitar imagen
                        </button>
                      </div>
                    )}
                    <label style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8, cursor: qrUploading ? 'wait' : 'pointer',
                      background: '#2a2a2a', fontSize: 13, color: '#aaa', border: 'none',
                    }}>
                      {qrUploading ? 'Subiendo...' : paymentQrUrl ? '↑ Cambiar imagen' : '+ Subir QR'}
                      <input type="file" accept="image/*" onChange={handleQrUpload}
                        disabled={qrUploading} style={{ display: 'none' }} />
                    </label>
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#555' }}>
                      PNG, JPG o WebP · máx. 3MB · Se aloja en Vercel Blob (requiere BLOB_READ_WRITE_TOKEN)
                    </p>
                  </div>

                  {/* Número de teléfono */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ ...labelStyle, fontWeight: 600 }}>Número de teléfono para Yape/Plin</label>
                    <input value={paymentPhone} onChange={e => setPaymentPhone(e.target.value)}
                      placeholder="Ej: 987654321"
                      style={inputStyle} />
                  </div>

                  {/* Label del método */}
                  <div>
                    <label style={labelStyle}>Mostrar al cliente como</label>
                    <select value={paymentMethodLabel} onChange={e => setPaymentMethodLabel(e.target.value)} style={inputStyle}>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                      <option value="Yape o Plin">Yape o Plin</option>
                    </select>
                  </div>
                </div>

                {!paymentQrUrl && !paymentPhone && (
                  <div style={{ background: '#1a1500', border: '1px solid #f59e0b30', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f59e0b' }}>
                    ⚠️ Agrega al menos un método de pago para que los clientes puedan pagar el anticipo.
                  </div>
                )}
              </>
            )}

            {depositError && (
              <div style={{ background: '#1a0505', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444' }}>
                {depositError}
              </div>
            )}

            <button onClick={saveDeposit} disabled={saving} style={{
              background: gold, color: '#0a0a0a', fontWeight: 700, padding: '12px',
              borderRadius: 8, border: 'none', cursor: saving ? 'wait' : 'pointer', fontSize: 14,
            }}>
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
