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
): Promise<PageResponse<Patient>> => {
  const { data } = await api.get("/admin/patients", {
    params: {
      page,
      size,
      sortBy,
      sortOrder,
      archivedStatus,
      ...(keyword && { keyword }),
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

export interface PatientMetrics {
  totalPatients: number;
  newThisMonth: number;
  pendingFollowUps: number;
  archivedPatients: number;
}

const fetchPatientMetrics = async (): Promise<PatientMetrics> => {
  const { data } = await api.get("/admin/patients/summary");
  return data;
};

export { fetchPatients, fetchPatient, addPatient, updatePatient, archivePatient, fetchPatientMetrics };
