import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight,
  Printer,
  RotateCcw,
  Copy as CopyIcon,
  FileCode,
  FileText,
  Trash2,
  TrendingUp,
  Layers,
  Activity,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { QcLayout } from "@/components/qc-layout";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";

export default function BatchReport() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form Inputs
  const [reportType, setReportType] = useState<string>("Production Sheet");
  const [fromDate, setFromDate] = useState<string>("2026-05-17");
  const [toDate, setToDate] = useState<string>("2026-05-30");

  // Generated Report State
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);

  // Printing State
  const [printingEntry, setPrintingEntry] = useState<any | null>(null);
  const [printingSummary, setPrintingSummary] = useState<any | null>(null);

  // Fetch Batch entries for reports
  const fetchEntries = async () => {
    try {
      const res = await fetch("/api/batch-entries");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error("Failed to fetch entries", err);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [refreshKey]);

  // Generate Report Logic
  const handleGenerate = () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both From Date and To Date.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Filter entries based on date range
    const filtered = entries.filter((e) => {
      const entryDate = new Date(e.date);
      const start = new Date(fromDate);
      const end = new Date(toDate);
      entryDate.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return entryDate >= start && entryDate <= end;
    });

    setTimeout(() => {
      setGeneratedReport({
        type: reportType,
        fromDate,
        toDate,
        data: filtered,
      });
      setLoading(false);
      toast({
        title: "Report Generated",
        description: `Successfully loaded ${filtered.length} logs for the selected range.`,
      });
    }, 400);
  };

  // Clear Form & Report
  const handleClear = () => {
    setReportType("Production Sheet");
    setFromDate("2026-05-17");
    setToDate("2026-05-30");
    setGeneratedReport(null);
    toast({
      title: "Form Cleared",
      description: "Report parameters have been reset.",
    });
  };

  // Delete Entry inside Report
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch log from the database?")) return;
    try {
      const res = await fetch(`/api/batch-entries/${id}`, { method: "DELETE" });
      if (res.ok) {
        // Update local entries state
        setEntries(entries.filter((e) => e.id !== id && e._id !== id));
        // Update generated report state
        if (generatedReport) {
          setGeneratedReport({
            ...generatedReport,
            data: generatedReport.data.filter((e: any) => e.id !== id && e._id !== id),
          });
        }
        toast({
          title: "Success",
          description: "Batch ticket deleted successfully from database.",
        });
        setRefreshKey((k) => k + 1);
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete batch log.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not complete delete operation.",
        variant: "destructive",
      });
    }
  };

  // Grouped Grade Statistics for "Production Sheet" Report
  const productionSheetData = useMemo(() => {
    if (!generatedReport || generatedReport.type !== "Production Sheet") return [];
    
    const groups: { [key: string]: { grade: string; count: number; qty: number; batched: number } } = {};
    
    generatedReport.data.forEach((e: any) => {
      const grade = e.grade || "Unknown";
      if (!groups[grade]) {
        groups[grade] = { grade, count: 0, qty: 0, batched: 0 };
      }
      groups[grade].count += 1;
      groups[grade].qty += Number(e.quantity) || 0;
      groups[grade].batched += Number(e.batchedQty) || 0;
    });

    return Object.values(groups).map((g) => {
      const variance = g.qty > 0 ? (((g.batched - g.qty) / g.qty) * 100).toFixed(2) : "0.00";
      return {
        ...g,
        variance,
      };
    });
  }, [generatedReport]);

  // Aggregate Stats
  const stats = useMemo(() => {
    if (!generatedReport) return { count: 0, totalQty: 0, totalBatched: 0, variance: "0.00" };
    const count = generatedReport.data.length;
    const totalQty = generatedReport.data.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 0), 0);
    const totalBatched = generatedReport.data.reduce((acc: number, curr: any) => acc + (Number(curr.batchedQty) || 0), 0);
    const variance = totalQty > 0 ? (((totalBatched - totalQty) / totalQty) * 100).toFixed(2) : "0.00";
    return {
      count,
      totalQty,
      totalBatched,
      variance,
    };
  }, [generatedReport]);

  // Export functions (Copy, CSV, PDF)
  const handleExport = (type: string, specificEntry?: any) => {
    if (!generatedReport) return;

    if (type === "pdf") {
      if (specificEntry) {
        setPrintingEntry(specificEntry);
        setPrintingSummary(null);
      } else {
        setPrintingEntry(null);
        setPrintingSummary({
          type: generatedReport.type,
          fromDate: generatedReport.fromDate,
          toDate: generatedReport.toDate,
          stats,
          productionData: productionSheetData,
          allData: generatedReport.data,
        });
      }
      setTimeout(() => {
        window.print();
      }, 100);
      return;
    }

    let headers: string[] = [];
    let rows: any[][] = [];

    if (generatedReport.type === "Production Sheet" && !specificEntry) {
      headers = ["Concrete Grade", "No. of Batches", "Total Ordered Qty (m³)", "Total Batched Qty (m³)", "Volumetric Variance (%)"];
      rows = productionSheetData.map((g) => [
        g.grade,
        g.count,
        g.qty.toFixed(1),
        g.batched.toFixed(1),
        `${g.variance}%`,
      ]);
    } else {
      const dataToExport = specificEntry ? [specificEntry] : generatedReport.data;
      headers = [
        "Batch No",
        "Date",
        "Customer",
        "Site",
        "Grade",
        "Quantity (m³)",
        "Batched Qty (m³)",
        "Vehicle No",
        "Plant",
      ];
      rows = dataToExport.map((e: any) => [
        e.batchNo,
        e.date,
        e.customerName,
        e.siteName,
        e.grade,
        e.quantity,
        e.batchedQty,
        e.vehicleNo,
        e.plant || "FORTUNE CONCRETE",
      ]);
    }

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${val}"`).join(","))
      .join("\n");

    if (type === "copy") {
      navigator.clipboard.writeText(csvContent);
      toast({
        title: "Success",
        description: `Copied generated report logs to clipboard as CSV.`,
      });
    } else if (type === "csv") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        specificEntry
          ? `batch_ticket_${specificEntry.batchNo}.csv`
          : `batching_report_${generatedReport.type.replace(/\s+/g, "_").toLowerCase()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "CSV Downloaded",
        description: "File successfully generated and downloaded.",
      });
    }
  };

  return (
    <div className="min-h-full relative">
      <div className="hidden print:block absolute inset-0 bg-white z-[9999] p-8 text-black">
        <PrintHeader />
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">
              {printingEntry ? "BATCH DELIVERY SLIP" : "BATCHING PRODUCTION REPORT"}
            </h2>
            <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
              {printingEntry ? `TICKET NO: ${printingEntry.batchNo}` : "SUMMARY DETAILS"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Print Date: {new Date().toLocaleDateString()}</p>
            <p className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-wider">Report ID: RMC/REP/{Math.floor(Math.random() * 9000) + 1000}</p>
          </div>
        </div>

        {printingEntry ? (
          /* Single Ticket Print */
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8 bg-slate-50 p-6 rounded-lg border">
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-blue-900 border-b pb-1">
                  Delivery Specifications
                </h3>
                <div className="grid grid-cols-2 text-[10px] gap-y-2">
                  <span className="font-bold text-gray-500">Batch Ticket No:</span>
                  <span className="font-black text-blue-900">{printingEntry.batchNo}</span>

                  <span className="font-bold text-gray-500">Batch Date:</span>
                  <span className="font-black">{printingEntry.date}</span>

                  <span className="font-bold text-gray-500">Vehicle No:</span>
                  <span className="font-black px-1.5 py-0.5 bg-yellow-100 rounded text-yellow-800 border border-yellow-200">
                    {printingEntry.vehicleNo}
                  </span>

                  <span className="font-bold text-gray-500">Plant Location:</span>
                  <span className="font-black text-emerald-800">
                    {printingEntry.plant || "FORTUNE CONCRETE"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-blue-900 border-b pb-1">
                  Customer & Site Details
                </h3>
                <div className="grid grid-cols-2 text-[10px] gap-y-2">
                  <span className="font-bold text-gray-500">Customer Name:</span>
                  <span className="font-black">{printingEntry.customerName}</span>

                  <span className="font-bold text-gray-500">Site Location:</span>
                  <span className="font-black">{printingEntry.siteName}</span>

                  <span className="font-bold text-gray-500">Concrete Grade:</span>
                  <span className="font-black text-blue-800">{printingEntry.grade}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-white shadow-sm">
              <h3 className="text-xs font-black uppercase text-gray-800 mb-4 tracking-wider">
                Material Quantity Verification
              </h3>
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-gray-500 font-bold uppercase">Description</th>
                    <th className="text-right py-2 text-gray-500 font-bold uppercase">Ordered Qty</th>
                    <th className="text-right py-2 text-gray-500 font-bold uppercase">Batched Qty</th>
                    <th className="text-right py-2 text-gray-500 font-bold uppercase">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 font-bold text-slate-800">Ready-Mix Concrete ({printingEntry.grade})</td>
                    <td className="text-right font-bold">{printingEntry.quantity} m³</td>
                    <td className="text-right font-black text-emerald-700">{printingEntry.batchedQty} m³</td>
                    <td className="text-right font-bold text-blue-700">
                      {(((printingEntry.batchedQty - printingEntry.quantity) / printingEntry.quantity) * 100).toFixed(2)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-16 grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1.5">
                  <p className="text-[9px] font-black uppercase text-gray-600">Batching Operator</p>
                  <p className="text-[8px] text-gray-400 uppercase mt-0.5">Signature & Stamp</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1.5">
                  <p className="text-[9px] font-black uppercase text-gray-600">Transit Driver</p>
                  <p className="text-[8px] text-gray-400 uppercase mt-0.5">Signature Required</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-1.5">
                  <p className="text-[9px] font-black uppercase text-gray-600">Customer Receiver</p>
                  <p className="text-[8px] text-gray-400 uppercase mt-0.5">Site Acknowledged</p>
                </div>
              </div>
            </div>
          </div>
        ) : printingSummary ? (
          /* Report Summary Print */
          <div className="space-y-6">
            <div className="bg-slate-50 border p-4 rounded-lg flex items-center justify-between text-xs">
              <div>
                <p><span className="font-bold text-gray-500">Report Type:</span> <span className="font-black text-blue-900 uppercase">{printingSummary.type}</span></p>
                <p className="mt-1"><span className="font-bold text-gray-500">Date Range:</span> <span className="font-black">{printingSummary.fromDate} to {printingSummary.toDate}</span></p>
              </div>
              <div className="text-right space-y-0.5">
                <p><span className="font-bold text-gray-500">Total Logs:</span> <span className="font-black">{printingSummary.stats.count}</span></p>
                <p><span className="font-bold text-gray-500">Total Vol:</span> <span className="font-black text-emerald-700">{printingSummary.stats.totalBatched.toFixed(1)} m³</span></p>
              </div>
            </div>

            {printingSummary.type === "Production Sheet" ? (
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase text-gray-700 tracking-wider">Grouped Production Metrics</h3>
                <table className="w-full text-[9px] border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Concrete Grade</th>
                      <th className="border border-gray-300 p-2 text-right">No. of Batches</th>
                      <th className="border border-gray-300 p-2 text-right">Ordered Qty (m³)</th>
                      <th className="border border-gray-300 p-2 text-right">Batched Qty (m³)</th>
                      <th className="border border-gray-300 p-2 text-right">Variance (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printingSummary.productionData.map((g: any) => (
                      <tr key={g.grade}>
                        <td className="border border-gray-300 p-2 font-black text-blue-900">{g.grade}</td>
                        <td className="border border-gray-300 p-2 text-right font-bold">{g.count}</td>
                        <td className="border border-gray-300 p-2 text-right">{g.qty.toFixed(1)}</td>
                        <td className="border border-gray-300 p-2 text-right font-black text-emerald-800">{g.batched.toFixed(1)}</td>
                        <td className="border border-gray-300 p-2 text-right font-bold text-blue-700">{g.variance}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-[11px] font-black uppercase text-gray-700 tracking-wider">Detailed Dispatch Log Sheet</h3>
                <table className="w-full text-[8px] border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-1.5 text-left">Batch No</th>
                      <th className="border border-gray-300 p-1.5 text-left">Date</th>
                      <th className="border border-gray-300 p-1.5 text-left">Customer</th>
                      <th className="border border-gray-300 p-1.5 text-left">Site</th>
                      <th className="border border-gray-300 p-1.5 text-left">Grade</th>
                      <th className="border border-gray-300 p-1.5 text-right">Qty (m³)</th>
                      <th className="border border-gray-300 p-1.5 text-right">Batched (m³)</th>
                      <th className="border border-gray-300 p-1.5 text-left">Vehicle No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printingSummary.allData.map((e: any) => (
                      <tr key={e._id || e.id}>
                        <td className="border border-gray-300 p-1.5 font-bold text-blue-900">{e.batchNo}</td>
                        <td className="border border-gray-300 p-1.5">{e.date}</td>
                        <td className="border border-gray-300 p-1.5 font-medium truncate max-w-[150px]">{e.customerName}</td>
                        <td className="border border-gray-300 p-1.5 truncate max-w-[100px]">{e.siteName}</td>
                        <td className="border border-gray-300 p-1.5 font-bold">{e.grade}</td>
                        <td className="border border-gray-300 p-1.5 text-right">{e.quantity}</td>
                        <td className="border border-gray-300 p-1.5 text-right font-bold text-emerald-800">{e.batchedQty}</td>
                        <td className="border border-gray-300 p-1.5 font-mono">{e.vehicleNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        <div className="absolute bottom-8 left-8 right-8 text-center border-t pt-4">
          <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest">
            Confidential Production Report Document • FORTUNE MIX ENTERPRISE PLATFORM
          </p>
        </div>
      </div>

      {/* ═══ SCREEN DISPLAY LAYOUT ═══ */}
      <QcLayout
        breadcrumbs={[
          { label: "Batching List", href: "/qc/batch/list" },
          { label: "Batching Report" }
        ]}
        title="BATCHING REPORT"
        activePath="/qc/batch/report"
      >

        {/* Dynamic Header Card with Filters */}
        <Card className="border shadow-sm bg-white shrink-0">
          <CardContent className="p-4 flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 min-w-[200px] flex-1">
              <Label className="text-xs font-black uppercase text-slate-700">
                Report Type <span className="text-red-500">*</span>
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="h-10 text-xs font-bold bg-white border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Production Sheet", "Date Wise", "Date With time Wise Report"].map((t) => (
                    <SelectItem key={t} value={t} className="font-bold text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <Label className="text-xs font-black uppercase text-slate-700">From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 text-xs font-semibold bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <Label className="text-xs font-black uppercase text-slate-700">To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 text-xs font-semibold bg-white border-slate-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-[#10b981] hover:bg-[#059669] text-white font-black px-6 h-10 shadow-sm shadow-emerald-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                {loading ? "Generating..." : "Generate"}
              </Button>
              <Button
                onClick={handleClear}
                className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-black px-5 h-10 shadow-sm shadow-red-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Output Card */}
        {generatedReport ? (
          <div className="flex-1 flex flex-col space-y-3 min-h-0">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-4 gap-3 shrink-0">
              <Card className="border rounded-lg p-2.5 flex items-center gap-3 shadow-sm bg-white">
                <div className="p-2 bg-blue-50 rounded-full">
                  <Layers className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                    Total Dispatch Logs
                  </p>
                  <p className="text-sm font-bold text-gray-800">{stats.count}</p>
                </div>
              </Card>
              <Card className="border rounded-lg p-2.5 flex items-center gap-3 shadow-sm bg-white">
                <div className="p-2 bg-emerald-50 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                    Ordered Target Vol
                  </p>
                  <p className="text-sm font-bold text-gray-800">{stats.totalQty.toFixed(1)} m³</p>
                </div>
              </Card>
              <Card className="border rounded-lg p-2.5 flex items-center gap-3 shadow-sm bg-white">
                <div className="p-2 bg-amber-50 rounded-full">
                  <Activity className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                    Batched Plant Vol
                  </p>
                  <p className="text-sm font-bold text-gray-800">{stats.totalBatched.toFixed(1)} m³</p>
                </div>
              </Card>
              <Card className="bg-[#1e40af] rounded-lg p-2.5 flex items-center gap-3 shadow-sm text-white">
                <div className="p-2 bg-white/20 rounded-full">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-tight">
                    Volumetric Variance
                  </p>
                  <p className="text-sm font-bold">{stats.variance}%</p>
                </div>
              </Card>
            </div>

            {/* Generated Data Sheet */}
            <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="uppercase tracking-tight text-[11px] font-extrabold text-blue-900">
                    {generatedReport.type} Report ({generatedReport.fromDate} to {generatedReport.toDate})
                  </span>
                </div>

                <ExportDropdown
                  onCopy={() => handleExport("copy")}
                  onCSV={() => handleExport("csv")}
                  onPDF={() => handleExport("pdf")}
                />
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-auto">
                {generatedReport.type === "Production Sheet" ? (
                  /* Production Sheet Layout: Grouped by Grade */
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-100/90 z-10">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 py-3.5 px-4">
                          Concrete Grade
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right">
                          No. of Batches
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right">
                          Total Ordered Qty
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right">
                          Total Batched Qty
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right">
                          Volumetric Variance
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionSheetData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-xs font-semibold text-slate-500">
                            No production data available for this range
                          </TableCell>
                        </TableRow>
                      ) : (
                        productionSheetData.map((item, idx) => (
                          <TableRow
                            key={item.grade}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                            }`}
                          >
                            <TableCell className="font-extrabold text-[#1e40af] text-xs py-3.5 px-4">
                              {item.grade}
                            </TableCell>
                            <TableCell className="font-bold text-slate-700 text-xs px-3 text-right">
                              {item.count}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-800 text-xs px-3 text-right">
                              {item.qty.toFixed(1)} m³
                            </TableCell>
                            <TableCell className="font-extrabold text-slate-900 text-xs px-3 text-right">
                              {item.batched.toFixed(1)} m³
                            </TableCell>
                            <TableCell
                              className={`text-xs font-black px-3 text-right ${
                                Number(item.variance) > 2 || Number(item.variance) < -2
                                  ? "text-rose-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {item.variance}%
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  /* Date Wise or Date with Time Wise List */
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-100/90 z-10">
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 py-3.5 px-4 whitespace-nowrap">
                          Batch No
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">
                          Date
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">
                          Customer
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">
                          Site
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">
                          Grade
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right whitespace-nowrap">
                          Target Qty
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right whitespace-nowrap">
                          Batched Qty
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">
                          Vehicle No
                        </TableHead>
                        <TableHead className="text-[11px] font-black uppercase text-slate-800 px-4 text-center whitespace-nowrap">
                          ACTION
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedReport.data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12 text-xs font-semibold text-slate-500">
                            No dispatch logs found in this date range
                          </TableCell>
                        </TableRow>
                      ) : (
                        generatedReport.data.map((item: any, index: number) => (
                          <TableRow
                            key={item._id || item.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                            }`}
                          >
                            <TableCell className="font-extrabold text-[#1e40af] text-xs py-3.5 px-4 whitespace-nowrap">
                              {item.batchNo}
                            </TableCell>
                            <TableCell className="font-bold text-slate-700 text-xs px-3 whitespace-nowrap">
                              {item.date}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-800 text-xs px-3 whitespace-nowrap max-w-[180px] truncate">
                              {item.customerName}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-slate-600 px-3 whitespace-nowrap max-w-[130px] truncate">
                              {item.siteName}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-slate-800 px-3 whitespace-nowrap">
                              {item.grade}
                            </TableCell>
                            <TableCell className="text-xs font-bold text-slate-800 px-3 text-right whitespace-nowrap">
                              {item.quantity} m³
                            </TableCell>
                            <TableCell className="text-xs font-black text-emerald-700 px-3 text-right whitespace-nowrap">
                              {item.batchedQty} m³
                            </TableCell>
                            <TableCell className="text-xs font-bold text-slate-700 px-3 whitespace-nowrap">
                              {item.vehicleNo}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-center whitespace-nowrap print:hidden">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleExport("copy", item)}
                                  className="h-7 w-7 text-slate-500 hover:bg-slate-100"
                                  title="Copy Row"
                                >
                                  <CopyIcon className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleExport("csv", item)}
                                  className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                                  title="Download CSV"
                                >
                                  <FileCode className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleExport("pdf", item)}
                                  className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                                  title="Print Record"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <div className="w-px h-4 bg-gray-200 mx-1" />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(item._id || item.id)}
                                  className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <Card className="border shadow-sm bg-white flex-1 flex flex-col items-center justify-center py-16 px-4">
            <Calendar className="h-12 w-12 text-slate-350 mb-3" />
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
              No Report Generated
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px] text-center font-medium">
              Select a report type and date range above, then click "Generate" to construct your sheet.
            </p>
          </Card>
        )}
      </QcLayout>
    </div>
  );
}
