import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  FlaskConical, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit3,
  Calendar as CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { QcLayout } from "@/components/qc-layout";

interface CubeResultRow {
  id: string;
  cubeId: string;
  testingDays: string;
  supplyDate: string;
  cube1Mass: string;
  cube1Load: string;
  cube2Mass: string;
  cube2Load: string;
  cube3Mass: string;
  cube3Load: string;
}

export default function AddCubeTest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Header Fields
  const [testNo, setTestNo] = useState(`CUBE/${format(new Date(), "yyyyMMdd")}/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
  const [plant, setPlant] = useState("");
  const [noOfCasting, setNoOfCasting] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [grade, setGrade] = useState("");
  const [cubeDimension, setCubeDimension] = useState("150 X 150 X 150");
  const [description, setDescription] = useState("");
  const [isDimensionModalOpen, setIsDimensionModalOpen] = useState(false);
  const [dimensionSearch, setDimensionSearch] = useState("");

  // Table Data
  const [results, setResults] = useState<CubeResultRow[]>([
    {
      id: crypto.randomUUID(),
      cubeId: "",
      testingDays: "7",
      supplyDate: format(new Date(), "yyyy-MM-dd"),
      cube1Mass: "",
      cube1Load: "",
      cube2Mass: "",
      cube2Load: "",
      cube3Mass: "",
      cube3Load: "",
    }
  ]);

  // Manual Modal State
  const [manualTestId, setManualTestId] = useState("");
  const [manualTestNo, setManualTestNo] = useState("");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Dropdown Data
  const [customers, setCustomers] = useState<any[]>([]);
  const [sites, setSites] = useState<string[]>(["UPSIDE AVENUES", "Raaga", "VELIMELA"]);
  const [grades, setGrades] = useState<string[]>(["M-10", "M-15", "M-20", "M-25", "M-30", "M-35", "M-40"]);
  const [plants, setPlants] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/customers").then(res => res.json()).then(data => setCustomers(data)).catch(() => {});
    fetch("/api/masters?type=plant").then(res => res.json()).then(data => {
      if (data.length > 0) {
        setPlants(data);
        setPlant(data[0].name);
      } else {
        setPlants([{ id: "default", name: "FORTUNE CONCRETE" }]);
        setPlant("FORTUNE CONCRETE");
      }
    }).catch(() => {
      setPlants([{ id: "default", name: "FORTUNE CONCRETE" }]);
      setPlant("FORTUNE CONCRETE");
    });
  }, []);

  const handleAddRow = () => {
    setResults([...results, {
      id: crypto.randomUUID(),
      cubeId: "",
      testingDays: "7",
      supplyDate: format(new Date(), "yyyy-MM-dd"),
      cube1Mass: "",
      cube1Load: "",
      cube2Mass: "",
      cube2Load: "",
      cube3Mass: "",
      cube3Load: "",
    }]);
  };

  const handleRemoveRow = (id: string) => {
    if (results.length > 1) {
      setResults(results.filter(r => r.id !== id));
    }
  };

  const handleFieldChange = (id: string, field: keyof CubeResultRow, value: string) => {
    setResults(results.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleManualSave = () => {
    if (manualTestNo) {
      setTestNo(manualTestNo);
      setIsManualModalOpen(false);
      toast({ title: "Updated", description: "Test Number updated manually." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !siteName || !grade || !noOfCasting) {
      toast({ title: "Validation Error", description: "Please fill all required fields (*).", variant: "destructive" });
      return;
    }

    const payload = {
      testNo,
      plant,
      noOfCasting: Number(noOfCasting),
      customerName,
      siteName,
      grade,
      cubeDimension,
      description,
      results: results.map(({ id, ...rest }) => rest)
    };

    try {
      const res = await fetch("/api/cube-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ title: "Success", description: "Cube Test recorded successfully." });
        setLocation("/qc/cube-test/list");
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to save.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Connection failed.", variant: "destructive" });
    }
  };

  return (
    <QcLayout
      breadcrumbs={[
        { label: "Cube List", href: "/qc/cube-test/list" },
        { label: "Add Cube Test" }
      ]}
      title="ADD CUBE TEST"
      activePath="/qc/cube-test/new"
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-1">
        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
              
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1">Test No <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input value={testNo} readOnly className="bg-slate-50 border-slate-200 h-11 text-xs font-bold text-slate-500 cursor-not-allowed" />
                    <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" className="bg-[#00bcd4] hover:bg-[#00acc1] text-white font-black text-[10px] uppercase h-11 px-4 whitespace-nowrap">For Manual</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
                        <DialogHeader className="bg-white p-6 pb-2">
                          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Edit3 className="h-5 w-5 text-teal-500" />
                            Change Test No Manually
                          </DialogTitle>
                        </DialogHeader>
                        <div className="p-6 space-y-6">
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500">Test ID <span className="text-red-500">*</span></Label>
                            <Input value={manualTestId} onChange={e => setManualTestId(e.target.value)} className="h-12 border-slate-200 focus:ring-teal-500" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500">Test No <span className="text-red-500">*</span></Label>
                            <Input value={manualTestNo} onChange={e => setManualTestNo(e.target.value)} className="h-12 border-slate-200 focus:ring-teal-500" />
                          </div>
                          <div className="flex gap-3 pt-4">
                            <Button type="button" onClick={handleManualSave} className="bg-[#10b981] hover:bg-[#059669] text-white font-black flex-1 h-12 uppercase text-xs tracking-wider">Save Changes</Button>
                            <Button type="button" variant="destructive" onClick={() => setIsManualModalOpen(false)} className="font-black flex-1 h-12 uppercase text-xs tracking-wider">Cancel</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500">Plant <span className="text-red-500">*</span></Label>
                  <Select value={plant} onValueChange={setPlant}>
                    <SelectTrigger className="h-11 text-xs font-bold border-slate-200">
                      <SelectValue placeholder="Select Plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500">No Of Casting <span className="text-red-500">*</span></Label>
                  <Input value={noOfCasting} onChange={e => setNoOfCasting(e.target.value)} placeholder="Ex : 3 or 6 or 9 .." className="h-11 border-slate-200 text-xs font-bold" />
                </div>
              </div>

              {/* Middle Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500">Customer Name <span className="text-red-500">*</span></Label>
                  <Select value={customerName} onValueChange={setCustomerName}>
                    <SelectTrigger className="h-11 text-xs font-bold border-slate-200">
                      <SelectValue placeholder="Choose Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500">Site Name <span className="text-red-500">*</span></Label>
                  <Select value={siteName} onValueChange={setSiteName}>
                    <SelectTrigger className="h-11 text-xs font-bold border-slate-200">
                      <SelectValue placeholder="Choose Site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500">Grade <span className="text-red-500">*</span></Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="h-11 text-xs font-bold border-slate-200">
                      <SelectValue placeholder="Choose Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500">Cube Dimension <span className="text-red-500">*</span></Label>
                  <Popover open={isDimensionModalOpen} onOpenChange={setIsDimensionModalOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-11 text-xs font-bold border-slate-200 justify-between">
                        {cubeDimension || "Select Dimension"}
                        <ChevronRight className="h-4 w-4 rotate-90 text-slate-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px] border-none shadow-2xl" align="start">
                      <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input 
                              placeholder="Search..." 
                              value={dimensionSearch}
                              onChange={e => setDimensionSearch(e.target.value)}
                              className="pl-8 h-9 text-xs border-slate-200" 
                            />
                          </div>
                        </div>
                        <div className="max-h-[200px] overflow-auto">
                          {["150 X 150 X 150", "100 X 100 X 100", "70.6 X 70.6 X 70.6"]
                            .filter(d => d.toLowerCase().includes(dimensionSearch.toLowerCase()))
                            .map(d => (
                              <div 
                                key={d}
                                onClick={() => {
                                  setCubeDimension(d);
                                  setIsDimensionModalOpen(false);
                                }}
                                className={cn(
                                  "px-4 py-2 text-xs font-bold cursor-pointer hover:bg-teal-50 transition-colors",
                                  cubeDimension === d ? "bg-[#4285f4] text-white hover:bg-[#3b78e7]" : "text-slate-700"
                                )}
                              >
                                {d}
                              </div>
                            ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-slate-500">Description <span className="text-red-500">*</span></Label>
                  <Textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="min-h-[140px] border-slate-200 text-xs font-medium resize-none"
                    placeholder="Enter Description..."
                  />
                </div>
              </div>

            </div>

            {/* Dynamic Table */}
            <div className="mt-12 rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-500 hover:bg-teal-500 border-none h-12">
                    <TableHead rowSpan={2} className="text-[10px] font-black uppercase text-white border-r border-teal-400/30 w-[50px] text-center">SI No</TableHead>
                    <TableHead rowSpan={1} colSpan={1} className="text-[10px] font-black uppercase text-white border-r border-teal-400/30 text-center">Cube ID <span className="text-red-300">*</span></TableHead>
                    <TableHead rowSpan={1} colSpan={1} className="text-[10px] font-black uppercase text-white border-r border-teal-400/30 text-center">Testing Days <span className="text-red-300">*</span></TableHead>
                    <TableHead rowSpan={1} colSpan={1} className="text-[10px] font-black uppercase text-white border-r border-teal-400/30 text-center">Supply Date <span className="text-red-300">*</span></TableHead>
                    
                    <TableHead colSpan={2} className="text-[10px] font-black uppercase text-white border-r border-teal-400/30 text-center">Cube 1</TableHead>
                    <TableHead colSpan={2} className="text-[10px] font-black uppercase text-white border-r border-teal-400/30 text-center">Cube 2</TableHead>
                    <TableHead colSpan={2} className="text-[10px] font-black uppercase text-white text-center">Cube 3</TableHead>
                    
                    <TableHead rowSpan={2} className="text-[10px] font-black uppercase text-white w-[50px] text-center bg-teal-600">
                      <Button type="button" onClick={handleAddRow} size="icon" className="h-6 w-6 bg-white/20 hover:bg-white/40 text-white border-none"><Plus className="h-3 w-3" /></Button>
                    </TableHead>
                  </TableRow>
                  <TableRow className="bg-[#26a69a] hover:bg-[#26a69a] border-none h-10">
                    <TableHead className="text-[9px] font-black uppercase text-teal-50 border-r border-teal-400/30 text-center">Cube ID</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-teal-50 border-r border-teal-400/30 text-center">7 or 28 Days</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-teal-50 border-r border-teal-400/30 text-center">Date Picker</TableHead>
                    
                    <TableHead className="text-[9px] font-black uppercase text-teal-50 border-r border-teal-400/30 text-center">Mass(KG) *</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-teal-50 border-r border-teal-400/30 text-center">Max Load(KN) *</TableHead>
                    
                    <TableHead className="text-[9px] font-black uppercase text-teal-50 border-r border-teal-400/30 text-center">Mass(KG) *</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-teal-50 border-r border-teal-400/30 text-center">Max Load(KN) *</TableHead>
                    
                    <TableHead className="text-[9px] font-black uppercase text-teal-50 border-r border-teal-400/30 text-center">Mass(KG) *</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-teal-50 text-center">Max Load(KN) *</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row, idx) => (
                    <TableRow key={row.id} className="hover:bg-slate-50/50 h-10 border-b border-slate-100 last:border-none">
                      <TableCell className="text-center font-bold text-slate-400 text-[10px] border-r border-slate-100">{idx + 1}</TableCell>
                      
                      <TableCell className="p-1 border-r border-slate-100">
                        <Input value={row.cubeId} onChange={e => handleFieldChange(row.id, 'cubeId', e.target.value)} className="h-8 border-none text-[10px] font-bold text-center bg-transparent focus-visible:ring-0" />
                      </TableCell>
                      
                      <TableCell className="p-1 border-r border-slate-100">
                        <Select value={row.testingDays} onValueChange={v => handleFieldChange(row.id, 'testingDays', v)}>
                          <SelectTrigger className="h-8 border-none text-[10px] font-bold bg-transparent shadow-none focus:ring-0 text-center">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="28">28 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell className="p-1 border-r border-slate-100">
                         <div className="flex justify-center">
                            <Input 
                              type="date" 
                              value={row.supplyDate} 
                              onChange={e => handleFieldChange(row.id, 'supplyDate', e.target.value)}
                              className="h-8 border-none text-[10px] font-bold bg-transparent shadow-none focus-visible:ring-0 w-32" 
                            />
                         </div>
                      </TableCell>

                      <TableCell className="p-1 border-r border-slate-100">
                        <Input value={row.cube1Mass} onChange={e => handleFieldChange(row.id, 'cube1Mass', e.target.value)} className="h-8 border-none text-[10px] font-bold text-center bg-transparent focus-visible:ring-0" />
                      </TableCell>
                      <TableCell className="p-1 border-r border-slate-100">
                        <Input value={row.cube1Load} onChange={e => handleFieldChange(row.id, 'cube1Load', e.target.value)} className="h-8 border-none text-[10px] font-bold text-center bg-transparent focus-visible:ring-0" />
                      </TableCell>

                      <TableCell className="p-1 border-r border-slate-100">
                        <Input value={row.cube2Mass} onChange={e => handleFieldChange(row.id, 'cube2Mass', e.target.value)} className="h-8 border-none text-[10px] font-bold text-center bg-transparent focus-visible:ring-0" />
                      </TableCell>
                      <TableCell className="p-1 border-r border-slate-100">
                        <Input value={row.cube2Load} onChange={e => handleFieldChange(row.id, 'cube2Load', e.target.value)} className="h-8 border-none text-[10px] font-bold text-center bg-transparent focus-visible:ring-0" />
                      </TableCell>

                      <TableCell className="p-1 border-r border-slate-100">
                        <Input value={row.cube3Mass} onChange={e => handleFieldChange(row.id, 'cube3Mass', e.target.value)} className="h-8 border-none text-[10px] font-bold text-center bg-transparent focus-visible:ring-0" />
                      </TableCell>
                      <TableCell className="p-1 border-r border-slate-100">
                        <Input value={row.cube3Load} onChange={e => handleFieldChange(row.id, 'cube3Load', e.target.value)} className="h-8 border-none text-[10px] font-bold text-center bg-transparent focus-visible:ring-0" />
                      </TableCell>

                      <TableCell className="text-center bg-slate-50">
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRow(row.id)} className="h-7 w-7 text-slate-300 hover:text-red-500">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-12 flex justify-center gap-4">
              <Button type="submit" className="bg-[#00bcd4] hover:bg-[#00acc1] text-white font-black px-12 h-12 uppercase tracking-widest text-xs shadow-lg shadow-teal-500/20">Submit</Button>
              <Button type="button" variant="outline" onClick={() => setLocation("/qc/cube-test/list")} className="border-slate-200 text-slate-400 font-black px-12 h-12 uppercase tracking-widest text-xs">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </QcLayout>
  );
}
