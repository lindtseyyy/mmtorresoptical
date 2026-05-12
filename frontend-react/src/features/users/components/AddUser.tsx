import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserForm } from "@/features/users/components/UserForm";
import type { UserFormData } from "@/features/users/types";
import { createAddUserMutationOptions } from "@/features/users/hooks/userQuery";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">Add New User</h2>
          <p className="text-muted-foreground">
            Create a new system user account
          </p>
        </div>
        <Button variant="secondary" size="sm" className="text-sm" asChild>
          <Link to="/users">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
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
