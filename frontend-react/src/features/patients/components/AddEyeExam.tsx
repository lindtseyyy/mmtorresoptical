import { useLayoutEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import { createEyeExam, type CreateEyeExamInput } from "@/features/patients/services/eyeExamApi";

const eyeExamSchema = z.object({
  examType: z.enum(["COMPUTERIZED", "MANUAL"]),
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  vaUnconvertedOd: z.string().optional(),
  vaUnconvertedOs: z.string().optional(),
  vaAidedOd: z.string().optional(),
  vaAidedOs: z.string().optional(),
  iopOd: z.string().optional(),
  iopOs: z.string().optional(),
  slitLampExamination: z.string().optional(),
  fundusExamination: z.string().optional(),
  clinicalImpression: z.string().optional(),
  planNotes: z.string().optional(),
});

type EyeExamFormValues = z.infer<typeof eyeExamSchema>;

const AddEyeExam: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";
  const patientName = searchParams.get("patientName") ?? "";

  useLayoutEffect(() => {
    const scrollToTop = () => {
      const main = document.querySelector("main");
      if (main) main.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    scrollToTop();
    requestAnimationFrame(scrollToTop);
  }, []);

  const form = useForm<EyeExamFormValues>({
    resolver: zodResolver(eyeExamSchema),
    defaultValues: {
      examType: "MANUAL",
      chiefComplaint: "",
      vaUnconvertedOd: "",
      vaUnconvertedOs: "",
      vaAidedOd: "",
      vaAidedOs: "",
      iopOd: "",
      iopOs: "",
      slitLampExamination: "",
      fundusExamination: "",
      clinicalImpression: "",
      planNotes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EyeExamFormValues) => {
      const payload: CreateEyeExamInput = {
        examType: data.examType,
        chiefComplaint: data.chiefComplaint,
        vaUnconvertedOd: data.vaUnconvertedOd || undefined,
        vaUnconvertedOs: data.vaUnconvertedOs || undefined,
        vaAidedOd: data.vaAidedOd || undefined,
        vaAidedOs: data.vaAidedOs || undefined,
        iopOd: data.iopOd || undefined,
        iopOs: data.iopOs || undefined,
        slitLampExamination: data.slitLampExamination || undefined,
        fundusExamination: data.fundusExamination || undefined,
        clinicalImpression: data.clinicalImpression || undefined,
        planNotes: data.planNotes || undefined,
      };
      return createEyeExam(patientId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Eye Exam Added", {
        description: "The eye exam has been successfully created.",
      });
      navigate(`/patients/view/${patientId}`);
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: error?.response?.data || "Failed to create eye exam.",
      });
      console.error(error);
    },
  });

  const handleSubmit: SubmitHandler<EyeExamFormValues> = async (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">Add Eye Exam</h2>
          <p className="text-muted-foreground">
            For {patientName || "patient"}
          </p>
        </div>
        <Button variant="secondary" size="sm" className="text-sm" asChild>
          <Link to={`/patients/view/${patientId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Patient
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Chief Complaint */}
          <Card>
            <CardHeader>
              <CardTitle>Chief Complaint</CardTitle>
              <CardDescription>Patient's primary concern or reason for visit</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="chiefComplaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chief Complaint *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Blurry vision, digital eye strain, headache around eyes..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Exam Type */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Type</CardTitle>
              <CardDescription>Methodology used for this assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Type *</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMPUTERIZED">Computerized</SelectItem>
                          <SelectItem value="MANUAL">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Visual Acuity */}
          <Card>
            <CardHeader>
              <CardTitle>Visual Acuity</CardTitle>
              <CardDescription>Record naked eye and RX visual acuity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vaUnconvertedOd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VA Naked Eye (OD)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 20/40" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vaUnconvertedOs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VA Naked Eye (OS)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 20/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vaAidedOd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VA Rx (OD)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 20/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vaAidedOs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VA Rx (OS)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 20/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* IOP */}
          <Card>
            <CardHeader>
              <CardTitle>Intraocular Pressure</CardTitle>
              <CardDescription>Record IOP measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="iopOd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IOP (OD)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 16 mmHg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="iopOs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IOP (OS)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 15 mmHg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Examination Findings */}
          <Card>
            <CardHeader>
              <CardTitle>Examination Findings</CardTitle>
              <CardDescription>Anterior and posterior segment evaluation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="slitLampExamination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slit Lamp Examination</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Anterior segment findings..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fundusExamination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fundus Examination</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Posterior segment / retina findings..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Clinical Impression */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical Impression</CardTitle>
              <CardDescription>Diagnosis and assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="clinicalImpression"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinical Impression</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Diagnosis and assessment notes..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Plan Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
              <CardDescription>Recommendations and follow-up plan</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="planNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Overall recommendations and treatment plan..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-6">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Eye Exam"}
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

export default AddEyeExam;


