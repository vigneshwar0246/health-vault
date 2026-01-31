// API utility functions for Health Hub Connect

import type { VitalReading, FamilyMember, User, MedicalReport, DoctorNote, Appointment, Medication, Symptom } from '@/types/health';

const API_BASE_URL = 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiRequest = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'API request failed', response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0);
  }
};

export const authAPI = {
  login: (email: string, password: string): Promise<{ token: string; user: User }> =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string): Promise<{ token: string; user: User }> =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  getCurrentUser: (): Promise<User> => apiRequest('/auth/me'),

  updateProfile: (updates: Partial<User>): Promise<User> => apiRequest('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
};

export const familyAPI = {
  getMembers: (): Promise<FamilyMember[]> => apiRequest('/family'),
  getMember: (id: string): Promise<FamilyMember> => apiRequest(`/family/${id}`),
  createMember: (member: Omit<FamilyMember, 'id' | 'createdAt' | 'isDefault'>): Promise<FamilyMember> => apiRequest('/family', {
    method: 'POST',
    body: JSON.stringify(member),
  }),
  updateMember: (id: string, updates: Partial<FamilyMember>) => apiRequest(`/family/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteMember: (id: string) => apiRequest(`/family/${id}`, {
    method: 'DELETE',
  }),
};

export const vitalsAPI = {
  getVitals: (memberId: string): Promise<VitalReading[]> => apiRequest(`/vitals/${memberId}`),
  createVital: (vital: Omit<VitalReading, 'id' | 'recordedAt'>) => {
    console.log('vitalsAPI.createVital called with:', vital);
    return apiRequest('/vitals', {
      method: 'POST',
      body: JSON.stringify(vital),
    });
  },
  updateVital: (id: string, updates: Partial<VitalReading>) => apiRequest(`/vitals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteVital: (id: string) => apiRequest(`/vitals/${id}`, {
    method: 'DELETE',
  }),
};

export const reportsAPI = {
  getReports: (memberId: string): Promise<MedicalReport[]> => apiRequest(`/reports/${memberId}`),
  createReport: (report: Omit<MedicalReport, 'id' | 'createdAt'>) => apiRequest('/reports', {
    method: 'POST',
    body: JSON.stringify(report),
  }), uploadReportFile: async (memberId: string, file: File, meta?: { title?: string; date?: string; type?: string; notes?: string }) => {
    const url = `${API_BASE_URL}/reports/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('memberId', memberId);
    if (meta?.title) form.append('title', meta.title);
    if (meta?.date) form.append('date', meta.date);
    if (meta?.type) form.append('type', meta.type);
    if (meta?.notes) form.append('notes', meta.notes);

    const headers: Record<string, string> = {};
    const token = localStorage.getItem('auth_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'POST',
      body: form,
      headers,
    });

    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || 'Upload failed', response.status);
    return data;
  },

  translateReport: async (reportId: string, lang: string, force = false) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ lang, force })
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data.error || 'Translation failed', res.status);
    return data;
  },

  // Queue LLM (Gemini) summarization in background
  summarizeLLM: async (reportId: string, consent = false) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}/summarize-llm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ consent })
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data.error || 'Summarize LLM failed', res.status);
    return data;
  },

  // Translate arbitrary text(s) via /api/translate
  translateText: async (texts: string[] | string, lang = 'ta') => {
    const token = localStorage.getItem('auth_token');
    const body: any = { lang };
    if (Array.isArray(texts)) body.texts = texts;
    else body.text = texts;

    const res = await fetch(`${API_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new ApiError(data.error || 'Translation failed', res.status);
    return data;
  },

  // Chat with LLM (Gemini / Vertex)
  chat: async (prompt: string, options?: { temperature?: number; maxOutputTokens?: number; file?: File }) => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    let body: any;
    if (options?.file) {
      const form = new FormData();
      form.append('prompt', prompt);
      form.append('file', options.file);
      if (options.temperature) form.append('temperature', String(options.temperature));
      if (options.maxOutputTokens) form.append('maxOutputTokens', String(options.maxOutputTokens));
      body = form;
      // No Content-Type header for FormData, browser will set it with boundary
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ prompt, ...options });
    }

    const res = await fetch(`${API_BASE_URL}/llm/chat`, {
      method: 'POST',
      headers,
      body
    });

    const data = await res.json();
    if (!res.ok) throw new ApiError(data.error || 'LLM chat failed', res.status);
    return data;
  },

  generateSummary: async (reportId: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data.error || 'Generate summary failed', res.status);
    return data;
  },

  updateReport: (id: string, updates: Partial<MedicalReport>) => apiRequest(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteReport: (id: string) => apiRequest(`/reports/${id}`, {
    method: 'DELETE',
  }),
};

export const appointmentsAPI = {
  getAppointments: (memberId: string): Promise<Appointment[]> => apiRequest(`/appointments/${memberId}`),
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => apiRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointment),
  }),
  updateAppointment: (id: string, updates: Partial<Appointment>) => apiRequest(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteAppointment: (id: string) => apiRequest(`/appointments/${id}`, {
    method: 'DELETE',
  }),
};

export const medicationsAPI = {
  getMedications: (memberId: string): Promise<Medication[]> => apiRequest(`/medications/${memberId}`),
  createMedication: (medication: Omit<Medication, 'id' | 'createdAt'>) => apiRequest('/medications', {
    method: 'POST',
    body: JSON.stringify(medication),
  }),
  updateMedication: (id: string, updates: Partial<Medication>) => apiRequest(`/medications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteMedication: (id: string) => apiRequest(`/medications/${id}`, {
    method: 'DELETE',
  }),
};

export const symptomsAPI = {
  getSymptoms: (memberId: string): Promise<Symptom[]> => apiRequest(`/symptoms/${memberId}`),
  createSymptom: (symptom: Omit<Symptom, 'id' | 'recordedAt'>) => apiRequest('/symptoms', {
    method: 'POST',
    body: JSON.stringify(symptom),
  }),
  updateSymptom: (id: string, updates: Partial<Symptom>) => apiRequest(`/symptoms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteSymptom: (id: string) => apiRequest(`/symptoms/${id}`, {
    method: 'DELETE',
  }),
};

export const doctorNotesAPI = {
  getNotes: (memberId: string): Promise<DoctorNote[]> => apiRequest(`/doctor-notes/${memberId}`),
  createNote: (note: Omit<DoctorNote, 'id' | 'createdAt'>) => apiRequest('/doctor-notes', {
    method: 'POST',
    body: JSON.stringify(note),
  }),
  updateNote: (id: string, updates: Partial<DoctorNote>) => apiRequest(`/doctor-notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteNote: (id: string) => apiRequest(`/doctor-notes/${id}`, {
    method: 'DELETE',
  }),
};

export { ApiError, API_BASE_URL };