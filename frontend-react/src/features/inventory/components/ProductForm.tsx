import { useEffect, useMemo } from "react";
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

interface ProductFormProps {
  defaultValues?: ProductFormData;
  onFormSubmit: (data: ProductFormData) => Promise<void>;
  isLoading: boolean;
  isEditMode: boolean;
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
    imageDir: values?.imageDir ?? "",
    isArchived: values?.isArchived ?? false,
  };
};

export const ProductForm: React.FC<ProductFormProps> = ({
  onFormSubmit,
  defaultValues: passedDefaultValues,
  isLoading,
  isEditMode,
}) => {
  const navigate = useNavigate();

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
    }
    const payload = productSchema.parse(values);
    await onFormSubmit(payload);
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

              {!isService && (
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/inventory")}
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
