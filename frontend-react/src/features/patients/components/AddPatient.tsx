import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PatientForm } from "@/features/patients/components/PatientForm";
import type { PatientFormData } from "@/features/patients/types";
import { addPatient } from "@/features/patients/services/patientApi";
import { ArrowLeft, Stethoscope, ClipboardList, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { toast } from "sonner";

const AddPatient: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: addPatient,
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-metrics"] });
      const patient = response?.data;
      setCreatedPatient({
        id: patient?.patientId ?? "",
        name: [patient?.firstName, patient?.lastName].filter(Boolean).join(" "),
      });
      setDialogOpen(true);
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: "Failed to add patient. Please try again.",
      });
      console.error(error);
    },
  });

  const handleFormSubmit = async (data: PatientFormData) => {
    mutation.mutate(data);
  };

  const handleAddPrescription = () => {
    setDialogOpen(false);
    if (createdPatient) {
      navigate(
        `/patients/add/prescription?patientId=${createdPatient.id}&patientName=${encodeURIComponent(createdPatient.name)}`,
      );
    }
  };

  const handleAddHealthHistory = () => {
    setDialogOpen(false);
    if (createdPatient) {
      navigate(
        `/patients/add/health-history?patientId=${createdPatient.id}&patientName=${encodeURIComponent(createdPatient.name)}`,
      );
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    toast.success("Patient Added", {
      description: "The patient has been successfully added.",
    });
    navigate("/patients");
  };

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold">Add New Patient</h2>
            <p className="text-muted-foreground">
              Create a new patient record
            </p>
          </div>
          <Button variant="secondary" size="sm" className="text-sm" asChild>
            <Link to="/patients">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Patients
            </Link>
          </Button>
        </div>
        <PatientForm
          onFormSubmit={handleFormSubmit}
          isLoading={mutation.isPending}
          isEditMode={false}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Patient Created Successfully</DialogTitle>
          <DialogDescription>
            What would you like to do next for{" "}
            <span className="font-semibold text-foreground">
              {createdPatient?.name}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleAddPrescription}
            className="w-full justify-start gap-3 py-4 h-auto"
          >
            <Stethoscope className="h-5 w-5 shrink-0" />
            <div className="text-left">
              <div className="font-medium">Add a Prescription</div>
              <div className="text-xs opacity-80">
                Record exam date, prescription items, and lens details
              </div>
            </div>
          </Button>
          <Button
            onClick={handleAddHealthHistory}
            variant="secondary"
            className="w-full justify-start gap-3 py-4 h-auto"
          >
            <ClipboardList className="h-5 w-5 shrink-0" />
            <div className="text-left">
              <div className="font-medium">Add Patient Health History</div>
              <div className="text-xs opacity-80">
                Record eye conditions, medications, allergies, and visual acuity
              </div>
            </div>
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="w-full justify-start gap-3 py-4 h-auto"
          >
            <X className="h-5 w-5 shrink-0" />
            <div className="text-left">
              <div className="font-medium">Cancel</div>
              <div className="text-xs opacity-80">
                Save only the patient record and return to the list
              </div>
            </div>
          </Button>
        </div>
      </Dialog>
    </>
  );
};

export default AddPatient;
