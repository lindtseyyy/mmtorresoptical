import api from "@/shared/lib/axiosInstance";
import type { PageResponse } from "@/shared/types";
import type { Product, ProductFormData, InventorySummary, ProductMetrics, ProductSummary, CategoryDTO, SupplierDTO, SupplierWithProductCountDTO, CategoryWithProductCountDTO, ProductBatch, BatchBreakdownResponse, AddStockRequest, RemoveStockRequest } from "@/features/inventory/types";

const fetchProducts = async (
  page = 0,
  size = 10,
  keyword?: string,
  category?: string,
  sortBy = "productName",
  sortOrder = "asc",
  stockStatus?: string,
  archivedStatus = "ACTIVE",
  productType?: string,
): Promise<PageResponse<Product>> => {
  const { data } = await api.get("/products", {
    params: {
      page,
      size,
      sortBy,
      sortOrder,
      archivedStatus,
      ...(keyword && { keyword }),
      ...(category && category !== "all" && { categoryId: category }),
      ...(stockStatus && stockStatus !== "all" && { stockStatus }),
      ...(productType && productType !== "all" && { productType }),
    },
  });
  const pg = data.page;
  return {
    content: data.content,
    totalPages: pg.totalPages,
    totalElements: pg.totalElements,
    size: pg.size,
    number: pg.number,
  };
};

const fetchProduct = async (id: string): Promise<Product> => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

const updateProduct = async ({
  id,
  data,
  imageFile,
}: {
  id: string;
  data: ProductFormData;
  imageFile?: File | null;
}) => {
  const formData = new FormData();
  formData.append("product", new Blob([JSON.stringify(data)], { type: "application/json" }));
  if (imageFile) {
    formData.append("image", imageFile);
  }
  return await api.put(`/products/${id}`, formData);
};

const addProduct = async (data: ProductFormData, imageFile?: File | null) => {
  try {
    const formData = new FormData();
    formData.append("product", new Blob([JSON.stringify(data)], { type: "application/json" }));
    if (imageFile) {
      formData.append("image", imageFile);
    }
    return await api.post("/products", formData);
  } catch (error: any) {
    console.error(error.response?.data || error.message);
    throw error;
  }
};

// API call to archive a product (using DELETE)
const archiveProduct = async (id: string) => {
  return await api.delete(`/products/${id}`);
};

// API call to restore a product
const restoreProduct = async (id: string) => {
  return await api.put(`/products/${id}/restore`);
};

const fetchInventorySummary = async (): Promise<InventorySummary> => {
  const { data } = await api.get("/reports/inventory/summary");
  return data;
};

const fetchProductMetrics = async (productId: string): Promise<ProductMetrics> => {
  const { data } = await api.get(`/reports/inventory/product/${productId}/metrics`);
  return data;
};

interface StockAdjustmentPayload {
  adjustmentType: string;
  amount: number;
  reason: string;
}

const adjustStock = async (id: string, data: StockAdjustmentPayload) => {
  return await api.post(`/products/${id}/adjust-stock`, data);
};

const fetchProductSummaries = async (keyword?: string, category?: string): Promise<ProductSummary[]> => {
  const { data } = await api.get("/products/summary", {
    params: { ...(keyword && { keyword }), ...(category && category !== "all" && { categoryId: category }) },
  });
  return data;
};

const createCategory = async (name: string, type: string, isPerishable = false): Promise<CategoryDTO> => {
  const { data } = await api.post("/categories", null, {
    params: { name, type, isPerishable },
  });
  return data;
};

const createSupplier = async (name: string): Promise<SupplierDTO> => {
  const { data } = await api.post("/suppliers", null, {
    params: { name },
  });
  return data;
};

const fetchCategories = async (type?: string): Promise<CategoryDTO[]> => {
  const { data } = await api.get("/categories", {
    params: { ...(type && { type }) },
  });
  return data;
};

const fetchCategoriesWithProductCounts = async (type?: string): Promise<CategoryWithProductCountDTO[]> => {
  const { data } = await api.get("/categories/all", {
    params: { ...(type && { type }) },
  });
  return data;
};

const toggleCategoryActive = async (categoryId: string): Promise<CategoryDTO> => {
  const { data } = await api.patch(`/categories/${categoryId}/toggle-active`);
  return data;
};

const toggleCategoryPerishable = async (categoryId: string): Promise<CategoryDTO> => {
  const { data } = await api.patch(`/categories/${categoryId}/toggle-perishable`);
  return data;
};

const updateCategory = async (categoryId: string, name: string): Promise<CategoryDTO> => {
  const { data } = await api.patch(`/categories/${categoryId}`, null, {
    params: { name },
  });
  return data;
};

const deleteCategory = async (categoryId: string): Promise<void> => {
  await api.delete(`/categories/${categoryId}`);
};

const fetchRopAlertsCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get("/dashboard/rop-alerts-count");
  return data;
};

const fetchSuppliers = async (): Promise<SupplierDTO[]> => {
  const { data } = await api.get("/suppliers");
  return data;
};

const fetchSuppliersWithProductCounts = async (): Promise<SupplierWithProductCountDTO[]> => {
  const { data } = await api.get("/suppliers/all");
  return data;
};

const toggleSupplierActive = async (supplierId: string): Promise<SupplierDTO> => {
  const { data } = await api.patch(`/suppliers/${supplierId}/toggle-active`);
  return data;
};

const updateSupplier = async (supplierId: string, name: string): Promise<SupplierDTO> => {
  const { data } = await api.patch(`/suppliers/${supplierId}`, null, {
    params: { name },
  });
  return data;
};

const deleteSupplier = async (supplierId: string): Promise<void> => {
  await api.delete(`/suppliers/${supplierId}`);
};

const fetchProductBatches = async (productId: string): Promise<BatchBreakdownResponse> => {
  const { data } = await api.get(`/products/${productId}/batches`);
  return data;
};

const fetchAvailableBatches = async (productId: string): Promise<ProductBatch[]> => {
  const { data } = await api.get(`/products/${productId}/available-batches`);
  return data;
};

const addStockToBatch = async (productId: string, payload: AddStockRequest) => {
  const { data } = await api.post(`/products/${productId}/add-stock`, payload);
  return data;
};

const removeStockFromBatch = async (productId: string, payload: RemoveStockRequest) => {
  const { data } = await api.post(`/products/${productId}/remove-stock`, payload);
  return data;
};

export { fetchProducts, fetchProduct, updateProduct, addProduct, archiveProduct, restoreProduct, adjustStock, fetchInventorySummary, fetchProductMetrics, fetchProductSummaries, fetchCategories, fetchCategoriesWithProductCounts, toggleCategoryActive, toggleCategoryPerishable, updateCategory, deleteCategory, createCategory, fetchRopAlertsCount, fetchSuppliers, fetchSuppliersWithProductCounts, toggleSupplierActive, updateSupplier, deleteSupplier, createSupplier, fetchProductBatches, fetchAvailableBatches, addStockToBatch, removeStockFromBatch };