import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserForm } from "@/components/forms/UserForm";
import type { UserFormData } from "@/types";
import { createAddUserMutationOptions } from "@/query/userQuery";

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    createAddUserMutationOptions(queryClient, navigate)
  );

  const handleFormSubmit = async (data: UserFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Add New User</h2>
        <p className="text-muted-foreground">
          Create a new system user account
        </p>
      </div>
      <UserForm
        onFormSubmit={handleFormSubmit}
        isLoading={mutation.isPending}
        isEditMode={false}
      />
    </div>
  );
};

export default AddUser;
