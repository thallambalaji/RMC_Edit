import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useGetInvoices, useGetCustomers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight, Search, RotateCcw, Files } from "lucide-react";

export default function ConsolidateSalesDocumentList() {
  const { data: invoices, isLoading } = useGetInvoices();
  const { data: customers } = useGetCustomers();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [consolidateId, setConsolidateId] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setConsolidateId("");
    setCustomerFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* Header with breadcrumbs */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Consolidate Sales Document List</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Sales Document</span>
          <ChevronRight className="h-3 w-3" />
          <span>Report</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Consolidate Sales Document List</span>
        </nav>
      </div>

      {/* Filters card */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="fromDate" className="text-sm font-semibold">From Date <span className="text-cyan-500">*</span></Label>
            <Input
              id="fromDate"
              type="date"
              className="bg-gray-50 border-gray-200 h-10"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate" className="text-sm font-semibold">To Date <span className="text-cyan-500">*</span></Label>
            <Input
              id="toDate"
              type="date"
              className="bg-gray-50 border-gray-200 h-10"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consolidateId" className="text-sm font-semibold">Consolidate Invoice Id <span className="text-cyan-500">*</span></Label>
            <Input
              id="consolidateId"
              placeholder="Enter Invoice No.."
              className="bg-gray-50 border-gray-200 h-10"
              value={consolidateId}
              onChange={(e) => setConsolidateId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer" className="text-sm font-semibold">Customer <span className="text-cyan-500">*</span></Label>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger id="customer" className="bg-gray-50 border-gray-200 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customer</SelectItem>
                {customers?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="button" className="bg-emerald-500 hover:bg-emerald-600 h-10 px-6 text-white font-medium flex-1">
              Search
            </Button>
            <Button type="button" className="bg-rose-500 hover:bg-rose-600 h-10 px-6 text-white font-medium flex-1" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v, 10))}>
              <SelectTrigger className="w-20 h-9 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="bg-gray-400 hover:bg-gray-500 text-white border-none">Copy</Button>
            <Button variant="secondary" size="sm" className="bg-gray-400 hover:bg-gray-500 text-white border-none">CSV</Button>
            <Button variant="secondary" size="sm" className="bg-gray-400 hover:bg-gray-500 text-white border-none">PDF</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white border-b border-gray-100">
                <TableHead className="text-gray-900 font-bold py-4 text-center">Consolidate Invoice ID</TableHead>
                <TableHead className="text-gray-900 font-bold text-center">Customer</TableHead>
                <TableHead className="text-gray-900 font-bold text-center">Generate Date</TableHead>
                <TableHead className="text-gray-900 font-bold text-center">No Of Invoice</TableHead>
                <TableHead className="text-gray-900 font-bold text-center">Plant Name</TableHead>
                <TableHead className="text-gray-900 font-bold text-center">Option</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400 italic">
                  Processing...
                  <br />
                  No data available in table
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Showing 0 to 0 of 0 entries
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-gray-400" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="text-gray-400" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
