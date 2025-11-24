import { queryOptions } from "@tanstack/react-query";
import { fetchProducts, fetchProduct, addProduct, updateProduct, archiveProduct } from "@/api/productApi";
import { toast } from "sonner";
import type { NavigateFunction } from "react-router";
import type { ProductFormData } from "@/types"; 

function createProductsListQueryOptions() {
    return queryOptions({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })
}

function createEditProductQueryOptions(id: string) {
    return queryOptions({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  })
}

function createAddProductMutationOptions(queryClient: any, navigate: NavigateFunction) {
    return {
        mutationFn: addProduct,
        onSuccess: () => {
          // Invalidate the "products" query to refetch new data
          queryClient.invalidateQueries({ queryKey: ["products"] });
          toast.success("Product Added", {
            description: "The product has been successfully added to inventory.",
          });
          navigate("/inventory");
        },
        onError: (error: any) => {
          toast.error("Error", {
            description: "Failed to add product. Please try again.",
          });
          console.error(error);
        },
      }
}

function createEditProductMutationOptions(queryClient: any, navigate: NavigateFunction, id: string) {
    return {
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
      }
    }

function createArchiveProductMutationOptions(queryClient: any) {
    return {
    mutationFn: archiveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product Archived", {
        description: "The product has been successfully archived.",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to archive product.",
      });
    },
  }
}

export {createProductsListQueryOptions, createEditProductQueryOptions, createAddProductMutationOptions, createEditProductMutationOptions, createArchiveProductMutationOptions}