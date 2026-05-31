import { differenceInDays, format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import { Trip, TripStatus } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDaysUntilTrip(startDate: string): number {
  return differenceInDays(parseISO(startDate), new Date());
}

export function getTripDuration(startDate: string, endDate: string): number {
  return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
}

export function getTripStatus(trip: Trip): TripStatus {
  const now = new Date();
  const start = parseISO(trip.startDate);
  const end = parseISO(trip.endDate);

  if (trip.status === 'planning') return 'planning';
  if (isAfter(now, end)) return 'completed';
  if (isBefore(now, start)) return 'upcoming';
  return 'active';
}

export function formatDate(date: string, fmt = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(date), fmt);
  } catch {
    return date;
  }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getBudgetPercentage(spent: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((spent / total) * 100), 100);
}

export function getStatusColor(status: TripStatus): string {
  switch (status) {
    case 'active': return 'text-green-400 bg-green-400/10';
    case 'upcoming': return 'text-blue-400 bg-blue-400/10';
    case 'completed': return 'text-gray-400 bg-gray-400/10';
    case 'planning': return 'text-yellow-400 bg-yellow-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
}

export function getStatusDot(status: TripStatus): string {
  switch (status) {
    case 'active': return 'bg-green-400';
    case 'upcoming': return 'bg-blue-400';
    case 'completed': return 'bg-gray-400';
    case 'planning': return 'bg-yellow-400';
    default: return 'bg-gray-400';
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateColorFromString(str: string): string {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#f97316', '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const CATEGORY_COLORS: Record<string, string> = {
  attraction: '#f59e0b',
  restaurant: '#ec4899',
  hotel: '#6366f1',
  shopping: '#10b981',
  hidden_gem: '#8b5cf6',
  museum: '#3b82f6',
  park: '#22c55e',
  beach: '#0ea5e9',
  nightlife: '#a855f7',
  transport: '#6b7280',
  other: '#9ca3af',
};

export const CATEGORY_ICONS: Record<string, string> = {
  attraction: '🏛️',
  restaurant: '🍽️',
  hotel: '🏨',
  shopping: '🛍️',
  hidden_gem: '💎',
  museum: '🏺',
  park: '🌿',
  beach: '🏖️',
  nightlife: '🌙',
  transport: '🚌',
  other: '📍',
};

export const TRANSPORT_ICONS: Record<string, string> = {
  train: '🚂',
  bus: '🚌',
  ferry: '⛴️',
  taxi: '🚕',
  rental: '🚗',
  metro: '🚇',
  tram: '🚋',
  other: '🚐',
};

export function downloadJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
