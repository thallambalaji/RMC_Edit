import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useGetSalesOrders, useGetCustomers, useDeleteSalesOrder, useUpdateSalesOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";
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
import { ChevronRight, Loader2, Search, RotateCcw, Copy, Printer, Trash2, Pencil, Download, Plus, Filter, MoreVertical } from "lucide-react";
import { isWithinInterval, parseISO, parse, format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function SalesOrderList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(true);
  const [poFilter, setPoFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterCustomerId, setFilterCustomerId] = useState("all");

  const { data: orders, isLoading } = useGetSalesOrders();
  const { data: customers } = useGetCustomers();

  // Selected Sales Order state specifically for Single Document Printing
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o: any) => {
      const matchesPo = o.poNumber.toLowerCase().includes(poFilter.toLowerCase());
      const matchesCustomer = filterCustomerId === "all" || String(o.customerId) === filterCustomerId;
      
      let matchesDate = true;
      if (fromDate && toDate) {
        try {
          const orderDate = parse(o.poDate, 'dd/MM/yyyy', new Date());
          matchesDate = isWithinInterval(orderDate, {
            start: parseISO(fromDate),
            end: parseISO(toDate)
          });
        } catch (e) { matchesDate = true; }
      }
      
      return matchesPo && matchesCustomer && matchesDate;
    });
  }, [orders, poFilter, fromDate, toDate, filterCustomerId]);

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

  const handleClear = () => {
    setPoFilter("");
    setFromDate("");
    setToDate("");
    setFilterCustomerId("all");
    toast({ title: "Filters Cleared" });
  };

  // Copy individual or filtered orders
  const handleCopy = () => {
    if (!filteredOrders.length) {
      toast({ title: "No data to copy", variant: "destructive" });
      return;
    }
    const headers = ["PO Number", "PO Date", "Validity", "Customer", "Total Qty", "Unit", "Total Amount"];
    const rows = filteredOrders.map((o: any) => {
      const totalQty = o.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) || 0;
      return [
        o.poNumber,
        o.poDate,
        o.validity || "N/A",
        o.customerName,
        totalQty.toString(),
        "m³",
        o.totalAmount || "0"
      ];
    });
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", description: "Table data has been copied to your clipboard." });
  };

  // Copy single order row
  const handleCopySingle = (o: any) => {
    const totalQty = o.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) || 0;
    const text = `PO Number: ${o.poNumber}\nPO Date: ${o.poDate}\nValidity: ${o.validity || "N/A"}\nCustomer: ${o.customerName}\nTotal Qty: ${totalQty} m³\nTotal Amount: ₹${o.totalAmount || "0"}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Details Copied", description: "This order's details have been copied." });
  };

  // Export full filtered list to CSV
  const handleExportCSV = () => {
    if (!filteredOrders.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ["PO Number", "PO Date", "Validity", "Customer", "Total Qty", "Unit", "Total Amount"];
    const rows = filteredOrders.map((o: any) => {
      const totalQty = o.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) || 0;
      return [
        `"${o.poNumber}"`,
        `"${o.poDate}"`,
        `"${o.validity || "N/A"}"`,
        `"${o.customerName}"`,
        `"${totalQty}"`,
        `"m³"`,
        `"${o.totalAmount || 0}"`
      ];
    });
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_orders_export_${format(new Date(), "dd_MM_yyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Sales order list has been downloaded as CSV." });
  };

  // Export single order to CSV
  const handleExportCSVResponseSingle = (o: any) => {
    const headers = ["PO Number", "PO Date", "Validity", "Customer", "Grade", "Quantity", "Rate", "Remaining Qty"];
    const rows = o.items?.map((item: any) => [
      `"${o.poNumber}"`,
      `"${o.poDate}"`,
      `"${o.validity || "N/A"}"`,
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

  // Master layout Print trigger
  const handlePrintPDF = () => {
    if (!filteredOrders.length) {
      toast({ title: "No data to print", variant: "destructive" });
      return;
    }
    setPrintOrder(null); // Print entire register
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
  const inputStyle = "h-8 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#1e40af] font-bold px-2 bg-white";

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

      {/* Main Screen Path Header */}
      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 mb-4 no-print">
        <div className="flex items-center gap-3">
          <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Sales Order Management</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <Link href="/customer-po" className="hover:text-[#1e40af] transition-colors">Customer & PO</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#1e40af]">Sales Order List</span>
          </nav>
        </div>
        <div className="flex gap-2">
          <Link href="/customer-po/sales-order/new">
            <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Add Sales Order
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border flex items-center gap-1.5 cursor-pointer ${
              showFilters ? "bg-slate-100 border-slate-400 text-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3 w-3" /> Filters
          </Button>
        </div>
      </div>

      {/* Search Filters Section with properly aligned Clear Button */}
      {showFilters && (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3 items-end">
          
          <div className="lg:col-span-2">
            <Label className={labelStyle}>Po Number</Label>
            <Input 
              placeholder="Enter PO Number" 
              className={inputStyle}
              value={poFilter}
              onChange={(e) => setPoFilter(e.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <Label className={labelStyle}>From Date</Label>
            <Input 
              type="date" 
              className={inputStyle} 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <Label className={labelStyle}>To Date</Label>
            <Input 
              type="date" 
              className={inputStyle} 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <Label className={labelStyle}>Customer</Label>
            <Select value={filterCustomerId} onValueChange={setFilterCustomerId}>
              <SelectTrigger className="h-8 text-[10px] border-gray-200 rounded font-bold px-2 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">All Customer</SelectItem>
                {customers?.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-[10px] font-bold">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Label className={labelStyle}>Site</Label>
            <Select defaultValue="all">
              <SelectTrigger className="h-8 text-[10px] border-gray-200 rounded font-bold px-2 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">All Site</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search and Clear action button cells: Highly readable, completely aligned */}
          <div className="lg:col-span-2 flex gap-1.5 h-8">
            <Button className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white text-[10px] font-black uppercase tracking-wider flex-1 h-full px-1 flex items-center justify-center gap-1 shadow-none border-0 cursor-pointer">
              <Search className="h-3 w-3" /> Search
            </Button>
            <Button 
              className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex-1 h-full px-1 flex items-center justify-center gap-1 shadow-none border-0 cursor-pointer"
              onClick={handleClear}
            >
              <RotateCcw className="h-3 w-3" /> Clear
            </Button>
          </div>

        </div>
      </div>
      )}

      {/* Main List Table View on Screen */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden no-print">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Show</span>
            <Select defaultValue="10">
              <SelectTrigger className="w-16 h-8 bg-white border-gray-200 text-[10px] font-bold"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <ExportDropdown
            onCopy={handleCopy}
            onCSV={handleExportCSV}
            onPDF={handlePrintPDF}
          />
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e40af]" />
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Retrieving Sales Orders from MongoDB...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e40af] hover:bg-[#1e40af]">
                  <TableHead className="text-white font-bold py-3 px-2 text-center border-r border-white/10 text-[10px] uppercase">S/L<br/>No</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">PO<br/>Number</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">PO Date</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">Validity</TableHead>
                  <TableHead className="text-white font-bold px-2 text-left border-r border-white/10 text-[10px] uppercase">Customer</TableHead>
                  <TableHead className="text-white font-bold px-2 text-left border-r border-white/10 text-[10px] uppercase">Site Address</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">Tax<br/>Include?</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">GST<br/>Percent</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">Order<br/>Type</TableHead>
                  <TableHead className="text-white font-bold px-2 text-left border-r border-white/10 text-[10px] uppercase">Sales Person</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">Plant</TableHead>
                  <TableHead className="p-0 border-r border-white/10">
                    <div className="grid grid-cols-4 h-full">
                      <div className="col-span-1 text-white font-bold text-center border-r border-white/10 text-[10px] uppercase flex items-center justify-center py-2.5">Grade</div>
                      <div className="col-span-1 text-white font-bold text-center border-r border-white/10 text-[10px] uppercase flex items-center justify-center py-2.5">Quantity</div>
                      <div className="col-span-1 text-white font-bold text-center border-r border-white/10 text-[10px] uppercase flex items-center justify-center py-2.5">Rate</div>
                      <div className="col-span-1 text-white font-bold text-center text-[10px] uppercase flex items-center justify-center py-2.5">Rem.<br/>Qty</div>
                    </div>
                  </TableHead>
                  <TableHead className="text-white font-bold px-2 text-center border-r border-white/10 text-[10px] uppercase">STATUS</TableHead>
                  <TableHead className="text-white font-bold px-2 text-center text-[10px] uppercase w-[70px]">OPTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px]">No sales orders registered in Database</TableCell>
                  </TableRow>
                ) : filteredOrders.map((order: any, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-100">
                    <TableCell className="text-center text-[10px] font-bold border-r border-gray-100 align-middle py-1.5">{idx + 1}</TableCell>
                    <TableCell className="text-center text-[10px] border-r border-gray-100 align-middle py-1.5 font-black text-[#1e40af]">{order.poNumber}</TableCell>
                    <TableCell className="text-center text-[10px] whitespace-nowrap border-r border-gray-100 align-middle py-1.5 font-bold">{order.poDate}</TableCell>
                    <TableCell className="text-center text-[10px] whitespace-nowrap border-r border-gray-100 align-middle py-1.5 font-semibold text-gray-500">{order.validity || "N/A"}</TableCell>
                    <TableCell className="text-left text-[10px] border-r border-gray-100 align-middle py-1.5 font-bold text-gray-800 max-w-[180px] truncate">{order.customerName}</TableCell>
                    <TableCell className="text-left text-[10px] border-r border-gray-100 align-middle py-1.5 font-semibold text-gray-600 max-w-[150px] truncate">{order.siteAddress || "--"}</TableCell>
                    <TableCell className="text-center text-[10px] border-r border-gray-100 align-middle py-1.5 font-bold uppercase text-gray-500">{order.taxInclude ? "yes" : "no"}</TableCell>
                    <TableCell className="text-center text-[10px] border-r border-gray-100 align-middle py-1.5 font-bold">{order.gstPercent}%</TableCell>
                    <TableCell className="text-center text-[10px] border-r border-gray-100 align-middle py-1.5 capitalize font-bold text-indigo-600">{order.orderType}</TableCell>
                    <TableCell className="text-left text-[10px] border-r border-gray-100 align-middle py-1.5 font-bold text-gray-600">{order.salesPerson || "--"}</TableCell>
                    <TableCell className="text-center text-[10px] border-r border-gray-100 align-middle py-1.5 font-semibold">{order.plant}</TableCell>
                    <TableCell className="p-0 border-r border-gray-100 align-top">
                      <div className="flex flex-col h-full w-full min-w-[250px]">
                        {order.items?.map((item: any, iIdx: number) => (
                          <div key={iIdx} className={`grid grid-cols-4 w-full ${iIdx > 0 ? 'border-t border-gray-200' : ''}`}>
                            <div className="col-span-1 text-center text-[10px] font-black p-1 border-r border-gray-100 text-gray-700">{item.grade}</div>
                            <div className="col-span-1 text-center text-[10px] font-bold p-1 border-r border-gray-100">{item.quantity}</div>
                            <div className="col-span-1 text-center text-[10px] font-bold p-1 border-r border-gray-100">₹{item.rate}</div>
                            <div className="col-span-1 text-center text-[10px] font-black p-1 text-cyan-600">{item.remainingQty || "0.00"}</div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    
                    {/* Live Status Badge with instant toggle triggers */}
                    <TableCell className="text-center align-middle border-r border-gray-100 py-1.5">
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

                    <TableCell className="text-center align-middle py-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full cursor-pointer flex items-center justify-center mx-auto"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                            <span className="sr-only">Open options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-xs bg-white border border-slate-200 shadow-lg rounded-md p-1 z-50">
                          <DropdownMenuItem onClick={() => handlePrintSingle(order)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                            <Printer className="h-3.5 w-3.5 text-red-500" />
                            <span>Print PDF</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportCSVResponseSingle(order)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                            <Download className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Download CSV</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopySingle(order)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                            <Copy className="h-3.5 w-3.5 text-cyan-600" />
                            <span>Copy Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              toast({
                                title: "Edit restricted",
                                description: `Approved Sales Order ${order.poNumber} is locked.`,
                                variant: "destructive"
                              });
                            }}
                            className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                          >
                            <Pencil className="h-3.5 w-3.5 text-blue-600" />
                            <span>Edit Order</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(order.id)} 
                            className="gap-2 cursor-pointer hover:bg-red-50 p-2 rounded text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            <span>Delete Order</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Showing {filteredOrders.length > 0 ? 1 : 0} to {filteredOrders.length} of {filteredOrders.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="text-gray-400 h-8 font-bold">Previous</Button>
            <div className="bg-[#1e40af] text-white h-8 w-8 flex items-center justify-center rounded text-xs font-bold">1</div>
            <Button variant="outline" size="sm" className="text-gray-600 h-8 font-bold">Next</Button>
          </div>
        </div>
      </div>

      {/* DUAL RENDER PRINTS */}

      {/* Print Option A: Branded Single Sales Order Sheet */}
      {printOrder && (
        <div className="print-sheet hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#1e40af]">Sales Order Identity Details</h2>
            <div className="text-right">
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 font-black text-[9px] uppercase tracking-wider border rounded">SALES ORDER</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Order Information</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">PO Number: <span className="font-black text-gray-900">{printOrder.poNumber}</span></p>
                <p className="text-xs font-bold text-gray-700">PO Date: <span className="font-medium text-gray-900">{printOrder.poDate}</span></p>
                <p className="text-xs font-bold text-gray-700">Validity: <span className="font-medium text-gray-900">{printOrder.validity || "N/A"}</span></p>
                <p className="text-xs font-bold text-gray-700">Order Type: <span className="font-medium text-gray-900 capitalize">{printOrder.orderType}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Customer & Delivery</h3>
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
                <li>Invoices are due according to the specified credit window of {printOrder.validity || '30 days'}.</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-4 rounded border w-72 text-right">
              <div className="flex justify-between text-xs py-1">
                <span className="font-bold text-gray-500">Tax Include:</span>
                <span className="font-semibold text-gray-800 uppercase">{printOrder.taxInclude ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="font-bold text-gray-500">GST Percent:</span>
                <span className="font-semibold text-gray-800">{printOrder.gstPercent}%</span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between text-sm py-1">
                <span className="font-black text-gray-900">Grand Total:</span>
                <span className="font-black text-[#1e40af] text-base">₹{printOrder.totalAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
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
              <p className="font-black text-[#1e40af] uppercase mt-1">Fortune Concrete</p>
            </div>
          </div>
        </div>
      )}

      {/* Print Option B: Full Landscape Register Schedule */}
      {!printOrder && (
        <div className="print-sheet hidden print:block bg-white p-6 text-black w-full">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#1e40af]">SALES ORDER REGISTER SCHEDULE</h2>
            <p className="text-[10px] font-bold text-gray-600">Printed Date: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>

          <table className="w-full border-collapse border text-[10px] text-left">
            <thead>
              <tr className="bg-slate-100 font-bold uppercase text-gray-800">
                <th className="border p-2 text-center">S/No</th>
                <th className="border p-2 text-center">PO Number</th>
                <th className="border p-2 text-center">PO Date</th>
                <th className="border p-2">Customer Name</th>
                <th className="border p-2">Site Location</th>
                <th className="border p-2 text-center">Tax Inc?</th>
                <th className="border p-2 text-center">GST %</th>
                <th className="border p-2 text-center">Plant</th>
                <th className="border p-2 text-right">Total Amount (₹)</th>
                <th className="border p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order: any, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border p-2 text-center font-semibold">{idx + 1}</td>
                  <td className="border p-2 text-center font-bold text-indigo-700">{order.poNumber}</td>
                  <td className="border p-2 text-center">{order.poDate}</td>
                  <td className="border p-2 font-medium">{order.customerName}</td>
                  <td className="border p-2">{order.siteAddress || "--"}</td>
                  <td className="border p-2 text-center capitalize">{order.taxInclude ? "Yes" : "No"}</td>
                  <td className="border p-2 text-center">{order.gstPercent}%</td>
                  <td className="border p-2 text-center">{order.plant}</td>
                  <td className="border p-2 text-right font-bold">₹{order.totalAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="border p-2 text-center uppercase font-bold text-emerald-600">{order.status || "Approved"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
