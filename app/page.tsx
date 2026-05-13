'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/src/components/Layout';
import StatsPanel from '@/src/components/StatsPanel';
import ClientList from '@/src/components/ClientList';
import TodayQueue from '@/src/components/TodayQueue';
import { Client } from '@/src/types';
import { CUTS_REQUIRED_FOR_FREE } from '@/src/constants';

const DEFAULT_FREQUENCY = 15;

function getUrgentCount(clients: Client[]): number {
  return clients.filter(c => {
    const freq = c.avgFrequencyDays ?? DEFAULT_FREQUENCY;
    const daysSince = Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / 86400000);
    return daysSince / freq >= 1.0;
  }).length;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('hoy');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) {
        console.error('API error:', res.status, await res.text().catch(() => ''));
        return;
      }
      const text = await res.text();
      if (!text) return;
      setClients(JSON.parse(text));
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleRegisterVisit = async (clientId: string, isFreeCut: boolean = false) => {
    const now = new Date().toISOString();
    setClients(prev =>
      prev.map(client => {
        if (client.id !== clientId) return client;
        const updatedHistory = [...(client.visitHistory || []), now];
        if (isFreeCut) {
          return { ...client, lastVisit: now, totalVisits: client.totalVisits + 1, freeCutsAvailable: Math.max(0, client.freeCutsAvailable - 1), visitHistory: updatedHistory, lastVisitNotified: false };
        }
        const newCuts = client.cutsTowardsFree + 1;
        const earnedFree = newCuts >= CUTS_REQUIRED_FOR_FREE;
        return { ...client, lastVisit: now, totalVisits: client.totalVisits + 1, cutsTowardsFree: earnedFree ? 0 : newCuts, freeCutsAvailable: earnedFree ? client.freeCutsAvailable + 1 : client.freeCutsAvailable, visitHistory: updatedHistory, lastVisitNotified: false };
      })
    );
    await fetch(`/api/clients/${clientId}/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFreeCut }),
    });
    fetchClients();
  };

  const handleAddClient = async (clientData: { name: string; phone: string; notes?: string }) => {
    const now = new Date().toISOString();
    const tempId = 'temp-' + Date.now();
    setClients(prev => [
      { ...clientData, id: tempId, lastVisit: now, totalVisits: 1, cutsTowardsFree: 1, freeCutsAvailable: 0, visitHistory: [now], lastVisitNotified: false, avgFrequencyDays: null },
      ...prev,
    ]);
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    });
    fetchClients();
  };

  const handleMarkNotified = async (clientId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, lastVisitNotified: true } : c));
    await fetch(`/api/clients/${clientId}/notify`, { method: 'PATCH' });
  };

  const handleOutreachSent = async (clientId: string, messageType: string): Promise<string> => {
    const res = await fetch(`/api/clients/${clientId}/outreach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageType }),
    });
    const data = await res.json();
    return data.id;
  };

  const handleOutcomeSet = async (logId: string, outcome: string): Promise<void> => {
    await fetch(`/api/outreach/${logId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome }),
    });
    if (outcome === 'came_back') fetchClients();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} urgentCount={getUrgentCount(clients)}>
      {activeTab === 'hoy' && (
        <TodayQueue
          clients={clients}
          onOutreachSent={handleOutreachSent}
          onOutcomeSet={handleOutcomeSet}
        />
      )}
      {activeTab === 'dashboard' && <StatsPanel />}
      {activeTab === 'clients' && (
        <ClientList
          clients={clients}
          onRegisterVisit={handleRegisterVisit}
          onAddClient={handleAddClient}
          onMarkNotified={handleMarkNotified}
        />
      )}
    </Layout>
  );
}
