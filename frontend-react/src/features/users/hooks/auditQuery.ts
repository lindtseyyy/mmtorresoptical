import { queryOptions } from "@tanstack/react-query";
import { fetchAuditLogs } from "@/features/users/services/auditApi";
import type { AuditLogParams } from "@/features/users/services/auditApi";

function createAuditLogsQueryOptions(params: AuditLogParams) {
  return queryOptions({
    queryKey: ["audit-logs", params],
    queryFn: () => fetchAuditLogs(params),
  });
}

function createUserAuditLogsQueryOptions(userId: string, page: number, size = 10) {
  return queryOptions({
    queryKey: ["audit-logs", userId, page, size],
    queryFn: () =>
      fetchAuditLogs({
        userId,
        page,
        size,
        sortBy: "loggedAt",
        sortOrder: "desc",
      }),
    enabled: !!userId,
  });
}

function createUserLastLoginQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["audit-logs", userId, "last-login"],
    queryFn: () =>
      fetchAuditLogs({
        userId,
        actionType: "LOGIN",
        page: 0,
        size: 1,
        sortBy: "loggedAt",
        sortOrder: "desc",
      }),
    enabled: !!userId,
  });
}

function createUserTransactionCountQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["audit-logs", userId, "transaction-count"],
    queryFn: () =>
      fetchAuditLogs({
        userId,
        actionType: "CREATE",
        resourceType: "TRANSACTION",
        page: 0,
        size: 1,
      }),
    enabled: !!userId,
  });
}

export {
  createAuditLogsQueryOptions,
  createUserAuditLogsQueryOptions,
  createUserLastLoginQueryOptions,
  createUserTransactionCountQueryOptions,
};
