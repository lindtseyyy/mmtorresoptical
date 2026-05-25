import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import EmptyTableRows from "@/shared/components/EmptyTableRows";
import type { PageResponse } from "@/shared/types";
import type { ProductDetailsDTO } from "@/features/reports/types";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

interface OverstockedProductsTableProps {
  data: PageResponse<ProductDetailsDTO> | undefined;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
}

const OverstockedProductsTable: React.FC<OverstockedProductsTableProps> = ({
  data,
  isLoading,
  page,
  onPageChange,
  pageSize,
}) => (
  <Card>
    <CardHeader className="bg-muted">
      <CardTitle>Overstocked Products ({data?.totalElements ?? 0})</CardTitle>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (data?.content?.length ?? 0) === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No overstocked products.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="w-[35%] py-3 pr-4 font-medium">Product</th>
                  <th className="w-[20%] py-3 pr-4 font-medium">Category</th>
                  <th className="w-[15%] py-3 pr-4 font-medium text-right">Quantity</th>
                  <th className="w-[15%] py-3 pr-4 font-medium text-right">Threshold</th>
                  <th className="w-[15%] py-3 pr-4 font-medium text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {(data?.content ?? []).map((p) => (
                  <tr key={p.productId} className="border-b hover:bg-muted">
                    <td className="py-3 pr-4 font-medium">{p.productName}</td>
                    <td className="py-3 pr-4 capitalize text-muted-foreground">
                      {p.category.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 pr-4 text-right text-blue-600 font-medium">{p.quantity}</td>
                    <td className="py-3 pr-4 text-right">{p.overstockedThreshold}</td>
                    <td className="py-3 pr-4 text-right">{currency(p.unitPrice)}</td>
                  </tr>
                ))}
                <EmptyTableRows
                  count={pageSize - (data?.content?.length ?? 0)}
                  colSpan={5}
                />
              </tbody>
            </table>
          </div>
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} of {data?.totalPages} ({data?.totalElements} items)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => onPageChange(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (data?.totalPages ?? 1) - 1}
                  onClick={() => onPageChange(page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

export default OverstockedProductsTable;
