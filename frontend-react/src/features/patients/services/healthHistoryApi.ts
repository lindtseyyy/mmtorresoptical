import api from "@/shared/lib/axiosInstance";

export interface CreateHealthHistoryInput {
  examDate: string;
  eyeConditions?: string;
  systemicConditions?: string;
  medications?: string;
  allergies?: string;
  visualAcuityRight?: string;
  visualAcuityLeft?: string;
  notes?: string;
  isArchived?: boolean;
}

export interface HealthHistoryResponse {
  historyId: string;
  examDate: string;
  eyeConditions: string | null;
  systemicConditions: string | null;
  medications: string | null;
  allergies: string | null;
  visualAcuityRight: string | null;
  visualAcuityLeft: string | null;
  notes: string | null;
  createdAt: string;
  isArchived: boolean;
  createdBy: { userId: string; fullName: string } | null;
}

export interface UpdateHealthHistoryInput {
  examDate: string;
  eyeConditions?: string;
  systemicConditions?: string;
  medications?: string;
  allergies?: string;
  visualAcuityRight?: string;
  visualAcuityLeft?: string;
  notes?: string;
}

const createHealthHistory = async (
  patientId: string,
  data: CreateHealthHistoryInput,
) => {
  return await api.post(`/admin/patients/${patientId}/health-histories`, data);
};

const getHealthHistory = async (id: string): Promise<HealthHistoryResponse> => {
  const { data } = await api.get(`/admin/health-histories/${id}`);
  return data;
};

const updateHealthHistory = async (id: string, data: UpdateHealthHistoryInput) => {
  return await api.put(`/admin/health-histories/${id}`, data);
};

export { createHealthHistory, getHealthHistory, updateHealthHistory };
