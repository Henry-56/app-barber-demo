'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, MessageCircle, Loader2, CheckCircle, X } from 'lucide-react';
import { generateWhatsAppLink, fillTemplate, defaultTemplates } from '@/src/lib/whatsapp-manual';

type Client = {
  id: string; name: string; phone: string; notes?: string;
  lastVisitAt: string | null; totalVisits: number; noShowCount: number;
  isInactive: boolean; loyaltyPoints: number; loyaltyRedeemed: number;
  createdAt: string;
};

type Shop = { name: string; slug: string; whatsappTemplateBienvenida?: string };

type VisitModalStep = 'phone' | 'visit' | 'success';

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

function VisitModal({
  shop,
  barbers,
  services,
  onClose,
  onSuccess,
}: {
  shop: Shop;
  barbers: { id: string; name: string }[];
  services: { id: string; name: string; price: string }[];
  onClose: () => void;
  onSuccess: (client: Client) => void;
}) {
  const [step, setStep] = useState<VisitModalStep>('phone');
  const [phone, setPhone] = useState('');
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [newName, setNewName] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneSearched, setPhoneSearched] = useState(false);

  const [serviceName, setServiceName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [price, setPrice] = useState('');
  const [barberId, setBarberId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const [resultClient, setResultClient] = useState<Client | null>(null);
  const [resultIsNew, setResultIsNew] = useState(false);
  const [earnedFree, setEarnedFree] = useState(false);

  const inputStyle = "w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder:text-[#555] outline-none transition-all";
  const inputBase = { backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' };

  const handlePhoneSearch = async () => {
    if (!phone.trim()) return;
    setPhoneLoading(true);
    setPhoneSearched(false);
    setFoundClient(null);
    setIsNewClient(false);
    const res = await fetch(`/api/v2/clients?phone=${encodeURIComponent(phone.trim())}`);
    const data = await res.json();
    setPhoneLoading(false);
    setPhoneSearched(true);
    if (data) {
      setFoundClient(data);
      setIsNewClient(false);
    } else {
      setFoundClient(null);
      setIsNewClient(true);
    }
  };

  const handleServiceSelect = (svc: { id: string; name: string; price: string }) => {
    setServiceId(svc.id);
    setServiceName(svc.name);
    setPrice(svc.price);
  };

  const canProceedToVisit = phoneSearched && (foundClient !== null || (isNewClient && newName.trim() !== ''));

  const handleSubmitVisit = async () => {
    setSubmitLoading(true);
    setError('');
    const res = await fetch('/api/dashboard/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone.trim(),
        name: foundClient ? foundClient.name : newName.trim(),
        serviceName: serviceName || null,
        serviceId: serviceId || null,
        price: price || null,
        barberId: barberId || null,
      }),
    });
    const data = await res.json();
    setSubmitLoading(false);

    if (!res.ok || data.error) {
      setError(data.error ?? 'Error al registrar la visita');
      return;
    }

    setResultClient(data.client);
    setResultIsNew(data.isNew);
    setEarnedFree(data.earnedFree);
    onSuccess(data.client);
    setStep('success');
  };

  const welcomeMessage = resultClient
    ? fillTemplate(shop.whatsappTemplateBienvenida ?? defaultTemplates.bienvenida, {
        clientName: resultClient.name,
        shopName: shop.name,
        bookingUrl: `https://app-barber-demo.vercel.app/${shop.slug}/reservar`,
      })
    : '';

  const welcomeLink = resultClient
    ? generateWhatsAppLink(resultClient.phone, welcomeMessage)
    : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-sm rounded-2xl border" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#2a2a2a' }}>
          <h2 className="text-base font-bold text-white">
            {step === 'phone' && 'Registrar visita'}
            {step === 'visit' && (foundClient ? `Visita de ${foundClient.name}` : 'Nueva visita')}
            {step === 'success' && 'Visita registrada'}
          </h2>
          <button onClick={onClose} style={{ color: '#555' }}><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          {/* ── STEP: PHONE ── */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#aaa' }}>Número de WhatsApp del cliente</label>
                <div className="flex gap-2">
                  <input
                    className={inputStyle}
                    style={inputBase}
                    placeholder="Ej: 987 654 321"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneSearched(false); setFoundClient(null); setIsNewClient(false); }}
                    onKeyDown={e => e.key === 'Enter' && handlePhoneSearch()}
                    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                  />
                  <button
                    onClick={handlePhoneSearch}
                    disabled={!phone.trim() || phoneLoading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold shrink-0 flex items-center gap-1.5"
                    style={{ backgroundColor: '#C9A84C', color: '#0a0a0a', opacity: (!phone.trim() || phoneLoading) ? 0.5 : 1 }}>
                    {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                  </button>
                </div>
              </div>

              {/* Found client */}
              {phoneSearched && foundClient && (
                <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#0a0a0a', border: '1px solid #22c55e33' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#22c55e' }} />
                    <span className="text-sm font-semibold text-white">{foundClient.name}</span>
                  </div>
                  <div className="text-xs space-y-0.5" style={{ color: '#666' }}>
                    <p>{foundClient.totalVisits} visitas · Última: {foundClient.lastVisitAt ? new Date(foundClient.lastVisitAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) : '—'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span>Sellos:</span>
                      <LoyaltyDots points={foundClient.loyaltyPoints} />
                    </div>
                  </div>
                </div>
              )}

              {/* New client */}
              {phoneSearched && isNewClient && (
                <div className="space-y-3">
                  <div className="rounded-xl p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #C9A84C33' }}>
                    <p className="text-xs" style={{ color: '#C9A84C' }}>Cliente nuevo — ingresa su nombre</p>
                  </div>
                  <input
                    className={inputStyle}
                    style={inputBase}
                    placeholder="Nombre completo *"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    autoFocus
                    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#1c1c1c', color: '#a0a0a0' }}>
                  Cancelar
                </button>
                <button
                  onClick={() => setStep('visit')}
                  disabled={!canProceedToVisit}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: canProceedToVisit ? '#C9A84C' : '#333', color: canProceedToVisit ? '#0a0a0a' : '#555' }}>
                  {foundClient ? `Registrar visita a ${foundClient.name.split(' ')[0]}` : 'Continuar'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: VISIT FORM ── */}
          {step === 'visit' && (
            <div className="space-y-4">
              {/* Service buttons */}
              {services.length > 0 && (
                <div>
                  <label className="text-xs mb-2 block" style={{ color: '#aaa' }}>Servicio</label>
                  <div className="flex flex-wrap gap-2">
                    {services.map(s => (
                      <button key={s.id} onClick={() => handleServiceSelect(s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor: serviceId === s.id ? '#C9A84C' : '#1c1c1c',
                          color: serviceId === s.id ? '#0a0a0a' : '#a0a0a0',
                          border: `1px solid ${serviceId === s.id ? '#C9A84C' : '#2a2a2a'}`,
                        }}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#aaa' }}>Servicio (texto libre)</label>
                <input className={inputStyle} style={inputBase} placeholder="Ej: Corte clásico"
                  value={serviceName} onChange={e => setServiceName(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
              </div>

              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#aaa' }}>Precio cobrado (S/)</label>
                <input className={inputStyle} style={inputBase} placeholder="Ej: 20"
                  type="number" value={price} onChange={e => setPrice(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
              </div>

              {barbers.length > 0 && (
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: '#aaa' }}>Barbero</label>
                  <select value={barberId} onChange={e => setBarberId(e.target.value)}
                    className={inputStyle} style={{ ...inputBase, cursor: 'pointer' }}>
                    <option value="">Cualquiera</option>
                    {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}

              {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep('phone')} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#1c1c1c', color: '#a0a0a0' }}>
                  Atrás
                </button>
                <button onClick={handleSubmitVisit} disabled={submitLoading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}>
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Completar visita'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: SUCCESS ── */}
          {step === 'success' && resultClient && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-semibold text-white">Visita registrada</p>
                {earnedFree && (
                  <p className="text-sm mt-1" style={{ color: '#C9A84C' }}>🎉 ¡{resultClient.name} completó 5 cortes! Próximo gratis.</p>
                )}
              </div>

              {resultIsNew && (
                <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: '#0a0a0a', borderColor: '#C9A84C44' }}>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">🎉 Cliente nuevo registrado</p>
                    <p className="text-xs" style={{ color: '#aaa' }}>¿Enviarle el mensaje de bienvenida con el link para agendar?</p>
                  </div>
                  <a href={welcomeLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: '#25d366', color: '#fff' }}>
                    <MessageCircle className="w-4 h-4" />
                    Enviar bienvenida por WhatsApp ↗
                  </a>
                </div>
              )}

              <button onClick={onClose} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: '#1c1c1c', color: '#a0a0a0' }}>
                Cerrar
              </button>
            </div>
          )}
        </div>
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
  const [shop, setShop] = useState<Shop | null>(null);
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; price: string }[]>([]);

  const fetchClients = useCallback(async () => {
    const res = await fetch(`/api/v2/clients?q=${encodeURIComponent(search)}&filter=${filter}`);
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  useEffect(() => {
    fetch('/api/dashboard/settings').then(r => r.json()).then(data => {
      setShop({ name: data.name, slug: data.slug, whatsappTemplateBienvenida: data.whatsappTemplateBienvenida });
    });
    fetch('/api/v2/barbers').then(r => r.json()).then(setBarbers);
    fetch('/api/dashboard/settings/services').then(r => r.json()).then(setServices);
  }, []);

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
          <Plus className="w-4 h-4" /> Registrar visita
        </button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#555555' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-[#555555] outline-none"
            style={{ backgroundColor: '#161616', border: '1px solid #2a2a2a' }}
            onFocus={e => (e.target.style.borderColor = '#C9A84C')}
            onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: '#161616' }} />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <p className="text-sm" style={{ color: '#555555' }}>
            {search ? 'No se encontraron clientes con esa búsqueda.' : 'Aún no hay clientes. ¡Registra el primero!'}
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

      {showModal && shop && (
        <VisitModal
          shop={shop}
          barbers={barbers}
          services={services}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchClients(); }}
        />
      )}
    </div>
  );
}
