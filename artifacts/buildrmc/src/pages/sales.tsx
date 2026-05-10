import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useGetSalesOrders,
  useGetCustomers,
} from "@workspace/api-client-react";
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
  ShoppingCart,
  ClipboardList,
  Wallet,
  Settings,
  TrendingUp,
  Users,
  CheckCircle2
} from "lucide-react";
import { parse, startOfDay, isValid } from "date-fns";

// Local interface to match the actual database model (ISalesOrder in Others.ts)
// as the generated types are currently out of sync.
interface ISalesOrderItem {
  grade: string;
  quantity: number;
  rate: number;
  remainingQty: number;
}

interface ISalesOrder {
  id: number;
  poNumber: string;
  poDate: string;
  customerId: string;
  customerName: string;
  items: ISalesOrderItem[];
  siteAddress?: string;
  status: string;
}

export default function Sales() {
  const { toast } = useToast();
  const { data, isLoading } = useGetSalesOrders();
  
  // Explicitly cast to the correct interface
  const orders = (data as any) as ISalesOrder[] || [];
  const { data: customers } = useGetCustomers();

  const [poFilter, setPoFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  // KPI calculations
  const kpis = useMemo(() => {
    let totalQty = 0;
    let pendingQty = 0;
    
    orders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          totalQty += Number(item.quantity || 0);
          pendingQty += Number(item.remainingQty || 0);
        });
      }
    });
    
    return { 
      totalOrders: orders.length,
      totalQty,
      pendingQty,
      activeCustomers: new Set(orders.map(o => o.customerId)).size
    };
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (poFilter && !order.poNumber.toLowerCase().includes(poFilter.toLowerCase())) return false;
      
      if (fromDate || toDate) {
        try {
          const orderDate = parse(order.poDate, 'dd/MM/yyyy', new Date());
          if (isValid(orderDate)) {
            const orderTime = startOfDay(orderDate).getTime();
            if (fromDate && orderTime < startOfDay(new Date(fromDate)).getTime()) return false;
            if (toDate && orderTime > startOfDay(new Date(toDate)).getTime()) return false;
          }
        } catch (e) {
          // If parsing fails, skip date filtering for this record
        }
      }

      if (customerFilter !== "all" && String(order.customerId) !== customerFilter) return false;
      return true;
    }).sort((a, b) => b.id - a.id);
  }, [orders, poFilter, fromDate, toDate, customerFilter]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  const handleClear = () => {
    setPoFilter("");
    setFromDate("");
    setToDate("");
    setCustomerFilter("all");
    setPage(1);
  };

  const handleExport = (type: "csv" | "copy") => {
    const headers = ["ID", "PO Number", "Customer", "Date", "Items Count", "Status"];
    const rows = filtered.map(o => [
      o.id, o.poNumber, o.customerName, o.poDate, o.items?.length || 0, o.status || "Active"
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
      a.download = "sales_orders.csv";
      a.click();
    }
  };

  return (
    <div className="flex h-full gap-4 bg-[#f8fafc]">
      {/* Sidebar with Accordion Navigation */}
      <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-bold text-gray-800 text-sm">Sales Navigation</h3>
        </div>
        <div className="flex-1 overflow-auto p-2">
          <div className="mb-3 px-1 mt-1">
            <Link href="/customer-po/sales-order/new">
              <Button className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] h-9 text-xs font-bold shadow-sm rounded-lg">
                <Plus className="h-4 w-4 mr-2" /> New Sales Order
              </Button>
            </Link>
          </div>
          <Accordion type="multiple" className="w-full space-y-2">
            <AccordionItem value="sales-enquiry" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#1e40af]"/> Sales Enquiry</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/sales/enquiry/new"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Add Enquiry</div></Link>
                  <Link href="/sales/enquiry/list"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Enquiry List</div></Link>
                  <Link href="/sales/enquiry"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Enquiry Hub</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="payment-followup" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-amber-500"/> Payment Follow Up</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/sales/payment-follow-up/new"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Add Payment Follow Up</div></Link>
                  <Link href="/sales/payment-follow-up/list"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Payment Follow Up List</div></Link>
                  <Link href="/sales/payment-follow-up"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Follow Up Hub</div></Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sales-settings" className="border-none border rounded-lg bg-white shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                <div className="flex items-center gap-2"><Settings className="h-4 w-4 text-gray-600"/> Sales Settings</div>
              </AccordionTrigger>
              <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                <div className="flex flex-col space-y-1 mt-2 px-2">
                  <Link href="/sales/settings/master"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Sales Master</div></Link>
                  <Link href="/sales/settings"><div className="text-xs font-medium text-gray-600 hover:text-[#1e40af] hover:bg-white border border-transparent hover:border-gray-200 py-2 px-3 rounded-md transition-all cursor-pointer shadow-sm hover:shadow">Settings Hub</div></Link>
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
            <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Sales Dashboard</h2>
            <div className="h-4 w-px bg-gray-300" />
            <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
              <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <Link href="/sales" className="hover:text-[#1e40af] transition-colors">Sales</Link>
              <ChevronRight className="h-2.5 w-2.5" />
              <span className="text-[#1e40af]">Sales Orders</span>
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
            <div className="p-2 bg-blue-50 rounded-full"><ShoppingCart className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Total Orders</p>
              <p className="text-sm font-bold text-gray-800">{kpis.totalOrders}</p>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-teal-50 rounded-full"><TrendingUp className="h-4 w-4 text-teal-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Total Qty</p>
              <p className="text-sm font-bold text-gray-800">{kpis.totalQty.toFixed(2)} <span className="text-[10px] font-normal opacity-60">m³</span></p>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-amber-50 rounded-full"><CheckCircle2 className="h-4 w-4 text-amber-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Pending Qty</p>
              <p className="text-sm font-bold text-gray-800">{kpis.pendingQty.toFixed(2)} <span className="text-[10px] font-normal opacity-60">m³</span></p>
            </div>
          </div>
          <div className="bg-[#1e40af] rounded-lg p-2 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-white/20 rounded-full"><Users className="h-4 w-4 text-white" /></div>
            <div>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-tight">Active Customers</p>
              <p className="text-sm font-bold text-white">{kpis.activeCustomers}</p>
            </div>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Table Header / Filters Row */}
          {showFilters && (
            <div className="p-3 border-b bg-gray-50/50 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-gray-500">PO Number</Label>
                <Input 
                  placeholder="Search PO..." 
                  className="h-8 text-xs" 
                  value={poFilter} 
                  onChange={e => {setPoFilter(e.target.value); setPage(1);}}
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
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400">PO Number</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400">Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-center">Items</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-right">Total Qty</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-gray-400 text-center">Status</TableHead>
                  <TableHead className="w-[80px] text-[10px] font-bold uppercase text-gray-400 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-xs">Loading...</TableCell></TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10 text-xs text-gray-500 font-medium">No records matching your filters</TableCell></TableRow>
                ) : (
                  pageRows.map((order) => (
                    <TableRow key={order.id} className="group hover:bg-gray-50/80 transition-colors">
                      <TableCell className="py-2"><span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{order.id}</span></TableCell>
                      <TableCell className="font-bold text-[#1e40af] text-xs py-2">{order.poNumber}</TableCell>
                      <TableCell className="text-xs py-2">
                        <div className="font-semibold text-gray-800">{order.customerName}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[200px]">{order.siteAddress || "No site specified"}</div>
                      </TableCell>
                      <TableCell className="text-[11px] font-medium py-2">{order.poDate}</TableCell>
                      <TableCell className="text-center py-2">
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{order.items?.length || 0} items</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs py-2">
                        {(order.items?.reduce((sum: number, i) => sum + Number(i.quantity), 0) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">Active</span>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Order</DropdownMenuItem>
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
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage(page + 1)} className="h-7 text-[10px] font-bold px-2 uppercase">Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
