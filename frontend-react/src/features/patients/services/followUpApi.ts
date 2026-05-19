import api from "@/shared/lib/axiosInstance";

export interface PatientFollowUp {
  followUpId: string;
  prescriptionId: string | null;
  patientId: string;
  scheduledDate: string;
  actualVisitDate: string | null;
  status: string;
  followUpReason: string | null;
  createdAt: string;
  createdBy: { userId: string; fullName: string } | null;
}

export interface UpdateFollowUpStatusRequest {
  status: "COMPLETED" | "NO_SHOW" | "CANCELLED";
}

export interface RescheduleFollowUpRequest {
  scheduledDate: string;
}

const fetchFollowUpsByPrescription = async (prescriptionId: string): Promise<PatientFollowUp[]> => {
  const { data } = await api.get(`/follow-ups/prescription/${prescriptionId}`);
  return data;
};

const fetchFollowUpsByPatient = async (patientId: string, status?: string): Promise<PatientFollowUp[]> => {
  const params = status ? { status } : {};
  const { data } = await api.get(`/follow-ups/patient/${patientId}`, { params });
  return data;
};

const updateFollowUpStatus = async (followUpId: string, status: string): Promise<PatientFollowUp> => {
  const { data } = await api.patch(`/follow-ups/${followUpId}/status`, { status });
  return data;
};

const rescheduleFollowUp = async (followUpId: string, scheduledDate: string): Promise<PatientFollowUp> => {
  const { data } = await api.patch(`/follow-ups/${followUpId}/reschedule`, { scheduledDate });
  return data;
};

export { fetchFollowUpsByPrescription, fetchFollowUpsByPatient, updateFollowUpStatus, rescheduleFollowUp };
