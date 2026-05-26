'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { Scissors, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState<{ error: string } | undefined, FormData>(loginAction, undefined);
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#C9A84C' }}>
            <Scissors className="w-6 h-6" style={{ color: '#0a0a0a' }} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">BarberFlow</span>
        </div>

        <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <h1 className="text-xl font-semibold text-white mb-1">Ingresa a tu cuenta</h1>
          <p className="text-sm mb-6" style={{ color: '#a0a0a0' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-medium hover:underline" style={{ color: '#C9A84C' }}>
              Regístrate gratis
            </Link>
          </p>

          <form action={action} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder:text-[#555555] outline-none transition-all"
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
                onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg text-sm text-white placeholder:text-[#555555] outline-none transition-all"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
                  onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#555555' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {state?.error && (
              <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
