import api from "@/shared/lib/axiosInstance";
import type { PageResponse } from "@/shared/types";
import type { Product, ProductFormData, InventorySummary, ProductMetrics, ProductSummary } from "@/features/inventory/types";

const fetchProducts = async (
  page = 0,
  size = 10,
  keyword?: string,
  category?: string,
  sortBy = "productName",
  sortOrder = "asc",
  stockStatus?: string,
  archivedStatus = "ACTIVE",
): Promise<PageResponse<Product>> => {
  const { data } = await api.get("/products", {
    params: {
      page,
      size,
      sortBy,
      sortOrder,
      archivedStatus,
      ...(keyword && { keyword }),
      ...(category && category !== "all" && { category }),
      ...(stockStatus && stockStatus !== "all" && { stockStatus }),
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
    params: { ...(keyword && { keyword }), ...(category && category !== "all" && { category }) },
  });
  return data;
};

const fetchRopAlertsCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get("/dashboard/rop-alerts-count");
  return data;
};

export { fetchProducts, fetchProduct, updateProduct, addProduct, archiveProduct, restoreProduct, adjustStock, fetchInventorySummary, fetchProductMetrics, fetchProductSummaries, fetchRopAlertsCount };