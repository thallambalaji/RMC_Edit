import { useState } from "react";
import { Link } from "wouter";
import { useGetSalesOrders } from "@workspace/api-client-react";
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
import { ChevronRight, Loader2, FileText, RotateCcw, Printer } from "lucide-react";
import { isWithinInterval, parseISO, parse } from "date-fns";

export default function SalesOrderReport() {
  const [type, setType] = useState("Date Wise");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showReport, setShowReport] = useState(false);

  const { data: orders, isLoading } = useGetSalesOrders();

  const handleGenerate = () => {
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates");
      return;
    }
    setShowReport(true);
  };

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setShowReport(false);
  };

  const filteredData = orders?.filter(order => {
    if (!fromDate || !toDate) return true;
    try {
      // Assuming poDate is in DD/MM/YYYY format based on previous mock data
      const orderDate = parse(order.poDate, 'dd/MM/yyyy', new Date());
      return isWithinInterval(orderDate, {
        start: parseISO(fromDate),
        end: parseISO(toDate)
      });
    } catch (e) {
      // Fallback if date parsing fails
      return true;
    }
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Order Report</h2>
        <nav className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customer-po" className="hover:text-primary transition-colors">Customer & PO</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Sales Order Report</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Report Type <span className="text-rose-500">*</span></Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-white h-10 border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Date Wise">Date Wise</SelectItem>
                <SelectItem value="Customer Wise">Customer Wise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">From Date</Label>
            <Input 
              type="date" 
              className="bg-white h-10 border-gray-300" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">To Date</Label>
            <Input 
              type="date" 
              className="bg-white h-10 border-gray-300" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-[#3DB9C1] hover:bg-[#2ea4ac] text-white flex-1 h-10 font-bold uppercase tracking-wide shadow-sm"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
              Generate
            </Button>
            <Button 
              onClick={handleClear}
              className="bg-rose-500 hover:bg-rose-600 text-white flex-1 h-10 font-bold uppercase tracking-wide shadow-sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {showReport && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#3DB9C1] p-4 flex items-center justify-between text-white">
            <h3 className="font-bold uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Preview ({type})
            </h3>
            <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2">
              <Printer className="h-4 w-4" /> Print Report
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-bold text-gray-700 text-center w-16">S/L</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">PO Number</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">PO Date</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Customer Name</TableHead>
                  <TableHead className="p-0">
                    <div className="grid grid-cols-3 h-full divide-x divide-gray-200">
                      <div className="flex items-center justify-center p-2 font-bold text-gray-700">Grade</div>
                      <div className="flex items-center justify-center p-2 font-bold text-gray-700">Qty</div>
                      <div className="flex items-center justify-center p-2 font-bold text-gray-700">Rate</div>
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-gray-400 italic">
                      No records found for the selected date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((order, idx) => (
                    <TableRow key={order.id} className="hover:bg-gray-50/50">
                      <TableCell className="text-center font-medium border-r border-gray-100">{idx + 1}</TableCell>
                      <TableCell className="text-center font-bold text-[#3DB9C1] border-r border-gray-100">{order.poNumber}</TableCell>
                      <TableCell className="text-center border-r border-gray-100">{order.poDate}</TableCell>
                      <TableCell className="text-center font-medium border-r border-gray-100">{order.customerName}</TableCell>
                      <TableCell className="p-0 border-r border-gray-100">
                        <div className="flex flex-col divide-y divide-gray-100">
                          {order.items?.map((item: any, iIdx: number) => (
                            <div key={iIdx} className="grid grid-cols-3 divide-x divide-gray-100">
                              <div className="p-2 text-center text-sm">{item.grade}</div>
                              <div className="p-2 text-center text-sm font-semibold">{item.quantity}</div>
                              <div className="p-2 text-center text-sm">{item.rate}</div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <div className="space-y-1 text-right">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Total Orders</p>
              <p className="text-2xl font-black text-gray-800">{filteredData.length}</p>
            </div>
          </div>
        </div>
      )}

      {!showReport && (
        <div className="h-64 flex flex-col items-center justify-center text-gray-300 italic border-2 border-dashed border-gray-100 rounded-lg mt-8 gap-4 bg-gray-50/30">
          <FileText className="h-12 w-12 text-gray-200" />
          <p>Select date range and click "Generate" to view report</p>
        </div>
      )}
    </div>
  );
}
