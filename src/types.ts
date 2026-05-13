export type PendingOutreach = {
  id: string;
  sentAt: string;
  outcome: 'responded' | 'came_back' | 'no_response' | null;
  messageType: 'free_cut' | 'close_to_free' | 'reminder';
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastVisit: string;
  totalVisits: number;
  cutsTowardsFree: number;
  freeCutsAvailable: number;
  notes?: string;
  visitHistory: string[];
  lastVisitNotified?: boolean;
  avgFrequencyDays: number | null;
  pendingOutreach?: PendingOutreach | null;
};

export type DashboardStats = {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  retentionRate: number;
};
