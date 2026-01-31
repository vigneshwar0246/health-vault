// Core data types for HealthVault

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: EmergencyContact[];
  avatarUrl?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export type VitalStatus = 'normal' | 'warning' | 'critical';

export interface VitalReading {
  id: string;
  memberId: string;
  type: VitalType;
  value: number;
  unit: string;
  secondaryValue?: number; // For blood pressure (diastolic)
  notes?: string;
  recordedAt: string;
  status: VitalStatus;
}

export type VitalType = 
  | 'blood_pressure'
  | 'heart_rate'
  | 'temperature'
  | 'weight'
  | 'blood_sugar'
  | 'oxygen_saturation'
  | 'bmi'
  | 'cholesterol'
  | 'custom';

export interface VitalConfig {
  type: VitalType;
  label: string;
  unit: string;
  icon: string;
  normalRange: { min: number; max: number };
  warningRange: { min: number; max: number };
  hasSecondaryValue?: boolean;
  secondaryLabel?: string;
}

export interface MedicalReport {
  id: string;
  memberId: string;
  title: string;
  type: 'lab' | 'imaging' | 'prescription' | 'discharge' | 'other';
  date: string;
  fileUrl: string;
  fileType: string;
  notes?: string;
  parsedData?: Record<string, any>;
  originalText?: string;
  tags: string[];
  createdAt: string;
}

export interface DoctorNote {
  id: string;
  memberId: string;
  doctorName: string;
  specialty?: string;
  date: string;
  content: string;
  prescriptions?: string[];
  followUpDate?: string;
  attachments: string[];
  createdAt: string;
}

export interface Appointment {
  id: string;
  memberId: string;
  doctorName: string;
  specialty?: string;
  location?: string;
  dateTime: string;
  duration: number; // in minutes
  notes?: string;
  reminderMinutes: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  relatedReportIds: string[];
  createdAt: string;
}

export interface Medication {
  id: string;
  memberId: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[]; // Time strings like "08:00", "20:00"
  startDate: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Symptom {
  id: string;
  memberId: string;
  name: string;
  severity: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  recordedAt: string;
}

export interface ActivityLog {
  id: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'share';
  entityType: 'vital' | 'report' | 'note' | 'appointment' | 'medication' | 'symptom' | 'member' | 'settings';
  entityId: string;
  description: string;
  timestamp: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  reminderSound: boolean;
}

// Local storage data structure
export interface HealthVaultData {
  user: User | null;
  familyMembers: FamilyMember[];
  activeMemberId: string | null;
  vitals: VitalReading[];
  reports: MedicalReport[];
  doctorNotes: DoctorNote[];
  appointments: Appointment[];
  medications: Medication[];
  symptoms: Symptom[];
  activityLogs: ActivityLog[];
  settings: AppSettings;
}
