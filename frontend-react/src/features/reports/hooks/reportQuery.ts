import { queryOptions, useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchReportData, fetchPatientGrowthTrend, fetchCategoryBreakdown, fetchInventoryValueTrend, fetchLowStockProducts, fetchOverstockedProducts, fetchOutOfStockProducts, fetchTransactionMonthlyTrend } from "@/features/reports/services/reportApi";

function createReportDataQueryOptions(
  reportType: string,
  minDate?: string,
  maxDate?: string
) {
  return queryOptions({
    queryKey: ["reportData", reportType, minDate, maxDate],
    queryFn: () => fetchReportData(reportType, minDate, maxDate),
    enabled: true,
  });
}

function usePatientGrowthTrend() {
  return useQuery({
    queryKey: ["patientGrowthTrend"],
    queryFn: fetchPatientGrowthTrend,
    staleTime: 60_000,
  });
}

function useReportData(
  reportType: string,
  minDate?: string,
  maxDate?: string
) {
  return useQuery(createReportDataQueryOptions(reportType, minDate, maxDate));
}

function useCategoryBreakdown() {
  return useQuery({
    queryKey: ["categoryBreakdown"],
    queryFn: fetchCategoryBreakdown,
    staleTime: 60_000,
  });
}

function useInventoryValueTrend() {
  return useQuery({
    queryKey: ["inventoryValueTrend"],
    queryFn: fetchInventoryValueTrend,
    staleTime: 60_000,
  });
}

function useLowStockProducts(page: number, size: number) {
  return useQuery({
    queryKey: ["lowStockProducts", page, size],
    queryFn: () => fetchLowStockProducts(page, size),
    placeholderData: keepPreviousData,
  });
}

function useOverstockedProducts(page: number, size: number) {
  return useQuery({
    queryKey: ["overstockedProducts", page, size],
    queryFn: () => fetchOverstockedProducts(page, size),
    placeholderData: keepPreviousData,
  });
}

function useOutOfStockProducts(page: number, size: number) {
  return useQuery({
    queryKey: ["outOfStockProducts", page, size],
    queryFn: () => fetchOutOfStockProducts(page, size),
    placeholderData: keepPreviousData,
  });
}

function useTransactionMonthlyTrend() {
  return useQuery({
    queryKey: ["transactionMonthlyTrend"],
    queryFn: fetchTransactionMonthlyTrend,
    staleTime: 60_000,
  });
}

export { createReportDataQueryOptions, useReportData, usePatientGrowthTrend, useCategoryBreakdown, useInventoryValueTrend, useLowStockProducts, useOverstockedProducts, useOutOfStockProducts, useTransactionMonthlyTrend };
