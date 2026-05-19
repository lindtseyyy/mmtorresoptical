import api from "@/shared/lib/axiosInstance";

export interface CreateEyeExamInput {
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
  createdAt: string;
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
  isArchived: boolean;
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

export { createEyeExam, getEyeExam };
