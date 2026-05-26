import api from "@/shared/lib/axiosInstance";

export interface PatientVisit {
  visitId: string;
  patientId: string;
  visitTimestamp: string;
  purpose: string | null;
  notes: string | null;
  loggedBy: { userId: string; fullName: string } | null;
}

export interface LogVisitInput {
  visitTimestamp?: string;
  purpose?: string;
  notes?: string;
  followUpId?: string;
}

const logVisit = async (patientId: string, data: LogVisitInput): Promise<PatientVisit> => {
  const { data: responseData } = await api.post(`/patients/${patientId}/visits`, data);
  return responseData;
};

const fetchVisitsByPatient = async (patientId: string): Promise<PatientVisit[]> => {
  const { data } = await api.get(`/patients/${patientId}/visits`);
  return data;
};

export { logVisit, fetchVisitsByPatient };
