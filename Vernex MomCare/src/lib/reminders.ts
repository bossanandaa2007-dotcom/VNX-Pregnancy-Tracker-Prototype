import { API_BASE } from '@/config/api';
import type { HealthReminder } from '@/types/reminder';

const parseResponse = async (res: Response) => {
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Reminder request failed');
  }
  return data;
};

export const fetchPatientReminders = async (patientId: string, doctorId?: string) => {
  const qs = doctorId ? `?doctorId=${encodeURIComponent(doctorId)}` : '';
  const data = await parseResponse(await fetch(`${API_BASE}/api/reminders/patient/${patientId}${qs}`));
  return (data.reminders || []) as HealthReminder[];
};

export const createReminder = async (
  patientId: string,
  payload: {
    actorRole: 'patient' | 'doctor';
    actorId: string;
    title: string;
    details?: string;
    intervalLabel: string;
    startDate?: string | null;
    endDate?: string | null;
    notifyTimes?: string[];
  }
) => {
  const data = await parseResponse(
    await fetch(`${API_BASE}/api/reminders/patient/${patientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  );
  return data.reminder as HealthReminder;
};

export const updateReminder = async (
  reminderId: string,
  payload: {
    actorRole: 'patient' | 'doctor';
    actorId: string;
    title: string;
    details?: string;
    intervalLabel: string;
    startDate?: string | null;
    endDate?: string | null;
    notifyTimes?: string[];
  }
) => {
  const data = await parseResponse(
    await fetch(`${API_BASE}/api/reminders/${reminderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  );
  return data.reminder as HealthReminder;
};

export const deleteReminder = async (
  reminderId: string,
  payload: { actorRole: 'patient' | 'doctor'; actorId: string }
) => {
  await parseResponse(
    await fetch(`${API_BASE}/api/reminders/${reminderId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  );
};

export const updateReminderStatus = async (
  reminderId: string,
  payload: { patientId: string; isDone: boolean }
) => {
  const data = await parseResponse(
    await fetch(`${API_BASE}/api/reminders/${reminderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  );
  return data.reminder as HealthReminder;
};
