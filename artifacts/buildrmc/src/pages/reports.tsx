import { useGetSalesReport, getGetSalesReportQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  const { data: sales, isLoading } = useGetSalesReport(undefined, {
    query: { queryKey: getGetSalesReportQueryKey() }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading reports...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Total Sales</span>
                  <span className="font-medium">₹{sales?.totalSales || 0}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Invoices Generated</span>
                  <span className="font-medium">{sales?.totalInvoices || 0}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Paid Invoices</span>
                  <span className="font-medium text-green-600">{sales?.paidInvoices || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending Invoices</span>
                  <span className="font-medium text-orange-600">{sales?.pendingInvoices || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sales?.topCustomers?.map((c: any, i: number) => (
                  <div key={i} className="flex justify-between border-b pb-2 last:border-0">
                    <span className="font-medium">{c.customerName}</span>
                    <span>₹{c.totalAmount}</span>
                  </div>
                ))}
                {!sales?.topCustomers?.length && (
                  <div className="text-center py-4 text-muted-foreground">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
