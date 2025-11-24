import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductForm } from "@/components/forms/ProductForm";
import type { ProductFormData } from "@/types";
import { createAddProductMutationOptions } from "@/query/productQuery";

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    createAddProductMutationOptions(queryClient, navigate)
  );

  const handleFormSubmit = async (data: ProductFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Add New Product</h2>
        <p className="text-muted-foreground">
          Enter product details to add to inventory
        </p>
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
