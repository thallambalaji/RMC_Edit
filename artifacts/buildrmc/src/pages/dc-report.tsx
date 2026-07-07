import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useGetDCs, useGetCustomers, useGetMasters } from "@workspace/api-client-react";
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
  ChevronRight,
  Loader2,
  FileText,
  RotateCcw,
  Printer,
  TruckIcon,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Download,
  Home,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const REPORT_TYPES = ["Date Wise", "Customer Wise", "Plant Wise", "Grade Wise"];

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Try ISO first
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) return iso;
  return null;
}

export default function DCReport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDC, setSelectedDC] = useState<any>(null);
  const [printDC, setPrintDC] = useState<any>(null);
  const headerStyle = "bg-[#ea580c] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";

  const [reportType, setReportType] = useState("Date Wise");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedItem, setSelectedItem] = useState("All Item");
  const [selectedPlant, setSelectedPlant] = useState("All Plant");
  const [showReport, setShowReport] = useState(false);

  const { data: dcs, isLoading: dcsLoading } = useGetDCs();
  const { data: customers } = useGetCustomers();
  const { data: dbPlants } = useGetMasters("plant");
  const { data: dbGrades } = useGetMasters("grade");

  const customerMap = useMemo(() => {
    const map: Record<string, string> = {};
    customers?.forEach((c: any) => {
      map[String(c.id || c._id)] = c.name;
    });
    return map;
  }, [customers]);

  // Derive unique grades from live DC data + master grades (no hardcoded values)
  const availableGrades = useMemo(() => {
    const grades = new Set<string>();
    dbGrades?.forEach((g: any) => { if (g.name) grades.add(g.name); });
    dcs?.forEach((dc: any) => { if (dc.grade) grades.add(dc.grade); });
    return ["All Item", ...Array.from(grades)];
  }, [dcs, dbGrades]);

  // Derive available plants from masters (no hardcoded values)
  const availablePlants = useMemo(() => {
    const plants = new Set<string>();
    dbPlants?.forEach((p: any) => { if (p.name) plants.add(p.name); });
    dcs?.forEach((dc: any) => { if (dc.plant) plants.add(dc.plant); });
    return ["All Plant", ...Array.from(plants)];
  }, [dbPlants, dcs]);

  const handleGenerate = () => {
    if (!fromDate || !toDate) {
      alert("Please select both From Date and To Date.");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      alert("From Date cannot be after To Date.");
      return;
    }
    setShowReport(true);
  };

  const handleClear = () => {
    setReportType("Date Wise");
    setFromDate("");
    setToDate("");
    setSelectedItem("All Item");
    setSelectedPlant("All Plant");
    setShowReport(false);
  };

  const handleEditRow = (row: any) => {
    toast({
      title: "Edit Restricted",
      description: `Delivery challan ${row.dcNumber} is finalized. Modification requires supervisor override.`,
      variant: "destructive"
    });
  };

  const handlePrintSingleRow = (row: any) => {
    setPrintDC(row);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDeleteRow = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this Delivery Challan?")) return;
    try {
      const res = await fetch(`/api/delivery-challans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete Delivery Challan");
      toast({ title: "Success", description: "Delivery Challan deleted successfully!" });
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleCopyRow = (row: any) => {
    const text = `DC No: ${row.dcNumber}\nCustomer: ${row.customerName || "-"}\nPlant: ${row.plant}\nGrade: ${row.grade}\nQty: ${row.quantity} m³\nNet Amount: ₹${row.netAmount}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "DC details copied to clipboard." });
  };

  const handleExportRowCSV = (row: any) => {
    const csvContent = `DC No,Customer,Plant,Grade,Qty,Net Amount\n"${row.dcNumber}","${row.customerName || "-"}","${row.plant}","${row.grade}","${row.quantity} m³","₹${row.netAmount}"`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `dc_${row.dcNumber?.replace(/\//g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful" });
  };

  const handleCopy = () => {
    if (!filteredDCs.length) {
      toast({ title: "No data to copy", variant: "destructive" });
      return;
    }
    const headers = ["DC No", "DC Date", "DC Time", "Customer", "Plant", "Grade", "Qty (m³)", "Net Amount", "Status"];
    const rows = filteredDCs.map((dc: any) => [
      dc.dcNumber,
      formatDate(dc.dcDate),
      dc.dcTime || "-",
      dc.customerName || customerMap[String(dc.customerId?._id || dc.customerId)] || "-",
      dc.plant || "-",
      dc.grade || "-",
      dc.quantity || 0,
      dc.netAmount || 0,
      dc.status || "Active"
    ]);
    const text = [headers, ...rows].map(r => r.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Report data saved to clipboard." });
  };

  const handleExportCSV = () => {
    if (!filteredDCs.length) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }
    const headers = ["DC No", "DC Date", "DC Time", "Customer", "Plant", "Grade", "Qty (m³)", "Net Amount", "Status"];
    const rows = filteredDCs.map((dc: any) => [
      `"${(dc.dcNumber || "").replace(/"/g, '""')}"`,
      `"${formatDate(dc.dcDate)}"`,
      `"${(dc.dcTime || "-").replace(/"/g, '""')}"`,
      `"${(dc.customerName || customerMap[String(dc.customerId?._id || dc.customerId)] || "-").replace(/"/g, '""')}"`,
      `"${(dc.plant || "-").replace(/"/g, '""')}"`,
      `"${(dc.grade || "-").replace(/"/g, '""')}"`,
      dc.quantity || 0,
      dc.netAmount || 0,
      `"${(dc.status || "Active").replace(/"/g, '""')}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dc_report_${Date.now()}.csv`;
    link.click();
    toast({ title: "Export Successful" });
  };

  const filteredDCs = useMemo(() => {
    if (!dcs) return [];
    return dcs.filter((dc: any) => {
      // Date filter
      if (fromDate && toDate) {
        const dcDate = parseDate(dc.dcDate);
        const from = parseDate(fromDate);
        const to = parseDate(toDate);
        if (dcDate && from && to) {
          // Set end-of-day for 'to'
          const toEnd = new Date(to);
          toEnd.setHours(23, 59, 59, 999);
          if (dcDate < from || dcDate > toEnd) return false;
        }
      }
      // Grade / Item filter
      if (selectedItem !== "All Item" && dc.grade !== selectedItem) return false;
      // Plant filter
      if (selectedPlant !== "All Plant" && dc.plant !== selectedPlant) return false;
      return true;
    });
  }, [dcs, fromDate, toDate, selectedItem, selectedPlant]);

  const totalQty = useMemo(
    () => filteredDCs.reduce((sum: number, dc: any) => sum + (Number(dc.quantity) || 0), 0),
    [filteredDCs]
  );
  const totalAmount = useMemo(
    () => filteredDCs.reduce((sum: number, dc: any) => sum + (Number(dc.netAmount) || 0), 0),
    [filteredDCs]
  );

  return (
    <div className="space-y-4 print:bg-white print:p-0 print:m-0">
      <div className={`space-y-4 ${printDC ? "print:hidden" : ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between bg-white py-3.5 px-5 rounded-lg border border-slate-200 shadow-sm shrink-0 print:hidden">
          <div className="flex items-center">
            <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-wider select-none">
              DC Report
            </h2>
            <div className="h-4 w-px bg-slate-300 mx-4" />
            <nav className="text-[10px] text-slate-500 flex items-center uppercase font-bold tracking-widest select-none">
              <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5 text-slate-500" />
                <span>HOME</span>
              </Link>
              <span className="text-slate-400 font-black mx-2.5">&gt;</span>
              <Link href="/dc" className="hover:text-[#ea580c] transition-colors">
                DC
              </Link>
              <span className="text-slate-400 font-black mx-2.5">&gt;</span>
              <span className="text-[#ea580c] font-black">DC REPORT</span>
            </nav>
          </div>

          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-black text-slate-800 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 px-3 rounded shadow-xs"
              onClick={handleGenerate}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-700"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters
            </Button>
          </div>
        </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          {/* Report Category (static) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Report Category <span className="text-rose-500">*</span>
            </Label>
            <Select value="DC Report" onValueChange={() => {}}>
              <SelectTrigger className="bg-white h-10 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DC Report">DC Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Report Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Report Type <span className="text-rose-500">*</span>
            </Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="bg-white h-10 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Date */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">From Date</Label>
            <Input
              type="date"
              className="bg-white h-10 border-gray-300"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setShowReport(false); }}
            />
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">To Date</Label>
            <Input
              type="date"
              className="bg-white h-10 border-gray-300"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setShowReport(false); }}
            />
          </div>

          {/* Item / Grade */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Item <span className="text-rose-500">*</span>
            </Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="bg-white h-10 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableGrades.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plant */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Plant <span className="text-rose-500">*</span>
            </Label>
            <Select value={selectedPlant} onValueChange={setSelectedPlant}>
              <SelectTrigger className="bg-white h-10 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availablePlants.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleGenerate}
            disabled={dcsLoading}
            className="bg-[#ea580c] hover:bg-[#d97706] text-white px-8 h-10 font-bold uppercase tracking-wide shadow-sm"
          >
            {dcsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generate
          </Button>
          <Button
            onClick={handleClear}
            className="bg-rose-500 hover:bg-rose-600 text-white px-8 h-10 font-bold uppercase tracking-wide shadow-sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Report Output */}
      {showReport ? (
        <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 print:shadow-none print:border-none print:overflow-visible">
          
          {/* Printable Header (Only visible during print) */}
          <div className="hidden print:block mb-6">
            <PrintHeader />
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#ea580c]">DC Report - {reportType}</h2>
              <div className="text-right text-[10px] font-bold text-gray-600">
                <span>Printed Date: {new Date().toLocaleDateString()}</span>
                { (fromDate || toDate) && <span> &nbsp;|&nbsp; Period: {fromDate ? formatDate(fromDate) : "Start"} to {toDate ? formatDate(toDate) : "End"}</span> }
              </div>
            </div>
            {(selectedPlant !== "All Plant" || selectedItem !== "All Item") && (
              <p className="text-xs text-gray-500 font-bold mt-1 uppercase">
                {selectedPlant !== "All Plant" && `Plant: ${selectedPlant}`} 
                {selectedPlant !== "All Plant" && selectedItem !== "All Item" && ` | `}
                {selectedItem !== "All Item" && `Item: ${selectedItem}`}
              </p>
            )}
          </div>

          {/* Report Header */}
          <div className="bg-[#ea580c] p-4 flex items-center justify-between text-white print:hidden">
            <div>
              <h3 className="font-bold uppercase tracking-wider flex items-center gap-2">
                <TruckIcon className="h-5 w-5" />
                DC Report — {reportType}
              </h3>
              {fromDate && toDate && (
                <p className="text-xs text-orange-200 mt-0.5">
                  Period: {formatDate(fromDate)} to {formatDate(toDate)}
                  {selectedPlant !== "All Plant" && `  ·  Plant: ${selectedPlant}`}
                  {selectedItem !== "All Item" && `  ·  Item: ${selectedItem}`}
                </p>
              )}
            </div>
            <ExportDropdown
              onCopy={handleCopy}
              onCSV={handleExportCSV}
              onPDF={() => window.print()}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto print:overflow-visible">
            <Table className="print:text-xs">
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent print:border-b-2 print:border-gray-800 print:bg-transparent">
                  <TableHead className={`${headerStyle} w-12`}>S/L</TableHead>
                  <TableHead className={`${headerStyle} text-left`}>DC No</TableHead>
                  <TableHead className={`${headerStyle} text-left`}>DC Date</TableHead>
                  <TableHead className={`${headerStyle} text-left`}>DC Time</TableHead>
                  <TableHead className={`${headerStyle} text-left`}>Customer</TableHead>
                  <TableHead className={`${headerStyle} text-left`}>Plant</TableHead>
                  <TableHead className={`${headerStyle} text-left`}>Grade</TableHead>
                  <TableHead className={`${headerStyle} text-right`}>Qty (m³)</TableHead>
                  <TableHead className={`${headerStyle} text-right`}>Net Amount</TableHead>
                  <TableHead className={headerStyle}>Status</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter print:hidden">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDCs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-32 text-center text-gray-400 italic">
                      No DC records found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDCs.map((dc: any, idx: number) => (
                    <TableRow key={dc.id || dc._id} className="hover:bg-gray-50/50 print:border-b print:border-gray-200">
                      <TableCell className="text-center font-medium border-r border-gray-100 print:px-2">
                        {idx + 1}
                      </TableCell>
                      <TableCell 
                        onClick={() => setSelectedDC(dc)} 
                        className="font-bold text-[#ea580c] border-r border-gray-100 print:text-black print:px-2 cursor-pointer hover:underline hover:text-[#ea580c]"
                        title="Click to view details"
                      >
                        {dc.dcNumber}
                      </TableCell>
                      <TableCell className="border-r border-gray-100 print:px-2">
                        {formatDate(dc.dcDate)}
                      </TableCell>
                      <TableCell className="border-r border-gray-100 text-gray-500 text-sm print:text-black print:px-2">
                        {dc.dcTime || "-"}
                      </TableCell>
                      <TableCell className="border-r border-gray-100 font-medium print:px-2 max-w-[200px] truncate print:whitespace-normal">
                        {dc.customerName ||
                          customerMap[String(dc.customerId?._id || dc.customerId)] ||
                          "-"}
                      </TableCell>
                      <TableCell className="border-r border-gray-100 text-sm print:px-2">
                        {dc.plant || "-"}
                      </TableCell>
                      <TableCell className="border-r border-gray-100 print:px-2">
                        <span className="px-2 py-0.5 rounded bg-orange-50/40 text-[#ea580c] text-xs font-bold print:bg-transparent print:text-black print:p-0">
                          {dc.grade || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-gray-100 text-right font-semibold text-[#ea580c] print:text-black print:px-2">
                        {Number(dc.quantity || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="border-r border-gray-100 text-right font-semibold print:px-2">
                        ₹{Number(dc.netAmount || 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-center print:px-2 border-r border-gray-100">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase print:bg-transparent print:text-black print:p-0 ${
                            dc.status === "completed" || dc.status === "delivered"
                              ? "bg-emerald-100 text-emerald-700"
                              : dc.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {dc.status || "pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-3 print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Print (Printer Icon) */}
                          <Button 
                            onClick={() => handlePrintSingleRow(dc)}
                            title="Print DC Slip" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          {/* 2. CSV (Download Icon) */}
                          <Button 
                            onClick={() => handleExportRowCSV(dc)}
                            title="Download CSV" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          {/* 3. Copy (Copy Icon) */}
                          <Button 
                            onClick={() => handleCopyRow(dc)}
                            title="Copy Details" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-orange-50/40 text-[#ea580c] hover:text-[#ea580c] cursor-pointer"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          {/* 4. Edit (Pencil Icon) */}
                          <Button 
                            onClick={() => handleEditRow(dc)}
                            title="Edit Record" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-orange-50/40 text-[#ea580c] hover:text-[#ea580c] cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* 5. Delete (Trash Icon) */}
                          <Button 
                            onClick={() => handleDeleteRow(dc.id || dc._id)}
                            title="Delete Record" 
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

          {/* Summary Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between print:hidden">
            <p className="text-sm text-gray-500">
              Total Records:{" "}
              <span className="font-bold text-gray-800">{filteredDCs.length}</span>
            </p>
            <div className="flex gap-8">
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                  Total Quantity
                </p>
                <p className="text-xl font-black text-[#ea580c]">
                  {totalQty.toFixed(2)} m³
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                  Total Amount
                </p>
                <p className="text-xl font-black text-[#ea580c]">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Printable Footer (Only visible during print) */}
          <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t-2 border-gray-800">
            <div className="text-sm font-bold text-gray-600">
              Total Records: {filteredDCs.length} <br/>
              Total Quantity: {totalQty.toFixed(2)} m³ <br/>
              Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-center space-y-8">
              <div className="w-48 border-b border-gray-400"></div>
              <p className="text-sm font-bold text-gray-800 uppercase">Authorized Signatory</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-gray-300 italic border-2 border-dashed border-gray-100 rounded-lg gap-4 bg-gray-50/30">
          <TruckIcon className="h-12 w-12 text-gray-200" />
          <p>Select filters and click "Generate" to view the DC report</p>
        </div>
      )}
    </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedDC} onOpenChange={(open) => !open && setSelectedDC(null)}>
        <DialogContent className="max-w-2xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl border-b border-slate-100 pb-2">Delivery Challan Details - {selectedDC?.dcNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-3">
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">DC Number:</span> <div className="font-medium text-slate-800 font-mono font-bold text-[#ea580c]">{selectedDC?.dcNumber}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Challan Date:</span> <div className="font-medium text-slate-800">{selectedDC?.dcDate ? formatDate(selectedDC.dcDate) : "-"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Customer:</span> <div className="font-medium text-slate-800">{selectedDC?.customerName || customerMap[String(selectedDC?.customerId?._id || selectedDC?.customerId)] || "-"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Delivery Plant:</span> <div className="font-medium text-slate-800">{selectedDC?.plant || "-"}</div></div>
              </div>
              <div className="space-y-3">
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Material Grade:</span> <div className="font-medium text-slate-800">{selectedDC?.grade || "-"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Quantity Supplied:</span> <div className="font-medium text-slate-800 font-bold text-slate-700">{selectedDC?.quantity || 0} m³</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Net Amount:</span> <div className="font-medium text-slate-800 font-bold text-emerald-600">₹{Number(selectedDC?.netAmount || 0).toLocaleString("en-IN")}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Active Status:</span> <div className="font-medium text-slate-800 uppercase font-bold text-[11px] text-amber-600">{selectedDC?.status || "pending"}</div></div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <Button onClick={() => setSelectedDC(null)} size="sm" className="bg-slate-800 hover:bg-slate-900 text-white shadow-md">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branded Single Delivery Challan Sheet for Printing */}
      {printDC && (
        <div className="hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#ea580c]">Delivery Challan Identity Details</h2>
            <div className="text-right">
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 font-black text-[9px] uppercase tracking-wider border rounded font-sans">DELIVERY CHALLAN</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#ea580c] uppercase text-[10px] tracking-wider mb-2">Challan Details</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">DC Number: <span className="font-black text-gray-900">{printDC.dcNumber}</span></p>
                <p className="text-xs font-bold text-gray-700">Time of Dispatch: <span className="font-medium text-gray-900">{printDC.dcTime || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Supplied From: <span className="font-medium text-gray-900">{printDC.plant || "FORTUNE CONCRETE"}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#ea580c] uppercase text-[10px] tracking-wider mb-2">Customer Info</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Customer: <span className="font-black text-gray-900">{printDC.customerName || customerMap[String(printDC.customerId?._id || printDC.customerId)] || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Material Grade: <span className="font-medium text-gray-900">{printDC.grade || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Status: <span className="font-medium text-gray-900 uppercase font-bold text-xs text-[#ea580c]">{printDC.status || "completed"}</span></p>
              </div>
            </div>
          </div>

          {/* Delivery Challan Table */}
          <table className="w-full border collapse text-left mb-6">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider">
                <th className="border p-2">Item Description</th>
                <th className="border p-2 text-right">Quantity (m³)</th>
                <th className="border p-2 text-right">Unit Rate</th>
                <th className="border p-2 text-right">Net Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-xs">
                <td className="border p-2 font-bold text-gray-700">Ready Mix Concrete {printDC.grade}</td>
                <td className="border p-2 text-right font-semibold">{printDC.quantity || 0} m³</td>
                <td className="border p-2 text-right font-semibold">₹{(Number(printDC.netAmount || 0) / (Number(printDC.quantity) || 1)).toFixed(2)}</td>
                <td className="border p-2 text-right font-bold text-[#ea580c]">₹{Number(printDC.netAmount || 0).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-12 pt-8 border-t flex justify-between items-end">
            <div>
              <p className="text-[9px] text-gray-400">All materials delivered conform with IS 456 / IS 4926 standard practices.</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Receiver Signature</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-[#ea580c] tracking-wider">Authorized Officer</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
