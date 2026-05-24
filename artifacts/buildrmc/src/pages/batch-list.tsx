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
import { QcLayout, useQcFilters } from "@/components/qc-layout";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";
import { 
  ChevronRight, 
  Search, 
  RotateCcw, 
  Plus, 
  Copy as CopyIcon, 
  FileText, 
  FileCode, 
  Edit, 
  Trash2, 
  Layers,
  Printer,
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle2
} from "lucide-react";

export default function BatchList() {
  const { toast } = useToast();
  const { showFilters } = useQcFilters();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter States
  const [searchBatchNo, setSearchBatchNo] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("All Customer");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Printing State
  const [printingEntry, setPrintingEntry] = useState<any | null>(null);

  // Fetch Batch entries
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/batch-entries");
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        } else {
          toast({
            title: "Fetch Failed",
            description: "Failed to read batching entries from database.",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Connection Error",
          description: "Could not connect to API server.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [refreshKey]);

  // Extract dynamic customers list for filter dropdown
  const customerOptions = useMemo(() => {
    const custs = new Set(entries.map((e) => e.customerName));
    return ["All Customer", ...Array.from(custs)];
  }, [entries]);

  // Filter and Sort logs
  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        const matchesBatchNo =
          !searchBatchNo ||
          e.batchNo.toLowerCase().includes(searchBatchNo.toLowerCase());

        const matchesCustomer =
          filterCustomer === "All Customer" || e.customerName === filterCustomer;

        let matchesDate = true;
        if (fromDate) {
          const entryDate = new Date(e.date);
          const fDate = new Date(fromDate);
          // Set to midnight for clean comparison
          entryDate.setHours(0, 0, 0, 0);
          fDate.setHours(0, 0, 0, 0);
          if (entryDate < fDate) matchesDate = false;
        }
        if (toDate) {
          const entryDate = new Date(e.date);
          const tDate = new Date(toDate);
          entryDate.setHours(0, 0, 0, 0);
          tDate.setHours(0, 0, 0, 0);
          if (entryDate > tDate) matchesDate = false;
        }

        return matchesBatchNo && matchesCustomer && matchesDate;
      })
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [entries, searchBatchNo, filterCustomer, fromDate, toDate]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Stats Calculations
  const stats = useMemo(() => {
    const totalQty = entries.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const totalBatched = entries.reduce((acc, curr) => acc + (Number(curr.batchedQty) || 0), 0);
    const variance = totalQty > 0 ? (((totalBatched - totalQty) / totalQty) * 100).toFixed(2) : "0.00";
    return {
      totalQty,
      totalBatched,
      variance,
      count: entries.length,
    };
  }, [entries]);

  // Clear Filters
  const handleClear = () => {
    setSearchBatchNo("");
    setFromDate("");
    setToDate("");
    setFilterCustomer("All Customer");
    setCurrentPage(1);
    toast({
      title: "Filters Cleared",
      description: "Showing all ready-mix concrete batch entries.",
    });
  };

  // Delete Individual Entry
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch log?")) return;
    try {
      const res = await fetch(`/api/batch-entries/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries(entries.filter((e) => e.id !== id && e._id !== id));
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

  // Clear Duplicate Batch Entries
  const handleClearDuplicates = async () => {
    try {
      const res = await fetch("/api/batch-entries/clear-duplicates", {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Duplicates Cleared",
          description: result.message || `Successfully removed duplicates.`,
        });
        setRefreshKey((k) => k + 1);
      } else {
        toast({
          title: "Operation Failed",
          description: "Failed to clear duplicate batch entries.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run duplicate clearing script.",
        variant: "destructive",
      });
    }
  };

  // Export functions (Copy, CSV, PDF)
  const handleExport = (type: string, specificEntry?: any) => {
    const dataToExport = specificEntry ? [specificEntry] : filtered;
    const headers = [
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
    const rows = dataToExport.map((e) => [
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

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${val}"`).join(","))
      .join("\n");

    if (type === "copy") {
      navigator.clipboard.writeText(csvContent);
      toast({
        title: "Success",
        description: `Copied ${dataToExport.length} batch log(s) to clipboard as CSV.`,
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
          : `batch_production_logs.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "CSV Downloaded",
        description: "File successfully generated and downloaded.",
      });
    } else if (type === "pdf") {
      setPrintingEntry(specificEntry || null);
      setTimeout(() => {
        window.print();
      }, 100);
    }
  };

  return (
    <>
      <div className="hidden print:block absolute inset-0 bg-white z-[9999] p-8 text-black">
        <PrintHeader />
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">
              {printingEntry ? "BATCH DELIVERY TICKET" : "BATCH PRODUCTION REPORT"}
            </h2>
            <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
              {printingEntry ? `TICKET NO: ${printingEntry.ticketNo}` : "SUMMARY DETAILS"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-gray-500 mt-1">
              Print Date: {new Date().toLocaleDateString()}
            </p>
            <p className="text-[9px] font-bold text-blue-600">
              Doc ID: RMC/BATCH/{Math.floor(Math.random() * 9000) + 1000}
            </p>
          </div>
        </div>

        {printingEntry ? (
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
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-blue-900 border-b pb-2 uppercase tracking-wide">
              Production Log Sheet
            </h3>
            <table className="w-full text-[9px] border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Batch No</th>
                  <th className="border border-gray-300 p-2 text-left">Date</th>
                  <th className="border border-gray-300 p-2 text-left">Customer</th>
                  <th className="border border-gray-300 p-2 text-left">Site</th>
                  <th className="border border-gray-300 p-2 text-left">Grade</th>
                  <th className="border border-gray-300 p-2 text-right">Qty (m³)</th>
                  <th className="border border-gray-300 p-2 text-right">Batched (m³)</th>
                  <th className="border border-gray-300 p-2 text-left">Vehicle No</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item._id || item.id}>
                    <td className="border border-gray-300 p-2 font-bold text-blue-900">{item.batchNo}</td>
                    <td className="border border-gray-300 p-2">{item.date}</td>
                    <td className="border border-gray-300 p-2 font-medium">{item.customerName}</td>
                    <td className="border border-gray-300 p-2">{item.siteName}</td>
                    <td className="border border-gray-300 p-2 font-bold">{item.grade}</td>
                    <td className="border border-gray-300 p-2 text-right">{item.quantity}</td>
                    <td className="border border-gray-300 p-2 text-right font-bold text-emerald-800">
                      {item.batchedQty}
                    </td>
                    <td className="border border-gray-300 p-2 font-mono">{item.vehicleNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="absolute bottom-8 left-8 right-8 text-center border-t pt-4">
          <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest">
            Confidential QC Batching Log Document • FORTUNE MIX ENTERPRISE PLATFORM
          </p>
        </div>
      </div>

      {/* ═══ SCREEN SCREEN LAYOUT (Print hidden) ═══ */}
      <QcLayout
        breadcrumbs={[{ label: "Batching List" }]}
        title="BATCHING LIST"
        activePath="/qc/batch/list"
      >

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          <Card className="border rounded-lg p-2.5 flex items-center gap-3 shadow-sm bg-white">
            <div className="p-2 bg-blue-50 rounded-full">
              <Layers className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                Total Logs
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
                Total Target Qty
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
                Total Batched Qty
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
                Qty Variance
              </p>
              <p className="text-sm font-bold">{stats.variance}%</p>
            </div>
          </Card>
        </div>

        {/* Embedded Batch List Table Card */}
        <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Filters Row */}
          {showFilters && (
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 min-w-[200px] flex-1">
              <Label className="text-xs font-black uppercase text-slate-700">Batch No</Label>
              <Input
                value={searchBatchNo}
                onChange={(e) => {
                  setSearchBatchNo(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Enter Batch No"
                className="h-10 text-xs font-semibold bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-700">From Date :</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 text-xs font-semibold bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-700">To Date :</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 text-xs font-semibold bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5 min-w-[180px]">
              <Label className="text-xs font-black uppercase text-slate-700">Customer :</Label>
              <Select
                value={filterCustomer}
                onValueChange={(v) => {
                  setFilterCustomer(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs font-bold bg-white border-slate-300">
                  <SelectValue placeholder="All Customer" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((c) => (
                    <SelectItem key={c} value={c} className="font-bold text-xs">
                      {c === "All Customer" ? "All Customer" : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(1)}
                className="bg-[#10b981] hover:bg-[#059669] text-white font-black px-6 h-10 shadow-sm shadow-emerald-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
              <Button
                onClick={handleClear}
                className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-black px-5 h-10 shadow-sm shadow-red-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" /> Clear
              </Button>
              <Button
                onClick={handleClearDuplicates}
                className="bg-[#eab308] hover:bg-[#ca8a04] text-white font-black px-5 h-10 shadow-sm shadow-yellow-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" /> Clear Duplicate
              </Button>
            </div>
          </div>
          )}

          {/* Toolbar Row */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white flex-wrap gap-4 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>Show</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-16 h-8 text-xs font-black bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)} className="font-bold">
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>

            <ExportDropdown
              onCopy={() => handleExport("copy")}
              onCSV={() => handleExport("csv")}
              onPDF={() => handleExport("pdf")}
            />
          </div>

          {/* Data Grid Table */}
          <div className="flex-1 overflow-auto bg-white">
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
                    Quantity
                  </TableHead>
                  <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 text-right whitespace-nowrap">
                    Batched Quantity
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-xs font-semibold text-slate-500">
                      Loading logs from MongoDB Atlas...
                    </TableCell>
                  </TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-xs font-semibold text-slate-500">
                      No data available in table
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((item, index) => (
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
                      <TableCell className="font-semibold text-slate-800 text-xs px-3 whitespace-nowrap max-w-[200px] truncate">
                        {item.customerName}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-600 px-3 whitespace-nowrap max-w-[150px] truncate">
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
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-4 shrink-0">
            <div className="text-xs font-bold text-slate-600">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="text-xs font-black px-3 h-8 text-slate-600 hover:bg-slate-100"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`text-xs font-black w-8 h-8 ${
                    currentPage === pageNum
                      ? "bg-[#0ea5e9] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {pageNum}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="text-xs font-black px-3 h-8 text-slate-600 hover:bg-slate-100"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </QcLayout>
    </>
  );
}
