'use client';

import React, { useState } from 'react';
import Layout from '@/src/components/Layout';
import Dashboard from '@/src/components/Dashboard';
import ClientList from '@/src/components/ClientList';
import { initialClients } from '@/src/data/mockData';
import { Client } from '@/src/types';
import { CUTS_REQUIRED_FOR_FREE } from '@/src/constants';

export default function Home() {
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState<Client[]>(initialClients);

  const handleRegisterVisit = (clientId: string, isFreeCut: boolean = false) => {
    const now = new Date().toISOString();
    setClients(prevClients => 
      prevClients.map(client => {
        if (client.id === clientId) {
          const updatedHistory = [...(client.visitHistory || []), now];
          if (isFreeCut) {
            return {
              ...client,
              lastVisit: now,
              totalVisits: client.totalVisits + 1,
              freeCutsAvailable: Math.max(0, client.freeCutsAvailable - 1),
              visitHistory: updatedHistory,
              lastVisitNotified: false,
            };
          } else {
            const newCuts = client.cutsTowardsFree + 1;
            const earnedFree = newCuts >= CUTS_REQUIRED_FOR_FREE;
            return {
              ...client,
              lastVisit: now,
              totalVisits: client.totalVisits + 1,
              cutsTowardsFree: earnedFree ? 0 : newCuts,
              freeCutsAvailable: earnedFree ? client.freeCutsAvailable + 1 : client.freeCutsAvailable,
              visitHistory: updatedHistory,
              lastVisitNotified: false,
            };
          }
        }
        return client;
      })
    );
  };

  const handleAddClient = (clientData: { name: string; phone: string; notes?: string }) => {
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      id: Math.random().toString(36).substr(2, 9),
      lastVisit: now,
      totalVisits: 1,
      cutsTowardsFree: 1,
      freeCutsAvailable: 0,
      visitHistory: [now],
      lastVisitNotified: false,
    };
    setClients([newClient, ...clients]);
  };

  const handleMarkNotified = (clientId: string) => {
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === clientId ? { ...client, lastVisitNotified: true } : client
      )
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard clients={clients} />}
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
