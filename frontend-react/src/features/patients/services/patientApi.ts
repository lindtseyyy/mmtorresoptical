import type { PageResponse } from "@/shared/types";
import type { Patient, PatientFormData } from "@/features/patients/types";
import api from "@/shared/lib/axiosInstance";

const GENDER_TO_BACKEND: Record<string, string> = {
  Male: "MALE",
  Female: "FEMALE",
  Other: "OTHERS",
};

const GENDER_FROM_BACKEND: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHERS: "Other",
};

const mapPatientFromBackend = (patient: Patient): Patient => ({
  ...patient,
  gender: GENDER_FROM_BACKEND[patient.gender] ?? patient.gender,
});

const fetchPatients = async (
  page = 0,
  size = 10,
  keyword?: string,
  sortBy = "fullNameSortable",
  sortOrder = "asc",
  archivedStatus = "ACTIVE",
  gender?: string,
): Promise<PageResponse<Patient>> => {
  const { data } = await api.get("/admin/patients", {
    params: {
      page,
      size,
      sortBy,
      sortOrder,
      archivedStatus,
      ...(keyword && { keyword }),
      ...(gender && gender !== "all" && { gender }),
    },
  });
  return {
    content: data.content.map(mapPatientFromBackend),
    totalPages: data.page.totalPages,
    totalElements: data.page.totalElements,
    size: data.page.size,
    number: data.page.number,
  };
};

const fetchPatient = async (id: string): Promise<Patient> => {
  const { data } = await api.get(`/admin/patients/${id}`);
  return mapPatientFromBackend(data);
};

const addPatient = async (data: PatientFormData) => {
  const payload = {
    ...data,
    gender: GENDER_TO_BACKEND[data.gender] ?? data.gender,
  };
  return await api.post("/admin/patients", payload);
};

const updatePatient = async ({
  id,
  data,
}: {
  id: string;
  data: PatientFormData;
}) => {
  const payload = {
    ...data,
    gender: GENDER_TO_BACKEND[data.gender] ?? data.gender,
  };
  return await api.put(`/admin/patients/${id}`, payload);
};

const archivePatient = async (id: string) => {
  return await api.delete(`/admin/patients/${id}`);
};

const restorePatient = async (id: string) => {
  return await api.put(`/admin/patients/${id}/restore`);
};

export interface PatientMetrics {
  totalPatients: number;
  newThisMonth: number;
  pendingFollowUps: number;
  archivedPatients: number;
}

export interface PatientProfileMetrics {
  totalVisits: number;
  lastVisitDate: string | null;
  lastPrescriptionDate: string | null;
  purchasedProducts: number;
  totalAmountPurchased: number;
}

export interface PrescriptionListItem {
  prescriptionId: string;
  examDate: string;
  notes: string | null;
  createdAt: string;
  isArchived: boolean;
  createdBy: { userId: string; fullName: string } | null;
}

export interface HealthHistoryItem {
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

const fetchPatientMetrics = async (): Promise<PatientMetrics> => {
  const { data } = await api.get("/admin/patients/summary");
  return data;
};

const fetchPatientProfileMetrics = async (patientId: string): Promise<PatientProfileMetrics> => {
  const { data } = await api.get(`/admin/patients/${patientId}/profile-metrics`);
  return data;
};

const fetchPatientPrescriptions = async (
  patientId: string,
  page = 0,
  size = 5,
  archivedStatus = "ALL",
): Promise<{ content: PrescriptionListItem[]; totalPages: number; totalElements: number }> => {
  const { data } = await api.get(`/admin/patient/${patientId}/prescriptions`, {
    params: { page, size, sortBy: "examDate", sortOrder: "desc", archivedStatus },
  });
  return {
    content: data.content,
    totalPages: data.page.totalPages,
    totalElements: data.page.totalElements,
  };
};

const fetchPatientHealthHistories = async (
  patientId: string,
  page = 0,
  size = 5,
  archivedStatus = "ALL",
): Promise<{ content: HealthHistoryItem[]; totalPages: number; totalElements: number }> => {
  const { data } = await api.get(`/admin/patients/${patientId}/health-histories`, {
    params: { page, size, sortBy: "examDate", sortOrder: "desc", archivedStatus },
  });
  return {
    content: data.content,
    totalPages: data.page.totalPages,
    totalElements: data.page.totalElements,
  };
};

export { fetchPatients, fetchPatient, addPatient, updatePatient, archivePatient, restorePatient, fetchPatientMetrics, fetchPatientProfileMetrics, fetchPatientPrescriptions, fetchPatientHealthHistories };

export interface PatientSearchResult {
  patientId: string;
  fullName: string;
  contactNumber: string;
}

const searchPatients = async (
  keyword: string,
  page = 0,
  size = 20,
): Promise<PageResponse<PatientSearchResult>> => {
  const { data } = await api.get("/admin/patients/search", {
    params: { keyword, page, size },
  });
  return {
    content: data.content,
    totalPages: data.page.totalPages,
    totalElements: data.page.totalElements,
    size: data.page.size,
    number: data.page.number,
  };
};

export { searchPatients };
