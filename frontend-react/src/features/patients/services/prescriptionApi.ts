import api from "@/shared/lib/axiosInstance";

export interface PrescriptionItemInput {
  correctionType: string;
  eyeSide: string;
  sph?: number;
  cyl?: number;
  axis?: number;
  addPower?: number;
  pd?: number;
  lensType?: string;
  frameTypePreference?: string;
  lensCoatings?: string;
  lensMaterial?: string;
  lensWearType?: string;
  lensMaterialCl?: string;
  baseCurve?: number;
  diameter?: number;
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpReason?: string;
  followUpStatus?: string;
  notes?: string;
  isArchived?: boolean;
}

export interface CreatePrescriptionInput {
  examDate: string;
  notes?: string;
  isArchived?: boolean;
  itemsRequestDTOList: PrescriptionItemInput[];
}

const createPrescription = async (
  patientId: string,
  data: CreatePrescriptionInput,
) => {
  return await api.post(`/admin/patient/${patientId}/prescriptions`, data);
};

export { createPrescription };
