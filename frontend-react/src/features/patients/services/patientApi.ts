import type { PageResponse } from "@/shared/types";
import type { Patient, PatientFormData } from "@/features/patients/types";
import api from "@/shared/lib/axiosInstance";

const mapPatientFromBackend = (patient: Patient): Patient => ({
  ...patient,
  sex: patient.sex.charAt(0) + patient.sex.slice(1).toLowerCase(),
});

const fetchPatients = async (
  page = 0,
  size = 10,
  keyword?: string,
  sortBy = "fullNameSortable",
  sortOrder = "asc",
  archivedStatus = "ACTIVE",
  sex?: string,
): Promise<PageResponse<Patient>> => {
  const { data } = await api.get("/admin/patients", {
    params: {
      page,
      size,
      sortBy,
      sortOrder,
      archivedStatus,
      ...(keyword && { keyword }),
      ...(sex && sex !== "all" && { sex }),
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
    sex: data.sex.toUpperCase(),
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
    sex: data.sex.toUpperCase(),
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
  rxNumber: string;
  issueDate: string;
  notes: string | null;
  createdAt: string;
  isArchived: boolean;
  status: string;
  eyeExamId: string | null;
  eyeExamNumber: string | null;
  createdBy: { userId: string; fullName: string } | null;
}

export interface EyeExamListItem {
  eyeExamId: string;
  examNumber: string;
  createdAt: string;
  examType: string | null;
  chiefComplaint: string | null;
  clinicalImpression: string | null;
  status: string | null;
  performedBy: { userId: string; fullName: string } | null;
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
  status = "ALL",
): Promise<{ content: PrescriptionListItem[]; totalPages: number; totalElements: number }> => {
  const { data } = await api.get(`/admin/patient/${patientId}/prescriptions`, {
    params: { page, size, sortBy: "issueDate", sortOrder: "desc", status },
  });
  return {
    content: data.content,
    totalPages: data.page.totalPages,
    totalElements: data.page.totalElements,
  };
};

const fetchPatientEyeExams = async (
  patientId: string,
  page = 0,
  size = 5,
  status = "ALL",
): Promise<{ content: EyeExamListItem[]; totalPages: number; totalElements: number }> => {
  const { data } = await api.get(`/admin/patients/${patientId}/eye-exams`, {
    params: { page, size, sortBy: "createdAt", sortOrder: "desc", status },
  });
  return {
    content: data.content,
    totalPages: data.page.totalPages,
    totalElements: data.page.totalElements,
  };
};

export interface DailyPatientArrival {
  day: number;
  count: number;
}

const fetchDailyPatientArrivals = async (): Promise<DailyPatientArrival[]> => {
  const { data } = await api.get("/admin/patients/daily-arrivals");
  return data;
};

export { fetchPatients, fetchPatient, addPatient, updatePatient, archivePatient, restorePatient, fetchPatientMetrics, fetchPatientProfileMetrics, fetchPatientPrescriptions, fetchPatientEyeExams, fetchDailyPatientArrivals };

export interface DashboardPatientMetrics {
  totalActivePatients: number;
  newPatientsThisMonth: number;
  pendingFollowUps: number;
  patientsSeenThisMonth: number;
}

export interface PatientMaintenanceMetrics {
  archivedPatients: number;
  patientsWithoutPurchases: number;
  stalePendingFollowUps: number;
}

export const fetchDashboardPatientMetrics = async (): Promise<DashboardPatientMetrics> => {
  const { data } = await api.get("/admin/patients/dashboard-summary");
  return data;
};

export const fetchMaintenanceMetrics = async (): Promise<PatientMaintenanceMetrics> => {
  const { data } = await api.get("/admin/patients/maintenance-summary");
  return data;
};

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
