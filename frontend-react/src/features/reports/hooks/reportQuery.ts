import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchReportData } from "@/features/reports/services/reportApi";

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

export { createReportDataQueryOptions, useReportData };
