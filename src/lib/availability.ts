import type { OpeningHours } from './schema';

const DAY_NAMES: Record<number, string> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
};

export interface TimeSlot {
  time: string; // "HH:MM"
  available: boolean;
}

export function generateSlots(
  date: Date,
  openingHours: OpeningHours,
  durationMinutes: number,
  occupiedTimes: string[], // "HH:MM" strings
  minAdvanceHours = 2,
): TimeSlot[] {
  const dayName = DAY_NAMES[date.getDay()];
  const dayConfig = openingHours[dayName];

  if (!dayConfig || dayConfig.closed) return [];

  const [openH, openM] = dayConfig.open.split(':').map(Number);
  const [closeH, closeM] = dayConfig.close.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const now = new Date();
  const minAdvanceMs = minAdvanceHours * 60 * 60 * 1000;

  const slots: TimeSlot[] = [];

  for (let m = openMinutes; m + durationMinutes <= closeMinutes; m += durationMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

    const slotDate = new Date(date);
    slotDate.setHours(h, min, 0, 0);

    const isPast = slotDate.getTime() - now.getTime() < minAdvanceMs;
    const isOccupied = occupiedTimes.includes(time);

    slots.push({ time, available: !isPast && !isOccupied });
  }

  return slots;
}

export function getAvailableDates(
  openingHours: OpeningHours,
  maxAdvanceDays: number,
): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= maxAdvanceDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = DAY_NAMES[d.getDay()];
    const dayConfig = openingHours[dayName];
    if (dayConfig && !dayConfig.closed) {
      dates.push(d);
    }
  }

  return dates;
}

export function formatDateLocal(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
