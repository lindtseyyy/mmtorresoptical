import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/features/inventory/components/ProductForm";
import type { ProductFormData } from "@/features/inventory/types";
import { createAddProductMutationOptions } from "@/features/inventory/hooks/productQuery";
import { Button } from "@/shared/components/ui/button";

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    createAddProductMutationOptions(queryClient, navigate)
  );

  const handleFormSubmit = async (data: ProductFormData, imageFile?: File | null) => {
    mutation.mutate({ data, imageFile });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">Add New Item to Catalog</h2>
          <p className="text-muted-foreground">
            Enter item details to add to inventory
          </p>
        </div>
        <Button variant="secondary" size="sm" className="text-xs" asChild>
          <Link to="/inventory">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Inventory
          </Link>
        </Button>
      </div>
      <ProductForm
        onFormSubmit={handleFormSubmit}
        isLoading={mutation.isPending}
        isEditMode={false}
      />
    </div>
  );
};

export default AddProduct;
