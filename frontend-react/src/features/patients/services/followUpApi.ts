import api from "@/shared/lib/axiosInstance";

export interface PatientFollowUp {
  followUpId: string;
  prescriptionId: string | null;
  eyeExamId: string | null;
  patientId: string;
  scheduledDate: string;
  actualVisitDate: string | null;
  status: string;
  followUpReason: string | null;
  isArchived: boolean;
  createdAt: string;
  createdBy: { userId: string; fullName: string } | null;
}

export interface CreateFollowUpInput {
  patientId: string;
  scheduledDate: string;
  followUpReason?: string;
  prescriptionId?: string;
  eyeExamId?: string;
}

export interface UpdateFollowUpInput {
  scheduledDate?: string;
  followUpReason?: string;
}

export interface UpdateFollowUpStatusRequest {
  status: "COMPLETED" | "NO_SHOW" | "CANCELLED";
}

export interface RescheduleFollowUpRequest {
  scheduledDate: string;
}

const createFollowUp = async (data: CreateFollowUpInput): Promise<PatientFollowUp> => {
  const { data: responseData } = await api.post("/follow-ups", data);
  return responseData;
};

const updateFollowUp = async (followUpId: string, data: UpdateFollowUpInput): Promise<PatientFollowUp> => {
  const { data: responseData } = await api.put(`/follow-ups/${followUpId}`, data);
  return responseData;
};

const archiveFollowUp = async (followUpId: string): Promise<void> => {
  await api.patch(`/follow-ups/${followUpId}/archive`);
};

const restoreFollowUp = async (followUpId: string): Promise<void> => {
  await api.patch(`/follow-ups/${followUpId}/restore`);
};

const fetchFollowUpsByPrescription = async (prescriptionId: string): Promise<PatientFollowUp[]> => {
  const { data } = await api.get(`/follow-ups/prescription/${prescriptionId}`);
  return data;
};

const fetchFollowUpsByPatient = async (
  patientId: string,
  status?: string,
  includeArchived = false,
  page = 0,
  size = 5,
): Promise<{ content: PatientFollowUp[]; totalPages: number; totalElements: number }> => {
  const params: Record<string, string | boolean | number> = { page, size, sort: "scheduledDate,desc" };
  if (status) params.status = status;
  if (includeArchived) params.includeArchived = true;
  const { data } = await api.get(`/follow-ups/patient/${patientId}`, { params });
  return {
    content: data.content,
    totalPages: data.page.totalPages,
    totalElements: data.page.totalElements,
  };
};

const updateFollowUpStatus = async (followUpId: string, status: string): Promise<PatientFollowUp> => {
  const { data } = await api.patch(`/follow-ups/${followUpId}/status`, { status });
  return data;
};

const rescheduleFollowUp = async (followUpId: string, scheduledDate: string): Promise<PatientFollowUp> => {
  const { data } = await api.patch(`/follow-ups/${followUpId}/reschedule`, { scheduledDate });
  return data;
};

export {
  createFollowUp,
  updateFollowUp,
  archiveFollowUp,
  restoreFollowUp,
  fetchFollowUpsByPrescription,
  fetchFollowUpsByPatient,
  updateFollowUpStatus,
  rescheduleFollowUp,
};
