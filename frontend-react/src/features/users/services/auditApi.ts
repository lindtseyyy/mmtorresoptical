import type { PageResponse } from "@/shared/types";
import api from "@/shared/lib/axiosInstance";

export interface AuditLogEntry {
  logId: string;
  actionType: string;
  resourceType: string;
  resourceId: string | null;
  details: string;
  detailsJson: string | null;
  loggedAt: string;
  userId: string;
}

export interface AuditLogParams {
  keyword?: string;
  userId?: string;
  actionType?: string;
  resourceType?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: string;
  minDate?: string;
  maxDate?: string;
}

const fetchAuditLogs = async (params: AuditLogParams): Promise<PageResponse<AuditLogEntry>> => {
  const { data } = await api.get("/audit", { params });
  return {
    content: data.content,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
    size: data.size,
    number: data.number,
  };
};

export { fetchAuditLogs };
