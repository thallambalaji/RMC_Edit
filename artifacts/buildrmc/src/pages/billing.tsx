import { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetInvoices,
  useGetCustomers,
  useUpdateInvoice,
  useDeleteInvoice,
  getGetInvoicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  Plus, 
  Search, 
  RotateCcw, 
  Download, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  PieChart,
  Printer,
  X,
  Copy,
  FileText,
  Pencil,
  Trash2
} from "lucide-react";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function Billing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: invoices, isLoading } = useGetInvoices({
    query: { queryKey: getGetInvoicesQueryKey() },
  });
  const { data: customers } = useGetCustomers();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();

  const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [viewInv, setViewInv] = useState<any | null>(null);

  // Reset viewInv after printing
  useEffect(() => {
    const handleAfterPrint = () => setViewInv(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handleRowPrint = (inv: any) => {
    setViewInv(inv);
    setTimeout(() => {
      const prev = document.title;
      document.title = `Invoice_${inv.invoiceNumber} - BuildRMC`;
      window.print();
      setTimeout(() => { document.title = prev; }, 1000);
    }, 150);
  };

  // KPI calculations
  const kpis = useMemo(() => {
    const list = invoices || [];
    const today = startOfDay(new Date());
    let todayQ = 0, monthQ = 0, pendingCount = 0;
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    for (const inv of list) {
      const d = new Date(inv.invoiceDate);
      const q = inv.quantity ?? 0;
      if (startOfDay(d).getTime() === today.getTime()) todayQ += q;
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) monthQ += q;
      if (!inv.isBillReceived) pendingCount += 1;
    }
    return { todayQ, monthQ, pendingCount, total: list.length };
  }, [invoices]);

  const filtered = useMemo(() => {
    const list = invoices || [];
    return list.filter((inv) => {
      if (invoiceNoFilter && !inv.invoiceNumber.toLowerCase().includes(invoiceNoFilter.toLowerCase())) return false;
      if (fromDate && inv.invoiceDate < fromDate) return false;
      if (toDate && inv.invoiceDate > toDate) return false;
      if (customerFilter !== "all" && String(inv.customerId) !== customerFilter) return false;
      if (unitFilter !== "all" && (inv.plant || "") !== unitFilter) return false;
      return true;
    }).sort((a, b) => b.id - a.id);
  }, [invoices, invoiceNoFilter, fromDate, toDate, customerFilter, unitFilter]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  const handleClear = () => {
    setInvoiceNoFilter("");
    setFromDate("");
    setToDate("");
    setCustomerFilter("all");
    setUnitFilter("all");
    setPage(1);
    toast({ title: "Filters Cleared", description: "Showing all records." });
  };

  const handleSearchSubmit = () => {
    if (invoiceNoFilter && filtered.length === 0) {
      toast({
        title: "No Invoice Found",
        description: "No records found matching this Invoice No. Please check and enter the invoice number correctly.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Search Results Updated",
        description: `Found ${filtered.length} invoice records matching your filters.`
      });
    }
  };

  const handleExport = (type: "csv" | "copy") => {
    const headers = ["ID", "Invoice No", "Customer", "Date", "Grade", "Qty", "Vehicle", "Amount"];
    const rows = filtered.map(inv => [
      inv.id, inv.invoiceNumber, inv.customerName, inv.invoiceDate, 
      inv.grade, inv.quantity, inv.vehicleNo, inv.totalAmount
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    
    if (type === "copy") {
      navigator.clipboard.writeText(csv);
      toast({ title: "Copied!", description: "Invoices exported to clipboard." });
    } else {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices_${Date.now()}.csv`;
      a.click();
      toast({ title: "Downloaded", description: "Invoices CSV saved successfully." });
    }
  };

  const handleToggleBillReceived = (inv: any, next: boolean) => {
    updateInvoice.mutate({ id: inv.id, data: { isBillReceived: next } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() })
    });
  };

  const handleDelete = (id: any) => {
    if (confirm("Are you sure you want to permanently delete this invoice?")) {
      deleteInvoice.mutate({ id: Number(id) } as any, {
        onSuccess: () => {
          toast({ title: "Invoice Deleted", description: "The invoice record was deleted from the database." });
          queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleCopySingle = (inv: any) => {
    if (!inv) return;
    const text = `Invoice No: ${inv.invoiceNumber}
Date: ${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}
Customer: ${inv.customerName}
Site: ${inv.site || "—"}
Grade: ${inv.grade || "—"}
Qty: ${Number(inv.quantity ?? 0).toFixed(2)} m³
Amount: ₹${Number(inv.totalAmount).toLocaleString("en-IN", {minimumFractionDigits: 2})}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Invoice details copied to clipboard." });
  };

  const handleCSVSingle = (inv: any) => {
    if (!inv) return;
    const headers = ["Invoice No", "Date", "Customer", "Site", "Grade", "Qty", "Amount"];
    const row = [
      inv.invoiceNumber,
      inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—",
      inv.customerName,
      inv.site || "—",
      inv.grade || "—",
      Number(inv.quantity ?? 0).toFixed(2),
      inv.totalAmount
    ];
    const csv = [headers, row].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_${inv.invoiceNumber}.csv`;
    a.click();
    toast({ title: "Downloaded", description: "Invoice CSV downloaded." });
  };

  return (
    <>
      <style>{`
        @page {
          size: A4 landscape;
          margin: 12mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print, [class*="no-print"] {
            display: none !important;
          }
          ${
            viewInv 
              ? `
                .main-screen {
                  display: none !important;
                }
                #print-root {
                  display: block !important;
                  width: 100% !important;
                }
              `
              : `
                .main-screen {
                  display: block !important;
                  width: 100% !important;
                  background: white !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                #print-root {
                  display: none !important;
                }
                /* Hide sidebar, breadcrumbs, metrics bar, and filter toolbar in list printing */
                .w-64, nav, button, .sidebar, [role="button"], [class*="no-print"], .no-print {
                  display: none !important;
                }
              `
          }
        }
      `}</style>


      {/* Main Screen Layout */}
      <div className="flex h-full gap-4 bg-[#f8fafc] main-screen">

      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-bold text-gray-800 text-sm">Billing Navigation</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div className="mb-3 px-1 mt-1">
            <Link href="/billing/new">
              <Button className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] h-9 text-xs font-bold shadow-sm rounded-lg">
                <Plus className="h-4 w-4 mr-2" /> Add Invoice
              </Button>
            </Link>
          </div>
          <Accordion type="multiple" className="w-full space-y-2">
            <AccordionItem value="sales-invoice" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-[#1e40af]"/> Sales Invoice</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/billing/sales-document/new"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Add Sales Document</div></Link>
                  <Link href="/billing/sales-document"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Sales Document List</div></Link>
                  <Link href="/billing/sales-document-report"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Sales Document Report</div></Link>
                  <Link href="/billing/consolidate-sales-document-list"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Consolidate Sales Document List</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rmc-report" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><PieChart className="h-4 w-4 text-cyan-600"/> RMC Report</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/billing/invoice-report"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Invoice Report</div></Link>
                  <Link href="/billing/consolidate-invoice-list"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Consolidate Invoice List</div></Link>
                  <Link href="/billing/generate-annexure"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Generate Annexure</div></Link>
                  <Link href="/billing/debit-credit-note-list"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Debit Credit Note List</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-3 min-w-0 print-container">
        
        {/* Printable Business Header */}
        <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#1e40af] text-white flex items-center justify-center font-black text-2xl rounded-lg">
                BM
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">BuildRMC Enterprises</h1>
                <p className="text-sm text-gray-600 font-medium">123 Industrial Estate, Hyderabad, Telangana 500001</p>
                <p className="text-sm text-gray-600 font-medium">Phone: +91 98765 43210 | Email: contact@buildrmc.com</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-[#1e40af] uppercase">Billing & Tax Invoice List</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Generated: {new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Top Breadcrumb & Actions Row */}
        <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 no-print">
          <div className="flex items-center gap-3">
            <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Invoice List</h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
              <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <Link href="/billing" className="hover:text-[#1e40af] transition-colors">Billing</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <span className="text-[#1e40af]">Invoice List</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className={`h-8 text-[11px] font-bold ${showFilters ? "bg-gray-100" : ""}`}
            >
              <Filter className="h-3 w-3 mr-1.5" /> Filters
            </Button>
          </div>
        </div>

        {/* Mini Stats Bar */}
        <div className="grid grid-cols-4 gap-3 no-print">
          <div className="bg-white border rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-blue-50 rounded-full"><Clock className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Today Qty</p>
              <p className="text-sm font-bold text-gray-800">{kpis.todayQ.toFixed(2)} <span className="text-[10px] font-normal opacity-60">m³</span></p>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-teal-50 rounded-full"><CheckCircle2 className="h-4 w-4 text-teal-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Month Qty</p>
              <p className="text-sm font-bold text-gray-800">{kpis.monthQ.toFixed(2)} <span className="text-[10px] font-normal opacity-60">m³</span></p>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-amber-50 rounded-full"><AlertCircle className="h-4 w-4 text-amber-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Pending Bills</p>
              <p className="text-sm font-bold text-gray-800">{kpis.pendingCount} <span className="text-[10px] font-normal opacity-60">items</span></p>
            </div>
          </div>
          <div className="bg-[#1e40af] rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-white/20 rounded-full"><Search className="h-4 w-4 text-white" /></div>
            <div>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-tight">Total Records</p>
              <p className="text-sm font-bold text-white">{kpis.total}</p>
            </div>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden print:border-none print:shadow-none">
          
          {/* Table Header / Filters Row */}
          {showFilters && (
            <div className="p-3 border-b bg-gray-50/50 grid grid-cols-1 md:grid-cols-5 gap-3 items-end no-print">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Invoice No</Label>
                <Input 
                  placeholder="Search Inv..." 
                  className="h-8 text-xs" 
                  value={invoiceNoFilter} 
                  onChange={e => {setInvoiceNoFilter(e.target.value); setPage(1);}}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">From Date</Label>
                <Input type="date" className="h-8 text-xs" value={fromDate} onChange={e => {setFromDate(e.target.value); setPage(1);}} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">To Date</Label>
                <Input type="date" className="h-8 text-xs" value={toDate} onChange={e => {setToDate(e.target.value); setPage(1);}} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">Customer</Label>
                <Select value={customerFilter} onValueChange={v => {setCustomerFilter(v); setPage(1);}}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers?.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearchSubmit} size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] h-8 flex-1 text-[11px] font-bold uppercase tracking-wider">Search</Button>
                <Button size="sm" variant="outline" onClick={handleClear} className="h-8 w-8 p-0 border-gray-200"><RotateCcw className="h-3 w-3" /></Button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="px-4 py-2 border-b flex items-center justify-between bg-white no-print">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={v => {setPageSize(parseInt(v, 10)); setPage(1);}}>
                  <SelectTrigger className="w-14 h-7 text-[11px] border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs">
                    {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold px-3 border-gray-200 gap-1.5 uppercase tracking-wider text-slate-600">
                    <Download className="h-3.5 w-3.5 text-[#1e40af]" /> Export Data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem onClick={() => handleExport("copy")}>Copy to Clipboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>Download CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.print()} className="gap-2 font-semibold">
                    <Printer className="h-3.5 w-3.5 text-rose-500" /> Print / PDF View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-auto print:overflow-visible">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50 border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[60px] text-[10px] font-bold uppercase text-slate-800 py-3 text-center">ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-800">Invoice No</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-800">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-800">Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-800 text-center">Grade</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-800 text-right">Quantity (m³)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-800 text-right">Amount (₹)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-slate-800 text-center">Status</TableHead>
                  <TableHead className="w-[80px] text-[10px] font-bold uppercase text-slate-800 text-center no-print">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-10 text-xs text-slate-400 font-medium animate-pulse">Loading invoices...</TableCell></TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-10 text-xs text-slate-400 font-bold">No records matching your filters</TableCell></TableRow>
                ) : (
                  pageRows.map((inv) => (
                    <TableRow key={inv.id} className="group hover:bg-slate-50/50 transition-colors border-b">
                      <TableCell className="py-2.5 text-center"><span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{inv.id}</span></TableCell>
                      <TableCell className="font-extrabold text-[#1e40af] text-xs py-2.5">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-xs py-2.5">
                        <div className="font-black text-slate-800">{inv.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate max-w-[200px] mt-0.5">{inv.site || "No site specified"}</div>
                      </TableCell>
                      <TableCell className="text-[11px] font-semibold text-slate-600 py-2.5">
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN", {day: '2-digit', month: '2-digit', year: 'numeric'}) : "—"}
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-[10px] font-black border border-[#1e40af]/20 bg-blue-50/50 text-[#1e40af] px-2 py-0.5 rounded-full">
                          {inv.grade || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-slate-700 py-2.5">{Number(inv.quantity ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-extrabold text-xs text-slate-800 py-2.5">
                        ₹{Number(inv.totalAmount).toLocaleString("en-IN", {minimumFractionDigits: 2})}
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <div className="no-print flex justify-center">
                          <Checkbox 
                            checked={!!inv.isBillReceived} 
                            onCheckedChange={v => handleToggleBillReceived(inv, !!v)} 
                            className="h-4 w-4 border-gray-300 data-[state=checked]:bg-[#1e40af] data-[state=checked]:border-[#1e40af] shadow-sm rounded animate-none"
                          />
                        </div>
                        <div className="hidden print:block text-center text-[10px] font-bold">
                          <span style={{ color: inv.isBillReceived ? "#059669" : "#e11d48", fontWeight: "900" }}>
                            {inv.isBillReceived ? "Received" : "Pending"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2.5 no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Print (Printer Icon) */}
                          <Button 
                            onClick={() => handleRowPrint(inv)}
                            title="Print PDF" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          {/* 2. CSV (Download Icon) */}
                          <Button 
                            onClick={() => handleCSVSingle(inv)}
                            title="Download CSV" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          {/* 3. Copy (Copy Icon) */}
                          <Button 
                            onClick={() => handleCopySingle(inv)}
                            title="Copy Details" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 cursor-pointer"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          {/* 4. Edit (Pencil Icon) - opens view details modal */}
                          <Button 
                            onClick={() => setViewInv(inv)}
                            title="Edit Invoice" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* 5. Delete (Trash Icon) */}
                          <Button 
                            onClick={() => handleDelete(inv.id)}
                            title="Delete Invoice" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-rose-50 text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer Pagination */}
          <div className="px-4 py-2.5 border-t bg-slate-50/50 flex items-center justify-between no-print">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {totalRows > 0 ? `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, totalRows)} of ${totalRows}` : "No records to show"}
            </p>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(page - 1)} className="h-7 text-[10px] font-bold px-2.5 uppercase border-gray-200">Prev</Button>
              {Array.from({length: totalPages}, (_, i) => i + 1).filter(p => Math.abs(p - currentPage) < 2 || p === 1 || p === totalPages).map((p, i, arr) => (
                <div key={p} className="flex items-center">
                  {i > 0 && arr[i-1] !== p - 1 && <span className="px-1 text-gray-300 text-[10px]">...</span>}
                  <Button 
                    size="sm" 
                    variant={p === currentPage ? "default" : "outline"} 
                    onClick={() => setPage(p)}
                    className={`h-7 w-7 p-0 text-[10px] font-extrabold ${p === currentPage ? "bg-[#1e40af] hover:bg-[#1d4ed8] text-white" : "border-gray-200 text-slate-600"}`}
                  >
                    {p}
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage(page + 1)} className="h-7 text-[10px] font-bold px-2.5 uppercase border-gray-200">Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* View Details Modal - Screen Only */}
      <Dialog open={!!viewInv} onOpenChange={() => setViewInv(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-5 border-b bg-[#1e40af] rounded-t-lg flex flex-row items-center justify-between no-print">
            <div>
              <DialogTitle className="text-white font-black text-base">Invoice Details</DialogTitle>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">{viewInv?.invoiceNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleCopySingle(viewInv)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleCSVSingle(viewInv)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                <FileText className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRowPrint(viewInv)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                <Printer className="h-3.5 w-3.5" /> Print / PDF
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setViewInv(null)} className="text-white hover:bg-white/10 h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {viewInv && (
            <div className="p-6 space-y-5">
              {/* Company Header */}
              <div className="flex items-center gap-4 border-b-2 border-[#1e40af] pb-5">
                <div className="w-14 h-14 bg-[#1e40af] text-white flex items-center justify-center font-black text-xl rounded-xl">BM</div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">BuildRMC Enterprises</h1>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">123 Industrial Estate, Phase-1, Hyderabad, Telangana 500001</p>
                  <p className="text-xs text-slate-600">GSTIN: 36AAAAA1111A1Z1 | +91 98765 43210</p>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-base font-extrabold uppercase text-[#1e40af] tracking-wide border-b pb-2">Invoice Information</h2>

              {/* Grid info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-3.5 rounded-xl bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Invoice Number</p>
                  <p className="text-sm font-black text-slate-800">{viewInv.invoiceNumber}</p>
                </div>
                <div className="border p-3.5 rounded-xl bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Invoice Date</p>
                  <p className="text-sm font-bold text-slate-800">
                    {viewInv.invoiceDate ? new Date(viewInv.invoiceDate).toLocaleDateString("en-IN", {day: '2-digit', month: '2-digit', year: 'numeric'}) : "—"}
                  </p>
                </div>
              </div>

              {/* Customer & Site */}
              <div className="border rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Customer Name</p>
                  <p className="text-sm font-black text-[#1e40af]">{viewInv.customerName}</p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Site / Delivery Address</p>
                  <p className="text-xs font-semibold text-slate-700">{viewInv.site || "—"}</p>
                </div>
              </div>

              {/* Details table */}
              <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-2.5 font-black text-slate-600 text-[10px] uppercase border-r border-slate-200">Item Grade</th>
                    <th className="p-2.5 font-black text-slate-600 text-[10px] uppercase border-r border-slate-200 text-right">Quantity (M³)</th>
                    <th className="p-2.5 font-black text-slate-600 text-[10px] uppercase text-right">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 text-xs border-r border-slate-200 font-extrabold text-slate-800">{viewInv.grade || "—"}</td>
                    <td className="p-3 text-xs border-r border-slate-200 font-bold text-right text-slate-700">{Number(viewInv.quantity ?? 0).toFixed(2)}</td>
                    <td className="p-3 text-xs font-black text-right text-[#1e40af]">₹{Number(viewInv.totalAmount).toLocaleString("en-IN", {minimumFractionDigits: 2})}</td>
                  </tr>
                </tbody>
              </table>

              {/* Bottom message */}
              <div className="text-center text-[10px] text-slate-400 border-t pt-4 font-medium">
                This is a computer generated document and requires no signature.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== PRINT AREA ===== */}
      <div id="print-root" style={{ display: "none" }}>
        {viewInv && (
          <div style={{ padding: "30px", background: "white", color: "black", fontFamily: "system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{ borderBottom: "2px solid #1e40af", paddingBottom: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "56px", height: "56px", background: "#1e40af", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "20px", borderRadius: "8px" }}>BM</div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", textTransform: "uppercase" }}>BuildRMC Enterprises</div>
                  <div style={{ fontSize: "11px", color: "#475569" }}>123 Industrial Estate, Phase-1, Hyderabad, Telangana 500001</div>
                  <div style={{ fontSize: "11px", color: "#475569" }}>GSTIN: 36AAAAA1111A1Z1 | +91 98765 43210</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase" }}>Sales Invoice</div>
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>Date: {viewInv.invoiceDate ? new Date(viewInv.invoiceDate).toLocaleDateString("en-IN") : "—"}</div>
              </div>
            </div>

            <h2 style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", color: "#1e40af", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "14px" }}>Invoice Details</h2>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "24px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, width: "30%", textAlign: "left" }}>Invoice Number</th>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{viewInv.invoiceNumber}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Invoice Date</th>
                  <td style={{ padding: "10px" }}>{viewInv.invoiceDate ? new Date(viewInv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Customer Name</th>
                  <td style={{ padding: "10px", fontWeight: 700, color: "#0f172a" }}>{viewInv.customerName}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Site Address</th>
                  <td style={{ padding: "10px" }}>{viewInv.site || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Item Grade</th>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{viewInv.grade || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Quantity (M³)</th>
                  <td style={{ padding: "10px" }}>{Number(viewInv.quantity ?? 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Total Amount</th>
                  <td style={{ padding: "10px", fontWeight: 900, fontSize: "16px", color: "#1e40af" }}>₹{Number(viewInv.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: "40px", textAlign: "center", fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
              This is a computer generated document and requires no signature.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
