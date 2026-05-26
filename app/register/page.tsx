'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { Scissors, ChevronRight, Loader2, Check } from 'lucide-react';
import { registerAction } from './actions';

function Input({ label, name, type = 'text', placeholder, required }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder:text-[#555555] outline-none transition-all"
        style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
        onFocus={e => (e.target.style.borderColor = '#C9A84C')}
        onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
      />
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState({ barbershopName: '', city: '', phone: '' });
  const [state, action, pending] = useActionState<{ error: string } | undefined, FormData>(registerAction, undefined);

  const handleStep1 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStep1Data({
      barbershopName: fd.get('barbershopName') as string,
      city: fd.get('city') as string,
      phone: fd.get('phone') as string,
    });
    setStep(2);
  };

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

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          {[1, 2].map(n => (
            <React.Fragment key={n}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={step >= n
                  ? { backgroundColor: '#C9A84C', color: '#0a0a0a' }
                  : { backgroundColor: 'transparent', color: '#555555', border: '1px solid #2a2a2a' }
                }
              >
                {step > n ? <Check className="w-4 h-4" /> : n}
              </div>
              {n < 2 && (
                <div className="flex-1 h-px max-w-[60px]" style={{ backgroundColor: step > 1 ? '#C9A84C' : '#2a2a2a' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>

          {/* Paso 1 — barbería */}
          {step === 1 && (
            <>
              <h1 className="text-xl font-semibold text-white mb-1">Tu barbería</h1>
              <p className="text-sm mb-6" style={{ color: '#a0a0a0' }}>21 días gratis, sin tarjeta.</p>
              <form onSubmit={handleStep1} className="space-y-4">
                <Input label="Nombre de la barbería *" name="barbershopName" placeholder="Ej: Barbería El Rey" required />
                <Input label="Ciudad" name="city" placeholder="Lima, Arequipa..." />
                <Input label="WhatsApp de la barbería" name="phone" placeholder="987 654 321" />
                <button type="submit"
                  className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}>
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* Paso 2 — dueño + server action */}
          {step === 2 && (
            <>
              <h1 className="text-xl font-semibold text-white mb-1">Tu cuenta</h1>
              <p className="text-sm mb-6" style={{ color: '#a0a0a0' }}>Datos para ingresar al sistema.</p>
              <form action={action} className="space-y-4">
                {/* Pasar datos del paso 1 como hidden inputs */}
                <input type="hidden" name="barbershopName" value={step1Data.barbershopName} />
                <input type="hidden" name="city" value={step1Data.city} />
                <input type="hidden" name="phone" value={step1Data.phone} />

                <Input label="Tu nombre *" name="ownerName" placeholder="Juan Pérez" required />
                <Input label="Email *" name="email" type="email" placeholder="tu@email.com" required />
                <Input label="Contraseña *" name="password" type="password" placeholder="Mínimo 8 caracteres" required />

                {state?.error && (
                  <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{state.error}</p>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: '#1c1c1c', color: '#a0a0a0' }}>
                    Atrás
                  </button>
                  <button type="submit" disabled={pending}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                    style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}>
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear cuenta'}
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="text-center text-sm mt-4" style={{ color: '#555555' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium hover:underline" style={{ color: '#C9A84C' }}>
              Ingresa aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
