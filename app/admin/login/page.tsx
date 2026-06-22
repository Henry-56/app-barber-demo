'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Error al iniciar sesión');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#7c3aed' }}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white tracking-tight">BarberFlow</span>
            <span
              className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded align-middle"
              style={{ backgroundColor: '#7c3aed30', color: '#a78bfa' }}
            >
              ADMIN
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <h1 className="text-xl font-semibold text-white mb-1">Acceso administrativo</h1>
          <p className="text-sm mb-6" style={{ color: '#555' }}>Panel de gestión de clientes BarberFlow</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@barberflow.pe"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder:text-[#444] outline-none transition-all"
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
                onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg text-sm text-white placeholder:text-[#444] outline-none transition-all"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
                  onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#555' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: '#7c3aed' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ingresar al panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#333' }}>
          Acceso restringido — solo administradores
        </p>
      </div>
    </div>
  );
}
