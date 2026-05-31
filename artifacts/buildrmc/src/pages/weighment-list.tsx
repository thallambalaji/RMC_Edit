import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
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
import { ChevronRight, Search, Plus, Trash2, Filter, FileText, Download, Printer, Eye, Pencil, Copy, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetDCs, useGetCustomers, useGetMasters } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function WeighmentList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [printRecord, setPrintRecord] = useState<any>(null);
  const headerStyle = "bg-[#1e40af] text-white font-black py-1.5 px-2 text-center text-[9px] border-r border-white/10 last:border-0 uppercase tracking-tighter";

  const { data: records, isLoading } = useGetDCs();
  const { data: customers } = useGetCustomers();
  const { data: dbPlants } = useGetMasters("plant");

  // Filters state
  const [searchNo, setSearchNo] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedPlant, setSelectedPlant] = useState("all");
  const [showCount, setShowCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSearch, setActiveSearch] = useState(false);

  // Derive all available options for dropdowns from full database
  const availableCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.map((c: any) => ({
      id: String(c.id || c._id),
      name: c.name,
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [customers]);

  const availablePlants = useMemo(() => {
    const plants = new Set<string>();
    if (dbPlants) {
      dbPlants.forEach((p: any) => {
        if (p.name) plants.add(p.name);
      });
    }
    if (records) {
      records.forEach((r: any) => {
        if (r.plant) plants.add(r.plant);
        if (r.plant?.name) plants.add(r.plant.name);
      });
    }
    return Array.from(plants).sort();
  }, [records, dbPlants]);

  // Apply filters
  const filteredData = useMemo(() => {
    if (!records) return [];
    let filtered = [...records];

    if (activeSearch) {
      if (searchNo) {
        filtered = filtered.filter((r) =>
          r.dcNumber?.toLowerCase().includes(searchNo.toLowerCase()) ||
          r.vehicleReg?.toLowerCase().includes(searchNo.toLowerCase())
        );
      }
      if (fromDate) {
        filtered = filtered.filter((r) => new Date(r.dcDate) >= new Date(fromDate));
      }
      if (toDate) {
        filtered = filtered.filter((r) => new Date(r.dcDate) <= new Date(toDate));
      }
      if (selectedCustomer !== "all") {
        filtered = filtered.filter((r: any) => {
          const cId = String(r.customerId || r.customer?.id || r.customer?._id || r.customerName);
          return cId === selectedCustomer || r.customerName === availableCustomers.find(c => c.id === selectedCustomer)?.name;
        });
      }
      if (selectedPlant !== "all") {
        filtered = filtered.filter((r: any) => {
          const pName = r.plant?.name || r.plant;
          return pName === selectedPlant;
        });
      }
    }

    return filtered.sort((a, b) => new Date(b.createdAt || b.dcDate).getTime() - new Date(a.createdAt || a.dcDate).getTime());
  }, [records, activeSearch, searchNo, fromDate, toDate, selectedCustomer, selectedPlant, availableCustomers]);

  const handleSearch = () => {
    // Validation
    if (searchNo && !records?.some(r => r.dcNumber?.toLowerCase().includes(searchNo.toLowerCase()) || r.vehicleReg?.toLowerCase().includes(searchNo.toLowerCase()))) {
      toast({ title: "Invalid Search", description: "Enter the correct Delivery/Bill No or Vehicle No.", variant: "destructive" });
      return;
    }
    setActiveSearch(true);
    setCurrentPage(1);

    // Check if result is empty
    const willBeEmpty = filteredData.length === 0;
    if (willBeEmpty && searchNo) {
      // the filter might be empty after activeSearch becomes true
      toast({ title: "No Records Found", description: "Adjust your filters.", variant: "destructive" });
    } else {
      toast({ title: "Searching...", description: "Filtering records based on your criteria." });
    }
  };

  const handleClear = () => {
    setSearchNo("");
    setFromDate("");
    setToDate("");
    setSelectedCustomer("all");
    setSelectedPlant("all");
    setActiveSearch(false);
    setCurrentPage(1);
    toast({ title: "Filters Cleared", description: "Showing all weighment records." });
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / showCount) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * showCount;
    return filteredData.slice(start, start + showCount);
  }, [filteredData, currentPage, showCount]);

  const handleCopy = () => {
    const headers = ["Delivery No", "Customer", "Site", "Date", "Vehicle", "Loaded", "Empty", "Net"];
    const rows = filteredData.map((d: any) => [
      d.dcNumber || "-",
      d.customerName || d.customer?.name || "-",
      d.siteName || d.site?.name || "-",
      d.dcDate || "-",
      d.vehicleReg || d.vehicle?.registrationNumber || "-",
      d.loadedQuantity || d.quantity || 0,
      d.tareWeight || 0,
      d.netWeight || d.quantity || 0
    ]);
    const text = [headers, ...rows].map(row => row.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleExportCSV = () => {
    const headers = ["Delivery No", "Customer", "Site", "Date", "Vehicle", "Loaded", "Empty", "Net"];
    const rows = filteredData.map((d: any) => [
      `"${d.dcNumber || "-"}"`,
      `"${d.customerName || d.customer?.name || "-"}"`,
      `"${d.siteName || d.site?.name || "-"}"`,
      `"${d.dcDate || "-"}"`,
      `"${d.vehicleReg || d.vehicle?.registrationNumber || "-"}"`,
      `"${d.loadedQuantity || d.quantity || 0}"`,
      `"${d.tareWeight || 0}"`,
      `"${d.netWeight || d.quantity || 0}"`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `weighment_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful" });
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleEditRow = (row: any) => {
    toast({
      title: "Edit Restricted",
      description: `Weighment transaction ${row.dcNumber} is locked. Modifications must be approved by security supervisor.`,
      variant: "destructive"
    });
  };

  const handlePrintSingleRow = (row: any) => {
    setPrintRecord(row);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDeleteRow = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this weighment record?")) return;
    try {
      const res = await fetch(`/api/delivery-challans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete weighment record");
      toast({ title: "Success", description: "Weighment record deleted successfully!" });
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleCopyRow = (row: any) => {
    const text = `Delivery No: ${row.dcNumber}\nCustomer: ${row.customerName}\nVehicle: ${row.vehicleReg || row.vehicle?.registrationNumber || "-"}\nNet Weight: ${row.netWeight || row.quantity || 0} KG`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Weighment details copied to clipboard." });
  };

  const handleExportRowCSV = (row: any) => {
    const csvContent = `Delivery No,Customer,Vehicle,Net Weight\n"${row.dcNumber}","${row.customerName}","${row.vehicleReg || row.vehicle?.registrationNumber || "-"}","${row.netWeight || row.quantity || 0} KG"`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `weighment_${row.dcNumber?.replace(/\//g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful" });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 print:bg-white print:p-0 print:m-0">
      <div className={`space-y-4 ${printRecord ? "print:hidden" : ""}`}>
        {/* Header & Breadcrumbs */}
        <div className="flex items-center justify-between bg-white py-3.5 px-5 rounded-lg border border-slate-200 shadow-sm shrink-0 print:hidden">
          <div className="flex items-center">
            <h2 className="text-[13px] font-black text-slate-800 uppercase tracking-wider select-none">
              Weighment List
            </h2>
            <div className="h-4 w-px bg-slate-300 mx-4" />
            <nav className="text-[10px] text-slate-500 flex items-center uppercase font-bold tracking-widest select-none">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5 text-slate-500" />
                <span>HOME</span>
              </Link>
              <span className="text-slate-400 font-black mx-2.5">&gt;</span>
              <Link href="/dc" className="hover:text-blue-600 transition-colors">
                DC
              </Link>
              <span className="text-slate-400 font-black mx-2.5">&gt;</span>
              <span className="text-blue-600 font-black">WEIGHMENT LIST</span>
            </nav>
          </div>

          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-black text-slate-800 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 px-3 rounded shadow-xs"
              onClick={handleSearch}
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

      <div className="flex flex-wrap gap-3 mb-2 print:hidden">
        <Button className="bg-[#1e40af] text-white hover:bg-[#1d4ed8] px-6 h-10 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-cyan-500/10">
          WEIGHMENT LIST
        </Button>
        <Button className="bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 px-6 h-10 font-black uppercase tracking-widest text-[10px] transition-all">
          <Trash2 className="h-3 w-3 mr-2" /> DELETED RECORDS
        </Button>
        <Link href="/dc/weighment/new" className="bg-cyan-500 text-white hover:bg-cyan-600 px-6 h-10 font-black uppercase tracking-widest text-[10px] flex items-center shadow-lg shadow-cyan-500/20 transition-all active:scale-95">
          <Plus className="h-4 w-4 mr-2" /> NEW WEIGHMENT
        </Link>
      </div>

      <div className="glass-card p-6 border-white/80 shadow-xl print:hidden">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Filter className="h-4 w-4 text-cyan-600" />
          <h3 className="text-slate-800 font-black text-sm uppercase tracking-widest">Filter Records</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-5 items-end">
          <div className="space-y-1.5 lg:col-span-1">
            <Label className="f-label text-slate-600">Search No.</Label>
            <Input
              placeholder="Del/Bill No"
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              className="f-input bg-white border-slate-200 text-slate-700 placeholder:text-slate-300 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">From Date</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="f-input bg-white border-slate-200 text-slate-700 font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">To Date</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="f-input bg-white border-slate-200 text-slate-700 font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">Customer</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700 max-h-[300px]">
                <SelectItem value="all">All Customers</SelectItem>
                {availableCustomers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">Plant</Label>
            <Select value={selectedPlant} onValueChange={setSelectedPlant}>
              <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="all">All Plants</SelectItem>
                {availablePlants.map((p, idx) => (
                  <SelectItem key={idx} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="btn-primary h-10 flex-1 font-black text-[10px] uppercase tracking-widest">SEARCH</Button>
            <Button onClick={handleClear} variant="outline" className="bg-white border-slate-200 text-slate-600 h-10 flex-1 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">CLEAR</Button>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <PrintHeader />
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#1e40af]">Weighment List Report</h2>
          <div className="text-right text-[10px] font-bold text-gray-600">
            <span>Printed Date: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="glass-card flex flex-col overflow-hidden border-white/80 shadow-xl print:shadow-none print:border-none print:bg-white print:m-0 print:p-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Show</span>
            <Select value={String(showCount)} onValueChange={(v) => { setShowCount(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-20 h-8 bg-white border-slate-200 text-slate-700 text-xs font-bold shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ExportDropdown onCopy={handleCopy} onCSV={handleExportCSV} onPDF={handlePrintPDF} />
        </div>

        <div className="overflow-x-auto bg-white">
          <Table className="data-table">
            <TableHeader>
              <TableRow className="border-0 hover:bg-transparent print:border-b-2 print:border-gray-800 print:bg-transparent">
                <TableHead className={headerStyle}>Delivery No</TableHead>
                <TableHead className={headerStyle}>Customer</TableHead>
                <TableHead className={headerStyle}>Site</TableHead>
                <TableHead className={headerStyle}>Date</TableHead>
                <TableHead className={headerStyle}>Item</TableHead>
                <TableHead className={headerStyle}>Weights (E/L/N)</TableHead>
                <TableHead className={headerStyle}>Vehicle</TableHead>
                <TableHead className={headerStyle}>Plant</TableHead>
                <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter print:hidden">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                    No weighment records found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row: any, idx: number) => {
                  const empty = row.tareWeight || 0;
                  const net = row.netWeight || row.quantity || 0;
                  const loaded = row.loadedQuantity || (empty + net) || 0;

                  return (
                    <TableRow key={row.id || idx} className="hover:bg-slate-50 border-b border-slate-100 transition-colors group">
                      <TableCell 
                        onClick={() => setSelectedRecord(row)} 
                        className="text-center py-3 text-cyan-600 font-black text-[10px] cursor-pointer hover:underline"
                        title="Click to view details"
                      >
                        {row.dcNumber}
                      </TableCell>
                      <TableCell className="text-center py-3 text-slate-700 font-bold text-[10px] max-w-[150px] truncate" title={row.customerName || row.customer?.name}>{row.customerName || row.customer?.name || "-"}</TableCell>
                      <TableCell className="text-center py-3 text-slate-600 font-semibold text-[10px]" title={row.siteName || row.site?.name}>{row.siteName || row.site?.name || "-"}</TableCell>
                      <TableCell className="text-center py-3 text-slate-400 font-bold text-[10px]">{new Date(row.dcDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-center py-3">
                        <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 text-[10px] font-black border border-cyan-100">{row.grade || "-"}</span>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <div className="flex flex-col items-center justify-center gap-0.5 font-mono text-[9px] font-bold">
                          <span className="text-slate-400">E: {empty}</span>
                          <span className="text-slate-500">L: {loaded}</span>
                          <span className="text-emerald-600">N: {net}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3 text-slate-800 font-black text-[10px]">{row.vehicleReg || row.vehicle?.registrationNumber || "-"}</TableCell>
                      <TableCell className="text-center py-3 text-slate-400 font-semibold text-[10px]">{row.plant?.name || row.plant || "FORTUNE CONCRETE"}</TableCell>
                      <TableCell className="text-center py-3 print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Print (Printer Icon) */}
                          <Button 
                            onClick={() => handlePrintSingleRow(row)}
                            title="Print Weighment Slip" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-red-50 text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          {/* 2. CSV (Download Icon) */}
                          <Button 
                            onClick={() => handleExportRowCSV(row)}
                            title="Download CSV" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            <Download className="h-4 w-4" />
                          </Button>

                          {/* 3. Copy (Copy Icon) */}
                          <Button 
                            onClick={() => handleCopyRow(row)}
                            title="Copy Details" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-cyan-50 text-cyan-600 hover:text-cyan-700 cursor-pointer"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          {/* 4. Edit (Pencil Icon) */}
                          <Button 
                            onClick={() => handleEditRow(row)}
                            title="Edit Record" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {/* 5. Delete (Trash Icon) */}
                          <Button 
                            onClick={() => handleDeleteRow(row.id || row._id)}
                            title="Delete Record" 
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

        {!isLoading && filteredData.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
              Showing {(currentPage - 1) * showCount + 1} to {Math.min(currentPage * showCount, filteredData.length)} of {filteredData.length} entries
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="bg-white border-slate-200 text-slate-400 h-7 text-[10px] uppercase font-black px-3 hover:bg-slate-50 shadow-sm transition-all"
              >
                PREV
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-7 w-7 flex items-center justify-center rounded text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                >
                  {i + 1}
                </button>
              )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="bg-white border-slate-200 text-slate-600 h-7 text-[10px] uppercase font-black px-3 hover:bg-slate-50 shadow-sm transition-all"
              >
                NEXT
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl border-b border-slate-100 pb-2">Weighment Details - {selectedRecord?.dcNumber}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-3">
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Delivery No:</span> <div className="font-medium text-slate-800 font-mono font-bold text-cyan-600">{selectedRecord?.dcNumber}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Slip Date:</span> <div className="font-medium text-slate-800">{selectedRecord?.dcDate ? new Date(selectedRecord.dcDate).toLocaleDateString("en-IN") : "-"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Customer:</span> <div className="font-medium text-slate-800">{selectedRecord?.customerName || "-"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Site Address:</span> <div className="font-medium text-slate-800">{selectedRecord?.siteName || "-"}</div></div>
              </div>
              <div className="space-y-3">
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Vehicle No:</span> <div className="font-medium text-slate-800 font-bold text-slate-700">{selectedRecord?.vehicleReg || selectedRecord?.vehicle?.registrationNumber || "-"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Material Grade:</span> <div className="font-medium text-slate-800">{selectedRecord?.grade || "-"}</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Empty Weight (Tare):</span> <div className="font-medium text-slate-800">{selectedRecord?.tareWeight || 0} KG</div></div>
                <div><span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Net Weight:</span> <div className="font-medium text-slate-800 font-bold text-emerald-600">{selectedRecord?.netWeight || selectedRecord?.quantity || 0} KG</div></div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <Button onClick={() => setSelectedRecord(null)} size="sm" className="bg-slate-800 hover:bg-slate-900 text-white shadow-md">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branded Single Weighment Ticket Sheet for Printing */}
      {printRecord && (
        <div className="hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <PrintHeader />
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider text-[#1e40af]">Weighment Slip Identity Details</h2>
            <div className="text-right">
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 font-black text-[9px] uppercase tracking-wider border rounded font-sans">WEIGHMENT SLIP</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Slip Details</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">DC Number: <span className="font-black text-gray-900">{printRecord.dcNumber}</span></p>
                <p className="text-xs font-bold text-gray-700">Date: <span className="font-medium text-gray-900">{printRecord.dcDate ? new Date(printRecord.dcDate).toLocaleDateString("en-IN") : "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Loaded Plant: <span className="font-medium text-gray-900">{printRecord.plant || "FORTUNE CONCRETE"}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#1e40af] uppercase text-[10px] tracking-wider mb-2">Customer & Vehicle</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Customer: <span className="font-black text-gray-900">{printRecord.customerName || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Site: <span className="font-medium text-gray-900">{printRecord.siteName || "-"}</span></p>
                <p className="text-xs font-bold text-gray-700">Vehicle: <span className="font-medium text-gray-900">{printRecord.vehicleReg || "-"}</span></p>
              </div>
            </div>
          </div>

          {/* Weighment Slip Table */}
          <table className="w-full border collapse text-left mb-6">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider">
                <th className="border p-2">Parameter Description</th>
                <th className="border p-2 text-right">Value (KG)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-xs">
                <td className="border p-2 font-bold text-gray-700">Empty Weight (Tare)</td>
                <td className="border p-2 text-right font-semibold">{printRecord.tareWeight || 0} KG</td>
              </tr>
              <tr className="text-xs">
                <td className="border p-2 font-bold text-gray-700">Gross Loaded Weight</td>
                <td className="border p-2 text-right font-semibold">{(printRecord.loadedQuantity || 0) || ((printRecord.tareWeight || 0) + (printRecord.netWeight || printRecord.quantity || 0))} KG</td>
              </tr>
              <tr className="text-xs bg-slate-50 font-bold text-[#1e40af]">
                <td className="border p-2">Net Weight</td>
                <td className="border p-2 text-right">{(printRecord.netWeight || printRecord.quantity || 0)} KG</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-12 pt-8 border-t flex justify-between items-end">
            <div>
              <p className="text-[9px] text-gray-400">All weighment measurements verified using calibrated weighing instruments.</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">Driver Signature</p>
            </div>
            <div className="text-center w-40 border-t pt-2 border-gray-300">
              <p className="text-[9px] font-extrabold uppercase text-[#1e40af] tracking-wider">Authorized Operator</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
