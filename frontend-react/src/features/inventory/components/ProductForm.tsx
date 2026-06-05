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
import CategoryCombobox from "@/features/inventory/components/CategoryCombobox";
import CategoryManagementModal from "@/features/inventory/components/CategoryManagementModal";
import SupplierCombobox from "@/features/inventory/components/SupplierCombobox";
import SupplierManagementModal from "@/features/inventory/components/SupplierManagementModal";
import {
  productSchema,
  productFormSchema,
  type ProductFormData,
  type ProductFormValues,
} from "@/features/inventory/types";
import { Upload, X, Settings } from "lucide-react";

interface ProductFormProps {
  defaultValues?: ProductFormData;
  onFormSubmit: (data: ProductFormData, imageFile?: File | null) => Promise<void>;
  isLoading: boolean;
  isEditMode: boolean;
  productId?: string;
  existingImageUrl?: string | null;
}

const DECIMAL_INPUT_REGEX = /^\d*(?:\.\d*)?$/;
const INTEGER_INPUT_REGEX = /^\d*$/;

const mapToFormValues = (values?: ProductFormData): ProductFormValues => {
  const productType = values?.productType ?? "PHYSICAL";
  const isService = productType === "SERVICE";

  return {
    productName: values?.productName ?? "",
    categoryId: values?.categoryId ?? undefined,
    newCategoryName: undefined,
    supplierId: isService ? undefined : (values?.supplierId ?? undefined),
    newSupplierName: undefined,
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
    isSeniorPwdEligible: values?.isSeniorPwdEligible ?? true,
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    passedDefaultValues?.categoryId ?? null
  );
  const [newCategoryName, setNewCategoryName] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    passedDefaultValues?.supplierId ?? null
  );
  const [newSupplierName, setNewSupplierName] = useState<string | null>(null);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierRefreshKey, setSupplierRefreshKey] = useState(0);

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
    setSelectedCategoryId(null);
    setNewCategoryName(null);
    form.setValue("categoryId", undefined, { shouldValidate: false });
    form.setValue("newCategoryName", undefined, { shouldValidate: false });

    if (watchedProductType === "PHYSICAL") {
      const origIsPhysical = passedDefaultValues?.productType === "PHYSICAL";
      form.setValue("quantity", origIsPhysical ? String(passedDefaultValues.quantity ?? 0) : "0", { shouldValidate: false });
      form.setValue("lowLevelThreshold", origIsPhysical ? String(passedDefaultValues.lowLevelThreshold ?? 0) : "0", { shouldValidate: false });
      form.setValue("overstockedThreshold", origIsPhysical ? String(passedDefaultValues.overstockedThreshold ?? 0) : "0", { shouldValidate: false });
      form.setValue("leadTimeDays", origIsPhysical ? String(passedDefaultValues.leadTimeDays ?? 3) : "3", { shouldValidate: false });
      form.setValue("supplierId", selectedSupplierId ?? undefined, { shouldValidate: false });
    }
  }, [watchedProductType, form, passedDefaultValues]);

  useEffect(() => {
    form.reset(initialFormValues);
    setSelectedCategoryId(passedDefaultValues?.categoryId ?? null);
    setNewCategoryName(null);
    setSelectedSupplierId(passedDefaultValues?.supplierId ?? null);
    setNewSupplierName(null);
  }, [initialFormValues, form, passedDefaultValues]);

  const handleSubmit = form.handleSubmit(async (values) => {
    if (values.productType === "SERVICE") {
      values.supplierId = undefined;
      values.newSupplierName = undefined;
      values.quantity = "";
      values.lowLevelThreshold = "";
      values.overstockedThreshold = "";
      values.leadTimeDays = "";
    }
    if (isEditMode && !isService) {
      values.quantity = String(passedDefaultValues?.quantity ?? "");
    }

    const mergedValues = {
      ...values,
      categoryId: selectedCategoryId ?? undefined,
      newCategoryName: newCategoryName ?? undefined,
      supplierId: selectedSupplierId ?? undefined,
      newSupplierName: newSupplierName ?? undefined,
    };

    const payload = productSchema.parse(mergedValues);
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

            <div className={isService ? "grid gap-4 md:grid-cols-2" : ""}>
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

              {isService && (
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
              )}
            </div>

            <div className={isService ? "" : "grid gap-4 md:grid-cols-2"}>
              {!isService && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="font-semibold">Supplier</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1"
                      title="Manage suppliers"
                      onClick={() => setSupplierModalOpen(true)}
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <SupplierCombobox
                    value={selectedSupplierId}
                    onChange={(id, _name) => {
                      setSelectedSupplierId(id);
                      setNewSupplierName(null);
                      form.setValue("supplierId", id, { shouldValidate: true });
                    }}
                    onCreate={(name) => {
                      setNewSupplierName(name);
                      setSelectedSupplierId(null);
                      form.setValue("newSupplierName", name, { shouldValidate: true });
                    }}
                    disabled={isLoading}
                    refreshKey={supplierRefreshKey}
                  />
                  {form.formState.errors.supplierId && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.supplierId.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="font-semibold">Category</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    title="Manage categories"
                    onClick={() => setCategoryModalOpen(true)}
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <CategoryCombobox
                  value={selectedCategoryId}
                  onChange={(id, _name) => {
                    setSelectedCategoryId(id);
                    setNewCategoryName(null);
                    form.setValue("categoryId", id, { shouldValidate: true });
                  }}
                  onCreate={(name) => {
                    setNewCategoryName(name);
                    setSelectedCategoryId(null);
                    form.setValue("newCategoryName", name, { shouldValidate: true });
                  }}
                  disabled={isLoading}
                  refreshKey={categoryRefreshKey}
                  productType={watchedProductType}
                />
                {form.formState.errors.categoryId && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {!isService && (
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
              )}

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

              {!isService && isEditMode && (
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
              )}
            </div>

            {!isService && (
              <div className="grid gap-4 md:grid-cols-2">
                {!isEditMode && (
                  <FormField
                    control={form.control}
                    name="leadTimeDays"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
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
                )}

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
            {!isService && (
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
            )}

            {/*
              ── Senior/PWD Eligibility ──
            */}
            <FormField
              control={form.control}
              name="isSeniorPwdEligible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                  </FormControl>
                  <FormLabel className="font-medium text-sm cursor-pointer">
                    Eligible for Senior Citizen / PWD Discount (20%)
                  </FormLabel>
                </FormItem>
              )}
            />

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

      <CategoryManagementModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        onCategoriesChanged={() => setCategoryRefreshKey((k) => k + 1)}
      />

      <SupplierManagementModal
        open={supplierModalOpen}
        onOpenChange={setSupplierModalOpen}
        onSuppliersChanged={() => setSupplierRefreshKey((k) => k + 1)}
      />
    </FormProvider>
  );
};
