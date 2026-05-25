import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(imageDir: string | null | undefined): string | null {
  if (!imageDir) return null;
  if (imageDir === "default_product_logo.png") {
    return "/default_product_logo.png";
  }
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
  return `${BASE_URL}/products/images/${imageDir}`;
}
