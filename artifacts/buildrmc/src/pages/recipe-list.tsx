import { useState, useEffect, useMemo } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  RotateCcw, 
  Trash2, 
  Eye, 
  FileText,
  Building2,
  MapPin,
  ClipboardList,
  User,
  Copy,
  FileCode,
  FileDown,
  Printer,
  Edit,
  MoreVertical
} from "lucide-react";
import { QcLayout, useQcFilters } from "@/components/qc-layout";
import { ExportDropdown } from "@/components/export-dropdown";
import { PrintHeader } from "@/components/print-header";

export default function RecipeList() {
  const { toast } = useToast();
  const { showFilters } = useQcFilters();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchCode, setSearchCode] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("all");
  const [searchSite, setSearchSite] = useState("all");
  const [searchGrade, setSearchGrade] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  
  const [printingItem, setPrintingItem] = useState<any | null>(null);
  const [isPrintingList, setIsPrintingList] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recipes");
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch recipes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const uniqueCustomers = useMemo(() => Array.from(new Set(recipes.map(r => r.customer))), [recipes]);
  const uniqueSites = useMemo(() => Array.from(new Set(recipes.map(r => r.siteName))), [recipes]);
  const uniqueGrades = useMemo(() => Array.from(new Set(recipes.map(r => r.grade))), [recipes]);

  const filtered = useMemo(() => {
    return recipes.filter(r => {
      if (searchCode && !r.recipeCode.toLowerCase().includes(searchCode.toLowerCase())) return false;
      if (searchCustomer !== "all" && r.customer !== searchCustomer) return false;
      if (searchSite !== "all" && r.siteName !== searchSite) return false;
      if (searchGrade !== "all" && r.grade !== searchGrade) return false;
      return true;
    });
  }, [recipes, searchCode, searchCustomer, searchSite, searchGrade]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecipes(prev => prev.filter(r => r.id !== id));
        toast({ title: "Deleted", description: "Recipe removed from database." });
      }
    } catch (error) {
      toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/recipes/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem)
      });
      if (res.ok) {
        const updated = await res.json();
        setRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
        setEditingItem(null);
        toast({ title: "Updated Successfully", description: `Recipe ${editingItem.recipeCode} saved.` });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update recipe.", variant: "destructive" });
    }
  };

  const handlePrint = (recipe: any) => {
    setPrintingItem(recipe);
    setTimeout(() => {
      window.print();
      setPrintingItem(null);
    }, 100);
  };

  const handleExport = (type: string) => {
    const headers = ["S/L No", "Recipe Code", "Customer", "Site Name", "Grade", "Plant", "Slump", "Total Density"];
    const rows = filtered.map((r, idx) => [idx + 1, r.recipeCode, r.customer, r.siteName, r.grade, r.plant, r.slump, r.totalDensity]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    if (type === "copy") {
      navigator.clipboard.writeText(csvContent);
      toast({ title: "Copied", description: "Table data copied to clipboard." });
    } else if (type === "csv") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Recipe_List.csv";
      link.click();
    } else if (type === "pdf") {
      setIsPrintingList(true);
      setTimeout(() => {
        window.print();
        setIsPrintingList(false);
      }, 100);
    }
  };

  return (
    <>
      
      {/* ═══ LIST PRINT SECTION (Professional Layout) ═══ */}
      {isPrintingList && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 font-serif text-slate-900 overflow-y-auto">
          <PrintHeader />
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <h2 className="text-xl font-black uppercase text-slate-800 tracking-widest">Recipe Summary Report</h2>
            <div className="text-right text-[10px] text-slate-500 font-bold">
              <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
              <p>Total Records: {filtered.length}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-800 text-[10px]">
            <thead>
              <tr className="bg-slate-100 uppercase">
                <th className="border border-slate-800 p-2 text-center w-12">S/L</th>
                <th className="border border-slate-800 p-2 text-left">Recipe Code</th>
                <th className="border border-slate-800 p-2 text-left">Customer</th>
                <th className="border border-slate-800 p-2 text-left">Site Name</th>
                <th className="border border-slate-800 p-2 text-left">Grade</th>
                <th className="border border-slate-800 p-2 text-left">Plant</th>
                <th className="border border-slate-800 p-2 text-center w-16">Slump</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={idx} className="border border-slate-800">
                  <td className="border border-slate-800 p-1.5 text-center">{idx + 1}</td>
                  <td className="border border-slate-800 p-1.5 font-bold uppercase">{r.recipeCode}</td>
                  <td className="border border-slate-800 p-1.5">{r.customer}</td>
                  <td className="border border-slate-800 p-1.5">{r.siteName}</td>
                  <td className="border border-slate-800 p-1.5 font-black">{r.grade}</td>
                  <td className="border border-slate-800 p-1.5">{r.plant}</td>
                  <td className="border border-slate-800 p-1.5 text-center font-bold">{r.slump}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-12 flex justify-between">
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
          
          <div className="absolute bottom-6 left-8 right-8 text-center border-t border-slate-100 pt-2">
            <p className="text-[7px] text-slate-400 uppercase font-black tracking-widest">Build RMC Enterprise Management System • Confidential</p>
          </div>
        </div>
      )}
      {printingItem && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 font-serif text-slate-900">
          <PrintHeader />
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <h2 className="text-xl font-black uppercase text-slate-800 tracking-widest">Mix Recipe Report</h2>
            <div className="text-right text-[10px] text-slate-500 font-bold">
              <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
              <p className="text-blue-600 font-bold">Doc ID: RMC/REC/{Math.floor(Math.random()*9000)+1000}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-1"><span className="font-black text-slate-500 uppercase">Recipe Code:</span> <span className="font-bold">{printingItem.recipeCode}</span></div>
              <div className="flex justify-between border-b pb-1"><span className="font-black text-slate-500 uppercase">Grade:</span> <span className="font-bold">{printingItem.grade}</span></div>
              <div className="flex justify-between border-b pb-1"><span className="font-black text-slate-500 uppercase">Slump:</span> <span className="font-bold">{printingItem.slump}</span></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-1"><span className="font-black text-slate-500 uppercase">Customer:</span> <span className="font-bold">{printingItem.customer}</span></div>
              <div className="flex justify-between border-b pb-1"><span className="font-black text-slate-500 uppercase">Site Name:</span> <span className="font-bold">{printingItem.siteName}</span></div>
              <div className="flex justify-between border-b pb-1"><span className="font-black text-slate-500 uppercase">Plant:</span> <span className="font-bold">{printingItem.plant}</span></div>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-800 text-[11px] mb-12">
            <thead>
              <tr className="bg-slate-100 uppercase">
                <th className="border border-slate-800 p-2 text-left">Mix Types</th>
                <th className="border border-slate-800 p-2 text-left">Product</th>
                <th className="border border-slate-800 p-2 text-right">Quantity (kg/m³)</th>
              </tr>
            </thead>
            <tbody>
              {printingItem.ingredients?.map((ing: any) => (
                <tr key={ing.sl}>
                  <td className="border border-slate-800 p-2 font-bold">{ing.type}</td>
                  <td className="border border-slate-800 p-2">{ing.product || "-"}</td>
                  <td className="border border-slate-800 p-2 text-right font-black">{ing.qty || "0"}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-black text-sm">
                <td colSpan={2} className="border border-slate-800 p-3 text-right uppercase">Total Density:</td>
                <td className="border border-slate-800 p-3 text-right text-blue-800">{printingItem.totalDensity?.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between mt-24">
            <div className="text-center w-48 border-t border-slate-400 pt-2">
              <p className="text-[10px] font-black uppercase">Prepared By</p>
            </div>
            <div className="text-center w-48 border-t border-slate-400 pt-2">
              <p className="text-[10px] font-black uppercase">Plant Incharge</p>
            </div>
            <div className="text-center w-48 border-t border-slate-400 pt-2">
              <p className="text-[10px] font-black uppercase">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ UI SECTION ═══ */}
      <QcLayout
        breadcrumbs={[{ label: "Recipe List" }]}
        title="RECIPE LIST"
        activePath="/qc/recipe/list"
      >
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-6">
            {/* Filters matching image */}
            {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end mb-8">
              <div className="space-y-1.5 lg:col-span-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Recipe Code</Label>
                <Input 
                  value={searchCode} 
                  onChange={e => setSearchCode(e.target.value)} 
                  placeholder="Enter Recipe Code" 
                  className="h-10 text-xs font-bold border-slate-300" 
                />
              </div>
              <div className="space-y-1.5 lg:col-span-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Customer :</Label>
                <Select value={searchCustomer} onValueChange={setSearchCustomer}>
                  <SelectTrigger className="h-10 text-xs font-bold border-slate-300">
                    <SelectValue placeholder="All Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customer</SelectItem>
                    {uniqueCustomers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 lg:col-span-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Site :</Label>
                <Select value={searchSite} onValueChange={setSearchSite}>
                  <SelectTrigger className="h-10 text-xs font-bold border-slate-300">
                    <SelectValue placeholder="All Site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Site</SelectItem>
                    {uniqueSites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 lg:col-span-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Grade</Label>
                <Select value={searchGrade} onValueChange={setSearchGrade}>
                  <SelectTrigger className="h-10 text-xs font-bold border-slate-300">
                    <SelectValue placeholder="All Product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Product</SelectItem>
                    {uniqueGrades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 lg:col-span-3">
                <Button className="bg-[#10b981] hover:bg-[#059669] text-white font-black h-10 px-6 text-xs uppercase tracking-widest flex-1">
                  Search
                </Button>
                <Button variant="destructive" onClick={() => { setSearchCode(""); setSearchCustomer("all"); setSearchSite("all"); setSearchGrade("all"); }} className="font-black h-10 px-6 text-xs uppercase tracking-widest flex-1">
                  Clear
                </Button>
                <Link href="/qc/recipe/new" className="flex-1">
                  <Button className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black h-10 px-6 text-xs uppercase tracking-widest w-full">
                    Add Recipe
                  </Button>
                </Link>
              </div>
            </div>
            )}

            {/* Toolbar Row */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
                  <SelectTrigger className="w-16 h-8 text-xs font-black border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
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

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[#1e40af] border-b border-white/10">
                  <TableRow className="hover:bg-transparent border-0 bg-[#1e40af]">
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-center">S/L No</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Recipe Code</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Customer</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Site Name</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Grade</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Plant</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">Slump</TableHead>
                    <TableHead className="bg-[#1e40af] text-white font-black py-1.5 px-2 text-[9px] uppercase tracking-tighter w-[70px] text-center no-print">OPTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-20 font-black text-slate-300 uppercase tracking-widest">Loading Database...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-20 font-black text-slate-300 uppercase tracking-widest">No Records Found</TableCell></TableRow>
                  ) : (
                    filtered.slice(0, pageSize).map((r, idx) => (
                      <TableRow key={r.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                        <TableCell className="font-bold text-slate-400 text-[10px] px-4">{idx + 1}</TableCell>
                        <TableCell className="font-black text-[#1e40af] text-[11px] px-4">{r.recipeCode}</TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-700 px-4">{r.customer}</TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-500 px-4">{r.siteName}</TableCell>
                        <TableCell className="text-[10px] font-black text-slate-800 px-4">{r.grade}</TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-600 px-4">{r.plant}</TableCell>
                        <TableCell className="text-[10px] font-black text-slate-600 px-4">{r.slump}</TableCell>
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
                              <DropdownMenuItem onClick={() => {
                                const csv = ["Recipe Code", "Customer", "Site Name", "Grade", "Plant", "Slump"].join(",") + "\n" + [r.recipeCode, r.customer, r.siteName, r.grade, r.plant, r.slump].join(",");
                                navigator.clipboard.writeText(csv);
                                toast({ title: "Copied", description: "Recipe data copied." });
                              }} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                <Copy className="h-3.5 w-3.5 text-cyan-600" />
                                <span>Copy Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const headers = ["Recipe Code", "Customer", "Site Name", "Grade", "Plant", "Slump"];
                                const row = [r.recipeCode, r.customer, r.siteName, r.grade, r.plant, r.slump];
                                const csvContent = [headers, row].map(e => e.join(",")).join("\n");
                                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                                const link = document.createElement("a");
                                link.href = URL.createObjectURL(blob);
                                link.download = `Recipe_${r.recipeCode}.csv`;
                                link.click();
                              }} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                <FileCode className="h-3.5 w-3.5 text-teal-600" />
                                <span>Download CSV</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrint(r)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                <Printer className="h-3.5 w-3.5 text-red-500" />
                                <span>Print Recipe</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingItem(r)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                                <Edit className="h-3.5 w-3.5 text-blue-600" />
                                <span>Edit Recipe</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(r.id)} 
                                className="gap-2 cursor-pointer hover:bg-red-50 p-2 rounded text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                <span>Delete Recipe</span>
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

            {/* Pagination Footer */}
            <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                Showing 1 to {Math.min(pageSize, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" disabled className="h-8 text-[10px] font-bold uppercase">Previous</Button>
                <Button className="h-8 w-8 bg-[#0ea5e9] text-white text-[10px] font-bold">1</Button>
                <Button variant="outline" className="h-8 w-8 text-[10px] font-bold">2</Button>
                <Button variant="outline" className="h-8 w-8 text-[10px] font-bold">3</Button>
                <Button variant="outline" className="h-8 text-[10px] font-bold uppercase">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Recipe Modal */}
        <Dialog open={!!editingItem} onOpenChange={open => !open && setEditingItem(null)}>
          <DialogContent className="max-w-xl bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-800 font-black text-lg border-b border-slate-100 pb-2">Edit Recipe formulation</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 uppercase">Recipe Code</Label>
                    <Input value={editingItem.recipeCode} onChange={e => setEditingItem({...editingItem, recipeCode: e.target.value})} className="bg-white h-9 text-xs font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 uppercase">Customer</Label>
                    <Input value={editingItem.customer} onChange={e => setEditingItem({...editingItem, customer: e.target.value})} className="bg-white h-9 text-xs font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 uppercase">Site Name</Label>
                    <Input value={editingItem.siteName} onChange={e => setEditingItem({...editingItem, siteName: e.target.value})} className="bg-white h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 uppercase">Grade</Label>
                    <Input value={editingItem.grade} onChange={e => setEditingItem({...editingItem, grade: e.target.value})} className="bg-white h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 uppercase">Plant</Label>
                    <Input value={editingItem.plant} onChange={e => setEditingItem({...editingItem, plant: e.target.value})} className="bg-white h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700 uppercase">Slump (mm)</Label>
                    <Input value={editingItem.slump} onChange={e => setEditingItem({...editingItem, slump: e.target.value})} className="bg-white h-9 text-xs" />
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
