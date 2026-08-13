import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMasters } from "@workspace/api-client-react";
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
import { ChevronRight, Save, RotateCcw, ListFilter, Layers, Scale, Sparkles } from "lucide-react";
import { QcLayout } from "@/components/qc-layout";

interface IngredientRow {
  sl: number;
  type: string;
  product: string;
  productPlaceholder: string;
  qty: string;
  qtyPlaceholder: string;
  fixedProduct?: boolean;
}

const INITIAL_ROWS: IngredientRow[] = [
  { sl: 1,  type: "Aggregate-1", product: "", productPlaceholder: "Enter Aggregate1 Name", qty: "", qtyPlaceholder: "Enter Aggregate1 Quantity" },
  { sl: 2,  type: "Aggregate-2", product: "", productPlaceholder: "Enter Aggregate2 Name", qty: "", qtyPlaceholder: "Enter Aggregate2 Quantity" },
  { sl: 3,  type: "Aggregate-3", product: "", productPlaceholder: "Enter Aggregate3 Name", qty: "", qtyPlaceholder: "Enter Aggregate3 Quantity" },
  { sl: 4,  type: "Aggregate-4", product: "", productPlaceholder: "Enter Aggregate 4 Name", qty: "", qtyPlaceholder: "Enter Aggregate4 Quantity" },
  { sl: 5,  type: "Cement-1",    product: "", productPlaceholder: "Enter Cement-1 Name", qty: "", qtyPlaceholder: "Enter Cement-1 Quantity" },
  { sl: 6,  type: "Cement-2",    product: "", productPlaceholder: "Enter Cement-2 Name", qty: "", qtyPlaceholder: "Enter Cement-2 Quantity" },
  { sl: 7,  type: "Cement-3",    product: "", productPlaceholder: "Enter Cement-3 Name", qty: "", qtyPlaceholder: "Enter Cement-3 Quantity" },
  { sl: 8,  type: "Cement-4/FLYASH", product: "", productPlaceholder: "Enter Cement-4 Name", qty: "", qtyPlaceholder: "Enter Cement-4 Quantity" },
  { sl: 9,  type: "Cement-5",    product: "", productPlaceholder: "Enter Cement-5 Name", qty: "", qtyPlaceholder: "Enter Cement-5 Quantity" },
  { sl: 10, type: "Water",       product: "Water", productPlaceholder: "Water", qty: "", qtyPlaceholder: "Enter Water Quantity", fixedProduct: true },
  { sl: 11, type: "Admix1",      product: "", productPlaceholder: "Enter Admixture1 Name", qty: "", qtyPlaceholder: "Enter Admixture1 Quantity" },
  { sl: 12, type: "Admix2",      product: "", productPlaceholder: "Enter Admixture2 Name", qty: "", qtyPlaceholder: "Enter Admixture2 Quantity" },
];

export default function AddMixDesign() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [recipeCode, setRecipeCode] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [grade, setGrade] = useState("");
  const [rows, setRows] = useState<IngredientRow[]>(INITIAL_ROWS);

  const { data: dbGrades } = useGetMasters("grade");
  const [fetchedGrades, setFetchedGrades] = useState<string[]>([]);

  // Direct fetch fallback to ensure grades always load
  useEffect(() => {
    fetch("/api/masters?type=grade")
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        const names = data.map((g: any) => g.name).filter(Boolean);
        setFetchedGrades(names);
      })
      .catch(() => {});
  }, []);

  const gradesList = useMemo(() => {
    // Merge both sources, preferring direct fetch for reliability
    const fromHook = (dbGrades || []).map((g: any) => g.name).filter(Boolean);
    const merged = [...new Set([...fetchedGrades, ...fromHook])];
    return merged.sort();
  }, [dbGrades, fetchedGrades]);

  const totalDensity = useMemo(() => {
    return rows.reduce((acc, row) => {
      const q = parseFloat(row.qty);
      return acc + (isNaN(q) ? 0 : q);
    }, 0);
  }, [rows]);

  const handleProductChange = (sl: number, val: string) => {
    setRows(prev => prev.map(r => r.sl === sl ? { ...r, product: val } : r));
  };

  const handleQtyChange = (sl: number, val: string) => {
    setRows(prev => prev.map(r => r.sl === sl ? { ...r, qty: val } : r));
  };

  const handleClear = () => {
    setRecipeCode("");
    setRecipeName("");
    setGrade("");
    setRows(INITIAL_ROWS);
    toast({ title: "Form Cleared", description: "All design inputs reset." });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeCode || !recipeName || !grade) {
      toast({ title: "Validation Error", description: "Recipe Code, Name and Concrete Grade are required.", variant: "destructive" });
      return;
    }

    const payload = {
      recipeCode,
      recipeName,
      grade,
      aggr1: `${rows[0].product || "20MM"} : ${rows[0].qty || "0"}`,
      aggr2: `${rows[1].product || "10MM"} : ${rows[1].qty || "0"}`,
      aggr3: `${rows[2].product || "R SAND"} : ${rows[2].qty || "0"}`,
      aggr4: `${rows[3].product || "M SAND"} : ${rows[3].qty || "0"}`,
      cem1: `${rows[4].product || "OPC"} : ${rows[4].qty || "0"}`,
      cem2: `${rows[5].product || "FLYASH"} : ${rows[5].qty || "0"}`,
      cem3: `${rows[6].product || "GGBS"} : ${rows[6].qty || "0"}`,
      water: `WATER : ${rows[9].qty || "0"}`,
      admix1: `${rows[10].product || "ADMIX-1"} : ${rows[10].qty || "0"}`,
      admix2: `${rows[11].product || "ADMIX-2"} : ${rows[11].qty || "0"}`,
    };

    try {
      const res = await fetch("/api/mix-designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast({ title: "Saved Successfully", description: `Mix design ${recipeCode} has been stored.` });
        setLocation("/qc");
      } else {
        const err = await res.json();
        toast({ title: "Save Failed", description: err.error || "Unknown error", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Could not connect to the database server.", variant: "destructive" });
    }
  };

  return (
    <QcLayout
      breadcrumbs={[
        { label: "Mix Design List", href: "/qc/mix-design/list" },
        { label: "Add Mix Design" }
      ]}
      title="ADD MIX DESIGN"
      activePath="/qc/mix-design/new"
    >
      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-1">
        
        {/* Left Column: Form Controls & Action Buttons */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipeCode" className="text-xs font-black uppercase text-slate-700 flex items-center gap-1">
                  Recipe Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recipeCode"
                  value={recipeCode}
                  onChange={e => setRecipeCode(e.target.value)}
                  placeholder="Enter Recipe Code"
                  className="h-11 text-sm bg-slate-50/50 border-slate-300 focus:bg-white transition-all font-semibold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipeName" className="text-xs font-black uppercase text-slate-700 flex items-center gap-1">
                  Recipe Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recipeName"
                  value={recipeName}
                  onChange={e => setRecipeName(e.target.value)}
                  placeholder="Enter Recipe Name"
                  className="h-11 text-sm bg-slate-50/50 border-slate-300 focus:bg-white transition-all font-semibold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade" className="text-xs font-black uppercase text-slate-700 flex items-center gap-1">
                  Grade <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-1">
                  <Input
                    id="grade"
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    placeholder="Grade"
                    className="h-11 text-sm bg-slate-50/50 border-slate-300 focus:bg-white transition-all font-bold text-slate-800 flex-1"
                    required
                  />
                  <Select value={gradesList.includes(grade) ? grade : ""} onValueChange={setGrade}>
                    <SelectTrigger className="h-11 w-10 shrink-0 border-slate-300 bg-slate-50/50 text-slate-600 px-1">
                      <span className="text-[10px]">▼</span>
                    </SelectTrigger>
                    <SelectContent>
                      {gradesList.map(g => (
                        <SelectItem key={g} value={g} className="font-bold">{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons row matching user screenshot */}
              <div className="pt-4 flex items-center gap-2 flex-wrap">
                <Button
                  type="submit"
                  className="bg-[#10b981] hover:bg-[#059669] text-white font-black px-5 h-11 shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
                >
                  <Save className="h-4 w-4 mr-2" /> Save Mix Design
                </Button>
                <Button
                  type="button"
                  onClick={handleClear}
                  className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-black px-4 h-11 shadow-md shadow-red-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Clear
                </Button>
                <Link href="/qc/mix-design/list">
                  <Button
                    type="button"
                    className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black px-5 h-11 shadow-md shadow-sky-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
                  >
                    <ListFilter className="h-4 w-4 mr-2" /> Mix Design List
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Density Summary Card */}
          <Card className="bg-gradient-to-br from-[#ea580c] to-[#1e293b] text-white shadow-lg border-none overflow-hidden">
            <CardContent className="p-6 relative">
              <Sparkles className="absolute top-4 right-4 h-16 w-16 text-white/10" />
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-200 mb-1">Estimated Formulation</p>
              <div className="text-3xl font-black tracking-tight">{totalDensity.toFixed(2)} <span className="text-sm font-bold text-orange-200">kg/m³</span></div>
              <p className="text-xs text-orange-100/80 mt-2 font-medium leading-relaxed">
                Calculated by summing all dry and wet ingredients in the mix proportions grid.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Ingredients Proportions Table */}
        <div className="xl:col-span-8">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#2dd4bf]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[60px] text-xs font-black uppercase text-slate-900 py-3.5">S/L No</TableHead>
                    <TableHead className="w-[160px] text-xs font-black uppercase text-slate-900">Mix Types</TableHead>
                    <TableHead className="text-xs font-black uppercase text-slate-900 min-w-[220px]">Product</TableHead>
                    <TableHead className="w-[200px] text-xs font-black uppercase text-slate-900">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.sl} className="hover:bg-slate-50/50 border-b border-slate-100">
                      <TableCell className="font-extrabold text-slate-800 text-xs py-2">{row.sl}</TableCell>
                      <TableCell className="font-bold text-slate-700 text-xs py-2">{row.type}</TableCell>
                      <TableCell className="py-2">
                        {row.fixedProduct ? (
                          <div className="h-8 px-3 flex items-center bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-600">
                            {row.product}
                          </div>
                        ) : (
                          <Input
                            value={row.product}
                            onChange={e => handleProductChange(row.sl, e.target.value)}
                            placeholder="Product"
                            className="h-8 text-[10px] bg-white border-slate-200 font-medium placeholder:text-slate-400 focus:ring-1 focus:ring-teal-500"
                          />
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          step="any"
                          value={row.qty}
                          onChange={e => handleQtyChange(row.sl, e.target.value)}
                          placeholder="Qty"
                          className="h-8 text-[10px] bg-white border-slate-200 font-bold placeholder:text-slate-400 focus:ring-1 focus:ring-teal-500 text-right pr-3"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Total Density Footer Row matching screenshot */}
                  <TableRow className="bg-slate-50 border-t-2 border-slate-200 font-black">
                    <TableCell colSpan={3} className="text-right text-xs uppercase text-slate-800 py-3.5 pr-6 tracking-wide">
                      Total Density :
                    </TableCell>
                    <TableCell className="text-right text-sm font-black text-[#ea580c] py-3.5 pr-3">
                      {totalDensity.toFixed(2)} <span className="text-[10px] text-slate-500 font-bold">kg/m³</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

      </form>
    </QcLayout>
  );
}
