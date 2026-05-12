import { queryOptions } from "@tanstack/react-query";
import {
  fetchPatients,
  fetchPatient,
  addPatient,
  updatePatient,
  archivePatient,
  fetchPatientMetrics,
} from "@/features/patients/services/patientApi";
import { toast } from "sonner";
import type { NavigateFunction } from "react-router-dom";
import type { PatientFormData } from "@/features/patients/types";

function createPatientsListQueryOptions(
  page: number,
  size: number,
  keyword?: string,
  sortBy?: string,
  sortOrder?: string,
  archivedStatus?: string,
) {
  return queryOptions({
    queryKey: [
      "patients",
      page,
      size,
      keyword ?? "",
      sortBy ?? "fullNameSortable",
      sortOrder ?? "asc",
      archivedStatus ?? "ACTIVE",
    ],
    queryFn: () =>
      fetchPatients(page, size, keyword, sortBy, sortOrder, archivedStatus),
  });
}

function createEditPatientQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["patient", id],
    queryFn: () => fetchPatient(id!),
    enabled: !!id,
  });
}

function createAddPatientMutationOptions(
  queryClient: any,
  navigate: NavigateFunction,
) {
  return {
    mutationFn: addPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-metrics"] });
      toast.success("Patient Added", {
        description: "The patient has been successfully added.",
      });
      navigate("/patients");
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: "Failed to add patient. Please try again.",
      });
      console.error(error);
    },
  };
}

function createEditPatientMutationOptions(
  queryClient: any,
  navigate: NavigateFunction,
  id: string,
) {
  return {
    mutationFn: (data: PatientFormData) => updatePatient({ id: id!, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      toast.success("Patient Updated", {
        description: "Successfully updated.",
      });
      navigate("/patients");
    },
    onError: () => {
      toast.error("Error", { description: "Failed to update patient." });
    },
  };
}

function createArchivePatientMutationOptions(queryClient: any) {
  return {
    mutationFn: archivePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-metrics"] });
      toast.success("Patient Archived", {
        description: "The patient has been successfully archived.",
      });
    },
    onError: () => {
      toast.error("Error", { description: "Failed to archive patient." });
    },
  };
}

function createPatientMetricsQueryOptions() {
  return queryOptions({
    queryKey: ["patient-metrics"],
    queryFn: fetchPatientMetrics,
    staleTime: 30_000,
  });
}

export {
  createPatientsListQueryOptions,
  createEditPatientQueryOptions,
  createAddPatientMutationOptions,
  createEditPatientMutationOptions,
  createArchivePatientMutationOptions,
  createPatientMetricsQueryOptions,
};
