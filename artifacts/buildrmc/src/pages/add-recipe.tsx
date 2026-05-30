import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
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
import { ChevronRight, Save, RotateCcw, ListFilter, User, Building2, MapPin, FlaskConical, Scale, Info } from "lucide-react";
import { QcLayout } from "@/components/qc-layout";

interface RecipeIngredient {
  sl: number;
  type: string;
  product: string;
  qty: string;
}

const INITIAL_INGREDIENTS: RecipeIngredient[] = [
  { sl: 1,  type: "Aggregate-1", product: "", qty: "" },
  { sl: 2,  type: "Aggregate-2", product: "", qty: "" },
  { sl: 3,  type: "Aggregate-3", product: "", qty: "" },
  { sl: 4,  type: "Aggregate-4", product: "", qty: "" },
  { sl: 5,  type: "Cement-1",    product: "", qty: "" },
  { sl: 6,  type: "Cement-2",    product: "", qty: "" },
  { sl: 7,  type: "Cement-3",    product: "", qty: "" },
  { sl: 8,  type: "Cement-4/FLYASH", product: "", qty: "" },
  { sl: 9,  type: "Cement-5",    product: "", qty: "" },
  { sl: 10, type: "Water",       product: "Water", qty: "" },
  { sl: 11, type: "Admix1",      product: "", qty: "" },
  { sl: 12, type: "Admix2",      product: "", qty: "" },
];

export default function AddRecipe() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [customer, setCustomer] = useState("");
  const [siteName, setSiteName] = useState("");
  const [grade, setGrade] = useState("");
  const [recipeCode, setRecipeCode] = useState("");
  const [plant, setPlant] = useState("FORTUNE CONCRETE");
  const [cementName, setCementName] = useState("");
  const [slump, setSlump] = useState("100+/-20");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(INITIAL_INGREDIENTS);
  const [plants, setPlants] = useState<any[]>([]);

  // Data for dropdowns
  const [customers, setCustomers] = useState<any[]>([]);
  const [mixDesigns, setMixDesigns] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);

  useEffect(() => {
    // Fetch customers
    fetch("/api/customers").then(res => res.json()).then(data => setCustomers(data)).catch(() => {});
    // Fetch mix designs for recipe codes
    fetch("/api/mix-designs").then(res => res.json()).then(data => setMixDesigns(data)).catch(() => {});
    // Fetch sales orders to extract grades dynamically
    fetch("/api/sales-orders").then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        setSalesOrders(data);
      }
    }).catch(() => {});
    // Fetch plants
    fetch("/api/masters?type=plant").then(res => res.json()).then(data => {
      if (data.length > 0) {
        setPlants(data);
        setPlant(data[0].name);
      } else {
        setPlants([
          { id: "fortune", name: "FORTUNE CONCRETE" },
          { id: "marval", name: "MARVAL RMC" }
        ]);
        setPlant("FORTUNE CONCRETE");
      }
    }).catch(() => {
      setPlants([
        { id: "fortune", name: "FORTUNE CONCRETE" },
        { id: "marval", name: "MARVAL RMC" }
      ]);
      setPlant("FORTUNE CONCRETE");
    });
  }, []);

  // Reset site name and grade when customer changes to avoid mismatch
  useEffect(() => {
    setSiteName("");
    setGrade("");
  }, [customer]);

  // Extract unique grades dynamically from Sales Orders (optionally filtered by selected customer)
  const grades = useMemo(() => {
    const uniqueGrades = new Set<string>();
    
    // Find customer ID to match against sales order customerId string
    const selectedCustObj = customers.find(c => c.name === customer);
    const selectedCustId = selectedCustObj?.id || selectedCustObj?._id;

    const targetOrders = customer
      ? salesOrders.filter(o => {
          const matchByName = o.customerName?.trim().toLowerCase() === customer.trim().toLowerCase();
          const matchById = selectedCustId && String(o.customerId) === String(selectedCustId);
          return matchByName || matchById;
        })
      : salesOrders;

    targetOrders.forEach((order: any) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item && item.grade) {
            uniqueGrades.add(item.grade);
          }
        });
      }
    });

    // Fallback to all sales orders if selected customer has no grades
    if (uniqueGrades.size === 0 && customer) {
      salesOrders.forEach((order: any) => {
        if (Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            if (item && item.grade) {
              uniqueGrades.add(item.grade);
            }
          });
        }
      });
    }

    // Ultimate hardcoded fallback
    if (uniqueGrades.size === 0) {
      return ["M-10", "M-15", "M-20", "M-25", "M-30", "M-35", "M-40", "M-45", "M-50"];
    }
    return Array.from(uniqueGrades).sort();
  }, [salesOrders, customer, customers]);

  // Extract unique site locations registered under the selected customer
  const customerSites = useMemo(() => {
    if (!customer) return [];
    const found = customers.find(c => c.name === customer);
    if (found && found.siteName) {
      return found.siteName.split(" | ").map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  }, [customer, customers]);

  const totalDensity = useMemo(() => {
    return ingredients.reduce((acc, row) => {
      const q = parseFloat(row.qty);
      return acc + (isNaN(q) ? 0 : q);
    }, 0);
  }, [ingredients]);

  const handleIngredientChange = (sl: number, field: 'product' | 'qty', value: string) => {
    setIngredients(prev => prev.map(r => r.sl === sl ? { ...r, [field]: value } : r));
  };

  const handleRecipeCodeChange = (code: string) => {
    setRecipeCode(code);
    const design = mixDesigns.find(d => d.recipeCode === code);
    if (design) {
      setGrade(design.grade);
      // Auto-populate ingredients if they match
      setIngredients(prev => prev.map(ing => {
        if (ing.type === "Aggregate-1" && design.aggr1) return { ...ing, product: design.aggr1.split(" : ")[0] || "", qty: design.aggr1.split(" : ")[1] || "" };
        if (ing.type === "Aggregate-2" && design.aggr2) return { ...ing, product: design.aggr2.split(" : ")[0] || "", qty: design.aggr2.split(" : ")[1] || "" };
        if (ing.type === "Aggregate-3" && design.aggr3) return { ...ing, product: design.aggr3.split(" : ")[0] || "", qty: design.aggr3.split(" : ")[1] || "" };
        if (ing.type === "Aggregate-4" && design.aggr4) return { ...ing, product: design.aggr4.split(" : ")[0] || "", qty: design.aggr4.split(" : ")[1] || "" };
        if (ing.type === "Cement-1" && design.cem1) return { ...ing, product: design.cem1.split(" : ")[0] || "", qty: design.cem1.split(" : ")[1] || "" };
        if (ing.type === "Cement-2" && design.cem2) return { ...ing, product: design.cem2.split(" : ")[0] || "", qty: design.cem2.split(" : ")[1] || "" };
        if (ing.type === "Cement-3" && design.cem3) return { ...ing, product: design.cem3.split(" : ")[0] || "", qty: design.cem3.split(" : ")[1] || "" };
        if (ing.type === "Cement-4/FLYASH" && design.cem4) return { ...ing, product: design.cem4.split(" : ")[0] || "", qty: design.cem4.split(" : ")[1] || "" };
        if (ing.type === "Cement-5" && design.cem5) return { ...ing, product: design.cem5.split(" : ")[0] || "", qty: design.cem5.split(" : ")[1] || "" };
        if (ing.type === "Water" && design.water) return { ...ing, qty: design.water.split(" : ")[1] || "" };
        if (ing.type === "Admix1" && design.admix1) return { ...ing, product: design.admix1.split(" : ")[0] || "", qty: design.admix1.split(" : ")[1] || "" };
        if (ing.type === "Admix2" && design.admix2) return { ...ing, product: design.admix2.split(" : ")[0] || "", qty: design.admix2.split(" : ")[1] || "" };
        return ing;
      }));
    }
  };

  const handleClear = () => {
    setCustomer("");
    setSiteName("");
    setGrade("");
    setRecipeCode("");
    setPlant("FORTUNE CONCRETE");
    setCementName("");
    setSlump("100+/-20");
    setIngredients(INITIAL_INGREDIENTS);
    toast({ title: "Form Cleared", description: "Recipe details have been reset." });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !siteName || !grade || !recipeCode) {
      toast({ 
        title: "Validation Error", 
        description: "Customer, Site Name, Grade, and Recipe Code are all required.", 
        variant: "destructive" 
      });
      return;
    }

    const recipeData = {
      customer,
      siteName,
      grade,
      recipeCode,
      plant,
      cementName,
      slump,
      ingredients,
      totalDensity
    };

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipeData),
      });

      if (res.ok) {
        toast({ title: "Recipe Saved", description: `Recipe ${recipeCode} stored successfully.` });
        setLocation("/qc/recipe/list");
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({ 
          title: "Save Failed", 
          description: errorData.error || "Could not save recipe to database.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection failed.", variant: "destructive" });
    }
  };

  return (
    <QcLayout
      breadcrumbs={[
        { label: "Recipe List", href: "/qc/recipe/list" },
        { label: "Add Recipe" }
      ]}
      title="ADD NEW RECIPE"
      activePath="/qc/recipe/new"
    >
      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-1">
        
        {/* Left Column: Customer Details */}
        <div className="xl:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <div className="bg-slate-50 border-b p-3 px-6">
              <h3 className="text-xs font-black uppercase text-slate-700">Customer Detail</h3>
            </div>
            <CardContent className="p-6 grid grid-cols-2 gap-6">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Customer <span className="text-red-500">*</span></Label>
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger className="h-10 text-xs font-bold border-slate-300">
                    <SelectValue placeholder="Choose Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.name} className="text-xs font-bold">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Plant <span className="text-red-500">*</span></Label>
                <Select value={plant} onValueChange={setPlant}>
                  <SelectTrigger className="h-10 text-xs font-bold border-slate-300">
                    <SelectValue placeholder="Select Plant" />
                  </SelectTrigger>
                  <SelectContent>
                    {plants.map(p => <SelectItem key={p.id} value={p.name} className="text-xs font-bold">{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Site Name <span className="text-red-500">*</span></Label>
                <Select value={siteName} onValueChange={setSiteName}>
                  <SelectTrigger className="h-10 text-xs font-bold border-slate-300">
                    <SelectValue placeholder="Choose Site" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerSites.length > 0 ? (
                      customerSites.map((s: string) => <SelectItem key={s} value={s} className="text-xs font-bold">{s}</SelectItem>)
                    ) : (
                      <>
                        <SelectItem value="UPSIDE AVENUES" className="text-xs font-bold">UPSIDE AVENUES</SelectItem>
                        <SelectItem value="Raaga" className="text-xs font-bold">Raaga</SelectItem>
                        <SelectItem value="VELIMELA" className="text-xs font-bold">VELIMELA</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Cement Name</Label>
                <Input value={cementName} onChange={e => setCementName(e.target.value)} placeholder="Enter Cement Name" className="h-10 text-xs font-bold border-slate-300" />
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Grade <span className="text-red-500">*</span></Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="h-10 text-xs font-bold border-slate-300">
                    <SelectValue placeholder="Choose Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(g => (
                      <SelectItem key={g} value={g} className="text-xs font-bold">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Slump <span className="text-red-500">*</span></Label>
                <Input value={slump} onChange={e => setSlump(e.target.value)} className="h-10 text-xs font-bold border-slate-300" />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Recipe Code <span className="text-red-500">*</span></Label>
                <Select value={recipeCode} onValueChange={handleRecipeCodeChange}>
                  <SelectTrigger className="h-10 text-xs font-bold border-slate-300">
                    <SelectValue placeholder="Choose Recipe Code" />
                  </SelectTrigger>
                  <SelectContent>
                    {mixDesigns.map(d => <SelectItem key={d.id} value={d.recipeCode} className="text-xs font-bold">{d.recipeCode}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Buttons Row matching image bottom left */}
          <div className="flex items-center gap-3">
            <Button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-white font-black px-6 h-10 text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
              Save Recipe
            </Button>
            <Button type="button" onClick={handleClear} className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-black px-6 h-10 text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95">
              Clear
            </Button>
            <Link href="/qc/recipe/list">
              <Button type="button" className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-black px-6 h-10 text-[10px] uppercase tracking-widest shadow-lg shadow-sky-500/20 transition-all active:scale-95">
                Recipe List
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Mix Design Detail */}
        <div className="xl:col-span-7">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="bg-slate-50 border-b p-3 px-6">
              <h3 className="text-xs font-black uppercase text-slate-700">Mix Design Detail</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#2dd4bf]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[60px] text-[10px] font-black uppercase text-slate-900 py-2.5">S/L No</TableHead>
                    <TableHead className="w-[180px] text-[10px] font-black uppercase text-slate-900">Mix Types</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-900">Product</TableHead>
                    <TableHead className="w-[180px] text-[10px] font-black uppercase text-slate-900">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map(ing => (
                    <TableRow key={ing.sl} className="hover:bg-slate-50/50 border-b border-slate-100">
                      <TableCell className="font-extrabold text-slate-800 text-[10px] py-1.5">{ing.sl}</TableCell>
                      <TableCell className="font-bold text-slate-700 text-[10px] py-1.5">{ing.type}</TableCell>
                      <TableCell className="py-1">
                        <Input
                          value={ing.product}
                          onChange={e => handleIngredientChange(ing.sl, 'product', e.target.value)}
                          placeholder={`Enter ${ing.type} Name`}
                          className="h-8 text-[10px] bg-white border-slate-200 font-medium placeholder:text-slate-400 focus:ring-1 focus:ring-teal-500"
                        />
                      </TableCell>
                      <TableCell className="py-1">
                        <Input
                          value={ing.qty}
                          onChange={e => handleIngredientChange(ing.sl, 'qty', e.target.value)}
                          placeholder={`Enter ${ing.type} Quantity`}
                          className="h-8 text-[10px] bg-white border-slate-200 font-bold placeholder:text-slate-400 focus:ring-1 focus:ring-teal-500"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Total Density Footer */}
                  <TableRow className="bg-slate-50 font-black border-t-2 border-slate-200">
                    <TableCell colSpan={3} className="text-right text-[10px] uppercase text-slate-800 py-3 pr-6">
                      Total Density :
                    </TableCell>
                    <TableCell className="text-left text-xs font-black text-[#1e40af] py-3 pl-3">
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
