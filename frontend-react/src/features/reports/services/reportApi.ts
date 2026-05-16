import api from "@/shared/lib/axiosInstance";
import type { ReportData } from "@/features/reports/types";

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

export { fetchReportData, downloadPdfReport, downloadExcelReport };
