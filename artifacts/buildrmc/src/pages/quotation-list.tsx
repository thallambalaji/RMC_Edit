import { Link, useLocation } from "wouter";
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
import { Search, RotateCcw, Plus, Copy, FileJson, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export default function QuotationList() {
  const [location] = useLocation();

  const labelStyle = "text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter";
  const inputStyle = "h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#1e40af] font-bold px-2";
  const headerStyle = "bg-slate-100 text-gray-900 font-black py-1.5 px-2 text-center text-[9px] whitespace-nowrap border-r border-gray-200 last:border-0 uppercase tracking-tighter";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-lg border border-gray-100 shadow-sm">
      {/* Search & Filter Section */}
      <div className="p-3 border-b bg-white shrink-0">
        <div className="flex items-center justify-between mb-3">
           <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Customer Quotation List</h2>
           <Link href="/customer-po/quotation/new">
              <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5">
                <Plus className="h-3 w-3" /> Add Quotation
              </Button>
           </Link>
        </div>

        <div className="grid grid-cols-5 gap-3 items-end">
          <div className="col-span-1">
            <Label className={labelStyle}>Quotation No</Label>
            <Input placeholder="Search No..." className={inputStyle} />
          </div>
          <div className="col-span-1">
            <Label className={labelStyle}>From Date</Label>
            <Input type="date" className={inputStyle} />
          </div>
          <div className="col-span-1">
            <Label className={labelStyle}>To Date</Label>
            <Input type="date" className={inputStyle} />
          </div>
          <div className="col-span-1">
            <Label className={labelStyle}>Marketing Person</Label>
            <Select defaultValue="all">
              <SelectTrigger className={inputStyle}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px]">All Sales Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 flex gap-1.5">
            <Button size="sm" className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-black text-[9px] h-7 uppercase tracking-wider shadow-none border-0">
              <Search className="h-3 w-3 mr-1" /> Search
            </Button>
            <Button size="sm" variant="outline" className="flex-1 border-gray-200 text-gray-600 font-black text-[9px] h-7 uppercase tracking-wider">
              <RotateCcw className="h-3 w-3 mr-1" /> Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Table Toolbar */}
      <div className="px-3 py-2 flex items-center justify-between bg-slate-50/50 border-b shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-gray-500 uppercase">Show</span>
          <Select defaultValue="10">
            <SelectTrigger className="w-14 h-6 bg-white border-gray-200 text-[10px] font-bold"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
          </Select>
          <span className="text-[9px] font-black text-gray-500 uppercase">entries</span>
        </div>
        <div className="flex bg-slate-200 rounded p-0.5 gap-0.5">
          <Button variant="ghost" className="h-5 px-3 text-[8px] font-black uppercase text-gray-600 hover:bg-white rounded-sm">Copy</Button>
          <Button variant="ghost" className="h-5 px-3 text-[8px] font-black uppercase text-gray-600 hover:bg-white rounded-sm">CSV</Button>
          <Button variant="ghost" className="h-5 px-3 text-[8px] font-black uppercase text-gray-600 hover:bg-white rounded-sm">PDF</Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-100">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="bg-slate-100 border-0 hover:bg-slate-100">
              <TableHead className={headerStyle}>Quotation NO</TableHead>
              <TableHead className={headerStyle}>Date</TableHead>
              <TableHead className={headerStyle}>Customer</TableHead>
              <TableHead className={headerStyle}>Phone</TableHead>
              <TableHead className={headerStyle}>Site Address</TableHead>
              <TableHead className={headerStyle}>Email</TableHead>
              <TableHead className={headerStyle}>Sales Person</TableHead>
              <TableHead className={headerStyle}>Tax Inc?</TableHead>
              <TableHead className={headerStyle}>Added By</TableHead>
              <TableHead className={headerStyle + " border-r-0"}>Option</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={10} className="text-center py-10 text-[10px] text-gray-400 font-bold italic uppercase">
                No data available in table
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Footer / Pagination */}
      <div className="px-3 py-2 border-t bg-white flex items-center justify-between shrink-0">
        <div className="text-[9px] font-black text-gray-500 uppercase">Showing 0 to 0 of 0 entries</div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-gray-200 text-gray-400" disabled><ChevronLeft className="h-3 w-3" /></Button>
          <div className="h-6 px-2 flex items-center justify-center bg-[#1e40af] text-white text-[9px] font-black rounded">1</div>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-gray-200 text-gray-400" disabled><ChevronRight className="h-3 w-3" /></Button>
        </div>
      </div>
    </div>
  );
}
