'use client';

import React from 'react';
import { Users, UserCheck, UserX, AlertTriangle, Clock, MessageCircle } from 'lucide-react';
import { Client } from '../types';
import { CUTS_REQUIRED_FOR_FREE } from '@/src/constants';

interface DashboardProps {
  clients: Client[];
}

export default function Dashboard({ clients }: DashboardProps) {
  const INACTIVE_DAYS_THRESHOLD = 15;
  const today = new Date();

  // Calculate stats
  const stats = clients.reduce(
    (acc, client) => {
      const lastVisitDate = new Date(client.lastVisit);
      const diffTime = Math.abs(today.getTime() - lastVisitDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > INACTIVE_DAYS_THRESHOLD) {
        acc.inactive++;
        acc.inactiveClients.push({ ...client, daysSince: diffDays });
      } else {
        acc.active++;
      }
      return acc;
    },
    { active: 0, inactive: 0, inactiveClients: [] as (Client & { daysSince: number })[] }
  );

  // Sort inactive clients by days since last visit (descending)
  stats.inactiveClients.sort((a, b) => b.daysSince - a.daysSince);

  const getWhatsAppLink = (client: Client) => {
    const cutsLeft = CUTS_REQUIRED_FOR_FREE - client.cutsTowardsFree;
    let message = '';
    
    if (client.freeCutsAvailable > 0) {
      message = `Hola ${client.name}, te saludamos de BarberTracker. ¡Tienes un corte GRATIS disponible! Te esperamos pronto para que lo disfrutes. ✂️`;
    } else {
      message = `Hola ${client.name}, te saludamos de BarberTracker. Hace tiempo que no te vemos. Te recordamos que te faltan solo ${cutsLeft} cortes para llevarte tu corte GRATIS. ¡Te esperamos pronto! ✂️`;
    }
    
    const phone = client.phone.replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
          <p className="text-slate-500 mt-1">Resumen de retención y alertas.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-black text-slate-900">{clients.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activos</p>
            <p className="text-2xl font-black text-slate-900">{stats.active}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactivos</p>
            <p className="text-2xl font-black text-slate-900">{stats.inactive}</p>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900">Alertas de Retención</h2>
          </div>
        </div>
        
        {stats.inactiveClients.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <p className="text-lg font-medium">¡Todo en orden! ✂️</p>
            <p className="text-sm">Todos tus clientes están activos.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.inactiveClients.map((client) => (
              <div key={client.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{client.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                      <span className="font-medium">{client.phone}</span>
                      <span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        {client.daysSince} días
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(getWhatsAppLink(client), '_blank')}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] text-white text-sm font-bold rounded-xl hover:bg-[#1ebd5b] transition-all active:scale-95 shadow-lg shadow-green-200"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contactar Cliente
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
