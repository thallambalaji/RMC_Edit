import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronRight, 
  FlaskConical, 
  Plus, 
  Search,
  Printer,
  RotateCcw,
  Copy,
  FileCode,
  Trash2,
  Calendar,
  MoreVertical
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { QcLayout, useQcFilters } from "@/components/qc-layout";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";

export default function CubeTestList() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const { showFilters } = useQcFilters();

  // Print states
  const [printingItem, setPrintingItem] = useState<any | null>(null);
  const [isPrintingList, setIsPrintingList] = useState(false);

  // Filters State
  const [filterCastingDate, setFilterCastingDate] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("All Customer");
  const [filterSite, setFilterSite] = useState("All Site");
  const [filterGrade, setFilterGrade] = useState("All Grade");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dynamic filter lists
  const [customers, setCustomers] = useState<string[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cube-entries?t=${Date.now()}`); 
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      const validData = Array.isArray(data) ? data : [];
      setEntries(validData);

      // Extract dynamic filter lists from actual data
      const uniqueCust = Array.from(new Set(validData.map((e: any) => e.customerName).filter(Boolean))) as string[];
      const uniqueSites = Array.from(new Set(validData.map((e: any) => e.siteName).filter(Boolean))) as string[];
      const uniqueGrades = Array.from(new Set(validData.map((e: any) => e.grade).filter(Boolean))) as string[];
      
      setCustomers(uniqueCust);
      setSites(uniqueSites);
      setGrades(uniqueGrades);
    } catch (error: any) {
      toast({ title: "Fetch Error", description: "Could not sync with server.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCastingDate, filterCustomer, filterSite, filterGrade, pageSize]);

  // Active filter matches
  const filtered = useMemo(() => {
    return entries
      .filter(e => {
        const tn = e.testNo || "";
        const cn = e.customerName || "";
        const matchesSearch = tn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              cn.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCustomer = filterCustomer === "All Customer" || e.customerName === filterCustomer;
        const matchesSite = filterSite === "All Site" || e.siteName === filterSite;
        const matchesGrade = filterGrade === "All Grade" || e.grade === filterGrade;
        
        let matchesDate = true;
        if (filterCastingDate) {
          const entryDate = format(new Date(e.createdAt), "yyyy-MM-dd");
          matchesDate = entryDate === filterCastingDate;
        }
        
        return matchesSearch && matchesCustomer && matchesSite && matchesGrade && matchesDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, searchQuery, filterCastingDate, filterCustomer, filterSite, filterGrade]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Individual record deletion
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    try {
      const res = await fetch(`/api/cube-entries/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries(entries.filter(e => e.id !== id || e._id !== id));
        toast({ title: "Success", description: "Test entry removed successfully." });
        setRefreshKey(k => k + 1);
      } else {
        toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not complete action.", variant: "destructive" });
    }
  };

  // Helper to calculate area based on dimension
  const getArea = (dim: string) => {
    if (!dim) return 22500;
    if (dim.includes("100")) return 10000;
    if (dim.includes("70.6")) return 4984.36;
    return 22500; // Default 150 X 150
  };

  // Export individual CSV
  const handleExportRowCSV = (entry: any) => {
    const headers = ["Test No", "Customer", "Site Name", "Grade", "Dimension", "No of Casting", "Plant", "Cube ID", "Testing Days", "Supply Date", "Mass (kg)", "Load (kN)", "Strength (N/mm²)"];
    const rows = entry.results?.map((res: any, idx: number) => {
      const load = parseFloat(res.cube1Load) || 0;
      const area = getArea(entry.cubeDimension);
      const strength = load ? ((load * 1000) / area).toFixed(2) : "-";
      return [
        entry.testNo,
        entry.customerName,
        entry.siteName,
        entry.grade,
        entry.cubeDimension,
        entry.noOfCasting,
        entry.plant,
        res.cubeId || `C${idx + 1}`,
        res.testingDays,
        res.supplyDate,
        res.cube1Mass || "-",
        res.cube1Load || "-",
        strength
      ];
    }) || [];

    const csvContent = [headers, ...rows].map((e: any) => e.map((val: any) => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `CubeTest_${entry.testNo}.csv`;
    link.click();
    toast({ title: "Success", description: "CSV exported successfully." });
  };

  // Copy individual row data
  const handleCopyRow = (entry: any) => {
    const summary = `Test No: ${entry.testNo}\nCustomer: ${entry.customerName}\nSite: ${entry.siteName}\nGrade: ${entry.grade}\nDimension: ${entry.cubeDimension}\nCubes: ${entry.noOfCasting}\nPlant: ${entry.plant}`;
    navigator.clipboard.writeText(summary);
    toast({ title: "Copied", description: "Cube test details copied to clipboard." });
  };

  // Global Actions for Whole List
  const handleCopyList = () => {
    const headers = ["Test No", "Customer Name", "Site Name", "Grade", "Dimension", "Casting Count", "Plant"];
    const rows = filtered.map((e: any) => [e.testNo, e.customerName, e.siteName, e.grade, e.cubeDimension, e.noOfCasting, e.plant]);
    const csvContent = [headers, ...rows].map((r: any) => r.join(",")).join("\n");
    navigator.clipboard.writeText(csvContent);
    toast({ title: "Copied", description: "Full filtered list copied to clipboard." });
  };

  const handleExportListCSV = () => {
    const headers = ["Test No", "Customer Name", "Site Name", "Grade", "Dimension", "Casting Count", "Plant"];
    const rows = filtered.map((e: any) => [e.testNo, e.customerName, e.siteName, e.grade, e.cubeDimension, e.noOfCasting, e.plant]);
    const csvContent = [headers, ...rows].map((e: any) => e.map((val: any) => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `CubeTestList_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    toast({ title: "Success", description: "List exported as CSV." });
  };

  // Trigger individual print
  const handlePrintItem = (item: any) => {
    setPrintingItem(item);
    setTimeout(() => {
      window.print();
      setPrintingItem(null);
    }, 150);
  };

  // Trigger list print
  const handlePrintList = () => {
    setIsPrintingList(true);
    setTimeout(() => {
      window.print();
      setIsPrintingList(false);
    }, 150);
  };

  return (
    <>
      
      {/* ═══ LIST PRINT VIEW (Professional Layout) ═══ */}
      {isPrintingList && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 font-sans text-slate-900 overflow-y-auto">
          <PrintHeader />
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <h2 className="text-xl font-black uppercase text-slate-800 tracking-widest">Cube Test Summary List</h2>
            <div className="text-right text-[10px] text-slate-500 font-bold">
              <p>Date: {format(new Date(), "dd/MM/yyyy")}</p>
              <p className="text-blue-600 uppercase">Total Tests: {filtered.length}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-800 text-[10px]">
            <thead>
              <tr className="bg-slate-100 uppercase font-black">
                <th className="border border-slate-800 p-2 text-center w-12">S/L</th>
                <th className="border border-slate-800 p-2 text-left">Test No</th>
                <th className="border border-slate-800 p-2 text-left">Customer</th>
                <th className="border border-slate-800 p-2 text-left">Site</th>
                <th className="border border-slate-800 p-2 text-left">Grade</th>
                <th className="border border-slate-800 p-2 text-center">Dimension</th>
                <th className="border border-slate-800 p-2 text-center">Cubes</th>
                <th className="border border-slate-800 p-2 text-center">Casting Date</th>
                <th className="border border-slate-800 p-2 text-left">Plant</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e: any, idx: number) => (
                <tr key={idx} className="border border-slate-800">
                  <td className="border border-slate-800 p-1.5 text-center">{idx + 1}</td>
                  <td className="border border-slate-800 p-1.5 font-bold uppercase">{e.testNo}</td>
                  <td className="border border-slate-800 p-1.5 font-semibold text-slate-700">{e.customerName}</td>
                  <td className="border border-slate-800 p-1.5">{e.siteName}</td>
                  <td className="border border-slate-800 p-1.5 font-black text-center">{e.grade}</td>
                  <td className="border border-slate-800 p-1.5 text-center text-slate-500">{e.cubeDimension || "150 X 150 X 150"}</td>
                  <td className="border border-slate-800 p-1.5 text-center font-bold">{e.noOfCasting}</td>
                  <td className="border border-slate-800 p-1.5 text-center">{format(new Date(e.createdAt), "dd/MM/yyyy")}</td>
                  <td className="border border-slate-800 p-1.5 uppercase font-medium">{e.plant}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-20 flex justify-between">
            <div className="text-center w-40 border-t border-slate-400 pt-1">
              <p className="text-[8px] font-black uppercase">Prepared By</p>
            </div>
            <div className="text-center w-40 border-t border-slate-400 pt-1">
              <p className="text-[8px] font-black uppercase">Verified By</p>
            </div>
            <div className="text-center w-40 border-t border-slate-400 pt-1">
              <p className="text-[8px] font-black uppercase">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ INDIVIDUAL RECORD PRINT VIEW ═══ */}
      {printingItem && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 font-sans text-slate-900 overflow-y-auto">
          <PrintHeader />
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <h2 className="text-xl font-black uppercase text-slate-800 tracking-widest">Compressive Strength Report</h2>
            <div className="text-right text-[10px] text-slate-500 font-bold">
              <p>Date: {format(new Date(), "dd/MM/yyyy")}</p>
              <p className="text-blue-600 uppercase">Test No: {printingItem.testNo}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 text-xs border border-slate-300 p-4 rounded bg-slate-50/50">
            <div className="space-y-2">
              <div className="flex"><span className="font-bold text-slate-500 w-32">Test No:</span> <span className="font-black text-slate-800">{printingItem.testNo}</span></div>
              <div className="flex"><span className="font-bold text-slate-500 w-32">Grade:</span> <span className="font-black text-slate-800">{printingItem.grade}</span></div>
              <div className="flex"><span className="font-bold text-slate-500 w-32">Plant:</span> <span className="font-black text-slate-800">{printingItem.plant}</span></div>
              <div className="flex"><span className="font-bold text-slate-500 w-32">Dimension:</span> <span className="font-black text-slate-800">{printingItem.cubeDimension || "150 X 150 X 150"}</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex"><span className="font-bold text-slate-500 w-32">Customer:</span> <span className="font-black text-slate-800">{printingItem.customerName}</span></div>
              <div className="flex"><span className="font-bold text-slate-500 w-32">Site Name:</span> <span className="font-black text-slate-800">{printingItem.siteName}</span></div>
              <div className="flex"><span className="font-bold text-slate-500 w-32">Cubes Cast:</span> <span className="font-black text-slate-800">{printingItem.noOfCasting} Cubes</span></div>
              <div className="flex"><span className="font-bold text-slate-500 w-32">Casting Date:</span> <span className="font-black text-slate-800">{format(new Date(printingItem.createdAt), "dd/MM/yyyy")}</span></div>
            </div>
          </div>

          <h3 className="text-xs font-black uppercase text-slate-800 mb-3 border-l-4 border-slate-800 pl-2">Testing Logs</h3>
          <table className="w-full border-collapse border border-slate-800 text-[10px] mb-8">
            <thead>
              <tr className="bg-slate-100 uppercase font-black">
                <th className="border border-slate-800 p-2 text-center">Cube Set</th>
                <th className="border border-slate-800 p-2 text-center">Age (Days)</th>
                <th className="border border-slate-800 p-2 text-center">Supply Date</th>
                <th className="border border-slate-800 p-2 text-right">Cube 1 Mass (kg)</th>
                <th className="border border-slate-800 p-2 text-right">Cube 1 Load (kN)</th>
                <th className="border border-slate-800 p-2 text-right">Cube 2 Mass (kg)</th>
                <th className="border border-slate-800 p-2 text-right">Cube 2 Load (kN)</th>
                <th className="border border-slate-800 p-2 text-right">Cube 3 Mass (kg)</th>
                <th className="border border-slate-800 p-2 text-right">Cube 3 Load (kN)</th>
                <th className="border border-slate-800 p-2 text-right">Avg Strength (N/mm²)</th>
              </tr>
            </thead>
            <tbody>
              {printingItem.results?.map((res: any, idx: number) => {
                const area = getArea(printingItem.cubeDimension);
                const l1 = parseFloat(res.cube1Load) || 0;
                const l2 = parseFloat(res.cube2Load) || 0;
                const l3 = parseFloat(res.cube3Load) || 0;
                
                const s1 = l1 ? (l1 * 1000) / area : 0;
                const s2 = l2 ? (l2 * 1000) / area : 0;
                const s3 = l3 ? (l3 * 1000) / area : 0;

                const activeCount = [s1, s2, s3].filter(s => s > 0).length;
                const avgStrength = activeCount ? ((s1 + s2 + s3) / activeCount).toFixed(2) : "-";

                return (
                  <tr key={idx} className="border border-slate-800 font-medium">
                    <td className="border border-slate-800 p-2 text-center font-bold">Set {idx + 1}</td>
                    <td className="border border-slate-800 p-2 text-center">{res.testingDays} Days</td>
                    <td className="border border-slate-800 p-2 text-center">{res.supplyDate}</td>
                    <td className="border border-slate-800 p-2 text-right">{res.cube1Mass || "-"}</td>
                    <td className="border border-slate-800 p-2 text-right">{res.cube1Load || "-"}</td>
                    <td className="border border-slate-800 p-2 text-right">{res.cube2Mass || "-"}</td>
                    <td className="border border-slate-800 p-2 text-right">{res.cube2Load || "-"}</td>
                    <td className="border border-slate-800 p-2 text-right">{res.cube3Mass || "-"}</td>
                    <td className="border border-slate-800 p-2 text-right">{res.cube3Load || "-"}</td>
                    <td className="border border-slate-800 p-2 text-right font-black text-blue-700">{avgStrength}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-between mt-24">
            <div className="text-center w-48 border-t border-slate-400 pt-2">
              <p className="text-[10px] font-black uppercase">Tested By</p>
            </div>
            <div className="text-center w-48 border-t border-slate-400 pt-2">
              <p className="text-[10px] font-black uppercase">QC Incharge</p>
            </div>
            <div className="text-center w-48 border-t border-slate-400 pt-2">
              <p className="text-[10px] font-black uppercase">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SCREEN INTERFACE ═══ */}
      <QcLayout
        breadcrumbs={[{ label: "Cube Test List" }]}
        title="CUBE TEST LIST"
        activePath="/qc/cube-test/list"
      >
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-6 space-y-6">

            {/* Filter Bar */}
            {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end mb-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Test No</Label>
                <Input 
                  placeholder="Enter Test No" 
                  className="h-10 text-xs border-slate-200 font-bold focus-visible:ring-[#1e40af]"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Casting Date</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    className="h-10 text-xs border-slate-200 font-bold focus-visible:ring-[#1e40af]"
                    value={filterCastingDate}
                    onChange={e => setFilterCastingDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Customer</Label>
                <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                  <SelectTrigger className="h-10 text-xs border-slate-200 font-bold">
                    <SelectValue placeholder="All Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Customer">All Customer</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Site Name</Label>
                <Select value={filterSite} onValueChange={setFilterSite}>
                  <SelectTrigger className="h-10 text-xs border-slate-200 font-bold">
                    <SelectValue placeholder="All Site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Site">All Site</SelectItem>
                    {sites.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Grade</Label>
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger className="h-10 text-xs border-slate-200 font-bold">
                    <SelectValue placeholder="All Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Grade">All Grade</SelectItem>
                    {grades.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => {
                  setCurrentPage(1);
                  fetchEntries();
                  toast({ title: "Search Applied", description: `Found ${filtered.length} cube test entries.` });
                }} 
                className="bg-[#10b981] hover:bg-emerald-600 h-10 font-bold text-xs uppercase tracking-wider"
              >
                Search
              </Button>
              <Button 
                variant="outline" 
                className="bg-[#f43f5e] hover:bg-rose-600 text-white border-none h-10 font-bold text-xs uppercase tracking-wider"
                onClick={() => {
                  setSearchQuery("");
                  setFilterCustomer("All Customer");
                  setFilterSite("All Site");
                  setFilterGrade("All Grade");
                  setFilterCastingDate("");
                  setCurrentPage(1);
                  toast({ title: "Filters Cleared", description: "Showing all cube test records." });
                }}
              >
                Clear
              </Button>
            </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-16 text-xs border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>entries</span>
              </div>
              <div className="flex gap-2 items-center">
                <ExportDropdown onCopy={handleCopyList} onCSV={handleExportListCSV} onPDF={handlePrintList} />
                <Button size="sm" variant="outline" onClick={() => setRefreshKey(k => k + 1)} className="h-9 w-9 p-0 border-slate-200">
                  <RotateCcw className={cn("h-4 w-4 text-slate-500", loading && "animate-spin")} />
                </Button>
              </div>
            </div>

            {/* High-density Table */}
            <div className="border border-slate-100 rounded overflow-hidden">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[#1e40af] border-b border-white/10">
                  <TableRow className="hover:bg-transparent border-0 bg-[#1e40af]">
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">S/L No</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">Test No</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Customer Name</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Site Name</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">Grade</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">Dimension</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">No Of Casting</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">Casting Date</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">Age</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Plant</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] uppercase tracking-tighter w-[70px] text-center no-print">OPTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <RotateCcw className="h-6 w-6 animate-spin text-blue-800" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Fetching Latest Test Records...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-40 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-1.5">
                          <FlaskConical className="h-8 w-8 text-slate-200 mb-1" />
                          <p className="text-xs font-bold">No cube tests found matching your criteria.</p>
                          <Button variant="link" size="sm" onClick={() => setRefreshKey(k => k + 1)} className="text-[#1e40af] font-black text-xs uppercase">Check again</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((e: any, idx: number) => {
                      const castingDate = new Date(e.createdAt);
                      const age = differenceInDays(new Date(), castingDate);
                      return (
                        <TableRow key={e.id || e._id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                          <TableCell className="text-[10px] font-bold text-slate-400 text-center border-r py-3 px-4">{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                          <TableCell className="text-[11px] border-r font-black text-blue-800 px-4 uppercase">{e.testNo}</TableCell>
                          <TableCell className="text-[10px] border-r font-bold text-slate-700 px-4 uppercase">{e.customerName}</TableCell>
                          <TableCell className="text-[10px] border-r font-bold text-slate-500 px-4 uppercase">{e.siteName}</TableCell>
                          <TableCell className="text-[10px] border-r font-black text-slate-800 text-center px-4 uppercase">{e.grade}</TableCell>
                          <TableCell className="text-[10px] border-r text-center text-slate-500 px-4">{e.cubeDimension || "150 X 150 X 150"}</TableCell>
                          <TableCell className="text-[10px] border-r text-center font-black text-slate-700 px-4">
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[9px] font-black">{e.noOfCasting} Cubes</span>
                          </TableCell>
                          <TableCell className="text-[10px] border-r text-center text-slate-600 font-bold px-4">{format(castingDate, "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-[10px] border-r text-center font-black text-rose-600 px-4">{age} Days</TableCell>
                          <TableCell className="text-[10px] border-r font-bold text-slate-600 px-4 uppercase">{e.plant || "FORTUNE CONCRETE"}</TableCell>
                          <TableCell className="text-center py-2 no-print">
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
                              <DropdownMenuContent align="end" className="w-56 text-xs bg-white border border-slate-200 shadow-lg rounded-md p-1 z-50">
                                <DropdownMenuItem onClick={() => handleCopyRow(e)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                  <Copy className="h-3.5 w-3.5 text-cyan-600" />
                                  <span>Copy Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExportRowCSV(e)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                  <FileCode className="h-3.5 w-3.5 text-teal-600" />
                                  <span>Download CSV</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrintItem(e)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                  <Printer className="h-3.5 w-3.5 text-red-500" />
                                  <span>Print Strength Report</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(e.id || e._id)} 
                                  className="gap-2 cursor-pointer hover:bg-red-50 p-2 rounded text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  <span>Delete Entry</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <div className="mt-4 flex items-center justify-between flex-wrap gap-4 pt-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={currentPage <= 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="text-xs font-black px-3 h-8 text-slate-600 hover:bg-slate-100"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <Button 
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`text-xs font-black w-8 h-8 ${currentPage === pageNum ? "bg-[#06b6d4] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    {pageNum}
                  </Button>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={currentPage >= totalPages} 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="text-xs font-black px-3 h-8 text-slate-600 hover:bg-slate-100"
                >
                  Next
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </QcLayout>
    </>
  );
}
