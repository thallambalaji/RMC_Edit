import { useMemo, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  Plus, 
  MoreHorizontal, 
  Search, 
  RotateCcw, 
  Download, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  PieChart
} from "lucide-react";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
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

  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    (invoices || []).forEach((i) => i.plant && set.add(i.plant));
    return Array.from(set);
  }, [invoices]);

  const handleClear = () => {
    setInvoiceNoFilter("");
    setFromDate("");
    setToDate("");
    setCustomerFilter("all");
    setUnitFilter("all");
    setPage(1);
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
      toast({ title: "Copied to clipboard" });
    } else {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoices.csv";
      a.click();
    }
  };

  const handleToggleBillReceived = (inv: any, next: boolean) => {
    updateInvoice.mutate({ id: inv.id, data: { isBillReceived: next } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this invoice?")) {
      deleteInvoice.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() })
      });
    }
  };

  return (
    <div className="flex h-full gap-4 bg-[#f8fafc]">
      {/* Sidebar with Accordion Navigation */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0">
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

      <div className="flex-1 flex flex-col space-y-3 min-w-0">
        {/* Top Breadcrumb & Actions Row */}
        <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0">
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
            <Filter className="h-3 w-3 mr-1.5" /> {showFilters ? "Filters" : "Filters"}
          </Button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
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
      <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Table Header / Filters Row */}
        {showFilters && (
          <div className="p-3 border-b bg-gray-50/50 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
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
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] h-8 flex-1 text-[11px] font-bold">Search</Button>
              <Button size="sm" variant="outline" onClick={handleClear} className="h-8 w-8 p-0"><RotateCcw className="h-3 w-3" /></Button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="px-4 py-2 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>Show</span>
              <Select value={String(pageSize)} onValueChange={v => {setPageSize(parseInt(v, 10)); setPage(1);}}>
                <SelectTrigger className="w-14 h-7 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold px-3">
                  <Download className="h-3 w-3 mr-1.5" /> Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => handleExport("copy")}>Copy to Clipboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>Download CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>Print View</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white shadow-sm">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="w-[60px] text-[10px] font-bold uppercase text-gray-400 py-2">ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-400">Invoice No</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-400">Customer</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-400">Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-400">Grade</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-right">Quantity</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-right">Amount</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-center">Status</TableHead>
                <TableHead className="w-[80px] text-[10px] font-bold uppercase text-gray-400 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-xs">Loading...</TableCell></TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-xs text-gray-500 font-medium">No records matching your filters</TableCell></TableRow>
              ) : (
                pageRows.map((inv) => (
                  <TableRow key={inv.id} className="group hover:bg-gray-50/80 transition-colors">
                    <TableCell className="py-2"><span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{inv.id}</span></TableCell>
                    <TableCell className="font-bold text-[#1e40af] text-xs py-2">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-xs py-2">
                      <div className="font-semibold text-gray-800">{inv.customerName}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[200px]">{inv.site || "No site specified"}</div>
                    </TableCell>
                    <TableCell className="text-[11px] font-medium py-2">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-GB") : "—"}</TableCell>
                    <TableCell className="py-2"><span className="text-[10px] font-bold border border-[#1e40af]/30 text-[#1e40af] px-1.5 py-0.5 rounded-full">{inv.grade || "—"}</span></TableCell>
                    <TableCell className="text-right font-bold text-xs py-2">{Number(inv.quantity ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-xs py-2">₹{Number(inv.totalAmount).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-center py-2">
                      <Checkbox 
                        checked={!!inv.isBillReceived} 
                        onCheckedChange={v => handleToggleBillReceived(inv, !!v)} 
                        className="h-4 w-4 border-gray-300 data-[state=checked]:bg-[#1e40af] data-[state=checked]:border-[#1e40af]"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={() => setLocation(`/billing/new?duplicate=${inv.id}`)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(inv.id)}>Delete Invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-gray-50/30 flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {totalRows > 0 ? `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, totalRows)} of ${totalRows}` : "No records to show"}
          </p>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(page - 1)} className="h-7 text-[10px] font-bold px-2 uppercase">Prev</Button>
            {Array.from({length: totalPages}, (_, i) => i + 1).filter(p => Math.abs(p - currentPage) < 2 || p === 1 || p === totalPages).map((p, i, arr) => (
              <div key={p} className="flex items-center">
                {i > 0 && arr[i-1] !== p - 1 && <span className="px-1 text-gray-300 text-[10px]">...</span>}
                <Button 
                  size="sm" 
                  variant={p === currentPage ? "default" : "outline"} 
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 p-0 text-[10px] font-bold ${p === currentPage ? "bg-[#1e40af] hover:bg-[#1d4ed8]" : ""}`}
                >
                  {p}
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage(page + 1)} className="h-7 text-[10px] font-bold px-2 uppercase">Next</Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
