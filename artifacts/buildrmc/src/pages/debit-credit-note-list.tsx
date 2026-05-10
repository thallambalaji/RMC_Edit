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
import { ChevronRight, Search, FileText } from "lucide-react";

export default function DebitCreditNoteList() {
  const [noteNo, setNoteNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const handleClear = () => {
    setNoteNo("");
    setInvoiceNo("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0">
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Debit/Credit Note List</h2>
        <div className="h-4 w-px bg-gray-300" />
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/billing" className="hover:text-[#1e40af] transition-colors">Billing</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#1e40af]">Debit/Credit Notes</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Debit/Credit Note No</Label>
            <Input placeholder="Enter Debit/Credit Note No" className="bg-gray-50 h-10 border-gray-200" value={noteNo} onChange={(e) => setNoteNo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Invoice No</Label>
            <Input placeholder="Enter Invoice No" className="bg-gray-50 h-10 border-gray-200" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">From Date</Label>
            <Input type="date" className="bg-gray-50 h-10 border-gray-200" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">To Date</Label>
            <Input type="date" className="bg-gray-50 h-10 border-gray-200" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex gap-2 lg:col-span-2">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white h-10 px-8 font-medium">Search</Button>
            <Button variant="destructive" className="bg-rose-500 hover:bg-rose-600 text-white h-10 px-8 font-medium" onClick={handleClear}>Clear</Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v, 10))}>
              <SelectTrigger className="w-20 h-9 bg-white border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Search:</span>
            <Input className="w-64 h-9 border-gray-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white border-b border-gray-200">
                <TableHead className="text-gray-900 font-bold py-4 px-4 whitespace-nowrap">Note No</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap">Invoice No</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap">Invoice Type</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap">Note Type</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap">Date</TableHead>
                <TableHead className="bg-cyan-100/50 text-gray-900 font-bold px-4 text-center">Item</TableHead>
                <TableHead className="bg-cyan-100/50 text-gray-900 font-bold px-4 text-center">Quantity</TableHead>
                <TableHead className="bg-cyan-100/50 text-gray-900 font-bold px-4 text-center">Booked Rate</TableHead>
                <TableHead className="bg-cyan-100/50 text-gray-900 font-bold px-4 text-center">Current Rate</TableHead>
                <TableHead className="bg-cyan-100/50 text-gray-900 font-bold px-4 text-center">Amount</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap">TCS Amount</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap">Net Amount</TableHead>
                <TableHead className="text-gray-900 font-bold px-4 whitespace-nowrap">Option</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={13} className="text-center py-12 text-gray-400">No data available in table</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

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
