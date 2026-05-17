import api from "@/shared/lib/axiosInstance";
import type { PageResponse } from "@/shared/types";
import type { ReportData, CategoryBreakdownDTO, InventoryValueTrendPoint, PatientGrowthPoint, ProductDetailsDTO, TransactionMonthlyTrendPoint } from "@/features/reports/types";

const fetchReportData = async (
  reportType: string,
  minDate?: string,
  maxDate?: string
): Promise<ReportData> => {
  const { data } = await api.get(`/reports/data/${reportType}`, {
    params: {
      ...(minDate && { minDate }),
      ...(maxDate && { maxDate }),
    },
  });
  return data;
};

const downloadPdfReport = async (
  reportType: string,
  minDate?: string,
  maxDate?: string
): Promise<void> => {
  const response = await api.get(`/reports/pdf/${reportType}`, {
    params: {
      ...(minDate && { minDate }),
      ...(maxDate && { maxDate }),
    },
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"] as string | undefined;
  let filename = `${reportType.toLowerCase()}_report.pdf`;
  if (contentDisposition) {
    const match = /filename="?([^";\n]+)"?/.exec(contentDisposition);
    if (match?.[1]) filename = match[1];
  }

  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const downloadExcelReport = async (
  reportType: string,
  minDate?: string,
  maxDate?: string
): Promise<void> => {
  const response = await api.get(`/reports/excel/${reportType}`, {
    params: {
      ...(minDate && { minDate }),
      ...(maxDate && { maxDate }),
    },
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"] as string | undefined;
  let filename = `${reportType.toLowerCase()}_report.xlsx`;
  if (contentDisposition) {
    const match = /filename="?([^";\n]+)"?/.exec(contentDisposition);
    if (match?.[1]) filename = match[1];
  }

  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const fetchCategoryBreakdown = async (): Promise<CategoryBreakdownDTO[]> => {
  const { data } = await api.get("/reports/inventory/category-breakdown");
  return data;
};

const fetchInventoryValueTrend = async (): Promise<InventoryValueTrendPoint[]> => {
  const { data } = await api.get("/reports/inventory/value-trend");
  return data;
};

const fetchLowStockProducts = async (page: number, size: number): Promise<PageResponse<ProductDetailsDTO>> => {
  const { data } = await api.get("/reports/inventory/lowstock-products", {
    params: { page, size, sortBy: "quantity", sortOrder: "asc" },
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

const fetchOverstockedProducts = async (page: number, size: number): Promise<PageResponse<ProductDetailsDTO>> => {
  const { data } = await api.get("/reports/inventory/overstocked-products", {
    params: { page, size, sortBy: "quantity", sortOrder: "desc" },
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

const fetchOutOfStockProducts = async (page: number, size: number): Promise<PageResponse<ProductDetailsDTO>> => {
  const { data } = await api.get("/reports/inventory/outofstock-products", {
    params: { page, size, sortBy: "quantity", sortOrder: "asc" },
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

const fetchPatientGrowthTrend = async (): Promise<PatientGrowthPoint[]> => {
  const { data } = await api.get("/reports/patient-growth-trend");
  return data;
};

const fetchTransactionMonthlyTrend = async (): Promise<TransactionMonthlyTrendPoint[]> => {
  const { data } = await api.get("/reports/transaction-monthly-trend");
  return data;
};

export { fetchReportData, downloadPdfReport, downloadExcelReport, fetchCategoryBreakdown, fetchInventoryValueTrend, fetchLowStockProducts, fetchOverstockedProducts, fetchOutOfStockProducts, fetchPatientGrowthTrend, fetchTransactionMonthlyTrend };
