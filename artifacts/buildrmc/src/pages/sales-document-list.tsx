import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useGetInvoices,
  useGetCustomers,
  useDeleteInvoice,
  getGetInvoicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";
import {
  ChevronRight, Plus, Search, RotateCcw, Trash2, Pencil,
  Download, Printer, FileText, X, Copy,
} from "lucide-react";

export default function SalesDocumentList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteInvoice = useDeleteInvoice();

  const { data: invoices, isLoading } = useGetInvoices({
    query: { queryKey: getGetInvoicesQueryKey() },
  });
  const { data: customers } = useGetCustomers();

  const [invoiceNoFilter, setInvoiceNoFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [globalSearch, setGlobalSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [viewInv, setViewInv] = useState<any | null>(null);

  // Show the print-root div only when printing
  useEffect(() => {
    const show = () => {
      const el = document.getElementById("print-root");
      if (el) el.style.display = "block";
    };
    const hide = () => {
      const el = document.getElementById("print-root");
      if (el) el.style.display = "none";
    };
    window.addEventListener("beforeprint", show);
    window.addEventListener("afterprint", hide);
    return () => {
      window.removeEventListener("beforeprint", show);
      window.removeEventListener("afterprint", hide);
    };
  }, []);

  // Sites filtered by selected customer — merges from invoices + customer record
  const uniqueSites = useMemo(() => {
    const set = new Set<string>();

    if (customerFilter === "all") {
      // Show ALL sites across all invoices
      (invoices || []).forEach(i => i.site && set.add(i.site));
    } else {
      // Pull sites from invoices for this customer
      (invoices || [])
        .filter(i => String(i.customerId) === customerFilter)
        .forEach(i => i.site && set.add(i.site));

      // Also add the customer's company name from the customers list (no address)
      const cust = (customers || []).find(c => String(c.id) === customerFilter) as any;
      if (cust) {
        if (cust.name) set.add(cust.name);           // company name only
        if (cust.siteName && cust.siteName !== cust.name) set.add(cust.siteName);
      }
    }

    return Array.from(set).filter(Boolean);
  }, [invoices, customers, customerFilter]);

  // Reset site filter when customer changes
  const handleCustomerChange = (v: string) => {
    setCustomerFilter(v);
    setSiteFilter("all");
    setPage(1);
  };

  const filtered = useMemo(() => {
    const list = invoices || [];
    return list.filter(inv => {
      if (invoiceNoFilter && !inv.invoiceNumber.toLowerCase().includes(invoiceNoFilter.toLowerCase())) return false;
      if (fromDate && inv.invoiceDate < fromDate) return false;
      if (toDate && inv.invoiceDate > toDate) return false;
      if (customerFilter !== "all" && String(inv.customerId) !== customerFilter) return false;
      if (siteFilter !== "all" && (inv.site || "") !== siteFilter) return false;
      if (globalSearch) {
        const t = globalSearch.toLowerCase();
        if (![inv.invoiceNumber, inv.customerName, inv.site, inv.vehicleNo, inv.plant]
          .some(f => f && String(f).toLowerCase().includes(t))) return false;
      }
      return true;
    }).sort((a, b) => b.id - a.id);
  }, [invoices, invoiceNoFilter, fromDate, toDate, customerFilter, siteFilter, globalSearch]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(startIdx, startIdx + pageSize);

  const handleClear = () => {
    setInvoiceNoFilter(""); setFromDate(""); setToDate("");
    setCustomerFilter("all"); setSiteFilter("all"); setGlobalSearch(""); setPage(1);
    toast({ title: "Filters Cleared" });
  };

  const handleSearch = () => {
    toast({ title: `Found ${filtered.length} record(s)`, description: filtered.length === 0 ? "No matches found." : "" });
  };

  const handleDelete = (id: any) => {
    if (!confirm("Permanently delete this sales document?")) return;
    deleteInvoice.mutate({ id } as any, {
      onSuccess: () => {
        toast({ title: "Document Deleted", description: "Removed from database successfully." });
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
      },
      onError: (err: any) => toast({ title: "Delete Failed", description: err.message, variant: "destructive" }),
    });
  };

  const exportCSV = () => {
    const headers = ["Invoice No", "Date", "Time", "Customer", "Site", "Vehicle", "Taxable", "Tax", "Net Amount", "Plant"];
    const rows = filtered.map(inv => {
      const taxable = parseFloat(String(inv.netAmount || 0));
      const net = parseFloat(String(inv.totalAmount || 0));
      return [inv.invoiceNumber, inv.invoiceDate, inv.invoiceTime || "", inv.customerName,
        inv.site || "", inv.vehicleNo || "", taxable, net - taxable, net, inv.plant || ""];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `sales-documents-${Date.now()}.csv`;
    a.click();
    toast({ title: "CSV Downloaded" });
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = "Sales Document List - BuildRMC Enterprises";
    window.print();
    setTimeout(() => { document.title = prevTitle; }, 1000);
  };

  const handleCopy = () => {
    if (!filtered.length) {
      toast({ title: "No data to copy", variant: "destructive" });
      return;
    }
    const headers = ["Invoice No", "Date", "Time", "Customer", "Site Address", "Vehicle", "Taxable Amt", "Tax Amt", "Net Amt", "Plant"];
    const rows = filtered.map(inv => {
      const taxable = parseFloat(String(inv.netAmount || 0));
      const net = parseFloat(String(inv.totalAmount || 0));
      return [
        inv.invoiceNumber,
        inv.invoiceDate,
        inv.invoiceTime || "",
        inv.customerName,
        inv.site || "",
        inv.vehicleNo || "",
        taxable,
        net - taxable,
        net,
        inv.plant || ""
      ];
    });
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Table data saved to clipboard." });
  };

  const handlePrintSingle = (inv: any) => {
    setViewInv(inv);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleExportSingleCSV = (inv: any) => {
    const rows = [["Field","Value"],["Invoice No", inv.invoiceNumber],["Date", inv.invoiceDate],
      ["Customer", inv.customerName],["Site", inv.site],["Vehicle", inv.vehicleNo],
      ["Plant", inv.plant],["Net Amount", inv.totalAmount]];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${inv.invoiceNumber}.csv`;
    a.click();
    toast({ title: "CSV Downloaded" });
  };

  const handleCopySingle = (inv: any) => {
    const text = `Invoice No: ${inv.invoiceNumber}\nDate: ${inv.invoiceDate}\nCustomer: ${inv.customerName}\nSite: ${inv.site || ""}\nVehicle: ${inv.vehicleNo || ""}\nNet Amount: ₹${inv.totalAmount}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Invoice details copied to clipboard." });
  };

  return (
    <div className="space-y-4">
      <style>{`
        @page {
          margin: 12mm;
          size: A4 landscape;
        }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          body > * { display: none !important; }
          #print-root { display: block !important; position: fixed; top: 0; left: 0; width: 100%; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ===== PRINT-ONLY AREA ===== */}
      <div id="print-root" style={{display:'none'}}>
        <PrintHeader />
        <div style={{borderBottom:'2px solid #e2e8f0', paddingBottom:'8px', marginBottom:'16px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <h2 style={{fontSize:'14px',fontWeight:900,color:'#1e40af',textTransform:'uppercase',margin:0}}>Sales Document List</h2>
          </div>
          <div style={{textAlign:'right', fontSize:'11px', color:'#64748b'}}>
            <span>Printed on: {new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})} &nbsp;|&nbsp; Total Records: {filtered.length}</span>
          </div>
        </div>

        {/* Print Table */}
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
          <thead>
            <tr style={{background:'#1e3a8a',color:'white'}}>
              {['Invoice No','Date','Time','Customer','Site Address','Vehicle','Taxable Amt','Tax Amt','Net Amt','Plant'].map(h => (
                <th key={h} style={{padding:'8px 10px',fontWeight:700,textTransform:'uppercase',textAlign:['Taxable Amt','Tax Amt','Net Amt'].includes(h)?'right':'left',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, idx) => {
              const taxable = parseFloat(String(inv.netAmount || 0));
              const net = parseFloat(String(inv.totalAmount || 0));
              const tax = net - taxable;
              return (
                <tr key={inv.id} style={{background: idx % 2 === 0 ? '#f8fafc' : 'white', borderBottom:'1px solid #e2e8f0'}}>
                  <td style={{padding:'7px 10px',fontWeight:700,color:'#1e40af'}}>{inv.invoiceNumber}</td>
                  <td style={{padding:'7px 10px',color:'#475569'}}>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{padding:'7px 10px',color:'#64748b'}}>{inv.invoiceTime || '—'}</td>
                  <td style={{padding:'7px 10px',fontWeight:600,color:'#0f172a'}}>{inv.customerName}</td>
                  <td style={{padding:'7px 10px',color:'#64748b',maxWidth:'160px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inv.site || '—'}</td>
                  <td style={{padding:'7px 10px',fontWeight:600}}>{inv.vehicleNo || '—'}</td>
                  <td style={{padding:'7px 10px',textAlign:'right',fontWeight:600}}>₹{taxable.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                  <td style={{padding:'7px 10px',textAlign:'right',color:'#64748b'}}>₹{tax.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                  <td style={{padding:'7px 10px',textAlign:'right',fontWeight:800,color:'#0f172a'}}>₹{net.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                  <td style={{padding:'7px 10px',color:'#475569'}}>{inv.plant || '—'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{background:'#1e3a8a',color:'white'}}>
              <td colSpan={6} style={{padding:'8px 10px',fontWeight:700}}>TOTAL ({filtered.length} records)</td>
              <td style={{padding:'8px 10px',textAlign:'right',fontWeight:800}}>₹{filtered.reduce((s,i)=>s+parseFloat(String(i.netAmount||0)),0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
              <td style={{padding:'8px 10px',textAlign:'right',fontWeight:800}}>₹{filtered.reduce((s,i)=>s+(parseFloat(String(i.totalAmount||0))-parseFloat(String(i.netAmount||0))),0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
              <td style={{padding:'8px 10px',textAlign:'right',fontWeight:800}}>₹{filtered.reduce((s,i)=>s+parseFloat(String(i.totalAmount||0)),0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
              <td style={{padding:'8px 10px'}}></td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div style={{marginTop:'20px',paddingTop:'12px',borderTop:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',fontSize:'10px',color:'#94a3b8'}}>
          <span>BuildRMC Enterprises — Confidential Document</span>
          <span>Generated: {new Date().toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm no-print">
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Sales Document List</h2>
        <div className="h-4 w-px bg-gray-300" />
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#1e40af]">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/billing" className="hover:text-[#1e40af]">Billing</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#1e40af]">Sales Document List</span>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 no-print">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">Invoice No</Label>
            <Input placeholder="Enter Inv" className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={invoiceNoFilter} onChange={e => { setInvoiceNoFilter(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">From Date</Label>
            <Input type="date" className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">To Date</Label>
            <Input type="date" className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">Customer</Label>
            <Select value={customerFilter} onValueChange={handleCustomerChange}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Customer</SelectItem>
                {customers?.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">Site</Label>
            <Select value={siteFilter} onValueChange={v => { setSiteFilter(v); setPage(1); }}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Site</SelectItem>
                {uniqueSites.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button onClick={handleSearch} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-9 px-5">
            <Search className="h-3.5 w-3.5 mr-1.5" /> Search
          </Button>
          <Button onClick={handleClear} className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-9 px-5">
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear
          </Button>
          <Link href="/billing/sales-document/new">
            <Button className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-xs h-9 px-4 shadow">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="flex items-center justify-between p-3 border-b bg-gray-50/50 no-print">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(parseInt(v)); setPage(1); }}>
              <SelectTrigger className="w-16 h-8 bg-white text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2">
            <Input value={globalSearch} onChange={e => { setGlobalSearch(e.target.value); setPage(1); }}
              placeholder="Search table..." className="h-8 w-44 bg-white text-xs" />
            <ExportDropdown onCopy={handleCopy} onCSV={exportCSV} onPDF={handlePrint} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700 hover:bg-slate-700">
                {["Invoice No","Date","Time","Customer","Site Address","Vehicle","Taxable Amt","Tax Amt","Net Amt.","Plant","Actions"].map(h => (
                  <TableHead key={h} className={`text-white font-bold py-3 text-xs uppercase ${["Taxable Amt","Tax Amt","Net Amt."].includes(h) ? "text-right" : h === "Actions" ? "text-center w-28" : ""}`}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12 text-xs text-slate-400 animate-pulse">Loading sales documents...</TableCell></TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12 text-slate-400 font-bold text-xs">No data available in table</TableCell></TableRow>
              ) : (
                pageRows.map(inv => {
                  const taxable = parseFloat(String(inv.netAmount || 0));
                  const net = parseFloat(String(inv.totalAmount || 0));
                  const tax = net - taxable;
                  return (
                    <TableRow key={inv.id} className="hover:bg-slate-50/50 border-b border-gray-100 text-xs">
                      <TableCell className="font-extrabold text-[#1e40af]">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-slate-600">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                      <TableCell className="text-slate-500">{inv.invoiceTime || "—"}</TableCell>
                      <TableCell className="font-bold text-slate-800">{inv.customerName}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-slate-500" title={inv.site || ""}>{inv.site || "—"}</TableCell>
                      <TableCell className="font-bold text-slate-700">{inv.vehicleNo || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">₹{taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-gray-500">₹{tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-black text-slate-900">₹{net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-slate-600">{inv.plant || "—"}</TableCell>
                      <TableCell className="text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Print (Printer Icon) */}
                          <Button 
                            onClick={() => handlePrintSingle(inv)}
                            title="Print PDF" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          {/* 2. CSV (Download Icon) */}
                          <Button 
                            onClick={() => handleExportSingleCSV(inv)}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50/50 border-t no-print">
          <p className="text-xs font-bold text-slate-400 uppercase">
            {totalRows === 0 ? "Showing 0 to 0 of 0 entries"
              : `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, totalRows)} of ${totalRows} entries`}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="text-xs border-gray-200" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages).map((p, i, arr) => (
              <span key={p} className="flex items-center gap-1">
                {i > 0 && arr[i - 1] !== p - 1 && <span className="text-slate-300 text-xs px-1">…</span>}
                <Button size="sm" onClick={() => setPage(p)}
                  className={`h-7 w-7 p-0 text-xs font-extrabold ${p === currentPage ? "bg-[#1e40af] text-white" : "border border-gray-200 text-gray-600 bg-white"}`}
                >{p}</Button>
              </span>
            ))}
            <Button variant="outline" size="sm" className="text-xs border-gray-200" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      <Dialog open={!!viewInv} onOpenChange={() => setViewInv(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-5 border-b bg-[#1e40af] rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white font-black text-lg tracking-tight">Invoice Details</DialogTitle>
                <p className="text-blue-200 text-xs font-semibold mt-0.5">{viewInv?.invoiceNumber}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline"
                  className="h-8 text-xs font-bold border-white/30 text-white hover:bg-white/10 bg-transparent gap-1.5"
                  onClick={() => {
                    const rows = [["Field","Value"],["Invoice No", viewInv?.invoiceNumber],["Date", viewInv?.invoiceDate],
                      ["Customer", viewInv?.customerName],["Site", viewInv?.site],["Vehicle", viewInv?.vehicleNo],
                      ["Plant", viewInv?.plant],["Net Amount", viewInv?.totalAmount]];
                    const csv = rows.map(r => r.join(",")).join("\n");
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                    a.download = `${viewInv?.invoiceNumber}.csv`;
                    a.click();
                    toast({ title: "CSV Downloaded" });
                  }}>
                  <FileText className="h-3.5 w-3.5" /> CSV
                </Button>
                <Button size="sm" variant="outline"
                  className="h-8 text-xs font-bold border-white/30 text-white hover:bg-white/10 bg-transparent gap-1.5"
                  onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" /> PDF / Print
                </Button>
              </div>
            </div>
          </DialogHeader>

          {viewInv && (
            <div className="p-6 space-y-5">
              {/* Company header in modal */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-12 h-12 bg-[#1e40af] text-white flex items-center justify-center font-black text-lg rounded-lg">BM</div>
                <div>
                  <p className="font-black text-slate-900 text-base uppercase tracking-tight">BuildRMC Enterprises</p>
                  <p className="text-xs text-slate-500 font-medium">123 Industrial Estate, Hyderabad, Telangana 500001</p>
                  <p className="text-xs text-slate-500">GSTIN: 36AAAAA1111A1Z1 | contact@buildrmc.com</p>
                </div>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  ["Invoice Number", viewInv.invoiceNumber],
                  ["Invoice Date", viewInv.invoiceDate ? new Date(viewInv.invoiceDate).toLocaleDateString("en-IN") : "—"],
                  ["Invoice Time", viewInv.invoiceTime || "—"],
                  ["Plant", viewInv.plant || "—"],
                  ["Vehicle No", viewInv.vehicleNo || "—"],
                  ["Remark", viewInv.remark || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-xs font-extrabold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Customer / Site */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-100 p-4 rounded-lg bg-white">
                  <p className="text-[10px] font-black text-[#1e40af] uppercase tracking-wider mb-2 pb-1 border-b">Customer</p>
                  <p className="font-black text-slate-800 text-sm">{viewInv.customerName || "—"}</p>
                </div>
                <div className="border border-slate-100 p-4 rounded-lg bg-white">
                  <p className="text-[10px] font-black text-[#1e40af] uppercase tracking-wider mb-2 pb-1 border-b">Site / Destination</p>
                  <p className="font-black text-slate-800 text-sm">{viewInv.site || "—"}</p>
                </div>
              </div>

              {/* Financials */}
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <div className="bg-slate-700 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider">Financial Summary</div>
                <div className="divide-y">
                  {[
                    ["Taxable Amount", `₹${parseFloat(String(viewInv.netAmount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                    ["CGST (9%)", `₹${(parseFloat(String(viewInv.totalAmount || 0)) - parseFloat(String(viewInv.netAmount || 0))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                    ["Total Tax", `₹${(parseFloat(String(viewInv.totalAmount || 0)) - parseFloat(String(viewInv.netAmount || 0))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center px-4 py-2.5 text-xs">
                      <span className="text-slate-500 font-semibold">{label}</span>
                      <span className="font-bold text-slate-800">{val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 bg-slate-50">
                    <span className="text-sm font-black text-slate-900">Net Total Payable</span>
                    <span className="text-lg font-black text-[#1e40af]">₹{parseFloat(String(viewInv.totalAmount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewInv(null)} className="text-xs font-bold h-9 px-5 gap-1.5">
                  <X className="h-3.5 w-3.5" /> Close
                </Button>
                <Button onClick={() => handleDelete(viewInv.id)} className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold h-9 px-5 gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete Record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
