// Local storage utilities for HealthVault

import type { HealthVaultData, ActivityLog } from '@/types/health';

const STORAGE_KEY = 'healthvault_data';

const defaultSettings = {
  theme: 'system' as const,
  language: 'en',
  notificationsEnabled: true,
  reminderSound: true,
};

const getDefaultData = (): HealthVaultData => ({
  user: null,
  familyMembers: [],
  activeMemberId: null,
  vitals: [],
  reports: [],
  doctorNotes: [],
  appointments: [],
  medications: [],
  symptoms: [],
  activityLogs: [],
  settings: defaultSettings,
});

export const storage = {
  getData(): HealthVaultData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return getDefaultData();
      return { ...getDefaultData(), ...JSON.parse(data) };
    } catch {
      return getDefaultData();
    }
  },

  setData(data: HealthVaultData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  updateData(updates: Partial<HealthVaultData>): HealthVaultData {
    const current = this.getData();
    const updated = { ...current, ...updates };
    this.setData(updated);
    return updated;
  },

  clearData(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Activity logging
  logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const data = this.getData();
    const newLog: ActivityLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    data.activityLogs = [newLog, ...data.activityLogs].slice(0, 1000); // Keep last 1000 logs
    this.setData(data);
  },
};

// Generate unique IDs
export const generateId = (): string => crypto.randomUUID();

// Date formatting helpers
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// File handling for localStorage (base64)
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};
