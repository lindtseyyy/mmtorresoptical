import api from "@/lib/axiosInstance";
import type { Product, ProductFormData, PageResponse } from "@/types";

const fetchProducts = async (page = 0, size = 10): Promise<PageResponse<Product>> => {
  const { data } = await api.get("/products", { params: { page, size } });
  console.log("Fetched products:", data);
  return {
    content: data.content,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
    size: data.size,
    number: data.number,
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

export { fetchProducts, fetchProduct, updateProduct, addProduct, archiveProduct };