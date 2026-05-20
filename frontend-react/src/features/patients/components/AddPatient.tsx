import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PatientForm } from "@/features/patients/components/PatientForm";
import type { PatientFormData } from "@/features/patients/types";
import { addPatient } from "@/features/patients/services/patientApi";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";

const AddPatient: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
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
  });

  const handleFormSubmit = async (data: PatientFormData) => {
    mutation.mutate(data);
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

    </>
  );
};

export default AddPatient;
