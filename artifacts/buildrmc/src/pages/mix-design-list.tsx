import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Search, RotateCcw, Plus, Copy, FileText, FileCode, Edit, Trash2, Layers } from "lucide-react";
import { QcLayout, useQcFilters } from "@/components/qc-layout";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";

interface MixDesignItem {
  id: number;
  recipeCode: string;
  recipeName: string;
  grade: string;
  aggr1: string;
  aggr2: string;
  aggr3: string;
  aggr4: string;
  cem1: string;
  cem2: string;
  cem3: string;
  water: string;
  admix1: string;
  admix2: string;
}

const INITIAL_DATA: MixDesignItem[] = [
  { id: 1, recipeCode: "M20 SCREED", recipeName: "M20 SCR", grade: "M-20", aggr1: "20MM : 100", aggr2: "10MM : 972", aggr3: "R SAND : 0", aggr4: "M SAND : 823", cem1: "CEM1 : 288", cem2: "GGBS : 52", cem3: "CEM3 : 0", water: "WATER : 160", admix1: "ADD-1 : 2", admix2: "Admix2 : 0" },
  { id: 2, recipeCode: "M35 SWASTHI", recipeName: "M35", grade: "M-35", aggr1: "20MM : 670", aggr2: "10MM : 420", aggr3: "R SAND : 0", aggr4: "CRF : 740", cem1: "CEM1 : 340", cem2: "FLAYASH : 60", cem3: "CEM3 : 0", water: "WATER : 170", admix1: "ADD-1 : 2.6", admix2: "Admix2 : 0" },
  { id: 3, recipeCode: "M30 FC A1", recipeName: "M30 FC", grade: "M-30", aggr1: "20MM : 620", aggr2: "10MM : 400", aggr3: "R SAND : 0", aggr4: "M SAND : 760", cem1: "CEM1 : 370", cem2: "CEM2 : 0", cem3: "CEM3 : 0", water: "WATER : 160", admix1: "ADD-1 : 1", admix2: "Admix2 : 0" },
  { id: 4, recipeCode: "M20 FC & VDF & WPC", recipeName: "M20FC", grade: "M-20", aggr1: "20MM : 635", aggr2: "10MM : 438", aggr3: "R SAND : 0", aggr4: "SAND : 848", cem1: "CEM1 : 320", cem2: "CEM2 : 0", cem3: "CEM3 : 0", water: "WATER : 165", admix1: "ADMIX1 : 2.2", admix2: "Admix2 : 0" },
  { id: 5, recipeCode: "M25FC SCREED", recipeName: "M25FC SCREED", grade: "M-25", aggr1: "20MM : 0", aggr2: "10MM : 999", aggr3: "R SAND : 0", aggr4: "SAND : 880", cem1: "CEM1 : 340", cem2: "CEM2 : 0", cem3: "CEM3 : 0", water: "WATER : 170", admix1: "AD1 : 2.5", admix2: "Admix2 : 0" },
  { id: 6, recipeCode: "M30 KEYSTONE", recipeName: "M30", grade: "M-30", aggr1: "20MM : 630", aggr2: "12MM : 410", aggr3: "R SAND : 405", aggr4: "SAND : 405", cem1: "CEM1 : 320", cem2: "CEM2 : 80", cem3: "CEM3 : 0", water: "WATER : 150", admix1: "AD1 : 2.8", admix2: "Admix2 : 0" },
  { id: 7, recipeCode: "M25 SCC VEEDHA", recipeName: "M25 SCC", grade: "M-25", aggr1: "20MM : 0", aggr2: "12MM : 920", aggr3: "R SAND : 0", aggr4: "SAND : 880", cem1: "CEM1 : 280", cem2: "CEM2 : 165", cem3: "CEM3 : 0", water: "WATER : 170", admix1: "ADMIX1 : 2", admix2: "Admix2 : 0" },
  { id: 8, recipeCode: "M25 FC", recipeName: "M25 FC", grade: "M-25", aggr1: "20MM : 655", aggr2: "12MM : 423", aggr3: "R SAND : 0", aggr4: "M SAND : 812", cem1: "CEM1 : 340", cem2: "CEM2 : 0", cem3: "CEM3 : 0", water: "WATER : 168", admix1: "ADMIX1 : 2.8", admix2: "Admix2 : 0" },
  { id: 9, recipeCode: "M30 PCH RIVER EDGE LLP", recipeName: "M30", grade: "M-30", aggr1: "20MM : 620", aggr2: "12MM : 418", aggr3: "R SAND : 0", aggr4: "M SAND : 774", cem1: "CEM1 : 273", cem2: "GGBS : 117", cem3: "CEM3 : 0", water: "WATER : 183", admix1: "ADMIX1 : 1.38", admix2: "Admix2 : 0" },
  { id: 10, recipeCode: "M35 SAADCRETE", recipeName: "M35", grade: "M-35", aggr1: "20MM : 632", aggr2: "12MM : 422", aggr3: "M SAND : 749", aggr4: "R SAND : 0", cem1: "CEM1 : 285", cem2: "GGBS : 135", cem3: "CEM3 : 0", water: "WATER : 177", admix1: "ADMIX1 : 1.3", admix2: "Admix2 : 0" },
];

export default function MixDesignList() {
  const { showFilters } = useQcFilters();
  const { toast } = useToast();
  const [items, setItems] = useState<MixDesignItem[]>([]);

  // Load from localStorage or initialize with screenshot data
  const fetchItems = async () => {
    try {
      const res = await fetch("/api/mix-designs");
      if (res.ok) {
        const data = await res.json();
        setItems(data.length > 0 ? data : INITIAL_DATA);
      }
    } catch (error) {
      console.error("Failed to fetch mix designs", error);
      setItems(INITIAL_DATA);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const [searchCode, setSearchCode] = useState("");
  const [searchGrade, setSearchGrade] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItem, setEditingItem] = useState<MixDesignItem | null>(null);
  const [printingItem, setPrintingItem] = useState<MixDesignItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (searchCode && !item.recipeCode.toLowerCase().includes(searchCode.toLowerCase())) return false;
      if (searchGrade !== "all" && item.grade !== searchGrade) return false;
      return true;
    });
  }, [items, searchCode, searchGrade]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleClear = () => {
    setSearchCode("");
    setSearchGrade("all");
    setCurrentPage(1);
    toast({ title: "Filters Cleared", description: "Showing all concrete mix formulations." });
  };

  const handleDelete = async (id: any) => {
    if (!confirm("Are you sure you want to delete this mix design?")) return;
    try {
      const res = await fetch(`/api/mix-designs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems(items.filter(i => i.id !== id));
        toast({ title: "Mix Design Deleted", description: "Record removed successfully from database." });
      }
    } catch (error) {
      toast({ title: "Delete Failed", description: "Could not remove record from database.", variant: "destructive" });
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updated = items.map(i => i.id === editingItem.id ? editingItem : i);
    setItems(updated);
    localStorage.setItem("qc_mix_design_list_v2", JSON.stringify(updated));
    setEditingItem(null);
    toast({ title: "Updated Successfully", description: `Recipe ${editingItem.recipeCode} updated.` });
  };

  const handleExport = (type: string, specificItem?: MixDesignItem) => {
    const dataToExport = specificItem ? [specificItem] : filtered;
    const headers = ["Recipe Code", "Recipe Name", "Aggr1", "Aggr2", "Aggr3", "Aggr4", "Cem1", "Cem2", "Cem3", "Water", "Admix1", "Admix2"];
    const rows = dataToExport.map(i => [i.recipeCode, i.recipeName, i.aggr1, i.aggr2, i.aggr3, i.aggr4, i.cem1, i.cem2, i.cem3, i.water, i.admix1, i.admix2]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    if (type === "copy") {
      navigator.clipboard.writeText(csvContent);
      toast({ title: "Copied to Clipboard", description: `Copied ${dataToExport.length} row(s) to clipboard.` });
    } else if (type === "csv") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; 
      link.setAttribute("download", specificItem ? `mix_design_${specificItem.recipeCode}.csv` : `mix_designs_export.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast({ title: "CSV Downloaded", description: "Your file is ready." });
    } else if (type === "pdf") {
      setPrintingItem(specificItem || null);
      setTimeout(() => {
        window.print();
      }, 100);
    }
  };

  return (
    <>
      <div className="hidden print:block absolute inset-0 bg-white z-[9999] p-8">
        <PrintHeader />
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">{printingItem ? 'Single Formulation Report' : 'Mix Design Summary Report'}</h2>
            <p className="text-xs font-semibold text-gray-500 mt-1">Doc ID: RMC/QC/{Math.floor(Math.random() * 9000) + 1000}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {printingItem ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-black bg-blue-50 p-2 text-blue-900 border-l-4 border-blue-900 uppercase">Primary Specifications</h3>
                <div className="grid grid-cols-2 text-[10px] gap-y-2">
                  <span className="text-gray-500 font-bold uppercase">Recipe Code:</span> <span className="font-black text-blue-900">{printingItem.recipeCode}</span>
                  <span className="text-gray-500 font-bold uppercase">Recipe Name:</span> <span className="font-black">{printingItem.recipeName}</span>
                  <span className="text-gray-500 font-bold uppercase">Concrete Grade:</span> <span className="font-black px-2 py-0.5 bg-gray-100 rounded">{printingItem.grade}</span>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-black bg-slate-50 p-2 text-slate-800 border-l-4 border-slate-800 uppercase">Material Batching (kg/m³)</h3>
                <div className="grid grid-cols-2 text-[10px] gap-y-2">
                  <span className="text-gray-500 font-bold">Aggregate-1:</span> <span>{printingItem.aggr1}</span>
                  <span className="text-gray-500 font-bold">Aggregate-2:</span> <span>{printingItem.aggr2}</span>
                  <span className="text-gray-500 font-bold">Cement-1:</span> <span className="font-bold">{printingItem.cem1}</span>
                  <span className="text-gray-500 font-bold">Water:</span> <span className="font-bold text-blue-600">{printingItem.water}</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6 bg-slate-50/30">
              <h3 className="text-sm font-black mb-4 uppercase text-gray-800">Detailed Formulation Matrix</h3>
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2 text-gray-500 font-black">INGREDIENT</th>
                    <th className="text-right py-2 text-gray-500 font-black">SPECIFICATION (kg)</th>
                    <th className="text-right py-2 text-gray-500 font-black">TOLERANCE (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100"><td className="py-2 font-bold">Aggregate 1 (20mm)</td><td className="text-right">{printingItem.aggr1}</td><td className="text-right">± 3%</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 font-bold">Aggregate 2 (10mm)</td><td className="text-right">{printingItem.aggr2}</td><td className="text-right">± 3%</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 font-bold">Cementitious 1</td><td className="text-right font-black">{printingItem.cem1}</td><td className="text-right">± 2%</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 font-bold text-blue-600">Water</td><td className="text-right font-black text-blue-600">{printingItem.water}</td><td className="text-right">± 1%</td></tr>
                  <tr><td className="py-2 font-bold text-emerald-600">Admixture 1</td><td className="text-right font-black text-emerald-600">{printingItem.admix1}</td><td className="text-right">± 1%</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <table className="w-full text-[10px] border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Recipe Code</th>
                <th className="border border-gray-300 p-2 text-left">Grade</th>
                <th className="border border-gray-300 p-2 text-left">Aggr1</th>
                <th className="border border-gray-300 p-2 text-left">Aggr2</th>
                <th className="border border-gray-300 p-2 text-left">Cem1</th>
                <th className="border border-gray-300 p-2 text-left">Water</th>
                <th className="border border-gray-300 p-2 text-left">Admix1</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td className="border border-gray-300 p-2 font-bold text-blue-900">{item.recipeCode}</td>
                  <td className="border border-gray-300 p-2">{item.grade}</td>
                  <td className="border border-gray-300 p-2">{item.aggr1}</td>
                  <td className="border border-gray-300 p-2">{item.grade}</td>
                  <td className="border border-gray-300 p-2 font-bold">{item.cem1}</td>
                  <td className="border border-gray-300 p-2 text-blue-600 font-bold">{item.water}</td>
                  <td className="border border-gray-300 p-2 font-bold text-emerald-600">{item.admix1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        <div className="mt-16 flex justify-between">
          <div className="text-center">
            <div className="w-48 border-t-2 border-gray-400 pt-1"></div>
            <p className="text-[9px] font-black uppercase text-gray-600 tracking-wider">Quality Assurance Manager</p>
            <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Auth Signature Required</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-t-2 border-gray-400 pt-1"></div>
            <p className="text-[9px] font-black uppercase text-gray-600 tracking-wider">Authorized Signatory</p>
            <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Build RMC Plant Head</p>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-8 right-8 text-center border-t border-gray-200 pt-4">
          <p className="text-[8px] text-gray-400 uppercase font-black tracking-[0.2em]">Confidential Business Intelligence • Build RMC QC Management System</p>
        </div>
      </div>

      {/* Top Header & Breadcrumbs & Sidebar unified via QcLayout */}
      <QcLayout
        breadcrumbs={[{ label: "Mix Design List" }]}
        title="Mix Design List"
        activePath="/qc/mix-design/list"
      >
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        
        {/* Filters Row matching screenshot */}
        {showFilters && (
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-end gap-4">
          <div className="space-y-1.5 min-w-[220px] flex-1">
            <Label className="text-xs font-black uppercase text-slate-700">Recipe Code</Label>
            <Input
              value={searchCode}
              onChange={e => { setSearchCode(e.target.value); setCurrentPage(1); }}
              placeholder="Enter Recipe Code"
              className="h-10 text-xs font-semibold bg-white border-slate-300"
            />
          </div>

          <div className="space-y-1.5 min-w-[200px]">
            <Label className="text-xs font-black uppercase text-slate-700">Grade</Label>
            <Select value={searchGrade} onValueChange={v => { setSearchGrade(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 text-xs font-bold bg-white border-slate-300">
                <SelectValue placeholder="All Item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold">All Item</SelectItem>
                {["M-10", "M-15", "M-20", "M-25", "M-30", "M-35", "M-40", "M-45", "M-50", "M-55", "M-60"].map(g => (
                  <SelectItem key={g} value={g} className="font-bold">{g}</SelectItem>
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
            <Link href="/qc/mix-design/new">
              <Button
                className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black px-6 h-10 shadow-sm shadow-sky-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Mix Design
              </Button>
            </Link>
          </div>
        </div>
        )}

        {/* Toolbar Row matching screenshot */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-16 h-8 text-xs font-black bg-slate-50 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)} className="font-bold">{n}</SelectItem>)}
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

        {/* Data Grid Table matching screenshot */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100/80">
              <TableRow className="border-b border-slate-200">
                <TableHead className="text-[11px] font-black uppercase text-slate-800 py-3.5 px-4 whitespace-nowrap">Recipe Code</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Recipe Name</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Aggr1</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Aggr2</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Aggr3</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Aggr4</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Cem1</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Cem2</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Cem3</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Water</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Admix1</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-3 whitespace-nowrap">Admix2</TableHead>
                <TableHead className="text-[11px] font-black uppercase text-slate-800 px-4 text-center whitespace-nowrap">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12 text-xs font-semibold text-slate-500">
                    No mix designs found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((item, index) => (
                  <TableRow key={item.id} className={`hover:bg-slate-50/80 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                    <TableCell className="font-extrabold text-[#1e40af] text-xs py-3 px-4 whitespace-nowrap">{item.recipeCode}</TableCell>
                    <TableCell className="font-bold text-slate-700 text-xs px-3 whitespace-nowrap">{item.recipeName}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 px-3 whitespace-nowrap">{item.aggr1}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 px-3 whitespace-nowrap">{item.aggr2}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 px-3 whitespace-nowrap">{item.aggr3}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 px-3 whitespace-nowrap">{item.aggr4}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-800 px-3 whitespace-nowrap">{item.cem1}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-800 px-3 whitespace-nowrap">{item.cem2}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-800 px-3 whitespace-nowrap">{item.cem3}</TableCell>
                    <TableCell className="text-xs font-bold text-blue-600 px-3 whitespace-nowrap">{item.water}</TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-700 px-3 whitespace-nowrap">{item.admix1}</TableCell>
                    <TableCell className="text-xs font-semibold text-emerald-700 px-3 whitespace-nowrap">{item.admix2}</TableCell>
                    <TableCell className="px-4 py-3 text-center whitespace-nowrap print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleExport("copy", item)}
                          className="h-7 w-7 text-slate-500 hover:bg-slate-100"
                          title="Copy Row"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleExport("csv", item)}
                          className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                          title="Download CSV"
                        >
                          <FileCode className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleExport("pdf", item)}
                          className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                          title="Print Record"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>

                        <div className="w-px h-4 bg-gray-200 mx-1" />

                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setEditingItem(item)}
                          className="h-7 w-7 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleDelete(item.id)}
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

        {/* Pagination Footer matching screenshot */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-4">
          <div className="text-xs font-bold text-slate-600">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <Button
              variant="ghost" size="sm"
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
                className={`text-xs font-black w-8 h-8 ${currentPage === pageNum ? "bg-[#0ea5e9] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {pageNum}
              </Button>
            ))}
            <Button
              variant="ghost" size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="text-xs font-black px-3 h-8 text-slate-600 hover:bg-slate-100"
            >
              Next
            </Button>
          </div>
        </div>

      </Card>

      {/* Edit Recipe Modal */}
      <Dialog open={!!editingItem} onOpenChange={open => !open && setEditingItem(null)}>
        <DialogContent className="max-w-xl bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-lg border-b border-slate-100 pb-2">Edit Mix Formulation</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700 uppercase">Recipe Code</Label>
                  <Input value={editingItem.recipeCode} onChange={e => setEditingItem({...editingItem, recipeCode: e.target.value})} className="bg-white h-9 text-xs font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700 uppercase">Recipe Name</Label>
                  <Input value={editingItem.recipeName} onChange={e => setEditingItem({...editingItem, recipeName: e.target.value})} className="bg-white h-9 text-xs font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700 uppercase">Aggr1 Proportion</Label>
                  <Input value={editingItem.aggr1} onChange={e => setEditingItem({...editingItem, aggr1: e.target.value})} className="bg-white h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700 uppercase">Cem1 Proportion</Label>
                  <Input value={editingItem.cem1} onChange={e => setEditingItem({...editingItem, cem1: e.target.value})} className="bg-white h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700 uppercase">Water Proportion</Label>
                  <Input value={editingItem.water} onChange={e => setEditingItem({...editingItem, water: e.target.value})} className="bg-white h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-slate-700 uppercase">Admix1 Proportion</Label>
                  <Input value={editingItem.admix1} onChange={e => setEditingItem({...editingItem, admix1: e.target.value})} className="bg-white h-9 text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="h-9 text-xs font-bold">Cancel</Button>
                <Button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-white font-black h-9 text-xs px-5">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      </QcLayout>
    </>
  );
}
