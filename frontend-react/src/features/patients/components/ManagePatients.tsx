import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Plus, Search, Eye, ChevronLeft, ChevronRight, Users, UserCheck, CalendarClock, UserPlus, ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
import EmptyTableRows from "@/shared/components/EmptyTableRows";
import type { Patient } from "@/features/patients/types";
import {
  createPatientsListQueryOptions,
  createPatientMetricsQueryOptions,
} from "@/features/patients/hooks/patientQuery";

const PAGE_SIZE = 10;

const ManagePatients: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState("fullNameSortable");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sexFilter, setSexFilter] = useState("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const navigate = useNavigate();

  const { data: pageData, isLoading, isFetching } = useQuery({
    ...createPatientsListQueryOptions(page, PAGE_SIZE, debouncedSearchQuery, sortBy, sortOrder, undefined, sexFilter),
    placeholderData: keepPreviousData,
  });

  const patients = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  // Stable counts — unaffected by filter changes
  const { data: metrics } = useQuery(createPatientMetricsQueryOptions());
  const totalPatients = metrics?.totalPatients ?? 0;
  const activePatients = (metrics?.totalPatients ?? 0) - (metrics?.archivedPatients ?? 0);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, sortBy, sortOrder, sexFilter]);

  useEffect(() => {
    if (patients.length === 0 && page > 0 && !isFetching) {
      setPage((p) => Math.max(0, p - 1));
    }
  }, [patients.length, page, isFetching]);

  const fullName = (p: Patient) =>
    [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Patient Management</h2>
          <p className="text-muted-foreground">
            Manage patient records and information.
          </p>
        </div>
        <Button onClick={() => navigate("/patients/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Users} label="Total Patients" value={totalPatients} color="primary" />
        <MetricCard icon={UserCheck} label="Active Patients" value={activePatients} color="emerald" />
        <MetricCard icon={CalendarClock} label="Pending Follow-Ups" value={metrics?.pendingFollowUps ?? 0} color="amber" />
        <MetricCard icon={UserPlus} label="New This Month" value={metrics?.newThisMonth ?? 0} color="blue" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sort By:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fullNameSortable">Name</SelectItem>
                    <SelectItem value="createdAt">Created At</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Gender:</span>
                <Select value={sexFilter} onValueChange={setSexFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex min-h-[570px] items-center justify-center">
              <p className="text-center text-muted-foreground">
                No patients found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-[26%] py-3 pl-4 pr-4 font-medium">Full Name</th>
                      <th className="w-[26%] py-3 pr-4 font-medium">Email</th>
                      <th className="w-[10%] py-3 pr-4 text-left font-medium">Gender</th>
                      <th className="w-[16%] py-3 pr-4 text-left font-medium">Contact Number</th>
                      <th className="w-[12%] py-3 pr-4 text-left font-medium">Birth Date</th>
                      <th className="w-[10%] py-3 pr-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient, index) => (
                      <tr
                        key={patient.patientId}
                        className={`border-b transition-colors hover:bg-muted/30 ${index % 2 === 0 ? "bg-transparent" : "bg-muted"}`}
                      >
                        <td className="py-3 pl-4 pr-4">
                          <span className="block truncate font-medium">
                            {fullName(patient)}
                          </span>
                        </td>
                        <td className="py-3 pl-4 pr-4 text-muted-foreground">
                          <span className="block truncate">{patient.email}</span>
                        </td>
                        <td className="py-3 pl-4 pr-4 text-left capitalize">
                          <span className="block truncate">{patient.sex}</span>
                        </td>
                        <td className="py-3 pl-4 pr-4 text-left text-muted-foreground">
                          <span className="block truncate">{patient.contactNumber}</span>
                        </td>
                        <td className="py-3 pl-4 pr-4 text-left text-muted-foreground">
                          {formatDate(patient.birthDate)}
                        </td>
                        <td className="py-3 pl-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/patients/view/${patient.patientId}`)}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <EmptyTableRows
                      count={PAGE_SIZE - (patients?.length ?? 0)}
                      colSpan={6}
                      className="h-[57px]"
                    />
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default ManagePatients;
