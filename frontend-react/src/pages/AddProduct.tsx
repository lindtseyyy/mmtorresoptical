import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductForm } from "@/components/forms/ProductForm";
import type { ProductFormData } from "@/types";
import axios from "axios";
import { toast } from "sonner";

// This is the API call
const addProduct = async (data: ProductFormData) => {
  const token = localStorage.getItem("authToken");
  try {
    return await axios.post("http://localhost:8080/api/products", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error: any) {
    console.error(error.response?.data || error.message);
    throw error;
  }
};

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      // Invalidate the "products" query to refetch new data
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product Added", {
        description: "The product has been successfully added to inventory.",
      });
      navigate("/inventory");
    },
    onError: (error) => {
      toast.error("Error", {
        description: "Failed to add product. Please try again.",
      });
      console.error(error);
    },
  });

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
