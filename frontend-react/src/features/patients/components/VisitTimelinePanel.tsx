import { useQuery } from "@tanstack/react-query";
import { Footprints } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { fetchVisitsByPatient, type PatientVisit } from "@/features/patients/services/visitApi";
import { formatDateTime } from "./ViewPatient";

interface VisitTimelinePanelProps {
  patientId: string;
  isActive: boolean;
}

const VisitTimelinePanel: React.FC<VisitTimelinePanelProps> = ({ patientId, isActive }) => {
  const { data: visits, isLoading: visitsLoading } = useQuery({
    queryKey: ["patient-visits", patientId],
    queryFn: () => fetchVisitsByPatient(patientId),
    enabled: !!patientId && isActive,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Footprints className="h-5 w-5" />
              Visit Timeline
            </CardTitle>
            <CardDescription>
              {visits?.length ?? 0} recorded visit(s)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {visitsLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading visits...</p>
        ) : !visits || visits.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No visits recorded.</p>
        ) : (
          <div className="space-y-3">
            {visits.map((v: PatientVisit) => (
              <div
                key={v.visitId}
                className="rounded-lg border p-4 transition-colors bg-muted/60 hover:bg-muted"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{formatDateTime(v.visitTimestamp)}</p>
                    {v.purpose && (
                      <Badge className="mt-1 bg-indigo-700 text-white">
                        {v.purpose}
                      </Badge>
                    )}
                    {v.notes && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{v.notes}</p>
                    )}
                  </div>
                  <div className="shrink-0 ml-4">
                    {v.loggedBy && (
                      <p className="text-xs text-muted-foreground text-right">
                        Logged by {v.loggedBy.fullName}
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
  );
};

export default VisitTimelinePanel;
