import api from "@/lib/axiosInstance";
import type { Product, ProductFormData, PageResponse, InventorySummary } from "@/types";

const fetchProducts = async (
  page = 0,
  size = 10,
  keyword?: string,
  category?: string,
  sortBy = "productName",
  sortOrder = "asc",
  stockStatus?: string,
): Promise<PageResponse<Product>> => {
  const { data } = await api.get("/products", {
    params: {
      page,
      size,
      sortBy,
      sortOrder,
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
}: {
  id: string;
  data: ProductFormData;
}) => {
  return await api.put(`/products/${id}`, data);
};

const addProduct = async (data: ProductFormData) => {
  try {
    return await api.post("/products", [data]);
  } catch (error: any) {
    console.error(error.response?.data || error.message);
    throw error;
  }
};

// API call to archive a product (using DELETE)
const archiveProduct = async (id: string) => {
  return await api.delete(`/products/${id}`);
};

const fetchInventorySummary = async (): Promise<InventorySummary> => {
  const { data } = await api.get("/reports/inventory/summary");
  return data;
};

export { fetchProducts, fetchProduct, updateProduct, addProduct, archiveProduct, fetchInventorySummary };