import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductForm } from "@/features/inventory/components/ProductForm";
import type { ProductFormData } from "@/features/inventory/types";
import { getImageUrl } from "@/shared/lib/utils";
import {
  createEditProductMutationOptions,
  createEditProductQueryOptions,
} from "@/features/inventory/hooks/productQuery";

const EditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: product, isLoading: isLoadingData } = useQuery(
    createEditProductQueryOptions(id!)
  );

  const mutation = useMutation(
    createEditProductMutationOptions(queryClient, navigate, id!)
  );

  const handleFormSubmit = async (data: ProductFormData, imageFile?: File | null) => {
    mutation.mutate({ data, imageFile });
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const existingImageUrl = getImageUrl(product?.imageDir);

  // ✅ Map API Product to FormData with proper enum cast
  const defaultValues: ProductFormData | undefined = product
    ? {
        productName: product.productName,
        category: product.category as ProductFormData["category"],
        supplier: product.supplier,
        productType: product.productType as ProductFormData["productType"],
        unitPrice: product.unitPrice,
        quantity: product.quantity,
        lowLevelThreshold: product.lowLevelThreshold,
        overstockedThreshold: product.overstockedThreshold,
        isArchived: product.isArchived,
        imageDir: product.imageDir || "",
      }
    : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Edit Product</h2>
        <p className="text-muted-foreground">Update item details</p>
      </div>
      <ProductForm
        onFormSubmit={handleFormSubmit}
        isLoading={mutation.isPending}
        isEditMode={true}
        defaultValues={defaultValues}
        productId={id}
        existingImageUrl={existingImageUrl}
      />
    </div>
  );
};

export default EditProduct;
