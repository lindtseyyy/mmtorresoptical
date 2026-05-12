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

export interface PrescriptionItemResponse {
  prescriptionItemId: string;
  correctionType: string;
  eyeSide: string;
  sph: number | null;
  cyl: number | null;
  axis: number | null;
  addPower: number | null;
  pd: number | null;
  lensType: string | null;
  frameTypePreference: string | null;
  lensCoatings: string | null;
  lensMaterial: string | null;
  lensWearType: string | null;
  lensMaterialCl: string | null;
  baseCurve: number | null;
  diameter: number | null;
  followUpRequired: boolean;
  followUpDate: string | null;
  followUpReason: string | null;
  followUpStatus: string | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  createdBy: { userId: string; fullName: string } | null;
}

export interface PrescriptionResponse {
  prescriptionId: string;
  examDate: string;
  notes: string | null;
  createdAt: string;
  isArchived: boolean;
  createdBy: { userId: string; fullName: string } | null;
  prescriptionItems: PrescriptionItemResponse[];
}

export interface UpdatePrescriptionInput {
  examDate: string;
  notes?: string;
}

export interface UpdatePrescriptionItemInput {
  correctionType?: string;
  eyeSide?: string;
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
}

const createPrescription = async (
  patientId: string,
  data: CreatePrescriptionInput,
) => {
  return await api.post(`/admin/patient/${patientId}/prescriptions`, data);
};

const fetchPrescription = async (id: string): Promise<PrescriptionResponse> => {
  const { data } = await api.get(`/admin/prescriptions/${id}`);
  return data;
};

const updatePrescription = async (id: string, data: UpdatePrescriptionInput) => {
  return await api.put(`/admin/prescriptions/${id}`, data);
};

const updatePrescriptionItem = async (id: string, data: UpdatePrescriptionItemInput) => {
  return await api.put(`/admin/prescription-items/${id}`, data);
};

const archivePrescriptionItem = async (id: string) => {
  return await api.delete(`/admin/prescription-items/${id}`);
};

const createPrescriptionItems = async (prescriptionId: string, items: PrescriptionItemInput[]) => {
  return await api.post(`/admin/prescriptions/${prescriptionId}/prescription-items`, items);
};

export { createPrescription, fetchPrescription, updatePrescription, updatePrescriptionItem, archivePrescriptionItem, createPrescriptionItems };
