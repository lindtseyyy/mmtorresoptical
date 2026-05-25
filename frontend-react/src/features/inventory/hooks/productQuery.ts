import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchProduct, addProduct, updateProduct, archiveProduct, restoreProduct, adjustStock, fetchInventorySummary, fetchProductSummaries, fetchRopAlertsCount } from "@/features/inventory/services/productApi";
import { toast } from "sonner";
import type { NavigateFunction } from "react-router";
import type { ProductFormData } from "@/features/inventory/types";

function createProductsListQueryOptions(
  page: number,
  size: number,
  keyword?: string,
  category?: string,
  sortBy?: string,
  sortOrder?: string,
  stockStatus?: string,
  archivedStatus?: string,
) {
  return queryOptions({
    queryKey: ["products", page, size, keyword ?? "", category ?? "all", sortBy ?? "productName", sortOrder ?? "asc", stockStatus ?? "all", archivedStatus ?? "ACTIVE"],
    queryFn: () => fetchProducts(page, size, keyword, category, sortBy, sortOrder, stockStatus, archivedStatus),
  });
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
        mutationFn: ({ data, imageFile }: { data: ProductFormData; imageFile?: File | null }) => addProduct(data, imageFile),
        onSuccess: () => {
          // Invalidate the "products" query to refetch new data
          queryClient.invalidateQueries({ queryKey: ["products"] });
          toast.success("Item Added", {
            description: "The item has been successfully added to inventory.",
          });
          navigate("/inventory");
        },
        onError: (error: any) => {
          toast.error("Error", {
            description: "Failed to add item. Please try again.",
          });
          console.error(error);
        },
      }
}

function createEditProductMutationOptions(queryClient: any, navigate: NavigateFunction, id: string) {
    return {
        mutationFn: ({ data, imageFile }: { data: ProductFormData; imageFile?: File | null }) => updateProduct({ id: id!, data, imageFile }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["product", id] });
          toast.success("Product Updated", {
            description: "Successfully updated.",
          });
          navigate(`/inventory/view/${id}`);
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
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
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

function createRestoreProductMutationOptions(queryClient: any) {
    return {
    mutationFn: restoreProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      toast.success("Product Restored", {
        description: "The product has been successfully restored.",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to restore product.",
      });
    },
  }
}

function createAdjustStockMutationOptions(queryClient: any) {
  return {
    mutationFn: ({ id, data }: { id: string; data: { adjustmentType: string; amount: number; reason: string } }) =>
      adjustStock(id, data),
    onSuccess: (_data: any, variables: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      toast.success("Stock Adjusted", {
        description: "The stock quantity has been updated successfully.",
      });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to adjust stock. Please try again.";
      toast.error("Error", { description: message });
    },
  };
}

function createInventorySummaryQueryOptions() {
    return queryOptions({
    queryKey: ["inventory-summary"],
    queryFn: fetchInventorySummary,
    staleTime: 30_000,
  })
}

function createRopAlertsCountQueryOptions() {
  return queryOptions({
    queryKey: ["rop-alerts-count"],
    queryFn: fetchRopAlertsCount,
    staleTime: 30_000,
  });
}

export {createProductsListQueryOptions, createEditProductQueryOptions, createAddProductMutationOptions, createEditProductMutationOptions, createArchiveProductMutationOptions, createRestoreProductMutationOptions, createAdjustStockMutationOptions, createInventorySummaryQueryOptions, createRopAlertsCountQueryOptions}

export const useProductSummaries = (keyword?: string, category?: string) =>
  useQuery({
    queryKey: ["products", "summary", keyword ?? "", category ?? ""],
    queryFn: () => fetchProductSummaries(keyword, category),
    staleTime: 60_000,
  });