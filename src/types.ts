export type Client = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastVisit: string; // ISO Date string
  totalVisits: number;
  cutsTowardsFree: number;
  freeCutsAvailable: number;
  notes?: string;
  visitHistory: string[]; // Added: array of ISO Date strings
  lastVisitNotified?: boolean; // Track if the latest visit was already notified via WhatsApp
};

export type DashboardStats = {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  retentionRate: number;
};
