import api from "@/shared/lib/axiosInstance";

export interface CreateEyeExamInput {
  examType?: string;
  chiefComplaint?: string;
  vaUnconvertedOd?: string;
  vaUnconvertedOs?: string;
  vaAidedOd?: string;
  vaAidedOs?: string;
  iopOd?: string;
  iopOs?: string;
  slitLampExamination?: string;
  fundusExamination?: string;
  clinicalImpression?: string;
  planNotes?: string;
}

export interface EyeExamResponse {
  eyeExamId: string;
  examNumber: string;
  createdAt: string;
  examType: string | null;
  chiefComplaint: string | null;
  medicalHistorySnapshot: string | null;
  vaUnconvertedOd: string | null;
  vaUnconvertedOs: string | null;
  vaAidedOd: string | null;
  vaAidedOs: string | null;
  iopOd: string | null;
  iopOs: string | null;
  slitLampExamination: string | null;
  fundusExamination: string | null;
  clinicalImpression: string | null;
  planNotes: string | null;
  status: string | null;
  voidReason: string | null;
  voidedAt: string | null;
  voidedBy: { userId: string; fullName: string } | null;
  performedBy: { userId: string; fullName: string } | null;
}

const createEyeExam = async (patientId: string, data: CreateEyeExamInput) => {
  const { data: responseData } = await api.post(`/admin/patients/${patientId}/eye-exams`, data);
  return responseData;
};

const getEyeExam = async (id: string): Promise<EyeExamResponse> => {
  const { data } = await api.get(`/admin/eye-exams/${id}`);
  return data;
};

const voidEyeExam = async (id: string, voidReason: string): Promise<void> => {
  await api.post(`/admin/eye-exams/${id}/void`, { voidReason });
};

export { createEyeExam, getEyeExam, voidEyeExam };
