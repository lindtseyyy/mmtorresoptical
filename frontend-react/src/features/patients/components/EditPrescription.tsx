import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import {
  fetchPrescription,
  clonePrescription,
} from "@/features/patients/services/prescriptionApi";

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
  issueDate: z.string().min(1, "Issue date is required"),
  notes: z.string().optional(),
  followUpRequired: z.boolean(),
  followUpReason: z.string().optional(),
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

const numStr = (val: number | null | undefined): string =>
  val != null ? String(val) : "";

const EditPrescription: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const prescriptionId = searchParams.get("prescriptionId") ?? "";
  const patientId = searchParams.get("patientId") ?? "";
  const patientName = searchParams.get("patientName") ?? "";

  const originalItemIds = useRef<string[]>([]);

  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      issueDate: "",
      notes: "",
      followUpRequired: false,
      followUpReason: "",
      items: [{ ...emptyItem }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [dataLoaded, setDataLoaded] = useState(false);

  const { data: prescription, isLoading } = useQuery({
    queryKey: ["prescription", prescriptionId],
    queryFn: () => fetchPrescription(prescriptionId),
    enabled: !!prescriptionId,
  });

  useEffect(() => {
    if (prescription && !dataLoaded) {
      originalItemIds.current = prescription.prescriptionItems.map((item) => item.prescriptionItemId);
      form.reset({
        issueDate: prescription.issueDate,
        notes: prescription.notes ?? "",
        followUpRequired: false,
        followUpReason: "",
        items: prescription.prescriptionItems.map((item) => ({
          correctionType: item.correctionType,
          eyeSide: item.eyeSide,
          sph: numStr(item.sph),
          cyl: numStr(item.cyl),
          axis: numStr(item.axis),
          addPower: numStr(item.addPower),
          pd: numStr(item.pd),
          lensType: item.lensType ?? "",
          frameTypePreference: item.frameTypePreference ?? "",
          lensCoatings: item.lensCoatings ?? "",
          lensMaterial: item.lensMaterial ?? "",
          lensWearType: item.lensWearType ?? "",
          lensMaterialCl: item.lensMaterialCl ?? "",
          baseCurve: numStr(item.baseCurve),
          diameter: numStr(item.diameter),
          notes: item.notes ?? "",
        })),
      });
      setExpandedItems(new Set(prescription.prescriptionItems.map((_, i) => i)));
      setDataLoaded(true);
    }
  }, [prescription, dataLoaded, form]);

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

  const formatEnum = (value: string) =>
    value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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
          <Card className="bg-primary/10 border-b-2 border-b-primary/30 rounded-b-none">
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
              <CardDescription>Edit the issue date and notes</CardDescription>
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
              <Card key={field.id}>
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select side" />
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
                              <Input type="number" step="0.25" placeholder="0.00" {...field} />
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
                              <Input type="number" step="0.25" placeholder="0.00" {...field} />
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
                              <Input type="number" placeholder="0" {...field} />
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
                              <Input type="number" step="0.25" placeholder="0.00" {...field} />
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
                              <Input type="number" step="0.5" placeholder="0.0" {...field} />
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
                            <FormLabel>Frame Type</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Full-rim" {...field} />
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
                              <Input placeholder="e.g. Anti-reflective" {...field} />
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
                              <Input placeholder="e.g. Daily wear" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {correctionType === "CONTACT_LENS" && (
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
                                <Input type="number" step="0.1" placeholder="0.0" {...field} />
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
                                <Input type="number" step="0.1" placeholder="0.0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}


                    <FormField
                      control={form.control}
                      name={`items.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Item-specific notes..." {...field} />
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
