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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { productSchema, productFormSchema } from "@/types";
import type { ProductFormData, ProductFormValues } from "@/types";

interface ProductFormProps {
  defaultValues?: ProductFormData;
  onFormSubmit: (data: ProductFormData) => Promise<void>;
  isLoading: boolean;
  isEditMode: boolean;
}

const DECIMAL_INPUT_REGEX = /^\d*(?:\.\d*)?$/;
const INTEGER_INPUT_REGEX = /^\d*$/;

const mapToFormValues = (values?: ProductFormData): ProductFormValues => ({
  productName: values?.productName ?? "",
  category: values?.category ?? "eyeglasses",
  supplier: values?.supplier ?? "",
  unitPrice:
    values && values.unitPrice !== undefined ? String(values.unitPrice) : "",
  quantity:
    values && values.quantity !== undefined ? String(values.quantity) : "",
  lowLevelThreshold:
    values && values.lowLevelThreshold !== undefined
      ? String(values.lowLevelThreshold)
      : "",
  overstockedThreshold:
    values && values.overstockedThreshold !== undefined
      ? String(values.overstockedThreshold)
      : "",
  isArchived: values?.isArchived ?? false,
  imageDir: values?.imageDir ?? "",
});

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

  useEffect(() => {
    form.reset(initialFormValues);
  }, [initialFormValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload = productSchema.parse(values);
    await onFormSubmit(payload);
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode ? "Edit Product" : "Product Information"}
            </CardTitle>
            <CardDescription>Fill in all required fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Product Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <SelectItem value="eyeglasses">Eyeglasses</SelectItem>
                      <SelectItem value="frames">Frames</SelectItem>
                      <SelectItem value="lens">Lens</SelectItem>
                      <SelectItem value="goggles">Goggles</SelectItem>
                      <SelectItem value="prisms">Prisms</SelectItem>
                      <SelectItem value="eyedrop">Eyedrop</SelectItem>
                      <SelectItem value="sunglasses">Sunglasses</SelectItem>
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
            </div>

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

            <FormField
              control={form.control}
              name="isArchived"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-semibold">
                    Archive this product
                  </FormLabel>
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Saving..."
                  : isEditMode
                  ? "Update Product"
                  : "Add Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/inventory")}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
};
