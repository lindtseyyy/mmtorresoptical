import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { TopSellingProductDTO } from "@/features/reports/types";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

interface TopSellingProductsTableProps {
  products: TopSellingProductDTO[];
}

const TopSellingProductsTable: React.FC<TopSellingProductsTableProps> = ({ products }) => (
  <Card>
    <CardHeader className="bg-muted">
      <CardTitle>Top Selling Products</CardTitle>
    </CardHeader>
    <CardContent>
      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No top selling products yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="w-[30%] py-3 pr-4 font-medium">Product</th>
                <th className="w-[20%] py-3 pr-4 font-medium">Category</th>
                <th className="w-[16%] py-3 pr-4 font-medium text-right">Unit Price</th>
                <th className="w-[16%] py-3 pr-4 font-medium text-right">Units Sold</th>
                <th className="w-[18%] py-3 pr-4 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.productId} className="border-b hover:bg-muted">
                  <td className="py-3 pr-4 font-medium">{p.productName}</td>
                  <td className="py-3 pr-4 capitalize text-muted-foreground">
                    {p.category.replace(/_/g, " ")}
                  </td>
                  <td className="py-3 pr-4 text-right">{currency(p.unitPrice)}</td>
                  <td className="py-3 pr-4 text-right">{p.totalSold}</td>
                  <td className="py-3 pr-4 text-right font-medium">{currency(p.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

export default TopSellingProductsTable;
