import { Client } from '../types';

// Helper to generate dates relative to today
const getRelativeDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

export const initialClients: Client[] = [
  {
    id: '1',
    name: 'Carlos Rodríguez',
    phone: '+51 987 654 321',
    lastVisit: getRelativeDate(5),
    totalVisits: 12,
    cutsTowardsFree: 2,
    freeCutsAvailable: 1,
    notes: 'Corte clásico, usa pomada mate.',
    visitHistory: [getRelativeDate(45), getRelativeDate(30), getRelativeDate(15), getRelativeDate(5)],
  },
  {
    id: '2',
    name: 'Miguel Ángel Pérez',
    phone: '+51 911 222 333',
    lastVisit: getRelativeDate(18), // Inactivo (> 15 días)
    totalVisits: 4,
    cutsTowardsFree: 4,
    freeCutsAvailable: 0,
    visitHistory: [getRelativeDate(60), getRelativeDate(40), getRelativeDate(18)],
  },
  {
    id: '3',
    name: 'David Gómez',
    phone: '+51 922 333 444',
    lastVisit: getRelativeDate(2),
    totalVisits: 25,
    cutsTowardsFree: 0,
    freeCutsAvailable: 2,
    notes: 'Cliente VIP. Fade alto.',
    visitHistory: [getRelativeDate(20), getRelativeDate(12), getRelativeDate(2)],
  },
  {
    id: '4',
    name: 'Alejandro Martín',
    phone: '+51 933 444 555',
    lastVisit: getRelativeDate(22), // Inactivo (> 15 días)
    totalVisits: 2,
    cutsTowardsFree: 2,
    freeCutsAvailable: 0,
    visitHistory: [getRelativeDate(40), getRelativeDate(22)],
  },
  {
    id: '5',
    name: 'Javier López',
    phone: '+51 944 555 666',
    lastVisit: getRelativeDate(14), // A punto de estar inactivo
    totalVisits: 8,
    cutsTowardsFree: 3,
    freeCutsAvailable: 0,
    visitHistory: [getRelativeDate(45), getRelativeDate(30), getRelativeDate(14)],
  },
  {
    id: '6',
    name: 'Roberto Sánchez',
    phone: '+51 955 666 777',
    lastVisit: getRelativeDate(30), // Muy inactivo
    totalVisits: 1,
    cutsTowardsFree: 1,
    freeCutsAvailable: 0,
    notes: 'Vino por una promoción.',
    visitHistory: [getRelativeDate(30)],
  },
];
