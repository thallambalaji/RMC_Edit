import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { 
  Truck, 
  Scale, 
  BarChart3, 
  Plus, 
  Search, 
  RotateCcw, 
  Filter, 
  ChevronRight,
  Printer,
  Download,
  MoreVertical,
  FileText,
  Calendar,
  Loader2,
  Copy,
  Pencil,
  Trash2,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useGetDCs, useGetCustomers, customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function DCHub() {
  const [location, setLocation] = useLocation();

  const linkClass = (href: string) =>
    `text-xs font-medium py-2 px-3 rounded-md transition-all cursor-pointer block border ${
      location === href
        ? "bg-[#1e40af] text-white border-[#1e40af] shadow font-bold"
        : "text-gray-600 hover:text-[#1e40af] hover:bg-white border-transparent hover:border-gray-200 shadow-sm hover:shadow"
    }`;
  const { toast } = useToast();

  const getDefaultAccordions = () => {
    if (location === "/dc" || location === "/dc/") return [];
    if (location.includes("/weighment")) return ["weighment"];
    if (location.includes("/dc")) return ["dc-ops"];
    return [];
  };
  
  // Live API States
  const [dcNo, setDcNo] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customer, setCustomer] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedDC, setSelectedDC] = useState<any>(null);
  const [printDC, setPrintDC] = useState<any>(null);

  const queryClient = useQueryClient();
  const { data: dcs, isLoading: dcsLoading } = useGetDCs();
  const { data: customers } = useGetCustomers();

  const customerMap = useMemo(() => {
    const map: Record<string, any> = {};
    customers?.forEach((c: any) => {
      map[String(c.id || c._id)] = c;
    });
    return map;
  }, [customers]);

  const availableCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.map((c: any) => ({
      id: String(c.id || c._id),
      name: c.name
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [customers]);

  const filteredData = useMemo(() => {
    if (!dcs) return [];
    let filtered = dcs.filter((dc: any) => {
      if (dcNo && !dc.dcNumber?.toLowerCase().includes(dcNo.toLowerCase())) return false;
      if (fromDate) {
        if (new Date(dc.dcDate) < new Date(fromDate)) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (new Date(dc.dcDate) > to) return false;
      }
      const dcCustomerId = String(dc.customerId?._id || dc.customerId);
      if (customer !== "all" && dcCustomerId !== customer) return false;
      return true;
    });
    filtered.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return filtered;
  }, [dcs, dcNo, fromDate, toDate, customer]);

  const handleClear = () => {
    setDcNo("");
    setFromDate("");
    setToDate("");
    setCustomer("all");
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    if (filteredData.length === 0) {
      toast({ title: "No Records Found", description: "No DCs matched filters.", variant: "destructive" });
    }
  };

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePrintSingleDC = (dc: any) => {
    setPrintDC(dc);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleEditDC = (dc: any) => {
    toast({
      title: "Edit restricted",
      description: `Delivery Challan ${dc.dcNumber} is marked as DELIVERED and locked in the ERP system. Please contact your administrator to modify closed invoices.`,
      variant: "destructive"
    });
  };

  const handleCopyRow = (dc: any) => {
    const custName = dc.customerName || customerMap[String(dc.customerId?._id || dc.customerId)]?.name || "-";
    const siteName = dc.siteName || customerMap[String(dc.customerId?._id || dc.customerId)]?.address || "-";
    const text = `DC No: ${dc.dcNumber}\nCustomer: ${custName}\nSite: ${siteName}\nDate: ${dc.dcDate ? new Date(dc.dcDate).toLocaleDateString("en-IN") : "-"}\nQuantity: ${dc.quantity}\nVehicle: ${dc.vehicleReg}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "DC Details copied to clipboard." });
  };

  const handleExportRowCSV = (dc: any) => {
    const custName = dc.customerName || customerMap[String(dc.customerId?._id || dc.customerId)]?.name || "-";
    const siteName = dc.siteName || customerMap[String(dc.customerId?._id || dc.customerId)]?.address || "-";
    const csvContent = `DC No,Customer,Site,Date,Quantity,Vehicle\n"${dc.dcNumber}","${custName}","${siteName}","${dc.dcDate ? new Date(dc.dcDate).toLocaleDateString("en-IN") : "-"}","${dc.quantity}","${dc.vehicleReg}"`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `dc_${dc.dcNumber?.replace(/\//g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this DC?")) return;
    try {
      await customFetch(`/api/delivery-challans/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Delivery Challan deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["getDeliveryChallans"] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete DC", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    const headers = ["DC No", "Customer", "Site", "Date", "Quantity", "Vehicle"];
    const rows = filteredData.map((d: any) => {
      const cust = d.customerName || customerMap[String(d.customerId?._id || d.customerId)]?.name || "-";
      const site = d.siteName || customerMap[String(d.customerId?._id || d.customerId)]?.address || "-";
      return [ `"${d.dcNumber}"`, `"${cust}"`, `"${site}"`, `"${d.dcDate ? new Date(d.dcDate).toLocaleDateString("en-IN") : "-"}"`, `"${d.quantity}"`, `"${d.vehicleReg}"` ];
    });
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `dc_hub_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!filteredData.length) {
      toast({ title: "No data to copy", variant: "destructive" });
      return;
    }
    const headers = ["DC No", "Customer", "Site", "Date", "Quantity", "Vehicle"];
    const rows = filteredData.map((d: any) => {
      const cust = d.customerName || customerMap[String(d.customerId?._id || d.customerId)]?.name || "-";
      const site = d.siteName || customerMap[String(d.customerId?._id || d.customerId)]?.address || "-";
      return [
        d.dcNumber,
        cust,
        site,
        d.dcDate ? new Date(d.dcDate).toLocaleDateString("en-IN") : "-",
        d.quantity,
        d.vehicleReg
      ];
    });
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Complete data saved to clipboard." });
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] gap-4 bg-white">
      {/* Sidebar with Accordion Navigation */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-bold text-gray-800 text-sm">DC Navigation</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <Accordion type="multiple" defaultValue={[]} className="w-full space-y-2">
            <AccordionItem value="dc-ops" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-[#1e40af]"/> DC Operations</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/dc/list"><div className={linkClass("/dc/list")}>DC List</div></Link>
                  <Link href="/dc/report"><div className={linkClass("/dc/report")}>DC Report</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="weighment" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Scale className="h-4 w-4 text-cyan-600"/> Weighment</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/dc/weighment/new"><div className={linkClass("/dc/weighment/new")}>Add Weighment</div></Link>
                  <Link href="/dc/weighment/list"><div className={linkClass("/dc/weighment/list")}>Weighment List</div></Link>
                  <Link href="/dc/weighment/tickets"><div className={linkClass("/dc/weighment/tickets")}>Weighment Tickets</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col space-y-3 min-w-0 ${printDC ? "print:hidden" : ""}`}>
        {/* Header / Breadcrumb */}
        <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 no-print">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">DC List</h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
              <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <Link href="/dc" className="hover:text-[#1e40af] transition-colors">DC</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <span className="text-[#1e40af]">Delivery Challan</span>
            </nav>
          </div>
          <div className="flex gap-2">
            <Link href="/dc/new">
              <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer rounded">
                <Plus className="h-3.5 w-3.5" /> Add DC
              </Button>
            </Link>
            <Button 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className={`font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border flex items-center gap-1.5 cursor-pointer rounded ${
                showFilters ? "bg-slate-100 border-slate-400 text-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-3 w-3" /> Filters
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 grid grid-cols-1 md:grid-cols-5 gap-3 items-end transition-all print:hidden">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-tighter text-gray-600">DC No</Label>
              <Input placeholder="Search DC..." className="h-7 text-[10px] border-gray-200 font-bold px-2 bg-white" value={dcNo} onChange={e => setDcNo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-tighter text-gray-600">From Date</Label>
              <div className="relative">
                <Input type="date" className="h-7 text-[10px] border-gray-200 font-bold px-2 bg-white" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-tighter text-gray-600">To Date</Label>
              <div className="relative">
                <Input type="date" className="h-7 text-[10px] border-gray-200 font-bold px-2 bg-white" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-tighter text-gray-600">Customer</Label>
              <Select value={customer} onValueChange={setCustomer}>
                <SelectTrigger className="h-7 text-[10px] border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {availableCustomers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] h-7 flex-1 text-[10px] font-bold" onClick={handleSearch}><Search className="h-3 w-3 mr-1" />Search</Button>
              <Button size="sm" variant="outline" onClick={handleClear} className="h-7 w-7 p-0 bg-rose-500 hover:bg-rose-600 text-white border-0"><RotateCcw className="h-3 w-3" /></Button>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden print:border-none print:shadow-none">
          
          {/* Printable Header (Only visible during print) */}
          <div className="hidden print:block mb-6">
            <PrintHeader />
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#1e40af]">DC Hub List</h2>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-600">Printed Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="px-4 py-2 border-b flex items-center justify-between bg-gray-50/30 print:hidden">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={v => setPageSize(parseInt(v, 10))}>
                  <SelectTrigger className="w-14 h-7 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ExportDropdown onCopy={handleCopy} onCSV={handleExportCSV} onPDF={handlePrint} />
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-auto print:overflow-visible">
            <Table className="print:text-[10px]">
              <TableHeader className="sticky top-0 z-10 bg-[#1e40af] print:shadow-none">
                <TableRow className="hover:bg-transparent border-0 bg-[#1e40af] print:border-gray-800 print:border-b-2">
                  <TableHead className="w-[100px] bg-[#1e40af] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center print:text-black">DC No</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-left print:text-black">Customer & Site</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center print:text-black">Date</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center print:text-black">Grade</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-right print:text-black">Quantity</TableHead>
                  <TableHead className="bg-[#1e40af] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center print:text-black">Vehicle</TableHead>
                  <TableHead className="w-[80px] bg-[#1e40af] text-white font-black text-[9px] py-1.5 px-3 text-center uppercase tracking-tighter last:border-0 print:hidden">OPTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dcsLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></TableCell></TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">No Delivery Challans found.</TableCell></TableRow>
                ) : (
                  (document.body.classList.contains("print-mode") ? filteredData : paginatedData).map((row: any) => {
                    const custName = row.customerName || customerMap[String(row.customerId?._id || row.customerId)]?.name || "-";
                    const siteName = row.siteName || customerMap[String(row.customerId?._id || row.customerId)]?.address || "-";
                    return (
                      <TableRow key={row.id || row._id} className="group hover:bg-gray-50/80 transition-colors print:border-b print:border-gray-200">
                        <TableCell 
                          onClick={() => setSelectedDC(row)} 
                          className="text-center py-3 font-bold text-[#1e40af] text-xs print:text-black cursor-pointer hover:underline"
                          title="Click to view details"
                        >
                          {row.dcNumber}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-xs font-semibold text-gray-800 max-w-[200px] truncate print:whitespace-normal print:max-w-none">{custName}</div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[200px] print:whitespace-normal print:max-w-none print:text-black">{siteName}</div>
                        </TableCell>
                        <TableCell className="text-center text-[11px] font-medium py-3 text-gray-600 print:text-black">
                          {row.dcDate ? new Date(row.dcDate).toLocaleDateString("en-IN") : "-"}
                          <div className="text-[10px] opacity-50 print:opacity-100">{row.dcTime || "-"}</div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <span className="text-[10px] font-bold border border-[#1e40af]/30 text-[#1e40af] px-1.5 py-0.5 rounded-full print:border-none print:text-black print:p-0">{row.grade}</span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs py-3 print:text-black">{Number(row.quantity || 0).toFixed(2)} <span className="text-[9px] font-normal text-gray-400 ml-0.5 print:text-black">m³</span></TableCell>
                        <TableCell className="text-center py-3 font-medium text-[11px] text-gray-700 print:text-black">{row.vehicleReg}</TableCell>
                        <TableCell className="text-center py-2 print:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full cursor-pointer flex items-center justify-center mx-auto">
                                <MoreVertical className="h-4 w-4 text-slate-500" />
                                <span className="sr-only">Open options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs bg-white border border-slate-200 shadow-lg rounded-md p-1 z-50">
                              <DropdownMenuItem onClick={() => setSelectedDC(row)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintSingleDC(row)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">Print DC Slip</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportRowCSV(row)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">Download CSV</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyRow(row)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">Copy Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditDC(row)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">Edit Record</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(row.id || row._id)} className="gap-2 cursor-pointer hover:bg-red-50 p-2 rounded text-red-600 focus:text-red-600 focus:bg-red-50">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-gray-50/30 flex items-center justify-between print:hidden">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
            </p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="h-7 text-[10px] font-bold px-2 uppercase">Prev</Button>
              <Button size="sm" className="h-7 w-7 p-0 text-[10px] font-bold bg-[#1e40af] hover:bg-[#1d4ed8] text-white">{currentPage}</Button>
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="h-7 text-[10px] font-bold px-2 uppercase">Next</Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedDC} onOpenChange={(open) => !open && setSelectedDC(null)}>
        <DialogContent className="max-w-xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl border-b border-slate-100 pb-2">DC Hub View Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100 mt-2">
            <div className="space-y-3">
              <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">DC Number:</span> <div className="font-medium text-slate-800">{selectedDC?.dcNumber}</div></div>
              <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Date & Time:</span> <div className="font-medium text-slate-800">{selectedDC?.dcDate ? new Date(selectedDC.dcDate).toLocaleDateString("en-IN") : "-"} {selectedDC?.dcTime || ""}</div></div>
              <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Customer:</span> <div className="font-medium text-slate-800">{selectedDC?.customerName || customerMap[String(selectedDC?.customerId?._id || selectedDC?.customerId)]?.name || "-"}</div></div>
              <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Site:</span> <div className="font-medium text-slate-800">{selectedDC?.siteName || customerMap[String(selectedDC?.customerId?._id || selectedDC?.customerId)]?.address || "-"}</div></div>
            </div>
            <div className="space-y-3">
              <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Vehicle No:</span> <div className="font-medium text-slate-800">{selectedDC?.vehicleReg || "-"}</div></div>
              <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Grade & Qty:</span> <div className="font-medium text-slate-800">{selectedDC?.grade} - {selectedDC?.quantity} m³</div></div>
              <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Rate & Amount:</span> <div className="font-medium text-slate-800">₹{selectedDC?.rate || 0} (Net: ₹{Number(selectedDC?.netAmount || 0).toLocaleString("en-IN")})</div></div>
              <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Plant:</span> <div className="font-medium text-slate-800">{selectedDC?.plant || "-"}</div></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branded Single DC Sheet for Printing */}
      {printDC && (
        <div className="hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#1e40af]">Delivery Challan Identity Details</h2>
            <div className="text-right">
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 font-black text-[9px] uppercase tracking-wider border rounded font-sans">DELIVERY CHALLAN</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Challan Details</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">DC Number: <span className="font-black text-gray-900">{printDC.dcNumber}</span></p>
                <p className="text-xs font-bold text-gray-700">DC Date: <span className="font-medium text-gray-900">{printDC.dcDate ? new Date(printDC.dcDate).toLocaleDateString("en-IN") : "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">DC Time: <span className="font-medium text-gray-900">{printDC.dcTime || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Loaded Plant: <span className="font-medium text-gray-900">{printDC.plant || "-"}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Customer & Vehicle</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Customer: <span className="font-black text-gray-900">{printDC.customerName || customerMap[String(printDC.customerId?._id || printDC.customerId)]?.name || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Site Address: <span className="font-medium text-gray-900">{printDC.siteName || customerMap[String(printDC.customerId?._id || printDC.customerId)]?.address || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Vehicle: <span className="font-medium text-gray-900">{printDC.vehicleReg || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Driver Name: <span className="font-medium text-gray-900">{printDC.driverName || "-"}</span></p>
              </div>
            </div>
          </div>

          <table className="w-full border collapse text-left mb-6">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider">
                <th className="border p-2 text-center w-12">S/No</th>
                <th className="border p-2">Grade Type</th>
                <th className="border p-2 text-center">Quantity (m³)</th>
                <th className="border p-2 text-right">Unit Rate (₹)</th>
                <th className="border p-2 text-right">Net Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-xs">
                <td className="border p-2 text-center font-bold">1</td>
                <td className="border p-2 font-semibold text-gray-800">{printDC.grade || "-"}</td>
                <td className="border p-2 text-center font-medium">{Number(printDC.quantity || 0).toFixed(2)}</td>
                <td className="border p-2 text-right font-medium">₹{Number(printDC.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="border p-2 text-right font-bold text-[#1e40af]">₹{Number(printDC.netAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-12 pt-8 border-t flex justify-between items-end">
            <div>
              <p className="text-[9px] text-gray-400">Received above material in good condition. Subject to local jurisdiction.</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Receiver Signature</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-[#1e40af] tracking-wider">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
