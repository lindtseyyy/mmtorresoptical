import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductForm } from "@/components/forms/ProductForm";
import type { ProductFormData, Product } from "@/types";
import axios from "axios";
import { toast } from "sonner";

const fetchProduct = async (id: string): Promise<Product> => {
  const token = localStorage.getItem("authToken");
  const { data } = await axios.get(`http://localhost:8080/api/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

const updateProduct = async ({
  id,
  data,
}: {
  id: string;
  data: ProductFormData;
}) => {
  const token = localStorage.getItem("authToken");
  return await axios.put(`http://localhost:8080/api/products/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const EditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: product, isLoading: isLoadingData } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: ProductFormData) => updateProduct({ id: id!, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      toast.success("Product Updated", {
        description: "Successfully updated.",
      });
      navigate("/inventory");
    },
    onError: () => {
      toast.error("Error", { description: "Failed to update product." });
    },
  });

  const handleFormSubmit = async (data: ProductFormData) => {
    mutation.mutate(data);
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // ✅ Map API Product to FormData with proper enum cast
  const defaultValues: ProductFormData | undefined = product
    ? {
        productName: product.productName,
        category: product.category as ProductFormData["category"],
        supplier: product.supplier,
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
        <p className="text-muted-foreground">Update product details</p>
      </div>
      <ProductForm
        onFormSubmit={handleFormSubmit}
        isLoading={mutation.isPending}
        isEditMode={true}
        defaultValues={defaultValues}
      />
    </div>
  );
};

export default EditProduct;
