'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Plus, LogOut, Search, Building2, Clock,
  CheckCircle, XCircle, Loader2, ChevronRight,
  Users, Calendar, RefreshCw, AlertCircle,
} from 'lucide-react';

type Shop = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  phone: string | null;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  createdAt: string;
  ownerEmail: string;
  ownerName: string;
  citasMes: number;
  totalClientes: number;
};

function StatusBadge({ status, trialEndsAt }: { status: string; trialEndsAt: string | null }) {
  const daysLeft = trialEndsAt ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000) : null;

  if (status === 'trial') {
    if (daysLeft !== null && daysLeft <= 0) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#55555520', color: '#888' }}>Vencido</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>Trial {daysLeft !== null ? `(${daysLeft}d)` : ''}</span>;
  }
  if (status === 'active' || status === 'paid') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>Activo</span>;
  }
  if (status === 'suspended') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>Suspendido</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#55555520', color: '#888' }}>{status}</span>;
}

function Field({
  label, name, type = 'text', placeholder, required, defaultValue, className,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; defaultValue?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-white mb-1.5">{label}</label>
      <input
        name={name} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue}
        className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder:text-[#444] outline-none transition-all"
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
        onFocus={e => (e.target.style.borderColor = '#7c3aed')}
        onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
      />
    </div>
  );
}

function CreateShopModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barbershopName: fd.get('barbershopName'),
        city: fd.get('city'),
        phone: fd.get('phone'),
        ownerName: fd.get('ownerName'),
        email: fd.get('email'),
        password: fd.get('password'),
        plan: fd.get('plan'),
        trialDays: Number(fd.get('trialDays')),
      }),
    });
    setLoading(false);
    if (res.ok) {
      onCreated();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Error al crear la barbería');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-md rounded-2xl border p-6 overflow-y-auto max-h-[90vh]" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
        <h2 className="text-lg font-semibold text-white mb-5">Nueva Barbería</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nombre de la barbería *" name="barbershopName" placeholder="Barbería El Rey" required className="" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad" name="city" placeholder="Lima" />
            <Field label="Teléfono WA" name="phone" placeholder="+51987654321" />
          </div>

          <div className="border-t pt-3" style={{ borderColor: '#2a2a2a' }}>
            <p className="text-xs font-medium mb-3" style={{ color: '#555' }}>Cuenta del dueño</p>
            <div className="space-y-3">
              <Field label="Nombre completo *" name="ownerName" placeholder="Juan Pérez" required />
              <Field label="Email *" name="email" type="email" placeholder="juan@email.com" required />
              <Field label="Contraseña *" name="password" type="password" placeholder="Mínimo 8 caracteres" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: '#2a2a2a' }}>
            <div>
              <label className="block text-xs font-medium text-white mb-1.5">Plan</label>
              <select
                name="plan"
                defaultValue="basic"
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <Field label="Días de trial" name="trialDays" type="number" placeholder="21" defaultValue="21" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#ef4444' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#1c1c1c', color: '#a0a0a0' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: '#7c3aed' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Barbería'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/shops');
    if (res.status === 401) { router.push('/admin/login'); return; }
    setShops(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const filtered = shops.filter(s =>
    [s.name, s.slug, s.ownerEmail, s.ownerName, s.city].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const now = Date.now();
  const stats = {
    total: shops.length,
    trial: shops.filter(s => s.subscriptionStatus === 'trial' && s.trialEndsAt && new Date(s.trialEndsAt).getTime() > now).length,
    active: shops.filter(s => s.subscriptionStatus === 'active' || s.subscriptionStatus === 'paid').length,
    otros: shops.filter(s =>
      s.subscriptionStatus === 'suspended' ||
      (s.subscriptionStatus === 'trial' && (!s.trialEndsAt || new Date(s.trialEndsAt).getTime() <= now))
    ).length,
  };

  const COLS = ['Barbería', 'Owner', 'Ciudad', 'Plan', 'Estado', 'Trial', 'Citas/mes', 'Clientes', ''];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a', color: '#e5e5e5' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b px-6 py-4 flex items-center gap-3"
        style={{ backgroundColor: '#0f0f0f', borderColor: '#1e1e1e' }}
      >
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#7c3aed' }}>
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-white font-bold">BarberFlow</span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#7c3aed20', color: '#a78bfa' }}>ADMIN</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={fetchShops}
            title="Actualizar"
            className="p-2 rounded-lg transition-all hover:bg-[#1c1c1c]"
            style={{ color: '#555' }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-[#1c1c1c]"
            style={{ color: '#a0a0a0' }}
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {([
            { label: 'Total clientes', value: stats.total, icon: Building2, color: '#7c3aed' },
            { label: 'En trial', value: stats.trial, icon: Clock, color: '#f59e0b' },
            { label: 'Activos (pagos)', value: stats.active, icon: CheckCircle, color: '#22c55e' },
            { label: 'Vencidos / Suspendidos', value: stats.otros, icon: XCircle, color: '#ef4444' },
          ] as const).map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-5 border" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-xs font-medium" style={{ color: '#a0a0a0' }}>{label}</span>
              </div>
              <div className="text-3xl font-bold text-white">{loading ? '—' : value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <h2 className="text-lg font-semibold text-white">Clientes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#555' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar barbería, email..."
              className="w-56 pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder:text-[#444] outline-none"
              style={{ backgroundColor: '#161616', border: '1px solid #2a2a2a' }}
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#7c3aed' }}
          >
            <Plus className="w-4 h-4" /> Nueva Barbería
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2a2a2a' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#7c3aed' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-sm" style={{ color: '#555' }}>
              {search ? 'Sin resultados para esa búsqueda' : 'No hay clientes registrados todavía'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#111', borderBottom: '1px solid #2a2a2a' }}>
                    {COLS.map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap" style={{ color: '#555' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((shop, i) => {
                    const daysLeft = shop.trialEndsAt
                      ? Math.ceil((new Date(shop.trialEndsAt).getTime() - now) / 86_400_000)
                      : null;
                    return (
                      <tr
                        key={shop.id}
                        className="hover:bg-[#131313] transition-all"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1a1a1a' : undefined }}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{shop.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: '#444' }}>{shop.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div style={{ color: '#a0a0a0' }}>{shop.ownerName}</div>
                          <div className="text-xs mt-0.5" style={{ color: '#444' }}>{shop.ownerEmail}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#a0a0a0' }}>{shop.city ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs capitalize" style={{ color: '#a0a0a0' }}>{shop.plan}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={shop.subscriptionStatus} trialEndsAt={shop.trialEndsAt} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {daysLeft !== null ? (
                            <span style={{ color: daysLeft <= 0 ? '#ef4444' : daysLeft <= 3 ? '#f97316' : daysLeft <= 7 ? '#f59e0b' : '#a0a0a0' }}>
                              {daysLeft > 0 ? `${daysLeft}d` : 'Vencido'}
                            </span>
                          ) : <span style={{ color: '#444' }}>—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs" style={{ color: '#a0a0a0' }}>
                            <Calendar className="w-3 h-3" />
                            {shop.citasMes ?? 0}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs" style={{ color: '#a0a0a0' }}>
                            <Users className="w-3 h-3" />
                            {shop.totalClientes ?? 0}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push(`/admin/${shop.id}`)}
                            className="flex items-center gap-0.5 text-xs font-medium transition-all hover:underline whitespace-nowrap"
                            style={{ color: '#a78bfa' }}
                          >
                            Ver <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <CreateShopModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchShops(); }}
        />
      )}
    </div>
  );
}
