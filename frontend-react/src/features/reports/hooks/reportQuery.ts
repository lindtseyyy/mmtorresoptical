import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchReportData, fetchCategoryBreakdown, fetchInventoryValueTrend } from "@/features/reports/services/reportApi";

function createReportDataQueryOptions(
  reportType: string,
  minDate?: string,
  maxDate?: string
) {
  return queryOptions({
    queryKey: ["reportData", reportType, minDate, maxDate],
    queryFn: () => fetchReportData(reportType, minDate, maxDate),
    enabled:
      reportType !== "TRANSACTIONS" || (!!minDate && !!maxDate),
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

export { createReportDataQueryOptions, useReportData, useCategoryBreakdown, useInventoryValueTrend };
