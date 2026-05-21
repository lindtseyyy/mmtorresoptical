import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PatientForm } from "@/features/patients/components/PatientForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  createEditPatientMutationOptions,
  createEditPatientQueryOptions,
} from "@/features/patients/hooks/patientQuery";

const EditPatient: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: patient, isLoading: isLoadingData } = useQuery(
    createEditPatientQueryOptions(id!)
  );

  const { isPending, mutateAsync } = useMutation(
    createEditPatientMutationOptions(queryClient, navigate, id!)
  );

  const formDefaultValues = patient
    ? {
        firstName: patient.firstName,
        middleName: patient.middleName ?? undefined,
        lastName: patient.lastName,
        sex: patient.sex as "Male" | "Female",
        birthDate: patient.birthDate,
        email: patient.email,
        contactNumber: patient.contactNumber,
        address: patient.address,
        isArchived: patient.isArchived,
      }
    : undefined;

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">Edit Patient</h2>
          <p className="text-muted-foreground">
            Update patient details and information
          </p>
        </div>
        <Button variant="secondary" size="sm" className="text-sm" asChild>
          <Link to={`/patients/view/${id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Patient
          </Link>
        </Button>
      </div>
      <PatientForm
        onFormSubmit={mutateAsync}
        isLoading={isPending}
        isEditMode={true}
        patientId={id}
        defaultValues={formDefaultValues}
      />
    </div>
  );
};

export default EditPatient;
