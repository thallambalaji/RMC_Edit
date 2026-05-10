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

export default function QuotationList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-gray-300 p-2 rounded-t-md">
        <h2 className="text-xl font-bold px-2">Customer Quotation List</h2>
        <nav className="text-xs text-gray-500 flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <span className="text-[10px]">&gt;</span>
          <Link href="/customer-po" className="hover:text-primary transition-colors">Customer & PO</Link>
          <span className="text-[10px]">&gt;</span>
          <Link href="/customer-po/quotation" className="hover:text-primary transition-colors">Customer Quotation</Link>
          <span className="text-[10px]">&gt;</span>
          <span className="text-gray-700">Customer Quotation List</span>
        </nav>
      </div>

      <div className="bg-white rounded-b-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end mb-8">
          <div className="space-y-2 md:col-span-1">
            <Label className="text-sm font-semibold">Quotation No</Label>
            <Input placeholder="Enter Quotation No" className="bg-white h-10 border-gray-300" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label className="text-sm font-semibold">From Date :</Label>
            <Input type="date" className="bg-white h-10 border-gray-300" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label className="text-sm font-semibold">To Date :</Label>
            <Input type="date" className="bg-white h-10 border-gray-300" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label className="text-sm font-semibold">Marketing Person :</Label>
            <Select defaultValue="all">
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Sales Person</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button className="bg-[#10B981] hover:bg-[#059669] text-white h-10 px-6 font-medium">Search</Button>
            <Button className="bg-[#EF4444] hover:bg-[#DC2626] text-white h-10 px-6 font-medium">Clear</Button>
            <Link href="/customer-po/quotation/new">
              <Button className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white h-10 px-6 font-medium">Add Quotation</Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <Select defaultValue="10">
              <SelectTrigger className="w-16 h-8 bg-white border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex bg-gray-400 rounded overflow-hidden">
            <Button variant="ghost" className="h-8 rounded-none px-4 text-white hover:bg-gray-500">Copy</Button>
            <Button variant="ghost" className="h-8 rounded-none px-4 text-white hover:bg-gray-500 border-l border-gray-300">CSV</Button>
            <Button variant="ghost" className="h-8 rounded-none px-4 text-white hover:bg-gray-500 border-l border-gray-300">PDF</Button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white border-b border-gray-200">
                <TableHead className="text-gray-900 font-bold py-3 px-2 text-center text-xs whitespace-nowrap border-r border-gray-100">Quotation NO</TableHead>
                <TableHead className="text-gray-900 font-bold px-2 text-center text-xs whitespace-nowrap border-r border-gray-100">Quotation Date</TableHead>
                <TableHead className="text-gray-900 font-bold px-2 text-center text-xs whitespace-nowrap border-r border-gray-100">Customer Name</TableHead>
                <TableHead className="text-gray-900 font-bold px-2 text-center text-xs whitespace-nowrap border-r border-gray-100">Customer Phone</TableHead>
                <TableHead className="text-gray-900 font-bold px-2 text-center text-xs whitespace-nowrap border-r border-gray-100">Site Address</TableHead>
                <TableHead className="text-gray-900 font-bold px-2 text-center text-xs whitespace-nowrap border-r border-gray-100">Customer Email</TableHead>
                <TableHead className="text-gray-900 font-bold px-2 text-center text-xs whitespace-nowrap border-r border-gray-100">Sales Person</TableHead>
                <TableHead className="text-gray-900 font-bold px-2 text-center text-xs whitespace-nowrap border-r border-gray-100">Rate Include Tax ?</TableHead>
                <TableHead className="text-gray-900 font-bold px-2 text-center text-xs whitespace-nowrap border-r border-gray-100">Added By</TableHead>
                <TableHead className="text-gray-900 font-bold px-2 text-center text-xs whitespace-nowrap">OPTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-gray-50/50">
                <TableCell colSpan={10} className="text-center py-4 text-sm text-gray-600 font-medium">
                  No data available in table
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Showing 0 to 0 of 0 entries</div>
          <div className="flex items-center">
            <Button variant="outline" size="sm" className="text-gray-500 rounded-r-none border-r-0 h-9 bg-white" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="text-gray-500 rounded-l-none h-9 bg-white" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
