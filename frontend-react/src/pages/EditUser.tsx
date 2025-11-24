import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserForm } from "@/components/forms/UserForm";
import {
  createEditUserMutationOptions,
  createEditUserQueryOptions,
} from "@/query/userQuery";

const EditUser: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  console.log("Editing user:", id);

  const { data: user, isLoading: isLoadingData } = useQuery(
    createEditUserQueryOptions(id!)
  );

  console.log("Fetched user data:", user);

  const { isPending, mutateAsync } = useMutation(
    createEditUserMutationOptions(queryClient, navigate, id!)
  );

  // Transform user data to match form expectations
  const formDefaultValues = user
    ? {
        firstName: user.firstName,
        middleName: user.middleName ?? undefined,
        lastName: user.lastName,
        gender: user.gender as "Male" | "Female" | "Other",
        birthDate: user.birthDate,
        email: user.email,
        contactNumber: user.contactNumber,
        username: user.username,
        role: user.role as "Admin" | "Staff",
        isArchived: user.isArchived,
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
      <div>
        <h2 className="text-3xl font-bold">Edit User</h2>
        <p className="text-muted-foreground">
          Update user details and permissions
        </p>
      </div>
      <UserForm
        onFormSubmit={mutateAsync}
        isLoading={isPending}
        isEditMode={true}
        defaultValues={formDefaultValues}
      />
    </div>
  );
};

export default EditUser;
