'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Shield, Clock, CheckCircle, XCircle,
  Calendar, Users, DollarSign, Loader2, ExternalLink,
  AlertTriangle, RefreshCw,
} from 'lucide-react';

type Appointment = {
  id: string;
  scheduledAt: string;
  service: string | null;
  price: number | null;
  status: string;
};

type ShopDetail = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  phone: string | null;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  trialStartedAt: string | null;
  createdAt: string;
  ownerEmail: string;
  ownerName: string;
  citasMes: number;
  totalCitas: number;
  totalClientes: number;
  revenueMes: number;
  lastAppointments: Appointment[];
};

const STATUS_MAP: Record<string, string> = {
  scheduled: 'Agendada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
  pending_confirmation: 'Pendiente',
  pending_payment: 'Pago pend.',
};

const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  trial: { label: 'En Trial', color: '#f59e0b', bg: '#f59e0b20' },
  active: { label: 'Activo', color: '#22c55e', bg: '#22c55e20' },
  paid: { label: 'Activo', color: '#22c55e', bg: '#22c55e20' },
  suspended: { label: 'Suspendido', color: '#ef4444', bg: '#ef444420' },
  cancelled: { label: 'Cancelado', color: '#888', bg: '#55555520' },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { label: status, color: '#888', bg: '#55555520' };
  return (
    <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function ActionBtn({
  label, icon: Icon, color, loading, onClick,
}: {
  label: string; icon: React.ElementType; color: string; loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        : <Icon className="w-4 h-4 shrink-0" />}
      {label}
    </button>
  );
}

export default function ShopDetailPage() {
  const router = useRouter();
  const { shopId } = useParams() as { shopId: string };
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const fetchShop = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/shops/${shopId}`);
    if (res.status === 401) { router.push('/admin/login'); return; }
    if (res.ok) setShop(await res.json());
    setLoading(false);
  }, [shopId, router]);

  useEffect(() => { fetchShop(); }, [fetchShop]);

  async function patch(body: Record<string, unknown>, key: string) {
    setActionKey(key);
    await fetch(`/api/admin/shops/${shopId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setActionKey(null);
    fetchShop();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#7c3aed' }} />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a', color: '#555' }}>
        Barbería no encontrada
      </div>
    );
  }

  const daysLeft = shop.trialEndsAt
    ? Math.ceil((new Date(shop.trialEndsAt).getTime() - Date.now()) / 86_400_000)
    : null;

  const fmt = (date: string) =>
    new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a', color: '#e5e5e5' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b px-6 py-4 flex items-center gap-4"
        style={{ backgroundColor: '#0f0f0f', borderColor: '#1e1e1e' }}
      >
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-sm transition-all hover:text-white"
          style={{ color: '#a0a0a0' }}
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex items-center gap-3 ml-1">
          <span className="text-white font-semibold">{shop.name}</span>
          <StatusBadge status={shop.subscriptionStatus} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={fetchShop} className="p-2 rounded-lg hover:bg-[#1c1c1c]" style={{ color: '#555' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={`/${shop.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-[#1c1c1c] transition-all"
            style={{ color: '#a78bfa' }}
          >
            Ver página <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: 'Citas este mes', value: shop.citasMes, icon: Calendar, color: '#7c3aed' },
            { label: 'Total citas', value: shop.totalCitas, icon: Calendar, color: '#6366f1' },
            { label: 'Clientes', value: shop.totalClientes, icon: Users, color: '#22c55e' },
            { label: 'Revenue/mes', value: `S/ ${Number(shop.revenueMes || 0).toFixed(0)}`, icon: DollarSign, color: '#f59e0b' },
          ] as const).map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-4 border" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-xs" style={{ color: '#a0a0a0' }}>{label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Información */}
          <div className="rounded-xl border p-5" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
            <h3 className="text-sm font-semibold text-white mb-4">Información</h3>
            <dl className="space-y-3 text-sm">
              {([
                ['Nombre', shop.name],
                ['Slug', shop.slug],
                ['Ciudad', shop.city ?? '—'],
                ['Teléfono', shop.phone ?? '—'],
                ['Dueño', shop.ownerName],
                ['Email', shop.ownerEmail],
                ['Plan', shop.plan?.toUpperCase()],
                ['Creada', fmt(shop.createdAt)],
                ...(shop.trialEndsAt ? [['Trial hasta', fmt(shop.trialEndsAt)] as [string, string]] : []),
              ] as [string, string][]).map(([lbl, val]) => (
                <div key={lbl} className="flex items-start gap-2">
                  <dt className="w-24 shrink-0 text-xs" style={{ color: '#555' }}>{lbl}</dt>
                  <dd className="text-white font-medium break-all text-xs">{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Gestión */}
          <div className="rounded-xl border p-5" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
            <h3 className="text-sm font-semibold text-white mb-4">Gestión de cuenta</h3>

            {/* Trial alert */}
            {shop.subscriptionStatus === 'trial' && daysLeft !== null && (
              <div
                className="mb-4 p-3 rounded-lg"
                style={{
                  backgroundColor: daysLeft <= 0 ? '#ef444410' : daysLeft <= 5 ? '#f59e0b10' : '#22c55e10',
                  border: `1px solid ${daysLeft <= 0 ? '#ef444430' : daysLeft <= 5 ? '#f59e0b30' : '#22c55e30'}`,
                }}
              >
                <div
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: daysLeft <= 0 ? '#ef4444' : daysLeft <= 5 ? '#f59e0b' : '#22c55e' }}
                >
                  {daysLeft <= 0
                    ? <AlertTriangle className="w-4 h-4" />
                    : <Clock className="w-4 h-4" />}
                  {daysLeft > 0 ? `${daysLeft} días de trial restantes` : 'Trial vencido'}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <ActionBtn
                label="Extender trial +7 días"
                icon={Clock}
                color="#f59e0b"
                loading={actionKey === 'ext7'}
                onClick={() => patch({ extendTrialDays: 7 }, 'ext7')}
              />
              <ActionBtn
                label="Extender trial +30 días"
                icon={Clock}
                color="#f59e0b"
                loading={actionKey === 'ext30'}
                onClick={() => patch({ extendTrialDays: 30 }, 'ext30')}
              />

              <div className="border-t my-3" style={{ borderColor: '#2a2a2a' }} />

              {shop.subscriptionStatus !== 'active' && shop.subscriptionStatus !== 'paid' && (
                <ActionBtn
                  label="Activar suscripción"
                  icon={CheckCircle}
                  color="#22c55e"
                  loading={actionKey === 'activate'}
                  onClick={() => patch({ subscriptionStatus: 'active' }, 'activate')}
                />
              )}
              {shop.subscriptionStatus !== 'suspended' && (
                <ActionBtn
                  label="Suspender cuenta"
                  icon={XCircle}
                  color="#ef4444"
                  loading={actionKey === 'suspend'}
                  onClick={() => patch({ subscriptionStatus: 'suspended' }, 'suspend')}
                />
              )}
              {shop.subscriptionStatus === 'suspended' && (
                <ActionBtn
                  label="Reactivar como trial"
                  icon={CheckCircle}
                  color="#7c3aed"
                  loading={actionKey === 'reactivate'}
                  onClick={() => patch({ subscriptionStatus: 'trial' }, 'reactivate')}
                />
              )}

              <div className="border-t my-3" style={{ borderColor: '#2a2a2a' }} />

              <ActionBtn
                label={shop.plan === 'pro' ? 'Cambiar a plan Basic' : 'Subir a plan Pro'}
                icon={Shield}
                color="#6366f1"
                loading={actionKey === 'plan'}
                onClick={() => patch({ plan: shop.plan === 'pro' ? 'basic' : 'pro' }, 'plan')}
              />
            </div>
          </div>
        </div>

        {/* Últimas citas */}
        {shop.lastAppointments.length > 0 && (
          <div className="rounded-xl border p-5" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
            <h3 className="text-sm font-semibold text-white mb-4">Últimas citas</h3>
            <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
              {shop.lastAppointments.map(apt => (
                <div key={apt.id} className="flex items-center gap-4 py-2.5 text-sm">
                  <div className="w-28 shrink-0 text-xs" style={{ color: '#555' }}>
                    {new Date(apt.scheduledAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    {' '}
                    {new Date(apt.scheduledAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex-1 text-white">{apt.service ?? '—'}</div>
                  {apt.price != null && (
                    <div className="text-xs font-medium" style={{ color: '#22c55e' }}>
                      S/ {Number(apt.price).toFixed(0)}
                    </div>
                  )}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#2a2a2a', color: '#a0a0a0' }}
                  >
                    {STATUS_MAP[apt.status] ?? apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
