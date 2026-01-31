import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { VitalReading } from '@/types/health';
import { vitalsAPI, ApiError } from '@/lib/api';
import { useFamily } from './FamilyContext';
import { getVitalStatus } from '@/lib/vitals-config';

interface VitalsContextType {
  vitals: VitalReading[];
  isLoading: boolean;
  error: string | null;
  addVital: (vital: Omit<VitalReading, 'id' | 'recordedAt' | 'status'>) => Promise<boolean>;
  updateVital: (id: string, updates: Partial<VitalReading>) => Promise<boolean>;
  deleteVital: (id: string) => Promise<boolean>;
  refreshVitals: () => Promise<void>;
}

const VitalsContext = createContext<VitalsContextType | null>(null);

export function VitalsProvider({ children }: { children: React.ReactNode }) {
  const { activeMember } = useFamily();
  const [vitals, setVitals] = useState<VitalReading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshVitals = useCallback(async () => {
    if (!activeMember) {
      setVitals([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const memberVitals = await vitalsAPI.getVitals(activeMember.id);
      setVitals(memberVitals);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load vitals');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeMember]);

  useEffect(() => {
    refreshVitals();
  }, [refreshVitals]);

  const addVital = useCallback(async (
    vitalData: Omit<VitalReading, 'id' | 'recordedAt' | 'status'>
  ): Promise<boolean> => {
    try {
      setError(null);
      const status = getVitalStatus(vitalData.value, vitalData.type, vitalData.secondaryValue);
      const vitalWithStatus = { ...vitalData, status };
      const result = await vitalsAPI.createVital(vitalWithStatus);
      await refreshVitals();
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to add vital reading');
      }
      return false;
    }
  }, [refreshVitals]);

  const updateVital = useCallback(async (id: string, updates: Partial<VitalReading>): Promise<boolean> => {
    try {
      setError(null);
      await vitalsAPI.updateVital(id, updates);
      await refreshVitals();
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update vital reading');
      }
      return false;
    }
  }, [refreshVitals]);

  const deleteVital = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await vitalsAPI.deleteVital(id);
      await refreshVitals();
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete vital reading');
      }
      return false;
    }
  }, [refreshVitals]);

  return (
    <VitalsContext.Provider value={{
      vitals,
      isLoading,
      error,
      addVital,
      updateVital,
      deleteVital,
      refreshVitals,
    }}>
      {children}
    </VitalsContext.Provider>
  );
}

export function useVitals() {
  const context = useContext(VitalsContext);
  if (!context) {
    throw new Error('useVitals must be used within a VitalsProvider');
  }
  return context;
}