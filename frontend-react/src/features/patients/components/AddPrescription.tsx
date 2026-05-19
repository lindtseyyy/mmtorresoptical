import { useState, useLayoutEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, ChevronDown } from "lucide-react";
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
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import { createPrescription, type CreatePrescriptionInput } from "@/features/patients/services/prescriptionApi";
import { fetchPatientEyeExams, type EyeExamListItem } from "@/features/patients/services/patientApi";

const prescriptionItemSchema = z.object({
  correctionType: z.string().min(1, "Required"),
  eyeSide: z.string().min(1, "Required"),
  sph: z.string().optional(),
  cyl: z.string().optional(),
  axis: z.string().optional(),
  addPower: z.string().optional(),
  pd: z.string().optional(),
  lensType: z.string().optional(),
  frameTypePreference: z.string().optional(),
  lensCoatings: z.string().optional(),
  lensMaterial: z.string().optional(),
  lensWearType: z.string().optional(),
  lensMaterialCl: z.string().optional(),
  baseCurve: z.string().optional(),
  diameter: z.string().optional(),
  notes: z.string().optional(),
});

const prescriptionFormSchema = z.object({
  examDate: z.string().min(1, "Exam date is required"),
  notes: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpReason: z.string().optional(),
  prescriptionSource: z.enum(["internal", "outside"]).default("internal"),
  eyeExamId: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, "Add at least one prescription item"),
});

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

const emptyItem = {
  correctionType: "",
  eyeSide: "",
  sph: "",
  cyl: "",
  axis: "",
  addPower: "",
  pd: "",
  lensType: "",
  frameTypePreference: "",
  lensCoatings: "",
  lensMaterial: "",
  lensWearType: "",
  lensMaterialCl: "",
  baseCurve: "",
  diameter: "",
  notes: "",
};

const AddPrescription: React.FC = () => {
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

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      examDate: "",
      notes: "",
      followUpRequired: false,
      followUpReason: "",
      prescriptionSource: "internal",
      eyeExamId: "",
      items: [{ ...emptyItem }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const [expandedItems, setExpandedItems] = useState<Set<number>>(
    () => new Set(fields.map((_, i) => i)),
  );

  const handleAppend = () => {
    append({ ...emptyItem });
    setExpandedItems(new Set([fields.length]));
  };

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const { data: eyeExamsData } = useQuery({
    queryKey: ["patient-eye-exams", patientId, "ACTIVE"],
    queryFn: () => fetchPatientEyeExams(patientId, 0, 100, "ACTIVE"),
    enabled: !!patientId && form.watch("prescriptionSource") === "internal",
  });

  const mutation = useMutation({
    mutationFn: (data: PrescriptionFormValues) => {
      const payload: CreatePrescriptionInput = {
        examDate: data.examDate,
        notes: data.notes || undefined,
        isArchived: false,
        followUpRequired: data.followUpRequired,
        followUpReason: data.followUpReason || undefined,
        eyeExamId: data.prescriptionSource === "internal" && data.eyeExamId ? data.eyeExamId : undefined,
        itemsRequestDTOList: data.items.map((item) => ({
          correctionType: item.correctionType,
          eyeSide: item.eyeSide,
          sph: item.sph ? Number(item.sph) : undefined,
          cyl: item.cyl ? Number(item.cyl) : undefined,
          axis: item.axis ? Number(item.axis) : undefined,
          addPower: item.addPower ? Number(item.addPower) : undefined,
          pd: item.pd ? Number(item.pd) : undefined,
          lensType: item.lensType || undefined,
          frameTypePreference: item.frameTypePreference || undefined,
          lensCoatings: item.lensCoatings || undefined,
          lensMaterial: item.lensMaterial || undefined,
          lensWearType: item.lensWearType || undefined,
          lensMaterialCl: item.lensMaterialCl || undefined,
          baseCurve: item.baseCurve ? Number(item.baseCurve) : undefined,
          diameter: item.diameter ? Number(item.diameter) : undefined,
          isArchived: false,
          notes: item.notes || undefined,
        })),
      };
      return createPrescription(patientId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Prescription Added", {
        description: "The prescription has been successfully created.",
      });
      navigate(`/patients/view/${patientId}`);
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: "Failed to create prescription. Please try again.",
      });
      console.error(error);
    },
  });

  const handleSubmit: SubmitHandler<PrescriptionFormValues> = async (data) => {
    mutation.mutate(data);
  };

  const formatEnum = (value: string) =>
    value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            {form.watch("prescriptionSource") === "outside" ? "Add Prescription — Manual Intake (Outside Rx)" : "Add Prescription"}
          </h2>
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
          <Card className="bg-primary/10 border-b-2 border-b-primary/30 rounded-b-none">
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
              <CardDescription>Enter the exam date and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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

              {/* Follow-up Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium">Follow-up Required</h3>
                <FormField
                  control={form.control}
                  name="followUpRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Follow-up Required
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {form.watch("followUpRequired") && (
                  <FormField
                    control={form.control}
                    name="followUpReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Reason</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Routine check-up" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prescription Source */}
          <Card>
            <CardHeader>
              <CardTitle>Prescription Source</CardTitle>
              <CardDescription>Select whether this prescription is from an internal eye exam or an outside source</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="prescriptionSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Type</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        if (v === "outside") form.setValue("eyeExamId", "");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="internal">Internal Exam</SelectItem>
                        <SelectItem value="outside">Outside Prescription</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("prescriptionSource") === "internal" && (
                <FormField
                  control={form.control}
                  name="eyeExamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link to Eye Exam</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an eye exam (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eyeExamsData?.content.map((exam: EyeExamListItem) => (
                            <SelectItem key={exam.eyeExamId} value={exam.eyeExamId}>
                              {new Date(exam.createdAt).toLocaleDateString("en-US", {
                                year: "numeric", month: "short", day: "numeric",
                              })}
                              {exam.chiefComplaint ? ` — ${exam.chiefComplaint.substring(0, 60)}${exam.chiefComplaint.length > 60 ? "..." : ""}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {form.watch("prescriptionSource") === "outside" && (
                <p className="text-sm text-muted-foreground italic">
                  Outside prescription — no eye exam will be linked to this record.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Prescription Items ({fields.length})
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {fields.map((field, index) => {
            const isExpanded = expandedItems.has(index);
            const correctionType = form.watch(`items.${index}.correctionType`);
            const eyeSide = form.watch(`items.${index}.eyeSide`);
            const summary = [correctionType, eyeSide]
              .filter(Boolean)
              .map(formatEnum)
              .join(" — ") || "No details yet";

            return (
              <Card
                key={field.id}
                className={index === 0 ? "rounded-t-none border-t-0" : ""}
              >
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => toggleItem(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                      <div>
                        <CardTitle>Prescription Item {index + 1}</CardTitle>
                        {!isExpanded && (
                          <CardDescription>{summary}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(index);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.correctionType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correction Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EYEGLASSES">Eyeglasses</SelectItem>
                            <SelectItem value="CONTACT_LENS">Contact Lens</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.eyeSide`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eye Side *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LEFT">Left</SelectItem>
                            <SelectItem value="RIGHT">Right</SelectItem>
                            <SelectItem value="BOTH">Both</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.sph`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SPH</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. -2.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.cyl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CYL</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. -0.75" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.axis`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Axis</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 180" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.addPower`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Add Power</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. +2.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.pd`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PD</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 62" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.lensType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lens Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SINGLE_VISION">Single Vision</SelectItem>
                            <SelectItem value="DOUBLE_VISION">Double Vision</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.frameTypePreference`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frame Type Preference</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Full rim, Half rim" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.lensMaterial`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lens Material</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Polycarbonate" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`items.${index}.lensCoatings`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lens Coatings</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Anti-reflective, UV" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.lensWearType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lens Wear Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Daily, Extended" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.lensMaterialCl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CL Material</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Silicone hydrogel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.baseCurve`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Curve</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 8.6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.diameter`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diameter</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 14.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                <FormField
                  control={form.control}
                  name={`items.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notes for this item..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              )}
            </Card>
          );
        })}

          <Button
            type="button"
            variant="outline"
            className="w-full py-3"
            onClick={handleAppend}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Prescription Item
          </Button>

          <div className="flex justify-end gap-2 pt-6">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Prescription"}
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

export default AddPrescription;
