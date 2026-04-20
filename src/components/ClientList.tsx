'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, CalendarPlus, MoreVertical, Gift, MessageCircle, TrendingUp } from 'lucide-react';
import { Client } from '../types';
import NewClientModal from './NewClientModal';
import { CUTS_REQUIRED_FOR_FREE } from '@/src/constants';

interface ClientListProps {
  clients: Client[];
  onRegisterVisit: (clientId: string, isFreeCut?: boolean) => void;
  onAddClient: (data: { name: string; phone: string; notes?: string }) => void;
  onMarkNotified: (clientId: string) => void;
}

export default function ClientList({ clients, onRegisterVisit, onAddClient, onMarkNotified }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const INACTIVE_DAYS_THRESHOLD = 15;
  const today = new Date();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const getStatus = (lastVisit: string) => {
    const diffTime = Math.abs(today.getTime() - new Date(lastVisit).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > INACTIVE_DAYS_THRESHOLD) {
      return { label: 'Inactivo', color: 'bg-rose-100 text-rose-700' };
    }
    if (diffDays > INACTIVE_DAYS_THRESHOLD - 3) {
      return { label: 'En Riesgo', color: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'Activo', color: 'bg-emerald-100 text-emerald-700' };
  };

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat('es-ES', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    }).format(new Date(isoString));
  };

  const calculateFrequency = (history: string[]) => {
    if (!history || history.length < 2) return null;
    
    // Sort history by date
    const sortedDates = [...history].map(d => new Date(d).getTime()).sort((a, b) => a - b);
    
    let totalDays = 0;
    for (let i = 1; i < sortedDates.length; i++) {
      const diffTime = sortedDates[i] - sortedDates[i-1];
      totalDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return Math.round(totalDays / (sortedDates.length - 1));
  };

  // Prevent hydration mismatch by not rendering date-dependent UI until mounted
  if (!isMounted) return null;

  const getWhatsAppLink = (client: Client) => {
    const status = getStatus(client.lastVisit);
    const progress = `${client.cutsTowardsFree}/${CUTS_REQUIRED_FOR_FREE}`;
    const diffTime = Math.abs(today.getTime() - new Date(client.lastVisit).getTime());
    const daysSinceLastVisit = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isToday = new Date(client.lastVisit).toDateString() === today.toDateString();

    let message = '';
    if (isToday) {
      message = `¡Hola ${client.name}! 👋 Gracias por tu visita de hoy en BarberTracker Pro 💈. Ya tienes ${progress} sellos en tu tarjeta digital 🎁. ¡Nos vemos en la próxima!`;
    } else if (status.label === 'Activo') {
      message = `¡Hola ${client.name}! 👋 Gracias por visitarnos en BarberTracker Pro. Vas ${progress} para tu próximo corte GRATIS 🎁. ¡Te esperamos pronto!`;
    } else {
      message = `Hola ${client.name}, te extrañamos en BarberTracker Pro 💈. Tu última visita fue hace ${daysSinceLastVisit} días. ¡Vuelve pronto para completar tu tarjeta y llevarte un corte gratis! 🎁`;
    }

    const cleanPhone = client.phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Directorio de Clientes</h1>
          <p className="text-slate-500 mt-1">Gestiona tu base de datos y registra nuevas visitas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Mobile List View - Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredClients.map((client) => {
            const status = getStatus(client.lastVisit);
            const cutsLeft = CUTS_REQUIRED_FOR_FREE - client.cutsTowardsFree;
            const progressPercent = (client.cutsTowardsFree / CUTS_REQUIRED_FOR_FREE) * 100;

            return (
              <div key={client.id} className="p-4 space-y-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{client.name}</h3>
                    <p className="text-sm text-slate-500">{client.phone}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tarjeta de Fidelidad</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{client.cutsTowardsFree}/{CUTS_REQUIRED_FOR_FREE}</span>
                  </div>
                  
                  <div className="grid grid-cols-6 gap-2">
                    {[...Array(CUTS_REQUIRED_FOR_FREE)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`aspect-square rounded-lg flex items-center justify-center border-2 transition-all ${
                          i < client.cutsTowardsFree 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-300'
                        }`}
                      >
                        {i < client.cutsTowardsFree ? <Plus className="w-4 h-4 rotate-45" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                      </div>
                    ))}
                    <div className={`aspect-square rounded-lg flex items-center justify-center border-2 border-dashed transition-all ${
                      client.freeCutsAvailable > 0 
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-600 animate-pulse' 
                        : 'bg-white border-slate-200 text-slate-300'
                    }`}>
                      <Gift className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onRegisterVisit(client.id, false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Nueva Visita
                  </button>
                  {status.label !== 'Activo' ? (
                    <a 
                      href={getWhatsAppLink(client)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-colors"
                      title="Enviar recordatorio por WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Recordar
                    </a>
                  ) : (new Date(client.lastVisit).toDateString() === today.toDateString()) && !client.lastVisitNotified && (
                    <a 
                      href={getWhatsAppLink(client)}
                      onClick={() => onMarkNotified(client.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors"
                      title="Notificar progreso al cliente"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Notificar
                    </a>
                  )}
                  {client.freeCutsAvailable > 0 && (
                    <button 
                      onClick={() => onRegisterVisit(client.id, true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg"
                    >
                      <Gift className="w-4 h-4" />
                      Canjear
                    </button>
                  )}
                </div>
                
                <p className="text-[10px] text-slate-400 text-center italic">
                  Última visita: {formatDate(client.lastVisit)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Contacto</th>
                <th className="px-6 py-3">Fidelidad</th>
                <th className="px-6 py-3">Última Visita</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => {
                const status = getStatus(client.lastVisit);
                const cutsLeft = CUTS_REQUIRED_FOR_FREE - client.cutsTowardsFree;
                const progressPercent = (client.cutsTowardsFree / CUTS_REQUIRED_FOR_FREE) * 100;

                return (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{client.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{client.totalVisits} visitas</span>
                        {calculateFrequency(client.visitHistory) && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              cada {calculateFrequency(client.visitHistory)} días
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{client.phone}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        {[...Array(CUTS_REQUIRED_FOR_FREE)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
                              i < client.cutsTowardsFree 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'bg-slate-50 border-slate-200 text-slate-300'
                            }`}
                          >
                            {i < client.cutsTowardsFree ? <Plus className="w-3 h-3 rotate-45" /> : <span className="text-[8px] font-bold">{i + 1}</span>}
                          </div>
                        ))}
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center border border-dashed ${
                          client.freeCutsAvailable > 0 
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-600' 
                            : 'bg-white border-slate-200 text-slate-300'
                        }`}>
                          <Gift className="w-4 h-4" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatDate(client.lastVisit)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {client.freeCutsAvailable > 0 && (
                          <button 
                            onClick={() => onRegisterVisit(client.id, true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 font-medium rounded-md hover:bg-emerald-200 transition-colors"
                            title="Canjear corte gratis"
                          >
                            <Gift className="w-4 h-4" />
                            <span className="hidden sm:inline">Canjear</span>
                          </button>
                        )}
                        <button 
                          onClick={() => onRegisterVisit(client.id, false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200 transition-colors"
                          title="Registrar nueva visita hoy"
                        >
                          <CalendarPlus className="w-4 h-4" />
                          <span className="hidden sm:inline">Visita</span>
                        </button>
                        {status.label !== 'Activo' ? (
                          <a 
                            href={getWhatsAppLink(client)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white font-medium rounded-md hover:bg-emerald-600 transition-colors border border-emerald-600"
                            title="Enviar recordatorio WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Recordar</span>
                          </a>
                        ) : (new Date(client.lastVisit).toDateString() === today.toDateString()) && !client.lastVisitNotified && (
                          <a 
                            href={getWhatsAppLink(client)}
                            onClick={() => onMarkNotified(client.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors border border-blue-600"
                            title="Notificar progreso WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Notificar</span>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredClients.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500">
            No se encontraron clientes con esos criterios.
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      <NewClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={onAddClient} 
      />
    </div>
  );
}
