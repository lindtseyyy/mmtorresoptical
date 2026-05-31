import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil, User, Calendar, Key, ShoppingCart, ClipboardList } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
import { Badge } from "@/shared/components/ui/badge";
import { fetchUser } from "@/features/users/services/userApi";
import type { AuditLogEntry } from "@/features/users/services/auditApi";
import {
  createUserAuditLogsQueryOptions,
  createUserLastLoginQueryOptions,
  createUserTransactionCountQueryOptions,
} from "@/features/users/hooks/auditQuery";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatActionLabel = (actionType: string, resourceType: string) => {
  const action = actionType.charAt(0) + actionType.slice(1).toLowerCase().replace(/_/g, " ");
  const resource = resourceType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `${action} ${resource}`;
};

const ViewUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = id!;
  const navigate = useNavigate();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  });

  const { data: lastLoginData } = useQuery(
    createUserLastLoginQueryOptions(userId)
  );

  const { data: transactionCountData } = useQuery(
    createUserTransactionCountQueryOptions(userId)
  );

  const { data: auditData, isFetching: auditFetching } = useQuery(
    createUserAuditLogsQueryOptions(userId, 0, 10)
  );

  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">User not found.</p>
        <Button variant="link" asChild className="mt-2">
          <Link to="/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  const lastLogin =
    lastLoginData?.content?.[0]?.loggedAt ?? null;
  const transactionsProcessed = transactionCountData?.totalElements ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold">
                  {user.firstName} {user.lastName}
                </h2>
                <Badge
                  className={
                    user.isArchived
                      ? "bg-gray-600 text-white"
                      : "bg-green-700 text-white hover:bg-green-700 cursor-default"
                  }
                >
                  {user.isArchived ? "Archived" : "Active"}
                </Badge>
                <Badge
                  className={
                    user.role === "Admin"
                      ? "bg-blue-700 text-white hover:bg-blue-700"
                      : "bg-gray-600 text-white hover:bg-gray-600"
                  }
                >
                  {user.role}
                </Badge>
              </div>
              <p className="text-muted-foreground">User details and activity history</p>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link to="/users">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>

      {/* Card Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Calendar}
          label="Member Since"
          value={formatDate(user.createdAt)}
          color="primary"
          size="sm"
        />
        <MetricCard
          icon={User}
          label="Last Login"
          value={formatDateTime(lastLogin)}
          color="blue"
          size="sm"
        />
        <MetricCard
          icon={Key}
          label="Password Status"
          value={user.isPwChangeRequired ? "Password Reset Required" : "Active"}
          color="amber"
          size="sm"
        />
        <MetricCard
          icon={ShoppingCart}
          label="Transactions Processed"
          value={transactionsProcessed ?? "—"}
          color="emerald"
          size="sm"
        />
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overview</CardTitle>
              <CardDescription>User information</CardDescription>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate(`/users/edit/${userId}`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">First Name</p>
              <p className="font-medium">{user.firstName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Middle Name</p>
              <p className="font-medium">{user.middleName || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Name</p>
              <p className="font-medium">{user.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact Number</p>
              <p className="font-medium">{user.contactNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="font-medium">{user.sex}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Birth Date</p>
              <p className="font-medium">{formatDate(user.birthDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Recent Actions
              </CardTitle>
              <CardDescription>
                {auditData?.content?.length ?? 0} recent action(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {auditFetching && !auditData ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !auditData || auditData.content.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No actions recorded for this user.
            </p>
          ) : (
            <div className="space-y-3">
              {auditData.content.map((entry: AuditLogEntry) => (
                <div
                  key={entry.logId}
                  className="rounded-lg border p-4 transition-colors bg-muted/60 hover:bg-muted"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {formatActionLabel(entry.actionType, entry.resourceType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDateTime(entry.loggedAt)}</span>
                      </div>
                      {entry.details && (
                        <p className="text-xs text-muted-foreground">
                          {entry.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewUser;
