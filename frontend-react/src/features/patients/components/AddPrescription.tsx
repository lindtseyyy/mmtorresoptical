import { useState, useLayoutEffect, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, Package, Copy } from "lucide-react";
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
  createPrescription,
  fetchPrescription,
  type CreatePrescriptionInput,
  type LensSpecification,
} from "@/features/patients/services/prescriptionApi";
import { fetchPatientEyeExams, type EyeExamListItem } from "@/features/patients/services/patientApi";
import ProductPickerModal from "@/features/patients/components/ProductPickerModal";
import type { ProductSummary } from "@/features/inventory/types";

const recommendationItemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.number().int().min(1, "Min 1"),
  staffNotes: z.string().optional(),
});

const lensSpecSchema = z.object({
  lensTypePurpose: z.string().optional(),
  correctionType: z.string().optional(),
  rightSph: z.string().optional(),
  rightCyl: z.string().optional(),
  rightAxis: z.string().optional(),
  rightAdd: z.string().optional(),
  rightPd: z.string().optional(),
  leftSph: z.string().optional(),
  leftCyl: z.string().optional(),
  leftAxis: z.string().optional(),
  leftAdd: z.string().optional(),
  leftPd: z.string().optional(),
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
  eyeExamId: z.string().optional(),
  followUpScheduledDate: z.string().optional(),
  followUpReason: z.string().optional(),
  lensSpecifications: z.array(lensSpecSchema).default([]),
  products: z.array(recommendationItemSchema).default([]),
});

type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>;

const numOrUndef = (val: number | null | undefined): number | undefined =>
  val != null ? Number(val) : undefined;

const strOrUndef = (val: string | null | undefined): string | undefined =>
  val?.trim() ? val : undefined;

const emptyLens = {
  lensTypePurpose: "",
  correctionType: "",
  rightSph: "", rightCyl: "", rightAxis: "",
  rightAdd: "", rightPd: "",
  leftSph: "", leftCyl: "", leftAxis: "",
  leftAdd: "", leftPd: "",
  lensType: "", frameTypePreference: "", lensCoatings: "",
  lensMaterial: "", lensWearType: "", lensMaterialCl: "",
  baseCurve: "", diameter: "", notes: "",
};

const AddPrescription: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") ?? "";
  const patientName = searchParams.get("patientName") ?? "";
  const cloneFrom = searchParams.get("cloneFrom");

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
    resolver: zodResolver(prescriptionFormSchema as any),
    defaultValues: {
      issueDate: "",
      notes: "",
      eyeExamId: "",
      followUpScheduledDate: "",
      followUpReason: "",
      lensSpecifications: [],
      products: [],
    },
  });

  const {
    fields: lensFields,
    append: appendLens,
    remove: removeLens,
  } = useFieldArray({
    control: form.control,
    name: "lensSpecifications",
  });

  const {
    fields: recFields,
    append: appendRec,
    remove: removeRec,
  } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [productSummariesMap, setProductSummariesMap] = useState<Record<string, ProductSummary>>({});

  const { data: sourceRx } = useQuery({
    queryKey: ["prescription", cloneFrom],
    queryFn: () => fetchPrescription(cloneFrom!),
    enabled: !!cloneFrom,
  });

  const { data: eyeExamsData } = useQuery({
    queryKey: ["patient-eye-exams", patientId, 0, "ACTIVE"],
    queryFn: () => fetchPatientEyeExams(patientId, 0, 100, "ACTIVE"),
    enabled: !!patientId,
  });

  useEffect(() => {
    if (sourceRx) {
      form.reset({
        issueDate: "",
        notes: sourceRx.notes ?? "",
        eyeExamId: sourceRx.eyeExamId ?? "",
        followUpScheduledDate: "",
        followUpReason: "",
        lensSpecifications: (sourceRx.lensSpecifications || []).map((lens) => ({
          lensTypePurpose: lens.lensTypePurpose ?? "",
          correctionType: lens.correctionType ?? "",
          rightSph: lens.rightSph != null ? String(lens.rightSph) : "",
          rightCyl: lens.rightCyl != null ? String(lens.rightCyl) : "",
          rightAxis: lens.rightAxis != null ? String(lens.rightAxis) : "",
          rightAdd: lens.rightAdd != null ? String(lens.rightAdd) : "",
          rightPd: lens.rightPd != null ? String(lens.rightPd) : "",
          leftSph: lens.leftSph != null ? String(lens.leftSph) : "",
          leftCyl: lens.leftCyl != null ? String(lens.leftCyl) : "",
          leftAxis: lens.leftAxis != null ? String(lens.leftAxis) : "",
          leftAdd: lens.leftAdd != null ? String(lens.leftAdd) : "",
          leftPd: lens.leftPd != null ? String(lens.leftPd) : "",
          lensType: lens.lensType ?? "",
          frameTypePreference: lens.frameTypePreference ?? "",
          lensCoatings: lens.lensCoatings ?? "",
          lensMaterial: lens.lensMaterial ?? "",
          lensWearType: lens.lensWearType ?? "",
          lensMaterialCl: lens.lensMaterialCl ?? "",
          baseCurve: lens.baseCurve != null ? String(lens.baseCurve) : "",
          diameter: lens.diameter != null ? String(lens.diameter) : "",
          notes: lens.notes ?? "",
        })),
        products: (sourceRx.recommendations || []).map((r) => ({
          productId: r.productId,
          quantity: r.quantity,
          staffNotes: r.staffNotes || "",
        })),
      });
    }
  }, [sourceRx]);

  const mutation = useMutation({
    mutationFn: async (data: PrescriptionFormValues) => {
      const lensSpecs: LensSpecification[] = data.lensSpecifications.map((ls) => ({
        lensTypePurpose: strOrUndef(ls.lensTypePurpose),
        correctionType: strOrUndef(ls.correctionType),
        rightSph: numOrUndef(ls.rightSph ? Number(ls.rightSph) : undefined),
        rightCyl: numOrUndef(ls.rightCyl ? Number(ls.rightCyl) : undefined),
        rightAxis: ls.rightAxis ? Number(ls.rightAxis) : undefined,
        rightAdd: numOrUndef(ls.rightAdd ? Number(ls.rightAdd) : undefined),
        rightPd: numOrUndef(ls.rightPd ? Number(ls.rightPd) : undefined),
        leftSph: numOrUndef(ls.leftSph ? Number(ls.leftSph) : undefined),
        leftCyl: numOrUndef(ls.leftCyl ? Number(ls.leftCyl) : undefined),
        leftAxis: ls.leftAxis ? Number(ls.leftAxis) : undefined,
        leftAdd: numOrUndef(ls.leftAdd ? Number(ls.leftAdd) : undefined),
        leftPd: numOrUndef(ls.leftPd ? Number(ls.leftPd) : undefined),
        lensType: strOrUndef(ls.lensType),
        frameTypePreference: strOrUndef(ls.frameTypePreference),
        lensCoatings: strOrUndef(ls.lensCoatings),
        lensMaterial: strOrUndef(ls.lensMaterial),
        lensWearType: strOrUndef(ls.lensWearType),
        lensMaterialCl: strOrUndef(ls.lensMaterialCl),
        baseCurve: numOrUndef(ls.baseCurve ? Number(ls.baseCurve) : undefined),
        diameter: numOrUndef(ls.diameter ? Number(ls.diameter) : undefined),
        notes: strOrUndef(ls.notes),
      }));

      const products = data.products.length > 0
        ? data.products.map((r) => ({
            productId: r.productId,
            quantity: r.quantity,
            staffNotes: strOrUndef(r.staffNotes) || undefined,
          }))
        : [];

      const payload: CreatePrescriptionInput = {
        issueDate: data.issueDate,
        notes: strOrUndef(data.notes),
        isArchived: false,
        eyeExamId: data.eyeExamId || undefined,
        followUpScheduledDate: data.followUpScheduledDate || undefined,
        followUpReason: strOrUndef(data.followUpReason),
        lensSpecifications: lensSpecs,
        products,
      };

      await createPrescription(patientId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Prescription Added", {
        description: "The prescription has been successfully created.",
      });
      navigate(`/patients/view/${patientId}`);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? "Failed to create prescription. Please try again.";
      toast.error("Error", { description: msg });
      console.error(error);
    },
  });

  const handleSubmit: SubmitHandler<PrescriptionFormValues> = async (data) => {
    const hasLensData = data.lensSpecifications.length > 0;
    const hasProductsData = data.products.length > 0;

    if (!hasLensData && !hasProductsData) {
      toast.error("A prescription must contain either an eyeglass specification or a product recommendation.");
      return;
    }

    mutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            {cloneFrom ? "Re-issue Prescription" : "Add Prescription"}
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
          <Card className="bg-slate-100 border-b-2 border-b-slate-300 rounded-b-none">
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
              <CardDescription>Enter the issue date and notes</CardDescription>
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
                        <Input type="date" min={new Date().toISOString().split("T")[0]} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eyeExamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link Eye Exam (Optional)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "none" ? "" : val)}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="None (Outside Rx)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None (Outside Rx)</SelectItem>
                          {eyeExamsData?.content.map((ee: EyeExamListItem) => (
                            <SelectItem key={ee.eyeExamId} value={ee.eyeExamId}>
                              {ee.examNumber ?? ee.eyeExamId} — {ee.chiefComplaint?.substring(0, 40) ?? ee.createdAt?.substring(0, 10)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium">Schedule Follow-Up (Optional)</h3>
                <FormField
                  control={form.control}
                  name="followUpScheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Date</FormLabel>
                      <FormControl>
                        <Input type="date" min={new Date().toISOString().split("T")[0]} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 3);
                      form.setValue("followUpScheduledDate", d.toISOString().split("T")[0]);
                    }}
                  >
                    +3 Months
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 6);
                      form.setValue("followUpScheduledDate", d.toISOString().split("T")[0]);
                    }}
                  >
                    +6 Months
                  </Button>
                </div>
                {form.watch("followUpScheduledDate") && (
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

          {/* Canvas area with action buttons */}
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 p-4 space-y-3">
            {lensFields.length === 0 && recFields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Add at least one block to create the prescription.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-1"
                onClick={() => appendLens({ ...emptyLens })}
              >
                <Eye className="h-4 w-4" />
                Add Eyeglass Specification
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-1"
                onClick={() => appendRec({ productId: "", quantity: 1, staffNotes: "" })}
              >
                <Package className="h-4 w-4" />
                Add Medication / Product
              </Button>
            </div>
          </div>

          {lensFields.map((field, index) => {
            const correctionType = form.watch(`lensSpecifications.${index}.correctionType`);

            const copyRightToLeft = (idx: number) => {
              const fields = [
                "rightSph", "rightCyl", "rightAxis", "rightAdd", "rightPd",
              ] as const;
              for (const f of fields) {
                form.setValue(
                  `lensSpecifications.${idx}.left${f.slice(5)}` as any,
                  form.getValues(`lensSpecifications.${idx}.${f}` as any),
                );
              }
            };

            const copyLeftToRight = (idx: number) => {
              const fields = [
                "leftSph", "leftCyl", "leftAxis", "leftAdd", "leftPd",
              ] as const;
              for (const f of fields) {
                form.setValue(
                  `lensSpecifications.${idx}.right${f.slice(4)}` as any,
                  form.getValues(`lensSpecifications.${idx}.${f}` as any),
                );
              }
            };

            return (
              <Card key={field.id} className="shadow-none border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Eyeglass Specification</CardTitle>
                      <CardDescription>Optical measurements and lens preferences</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="bg-red-700 text-white hover:bg-red-800 hover:text-white"
                      onClick={() => removeLens(index)}
                    >
                      Remove ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`lensSpecifications.${index}.correctionType`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Correction Type</FormLabel>
                        <Select onValueChange={f.onChange} defaultValue={f.value ?? ""}>
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
                    name={`lensSpecifications.${index}.lensTypePurpose`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <FormControl><Input placeholder="Enter Purpose" {...f} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-lg border bg-muted/60 p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Right Eye (OD)</h4>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => copyLeftToRight(index)}
                        >
                          <Copy className="h-3 w-3" />
                          Copy from Left
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <FormField control={form.control} name={`lensSpecifications.${index}.rightSph`} render={({ field: f }) => (
                          <FormItem><FormLabel>SPH</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name={`lensSpecifications.${index}.rightCyl`} render={({ field: f }) => (
                          <FormItem><FormLabel>CYL</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name={`lensSpecifications.${index}.rightAxis`} render={({ field: f }) => (
                          <FormItem><FormLabel>Axis</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <FormField control={form.control} name={`lensSpecifications.${index}.rightAdd`} render={({ field: f }) => (
                          <FormItem><FormLabel>Add</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name={`lensSpecifications.${index}.rightPd`} render={({ field: f }) => (
                          <FormItem><FormLabel>PD</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Left Eye (OS)</h4>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => copyRightToLeft(index)}
                        >
                          <Copy className="h-3 w-3" />
                          Copy from Right
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <FormField control={form.control} name={`lensSpecifications.${index}.leftSph`} render={({ field: f }) => (
                          <FormItem><FormLabel>SPH</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name={`lensSpecifications.${index}.leftCyl`} render={({ field: f }) => (
                          <FormItem><FormLabel>CYL</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name={`lensSpecifications.${index}.leftAxis`} render={({ field: f }) => (
                          <FormItem><FormLabel>Axis</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <FormField control={form.control} name={`lensSpecifications.${index}.leftAdd`} render={({ field: f }) => (
                          <FormItem><FormLabel>Add</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name={`lensSpecifications.${index}.leftPd`} render={({ field: f }) => (
                          <FormItem><FormLabel>PD</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField control={form.control} name={`lensSpecifications.${index}.lensType`} render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Lens Type</FormLabel>
                        <FormControl><Input placeholder="Enter Lens Type" {...f} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`lensSpecifications.${index}.frameTypePreference`} render={({ field: f }) => (
                      <FormItem><FormLabel>Frame Type</FormLabel><FormControl><Input placeholder="Enter Frame Type" {...f} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name={`lensSpecifications.${index}.lensMaterial`} render={({ field: f }) => (
                      <FormItem><FormLabel>Lens Material</FormLabel><FormControl><Input placeholder="Enter Lens Material" {...f} /></FormControl></FormItem>
                    )} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name={`lensSpecifications.${index}.lensCoatings`} render={({ field: f }) => (
                      <FormItem><FormLabel>Lens Coatings</FormLabel><FormControl><Input placeholder="Enter Lens Coatings" {...f} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name={`lensSpecifications.${index}.lensWearType`} render={({ field: f }) => (
                      <FormItem><FormLabel>Lens Wear Type</FormLabel><FormControl><Input placeholder="Enter Lens Wear Type" {...f} /></FormControl></FormItem>
                    )} />
                  </div>

                  {correctionType === "CONTACT_LENS" && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField control={form.control} name={`lensSpecifications.${index}.lensMaterialCl`} render={({ field: f }) => (
                        <FormItem><FormLabel>CL Material</FormLabel><FormControl><Input placeholder="Enter CL Material" {...f} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name={`lensSpecifications.${index}.baseCurve`} render={({ field: f }) => (
                        <FormItem><FormLabel>Base Curve</FormLabel><FormControl><Input placeholder="Enter Base Curve" {...f} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name={`lensSpecifications.${index}.diameter`} render={({ field: f }) => (
                        <FormItem><FormLabel>Diameter</FormLabel><FormControl><Input placeholder="Enter Diameter" {...f} /></FormControl></FormItem>
                      )} />
                    </div>
                  )}

                  <FormField control={form.control} name={`lensSpecifications.${index}.notes`} render={({ field: f }) => (
                    <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Enter Notes" {...f} /></FormControl></FormItem>
                  )} />
                </CardContent>
              </Card>
            );
          })}

          {recFields.map((field, index) => {
            const product = productSummariesMap[form.watch(`products.${index}.productId`)];
            return (
              <div key={field.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setPickerIndex(index)}
                      >
                        {product ? product.productName : "Select product..."}
                      </Button>
                      {product && (
                        <span className="text-xs text-muted-foreground">{product.category}</span>
                      )}
                    </div>
                    <FormField
                      control={form.control}
                      name={`products.${index}.productId`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormControl>
                            <input {...f} type="hidden" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <FormField
                        control={form.control}
                        name={`products.${index}.quantity`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Qty</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                value={f.value}
                                onChange={(e) => f.onChange(Number(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name={`products.${index}.staffNotes`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Usage Notes</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Take twice daily" {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="bg-red-700 text-white hover:bg-red-800 hover:text-white shrink-0 mt-6"
                  onClick={() => removeRec(index)}
                >
                  Remove ✕
                </Button>
              </div>
            );
          })}

          <ProductPickerModal
            open={pickerIndex !== null}
            onOpenChange={(open) => { if (!open) setPickerIndex(null); }}
            onSelect={(product) => {
              if (pickerIndex !== null) {
                form.setValue(`products.${pickerIndex}.productId`, product.productId, { shouldValidate: true });
                setProductSummariesMap((prev) => ({ ...prev, [product.productId]: product }));
                setPickerIndex(null);
              }
            }}
          />

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
