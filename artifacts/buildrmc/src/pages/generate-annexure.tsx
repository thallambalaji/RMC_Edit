import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetInvoices,
  useGetCustomers,
  useDeleteInvoice,
  getGetInvoicesQueryKey,
} from "@workspace/api-client-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight,
  RotateCcw,
  Printer,
  Download,
  Eye,
  X,
  MoreHorizontal,
  FileBarChart,
  Copy,
  Trash2,
  FileText
} from "lucide-react";

export default function GenerateAnnexure() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const headerStyle = "bg-[#1e40af] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";

  // Queries & Mutations
  const { data: invoices, isLoading: isLoadingInvoices } = useGetInvoices({
    query: { queryKey: getGetInvoicesQueryKey() },
  });
  const { data: customers } = useGetCustomers();
  const deleteInvoice = useDeleteInvoice();

  // Filter States
  const [customer, setCustomer] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [generated, setGenerated] = useState(false);
  const [viewInv, setViewInv] = useState<any | null>(null);
  const [printInv, setPrintInv] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Print root dynamic visibility setup
  useEffect(() => {
    const show = () => {
      const el = document.getElementById("rpt-print-root");
      if (el) el.style.display = "block";
    };
    const hide = () => {
      const el = document.getElementById("rpt-print-root");
      if (el) el.style.display = "none";
    };
    window.addEventListener("beforeprint", show);
    window.addEventListener("afterprint", hide);
    return () => {
      window.removeEventListener("beforeprint", show);
      window.removeEventListener("afterprint", hide);
    };
  }, []);

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (!generated) return [];
    let list = invoices || [];

    if (fromDate) {
      list = list.filter((inv) => inv.invoiceDate && inv.invoiceDate >= fromDate);
    }
    if (toDate) {
      list = list.filter((inv) => inv.invoiceDate && inv.invoiceDate <= toDate);
    }
    if (customer !== "all") {
      list = list.filter((inv) => String(inv.customerId) === customer);
    }

    return list.sort((a, b) => b.id - a.id);
  }, [invoices, generated, fromDate, toDate, customer]);

  // Selected Customer Label
  const customerLabel = useMemo(() => {
    if (customer === "all") return "All Customers";
    const found = customers?.find((c) => String(c.id) === customer);
    return found ? found.name : "Selected Customer";
  }, [customer, customers]);

  // Pagination states
  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const pageRows = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, startIndex, pageSize]);

  // Actions & Handlers
  const handleGenerate = () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Dating fields required",
        description: "Specify both From Date and To Date to generate the Annexure report.",
        variant: "destructive",
      });
      return;
    }
    setGenerated(true);
    setCurrentPage(1);
    toast({
      title: "Annexure generated successfully",
      description: `Discovered ${filteredData.length} matches under selected period.`,
    });
  };

  const handleClear = () => {
    setCustomer("all");
    setFromDate("");
    setToDate("");
    setPageSize(10);
    setCurrentPage(1);
    setGenerated(false);
    toast({
      title: "Annexure reset",
      description: "Filter state and table contents have been completely cleared.",
    });
  };

  const handleCopyReport = () => {
    if (filteredData.length === 0) {
      toast({ title: "No data to copy", variant: "destructive" });
      return;
    }
    const headers = ["Challan / Inv No", "Customer", "Date", "Vehicle", "Plant", "Grade", "Qty (M³)", "Amount (₹)"];
    const rows = filteredData.map((inv) => [
      inv.invoiceNumber,
      inv.customerName || "—",
      inv.invoiceDate || "—",
      inv.vehicleNo || "—",
      inv.plant || "—",
      inv.grade || "—",
      Number(inv.quantity || 0).toFixed(2),
      Number(inv.totalAmount || 0).toFixed(2),
    ]);
    const text = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied successfully",
      description: "All filtered annexure schedules copied as tab-delimited text.",
    });
  };

  const handleCSVReport = () => {
    if (filteredData.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ["Challan / Inv No", "Customer", "Date", "Vehicle", "Plant", "Grade", "Qty (M³)", "Amount (₹)"];
    const rows = filteredData.map((inv) => [
      inv.invoiceNumber,
      inv.customerName || "—",
      inv.invoiceDate || "—",
      inv.vehicleNo || "—",
      inv.plant || "—",
      inv.grade || "—",
      Number(inv.quantity || 0).toFixed(2),
      Number(inv.totalAmount || 0).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Annexure_Report_${Date.now()}.csv`;
    a.click();
    toast({ title: "CSV Downloaded", description: "The annexure schedule CSV was downloaded." });
  };

  const handlePrintReport = () => {
    if (filteredData.length === 0) {
      toast({ title: "No data to print", variant: "destructive" });
      return;
    }
    const prev = document.title;
    document.title = `Annexure_Report_${customerLabel} - BuildRMC`;
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 1000);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;
    try {
      await deleteInvoice.mutateAsync({ id: deleteId });
      toast({ title: "Document deleted" });
      queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  const handleRowPrint = (inv: any) => {
    setPrintInv(inv);
    setTimeout(() => {
      const prev = document.title;
      document.title = `Challan_${inv.invoiceNumber} - BuildRMC`;
      window.print();
      setTimeout(() => {
        document.title = prev;
        setPrintInv(null);
      }, 1000);
    }, 150);
  };

  const handleRowCSV = (inv: any) => {
    const headers = ["Challan / Inv No", "Customer", "Date", "Vehicle", "Plant", "Grade", "Qty", "Amount"];
    const row = [
      inv.invoiceNumber,
      inv.customerName || "—",
      inv.invoiceDate || "—",
      inv.vehicleNo || "—",
      inv.plant || "—",
      inv.grade || "—",
      Number(inv.quantity || 0).toFixed(2),
      Number(inv.totalAmount || 0).toFixed(2),
    ];
    const csv = [headers, row].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `Challan-${inv.invoiceNumber}.csv`;
    a.click();
    toast({ title: "Row exported as CSV" });
  };

  const handleRowCopy = (inv: any) => {
    const text = `Challan No: ${inv.invoiceNumber}\nCustomer: ${inv.customerName || "—"}\nDate: ${inv.invoiceDate || "—"}\nVehicle: ${inv.vehicleNo || "—"}\nQty: ${Number(inv.quantity || 0).toFixed(2)}\nAmount: ₹${Number(inv.totalAmount || 0).toLocaleString("en-IN")}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Challan copied" });
  };

  return (
    <div className="space-y-4">
      <style>{`
        @page {
          margin: 12mm;
          size: A4 landscape;
        }
        @media print {
          html, body {
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          ${
            printInv
              ? `
               #rpt-print-root { display: none !important; }
               #row-print-root { display: block !important; width: 100%; }
              `
              : `
               #rpt-print-root { display: block !important; width: 100%; }
               #row-print-root { display: none !important; }
              `
          }
        }
      `}</style>

      {/* ===== PRINT AREA - MULTIPLE ROWS LANDSCAPE REPORT ===== */}
      <div id="rpt-print-root" style={{ display: "none" }}>
        <div style={{ padding: "10px", background: "white", color: "black", fontFamily: "system-ui, sans-serif" }}>
          <PrintHeader />
          <div style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", margin: 0 }}>Annexure Statement</h2>
            </div>
            <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b" }}>
              <span>Customer: {customerLabel} &nbsp;|&nbsp; Printed: {new Date().toLocaleString("en-IN")}</span>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ background: "#1e40af", color: "white" }}>
                {["Challan No", "Generated Date", "Vehicle Reg", "Plant Name", "Grade / Item", "Net Quantity (M³)", "Net Amount"].map((h) => (
                  <th key={h} style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: ["Net Quantity (M³)", "Net Amount"].includes(h) ? "right" : "left", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", fontWeight: 700 }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{inv.vehicleNo || "—"}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{inv.plant || "—"}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>{inv.grade || "—"}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{Number(inv.quantity || 0).toFixed(2)}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: 700 }}>₹{Number(inv.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              <tr style={{ background: "#f8fafc", fontWeight: 900, fontSize: "11px" }}>
                <td colSpan={5} style={{ padding: "8px 10px", border: "1px solid #e2e8f0" }}>GRAND TOTALS ({filteredData.length} records)</td>
                <td style={{ padding: "8px 10px", border: "1px solid #e2e8f0", textAlign: "right" }}>{filteredData.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0).toFixed(2)}</td>
                <td style={{ padding: "8px 10px", border: "1px solid #e2e8f0", textAlign: "right", color: "#1e40af" }}>₹{filteredData.reduce((acc, i) => acc + (Number(i.totalAmount) || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PRINT AREA - SINGLE ROW PORTRAIT DETAIL ===== */}
      <div id="row-print-root" style={{ display: "none" }}>
        {printInv && (
          <div style={{ padding: "30px", background: "white", color: "black", fontFamily: "system-ui, sans-serif" }}>
            <PrintHeader />
            <div style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "14px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase", margin: 0 }}>Sales Invoice Details</h2>
              </div>
              <div style={{ textAlign: "right", fontSize: "11px", color: "#64748b" }}>
                <span>Invoice No: {printInv.invoiceNumber}</span>
              </div>
            </div>

            <h2 style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", color: "#1e40af", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "14px" }}>Invoice Details</h2>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "24px" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, width: "30%", textAlign: "left" }}>Invoice Number</th>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{printInv.invoiceNumber}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Invoice Date</th>
                  <td style={{ padding: "10px" }}>{printInv.invoiceDate ? new Date(printInv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Customer Name</th>
                  <td style={{ padding: "10px", fontWeight: 700, color: "#0f172a" }}>{printInv.customerName || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Vehicle Number</th>
                  <td style={{ padding: "10px" }}>{printInv.vehicleNo || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Plant Name</th>
                  <td style={{ padding: "10px" }}>{printInv.plant || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Item Grade</th>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{printInv.grade || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Quantity (M³)</th>
                  <td style={{ padding: "10px" }}>{Number(printInv.quantity ?? 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Total Amount</th>
                  <td style={{ padding: "10px", fontWeight: 900, fontSize: "16px", color: "#1e40af" }}>₹{Number(printInv.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: "40px", textAlign: "center", fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
              This is a computer generated document and requires no signature.
            </div>
          </div>
        )}
      </div>

      {/* ===== SCREEN UI ===== */}
      <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm no-print">
        <div className="flex items-center gap-3">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Generate Annexure</h2>
          <div className="h-4 w-px bg-gray-300" />
          <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
            <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-gray-400">Billing</span>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-gray-400">Report</span>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-[#1e40af]">Generate Annexure</span>
          </nav>
        </div>
      </div>

      {/* Filters Form Panel */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Customer <span className="text-rose-500">*</span></Label>
            <Select value={customer} onValueChange={setCustomer}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs">
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Customer</SelectItem>
                {customers?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">From Date <span className="text-rose-500">*</span></Label>
            <Input
              type="date"
              className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setGenerated(false); }}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">To Date <span className="text-rose-500">*</span></Label>
            <Input
              type="date"
              className="bg-gray-50 border-gray-200 h-9 text-xs"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setGenerated(false); }}
            />
          </div>
        </div>

        {/* Filters submit buttons */}
        <div className="flex gap-2 justify-end mt-4">
          <Button onClick={handleGenerate} className="bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs h-9 px-6 shadow-sm">
            Generate Annexure
          </Button>
          <Button variant="outline" onClick={handleClear} className="bg-rose-500 hover:bg-rose-600 border-none text-white font-black text-xs h-9 px-6 shadow-sm gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Clear Report
          </Button>
        </div>
      </div>

      {/* Generated Report Layout block */}
      {!generated ? (
        <div className="bg-white rounded-lg p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-300 no-print">
          <FileBarChart className="h-20 w-20 mb-4 text-[#1e40af]/20" />
          <p className="text-base font-black uppercase tracking-wider text-gray-400">Click "Generate Annexure" to build the report</p>
          <p className="text-xs text-gray-300 mt-1 font-medium">Specify your parameters, then trigger search results generation.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden no-print">
          {/* Stats details header */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b bg-slate-50/40">
            <div className="p-3.5 text-center border-r border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Deliveries</span>
              <span className="text-lg font-black text-slate-800 mt-0.5">{totalRows} records</span>
            </div>
            <div className="p-3.5 text-center border-r border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Net Qty (M³)</span>
              <span className="text-lg font-black text-slate-800 mt-0.5">
                {filteredData.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="p-3.5 text-center flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Amount Value</span>
              <span className="text-lg font-black text-[#1e40af] mt-0.5">
                ₹{filteredData.reduce((acc, i) => acc + (Number(i.totalAmount) || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Actions toolbar */}
          <div className="flex items-center justify-between p-3.5 border-b bg-slate-50/20">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
              <span>Show</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v, 10)); setCurrentPage(1); }}>
                <SelectTrigger className="w-16 h-8 text-xs bg-white border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent className="text-xs">
                  {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>

            <div className="flex gap-1.5">
              <ExportDropdown onCopy={handleCopyReport} onCSV={handleCSVReport} onPDF={handlePrintReport} />
            </div>
          </div>

          {/* Results Schedule Table */}
          <div className="overflow-x-auto">
            {totalRows === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold">No annexure entries matched active parameters.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className={headerStyle}>Challan / Inv No</TableHead>
                    <TableHead className={headerStyle}>Customer</TableHead>
                    <TableHead className={headerStyle}>Date</TableHead>
                    <TableHead className={headerStyle}>Vehicle No</TableHead>
                    <TableHead className={headerStyle}>Plant</TableHead>
                    <TableHead className={headerStyle}>Grade</TableHead>
                    <TableHead className={`${headerStyle} text-right`}>Quantity (M³)</TableHead>
                    <TableHead className={`${headerStyle} text-right`}>Amount (₹)</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/50 border-b transition-colors">
                      <td className="py-2.5 text-center text-xs font-extrabold text-[#1e40af]">{inv.invoiceNumber}</td>
                      <td className="py-2.5 text-center text-xs font-bold text-slate-800">{inv.customerName || "—"}</td>
                      <td className="py-2.5 text-center text-xs font-semibold text-slate-600">
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="py-2.5 text-center text-xs font-semibold text-slate-600">{inv.vehicleNo || "—"}</td>
                      <td className="py-2.5 text-center text-xs font-semibold text-slate-600">{inv.plant || "—"}</td>
                      <td className="py-2.5 text-center text-xs font-bold">
                        <span className="px-2 py-0.5 border border-[#1e40af]/20 bg-blue-50/60 text-[#1e40af] rounded-full text-[10px]">
                          {inv.grade || "—"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-xs font-bold text-slate-700">{Number(inv.quantity || 0).toFixed(2)}</td>
                      <td className="py-2.5 text-right text-xs font-extrabold text-slate-800">
                        ₹{Number(inv.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem className="cursor-pointer gap-1.5 font-semibold" onClick={() => setViewInv(inv)}>
                              <Eye className="h-3.5 w-3.5 text-slate-500" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-1.5 font-semibold" onClick={() => handleRowPrint(inv)}>
                              <Printer className="h-3.5 w-3.5 text-slate-500" /> Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-1.5 font-semibold" onClick={() => handleRowCSV(inv)}>
                              <FileText className="h-3.5 w-3.5 text-slate-500" /> Export CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-1.5 font-semibold" onClick={() => handleRowCopy(inv)}>
                              <Copy className="h-3.5 w-3.5 text-slate-500" /> Copy Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-1.5 font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setDeleteId(inv.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Delete Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination bar */}
          {totalRows > 0 && (
            <div className="flex items-center justify-between p-3.5 bg-slate-50/50 border-t border-gray-100">
              <div className="text-xs text-slate-500 font-semibold">
                Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalRows)} of {totalRows} entries
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={activePage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-bold"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={activePage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-slate-900">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-semibold text-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-500 hover:bg-rose-600 font-bold text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewInv} onOpenChange={() => setViewInv(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-5 border-b bg-[#1e40af] rounded-t-lg flex flex-row items-center justify-between no-print">
            <div>
              <DialogTitle className="text-white font-black text-base">Challan Details</DialogTitle>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">{viewInv?.invoiceNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleRowCopy(viewInv)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRowCSV(viewInv)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                <FileText className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleRowPrint(viewInv)} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setViewInv(null)} className="text-white hover:bg-white/10 h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {viewInv && (
            <div className="p-6 space-y-5">
              {/* Company Logo Header */}
              <div className="flex items-center gap-4 border-b pb-5">
                <div className="w-14 h-14 bg-[#1e40af] text-white flex items-center justify-center font-black text-xl rounded-xl">BM</div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">BuildRMC Enterprises</h1>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">123 Industrial Estate, Phase-1, Hyderabad, Telangana 500001</p>
                  <p className="text-xs text-slate-600">GSTIN: 36AAAAA1111A1Z1 | +91 98765 43210</p>
                </div>
              </div>

              <h2 className="text-base font-extrabold uppercase text-[#1e40af] tracking-wide border-b pb-2">Challan Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="border p-3.5 rounded-xl bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Challan / Invoice No</p>
                  <p className="text-sm font-black text-slate-800">{viewInv.invoiceNumber}</p>
                </div>
                <div className="border p-3.5 rounded-xl bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Generated Date</p>
                  <p className="text-sm font-bold text-slate-800">
                    {viewInv.invoiceDate ? new Date(viewInv.invoiceDate).toLocaleDateString("en-IN") : "—"}
                  </p>
                </div>
              </div>

              <div className="border rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Customer Name</p>
                  <p className="text-sm font-black text-[#1e40af]">{viewInv.customerName || "—"}</p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Site Address</p>
                  <p className="text-xs font-semibold text-slate-700">{viewInv.site || "—"}</p>
                </div>
              </div>

              {/* Table breakdown */}
              <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-2.5 font-black text-slate-600 text-[10px] uppercase border-r border-slate-200">Item Grade</th>
                    <th className="p-2.5 font-black text-slate-600 text-[10px] uppercase border-r border-slate-200 text-right">Net Quantity (M³)</th>
                    <th className="p-2.5 font-black text-slate-600 text-[10px] uppercase text-right">Net Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="p-3 text-xs border-r border-slate-200 font-extrabold text-slate-800">{viewInv.grade || "—"}</td>
                    <td className="p-3 text-xs border-r border-slate-200 font-bold text-right text-slate-700">{Number(viewInv.quantity ?? 0).toFixed(2)}</td>
                    <td className="p-3 text-xs font-black text-right text-[#1e40af]">₹{Number(viewInv.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-center text-[10px] text-slate-400 border-t pt-4 font-medium">
                This is a computer generated document and requires no signature.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
