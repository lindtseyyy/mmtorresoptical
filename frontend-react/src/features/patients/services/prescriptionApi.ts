import api from "@/shared/lib/axiosInstance";

export interface LensSpecification {
  lensTypePurpose?: string;
  correctionType?: string;
  rightSph?: number;
  rightCyl?: number;
  rightAxis?: number;
  rightPrism?: number;
  rightAdd?: number;
  rightPd?: number;
  leftSph?: number;
  leftCyl?: number;
  leftAxis?: number;
  leftPrism?: number;
  leftAdd?: number;
  leftPd?: number;
  lensType?: string;
  frameTypePreference?: string;
  lensCoatings?: string;
  lensMaterial?: string;
  lensWearType?: string;
  lensMaterialCl?: string;
  baseCurve?: number;
  diameter?: number;
  notes?: string;
}

export interface CreatePrescriptionInput {
  issueDate: string;
  notes?: string;
  isArchived?: boolean;
  followUpScheduledDate?: string;
  followUpReason?: string;
  eyeExamId?: string;
  lensSpecifications: LensSpecification[];
  products: RecommendationItemInput[];
}

export interface RecommendationItemInput {
  productId: string;
  quantity: number;
  staffNotes?: string;
}

export interface PrescriptionRecommendationsPayload {
  lensSpecifications?: LensSpecification[];
  items: RecommendationItemInput[];
}

export interface RecommendationResponse {
  id: string;
  productId: string;
  productName: string;
  category: string;
  supplier: string;
  imageDir: string;
  productType: string;
  unitPrice: number;
  stockQuantity: number;
  quantity: number;
  staffNotes?: string;
}

export interface PrescriptionResponse {
  prescriptionId: string;
  rxNumber: string;
  issueDate: string;
  notes: string | null;
  status: string;
  eyeExamId?: string | null;
  eyeExamNumber?: string | null;
  createdAt: string;
  isArchived: boolean;
  createdBy: { userId: string; fullName: string } | null;
  lensSpecifications: LensSpecification[];
  recommendations?: RecommendationResponse[];
}

export interface UpdatePrescriptionInput {
  issueDate: string;
  notes?: string;
}

export interface VoidPrescriptionRequest {
  voidReason: string;
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

const voidPrescription = async (id: string, voidReason: string) => {
  return await api.post(`/admin/prescriptions/${id}/void`, { voidReason });
};

const clonePrescription = async (id: string): Promise<PrescriptionResponse> => {
  const { data } = await api.post(`/admin/prescriptions/${id}/clone`);
  return data;
};

const syncPrescriptionBlocks = async (
  id: string,
  payload: PrescriptionRecommendationsPayload
): Promise<void> => {
  await api.put(`/prescriptions/${id}/sync`, payload);
};

const fetchPrescriptionForCheckout = async (id: string): Promise<PrescriptionResponse> => {
  const { data } = await api.get(`/prescriptions/${id}`);
  return data;
};

const fetchPatientPrescriptions = async (
  patientId: string,
  params?: { page?: number; size?: number }
): Promise<{ content: PrescriptionResponse[] }> => {
  const { data } = await api.get(`/patient/${patientId}/prescriptions`, {
    params: {
      page: params?.page ?? 0,
      size: params?.size ?? 50,
      status: "ACTIVE",
    },
  });
  return data;
};

export {
  createPrescription,
  fetchPrescription,
  updatePrescription,
  voidPrescription,
  clonePrescription,
  syncPrescriptionBlocks,
  fetchPrescriptionForCheckout,
  fetchPatientPrescriptions,
};
