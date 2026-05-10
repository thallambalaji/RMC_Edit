import { useGetQcTests, getGetQcTestsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export default function QC() {
  const { data: tests, isLoading } = useGetQcTests({
    query: { queryKey: getGetQcTestsQueryKey() }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">QC Tests</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Test Result
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample Code</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Slump (mm)</TableHead>
                  <TableHead>Strength (MPa)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests?.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.sampleCode}</TableCell>
                    <TableCell>{new Date(test.testDate).toLocaleDateString()}</TableCell>
                    <TableCell>{test.grade}</TableCell>
                    <TableCell>{test.slump}</TableCell>
                    <TableCell>{test.strength}</TableCell>
                    <TableCell>{test.status}</TableCell>
                  </TableRow>
                ))}
                {!tests?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No tests found
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
