import api from "@/lib/axiosInstance";
import type { Product, ProductFormData } from "@/types";

// API call to fetch all products
const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await api.get("/api/products");
  return data;
};

const fetchProduct = async (id: string): Promise<Product> => {
  const { data } = await api.get(`/api/products/${id}`);
  return data;
};

const updateProduct = async ({
  id,
  data,
}: {
  id: string;
  data: ProductFormData;
}) => {
  return await api.put(`/api/products/${id}`, data);
};

// This is the API call
const addProduct = async (data: ProductFormData) => {
  try {
    return await api.post("/api/products", data);
  } catch (error: any) {
    console.error(error.response?.data || error.message);
    throw error;
  }
};

// API call to archive a product (using DELETE)
const archiveProduct = async (id: string) => {
  return await api.delete(`/api/products/${id}`);
};

export { fetchProducts, fetchProduct, updateProduct, addProduct, archiveProduct };