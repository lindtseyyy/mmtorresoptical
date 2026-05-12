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

const createHealthHistory = async (
  patientId: string,
  data: CreateHealthHistoryInput,
) => {
  return await api.post(`/admin/patients/${patientId}/health-histories`, data);
};

export { createHealthHistory };
