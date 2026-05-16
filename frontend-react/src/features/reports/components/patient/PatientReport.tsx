import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { PatientReportDataset } from "@/features/reports/types";

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

interface PatientReportProps {
  report: PatientReportDataset;
}

const PatientReport: React.FC<PatientReportProps> = ({ report }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{number(report.totalPatients)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{number(report.activePatients)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Archived</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-gray-500">{number(report.archivedPatients)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {report.overallReport ? "New This Month" : "New in Period"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-600">{number(report.newPatientsInPeriod)}</p>
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Male</span>
              <span className="font-medium">{report.maleCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Female</span>
              <span className="font-medium">{report.femaleCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Others</span>
              <span className="font-medium">{report.otherGenderCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {report.ageGroupDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Age Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.ageGroupDistribution.map((ag) => (
                <div key={ag.groupLabel} className="flex items-center justify-between">
                  <span>{ag.groupLabel}</span>
                  <span className="font-medium">{ag.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Visit Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{number(report.totalVisits)}</p>
            <p className="text-sm text-muted-foreground">Total Visits</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{number(report.completedVisits)}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{number(report.missedOrCancelledVisits)}</p>
            <p className="text-sm text-muted-foreground">Missed / Cancelled</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {report.growthComparisonAvailable && (
      <Card>
        <CardHeader>
          <CardTitle>Growth Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">{report.previousPeriodLabel}</p>
              <p className="text-xl font-bold">{number(report.previousPeriodCount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{report.currentPeriodLabel}</p>
              <p className="text-xl font-bold">{number(report.currentPeriodCount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth</p>
              <p
                className={`text-xl font-bold ${
                  report.growthPercentage >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {report.growthPercentage >= 0 ? "+" : ""}
                {report.growthPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);

export default PatientReport;
