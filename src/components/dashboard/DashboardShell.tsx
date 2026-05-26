'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Scissors, LayoutDashboard, Users, CalendarDays,
  UserCheck, Gift, MessageSquare, Banknote,
  LogOut, Menu, X, AlertTriangle, Clock, ChevronRight, Settings,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',             label: 'Inicio',       icon: LayoutDashboard },
  { href: '/dashboard/clientes',    label: 'Clientes',     icon: Users           },
  { href: '/dashboard/agenda',      label: 'Agenda',       icon: CalendarDays    },
  { href: '/dashboard/barberos',    label: 'Barberos',     icon: UserCheck       },
  { href: '/dashboard/fidelizacion',label: 'Fidelización', icon: Gift            },
  { href: '/dashboard/whatsapp',    label: 'WhatsApp',     icon: MessageSquare   },
  { href: '/dashboard/caja',        label: 'Caja',         icon: Banknote        },
  { href: '/dashboard/ajustes',     label: 'Ajustes',      icon: Settings        },
];

function TrialBanner({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft === null) return null;

  if (daysLeft <= 0) {
    return (
      <div className="mx-3 mb-3 p-3 rounded-xl text-xs font-medium" style={{ backgroundColor: '#ef444420', border: '1px solid #ef444440' }}>
        <div className="flex items-center gap-1.5" style={{ color: '#ef4444' }}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="font-bold">Prueba vencida</span>
        </div>
        <p className="mt-1" style={{ color: '#a0a0a0' }}>Activa tu plan para continuar.</p>
        <a href={`https://wa.me/51937776581?text=${encodeURIComponent('Hola, quiero activar BarberFlow')}`}
          target="_blank" rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1 font-semibold hover:underline" style={{ color: '#C9A84C' }}>
          Activar ahora <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    );
  }

  const color = daysLeft > 7 ? '#22c55e' : '#f59e0b';

  return (
    <div className="mx-3 mb-3 p-3 rounded-xl text-xs" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
      <div className="flex items-center gap-1.5 font-medium" style={{ color }}>
        <Clock className="w-3.5 h-3.5 shrink-0" />
        {daysLeft} {daysLeft === 1 ? 'día' : 'días'} de prueba
      </div>
      <p className="mt-0.5" style={{ color: '#a0a0a0' }}>Acceso completo gratis.</p>
    </div>
  );
}

interface Props {
  children: React.ReactNode;
  shopName: string;
  trialDaysLeft: number | null;
}

export default function DashboardShell({ children, shopName, trialDaysLeft }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: '#1e1e1e' }}>
        <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: '#C9A84C' }}>
          <Scissors className="w-5 h-5" style={{ color: '#0a0a0a' }} />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm truncate">{shopName}</p>
          <p className="text-[11px]" style={{ color: '#555555' }}>BarberFlow Basic</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: active ? '#1c1c1c' : 'transparent',
                color: active ? '#C9A84C' : '#a0a0a0',
                borderLeft: active ? '3px solid #C9A84C' : '3px solid transparent',
              }}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Trial banner */}
      <TrialBanner daysLeft={trialDaysLeft} />

      {/* Signout */}
      <div className="px-3 pb-4 border-t pt-4" style={{ borderColor: '#1e1e1e' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-[#1c1c1c]"
          style={{ color: '#555555' }}>
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-0 h-screen border-r" style={{ borderColor: '#1e1e1e' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 h-full shadow-2xl">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-40" style={{ backgroundColor: '#0f0f0f', borderColor: '#1e1e1e' }}>
          <button onClick={() => setMobileOpen(v => !v)} style={{ color: '#a0a0a0' }}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: '#C9A84C' }}>
              <Scissors className="w-4 h-4" style={{ color: '#0a0a0a' }} />
            </div>
            <span className="font-bold text-white text-sm truncate">{shopName}</span>
          </div>
          {trialDaysLeft !== null && trialDaysLeft <= 7 && trialDaysLeft > 0 && (
            <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
              {trialDaysLeft}d
            </span>
          )}
          {trialDaysLeft !== null && trialDaysLeft <= 0 && (
            <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>
              Vencido
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
