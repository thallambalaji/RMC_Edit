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

export default function InvoiceReport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries & Mutations
  const { data: invoices, isLoading: isLoadingInvoices } = useGetInvoices({
    query: { queryKey: getGetInvoicesQueryKey() },
  });
  const { data: customers } = useGetCustomers();
  const deleteInvoice = useDeleteInvoice();

  // Filter & Form States
  const [category, setCategory] = useState("invoice-report");
  const [reportType, setReportType] = useState("date-wise");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [item, setItem] = useState("all");
  const [plant, setPlant] = useState("all");
  const [billReceived, setBillReceived] = useState("all");
  const [status, setStatus] = useState("all");

  const [generated, setGenerated] = useState(false);
  const [viewInv, setViewInv] = useState<any | null>(null);
  const [printInv, setPrintInv] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Print root dynamic visibility
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

  // Extract unique filter lists dynamically from invoices
  const uniquePlants = useMemo(() => {
    const set = new Set<string>();
    (invoices || []).forEach((i) => i.plant && set.add(i.plant));
    return Array.from(set).sort();
  }, [invoices]);

  const uniqueGrades = useMemo(() => {
    const set = new Set<string>();
    (invoices || []).forEach((i) => i.grade && set.add(i.grade));
    return Array.from(set).sort();
  }, [invoices]);

  // Main Report Filtering Logic
  const reportData = useMemo(() => {
    if (!generated) return [];
    let list = invoices || [];

    if (fromDate) {
      list = list.filter((inv) => inv.invoiceDate && inv.invoiceDate >= fromDate);
    }
    if (toDate) {
      list = list.filter((inv) => inv.invoiceDate && inv.invoiceDate <= toDate);
    }
    if (plant !== "all") {
      list = list.filter((inv) => inv.plant && inv.plant.toLowerCase() === plant.toLowerCase());
    }
    if (item !== "all") {
      list = list.filter((inv) => inv.grade && inv.grade.toLowerCase() === item.toLowerCase());
    }
    if (billReceived !== "all") {
      const wantReceived = billReceived === "received";
      list = list.filter((inv) => !!inv.isBillReceived === wantReceived);
    }
    if (status !== "all") {
      const wantReceived = status === "received";
      list = list.filter((inv) => !!inv.isBillReceived === wantReceived);
    }

    return list.sort((a, b) => (a.invoiceDate || "").localeCompare(b.invoiceDate || ""));
  }, [invoices, generated, fromDate, toDate, plant, item, billReceived, status]);

  // Metrics block
  const metrics = useMemo(() => {
    const qty = reportData.reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0);
    const amount = reportData.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const receivedCount = reportData.filter((inv) => inv.isBillReceived).length;
    const pendingCount = reportData.length - receivedCount;
    return { qty, amount, receivedCount, pendingCount };
  }, [reportData]);

  // Grouping report data based on report type
  const groupedData = useMemo(() => {
    const groups: Record<string, typeof reportData> = {};
    if (reportType === "date-wise") {
      reportData.forEach((inv) => {
        const d = inv.invoiceDate
          ? new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "No Date";
        if (!groups[d]) groups[d] = [];
        groups[d].push(inv);
      });
    } else if (reportType === "customer-wise") {
      reportData.forEach((inv) => {
        const c = inv.customerName || "Unknown Customer";
        if (!groups[c]) groups[c] = [];
        groups[c].push(inv);
      });
    } else if (reportType === "plant-wise") {
      reportData.forEach((inv) => {
        const p = inv.plant || "Unknown Plant";
        if (!groups[p]) groups[p] = [];
        groups[p].push(inv);
      });
    } else if (reportType === "grade-wise") {
      reportData.forEach((inv) => {
        const g = inv.grade || "No Grade Specified";
        if (!groups[g]) groups[g] = [];
        groups[g].push(inv);
      });
    }
    return groups;
  }, [reportData, reportType]);

  // Button Handlers
  const handleGenerate = () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Date Range Required",
        description: "Please specify both From Date and To Date to generate report.",
        variant: "destructive",
      });
      return;
    }
    setGenerated(true);
    toast({
      title: "Report Generated Successfully",
      description: `Loaded ${reportData.length} invoice records.`,
    });
  };

  const handleClear = () => {
    setCategory("invoice-report");
    setReportType("date-wise");
    setItem("all");
    setPlant("all");
    setBillReceived("all");
    setStatus("all");
    setFromDate("");
    setToDate("");
    setGenerated(false);
    toast({
      title: "Filters Cleared",
      description: "Report states have been completely reset.",
    });
  };

  const handlePrint = () => {
    if (!generated || reportData.length === 0) {
      toast({ title: "No data to print", variant: "destructive" });
      return;
    }
    const prev = document.title;
    document.title = "Invoice Report - BuildRMC Enterprises";
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 1000);
  };

  const handleCSV = () => {
    if (!generated || reportData.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = [
      "Invoice No",
      "Date",
      "Customer",
      "Site",
      "Plant",
      "Grade",
      "Quantity (M³)",
      "Total Amount (₹)",
      "Bill Received Status",
    ];
    const rows = reportData.map((inv) => [
      inv.invoiceNumber,
      inv.invoiceDate,
      inv.customerName,
      inv.site || "",
      inv.plant || "",
      inv.grade || "",
      inv.quantity,
      inv.totalAmount,
      inv.isBillReceived ? "Received" : "Pending",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_Report_${Date.now()}.csv`;
    a.click();
    toast({ title: "CSV Downloaded", description: "The invoice report is exported to CSV format." });
  };

  const handleCopyReport = () => {
    if (!generated || reportData.length === 0) {
      toast({ title: "No data to copy", variant: "destructive" });
      return;
    }
    const headers = ["Invoice No", "Date", "Customer", "Site", "Plant", "Grade", "Qty", "Amount", "Status"];
    const rows = reportData.map((inv) => [
      inv.invoiceNumber,
      inv.invoiceDate || "",
      inv.customerName || "",
      inv.site || "",
      inv.plant || "",
      inv.grade || "",
      inv.quantity || "0",
      inv.totalAmount || "0",
      inv.isBillReceived ? "Received" : "Pending"
    ]);
    const text = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
    navigator.clipboard.writeText(text);
    toast({
      title: "Report Copied",
      description: "Copied table rows to clipboard in tab-delimited format.",
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;
    try {
      await deleteInvoice.mutateAsync({ id: deleteId });
      toast({ title: "Invoice Deleted", description: "The sales invoice has been permanently removed." });
      queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
    } catch (err) {
      toast({ title: "Deletion Failed", description: "An error occurred while deleting the invoice.", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
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
    const headers = ["Invoice No", "Date", "Customer", "Site", "Plant", "Grade", "Quantity (M³)", "Total Amount (₹)"];
    const row = [
      inv.invoiceNumber,
      inv.invoiceDate,
      inv.customerName,
      inv.site || "",
      inv.plant || "",
      inv.grade || "",
      inv.quantity,
      inv.totalAmount,
    ];
    const csv = [headers, row].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `invoice-${inv.invoiceNumber}.csv`;
    a.click();
    toast({ title: "Invoice CSV Downloaded" });
  };

  const reportTypeLabel =
    reportType === "date-wise"
      ? "Date Wise"
      : reportType === "customer-wise"
      ? "Customer Wise"
      : reportType === "plant-wise"
      ? "Plant Wise"
      : "Grade Wise";

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

      {/* ===== PRINT AREA - MULTIPLE ROWS REPORT (LANDSCAPE) ===== */}
      <div id="rpt-print-root" style={{ display: "none" }}>
        <div style={{ padding: "10px", background: "white", color: "black", fontFamily: "system-ui, sans-serif" }}>
          {/* Corporate Header */}
          <div style={{ borderBottom: "2px solid #1e40af", paddingBottom: "16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "52px", height: "52px", background: "#1e40af", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px", borderRadius: "8px" }}>BM</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", textTransform: "uppercase" }}>BuildRMC Enterprises</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>123 Industrial Estate, Phase-1, Hyderabad, Telangana 500001</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>GSTIN: 36AAAAA1111A1Z1 | +91 98765 43210</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase" }}>Invoice Report</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Grouped By: {reportTypeLabel}</div>
              {fromDate && <div style={{ fontSize: "11px", color: "#64748b" }}>Period: {new Date(fromDate).toLocaleDateString("en-IN")} — {toDate ? new Date(toDate).toLocaleDateString("en-IN") : "Today"}</div>}
              <div style={{ fontSize: "11px", color: "#64748b" }}>Printed: {new Date().toLocaleString("en-IN")}</div>
            </div>
          </div>

          {/* Grouped Tables */}
          {Object.entries(groupedData).map(([groupName, list]) => {
            const groupQty = list.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
            const groupAmt = list.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
            return (
              <div key={groupName} style={{ marginBottom: "20px" }}>
                <div style={{ background: "#f1f5f9", padding: "6px 10px", fontWeight: 800, fontSize: "12px", color: "#1e40af", borderLeft: "4px solid #1e40af", marginBottom: "6px" }}>
                  {reportTypeLabel}: {groupName}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                  <thead>
                    <tr style={{ background: "#1e40af", color: "white" }}>
                      {["Invoice No", "Date", "Customer Name", "Site Name", "Plant", "Grade", "Qty (M³)", "Total Amt", "Status"].map((h) => (
                        <th key={h} style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: ["Qty (M³)", "Total Amt"].includes(h) ? "right" : "left", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "5px 8px", border: "1px solid #e2e8f0", fontWeight: 700 }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #e2e8f0" }}>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN") : "—"}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #e2e8f0", fontWeight: 600 }}>{inv.customerName}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #e2e8f0" }}>{inv.site || "—"}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #e2e8f0" }}>{inv.plant || "—"}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #e2e8f0" }}>{inv.grade || "—"}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{Number(inv.quantity || 0).toFixed(2)}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: 700 }}>₹{Number(inv.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #e2e8f0", color: inv.isBillReceived ? "green" : "red", fontWeight: 700 }}>{inv.isBillReceived ? "Received" : "Pending"}</td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f8fafc", fontWeight: 800, fontSize: "11px" }}>
                      <td colSpan={6} style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>Sub-total ({list.length} Records)</td>
                      <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right" }}>{groupQty.toFixed(2)}</td>
                      <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0", textAlign: "right", color: "#1e40af" }}>₹{groupAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: "6px 8px", border: "1px solid #e2e8f0" }}>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Grand totals print section */}
          <div style={{ marginTop: "14px", padding: "10px 14px", background: "#1e40af", color: "white", display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: "13px", borderRadius: "6px" }}>
            <span>GRAND TOTALS — {reportData.length} records</span>
            <span>Total Qty: {metrics.qty.toFixed(2)} M³ &nbsp;|&nbsp; Net Amount: ₹{metrics.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* ===== PRINT AREA - SINGLE ROW DETAIL SHEET (PORTRAIT) ===== */}
      <div id="row-print-root" style={{ display: "none" }}>
        {printInv && (
          <div style={{ padding: "30px", background: "white", color: "black", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ borderBottom: "2px solid #1e40af", paddingBottom: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "56px", height: "56px", background: "#1e40af", color: "white", display: "flex", alignItems: "center", justifyItems: "center", fontWeight: 900, fontSize: "20px", borderRadius: "8px" }}>BM</div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", textTransform: "uppercase" }}>BuildRMC Enterprises</div>
                  <div style={{ fontSize: "11px", color: "#475569" }}>123 Industrial Estate, Phase-1, Hyderabad, Telangana 500001</div>
                  <div style={{ fontSize: "11px", color: "#475569" }}>GSTIN: 36AAAAA1111A1Z1 | +91 98765 43210</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#1e40af", textTransform: "uppercase" }}>Sales Invoice</div>
                <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>Date: {printInv.invoiceDate ? new Date(printInv.invoiceDate).toLocaleDateString("en-IN") : "—"}</div>
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
                  <td style={{ padding: "10px", fontWeight: 700, color: "#0f172a" }}>{printInv.customerName}</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "10px", background: "#f8fafc", fontWeight: 700, textAlign: "left" }}>Site Address</th>
                  <td style={{ padding: "10px" }}>{printInv.site || "—"}</td>
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
      <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border shadow-sm no-print">
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Invoice Report</h2>
        <div className="h-4 w-px bg-gray-300" />
        <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
          <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <Link href="/billing" className="hover:text-[#1e40af] transition-colors">Billing</Link>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-[#1e40af]">Invoice Report</span>
        </nav>
      </div>

      {/* Filters Form Card */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 no-print">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
          {/* Category */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Report Category <span className="text-rose-500">*</span></Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="invoice-report">Invoice Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Report Type <span className="text-rose-500">*</span></Label>
            <Select value={reportType} onValueChange={(v) => { setReportType(v); setGenerated(false); }}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="date-wise">Date Wise</SelectItem>
                <SelectItem value="customer-wise">Customer Wise</SelectItem>
                <SelectItem value="plant-wise">Plant Wise</SelectItem>
                <SelectItem value="grade-wise">Grade Wise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* From Date */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">From Date</Label>
            <Input type="date" className="bg-gray-50 border-gray-200 h-9 text-xs" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setGenerated(false); }} />
          </div>

          {/* To Date */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">To Date</Label>
            <Input type="date" className="bg-gray-50 border-gray-200 h-9 text-xs" value={toDate} onChange={(e) => { setToDate(e.target.value); setGenerated(false); }} />
          </div>

          {/* Item / Grade */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Item <span className="text-rose-500">*</span></Label>
            <Select value={item} onValueChange={(v) => { setItem(v); setGenerated(false); }}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All Item</SelectItem>
                {uniqueGrades.map((g) => <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Plant */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Plant <span className="text-rose-500">*</span></Label>
            <Select value={plant} onValueChange={(v) => { setPlant(v); setGenerated(false); }}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All plant</SelectItem>
                {uniquePlants.map((p) => <SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Bill Received */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Is Bill Received ?</Label>
            <Select value={billReceived} onValueChange={(v) => { setBillReceived(v); setGenerated(false); }}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-gray-500 uppercase">Invoice Status</Label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setGenerated(false); }}>
              <SelectTrigger className="bg-gray-50 border-gray-200 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex gap-2 justify-end mt-4">
          <Button onClick={handleGenerate} className="bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs h-9 px-6 shadow-sm">
            Generate
          </Button>
          <Button variant="outline" onClick={handleClear} className="bg-rose-500 hover:bg-rose-600 border-none text-white font-black text-xs h-9 px-6 shadow-sm gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Clear
          </Button>
        </div>
      </div>

      {/* Main Results Container */}
      {!generated ? (
        <div className="bg-white rounded-lg p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-300 no-print">
          <FileBarChart className="h-20 w-20 mb-4 text-[#1e40af]/20" />
          <p className="text-base font-black uppercase tracking-wider text-gray-400">Click "Generate" to view the report</p>
          <p className="text-xs text-gray-300 mt-1 font-medium">Specify the From and To Date, then trigger the generator.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden no-print">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b bg-slate-50/40">
            <div className="p-3.5 text-center border-r border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Invoices</span>
              <span className="text-lg font-black text-slate-800 mt-0.5">{reportData.length}</span>
            </div>
            <div className="p-3.5 text-center border-r border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Quantity (M³)</span>
              <span className="text-lg font-black text-slate-800 mt-0.5">{metrics.qty.toFixed(2)}</span>
            </div>
            <div className="p-3.5 text-center border-r border-slate-100 flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Value (₹)</span>
              <span className="text-lg font-black text-[#1e40af] mt-0.5">₹{metrics.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-3.5 text-center flex flex-col justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bill Status</span>
              <span className="text-xs font-bold text-slate-700 mt-1">
                <span className="text-emerald-600">{metrics.receivedCount} Received</span> &nbsp;|&nbsp; <span className="text-rose-500">{metrics.pendingCount} Pending</span>
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between p-3.5 border-b bg-slate-50/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#1e40af] uppercase tracking-wide">{reportTypeLabel} Report</span>
              <span className="text-[10px] text-slate-400 font-semibold">• {reportData.length} Records found</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopyReport} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1.5 border-gray-200 text-slate-600 hover:bg-slate-100">
                <Copy className="h-3.5 w-3.5 text-[#1e40af]" /> Copy Table
              </Button>
              <Button onClick={handleCSV} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1.5 border-gray-200 text-slate-600 hover:bg-emerald-50">
                <Download className="h-3.5 w-3.5 text-emerald-600" /> Export CSV
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm" className="h-8 text-xs font-bold gap-1.5 border-gray-200 text-slate-600 hover:bg-blue-50">
                <Printer className="h-3.5 w-3.5 text-[#1e40af]" /> Print Report
              </Button>
            </div>
          </div>

          {/* Grouped report blocks */}
          {reportData.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-gray-300">
              <FileBarChart className="h-16 w-16 mb-2 opacity-30" />
              <p className="text-sm font-black text-slate-400">No records matched your specific filters.</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {Object.entries(groupedData).map(([groupName, list]) => {
                const subQty = list.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
                const subAmt = list.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);
                return (
                  <div key={groupName} className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="px-4 py-2.5 bg-[#1e40af]/10 border-b flex items-center justify-between">
                      <span className="text-xs font-black text-[#1e40af] uppercase tracking-wide">
                        {reportTypeLabel}: {groupName}
                      </span>
                      <span className="text-[10px] font-black text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full uppercase">
                        {list.length} Invoices
                      </span>
                    </div>

                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="w-[100px] text-[10px] font-extrabold uppercase text-slate-500 py-2.5">Invoice No</TableHead>
                          <TableHead className="text-[10px] font-extrabold uppercase text-slate-500 py-2.5">Date</TableHead>
                          <TableHead className="text-[10px] font-extrabold uppercase text-slate-500 py-2.5">Customer / Delivery Site</TableHead>
                          <TableHead className="text-[10px] font-extrabold uppercase text-slate-500 py-2.5">Plant Name</TableHead>
                          <TableHead className="text-[10px] font-extrabold uppercase text-slate-500 py-2.5 text-center">Grade</TableHead>
                          <TableHead className="text-[10px] font-extrabold uppercase text-slate-500 py-2.5 text-right">Quantity (M³)</TableHead>
                          <TableHead className="text-[10px] font-extrabold uppercase text-slate-500 py-2.5 text-right">Total Amount</TableHead>
                          <TableHead className="text-[10px] font-extrabold uppercase text-slate-500 py-2.5 text-center">Status</TableHead>
                          <TableHead className="w-[80px] text-[10px] font-extrabold uppercase text-slate-500 py-2.5 text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map((inv) => (
                          <TableRow key={inv.id} className="hover:bg-slate-50/50 border-b transition-colors">
                            <td className="py-2.5 text-xs font-extrabold text-[#1e40af]">{inv.invoiceNumber}</td>
                            <td className="py-2.5 text-[11px] font-semibold text-slate-600">
                              {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                            </td>
                            <td className="py-2.5 text-xs">
                              <div className="font-bold text-slate-800">{inv.customerName}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[220px]">{inv.site || "—"}</div>
                            </td>
                            <td className="py-2.5 text-xs font-semibold text-slate-600">{inv.plant || "—"}</td>
                            <td className="py-2.5 text-xs text-center font-bold">
                              <span className="px-2 py-0.5 border border-[#1e40af]/20 bg-blue-50/60 text-[#1e40af] rounded-full text-[10px]">
                                {inv.grade || "—"}
                              </span>
                            </td>
                            <td className="py-2.5 text-xs text-right font-bold text-slate-700">{Number(inv.quantity || 0).toFixed(2)}</td>
                            <td className="py-2.5 text-xs text-right font-extrabold text-slate-800">
                              ₹{Number(inv.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 text-xs text-center font-bold">
                              {inv.isBillReceived ? (
                                <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 text-[9px] px-2 py-0.5 rounded-full uppercase">Received</span>
                              ) : (
                                <span className="text-rose-500 bg-rose-50 border border-rose-100 text-[9px] px-2 py-0.5 rounded-full uppercase">Pending</span>
                              )}
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
                                  <DropdownMenuItem className="cursor-pointer gap-1.5 font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setDeleteId(inv.id)}>
                                    <Trash2 className="h-3.5 w-3.5 text-rose-500" /> Delete Invoice
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50/60 font-extrabold text-xs">
                          <TableCell colSpan={5} className="py-3">Sub-total ({list.length} records)</TableCell>
                          <TableCell className="py-3 text-right text-slate-700">{subQty.toFixed(2)}</TableCell>
                          <TableCell className="py-3 text-right text-[#1e40af]" colSpan={1}>
                            ₹{subAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell colSpan={2} />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-slate-900">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice from the system and reload the active report.
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

      {/* View Details Screen Modal */}
      <Dialog open={!!viewInv} onOpenChange={() => setViewInv(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-5 border-b bg-[#1e40af] rounded-t-lg flex flex-row items-center justify-between no-print">
            <div>
              <DialogTitle className="text-white font-black text-base">Invoice Details</DialogTitle>
              <p className="text-blue-200 text-xs font-semibold mt-0.5">{viewInv?.invoiceNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                const text = `Invoice No: ${viewInv.invoiceNumber}\nDate: ${new Date(viewInv.invoiceDate).toLocaleDateString("en-IN")}\nCustomer: ${viewInv.customerName}\nSite: ${viewInv.site || ""}\nPlant: ${viewInv.plant || ""}\nGrade: ${viewInv.grade || ""}\nQty: ${Number(viewInv.quantity).toFixed(2)}\nAmount: ₹${Number(viewInv.totalAmount).toLocaleString("en-IN")}`;
                navigator.clipboard.writeText(text);
                toast({ title: "Copied details" });
              }} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
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
              {/* Header */}
              <div className="flex items-center gap-4 border-b pb-5">
                <div className="w-14 h-14 bg-[#1e40af] text-white flex items-center justify-center font-black text-xl rounded-xl">BM</div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">BuildRMC Enterprises</h1>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">123 Industrial Estate, Phase-1, Hyderabad, Telangana 500001</p>
                  <p className="text-xs text-slate-600">GSTIN: 36AAAAA1111A1Z1 | +91 98765 43210</p>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-base font-extrabold uppercase text-[#1e40af] tracking-wide border-b pb-2">Invoice Information</h2>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border p-3.5 rounded-xl bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Invoice Number</p>
                  <p className="text-sm font-black text-slate-800">{viewInv.invoiceNumber}</p>
                </div>
                <div className="border p-3.5 rounded-xl bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Invoice Date</p>
                  <p className="text-sm font-bold text-slate-800">
                    {viewInv.invoiceDate ? new Date(viewInv.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                  </p>
                </div>
              </div>

              <div className="border rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Customer Name</p>
                  <p className="text-sm font-black text-[#1e40af]">{viewInv.customerName}</p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Site Name / Delivery Address</p>
                  <p className="text-xs font-semibold text-slate-700">{viewInv.site || "—"}</p>
                </div>
              </div>

              {/* Invoice breakdown */}
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
                    <td className="p-3 text-xs font-black text-right text-[#1e40af]">₹{Number(viewInv.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
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
