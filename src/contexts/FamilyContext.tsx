import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { FamilyMember } from '@/types/health';
import { familyAPI, ApiError } from '@/lib/api';
import { useAuth } from './AuthContext';

interface FamilyContextType {
  familyMembers: FamilyMember[];
  activeMember: FamilyMember | null;
  isLoading: boolean;
  error: string | null;
  setActiveMember: (memberId: string) => void;
  addMember: (member: Omit<FamilyMember, 'id' | 'createdAt' | 'isDefault'>) => Promise<FamilyMember | null>;
  updateMember: (id: string, updates: Partial<FamilyMember>) => Promise<boolean>;
  deleteMember: (id: string) => Promise<boolean>;
  refreshMembers: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMembers = useCallback(async () => {
    if (!user) {
      setFamilyMembers([]);
      setActiveMemberId(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const members = await familyAPI.getMembers();
      setFamilyMembers(members);

      // Set active member to default or first member
      const defaultMember = members.find((m: FamilyMember) => m.isDefault);
      setActiveMemberId(defaultMember?.id || members[0]?.id || null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load family members');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshMembers();
  }, [refreshMembers]);

  const activeMember = familyMembers.find(m => m.id === activeMemberId) || null;

  const setActiveMember = useCallback((memberId: string) => {
    setActiveMemberId(memberId);
    // Could log this to backend if needed
  }, []);

  const addMember = useCallback(async (
    memberData: Omit<FamilyMember, 'id' | 'createdAt' | 'isDefault'>
  ): Promise<FamilyMember | null> => {
    try {
      setError(null);
      const newMember = await familyAPI.createMember(memberData);
      await refreshMembers(); // Refresh to get updated list
      return newMember;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to add family member');
      }
      return null;
    }
  }, [refreshMembers]);

  const updateMember = useCallback(async (id: string, updates: Partial<FamilyMember>): Promise<boolean> => {
    try {
      setError(null);
      await familyAPI.updateMember(id, updates);
      await refreshMembers(); // Refresh to get updated data
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update family member');
      }
      return false;
    }
  }, [refreshMembers]);

  const deleteMember = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await familyAPI.deleteMember(id);
      await refreshMembers(); // Refresh to get updated list

      // If deleted member was active, switch to default
      if (activeMemberId === id) {
        const updatedMembers = familyMembers.filter(m => m.id !== id);
        const defaultMember = updatedMembers.find(m => m.isDefault) || updatedMembers[0];
        if (defaultMember) {
          setActiveMemberId(defaultMember.id);
        }
      }

      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete family member');
      }
      return false;
    }
  }, [familyMembers, activeMemberId, refreshMembers]);

  return (
    <FamilyContext.Provider value={{
      familyMembers,
      activeMember,
      isLoading,
      error,
      setActiveMember,
      addMember,
      updateMember,
      deleteMember,
      refreshMembers,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
