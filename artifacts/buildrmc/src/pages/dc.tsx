import { useGetDeliveryChallans, getGetDeliveryChallansQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export default function DeliveryChallans() {
  const { data: dcs, isLoading } = useGetDeliveryChallans({
    query: { queryKey: getGetDeliveryChallansQueryKey() }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Delivery Challans</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create DC
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Challans</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DC #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dcs?.map((dc) => (
                  <TableRow key={dc.id}>
                    <TableCell className="font-medium">{dc.dcNumber}</TableCell>
                    <TableCell>{new Date(dc.dcDate).toLocaleDateString()}</TableCell>
                    <TableCell>{dc.vehicleReg}</TableCell>
                    <TableCell>{dc.destination}</TableCell>
                    <TableCell>{dc.status}</TableCell>
                  </TableRow>
                ))}
                {!dcs?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No delivery challans found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
