import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import PatientGrowthChart from "@/features/reports/components/patient/PatientGrowthChart";
import type { PatientReportDataset, PatientGrowthPoint } from "@/features/reports/types";

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

interface PatientReportProps {
  report: PatientReportDataset;
  growthTrend: PatientGrowthPoint[];
  minDate: string;
  maxDate: string;
  onMinDateChange: (value: string) => void;
  onMaxDateChange: (value: string) => void;
}

const PatientReport: React.FC<PatientReportProps> = ({
  report,
  growthTrend,
  minDate,
  maxDate,
  onMinDateChange,
  onMaxDateChange,
}) => {
  const sexTotal = report.maleCount + report.femaleCount;
  const ageTotal = report.ageGroupDistribution.reduce((sum, ag) => sum + ag.count, 0);

  return (
    <>
      <Card>
        <CardHeader className="bg-muted">
          <CardTitle className="text-lg">12-Month Patient Growth Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <PatientGrowthChart data={growthTrend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patient Demographics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card>
            <CardHeader className="bg-muted">
              <CardTitle className="text-base">Sex Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 pl-6 pr-4 font-medium">Sex</th>
                      <th className="py-3 pr-6 font-medium text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-2.5 pl-6 pr-4 text-muted-foreground">Male</td>
                      <td className="py-2.5 pr-6 text-right font-medium">{number(report.maleCount)}</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-2.5 pl-6 pr-4 text-muted-foreground">Female</td>
                      <td className="py-2.5 pr-6 text-right font-medium">{number(report.femaleCount)}</td>
                    </tr>
                    <tr className="bg-muted/30 font-semibold">
                      <td className="py-2.5 pl-6 pr-4">Total</td>
                      <td className="py-2.5 pr-6 text-right">{number(sexTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

          <Card>
            <CardHeader className="bg-muted">
              <CardTitle className="text-base">Age Group Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 pl-6 pr-4 font-medium">Age Group</th>
                    <th className="py-3 pr-6 font-medium text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {report.ageGroupDistribution.map((ag) => (
                    <tr key={ag.groupLabel} className="border-b hover:bg-muted/50">
                      <td className="py-2.5 pl-6 pr-4 text-muted-foreground">{ag.groupLabel}</td>
                      <td className="py-2.5 pr-6 text-right font-medium">{number(ag.count)}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-semibold">
                    <td className="py-2.5 pl-6 pr-4">Total</td>
                    <td className="py-2.5 pr-6 text-right">{number(ageTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </>
  );
};

export default PatientReport;
