import { useState } from "react";
import { Link } from "wouter";
import { useGetSalesOrders, useDeleteSalesOrder, useUpdateSalesOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, Loader2, FileText, RotateCcw, Printer, Trash2, Copy, FileSpreadsheet, MoreHorizontal, CheckCircle2, AlertCircle } from "lucide-react";
import { isWithinInterval, parseISO, parse, format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function SalesOrderReport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState("Date Wise");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showReport, setShowReport] = useState(false);

  // Selected Sales Order state specifically for Single Document Printing
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  const { data: orders, isLoading } = useGetSalesOrders();

  // Hook up updateSalesOrder mutation
  const { mutate: updateSalesOrder } = useUpdateSalesOrder({
    mutation: {
      onSuccess: () => {
        toast({ title: "Status Updated! ✅", description: "The Sales Order status has been successfully updated." });
        queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      },
      onError: (err: any) => {
        toast({ title: "Update Failed", description: err.message || "Failed to update status in MongoDB.", variant: "destructive" });
      }
    }
  });

  const handleToggleStatus = (order: any) => {
    const nextStatus = order.status === "completed" ? "pending" : "completed";
    updateSalesOrder({
      id: order.id,
      data: { status: nextStatus } as any
    });
  };

  // Hook up deleteSalesOrder mutation to live Atlas DB
  const { mutate: deleteSalesOrder } = useDeleteSalesOrder({
    mutation: {
      onSuccess: () => {
        toast({ title: "Order Deleted! 🗑️", description: "The Sales Order has been permanently removed from your system." });
        queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      },
      onError: (err: any) => {
        toast({ title: "Deletion Failed", description: err.message || "Failed to remove sales order from MongoDB.", variant: "destructive" });
      }
    }
  });

  const handleDelete = (id: any) => {
    if (confirm("Are you sure you want to permanently delete this Sales Order? This action cannot be undone.")) {
      deleteSalesOrder({ id });
    }
  };

  const handleGenerate = () => {
    if (!fromDate || !toDate) {
      toast({ title: "Validation Error", description: "Please select both From and To dates to generate report.", variant: "destructive" });
      return;
    }
    setShowReport(true);
    toast({ title: "Report Generated Successfully" });
  };

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setShowReport(false);
    toast({ title: "Filters Cleared" });
  };
  const filteredData = (orders as any[])?.filter((order: any) => {
    if (!fromDate || !toDate) return true;
    try {
      const orderDate = parse(order.poDate, 'dd/MM/yyyy', new Date());
      return isWithinInterval(orderDate, {
        start: parseISO(fromDate),
        end: parseISO(toDate)
      });
    } catch (e) {
      return true;
    }
  }) || [];
  // Copy single order row
  const handleCopySingle = (o: any) => {
    const totalQty = o.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) || 0;
    const text = `PO Number: ${o.poNumber}\nPO Date: ${o.poDate}\nCustomer: ${o.customerName}\nTotal Qty: ${totalQty} m³\nStatus: ${o.status || "Pending"}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Details Copied", description: "This order's details have been copied." });
  };

  // Export single order to CSV
  const handleExportCSVResponseSingle = (o: any) => {
    const headers = ["PO Number", "PO Date", "Customer", "Grade", "Quantity", "Rate", "Remaining Qty"];
    const rows = o.items?.map((item: any) => [
      `"${o.poNumber}"`,
      `"${o.poDate}"`,
      `"${o.customerName}"`,
      `"${item.grade}"`,
      `"${item.quantity}"`,
      `"${item.rate}"`,
      `"${item.remainingQty || 0}"`
    ]) || [];
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_order_${o.poNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded", description: `Order ${o.poNumber} CSV file generated.` });
  };

  // Print full generated report preview
  const handlePrintFullReport = () => {
    setPrintOrder(null); // Print full report summary
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Single dossier print trigger
  const handlePrintSingle = (o: any) => {
    setPrintOrder(o);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const labelStyle = "text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter";
  const inputStyle = "h-8 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white";

  return (
    <div className="space-y-4">
      {/* CSS Stylesheet wrapper inside JSX for full Print Layout Control */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-sheet, .print-sheet * {
            visibility: visible;
          }
          .print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen Path Header */}
      <div className="flex items-center justify-between no-print">
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Sales Order Report</h2>
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/customer-po" className="hover:text-[#ea580c] transition-colors">Customer & PO</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#ea580c]">Sales Order Report</span>
        </nav>
      </div>

      {/* Grid Filters section with proper h-8 styling and balanced spacing */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          
          <div className="space-y-1">
            <Label className={labelStyle}>Report Type <span className="text-rose-500">*</span></Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 text-[10px] border-gray-200 rounded font-bold px-2 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Date Wise" className="text-[10px] font-bold">Date Wise</SelectItem>
                <SelectItem value="Customer Wise" className="text-[10px] font-bold">Customer Wise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className={labelStyle}>From Date</Label>
            <Input 
              type="date" 
              className={inputStyle} 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className={labelStyle}>To Date</Label>
            <Input 
              type="date" 
              className={inputStyle} 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {/* Symmetrical Search and Clear action buttons with proper height and size */}
          <div className="flex gap-2 h-8">
            <Button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-[#ea580c] hover:bg-[#d97706] text-white flex-1 h-full text-[10px] font-black uppercase tracking-wider shadow-none border-0 flex items-center justify-center gap-1 cursor-pointer"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              Generate
            </Button>
            <Button 
              onClick={handleClear}
              className="bg-rose-500 hover:bg-rose-600 text-white flex-1 h-full text-[10px] font-black uppercase tracking-wider shadow-none border-0 flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>

        </div>
      </div>

      {showReport && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 no-print">
          <div className="bg-[#ea580c] p-3 flex items-center justify-between text-white">
            <h3 className="font-black text-[11px] uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Report Preview ({type})
            </h3>
            <Button onClick={handlePrintFullReport} variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-1 px-3 h-7 text-[10px] font-black uppercase cursor-pointer">
              <Printer className="h-3.5 w-3.5" /> Print Report
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-bold text-gray-700 text-center w-16 text-[10px] uppercase">S/L</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center text-[10px] uppercase">PO Number</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center text-[10px] uppercase">PO Date</TableHead>
                  <TableHead className="font-bold text-gray-700 text-left text-[10px] uppercase">Customer Name</TableHead>
                  <TableHead className="p-0">
                    <div className="grid grid-cols-3 h-full divide-x divide-gray-100">
                      <div className="flex items-center justify-center p-2 font-bold text-gray-700 text-[10px] uppercase">Grade</div>
                      <div className="flex items-center justify-center p-2 font-bold text-gray-700 text-[10px] uppercase">Qty (m³)</div>
                      <div className="flex items-center justify-center p-2 font-bold text-gray-700 text-[10px] uppercase">Rate (₹)</div>
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 text-center text-[10px] uppercase border-r border-gray-100">STATUS</TableHead>
                  <TableHead className="font-bold text-gray-700 text-center text-[10px] uppercase">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-400 font-bold text-[10px] uppercase">
                      No records found for the selected date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((order, idx) => (
                    <TableRow key={order.id} className="hover:bg-gray-50/50 border-b border-gray-100">
                      <TableCell className="text-center font-bold text-[10px] border-r border-gray-100">{idx + 1}</TableCell>
                      <TableCell className="text-center font-black text-[#ea580c] text-[10px] border-r border-gray-100">{order.poNumber}</TableCell>
                      <TableCell className="text-center text-[10px] font-semibold border-r border-gray-100">{order.poDate}</TableCell>
                      <TableCell className="text-left font-bold text-[10px] border-r border-gray-100 max-w-[200px] truncate">{order.customerName}</TableCell>
                      <TableCell className="p-0 border-r border-gray-100">
                        <div className="flex flex-col divide-y divide-gray-100">
                          {order.items?.map((item: any, iIdx: number) => (
                            <div key={iIdx} className="grid grid-cols-3 divide-x divide-gray-100">
                              <div className="p-1.5 text-center text-[10px] font-bold text-gray-700">{item.grade}</div>
                              <div className="p-1.5 text-center text-[10px] font-black">{item.quantity}</div>
                              <div className="p-1.5 text-center text-[10px] font-bold text-gray-500">₹{item.rate}</div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      
                      {/* Live Status Badge with instant toggle triggers */}
                      <TableCell className="text-center border-r border-gray-100">
                        <button 
                          type="button"
                          onClick={() => handleToggleStatus(order)}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border cursor-pointer hover:opacity-80 transition-all ${
                            order.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}
                          title="Click to toggle order status"
                        >
                          {order.status || 'pending'}
                        </button>
                      </TableCell>

                      <TableCell className="text-center align-middle">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 cursor-pointer hover:bg-slate-100">
                              <MoreHorizontal className="h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 bg-white font-bold text-xs p-1">
                            
                            <DropdownMenuItem onClick={() => handleToggleStatus(order)} className="flex items-center gap-2 px-2.5 py-1.5 text-gray-700 hover:bg-slate-50 cursor-pointer rounded">
                              {order.status === 'completed' ? (
                                <>
                                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Set as Pending</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Approve & Complete</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <div className="h-px bg-slate-100 my-1" />

                            <DropdownMenuItem onClick={() => handlePrintSingle(order)} className="flex items-center gap-2 px-2.5 py-1.5 text-gray-700 hover:bg-slate-50 cursor-pointer rounded">
                              <Printer className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Print PDF</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleExportCSVResponseSingle(order)} className="flex items-center gap-2 px-2.5 py-1.5 text-gray-700 hover:bg-slate-50 cursor-pointer rounded">
                              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Export CSV</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleCopySingle(order)} className="flex items-center gap-2 px-2.5 py-1.5 text-gray-700 hover:bg-slate-50 cursor-pointer rounded">
                              <Copy className="h-3.5 w-3.5 text-[#ea580c]" />
                              <span>Copy Details</span>
                            </DropdownMenuItem>

                            <div className="h-px bg-slate-100 my-1" />

                            <DropdownMenuItem onClick={() => handleDelete(order.id)} className="flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer rounded">
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Order</span>
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <div className="space-y-0.5 text-right">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Total Orders</p>
              <p className="text-xl font-black text-gray-800">{filteredData.length}</p>
            </div>
          </div>
        </div>
      )}

      {!showReport && (
        <div className="h-64 flex flex-col items-center justify-center text-gray-300 italic border-2 border-dashed border-gray-100 rounded-lg mt-8 gap-3 bg-gray-50/30 no-print">
          <FileText className="h-10 w-10 text-gray-200" />
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Select date range and click "Generate" to view report</p>
        </div>
      )}

      {/* DUAL RENDER PRINTS */}

      {/* Print Option A: Branded Single Sales Order Sheet */}
      {printOrder && (
        <div className="print-sheet hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <div className="flex justify-between items-center border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#ea580c] tracking-tight">FORTUNE CONCRETE</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Premium Ready Mix Concrete Solutions</p>
              <p className="text-[10px] text-gray-400 mt-1">Sy No. 124, Medchal Highway, Medchal, Hyderabad - 501401</p>
            </div>
            <div className="text-right">
              <div className="bg-[#ea580c] text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block rounded mb-1">SALES ORDER</div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">GSTIN: 36AAAAF1234A1Z0</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#ea580c] uppercase text-[10px] tracking-wider mb-2">Order Information</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">PO Number: <span className="font-black text-gray-900">{printOrder.poNumber}</span></p>
                <p className="text-xs font-bold text-gray-700">PO Date: <span className="font-medium text-gray-900">{printOrder.poDate}</span></p>
                <p className="text-xs font-bold text-gray-700">Validity: <span className="font-medium text-gray-900">{printOrder.validity || "N/A"}</span></p>
                <p className="text-xs font-bold text-gray-700">Order Type: <span className="font-medium text-gray-900 capitalize">{printOrder.orderType || "Regular"}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#ea580c] uppercase text-[10px] tracking-wider mb-2">Customer & Delivery</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Customer: <span className="font-black text-gray-900">{printOrder.customerName}</span></p>
                <p className="text-xs font-bold text-gray-700">Site Address: <span className="font-medium text-gray-900">{printOrder.siteAddress || "N/A"}</span></p>
                <p className="text-xs font-bold text-gray-700">Sales Person: <span className="font-medium text-gray-900">{printOrder.salesPerson || "N/A"}</span></p>
                <p className="text-xs font-bold text-gray-700">Allocated Plant: <span className="font-medium text-gray-900">{printOrder.plant || "N/A"}</span></p>
              </div>
            </div>
          </div>

          <table className="w-full border collapse text-left mb-6">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider">
                <th className="border p-2 text-center">S/No</th>
                <th className="border p-2">Grade Type</th>
                <th className="border p-2 text-center">Quantity (m³)</th>
                <th className="border p-2 text-right">Unit Rate (₹)</th>
                <th className="border p-2 text-right">Total Amount (₹)</th>
                <th className="border p-2 text-center">Remaining Qty (m³)</th>
              </tr>
            </thead>
            <tbody>
              {printOrder.items?.map((item: any, idx: number) => (
                <tr key={idx} className="text-xs">
                  <td className="border p-2 text-center font-bold">{idx + 1}</td>
                  <td className="border p-2 font-semibold text-gray-800">{item.grade}</td>
                  <td className="border p-2 text-center font-medium">{item.quantity}</td>
                  <td className="border p-2 text-right font-medium">{item.rate}</td>
                  <td className="border p-2 text-right font-bold">₹{(item.quantity * item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="border p-2 text-center font-bold text-indigo-600">{item.remainingQty || "0.00"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-start gap-10 mt-8">
            <div className="text-xs text-gray-500 max-w-sm">
              <p className="font-bold uppercase text-gray-700 mb-1">Terms & Conditions:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Concrete supply is governed strictly by the pre-approved RMC specifications.</li>
                <li>Invoices are due according to the specified credit window.</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-4 rounded border w-72 text-right">
              <div className="flex justify-between text-xs py-1">
                <span className="font-bold text-gray-500">Tax Include:</span>
                <span className="font-semibold text-gray-800 uppercase">{printOrder.taxInclude ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="font-bold text-gray-500">GST Percent:</span>
                <span className="font-semibold text-gray-800">{printOrder.gstPercent || "18"}%</span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between text-sm py-1">
                <span className="font-black text-gray-900">Grand Total:</span>
                <span className="font-black text-[#ea580c] text-base">₹{(printOrder.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end mt-20 text-xs">
            <div>
              <div className="h-px bg-gray-300 w-44 mb-2" />
              <p className="font-bold text-gray-500 text-[10px] uppercase">Customer Signature</p>
            </div>
            <div className="text-right">
              <div className="h-px bg-gray-300 w-44 mb-2 ml-auto" />
              <p className="font-bold text-gray-500 text-[10px] uppercase">Authorized Signatory</p>
              <p className="font-black text-[#ea580c] uppercase mt-1">Fortune Concrete</p>
            </div>
          </div>
        </div>
      )}

      {/* Print Option B: Branded Report Preview Sheet */}
      {!printOrder && (
        <div className="print-sheet hidden print:block bg-white p-6 text-black w-full">
          <div className="border-b-2 border-gray-800 pb-4 mb-4">
            <h1 className="text-2xl font-black text-[#ea580c] uppercase tracking-tight">FORTUNE CONCRETE</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Premium Ready Mix Concrete Solutions</p>
            <p className="text-[9px] text-gray-400">Sy No. 124, Medchal Highway, Medchal, Hyderabad - 501401</p>
            <div className="mt-3 flex justify-between items-center">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">SALES ORDER REPORT ({type})</h2>
              <p className="text-xs font-bold text-gray-600">Period: {fromDate} To {toDate}</p>
            </div>
          </div>

          <table className="w-full border-collapse border text-[10px] text-left">
            <thead>
              <tr className="bg-slate-100 font-bold uppercase text-gray-800">
                <th className="border p-2 text-center">S/No</th>
                <th className="border p-2 text-center">PO Number</th>
                <th className="border p-2 text-center">PO Date</th>
                <th className="border p-2">Customer Name</th>
                <th className="border p-2 text-center">Concrete Grade</th>
                <th className="border p-2 text-center">Quantity</th>
                <th className="border p-2 text-right">Unit Rate (₹)</th>
                <th className="border p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((order, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border p-2 text-center font-semibold">{idx + 1}</td>
                  <td className="border p-2 text-center font-bold text-indigo-700">{order.poNumber}</td>
                  <td className="border p-2 text-center">{order.poDate}</td>
                  <td className="border p-2 font-medium">{order.customerName}</td>
                  <td className="p-0 border-r border-b" colSpan={3}>
                    <table className="w-full">
                      <tbody>
                        {order.items?.map((item: any, iIdx: number) => (
                          <tr key={iIdx} className="border-b last:border-0">
                            <td className="p-2 text-center text-[10px] w-1/3">{item.grade}</td>
                            <td className="p-2 text-center text-[10px] font-bold w-1/3">{item.quantity}</td>
                            <td className="p-2 text-right text-[10px] w-1/3">₹{item.rate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                  <td className="border p-2 text-center uppercase font-bold text-amber-600">{order.status || "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-between items-center text-xs border-t pt-4">
            <p className="font-bold text-gray-500">Printed Date: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            <p className="font-black text-[#ea580c]">Total Orders Registered: {filteredData.length}</p>
          </div>
        </div>
      )}

    </div>
  );
}
