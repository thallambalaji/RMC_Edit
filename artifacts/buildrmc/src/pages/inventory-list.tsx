import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronRight, Plus, Search, RotateCcw, Filter, MoreVertical,
  Eye, Pencil, Trash2, Copy, Download, Printer,
  Loader2, Archive, Calendar, X, FileText, Undo
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { ExportDropdown } from "@/components/export-dropdown";
import { StoreLayout, useStoreFilters } from "@/components/store-layout";

export default function InventoryList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { showFilters } = useStoreFilters();

  // Data State
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [inventoryNoFilter, setInventoryNoFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("All Supplier");
  const [itemFilter, setItemFilter] = useState("All Item");

  // Applied Filter States
  const [appliedInvNo, setAppliedInvNo] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [appliedSupplier, setAppliedSupplier] = useState("All Supplier");
  const [appliedItem, setAppliedItem] = useState("All Item");

  // Pagination & Display Size
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal / Detail States
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [printReceipt, setPrintReceipt] = useState<any>(null);

  // Fetch receipts from MongoDB
  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setIsLoading(true);
      const data = await customFetch("/api/store-inventories");
      setReceipts(data as any[]);
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Error", 
        description: "Failed to load store inventory receipts from database.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Logic
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // 1. Inventory No Filter
      if (appliedInvNo && !r.inventoryNo?.toLowerCase().includes(appliedInvNo.toLowerCase())) {
        return false;
      }
      
      // 2. Date Range Filters
      if (appliedFromDate) {
        const itemDate = new Date(r.inventoryDate);
        const fromDate = new Date(appliedFromDate);
        // Normalize time for simple date comparison
        itemDate.setHours(0,0,0,0);
        fromDate.setHours(0,0,0,0);
        if (itemDate < fromDate) return false;
      }

      if (appliedToDate) {
        const itemDate = new Date(r.inventoryDate);
        const toDate = new Date(appliedToDate);
        itemDate.setHours(0,0,0,0);
        toDate.setHours(0,0,0,0);
        if (itemDate > toDate) return false;
      }

      // 3. Supplier Filter
      if (appliedSupplier !== "All Supplier" && r.supplierName !== appliedSupplier) {
        return false;
      }

      // 4. Item Filter
      if (appliedItem !== "All Item" && r.itemName !== appliedItem) {
        return false;
      }

      return true;
    });
  }, [receipts, appliedInvNo, appliedFromDate, appliedToDate, appliedSupplier, appliedItem]);

  // Apply search filters
  const handleSearch = () => {
    setAppliedInvNo(inventoryNoFilter);
    setAppliedFromDate(fromDateFilter);
    setAppliedToDate(toDateFilter);
    setAppliedSupplier(supplierFilter);
    setAppliedItem(itemFilter);
    setCurrentPage(1);
    toast({ title: "Filters Applied 🔍", description: "Table updated with active filters." });
  };

  // Clear filters
  const handleClear = () => {
    setInventoryNoFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setSupplierFilter("All Supplier");
    setItemFilter("All Item");

    setAppliedInvNo("");
    setAppliedFromDate("");
    setAppliedToDate("");
    setAppliedSupplier("All Supplier");
    setAppliedItem("All Item");
    
    setCurrentPage(1);
    toast({ title: "Filters Cleared 🧹", description: "Showing all inventory receipts." });
  };

  // Pagination Calculations
  const totalPages = Math.ceil(filteredReceipts.length / pageSize) || 1;
  const paginatedReceipts = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredReceipts.slice(startIdx, startIdx + pageSize);
  }, [currentPage, pageSize, filteredReceipts]);

  // Actions
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory receipt?")) return;
    try {
      await customFetch(`/api/store-inventories/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Store inventory receipt deleted successfully." });
      fetchReceipts();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete receipt.", variant: "destructive" });
    }
  };

  const handleEdit = (receipt: any) => {
    // Navigate to Add page with edit parameter
    navigate(`/store/inventory/new?edit=${receipt._id || receipt.id}`);
  };

  const handlePrintSingle = (receipt: any) => {
    setPrintReceipt(receipt);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopySingle = (receipt: any) => {
    const text = `Store Inventory Receipt Details:\nInventory No: ${receipt.inventoryNo}\nSupplier: ${receipt.supplierName}\nItem: ${receipt.itemName}\nVehicle No: ${receipt.vehicleNo}\nLoaded Weight: ${receipt.loadedWeight} KG\nEmpty Weight: ${receipt.emptyWeight} KG\nNet Weight: ${receipt.netWeight} KG\nSupplier Weight: ${receipt.supplierWeight} KG\nWeight Difference: ${receipt.weightDifference} KG\nBill No: ${receipt.billNo}\nPlant: ${receipt.plant}\nRecorded At: ${receipt.inventoryDate} ${receipt.inventoryTime}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Receipt details copied to clipboard." });
  };

  const handleExportSingleCSV = (receipt: any) => {
    const headers = ["Inventory No", "Date", "Time", "Supplier", "Item", "Empty Weight", "Loaded Weight", "Net Weight", "Supplier Weight", "Vehicle No", "Bill No", "Plant"];
    const row = [
      `"${receipt.inventoryNo}"`,
      `"${receipt.inventoryDate}"`,
      `"${receipt.inventoryTime}"`,
      `"${receipt.supplierName}"`,
      `"${receipt.itemName}"`,
      receipt.emptyWeight,
      receipt.loadedWeight,
      receipt.netWeight,
      receipt.supplierWeight,
      `"${receipt.vehicleNo}"`,
      `"${receipt.billNo}"`,
      `"${receipt.plant}"`
    ];
    const csvContent = `${headers.join(",")}\n${row.join(",")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `store_inventory_${receipt.inventoryNo.replace(/\//g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exported", description: "CSV file downloaded successfully." });
  };

  // Bulk Actions
  const handleCopyAll = () => {
    if (filteredReceipts.length === 0) return;
    const headers = "Inventory No\tDate\tTime\tSupplier\tItem\tEmpty Weight\tLoaded Weight\tNet Weight\tSupplier Weight\tVehicle NO\tBill No\tPlant";
    const rows = filteredReceipts.map(r => 
      `${r.inventoryNo}\t${r.inventoryDate}\t${r.inventoryTime}\t${r.supplierName}\t${r.itemName}\t${r.emptyWeight}\t${r.loadedWeight}\t${r.netWeight}\t${r.supplierWeight}\t${r.vehicleNo}\t${r.billNo}\t${r.plant}`
    ).join("\n");
    navigator.clipboard.writeText(`${headers}\n${rows}`);
    toast({ title: "Table Copied! 📋", description: "Copied all filtered rows to clipboard." });
  };

  const handleExportAllCSV = () => {
    if (filteredReceipts.length === 0) return;
    const headers = ["Inventory No", "Date", "Time", "Supplier", "Item", "Empty Weight", "Loaded Weight", "Net Weight", "Supplier Weight", "Vehicle NO", "Bill No", "Plant"];
    const rows = filteredReceipts.map(r => [
      `"${r.inventoryNo}"`, `"${r.inventoryDate}"`, `"${r.inventoryTime}"`, `"${r.supplierName}"`, `"${r.itemName}"`,
      r.emptyWeight, r.loadedWeight, r.netWeight, r.supplierWeight, `"${r.vehicleNo}"`, `"${r.billNo}"`, `"${r.plant}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `store_inventory_register.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "CSV Downloaded 📊" });
  };

  return (
    <StoreLayout
      title="Inventory Management"
      breadcrumbs={[{ label: "Inventory List" }]}
    >
    <div className="space-y-4 animate-in fade-in duration-500 print:bg-white print:p-0 print:m-0">
      
      {/* Receipts Slip Details for Print (Hidden in screen) */}
      {printReceipt && (
        <div className="hidden print:block bg-white p-8 max-w-4xl mx-auto text-black font-sans">
          <div className="flex justify-between items-center border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-[#ea580c] tracking-tight">{printReceipt.plant}</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Premium Ready Mix Concrete Solutions</p>
            </div>
            <div className="text-right">
              <div className="bg-[#ea580c] text-white px-3 py-1 font-black text-xs uppercase tracking-widest inline-block rounded mb-1">INVENTORY RECEIPT</div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">GSTIN: 36AAAAF1234A1Z0</p>
              <p className="text-[9px] text-gray-400 font-medium">Receipt Date: {printReceipt.inventoryDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#ea580c] uppercase text-[10px] tracking-wider mb-2">Receipt Details</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Inventory No: <span className="font-black text-gray-900">{printReceipt.inventoryNo}</span></p>
                <p className="text-xs font-bold text-gray-700">Date & Time: <span className="font-medium text-gray-900">{printReceipt.inventoryDate} {printReceipt.inventoryTime}</span></p>
                <p className="text-xs font-bold text-gray-700">Operating Plant: <span className="font-medium text-gray-900">{printReceipt.plant}</span></p>
                <p className="text-xs font-bold text-gray-700">Bill No: <span className="font-medium text-gray-900">{printReceipt.billNo}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded border">
              <h3 className="font-bold text-[#ea580c] uppercase text-[10px] tracking-wider mb-2">Item & Supplier</h3>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Supplier: <span className="font-black text-gray-900">{printReceipt.supplierName}</span></p>
                <p className="text-xs font-bold text-gray-700">Item: <span className="font-medium text-gray-900">{printReceipt.itemName}</span></p>
                <p className="text-xs font-bold text-gray-700">Vehicle No: <span className="font-black text-gray-900">{printReceipt.vehicleNo}</span></p>
              </div>
            </div>
          </div>

          <table className="w-full border collapse text-left mb-6 text-xs">
            <thead>
              <tr className="bg-slate-100 font-black uppercase tracking-wider">
                <th className="border p-2">Parameter Description</th>
                <th className="border p-2 text-right">Value (KG)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">Loaded Weight</td>
                <td className="border p-2 text-right">{printReceipt.loadedWeight} KG</td>
              </tr>
              <tr>
                <td className="border p-2">Empty Weight</td>
                <td className="border p-2 text-right">{printReceipt.emptyWeight} KG</td>
              </tr>
              <tr className="font-bold text-[#ea580c]">
                <td className="border p-2">Net Weight</td>
                <td className="border p-2 text-right">{printReceipt.netWeight} KG</td>
              </tr>
              <tr>
                <td className="border p-2">Supplier Weight</td>
                <td className="border p-2 text-right">{printReceipt.supplierWeight} KG</td>
              </tr>
              <tr className="font-bold text-red-600">
                <td className="border p-2">Weight Difference</td>
                <td className="border p-2 text-right">{printReceipt.weightDifference} KG</td>
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
              <p className="text-[9px] font-extrabold uppercase text-[#ea580c] tracking-wider">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}

      {/* Screen View */}
      <div className={`space-y-4 ${printReceipt ? "print:hidden" : ""}`}>
        


        {/* Filters Panel */}
        {showFilters && (
        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm no-print">
          <div className="flex flex-wrap gap-3 items-end">
            
            <div className="flex-1 min-w-[180px]">
              <Label className="text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter">Inventory No</Label>
              <Input 
                value={inventoryNoFilter}
                onChange={(e) => setInventoryNoFilter(e.target.value)}
                placeholder="Enter Inventory No" 
                className="h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white"
              />
            </div>

            <div className="w-36">
              <Label className="text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter">From Date</Label>
              <div className="relative">
                <Input 
                  type="date"
                  value={fromDateFilter}
                  onChange={(e) => setFromDateFilter(e.target.value)}
                  className="h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white pr-8"
                />
              </div>
            </div>

            <div className="w-36">
              <Label className="text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter">To Date</Label>
              <div className="relative">
                <Input 
                  type="date"
                  value={toDateFilter}
                  onChange={(e) => setToDateFilter(e.target.value)}
                  className="h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white pr-8"
                />
              </div>
            </div>

            <div className="w-40">
              <Label className="text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter">Supplier</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-700">
                  <SelectItem value="All Supplier" className="text-[10px] font-bold">All Supplier</SelectItem>
                  <SelectItem value="ACC Cements" className="text-[10px] font-bold">ACC Cements</SelectItem>
                  <SelectItem value="Local Quarry" className="text-[10px] font-bold">Local Quarry</SelectItem>
                  <SelectItem value="Ramesh Quarry" className="text-[10px] font-bold">Ramesh Quarry</SelectItem>
                  <SelectItem value="BASF India" className="text-[10px] font-bold">BASF India</SelectItem>
                  <SelectItem value="NTPC Fly Ash" className="text-[10px] font-bold">NTPC Fly Ash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Label className="text-[9px] font-black text-gray-600 mb-0.5 block uppercase tracking-tighter">Item</Label>
              <Select value={itemFilter} onValueChange={setItemFilter}>
                <SelectTrigger className="h-7 text-[10px] border-gray-200 rounded shadow-none focus:ring-[#ea580c] font-bold px-2 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-700">
                  <SelectItem value="All Item" className="text-[10px] font-bold">All Item</SelectItem>
                  <SelectItem value="Cement OPC 53" className="text-[10px] font-bold">Cement OPC 53</SelectItem>
                  <SelectItem value="River Sand (Coarse)" className="text-[10px] font-bold">River Sand (Coarse)</SelectItem>
                  <SelectItem value="20mm Granite Chips" className="text-[10px] font-bold">20mm Granite Chips</SelectItem>
                  <SelectItem value="10mm Granite Chips" className="text-[10px] font-bold">10mm Granite Chips</SelectItem>
                  <SelectItem value="Admixture (Plasticizer)" className="text-[10px] font-bold">Admixture (Plasticizer)</SelectItem>
                  <SelectItem value="Fly Ash" className="text-[10px] font-bold">Fly Ash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-1.5 h-7">
              <Button 
                onClick={handleSearch} 
                className="bg-[#ea580c] hover:bg-[#d97706] text-white font-black text-[9px] h-full px-4 uppercase tracking-wider shadow-none border-0 cursor-pointer flex items-center justify-center gap-1"
              >
                <Search className="h-3 w-3" /> Search
              </Button>
              <Button 
                onClick={handleClear} 
                className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[9px] h-full px-4 uppercase tracking-wider shadow-none border-0 cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Tabular Display Card */}
        <div className="bg-white rounded-xl border shadow-md overflow-hidden flex flex-col">
          
          {/* Table Toolbar Header */}
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-slate-50/30 no-print">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gray-500 uppercase">Show</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-14 h-6 bg-white border-gray-200 text-[10px] font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[9px] font-black text-gray-500 uppercase">entries</span>
            </div>

            <ExportDropdown
              onCopy={handleCopyAll}
              onCSV={handleExportAllCSV}
              onPDF={() => window.print()}
            />
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto bg-white">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#ea580c]">
                <TableRow className="hover:bg-transparent border-0 bg-[#ea580c]">
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Inventory No</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Date</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Time</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Supplier</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Item</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Empty Weight</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Loaded Weight</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Net Weight</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Supplier Weight</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Vehicle NO</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Bill No</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black text-[9px] uppercase tracking-tighter py-1.5 px-2 border-r border-white/10 text-center">Plant</TableHead>
                  <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-3 text-center text-[9px] last:border-0 uppercase tracking-tighter w-[70px]">OPTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-[#00bcd4]" />
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading register records...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-20 text-slate-400 italic">
                      No store inventory receipts found in database.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReceipts.map((row, idx) => (
                    <TableRow key={row._id || row.id || idx} className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors">
                      
                      {/* Inventory No blue link */}
                      <TableCell 
                        onClick={() => setSelectedReceipt(row)} 
                        className="text-center py-3 text-[#ea580c] font-extrabold text-xs cursor-pointer hover:underline font-mono"
                      >
                        {row.inventoryNo}
                      </TableCell>
                      
                      <TableCell className="text-center py-3 text-slate-700 font-semibold text-[10px] whitespace-nowrap">
                        {row.inventoryDate}
                      </TableCell>

                      <TableCell className="text-center py-3 text-slate-500 font-mono text-[10px]">
                        {row.inventoryTime}
                      </TableCell>

                      <TableCell className="text-center py-3 text-slate-700 font-bold text-xs max-w-[120px] truncate">
                        {row.supplierName}
                      </TableCell>

                      <TableCell className="text-center py-3 text-slate-700 font-bold text-xs uppercase">
                        {row.itemName}
                      </TableCell>

                      <TableCell className="text-center py-3 text-slate-600 font-mono text-xs">
                        {row.emptyWeight}
                      </TableCell>

                      <TableCell className="text-center py-3 text-slate-600 font-mono text-xs">
                        {row.loadedWeight}
                      </TableCell>

                      <TableCell className="text-center py-3 text-[#ea580c] font-mono font-bold text-xs">
                        {Number(row.netWeight).toFixed(2)}
                      </TableCell>

                      <TableCell className="text-center py-3 text-slate-600 font-mono text-xs">
                        {row.supplierWeight}
                      </TableCell>

                      <TableCell className="text-center py-3 text-slate-700 font-black text-xs font-mono">
                        {row.vehicleNo}
                      </TableCell>

                      <TableCell className="text-center py-3 text-slate-700 font-semibold text-xs font-mono">
                        {row.billNo}
                      </TableCell>

                      <TableCell className="text-center py-3 text-slate-600 font-bold text-xs">
                        {row.plant}
                      </TableCell>

                      {/* Options Dropdown */}
                      <TableCell className="text-center py-3 print:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full cursor-pointer flex items-center justify-center mx-auto"
                            >
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                              <span className="sr-only">Open options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-white border-slate-200 min-w-[150px] shadow-lg rounded-md z-50">
                            <DropdownMenuItem 
                              onClick={() => setSelectedReceipt(row)} 
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                            >
                              <Eye className="h-3.5 w-3.5 text-[#ea580c]" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleEdit(row)} 
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                            >
                              <Pencil className="h-3.5 w-3.5 text-[#ea580c]" />
                              Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handlePrintSingle(row)} 
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                            >
                              <Printer className="h-3.5 w-3.5 text-red-500" />
                              Print Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleExportSingleCSV(row)} 
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                            >
                              <Download className="h-3.5 w-3.5 text-emerald-600" />
                              Export CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCopySingle(row)} 
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                            >
                              <Copy className="h-3.5 w-3.5 text-[#ea580c]" />
                              Copy Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(row._id || row.id)} 
                              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 cursor-pointer hover:bg-red-50 focus:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex items-center justify-between p-3 border-t bg-white shrink-0 no-print">
            <div className="text-[9px] font-black text-gray-500 uppercase">
              Showing {filteredReceipts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredReceipts.length)} of {filteredReceipts.length} entries
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="h-6 w-6 p-0 border-gray-200 text-gray-400 bg-white"
              >
                <ChevronRight className="h-3 w-3 rotate-180" />
              </Button>
              <div className="h-6 px-2 flex items-center justify-center bg-[#ea580c] text-white text-[9px] font-black rounded">
                {currentPage}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="h-6 w-6 p-0 border-gray-200 text-gray-400 bg-white"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

        </div>

      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-2xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-xl border-b border-slate-100 pb-2">
              Store Inventory Receipt Details - {selectedReceipt?.inventoryNo}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Inventory No:</span> 
                  <div className="font-bold text-slate-800 font-mono text-[#ea580c]">{selectedReceipt?.inventoryNo}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Operating Plant:</span> 
                  <div className="font-semibold text-slate-800">{selectedReceipt?.plant}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Supplier Name:</span> 
                  <div className="font-bold text-slate-800">{selectedReceipt?.supplierName}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Item Name:</span> 
                  <div className="font-bold text-slate-800 uppercase">{selectedReceipt?.itemName}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Bill No:</span> 
                  <div className="font-semibold text-slate-800 font-mono">{selectedReceipt?.billNo}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Amount:</span> 
                  <div className="font-bold text-slate-800 font-mono">₹{selectedReceipt?.amount}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Vehicle No:</span> 
                  <div className="font-bold text-slate-800 font-mono">{selectedReceipt?.vehicleNo}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Weights (KG):</span> 
                  <div className="text-xs space-y-0.5 text-slate-700 font-semibold font-mono">
                    <div>Loaded: {selectedReceipt?.loadedWeight} KG</div>
                    <div>Empty: {selectedReceipt?.emptyWeight} KG</div>
                    <div className="font-bold text-[#ea580c]">Net: {selectedReceipt?.netWeight} KG</div>
                    <div>Supplier: {selectedReceipt?.supplierWeight} KG</div>
                    <div className="font-bold text-red-600">Difference: {selectedReceipt?.weightDifference} KG</div>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Recorded Date & Time:</span> 
                  <div className="font-semibold text-slate-800">
                    {selectedReceipt?.inventoryDate} {selectedReceipt?.inventoryTime}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Delivery Address:</span> 
                  <div className="text-xs text-slate-600 font-medium">{selectedReceipt?.deliveryAddress}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
              <Button onClick={() => setSelectedReceipt(null)} className="bg-slate-800 hover:bg-slate-900 text-white shadow-md font-bold px-5">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
    </StoreLayout>
  );
}
