import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
} from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import {
  productSchema,
  productFormSchema,
  PHYSICAL_CATEGORIES,
  SERVICE_CATEGORIES,
  CATEGORY_LABELS,
  type ProductFormData,
  type ProductFormValues,
  type Category,
} from "@/features/inventory/types";
import { Upload, X } from "lucide-react";

interface ProductFormProps {
  defaultValues?: ProductFormData;
  onFormSubmit: (data: ProductFormData) => Promise<void>;
  isLoading: boolean;
  isEditMode: boolean;
  productId?: string;
}

const DECIMAL_INPUT_REGEX = /^\d*(?:\.\d*)?$/;
const INTEGER_INPUT_REGEX = /^\d*$/;

const mapToFormValues = (values?: ProductFormData): ProductFormValues => {
  const productType = values?.productType ?? "PHYSICAL";
  const isService = productType === "SERVICE";

  return {
    productName: values?.productName ?? "",
    category: values?.category ?? (isService ? "clinical_services" : "eyeglasses"),
    supplier: isService ? "" : (values?.supplier ?? ""),
    productType,
    unitPrice:
      values && values.unitPrice !== undefined ? String(values.unitPrice) : "",
    quantity:
      isService
        ? ""
        : values && values.quantity !== undefined && values.quantity >= 0
          ? String(values.quantity)
          : "",
    lowLevelThreshold:
      isService
        ? ""
        : values && values.lowLevelThreshold !== undefined && values.lowLevelThreshold !== 0
          ? String(values.lowLevelThreshold)
          : "",
    overstockedThreshold:
      isService
        ? ""
        : values && values.overstockedThreshold !== undefined && values.overstockedThreshold !== 0
          ? String(values.overstockedThreshold)
          : "",
    leadTimeDays:
      isService
        ? ""
        : values && values.leadTimeDays !== undefined
          ? String(values.leadTimeDays)
          : "3",
    imageDir: values?.imageDir ?? "",
    isArchived: values?.isArchived ?? false,
  };
};

export const ProductForm: React.FC<ProductFormProps> = ({
  onFormSubmit,
  defaultValues: passedDefaultValues,
  isLoading,
  isEditMode,
  productId,
  existingImageUrl,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const initialFormValues = useMemo(
    () => mapToFormValues(passedDefaultValues),
    [passedDefaultValues]
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialFormValues,
  });

  const watchedProductType = form.watch("productType");
  const isService = watchedProductType === "SERVICE";

  useEffect(() => {
    form.reset(initialFormValues);
  }, [initialFormValues, form]);

  // Reset category to a valid option when product type changes
  useEffect(() => {
    const currentCategory = form.getValues("category");
    const validCategories = isService ? SERVICE_CATEGORIES : PHYSICAL_CATEGORIES;
    if (!(validCategories as readonly string[]).includes(currentCategory)) {
      form.setValue(
        "category",
        isService ? "clinical_services" : "eyeglasses",
        { shouldValidate: false }
      );
    }
  }, [isService, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    // Clear PHYSICAL-only fields for services so the transform receives clean values
    if (values.productType === "SERVICE") {
      values.supplier = "";
      values.quantity = "";
      values.lowLevelThreshold = "";
      values.overstockedThreshold = "";
      values.leadTimeDays = "";
    }
    // Preserve quantity from original data when editing (field is not shown in edit mode)
    if (isEditMode && !isService) {
      values.quantity = String(passedDefaultValues?.quantity ?? "");
    }
    const payload = productSchema.parse(values);
    await onFormSubmit(payload, imageFile);
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Item Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      field.onBlur();
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PHYSICAL">Physical (Inventory)</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={isService ? "" : "grid gap-4 md:grid-cols-2"}>
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      {isService ? "Service Name" : "Product Name"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          isService ? "Enter service name" : "Enter product name"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isService && (
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Supplier</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter supplier name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Category</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      field.onBlur();
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(isService ? SERVICE_CATEGORIES : PHYSICAL_CATEGORIES).map(
                        (cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat as Category]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Unit Price (₱)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="Enter unit price"
                        value={field.value ?? ""}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        onChange={(e) => {
                          const value = e.target.value.trimStart();
                          if (DECIMAL_INPUT_REGEX.test(value)) {
                            field.onChange(value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isService && !isEditMode && (
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter quantity"
                          value={field.value ?? ""}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const value = e.target.value.trimStart();
                            if (INTEGER_INPUT_REGEX.test(value)) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {!isService && (
              <div className="grid gap-4 md:grid-cols-1">
                <FormField
                  control={form.control}
                  name="leadTimeDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Estimated Lead Time (Days)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter supplier lead time in days (default: 3)"
                          value={field.value ?? ""}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const value = e.target.value.trimStart();
                            if (INTEGER_INPUT_REGEX.test(value)) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {!isService && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="lowLevelThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Low Stock Threshold
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter low stock threshold"
                          value={field.value ?? ""}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const value = e.target.value.trimStart();
                            if (INTEGER_INPUT_REGEX.test(value)) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overstockedThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        Overstock Threshold
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter overstock threshold"
                          value={field.value ?? ""}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const value = e.target.value.trimStart();
                            if (INTEGER_INPUT_REGEX.test(value)) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/*
              ── Image Upload Zone ──
            */}
            <div className="space-y-2">
              <Label className="font-semibold">Product Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  if (file) {
                    setImagePreview(URL.createObjectURL(file));
                  } else {
                    setImagePreview(null);
                  }
                }}
              />
              <div
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/")) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-32 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : existingImageUrl ? (
                  <div className="relative">
                    <img
                      src={existingImageUrl}
                      alt="Current"
                      className="h-32 w-32 rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Drop image here or click to browse</span>
                  </div>
                )}
              </div>
              {imageFile && (
                <p className="text-xs text-muted-foreground truncate">{imageFile.name}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                    navigate(
                      isEditMode && productId
                        ? `/inventory/view/${productId}`
                        : "/inventory"
                    )
                  }
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Saving..."
                  : isEditMode
                  ? "Update Item"
                  : "Add Item"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
};
