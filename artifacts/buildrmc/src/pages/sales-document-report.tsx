import { useEffect, useMemo, useState } from "react";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";
import { ChevronRight, RotateCcw, FileBarChart, Printer, Download, Eye, X, MoreHorizontal } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SalesDocumentReport() {
  const { toast } = useToast();
  const headerStyle = "bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";

  const { data: invoices } = useGetInvoices({
    query: { queryKey: getGetInvoicesQueryKey() },
  });
  const { data: customers } = useGetCustomers();

  const [reportType, setReportType] = useState("date-wise");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [plantFilter, setPlantFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [generated, setGenerated] = useState(false);
  const [viewInv, setViewInv] = useState<any | null>(null);
  const [printInv, setPrintInv] = useState<any | null>(null);

  // beforeprint / afterprint toggle for print-root
  useEffect(() => {
    const show = () => { const el = document.getElementById("rpt-print-root"); if (el) el.style.display = "block"; };
    const hide = () => { const el = document.getElementById("rpt-print-root"); if (el) el.style.display = "none"; };
    window.addEventListener("beforeprint", show);
    window.addEventListener("afterprint", hide);
    return () => { window.removeEventListener("beforeprint", show); window.removeEventListener("afterprint", hide); };
  }, []);

  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    (invoices || []).forEach(i => i.plant && set.add(i.plant));
    return Array.from(set);
  }, [invoices]);

  // Base filtered data
  const reportData = useMemo(() => {
    if (!generated) return [];
    const list = invoices || [];
    return list.filter(inv => {
      if (fromDate && inv.invoiceDate < fromDate) return false;
      if (toDate && inv.invoiceDate > toDate) return false;
      if (plantFilter !== "all" && (inv.plant || "") !== plantFilter) return false;
      if (customerFilter !== "all" && String(inv.customerId) !== customerFilter) return false;
      return true;
    }).sort((a, b) => (a.invoiceDate || "").localeCompare(b.invoiceDate || ""));
  }, [invoices, generated, fromDate, toDate, plantFilter, customerFilter]);

  // Totals
  const totals = useMemo(() => ({
    taxable: reportData.reduce((s, i) => s + parseFloat(String(i.netAmount || 0)), 0),
    tax: reportData.reduce((s, i) => s + (parseFloat(String(i.totalAmount || 0)) - parseFloat(String(i.netAmount || 0))), 0),
    net: reportData.reduce((s, i) => s + parseFloat(String(i.totalAmount || 0)), 0),
  }), [reportData]);

  // Group data by report type
  const groupedData = useMemo(() => {
    if (reportType === "date-wise") {
      const groups: Record<string, typeof reportData> = {};
      reportData.forEach(inv => {
        const d = inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "Unknown";
        if (!groups[d]) groups[d] = [];
        groups[d].push(inv);
      });
      return groups;
    }
    if (reportType === "customer-wise") {
      const groups: Record<string, typeof reportData> = {};
      reportData.forEach(inv => {
        const k = inv.customerName || "Unknown";
        if (!groups[k]) groups[k] = [];
        groups[k].push(inv);
      });
      return groups;
    }
    if (reportType === "plant-wise") {
      const groups: Record<string, typeof reportData> = {};
      reportData.forEach(inv => {
        const k = inv.plant || "No Plant";
        if (!groups[k]) groups[k] = [];
        groups[k].push(inv);
      });
      return groups;
    }
    return {};
  }, [reportData, reportType]);

  const handleGenerate = () => {
    if (!fromDate || !toDate) {
      toast({ title: "Required Fields Missing", description: "Please select both From Date and To Date to generate the report.", variant: "destructive" });
      return;
    }
    setGenerated(true);
    toast({ title: "Report Generated", description: `Found ${(invoices || []).filter(i => (!fromDate || i.invoiceDate >= fromDate) && (!toDate || i.invoiceDate <= toDate)).length} records.` });
  };

  const handleClear = () => {
    setReportType("date-wise");
    setFromDate("");
    setToDate("");
    setPlantFilter("all");
    setCustomerFilter("all");
    setGenerated(false);
    toast({ title: "Report Cleared" });
  };

  const handlePrint = () => {
    if (!generated) { toast({ title: "Generate report first", variant: "destructive" }); return; }
    const prev = document.title;
    document.title = "Sales Document Report - BuildRMC Enterprises";
    window.print();
    setTimeout(() => { document.title = prev; }, 1000);
  };

  const handleCSV = () => {
    if (!generated) { toast({ title: "Generate report first", variant: "destructive" }); return; }
    const headers = ["Invoice No", "Date", "Customer", "Site", "Vehicle", "Plant", "Taxable Amt", "Tax Amt", "Net Amt"];
    const rows = reportData.map(inv => {
      const taxable = parseFloat(String(inv.netAmount || 0));
      const net = parseFloat(String(inv.totalAmount || 0));
      return [inv.invoiceNumber, inv.invoiceDate, inv.customerName, inv.site || "", inv.vehicleNo || "", inv.plant || "", taxable, net - taxable, net];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `sales-document-report-${Date.now()}.csv`;
    a.click();
    toast({ title: "CSV Downloaded" });
  };

  const handleCopy = () => {
    if (!generated) { toast({ title: "Generate report first", variant: "destructive" }); return; }
    const headers = ["Invoice No", "Date", "Customer", "Site", "Vehicle", "Plant", "Taxable Amt", "Tax Amt", "Net Amt"];
    const rows = reportData.map(inv => {
      const taxable = parseFloat(String(inv.netAmount || 0));
      const net = parseFloat(String(inv.totalAmount || 0));
      return [inv.invoiceNumber, inv.invoiceDate, inv.customerName, inv.site || "", inv.vehicleNo || "", inv.plant || "", taxable, net - taxable, net];
    });
    const text = [headers, ...rows].map(r => r.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Report data saved to clipboard." });
  };

  const handleRowPrint = (inv: any) => {
    setPrintInv(inv);
    setTimeout(() => {
      const prev = document.title;
      document.title = `Invoice_${inv.invoiceNumber} - BuildRMC`;
      window.print();
      setTimeout(() => { 
        document.title = prev; 
        setPrintInv(null);
      }, 1000);
    }, 150);
  };

  const handleRowCSV = (inv: any) => {
    const headers = ["Invoice No", "Date", "Time", "Customer", "Site", "Vehicle", "Plant", "Taxable Amt", "Tax Amt", "Net Amt"];
    const taxable = parseFloat(String(inv.netAmount || 0));
    const net = parseFloat(String(inv.totalAmount || 0));
    const row = [inv.invoiceNumber, inv.invoiceDate, inv.invoiceTime || "", inv.customerName, inv.site || "", inv.vehicleNo || "", inv.plant || "", taxable, net - taxable, net];
    const csv = [headers, row].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `invoice-${inv.invoiceNumber}.csv`;
    a.click();
    toast({ title: "CSV Downloaded" });
  };

  const reportTypeLabel = reportType === "date-wise" ? "Date Wise" : reportType === "customer-wise" ? "Customer Wise" : "Plant Wise";

  return (
    <div className="space-y-4">
      <style>{`
        @page { margin: 12mm; size: A4 landscape; }
        @media print {
          html, body { margin: 0 !important; background: white; }
          .no-print { display: none !important; }
          ${printInv 
            ? `
               #rpt-print-root { display: none !important; }
               .invoice-print-only { display: none !important; }
               #row-print-root { display: block !important; width: 100%; }
              `
            : viewInv 
            ? `
               #rpt-print-root { display: none !important; }
               .invoice-print-only { display: block !important; }
               #row-print-root { display: none !important; }
               div[role="dialog"] { position: relative !important; width: 100% !important; max-width: 100% !important; box-shadow: none !important; }
              ` 
            : `
               #rpt-print-root { display: block !important; width: 100%; }
               .invoice-print-only { display: none !important; }
               #row-print-root { display: none !important; }
              `}
        }
        .invoice-print-only { display: none; }
      `}</style>

      {/* ===== PRINT ONLY (REPORT) ===== */}
      <div id="rpt-print-root" style={{ display: "none" }}>
        <PrintHeader />
        <div style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: 900, color: "#ea580c", textTransform: "uppercase", margin: 0 }}>Sales Document Report</h2>
          </div>
          <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b" }}>
            <span>Report Type: {reportTypeLabel} &nbsp;|&nbsp; Printed: {new Date().toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Print report table */}
        {Object.entries(groupedData).map(([group, rows]) => {
          const gTaxable = rows.reduce((s, i) => s + parseFloat(String(i.netAmount || 0)), 0);
          const gNet = rows.reduce((s, i) => s + parseFloat(String(i.totalAmount || 0)), 0);
          const gTax = gNet - gTaxable;
          return (
            <div key={group} style={{ marginBottom: "20px" }}>
              <div style={{ background: "#e2e8f0", padding: "6px 10px", fontWeight: 800, fontSize: "12px", color: "#0f172a", marginBottom: "4px" }}>{reportTypeLabel.split(" ")[0]}: {group}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                <thead>
                  <tr style={{ background: "#0f172a", color: "white" }}>
                    {["Invoice No", "Date", "Time", "Customer", "Site", "Vehicle", "Plant", "Taxable", "Tax", "Net Amt"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", textAlign: ["Taxable", "Tax", "Net Amt"].includes(h) ? "right" : "left", fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv, idx) => {
                    const taxable = parseFloat(String(inv.netAmount || 0));
                    const net = parseFloat(String(inv.totalAmount || 0));
                    return (
                      <tr key={inv.id} style={{ background: idx % 2 === 0 ? "#f8fafc" : "white", borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "5px 8px", fontWeight: 700, color: "#ea580c" }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: "5px 8px" }}>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                        <td style={{ padding: "5px 8px" }}>{inv.invoiceTime || "—"}</td>
                        <td style={{ padding: "5px 8px", fontWeight: 600 }}>{inv.customerName}</td>
                        <td style={{ padding: "5px 8px", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.site || "—"}</td>
                        <td style={{ padding: "5px 8px" }}>{inv.vehicleNo || "—"}</td>
                        <td style={{ padding: "5px 8px" }}>{inv.plant || "—"}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right" }}>₹{taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right" }}>₹{(net - taxable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 800 }}>₹{net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: "#dbeafe", fontWeight: 800, fontSize: "11px" }}>
                    <td colSpan={7} style={{ padding: "5px 8px" }}>Sub-total ({rows.length} records)</td>
                    <td style={{ padding: "5px 8px", textAlign: "right" }}>₹{gTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right" }}>₹{gTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right" }}>₹{gNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Grand total */}
        <div style={{ marginTop: "12px", padding: "10px 12px", background: "#0f172a", color: "white", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "13px", borderRadius: "4px" }}>
          <span>GRAND TOTAL — {reportData.length} Records</span>
          <span>Taxable: ₹{totals.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })} &nbsp;|&nbsp; Tax: ₹{totals.tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })} &nbsp;|&nbsp; Net: ₹{totals.net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        <div style={{ marginTop: "16px", borderTop: "1px solid #e2e8f0", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8" }}>
          <span>BuildRMC Enterprises — Confidential</span>
          <span>Generated: {new Date().toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* ===== PRINT ONLY (SINGLE ROW) ===== */}
      <div id="row-print-root" style={{ display: "none" }}>
        {printInv && (() => {
          const taxable = parseFloat(String(printInv.netAmount || 0));
          const net = parseFloat(String(printInv.totalAmount || 0));
          const tax = net - taxable;
          return (
            <div className="p-8 bg-white text-black">
              <div className="flex items-center gap-4 mb-8 border-b-2 border-[#ea580c] pb-6">
                <div className="w-16 h-16 bg-[#ea580c] text-white flex items-center justify-center font-black text-2xl rounded-xl">BM</div>
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">BuildRMC Enterprises</h1>
                  <p className="text-sm text-slate-600 mt-1 font-medium">123 Industrial Estate, Phase-1, Hyderabad, Telangana 500001</p>
                  <p className="text-sm text-slate-600">GSTIN: 36AAAAA1111A1Z1 | +91 98765 43210</p>
                </div>
              </div>
              
              <h2 className="text-xl font-bold uppercase text-[#ea580c] mb-4 border-b pb-2">Sales Document Details</h2>
              
              <table className="w-full text-left mb-6 border border-slate-200">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 bg-slate-50 font-bold text-sm w-1/3">Invoice Number</th>
                    <td className="p-3 font-semibold text-sm">{printInv.invoiceNumber}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 bg-slate-50 font-bold text-sm">Date</th>
                    <td className="p-3 text-sm">{printInv.invoiceDate ? new Date(printInv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 bg-slate-50 font-bold text-sm">Time</th>
                    <td className="p-3 text-sm">{printInv.invoiceTime || "—"}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 bg-slate-50 font-bold text-sm">Customer</th>
                    <td className="p-3 font-bold text-slate-800 text-sm">{printInv.customerName}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 bg-slate-50 font-bold text-sm">Site</th>
                    <td className="p-3 text-sm">{printInv.site || "—"}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 bg-slate-50 font-bold text-sm">Vehicle No</th>
                    <td className="p-3 text-sm">{printInv.vehicleNo || "—"}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 bg-slate-50 font-bold text-sm">Plant Name</th>
                    <td className="p-3 text-sm">{printInv.plant || "—"}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 bg-slate-50 font-bold text-sm">Taxable Amount</th>
                    <td className="p-3 font-semibold text-sm">₹{taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th className="p-3 bg-slate-50 font-bold text-sm">Tax Amount</th>
                    <td className="p-3 font-semibold text-sm">₹{tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <th className="p-3 bg-slate-50 font-bold text-sm">Net Amount</th>
                    <td className="p-3 font-black text-lg text-slate-900">₹{net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-12 text-center text-sm text-slate-500 border-t pt-4">
                This is a computer generated document and requires no signature.
              </div>
            </div>
          );
        })()}
      </div>

      {/* ===== SCREEN UI ===== */}
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm no-print">
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Sales Document Report</h2>
        <div className="h-4 w-px bg-gray-300" />
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#ea580c]">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/billing" className="hover:text-[#ea580c]">Billing</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#ea580c]">Sales Document Report</span>
        </nav>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 no-print">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">Report Type <span className="text-rose-500">*</span></Label>
            <Select value={reportType} onValueChange={v => { setReportType(v); setGenerated(false); }}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="date-wise" className="text-xs">Date Wise Report</SelectItem>
                <SelectItem value="customer-wise" className="text-xs">Customer Wise Report</SelectItem>
                <SelectItem value="plant-wise" className="text-xs">Plant Wise Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">From Date <span className="text-rose-500">*</span></Label>
            <Input type="date" className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={fromDate} onChange={e => { setFromDate(e.target.value); setGenerated(false); }} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">To Date <span className="text-rose-500">*</span></Label>
            <Input type="date" className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={toDate} onChange={e => { setToDate(e.target.value); setGenerated(false); }} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">Customer</Label>
            <Select value={customerFilter} onValueChange={v => { setCustomerFilter(v); setGenerated(false); }}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all" className="text-xs">All Customer</SelectItem>
                {(customers || []).map(c => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-600 uppercase">Plant <span className="text-rose-500">*</span></Label>
            <Select value={plantFilter} onValueChange={v => { setPlantFilter(v); setGenerated(false); }}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all" className="text-xs">All Plant</SelectItem>
                {uniquePlants.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs h-9 flex-1 shadow-sm">
              Generate
            </Button>
            <Button onClick={handleClear} className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs h-9 flex-1">
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Report output */}
      {!generated ? (
        <div className="bg-white rounded-lg p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-300 no-print">
          <FileBarChart className="h-20 w-20 mb-4" />
          <p className="text-base font-black uppercase tracking-wider text-gray-400">Click "Generate" to view the report</p>
          <p className="text-xs text-gray-300 mt-1 font-medium">Select From Date and To Date, then click Generate</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden no-print">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-3 border-b bg-gray-50/60">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                {reportTypeLabel} Report
              </span>
              <span className="bg-[#ea580c] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {reportData.length} records
              </span>
              {fromDate && (
                <span className="text-[10px] text-slate-400 font-semibold">
                  {new Date(fromDate).toLocaleDateString("en-IN")} — {toDate ? new Date(toDate).toLocaleDateString("en-IN") : "Today"}
                </span>
              )}
            </div>
            <ExportDropdown onCopy={handleCopy} onCSV={handleCSV} onPDF={handlePrint} />
          </div>

          {reportData.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-gray-300">
              <FileBarChart className="h-16 w-16 mb-3" />
              <p className="text-sm font-black text-gray-400">No records found for the selected filters</p>
            </div>
          ) : (
            <>
              {Object.entries(groupedData).map(([group, rows]) => {
                const gTaxable = rows.reduce((s, i) => s + parseFloat(String(i.netAmount || 0)), 0);
                const gNet = rows.reduce((s, i) => s + parseFloat(String(i.totalAmount || 0)), 0);
                const gTax = gNet - gTaxable;
                return (
                  <div key={group} className="mb-0">
                    {/* Group header */}
                    <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200">
                      <span className="text-xs font-black text-[#ea580c] uppercase tracking-wider">{reportTypeLabel.split(" ")[0]}: {group}</span>
                      <span className="text-[10px] font-bold text-slate-500">{rows.length} record{rows.length !== 1 ? "s" : ""}</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-0 hover:bg-transparent">
                          {["Invoice No", "Date", "Time", "Customer", "Site", "Vehicle", "Plant", "Taxable Amt", "Tax Amt", "Net Amt", "Actions"].map(h => {
                            const align = ["Taxable Amt", "Tax Amt", "Net Amt"].includes(h) 
                              ? "text-right" 
                              : h === "Actions" 
                                ? "text-center w-16" 
                                : "text-left";
                            return (
                              <TableHead key={h} className={`${headerStyle} ${align}`}>
                                {h}
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map(inv => {
                          const taxable = parseFloat(String(inv.netAmount || 0));
                          const net = parseFloat(String(inv.totalAmount || 0));
                          const tax = net - taxable;
                          return (
                            <TableRow key={inv.id} className="hover:bg-slate-50 border-b border-gray-100 text-xs">
                              <TableCell className="font-extrabold text-[#ea580c] py-2">{inv.invoiceNumber}</TableCell>
                              <TableCell className="text-slate-600 py-2">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                              <TableCell className="text-slate-400 py-2">{inv.invoiceTime || "—"}</TableCell>
                              <TableCell className="font-bold text-slate-800 py-2">{inv.customerName}</TableCell>
                              <TableCell className="text-slate-500 py-2 max-w-[140px] truncate" title={inv.site || ""}>{inv.site || "—"}</TableCell>
                              <TableCell className="font-semibold py-2">{inv.vehicleNo || "—"}</TableCell>
                              <TableCell className="text-slate-500 py-2">{inv.plant || "—"}</TableCell>
                              <TableCell className="text-right font-semibold py-2">₹{taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right text-gray-400 py-2">₹{tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right font-black text-slate-900 py-2">₹{net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-center py-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-[#ea580c] hover:bg-orange-50/40 rounded-full">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-32 rounded-xl shadow-lg border-slate-200">
                                    <DropdownMenuItem onClick={() => setViewInv(inv)} className="text-xs cursor-pointer text-slate-700 font-bold gap-2 py-2">
                                      <Eye className="h-3.5 w-3.5 text-[#ea580c]" /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRowPrint(inv)} className="text-xs cursor-pointer text-slate-700 font-bold gap-2 py-2">
                                      <Printer className="h-3.5 w-3.5 text-[#ea580c]" /> Print / PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRowCSV(inv)} className="text-xs cursor-pointer text-slate-700 font-bold gap-2 py-2">
                                      <Download className="h-3.5 w-3.5 text-emerald-600" /> Export CSV
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Subtotal row */}
                        <TableRow className="bg-orange-50/40 hover:bg-orange-50/40">
                          <TableCell colSpan={7} className="text-xs font-black text-[#ea580c] py-2 pl-4">Sub-total ({rows.length} records)</TableCell>
                          <TableCell className="text-right text-xs font-black text-slate-700 py-2">₹{gTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right text-xs font-black text-slate-500 py-2">₹{gTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right text-xs font-black text-[#ea580c] py-2">₹{gNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                );
              })}

              {/* Grand Total + Export buttons */}
              <div className="flex items-center justify-between bg-slate-800 text-white px-4 py-3">
                <span className="text-xs font-black uppercase tracking-wider">Grand Total — {reportData.length} Records</span>
                <div className="flex gap-8 text-xs font-black">
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[9px] uppercase tracking-wider">Taxable</span>
                    <span>₹{totals.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[9px] uppercase tracking-wider">Total Tax</span>
                    <span>₹{totals.tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[9px] uppercase tracking-wider">Net Total</span>
                    <span className="text-orange-300 text-sm">₹{totals.net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* View Invoice Detail Modal (Also acts as Print-Only wrapper for row print) */}
      <div className={viewInv ? "printing-invoice" : ""}>
        <Dialog open={!!viewInv} onOpenChange={() => setViewInv(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible invoice-print-only">
            <DialogHeader className="p-5 border-b bg-[#ea580c] rounded-t-lg print:bg-white print:border-none print:p-0 print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white font-black text-base">Invoice Details</DialogTitle>
                <p className="text-orange-200 text-xs font-semibold mt-0.5">{viewInv?.invoiceNumber}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setViewInv(null)} className="text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {viewInv && (
            <div className="p-5 space-y-4">
              {/* Company */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border">
                <div className="w-10 h-10 bg-[#ea580c] text-white flex items-center justify-center font-black rounded-lg text-sm">BM</div>
                <div>
                  <p className="font-black text-slate-900 text-sm uppercase">BuildRMC Enterprises</p>
                  <p className="text-xs text-slate-500">123 Industrial Estate, Hyderabad | GSTIN: 36AAAAA1111A1Z1</p>
                </div>
              </div>
              {/* Meta */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Invoice No", viewInv.invoiceNumber],
                  ["Date", viewInv.invoiceDate ? new Date(viewInv.invoiceDate).toLocaleDateString("en-IN") : "—"],
                  ["Time", viewInv.invoiceTime || "—"],
                  ["Plant", viewInv.plant || "—"],
                  ["Vehicle No", viewInv.vehicleNo || "—"],
                  ["Remark", viewInv.remark || "—"],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 rounded-lg p-2.5 border">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">{l}</p>
                    <p className="text-xs font-extrabold text-slate-800">{v}</p>
                  </div>
                ))}
              </div>
              {/* Customer / Site */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border p-3 rounded-lg">
                  <p className="text-[9px] font-black text-[#ea580c] uppercase tracking-wider mb-1 border-b pb-1">Customer</p>
                  <p className="font-black text-slate-800 text-sm">{viewInv.customerName || "—"}</p>
                </div>
                <div className="border p-3 rounded-lg">
                  <p className="text-[9px] font-black text-[#ea580c] uppercase tracking-wider mb-1 border-b pb-1">Site</p>
                  <p className="font-black text-slate-800 text-sm">{viewInv.site || "—"}</p>
                </div>
              </div>
              {/* Financials */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-700 text-white px-4 py-2 text-xs font-black uppercase">Financial Summary</div>
                {[
                  ["Taxable Amount", parseFloat(String(viewInv.netAmount || 0))],
                  ["Tax Amount", parseFloat(String(viewInv.totalAmount || 0)) - parseFloat(String(viewInv.netAmount || 0))],
                ].map(([label, val]: any) => (
                  <div key={label} className="flex justify-between px-4 py-2 border-b text-xs">
                    <span className="text-slate-500 font-semibold">{label}</span>
                    <span className="font-bold">₹{(val as number).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 bg-slate-50">
                  <span className="font-black text-slate-900">Net Total Payable</span>
                  <span className="font-black text-[#ea580c] text-lg">₹{parseFloat(String(viewInv.totalAmount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
