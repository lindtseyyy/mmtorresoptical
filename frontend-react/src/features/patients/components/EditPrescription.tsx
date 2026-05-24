import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import {
  fetchPrescription,
  clonePrescription,
  type RecommendationResponse,
} from "@/features/patients/services/prescriptionApi";

const prescriptionFormSchema = z.object({
  issueDate: z.string().min(1, "Issue date is required"),
  notes: z.string().optional(),
});

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

const numStr = (val: number | null | undefined): string =>
  val != null ? String(val) : "";

const EditPrescription: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const prescriptionId = searchParams.get("prescriptionId") ?? "";
  const patientId = searchParams.get("patientId") ?? "";
  const patientName = searchParams.get("patientName") ?? "";

  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      issueDate: "",
      notes: "",
    },
  });

  const { data: prescription, isLoading } = useQuery({
    queryKey: ["prescription", prescriptionId],
    queryFn: () => fetchPrescription(prescriptionId),
    enabled: !!prescriptionId,
  });

  useEffect(() => {
    if (prescription && !dataLoaded) {
      form.reset({
        issueDate: prescription.issueDate,
        notes: prescription.notes ?? "",
      });
      setRecommendations(prescription.recommendations || []);
      setDataLoaded(true);
    }
  }, [prescription, dataLoaded, form]);

  const handleSubmit: SubmitHandler<PrescriptionFormValues> = async () => {
    toast.error("Editing Disabled", {
      description: "Prescriptions are immutable medical records. Use Clone & Re-issue to create a corrected version.",
    });
  };

  const mutation = useMutation({
    mutationFn: () => clonePrescription(prescriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-prescriptions", patientId] });
      toast.success("Prescription Cloned", {
        description: "The prescription has been cloned. You can edit the new version.",
      });
      navigate(`/patients/view/${patientId}`);
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: "Failed to clone prescription. Please try again.",
      });
      console.error(error);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const lensSpecs = prescription?.lensSpecifications ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">Edit Prescription</h2>
          <p className="text-muted-foreground">
            For {patientName || "patient"}
          </p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link to={`/patients/view/${patientId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Patient
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Prescriptions are immutable medical records. Editing is disabled. Use Clone & Re-issue to create a corrected version.
          </div>
          <fieldset disabled className="space-y-6">
          <Card className="bg-stone-200 border-b-2 border-b-stone-400 rounded-b-none">
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
              <CardDescription>Issue date and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Issued *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Prescription notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {lensSpecs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Eyeglass Specifications ({lensSpecs.length})</CardTitle>
                <CardDescription>Optical measurements and lens preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {lensSpecs.map((lens, li) => (
                  <div key={li} className="space-y-4">
                    {lens.lensTypePurpose && (
                      <div className="text-sm font-semibold text-primary">
                        {lens.lensTypePurpose}
                      </div>
                    )}
                    {lens.correctionType && (
                      <div className="text-sm">
                        <span className="font-medium">Correction Type:</span>{" "}
                        {lens.correctionType === "EYEGLASSES" ? "Eyeglasses" : "Contact Lens"}
                      </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 rounded-lg border p-3">
                        <h4 className="text-sm font-semibold">Right Eye (OD)</h4>
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                          <span className="text-muted-foreground">SPH</span>
                          <span className="text-muted-foreground">CYL</span>
                          <span className="text-muted-foreground">Axis</span>
                          <span className="font-mono">{lens.rightSph != null ? lens.rightSph : "—"}</span>
                          <span className="font-mono">{lens.rightCyl != null ? lens.rightCyl : "—"}</span>
                          <span className="font-mono">{lens.rightAxis != null ? lens.rightAxis : "—"}</span>
                          <span className="text-muted-foreground">Prism</span>
                          <span className="text-muted-foreground">Add</span>
                          <span className="text-muted-foreground">PD</span>
                          <span className="font-mono">{lens.rightPrism != null ? lens.rightPrism : "—"}</span>
                          <span className="font-mono">{lens.rightAdd != null ? lens.rightAdd : "—"}</span>
                          <span className="font-mono">{lens.rightPd != null ? lens.rightPd : "—"}</span>
                        </div>
                      </div>
                      <div className="space-y-2 rounded-lg border p-3">
                        <h4 className="text-sm font-semibold">Left Eye (OS)</h4>
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                          <span className="text-muted-foreground">SPH</span>
                          <span className="text-muted-foreground">CYL</span>
                          <span className="text-muted-foreground">Axis</span>
                          <span className="font-mono">{lens.leftSph != null ? lens.leftSph : "—"}</span>
                          <span className="font-mono">{lens.leftCyl != null ? lens.leftCyl : "—"}</span>
                          <span className="font-mono">{lens.leftAxis != null ? lens.leftAxis : "—"}</span>
                          <span className="text-muted-foreground">Prism</span>
                          <span className="text-muted-foreground">Add</span>
                          <span className="text-muted-foreground">PD</span>
                          <span className="font-mono">{lens.leftPrism != null ? lens.leftPrism : "—"}</span>
                          <span className="font-mono">{lens.leftAdd != null ? lens.leftAdd : "—"}</span>
                          <span className="font-mono">{lens.leftPd != null ? lens.leftPd : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {lens.lensType && <div><span className="text-muted-foreground">Lens Type:</span> {lens.lensType.replace("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</div>}
                      {lens.frameTypePreference && <div><span className="text-muted-foreground">Frame Type:</span> {lens.frameTypePreference}</div>}
                      {lens.lensMaterial && <div><span className="text-muted-foreground">Material:</span> {lens.lensMaterial}</div>}
                      {lens.lensCoatings && <div><span className="text-muted-foreground">Coatings:</span> {lens.lensCoatings}</div>}
                      {lens.lensWearType && <div><span className="text-muted-foreground">Wear Type:</span> {lens.lensWearType}</div>}
                      {lens.lensMaterialCl && <div><span className="text-muted-foreground">CL Material:</span> {lens.lensMaterialCl}</div>}
                      {lens.baseCurve != null && <div><span className="text-muted-foreground">BC:</span> {lens.baseCurve}</div>}
                      {lens.diameter != null && <div><span className="text-muted-foreground">DIA:</span> {lens.diameter}</div>}
                    </div>
                    {lens.notes && (
                      <div className="text-sm"><span className="text-muted-foreground">Notes:</span> {lens.notes}</div>
                    )}
                    {li < lensSpecs.length - 1 && <hr className="border-dashed" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Product Recommendations</CardTitle>
                <CardDescription>Suggested products from this prescription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{rec.productName}</p>
                        <p className="text-xs text-muted-foreground">{rec.category}</p>
                        {rec.staffNotes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{rec.staffNotes}&rdquo;</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₱{rec.unitPrice.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Qty: {rec.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          </fieldset>

          <div className="flex justify-end gap-2 pt-6">
            <Button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Cloning..." : "Clone & Re-issue"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/patients/view/${patientId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditPrescription;
