import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import { createHealthHistory, type CreateHealthHistoryInput } from "@/features/patients/services/healthHistoryApi";

const healthHistorySchema = z.object({
  examDate: z.string().min(1, "Exam date is required"),
  eyeConditions: z.string().optional(),
  systemicConditions: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
  visualAcuityRight: z.string().optional(),
  visualAcuityLeft: z.string().optional(),
  notes: z.string().optional(),
});

type HealthHistoryFormValues = z.infer<typeof healthHistorySchema>;

const AddHealthHistory: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";
  const patientName = searchParams.get("patientName") ?? "";

  const form = useForm<HealthHistoryFormValues>({
    resolver: zodResolver(healthHistorySchema),
    defaultValues: {
      examDate: "",
      eyeConditions: "",
      systemicConditions: "",
      medications: "",
      allergies: "",
      visualAcuityRight: "",
      visualAcuityLeft: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: HealthHistoryFormValues) => {
      const payload: CreateHealthHistoryInput = {
        examDate: data.examDate,
        eyeConditions: data.eyeConditions || undefined,
        systemicConditions: data.systemicConditions || undefined,
        medications: data.medications || undefined,
        allergies: data.allergies || undefined,
        visualAcuityRight: data.visualAcuityRight || undefined,
        visualAcuityLeft: data.visualAcuityLeft || undefined,
        notes: data.notes || undefined,
        isArchived: false,
      };
      return createHealthHistory(patientId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-health-histories", patientId] });
      toast.success("Health History Added", {
        description: "The health history has been successfully recorded.",
      });
      navigate(`/patients/view/${patientId}`);
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: "Failed to create health history. Please try again.",
      });
      console.error(error);
    },
  });

  const handleSubmit: SubmitHandler<HealthHistoryFormValues> = async (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">Add Health History</h2>
          <p className="text-muted-foreground">
            For {patientName || "patient"}
          </p>
        </div>
        <Button variant="secondary" size="sm" className="text-sm" asChild>
          <Link to="/patients">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Patients
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exam Information</CardTitle>
              <CardDescription>Record the exam details</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="examDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>Record conditions and medications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="eyeConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eye Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Myopia, Astigmatism, Glaucoma"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="systemicConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Systemic Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Diabetes, Hypertension"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Metformin, Lisinopril"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Penicillin, Latex"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visual Acuity</CardTitle>
              <CardDescription>Record visual acuity measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="visualAcuityRight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visual Acuity (Right)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 20/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visualAcuityLeft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visual Acuity (Left)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 20/25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional observations..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Health History"}
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

export default AddHealthHistory;
