import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { 
  ChevronRight, Search, RotateCcw, Eye, FileText, Calendar, 
  Clock, History, Loader2, Info, ArrowLeftRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { StoreLayout } from "@/components/store-layout";
import { ExportDropdown } from "@/components/export-dropdown";

export default function InventoryModifiedList() {
  const { toast } = useToast();
  const headerStyle = "bg-[#1e40af] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";

  // Data States
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [inventoryNoFilter, setInventoryNoFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");

  // Applied Filter States
  const [appliedInvNo, setAppliedInvNo] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  // Pagination & Display Size
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Fetch modification logs on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const data = await customFetch("/api/store-inventories-history");
      setHistoryLogs(data as any[]);
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: "Failed to load inventory modifications history.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Logic
  const filteredLogs = useMemo(() => {
    return historyLogs.filter((log) => {
      // 1. Inventory No
      if (appliedInvNo && !log.inventoryNo?.toLowerCase().includes(appliedInvNo.toLowerCase())) {
        return false;
      }

      // 2. Date Ranges
      const logDate = new Date(log.modifiedTime || log.createdAt);
      logDate.setHours(0, 0, 0, 0);

      if (appliedFromDate) {
        const fromDate = new Date(appliedFromDate);
        fromDate.setHours(0, 0, 0, 0);
        if (logDate < fromDate) return false;
      }

      if (appliedToDate) {
        const toDate = new Date(appliedToDate);
        toDate.setHours(0, 0, 0, 0);
        if (logDate > toDate) return false;
      }

      return true;
    });
  }, [historyLogs, appliedInvNo, appliedFromDate, appliedToDate]);

  const handleSearch = () => {
    setAppliedInvNo(inventoryNoFilter);
    setAppliedFromDate(fromDateFilter);
    setAppliedToDate(toDateFilter);
    setCurrentPage(1);
    toast({ title: "Filters Applied 🔍", description: "History table updated." });
  };

  const handleClear = () => {
    setInventoryNoFilter("");
    setFromDateFilter("");
    setToDateFilter("");

    setAppliedInvNo("");
    setAppliedFromDate("");
    setAppliedToDate("");
    
    setCurrentPage(1);
    toast({ title: "Filters Cleared 🧹", description: "Showing all history logs." });
  };

  // Pagination Calculations
  const totalEntries = filteredLogs.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIdx, startIdx + pageSize);
  }, [currentPage, pageSize, filteredLogs]);

  // Bulk Actions
  const handleCopyAll = () => {
    if (filteredLogs.length === 0) return;
    const headers = "S/L No\tInventory No\tModified Time\tModification Type\tModified By\tComment";
    const rows = filteredLogs.map((log, idx) => {
      const serialNo = totalEntries - idx;
      const dateStr = log.modifiedTime ? new Date(log.modifiedTime).toLocaleString() : "";
      return `${serialNo}\t${log.inventoryNo}\t${dateStr}\t${log.modificationType}\t${log.modifiedBy}\t${log.comment}`;
    }).join("\n");
    navigator.clipboard.writeText(`${headers}\n${rows}`);
    toast({ title: "Copied to Clipboard 📋" });
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ["S/L No", "Inventory No", "Modified Time", "Modification Type", "Modified By", "Comment"];
    const rows = filteredLogs.map((log, idx) => [
      totalEntries - idx,
      `"${log.inventoryNo}"`,
      `"${log.modifiedTime ? new Date(log.modifiedTime).toLocaleString() : ""}"`,
      `"${log.modificationType}"`,
      `"${log.modifiedBy}"`,
      `"${log.comment}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "inventory_modifications_register.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded 📊" });
  };

  // History Comparison Helpers
  const getStartYear = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("-");
    if (parts[0] && parts[0].length === 4) return parts[0];
    const slParts = dateStr.split("/");
    if (slParts[2] && slParts[2].length === 4) return slParts[2];
    return "2026";
  };

  const getEndYear = (dateStr: string) => {
    const start = getStartYear(dateStr);
    if (start === "N/A") return "N/A";
    return String(Number(start) + 1);
  };

  const getCompareValue = (data: any, key: string) => {
    if (!data) return "N/A";
    
    // Virtual Keys
    if (key === "start year") {
      return getStartYear(data.inventoryDate);
    }
    if (key === "end year") {
      return getEndYear(data.inventoryDate);
    }
    if (key === "plant name") {
      return data.plant || "N/A";
    }

    // Normal Keys mapping
    const mapping: Record<string, string> = {
      "inventory no": "inventoryNo",
      "supplier name": "supplierName",
      "item name": "itemName",
      "empty weight": "emptyWeight",
      "loaded weight": "loadedWeight",
      "net weight": "netWeight",
      "supplier weight": "supplierWeight",
      "inventory date": "inventoryDate",
      "inventory time": "inventoryTime",
      "bill no": "billNo",
      "royalty no": "royaltyNo",
      "amount": "amount",
      "vehicle no": "vehicleNo",
      "gatepass no": "gatepassNo",
    };

    const dbKey = mapping[key] || key;
    const val = data[dbKey];
    if (val === undefined || val === null || val === "") return "N/A";
    return String(val);
  };

  const isFieldChanged = (oldData: any, newData: any, key: string) => {
    const oldVal = getCompareValue(oldData, key);
    const newVal = getCompareValue(newData, key);
    return oldVal !== newVal;
  };

  const COMPARISON_ROWS = [
    "inventory no",
    "supplier name",
    "item name",
    "empty weight",
    "loaded weight",
    "net weight",
    "supplier weight",
    "inventory date",
    "inventory time",
    "bill no",
    "royalty no",
    "amount",
    "vehicle no",
    "plant name",
    "start year",
    "end year",
    "gatepass no",
  ];

  return (
    <StoreLayout title="Inventory Modified List" breadcrumbs={[{ label: "Modified List" }]}>
      <div className="space-y-4 animate-in fade-in duration-500">

      {/* Filters Toolbar */}
      <div className="bg-white p-5 rounded-xl border shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          
          {/* Inventory No */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Inventory No</Label>
            <Input 
              value={inventoryNoFilter}
              onChange={(e) => setInventoryNoFilter(e.target.value)}
              placeholder="Enter Inventory No" 
              className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm"
            />
          </div>

          {/* From Date */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">From Date :</Label>
            <div className="relative">
              <Input 
                type="date"
                value={fromDateFilter}
                onChange={(e) => setFromDateFilter(e.target.value)}
                className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm pr-10"
              />
              <Calendar className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* To Date */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">To Date :</Label>
            <div className="relative">
              <Input 
                type="date"
                value={toDateFilter}
                onChange={(e) => setToDateFilter(e.target.value)}
                className="h-10 text-sm font-semibold bg-white border-slate-200 text-slate-700 shadow-sm pr-10"
              />
              <Calendar className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Filters Buttons */}
        <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
          <Button 
            onClick={handleSearch} 
            className="bg-[#00bcd4] hover:bg-[#00acc1] text-white font-extrabold text-xs tracking-wider uppercase h-10 px-5 gap-1.5 shadow-md cursor-pointer border-0"
          >
            <Search className="h-4 w-4" /> Search
          </Button>
          <Button 
            onClick={handleClear} 
            className="bg-[#e91e63] hover:bg-[#d81b60] text-white font-extrabold text-xs tracking-wider uppercase h-10 px-5 gap-1.5 shadow-md cursor-pointer border-0"
          >
            <RotateCcw className="h-4 w-4" /> Clear
          </Button>
          <Link href="/store/inventory/list">
            <Button 
              className="bg-[#00acc1] hover:bg-[#0097a7] text-white font-extrabold text-xs tracking-wider uppercase h-10 px-5 gap-1.5 shadow-md cursor-pointer border-0"
            >
              <FileText className="h-4 w-4" /> Inventory List
            </Button>
          </Link>
        </div>
      </div>

      {/* Table Display Card */}
      <div className="bg-white rounded-xl border shadow-md overflow-hidden flex flex-col">
        
        {/* Table Toolbar Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          {/* Show entries select */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-black">Show</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-20 h-8 bg-white border-slate-200 text-slate-600 text-xs font-bold shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-black">entries</span>
          </div>

          <ExportDropdown 
            onCopy={handleCopyAll}
            onCSV={handleExportCSV}
            onPDF={() => window.print()}
          />
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className={headerStyle}>S/L No</TableHead>
                <TableHead className={headerStyle}>Inventory No</TableHead>
                <TableHead className={headerStyle}>Modified Time</TableHead>
                <TableHead className={headerStyle}>Modification Type</TableHead>
                <TableHead className={headerStyle}>Modified By</TableHead>
                <TableHead className={headerStyle}>Comment</TableHead>
                <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter w-[70px]">OPTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-[#00bcd4]" />
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading modifications...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-slate-400 italic">
                    No modifications logged in database yet.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((row, idx) => {
                  const serialNo = totalEntries - ((currentPage - 1) * pageSize + idx);
                  return (
                    <TableRow key={row._id || row.id || idx} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                      <TableCell className="text-center py-3 text-slate-500 font-bold text-xs font-mono">{serialNo}</TableCell>
                      <TableCell className="text-center py-3 text-slate-800 font-black text-xs font-mono">{row.inventoryNo}</TableCell>
                      
                      <TableCell className="text-center py-3 text-slate-600 font-semibold text-[10px]">
                        {row.modifiedTime ? new Date(row.modifiedTime).toLocaleDateString("en-GB") : ""} {row.modifiedTime ? new Date(row.modifiedTime).toLocaleTimeString("en-US", { hour12: false }) : ""}
                      </TableCell>
                      
                      <TableCell className="text-center py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          row.modificationType === "create" 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : row.modificationType === "delete"
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          {row.modificationType}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center py-3 text-slate-600 font-bold text-xs">{row.modifiedBy || "Super Admin"}</TableCell>
                      <TableCell className="text-center py-3 text-slate-700 font-semibold text-xs">{row.comment || "Inventory Updated"}</TableCell>
                      
                      {/* Cyan Eye option */}
                      <TableCell className="text-center py-3">
                        <button 
                          onClick={() => setSelectedLog(row)}
                          className="p-1.5 hover:bg-cyan-50 rounded-full transition-colors group cursor-pointer border-0 bg-transparent"
                        >
                          <Eye className="h-4 w-4 text-[#00bcd4] group-hover:scale-110 transition-transform" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
            Showing {filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
          </div>
          <div className="flex items-center gap-1.5">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="bg-white border-slate-200 text-slate-600 h-7 text-[10px] uppercase font-black px-3 hover:bg-slate-50 shadow-sm"
            >
              Previous
            </Button>
            
            {/* Current Page Indicator */}
            <span className="h-7 w-7 flex items-center justify-center rounded text-[10px] font-black bg-[#00bcd4] text-white shadow-md">
              {currentPage}
            </span>

            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="bg-white border-slate-200 text-slate-600 h-7 text-[10px] uppercase font-black px-3 hover:bg-slate-50 shadow-sm"
            >
              Next
            </Button>
          </div>
        </div>

      </div>

      {/* History Detail side-by-side modal comparison */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-5xl bg-white border-slate-200 p-6">
          <DialogHeader className="flex flex-row items-center gap-2 border-b border-slate-100 pb-3">
            <div className="bg-rose-50 p-2 rounded-full border border-rose-100">
              <History className="h-5 w-5 text-rose-500" />
            </div>
            <DialogTitle className="text-slate-800 font-black text-xl">
              History Detail
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <div className="grid grid-cols-2 gap-6">
              
              {/* Old Data Table */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest bg-slate-50 p-2 border rounded">Old Data</h3>
                <div className="border rounded-md overflow-hidden bg-white max-h-[350px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <tbody>
                      {COMPARISON_ROWS.map((key) => {
                        const isChanged = isFieldChanged(selectedLog?.oldData, selectedLog?.newData, key);
                        const oldVal = getCompareValue(selectedLog?.oldData, key);
                        return (
                          <tr key={key} className={`border-b last:border-0 ${isChanged ? "bg-[#e11d48] text-white font-bold" : "border-slate-100"}`}>
                            <td className={`p-2 font-bold w-1/3 border-r ${isChanged ? "border-red-700/50 text-white/90" : "bg-slate-50/50 text-slate-500 border-slate-100"}`}>
                              {key}
                            </td>
                            <td className="p-2 font-semibold font-mono">
                              {oldVal}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* New Data Table */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest bg-slate-50 p-2 border rounded">New Data</h3>
                <div className="border rounded-md overflow-hidden bg-white max-h-[350px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <tbody>
                      {COMPARISON_ROWS.map((key) => {
                        const isChanged = isFieldChanged(selectedLog?.oldData, selectedLog?.newData, key);
                        const newVal = getCompareValue(selectedLog?.newData, key);
                        return (
                          <tr key={key} className={`border-b last:border-0 ${isChanged ? "bg-[#e11d48] text-white font-bold" : "border-slate-100"}`}>
                            <td className={`p-2 font-bold w-1/3 border-r ${isChanged ? "border-red-700/50 text-white/90" : "bg-slate-50/50 text-slate-500 border-slate-100"}`}>
                              {key}
                            </td>
                            <td className="p-2 font-semibold font-mono">
                              {newVal}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Slider or scrollbar indicator or info row */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                Highlighting in red indicates properties modified during update.
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">
                Log Type: {selectedLog?.modificationType}
              </span>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <Button onClick={() => setSelectedLog(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold px-5 text-xs uppercase h-9 border-0 cursor-pointer shadow-sm">
                OK
              </Button>
              <Button onClick={() => setSelectedLog(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold px-5 text-xs uppercase h-9 border-0 cursor-pointer shadow-sm">
                CLOSE
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
    </StoreLayout>
  );
}
