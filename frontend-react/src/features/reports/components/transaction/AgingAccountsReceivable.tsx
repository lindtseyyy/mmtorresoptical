import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { createAccountsReceivableQueryOptions } from "@/features/sales/hooks/transactionQuery";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const formatDate = (raw: string) =>
  new Date(raw).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

const AgingAccountsReceivable: React.FC = () => {
  const { data: items, isLoading } = useQuery(createAccountsReceivableQueryOptions());

  return (
    <Card>
      <CardHeader className="bg-muted">
        <CardTitle className="text-base">Aging Accounts Receivable</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !items || items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No outstanding accounts receivable older than 14 days.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="w-[14%] py-3 pr-2 font-medium">Transaction #</th>
                  <th className="w-[12%] py-3 pr-2 font-medium">Date</th>
                  <th className="w-[16%] py-3 pr-2 font-medium">Customer</th>
                  <th className="w-[14%] py-3 pr-2 font-medium text-right">Total Amount</th>
                  <th className="w-[14%] py-3 pr-2 font-medium text-right">Amount Paid</th>
                  <th className="w-[14%] py-3 pr-2 font-medium text-right">Balance Due</th>
                  <th className="w-[16%] py-3 font-medium text-right">Days Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.transactionId} className="border-b hover:bg-muted">
                    <td className="py-3 pr-2 font-medium">{item.transactionNumber}</td>
                    <td className="py-3 pr-2 text-muted-foreground">{formatDate(item.transactionDate)}</td>
                    <td className="py-3 pr-2">{item.customerName}</td>
                    <td className="py-3 pr-2 text-right">{currency(item.totalAmount)}</td>
                    <td className="py-3 pr-2 text-right">{currency(item.amountPaid)}</td>
                    <td className="py-3 pr-2 text-right font-medium text-red-600">
                      {currency(item.balanceDue)}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-1 ${item.daysOutstanding > 30 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {item.daysOutstanding} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgingAccountsReceivable;
