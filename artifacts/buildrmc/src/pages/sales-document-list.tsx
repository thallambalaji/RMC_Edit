import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useGetInvoices,
  useGetCustomers,
  getGetInvoicesQueryKey,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight, Plus, Search, RotateCcw } from "lucide-react";

export default function SalesDocumentList() {
  const { data: invoices, isLoading } = useGetInvoices({
    query: { queryKey: getGetInvoicesQueryKey() },
  });
  const { data: customers } = useGetCustomers();

  const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = invoices || [];
    return list.filter((inv) => {
      if (invoiceNoFilter && !inv.invoiceNumber.toLowerCase().includes(invoiceNoFilter.toLowerCase())) return false;
      if (fromDate && inv.invoiceDate < fromDate) return false;
      if (toDate && inv.invoiceDate > toDate) return false;
      if (customerFilter !== "all" && String(inv.customerId) !== customerFilter) return false;
      if (siteFilter !== "all" && (inv.site || "") !== siteFilter) return false;
      return true;
    });
  }, [invoices, invoiceNoFilter, fromDate, toDate, customerFilter, siteFilter]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  const uniqueSites = useMemo(() => {
    const set = new Set<string>();
    (invoices || []).forEach((i) => i.site && set.add(i.site));
    return Array.from(set);
  }, [invoices]);

  const handleClear = () => {
    setInvoiceNoFilter("");
    setFromDate("");
    setToDate("");
    setCustomerFilter("all");
    setSiteFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header with breadcrumbs */}
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0">
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Sales Document List</h2>
        <div className="h-4 w-px bg-gray-300" />
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/billing" className="hover:text-[#1e40af] transition-colors">Billing</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#1e40af]">Sales Document List</span>
        </nav>
      </div>

      {/* Filters card */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="fInvoiceNo" className="text-sm font-semibold">Invoice No</Label>
            <Input
              id="fInvoiceNo"
              placeholder="Enter Inv"
              className="bg-gray-50 border-gray-200"
              value={invoiceNoFilter}
              onChange={(e) => { setInvoiceNoFilter(e.target.value); setPage(1); }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fFromDate" className="text-sm font-semibold">From Date <span className="text-cyan-500">*</span></Label>
            <Input
              id="fFromDate"
              type="date"
              className="bg-gray-50 border-gray-200"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fToDate" className="text-sm font-semibold">To Date <span className="text-cyan-500">*</span></Label>
            <Input
              id="fToDate"
              type="date"
              className="bg-gray-50 border-gray-200"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fCustomer" className="text-sm font-semibold">Customer <span className="text-cyan-500">*</span></Label>
            <Select value={customerFilter} onValueChange={(v) => { setCustomerFilter(v); setPage(1); }}>
              <SelectTrigger id="fCustomer" className="bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customer</SelectItem>
                {customers?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fSite" className="text-sm font-semibold">Site <span className="text-cyan-500">*</span></Label>
            <Select value={siteFilter} onValueChange={(v) => { setSiteFilter(v); setPage(1); }}>
              <SelectTrigger id="fSite" className="bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Site</SelectItem>
                {uniqueSites.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-8">
          <Button type="button" className="bg-emerald-500 hover:bg-emerald-600 min-w-[100px] text-white">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
          <Button type="button" className="bg-rose-500 hover:bg-rose-600 min-w-[100px] text-white" onClick={handleClear}>
            <RotateCcw className="h-4 w-4 mr-2" /> Clear
          </Button>
          <Link href="/billing/sales-document/new">
            <Button type="button" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold h-10 px-4">
              <Plus className="h-4 w-4 mr-2" /> Add Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(1); }}>
              <SelectTrigger className="w-20 h-9 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Search:</span>
            <Input className="h-9 w-48 bg-white" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#6c757d] hover:bg-[#6c757d]">
                <TableHead className="text-white font-semibold py-3">Invoice No</TableHead>
                <TableHead className="text-white font-semibold">Date</TableHead>
                <TableHead className="text-white font-semibold">Time</TableHead>
                <TableHead className="text-white font-semibold">Customer</TableHead>
                <TableHead className="text-white font-semibold">Site Address</TableHead>
                <TableHead className="text-white font-semibold">Vehicle</TableHead>
                <TableHead className="text-white font-semibold text-right">Taxable Amt</TableHead>
                <TableHead className="text-white font-semibold text-right">Tax Amt</TableHead>
                <TableHead className="text-white font-semibold text-right">Net Amt.</TableHead>
                <TableHead className="text-white font-semibold">Plant</TableHead>
                <TableHead className="text-white font-semibold text-center">Option</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12">Loading...</TableCell></TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-gray-500 font-medium">
                    No data available in table
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((inv) => {
                  const taxableAmt = parseFloat(String(inv.netAmount || 0));
                  const netAmt = parseFloat(String(inv.totalAmount || 0));
                  const taxAmt = netAmt - taxableAmt;
                  
                  return (
                    <TableRow key={inv.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <TableCell className="font-medium text-cyan-600">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-GB") : "—"}</TableCell>
                      <TableCell>{inv.invoiceTime || "—"}</TableCell>
                      <TableCell>{inv.customerName}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={inv.site || ""}>{inv.site || "—"}</TableCell>
                      <TableCell>{inv.vehicleNo || "—"}</TableCell>
                      <TableCell className="text-right font-medium">{taxableAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-medium text-gray-600">{taxAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-bold text-gray-900">{netAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{inv.plant || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50">View</Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            {totalRows === 0
              ? "Showing 0 to 0 of 0 entries"
              : `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, totalRows)} of ${totalRows} entries`}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-600 border-gray-200"
              disabled={currentPage <= 1} 
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={p === currentPage ? "default" : "outline"}
                  className={p === currentPage ? "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500" : "text-gray-600 border-gray-200"}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-600 border-gray-200"
              disabled={currentPage >= totalPages} 
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
