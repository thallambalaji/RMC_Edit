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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Trash2,
  Layers,
  Printer,
  RefreshCw,
  TrendingUp,
  Activity,
  CheckCircle2,
  MoreVertical,
  Eye,
  Save,
  X,
} from "lucide-react";

// Ingredient columns (matching Recipe ingredients order)
const INGR_KEYS = ["aggr1", "aggr2", "aggr3", "aggr4", "cem1", "cem2", "cem3", "water", "admix1", "admix2"] as const;
type IngrKey = typeof INGR_KEYS[number];

const INGR_DEFAULT_LABELS: Record<IngrKey, string> = {
  aggr1: "20MM", aggr2: "12MM", aggr3: "R SAND", aggr4: "M SAND",
  cem1: "CEM1", cem2: "CEM2", cem3: "CEM3",
  water: "WATER", admix1: "AD1", admix2: "Admix2",
};

const emptyIngr = (): Record<IngrKey, number> =>
  Object.fromEntries(INGR_KEYS.map(k => [k, 0])) as Record<IngrKey, number>;

// Map Recipe ingredient[] array (sl 1-12) to aggr1..admix2 keys
// Recipe ingredients: sl 1=Aggregate1(20MM), 2=Aggregate2(12MM), 3=R Sand, 4=M Sand,
//                     5=Cement1, 6=Cement2, 7=Water, 8=Admix1, 9=Admix2, ...
function recipeIngrToQty(ingredients: any[]): Record<IngrKey, number> {
  const result = emptyIngr();
  const map: [number, IngrKey][] = [
    [1, "aggr1"], [2, "aggr2"], [3, "aggr3"], [4, "aggr4"],
    [5, "cem1"], [6, "cem2"], [7, "cem3"], [8, "water"],
    [9, "admix1"], [10, "admix2"],
  ];
  for (const [sl, key] of map) {
    const ing = ingredients.find((i: any) => i.sl === sl);
    if (ing) result[key] = parseFloat(ing.qty) || 0;
  }
  return result;
}

function recipeIngrToProducts(ingredients: any[]): Record<string, string> {
  const result: Record<string, string> = {};
  const map: [number, string][] = [
    [1, "aggr1"], [2, "aggr2"], [3, "aggr3"], [4, "aggr4"],
    [5, "cem1"], [6, "cem2"], [7, "cem3"], [8, "water"],
    [9, "admix1"], [10, "admix2"],
  ];
  for (const [sl, key] of map) {
    const ing = ingredients.find((i: any) => i.sl === sl);
    if (ing) result[key] = ing.product || INGR_DEFAULT_LABELS[key as IngrKey];
  }
  return result;
}

function pct(actual: number, target: number) {
  if (!target) return "—";
  return ((actual - target) / target * 100).toFixed(2);
}

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

  // Modals
  const [printingEntry, setPrintingEntry] = useState<any | null>(null);
  const [viewingSheet, setViewingSheet] = useState<any | null>(null);
  const [showNewSheet, setShowNewSheet] = useState(false);

  // ─── New Batch Sheet form state ───────────────────────────────────────────
  const [customers, setCustomers] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [nDate, setNDate] = useState(new Date().toISOString().split("T")[0]);
  const [nCustomer, setNCustomer] = useState("");
  const [nSite, setNSite] = useState("");
  const [nGrade, setNGrade] = useState("");
  const [nRecipeCode, setNRecipeCode] = useState("");
  const [nCementName, setNCementName] = useState("");
  const [nSlump, setNSlump] = useState("100+/-20");
  const [nVehicle, setNVehicle] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [nBatchVol, setNBatchVol] = useState(6);
  const [nNoLoads, setNNoLoads] = useState(1);
  const [nDesigned, setNDesigned] = useState<Record<IngrKey, number>>(emptyIngr());
  const [nProducts, setNProducts] = useState<Record<string, string>>(
    Object.fromEntries(INGR_KEYS.map(k => [k, INGR_DEFAULT_LABELS[k]])) as Record<string, string>
  );
  const [nMoisture, setNMoisture] = useState({ aggr1: 0, aggr2: 0, aggr3: 0, aggr4: 0 });
  const [nLoads, setNLoads] = useState<Record<IngrKey, number>[]>([emptyIngr()]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ─── Fetch data ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/batch-entries");
        if (res.ok) setEntries(await res.json());
        else toast({ title: "Fetch Failed", description: "Failed to read batching entries.", variant: "destructive" });
      } catch {
        toast({ title: "Connection Error", description: "Could not connect to API server.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [refreshKey]);

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(setCustomers).catch(() => {});
    fetch("/api/recipes").then(r => r.json()).then(setRecipes).catch(() => {});
    fetch("/api/vehicles").then(r => r.json()).then(setVehicles).catch(() => {});
  }, []);

  const [masterGrades, setMasterGrades] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/masters?type=grade")
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => setMasterGrades(data.map((g: any) => g.name).filter(Boolean)))
      .catch(() => {});
  }, []);

  // ─── Customer sites ──────────────────────────────────────────────────────
  const customerSites = useMemo(() => {
    if (!nCustomer) return [];
    const cust = customers.find((c: any) => c.name === nCustomer || c.id === nCustomer);
    if (!cust) return [];
    // siteName is stored as a pipe-separated string e.g. "velimela|site2"
    if (cust.siteName && typeof cust.siteName === "string") {
      return cust.siteName.split("|").map((s: string) => s.trim()).filter(Boolean);
    }
    // Fallback: legacy sites array
    const sites: string[] = [];
    (cust.sites || []).forEach((s: any) => {
      if (typeof s === "string") sites.push(s);
      else if (s.name) sites.push(s.name);
    });
    return sites;
  }, [nCustomer, customers]);

  // Grades: merge master grades + grades from matching recipes
  const availableGrades = useMemo(() => {
    const filtered = recipes.filter((r: any) => {
      if (nCustomer && r.customer !== nCustomer) return false;
      if (nSite && r.siteName !== nSite) return false;
      return true;
    });
    const recipeGrades = filtered.map((r: any) => r.grade).filter(Boolean);
    return [...new Set([...masterGrades, ...recipeGrades])].sort();
  }, [recipes, nCustomer, nSite, masterGrades]);

  // ─── Auto-fetch recipe when grade changes ────────────────────────────────
  useEffect(() => {
    if (!nGrade) return;
    setRecipeLoading(true);
    const params = new URLSearchParams({ grade: nGrade });
    if (nCustomer) params.set("customer", nCustomer);
    if (nSite) params.set("siteName", nSite);
    fetch(`/api/recipes/lookup?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(recipe => {
        if (recipe && recipe.ingredients) {
          setNDesigned(recipeIngrToQty(recipe.ingredients));
          setNProducts(recipeIngrToProducts(recipe.ingredients));
          setNRecipeCode(recipe.recipeCode || "");
          setNCementName(recipe.cementName || "");
          setNSlump(recipe.slump || "100+/-20");
        }
      })
      .finally(() => setRecipeLoading(false));
  }, [nGrade, nCustomer, nSite]);

  // Also fetch moisture when customer/grade changes
  useEffect(() => {
    fetch("/api/moisture-settings")
      .then(r => r.json())
      .then((settings: any[]) => {
        if (settings.length > 0) {
          const s = settings[0];
          setNMoisture({
            aggr1: s.moisture20mm || 0,
            aggr2: s.moisture10mm || 0,
            aggr3: s.moistureRSand || 0,
            aggr4: s.moistureMSand || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Keep loads array in sync with noOfLoads
  // ─── Computed targets ────────────────────────────────────────────────────
  const firstTarget = useMemo(() =>
    Object.fromEntries(INGR_KEYS.map(k => [k, +(nDesigned[k] * nBatchVol).toFixed(2)])) as Record<IngrKey, number>,
    [nDesigned, nBatchVol]
  );

  // Keep loads array in sync with noOfLoads and firstTarget
  useEffect(() => {
    setNLoads(prev => {
      const arr = [...prev];
      
      // If we are adding more loads, fill them with randomized variations
      while (arr.length < nNoLoads) {
        const batchNum = arr.length + 1;
        const load: any = {};
        INGR_KEYS.forEach(k => {
          const val = firstTarget[k];
          if (val === 0) {
            load[k] = 0;
            return;
          }
          const percent = (Math.random() * 0.07) - 0.035; // -3.5% to +3.5% variation
          const v = val * (1 + percent);
          load[k] = ["aggr1", "aggr2", "aggr3", "aggr4", "cem1", "cem2", "cem3", "water"].includes(k)
            ? Math.round(v)
            : Number(v.toFixed(2));
        });
        arr.push(load);
      }
      
      const finalArr = arr.slice(0, nNoLoads);
      
      // Ensure the last load matches target exactly
      if (finalArr.length > 0) {
        const lastIdx = finalArr.length - 1;
        const lastLoad = { ...finalArr[lastIdx] };
        INGR_KEYS.forEach(k => {
          const val = firstTarget[k];
          if (val > 0) {
            lastLoad[k] = ["aggr1", "aggr2", "aggr3", "aggr4", "cem1", "cem2", "cem3", "water"].includes(k)
              ? Math.round(val)
              : Number(val.toFixed(2));
          }
        });
        finalArr[lastIdx] = lastLoad;
      }
      
      return finalArr;
    });
  }, [nNoLoads, firstTarget]);

  const handleAutoFill = () => {
    const generatedLoads = Array.from({ length: nNoLoads }).map((_, bn) => {
      const batchNum = bn + 1;
      const load: any = {};
      INGR_KEYS.forEach(k => {
        const val = firstTarget[k];
        if (val === 0) {
          load[k] = 0;
          return;
        }
        if (batchNum === nNoLoads) {
          load[k] = ["aggr1", "aggr2", "aggr3", "aggr4", "cem1", "cem2", "cem3", "water"].includes(k)
            ? Math.round(val)
            : Number(val.toFixed(2));
          return;
        }
        const percent = (Math.random() * 0.07) - 0.035;
        const v = val * (1 + percent);
        load[k] = ["aggr1", "aggr2", "aggr3", "aggr4", "cem1", "cem2", "cem3", "water"].includes(k)
          ? Math.round(v)
          : Number(v.toFixed(2));
      });
      return load;
    });
    setNLoads(generatedLoads);
    toast({
      title: "Batch Values Generated",
      description: `Populated ${nNoLoads} batches with realistic variations.`,
    });
  };

  const loadTotals = useMemo(() =>
    Object.fromEntries(
      INGR_KEYS.map(k => [k, +nLoads.reduce((s, l) => s + (l[k] || 0), 0).toFixed(2)])
    ) as Record<IngrKey, number>,
    [nLoads]
  );

  const totalBatchedQty = useMemo(() =>
    +nLoads.reduce((s, _, i) => s + nBatchVol, 0).toFixed(2),
    [nLoads, nBatchVol]
  );

  // ─── Save new batch sheet ────────────────────────────────────────────────
  const handleSaveSheet = async () => {
    const missing: string[] = [];
    if (!nCustomer) missing.push("Customer");
    if (!nGrade) missing.push("Grade");
    if (!nVehicle) missing.push("Vehicle No");
    if (missing.length > 0) {
      toast({ title: "Required fields missing", description: `Please fill: ${missing.join(", ")}.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    const batchNo = `BT/${new Date().getFullYear().toString().slice(2)}/${Date.now().toString().slice(-5)}`;
    const payload = {
      batchNo,
      date: nDate,
      customerName: nCustomer,
      siteName: nSite,
      grade: nGrade,
      recipeCode: nRecipeCode,
      cementName: nCementName,
      slump: nSlump,
      quantity: totalBatchedQty,
      batchedQty: totalBatchedQty,
      vehicleNo: nVehicle,
      noOfBatches: nNoLoads,
      batchVolume: nBatchVol,
      ingredientProducts: nProducts,
      designedQty: nDesigned,
      moisture: nMoisture,
      batchLoads: nLoads.map((l, i) => ({ loadNo: i + 1, ...l })),
    };
    try {
      const res = await fetch("/api/batch-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Batch Sheet Saved", description: `${batchNo} saved successfully.` });
        setShowNewSheet(false);
        setRefreshKey(k => k + 1);
        // reset form
        setNCustomer(""); setNSite(""); setNGrade(""); setNVehicle("");
        setNDesigned(emptyIngr()); setNLoads([emptyIngr()]); setNNoLoads(1);
      } else {
        const err = await res.json();
        toast({ title: "Save Failed", description: err.error || "Unknown error", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not save batch sheet.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── List helpers ────────────────────────────────────────────────────────
  const customerOptions = useMemo(() => {
    const custs = new Set(entries.map((e) => e.customerName));
    return ["All Customer", ...Array.from(custs)];
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        const matchesBatchNo = !searchBatchNo || e.batchNo.toLowerCase().includes(searchBatchNo.toLowerCase());
        const matchesCustomer = filterCustomer === "All Customer" || e.customerName === filterCustomer;
        let matchesDate = true;
        if (fromDate) { const d = new Date(e.date); d.setHours(0,0,0,0); const f = new Date(fromDate); f.setHours(0,0,0,0); if (d < f) matchesDate = false; }
        if (toDate)   { const d = new Date(e.date); d.setHours(0,0,0,0); const t = new Date(toDate);   t.setHours(0,0,0,0); if (d > t) matchesDate = false; }
        return matchesBatchNo && matchesCustomer && matchesDate;
      })
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [entries, searchBatchNo, filterCustomer, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const stats = useMemo(() => {
    const totalQty = entries.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    const totalBatched = entries.reduce((acc, curr) => acc + (Number(curr.batchedQty) || 0), 0);
    const variance = totalQty > 0 ? (((totalBatched - totalQty) / totalQty) * 100).toFixed(2) : "0.00";
    return { totalQty, totalBatched, variance, count: entries.length };
  }, [entries]);

  const handleClear = () => {
    setSearchBatchNo(""); setFromDate(""); setToDate("");
    setFilterCustomer("All Customer"); setCurrentPage(1);
    toast({ title: "Filters Cleared" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this batch log?")) return;
    const res = await fetch(`/api/batch-entries/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries(entries.filter((e) => e.id !== id && e._id !== id));
      toast({ title: "Deleted", description: "Batch log deleted." });
      setRefreshKey(k => k + 1);
    } else {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  const handleClearDuplicates = async () => {
    const res = await fetch("/api/batch-entries/clear-duplicates", { method: "POST" });
    if (res.ok) {
      const result = await res.json();
      toast({ title: "Duplicates Cleared", description: result.message });
      setRefreshKey(k => k + 1);
    }
  };

  const handleExport = (type: string, specificEntry?: any) => {
    const dataToExport = specificEntry ? [specificEntry] : filtered;
    const headers = ["Batch No", "Date", "Customer", "Site", "Grade", "Quantity (m³)", "Batched Qty (m³)", "Vehicle No"];
    const rows = dataToExport.map((e) => [e.batchNo, e.date, e.customerName, e.siteName, e.grade, e.quantity, e.batchedQty, e.vehicleNo]);
    const csvContent = [headers, ...rows].map((row) => row.map((val) => `"${val}"`).join(",")).join("\n");
    if (type === "copy") {
      navigator.clipboard.writeText(csvContent);
      toast({ title: "Copied" });
    } else if (type === "csv") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", specificEntry ? `batch_${specificEntry.batchNo}.csv` : "batch_logs.csv");
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast({ title: "CSV Downloaded" });
    } else if (type === "pdf") {
      setPrintingEntry(specificEntry || null);
      setTimeout(() => window.print(), 100);
    }
  };

  // Shared cell style for batch sheet table
  const thStyle = "border border-slate-300 px-1.5 py-1 text-[9px] font-black uppercase text-slate-700 bg-slate-100 text-center";
  const tdStyle = "border border-slate-200 px-1.5 py-0.5 text-[9px] text-center";

  return (
    <>
      {/* ─── PRINT AREA ─── */}
      <div className="hidden print:block absolute inset-0 bg-white z-[9999] p-8 text-black">
        <PrintHeader />
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">
              {printingEntry ? "BATCH DELIVERY TICKET" : "BATCH PRODUCTION REPORT"}
            </h2>
            <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">
              {printingEntry ? `TICKET NO: ${printingEntry.batchNo}` : "SUMMARY DETAILS"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-gray-500">Print Date: {new Date().toLocaleDateString()}</p>
            <p className="text-[9px] font-bold text-[#ea580c]">Doc ID: RMC/BATCH/{Math.floor(Math.random() * 9000) + 1000}</p>
          </div>
        </div>
        {printingEntry ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-[10px] border p-3 rounded">
              <div><b>Batch No:</b> {printingEntry.batchNo}</div>
              <div><b>Date:</b> {printingEntry.date}</div>
              <div><b>Customer:</b> {printingEntry.customerName}</div>
              <div><b>Site:</b> {printingEntry.siteName}</div>
              <div><b>Grade:</b> {printingEntry.grade}</div>
              <div><b>Recipe:</b> {printingEntry.recipeCode}</div>
              <div><b>Vehicle:</b> {printingEntry.vehicleNo}</div>
              <div><b>Slump:</b> {printingEntry.slump}</div>
            </div>
          </div>
        ) : (
          <table className="w-full text-[9px] border-collapse border border-gray-300">
            <thead><tr className="bg-gray-100">
              {["Batch No","Date","Customer","Site","Grade","Qty (m³)","Batched (m³)","Vehicle"].map(h => <th key={h} className="border border-gray-300 p-1.5 text-left">{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map(item => (
              <tr key={item._id || item.id}>
                <td className="border border-gray-300 p-1.5 font-bold text-[#ea580c]">{item.batchNo}</td>
                <td className="border border-gray-300 p-1.5">{item.date}</td>
                <td className="border border-gray-300 p-1.5">{item.customerName}</td>
                <td className="border border-gray-300 p-1.5">{item.siteName}</td>
                <td className="border border-gray-300 p-1.5 font-bold">{item.grade}</td>
                <td className="border border-gray-300 p-1.5 text-right">{item.quantity}</td>
                <td className="border border-gray-300 p-1.5 text-right">{item.batchedQty}</td>
                <td className="border border-gray-300 p-1.5">{item.vehicleNo}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {/* ─── SCREEN LAYOUT ─── */}
      <QcLayout breadcrumbs={[{ label: "Batching List" }]} title="BATCHING LIST" activePath="/qc/batch/list">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          {[
            { label: "Total Logs", value: stats.count, icon: <Layers className="h-4 w-4 text-[#ea580c]" />, bg: "bg-orange-50/40" },
            { label: "Total Target Qty", value: `${stats.totalQty.toFixed(1)} m³`, icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, bg: "bg-emerald-50" },
            { label: "Total Batched Qty", value: `${stats.totalBatched.toFixed(1)} m³`, icon: <Activity className="h-4 w-4 text-amber-600" />, bg: "bg-amber-50" },
            { label: "Qty Variance", value: `${stats.variance}%`, icon: <TrendingUp className="h-4 w-4 text-white" />, bg: "bg-white/20", white: true },
          ].map(s => (
            <Card key={s.label} className={`${s.white ? "bg-[#ea580c] text-white" : "bg-white"} border rounded-lg p-2.5 flex items-center gap-3 shadow-sm`}>
              <div className={`p-2 rounded-full ${s.bg}`}>{s.icon}</div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-tight ${s.white ? "text-white/80" : "text-gray-500"}`}>{s.label}</p>
                <p className="text-sm font-bold">{s.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-lg border shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Filters */}
          {showFilters && (
            <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-end gap-4">
              <div className="space-y-1.5 min-w-[200px] flex-1">
                <Label className="text-xs font-black uppercase text-slate-700">Batch No</Label>
                <Input value={searchBatchNo} onChange={e => { setSearchBatchNo(e.target.value); setCurrentPage(1); }} placeholder="Enter Batch No" className="h-10 text-xs font-semibold bg-white border-slate-300" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-700">From Date</Label>
                <Input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setCurrentPage(1); }} className="h-10 text-xs font-semibold bg-white border-slate-300" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-700">To Date</Label>
                <Input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setCurrentPage(1); }} className="h-10 text-xs font-semibold bg-white border-slate-300" />
              </div>
              <div className="space-y-1.5 min-w-[180px]">
                <Label className="text-xs font-black uppercase text-slate-700">Customer</Label>
                <Select value={filterCustomer} onValueChange={v => { setFilterCustomer(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-10 text-xs font-bold bg-white border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>{customerOptions.map(c => <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setCurrentPage(1)} className="bg-[#10b981] hover:bg-[#059669] text-white font-black px-6 h-10 text-xs uppercase tracking-wider"><Search className="h-4 w-4 mr-2" />Search</Button>
                <Button onClick={handleClear} className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-black px-5 h-10 text-xs uppercase"><RotateCcw className="h-4 w-4 mr-1.5" />Clear</Button>
                <Button onClick={handleClearDuplicates} className="bg-[#eab308] hover:bg-[#ca8a04] text-white font-black px-5 h-10 text-xs uppercase"><RefreshCw className="h-4 w-4 mr-1.5" />Clear Dup</Button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white flex-wrap gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-16 h-8 text-xs font-black bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>{[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)} className="font-bold">{n}</SelectItem>)}</SelectContent>
                </Select>
                <span>entries</span>
              </div>
              <Button
                onClick={() => setShowNewSheet(true)}
                className="bg-[#ea580c] hover:bg-[#d97706] text-white font-black h-9 px-4 text-xs uppercase tracking-wider shadow-sm gap-2"
              >
                <Plus className="h-4 w-4" /> New Batch Sheet
              </Button>
            </div>
            <ExportDropdown onCopy={() => handleExport("copy")} onCSV={() => handleExport("csv")} onPDF={() => handleExport("pdf")} />
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto bg-white">
            <Table>
              <TableHeader className="sticky top-0 bg-[#ea580c] border-b border-white/10 z-10">
                <TableRow className="hover:bg-transparent border-0 bg-[#ea580c]">
                  {["Batch No","Date","Customer","Site","Grade","Recipe Code","Quantity","Batched Qty","Vehicle No"].map(h => (
                    <TableHead key={h} className="bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] border-r border-white/10 uppercase tracking-tighter text-left">{h}</TableHead>
                  ))}
                  <TableHead className="bg-[#ea580c] text-white font-black py-1.5 px-2 text-[9px] uppercase tracking-tighter w-[70px] text-center no-print">OPTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-12 text-xs font-semibold text-slate-500">Loading logs from MongoDB...</TableCell></TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-12 text-xs font-semibold text-slate-500">No data available</TableCell></TableRow>
                ) : pageRows.map((item, index) => (
                  <TableRow key={item._id || item.id} className={`hover:bg-slate-50/80 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                    <TableCell className="font-extrabold text-[#ea580c] text-xs py-3.5 px-4 whitespace-nowrap">{item.batchNo}</TableCell>
                    <TableCell className="font-bold text-slate-700 text-xs px-3 whitespace-nowrap">{item.date}</TableCell>
                    <TableCell className="font-semibold text-slate-800 text-xs px-3 whitespace-nowrap max-w-[200px] truncate">{item.customerName}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 px-3 whitespace-nowrap max-w-[150px] truncate">{item.siteName}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-800 px-3 whitespace-nowrap">{item.grade}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-600 px-3 whitespace-nowrap">{item.recipeCode || "—"}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-800 px-3 text-right whitespace-nowrap">{item.quantity} m³</TableCell>
                    <TableCell className="text-xs font-black text-emerald-700 px-3 text-right whitespace-nowrap">{item.batchedQty} m³</TableCell>
                    <TableCell className="text-xs font-bold text-slate-700 px-3 whitespace-nowrap">{item.vehicleNo}</TableCell>
                    <TableCell className="text-center py-2 no-print">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full cursor-pointer flex items-center justify-center mx-auto">
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-xs bg-white border border-slate-200 shadow-lg rounded-md p-1 z-50">
                          <DropdownMenuItem onClick={() => setViewingSheet(item)} className="gap-2 cursor-pointer hover:bg-orange-50/40 p-2 rounded">
                            <Eye className="h-3.5 w-3.5 text-[#ea580c]" /><span>View Batch Sheet</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport("copy", item)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                            <CopyIcon className="h-3.5 w-3.5 text-[#ea580c]" /><span>Copy Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport("csv", item)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                            <FileCode className="h-3.5 w-3.5 text-teal-600" /><span>Download CSV</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport("pdf", item)} className="gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                            <FileText className="h-3.5 w-3.5 text-red-500" /><span>Print Record</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(item._id || item.id)} className="gap-2 cursor-pointer hover:bg-red-50 p-2 rounded text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5 text-red-500" /><span>Delete Batch Log</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-4 shrink-0">
            <div className="text-xs font-bold text-slate-600">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <Button variant="ghost" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="text-xs font-black px-3 h-8 text-slate-600 hover:bg-slate-100">Previous</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <Button key={n} variant={currentPage === n ? "default" : "ghost"} size="sm" onClick={() => setCurrentPage(n)} className={`text-xs font-black w-8 h-8 ${currentPage === n ? "bg-[#0ea5e9] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{n}</Button>
              ))}
              <Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="text-xs font-black px-3 h-8 text-slate-600 hover:bg-slate-100">Next</Button>
            </div>
          </div>
        </div>
      </QcLayout>

      {/* ═══════════════════════════════════════════════════════════════════
          NEW BATCH SHEET MODAL
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showNewSheet} onOpenChange={v => !saving && setShowNewSheet(v)}>
        <DialogContent hideCloseButton className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0 bg-white">
          <DialogHeader className="p-4 bg-[#ea580c] rounded-t-lg flex flex-row items-center justify-between sticky top-0 z-10">
            <DialogTitle className="text-white font-black text-base">New Batch Sheet</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowNewSheet(false)} className="text-white hover:bg-white/10 h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-600">Date *</Label>
                <Input type="date" value={nDate} onChange={e => setNDate(e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-600">Customer *</Label>
                <Select value={nCustomer} onValueChange={v => { setNCustomer(v); setNSite(""); setNGrade(""); }}>
                  <SelectTrigger className="h-9 text-xs font-bold"><SelectValue placeholder="Select Customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c: any) => <SelectItem key={c.id || c._id} value={c.name} className="text-xs font-bold">{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-600">Site Name</Label>
                <Select value={nSite} onValueChange={v => { setNSite(v); setNGrade(""); }}>
                  <SelectTrigger className="h-9 text-xs font-bold"><SelectValue placeholder="Select Site" /></SelectTrigger>
                  <SelectContent>{customerSites.map((s: string) => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-600">Grade *</Label>
                <Select value={nGrade} onValueChange={setNGrade}>
                  <SelectTrigger className="h-9 text-xs font-bold"><SelectValue placeholder="Select Grade" /></SelectTrigger>
                  <SelectContent>
                    {availableGrades.length > 0
                      ? availableGrades.map(g => <SelectItem key={g} value={g} className="text-xs font-bold">{g}</SelectItem>)
                      : <SelectItem value="_none" disabled className="text-xs text-slate-400">No grades found</SelectItem>
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-600">Vehicle No *</Label>
                <Select value={nVehicle} onValueChange={setNVehicle}>
                  <SelectTrigger className="h-9 text-xs font-bold"><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.filter((v: any) => v.registrationNo).map((v: any) => (
                      <SelectItem key={v.id || v._id} value={v.registrationNo} className="text-xs font-bold">
                        {v.registrationNo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-600">Recipe Code</Label>
                <Input value={nRecipeCode} onChange={e => setNRecipeCode(e.target.value)} className="h-9 text-xs bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-600">Batch Volume (m³)</Label>
                <Input type="number" value={nBatchVol} onChange={e => setNBatchVol(+e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-600">No. of Loads</Label>
                <Input type="number" min={1} max={10} value={nNoLoads} onChange={e => setNNoLoads(Math.max(1, +e.target.value))} className="h-9 text-xs" />
              </div>
            </div>

            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                {recipeLoading && (
                  <span className="text-xs text-[#ea580c] font-bold animate-pulse">⟳ Loading recipe data for {nGrade}...</span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAutoFill}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black h-8 text-[10px] uppercase px-4 shadow-sm gap-1.5 rounded"
              >
                <RefreshCw className="h-3 w-3 animate-none" /> Auto-Fill Variations
              </Button>
            </div>

            {/* ── Batch Detail Table ── */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-[9px] min-w-[900px]">
                <thead>
                  <tr className="bg-[#ea580c] text-white">
                    <th className="border border-white/20 px-2 py-1.5 text-left font-black uppercase text-[9px] min-w-[140px]">Batch Detail</th>
                    {INGR_KEYS.map(k => (
                      <th key={k} className="border border-white/20 px-2 py-1.5 font-black uppercase text-[9px] text-center min-w-[70px]">
                        {nProducts[k] || INGR_DEFAULT_LABELS[k]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Designed Quantity row */}
                  <tr className="bg-orange-50/40">
                    <td className={`${tdStyle} font-black text-left text-slate-700`}>Designed Quantity</td>
                    {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} font-bold text-[#ea580c]`}>{nDesigned[k] || 0}</td>)}
                  </tr>
                  {/* Avg Moisture */}
                  <tr className="bg-slate-50">
                    <td className={`${tdStyle} font-black text-left text-slate-700`}>Avg. Moisture</td>
                    {INGR_KEYS.map(k => {
                      const mKey = k as keyof typeof nMoisture;
                      const val = k in nMoisture ? nMoisture[mKey] : 0;
                      return <td key={k} className={`${tdStyle} text-slate-600`}>{val}</td>;
                    })}
                  </tr>
                  {/* 1st Batch Target */}
                  <tr className="bg-emerald-50">
                    <td className={`${tdStyle} font-black text-left text-slate-700`}>1st Batch Target</td>
                    {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} font-bold text-emerald-700`}>{firstTarget[k]}</td>)}
                  </tr>
                  {/* Subsequent target = same as 1st for now */}
                  <tr className="bg-emerald-50/50">
                    <td className={`${tdStyle} font-black text-left text-slate-700`}>Subsequent Target</td>
                    {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} text-emerald-600`}>{firstTarget[k]}</td>)}
                  </tr>
                  {/* Load Target */}
                  <tr className="bg-amber-50">
                    <td className={`${tdStyle} font-black text-left text-slate-700`}>Load Target</td>
                    {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} font-bold text-amber-700`}>{firstTarget[k]}</td>)}
                  </tr>
                  {/* Error Percentage placeholder */}
                  <tr className="bg-rose-50">
                    <td className={`${tdStyle} font-black text-left text-slate-700`}>Error Percentage</td>
                    {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} text-rose-600`}>—</td>)}
                  </tr>
                  {/* Batch Load rows */}
                  {nLoads.map((load, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                      <td className={`${tdStyle} font-black text-left text-[#ea580c]`}>Batch {idx + 1}</td>
                      {INGR_KEYS.map(k => (
                        <td key={k} className="border border-slate-200 p-0.5">
                          <Input
                            type="number"
                            value={load[k] || ""}
                            onChange={e => {
                              const newLoads = [...nLoads];
                              newLoads[idx] = { ...newLoads[idx], [k]: +e.target.value };
                              setNLoads(newLoads);
                            }}
                            className="h-6 text-[9px] text-center border-0 p-0 rounded-none font-mono focus:ring-1 focus:ring-[#ea580c]"
                            placeholder="0"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Total Batch row */}
                  <tr className="bg-[#ea580c]/10 font-black">
                    <td className={`${tdStyle} font-black text-left text-slate-800`}>Total Batch</td>
                    {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} font-black text-[#ea580c]`}>{loadTotals[k]}</td>)}
                  </tr>
                  {/* Error % row */}
                  <tr className="bg-rose-50">
                    <td className={`${tdStyle} font-black text-left text-slate-700`}>Error %</td>
                    {INGR_KEYS.map(k => {
                      const ep = pct(loadTotals[k], firstTarget[k] * nNoLoads);
                      const bad = ep !== "—" && Math.abs(+ep) > 2;
                      return <td key={k} className={`${tdStyle} font-bold ${bad ? "text-rose-600" : "text-emerald-700"}`}>{ep === "—" ? "—" : `${ep}%`}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-t pt-3">
              <div className="flex gap-6">
                <span>Num Batches: <strong className="text-[#ea580c]">{nNoLoads}</strong></span>
                <span>With This Load: <strong className="text-[#ea580c]">{totalBatchedQty} m³</strong></span>
                <span>This Load: <strong className="text-[#ea580c]">{nBatchVol} m³</strong></span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowNewSheet(false)} className="h-9 text-xs font-bold px-4">Cancel</Button>
                <Button onClick={handleSaveSheet} disabled={saving} className="bg-[#10b981] hover:bg-[#059669] text-white font-black h-9 px-6 text-xs uppercase gap-2">
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Batch Sheet"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          VIEW BATCH SHEET MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {viewingSheet && (
        <Dialog open={!!viewingSheet} onOpenChange={() => setViewingSheet(null)}>
          <DialogContent hideCloseButton className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0 bg-white">
            <DialogHeader className="p-4 bg-[#ea580c] rounded-t-lg flex flex-row items-center justify-between sticky top-0 z-10">
              <div>
                <DialogTitle className="text-white font-black text-base">Batch Detail Sheet</DialogTitle>
                <p className="text-orange-200 text-xs font-semibold mt-0.5">{viewingSheet.batchNo} | {viewingSheet.grade} | {viewingSheet.customerName}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setPrintingEntry(viewingSheet); setTimeout(() => window.print(), 100); }} className="h-8 text-xs font-bold border-white/20 text-white hover:bg-white/10 bg-transparent gap-1">
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setViewingSheet(null)} className="text-white hover:bg-white/10 h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="p-4 space-y-4">
              {/* Header info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  ["Batch No", viewingSheet.batchNo],
                  ["Date", viewingSheet.date],
                  ["Customer", viewingSheet.customerName],
                  ["Site", viewingSheet.siteName],
                  ["Grade", viewingSheet.grade],
                  ["Recipe Code", viewingSheet.recipeCode || "—"],
                  ["Vehicle No", viewingSheet.vehicleNo],
                  ["Slump", viewingSheet.slump || "—"],
                  ["No. of Batches", viewingSheet.noOfBatches || "—"],
                  ["Batch Volume", viewingSheet.batchVolume ? `${viewingSheet.batchVolume} m³` : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="border rounded-lg p-2 bg-slate-50/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-bold text-slate-800">{val}</p>
                  </div>
                ))}
              </div>

              {/* Batch Detail Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                {(() => {
                  const v = viewingSheet;
                  const designed = v.designedQty || {};
                  const moisture = v.moisture || {};
                  const products = v.ingredientProducts || {};
                  const batchLoads: any[] = v.batchLoads || [];
                  const noLoads = v.noOfBatches || batchLoads.length || 1;
                  const batchVol = v.batchVolume || 6;
                  const totals = Object.fromEntries(
                    INGR_KEYS.map(k => [k, +batchLoads.reduce((s: number, l: any) => s + (l[k] || 0), 0).toFixed(2)])
                  ) as Record<IngrKey, number>;
                  const target = Object.fromEntries(
                    INGR_KEYS.map(k => [k, +(designed[k] || 0) * batchVol])
                  ) as Record<IngrKey, number>;
                  const totalTarget = Object.fromEntries(
                    INGR_KEYS.map(k => [k, +(target[k] * noLoads).toFixed(2)])
                  ) as Record<IngrKey, number>;

                  return (
                    <table className="w-full border-collapse text-[9px] min-w-[900px]">
                      <thead>
                        <tr className="bg-[#ea580c] text-white">
                          <th className="border border-white/20 px-2 py-1.5 text-left font-black uppercase min-w-[140px]">Batch Detail</th>
                          {INGR_KEYS.map(k => (
                            <th key={k} className="border border-white/20 px-2 py-1.5 font-black uppercase text-center min-w-[70px]">
                              {products[k] || INGR_DEFAULT_LABELS[k]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-orange-50/40">
                          <td className={`${tdStyle} font-black text-left text-slate-700`}>Designed Quantity</td>
                          {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} font-bold text-[#ea580c]`}>{designed[k] || 0}</td>)}
                        </tr>
                        <tr className="bg-slate-50">
                          <td className={`${tdStyle} font-black text-left text-slate-700`}>Avg. Moisture</td>
                          {INGR_KEYS.map(k => <td key={k} className={tdStyle}>{(moisture as any)[k] || 0}</td>)}
                        </tr>
                        <tr className="bg-emerald-50">
                          <td className={`${tdStyle} font-black text-left text-slate-700`}>1st Batch Target</td>
                          {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} font-bold text-emerald-700`}>{target[k].toFixed(2)}</td>)}
                        </tr>
                        <tr className="bg-emerald-50/50">
                          <td className={`${tdStyle} font-black text-left text-slate-700`}>Subsequent Target</td>
                          {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} text-emerald-600`}>{target[k].toFixed(2)}</td>)}
                        </tr>
                        <tr className="bg-amber-50">
                          <td className={`${tdStyle} font-black text-left text-slate-700`}>Load Target</td>
                          {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} font-bold text-amber-700`}>{target[k].toFixed(2)}</td>)}
                        </tr>
                        {batchLoads.map((load: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                            <td className={`${tdStyle} font-black text-left text-[#ea580c]`}>Batch {idx + 1}</td>
                            {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} font-mono`}>{load[k] ?? 0}</td>)}
                          </tr>
                        ))}
                        <tr className="bg-[#ea580c]/10 font-black">
                          <td className={`${tdStyle} font-black text-left text-slate-800`}>Total Batch</td>
                          {INGR_KEYS.map(k => <td key={k} className={`${tdStyle} font-black text-[#ea580c]`}>{totals[k]}</td>)}
                        </tr>
                        <tr className="bg-rose-50">
                          <td className={`${tdStyle} font-black text-left text-slate-700`}>Error %</td>
                          {INGR_KEYS.map(k => {
                            const ep = pct(totals[k], totalTarget[k]);
                            const bad = ep !== "—" && Math.abs(+ep) > 2;
                            return <td key={k} className={`${tdStyle} font-bold ${bad ? "text-rose-600" : "text-emerald-700"}`}>{ep === "—" ? "—" : `${ep}%`}</td>;
                          })}
                        </tr>
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 border-t pt-3">
                <div className="flex gap-6">
                  <span>Num Batches: <strong className="text-[#ea580c]">{viewingSheet.noOfBatches || "—"}</strong></span>
                  <span>With This Load: <strong className="text-[#ea580c]">{viewingSheet.batchedQty} m³</strong></span>
                  <span>Batch End Time: <strong className="text-[#ea580c]">{viewingSheet.createdAt ? new Date(viewingSheet.createdAt).toLocaleTimeString("en-IN") : "—"}</strong></span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
