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
import { productSchema } from "@/types"; // Import schema from types
import type { ProductFormData } from "@/types";

interface ProductFormProps {
  defaultValues?: ProductFormData;
  onFormSubmit: (data: ProductFormData) => Promise<void>;
  isLoading: boolean;
  isEditMode: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  onFormSubmit,
  defaultValues: passedDefaultValues,
  isLoading,
  isEditMode,
}) => {
  const navigate = useNavigate();

  const defaultValues: ProductFormData = {
    productName: "",
    category: "eyeglasses",
    supplier: "",
    unitPrice: undefined as any,
    quantity: undefined as any,
    lowLevelThreshold: undefined as any,
    overstockedThreshold: undefined as any,
    isArchived: false,
    imageDir: "",
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: passedDefaultValues || defaultValues,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)}>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                        type="number"
                        step="0.01"
                        placeholder="Enter unit price"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : e.target.valueAsNumber
                          );
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
                        type="number"
                        placeholder="Enter quantity"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : e.target.valueAsNumber
                          );
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
                        type="number"
                        placeholder="Enter low stock threshold"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : e.target.valueAsNumber
                          );
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
                        type="number"
                        placeholder="Enter overstock threshold"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? undefined : e.target.valueAsNumber
                          );
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
