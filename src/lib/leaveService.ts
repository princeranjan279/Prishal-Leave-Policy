import { apiRequest } from './db';
import type { LeaveRecord } from '../types';

export async function getLeaves(_userId: string, year: number): Promise<LeaveRecord[]> {
  return apiRequest<LeaveRecord[]>(`/leaves?year=${year}`);
}

export async function addLeave(_userId: string, year: number, leave: Omit<LeaveRecord, 'id'>): Promise<LeaveRecord> {
  return apiRequest<LeaveRecord>('/leaves', {
    method: 'POST',
    body: JSON.stringify({ ...leave, year })
  });
}

export async function deleteLeave(id: string): Promise<void> {
  return apiRequest<void>(`/leaves/${id}`, { method: 'DELETE' });
}

export async function deleteAllLeaves(_userId: string): Promise<void> {
  return apiRequest<void>('/leaves', { method: 'DELETE' });
}

export async function getSettings(_userId: string) {
  return apiRequest<any>('/settings');
}

export async function saveSettings(_userId: string, settings: { simulatedYear: number, simulatedToday: string, elCarryForwarded: number }) {
  return apiRequest<void>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  });
}

export async function resetSettings(_userId: string) {
  return apiRequest<void>('/settings/reset', { method: 'POST' });
}
