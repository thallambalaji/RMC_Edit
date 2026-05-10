import { useState } from "react";
import { Link } from "wouter";
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
import { ChevronRight, Search, FileStack } from "lucide-react";

export default function ConsolidateInvoiceList() {
  const [pageSize, setPageSize] = useState(10);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customer, setCustomer] = useState("all");

  const handleClear = () => {
    setInvoiceNo("");
    setFromDate("");
    setToDate("");
    setCustomer("all");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Consolidate Invoice List</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Billing</span>
          <ChevronRight className="h-3 w-3" />
          <span>Invoice</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Consolidate Invoice List</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Consolidate Invoice No</Label>
            <Input placeholder="Enter Consolidate Invoice" className="bg-gray-50 h-10" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">From Date :</Label>
            <Input type="date" className="bg-gray-50 h-10" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">To Date :</Label>
            <Input type="date" className="bg-gray-50 h-10" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Customer :</Label>
            <Select value={customer} onValueChange={setCustomer}>
              <SelectTrigger className="bg-gray-50 h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Customer</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white h-10 px-6 flex-1">Search</Button>
            <Button variant="destructive" className="bg-rose-500 hover:bg-rose-600 text-white h-10 px-6 flex-1" onClick={handleClear}>Clear</Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v, 10))}>
            <SelectTrigger className="w-20 h-9 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white border-b border-gray-100">
              <TableHead className="text-gray-900 font-bold py-4 text-center">Consolidate No</TableHead>
              <TableHead className="text-gray-900 font-bold text-center">Customer</TableHead>
              <TableHead className="text-gray-900 font-bold text-center">Generated Date</TableHead>
              <TableHead className="text-gray-900 font-bold text-center">Net Quantity</TableHead>
              <TableHead className="text-gray-900 font-bold text-center">Net Amount</TableHead>
              <TableHead className="text-gray-900 font-bold text-center">Option</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-gray-400">No data available in table</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="text-sm text-gray-600">Showing 0 to 0 of 0 entries</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-gray-400" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="text-gray-400" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
