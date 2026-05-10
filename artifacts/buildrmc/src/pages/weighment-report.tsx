import { useState } from "react";
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
import { ChevronRight, FileText, RotateCcw, BarChart3, Calendar, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WeighmentReport() {
  const { toast } = useToast();
  const [category, setCategory] = useState("Weighment Report");
  const [type, setType] = useState("Date Wise");

  const handleGenerate = () => {
    toast({ title: "Generating Report", description: "Your report is being compiled. This may take a few seconds." });
  };

  const handleClear = () => {
    toast({ title: "Filters Cleared", description: "Report parameters have been reset." });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header & Breadcrumbs */}
      <div className="flex items-center justify-between bg-white/40 p-4 rounded-xl backdrop-blur-md border border-white/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">Weighment Reports</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Analyze vehicle weight data and operational trends</p>
        </div>
        <nav className="text-[10px] font-bold text-slate-400 flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          <Link href="/dashboard" className="hover:text-cyan-500 transition-colors">HOME</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <Link href="/dc" className="hover:text-cyan-500 transition-colors">DC</Link>
          <ChevronRight className="h-3 w-3 opacity-30" />
          <span className="text-slate-800">REPORTS</span>
        </nav>
      </div>

      <div className="glass-card p-6 border-white/80 shadow-xl">
        <div className="flex items-center gap-2 mb-8 border-b border-slate-100 pb-4">
          <div className="bg-cyan-500/10 p-2 rounded-lg">
            <BarChart3 className="h-5 w-5 text-cyan-600" />
          </div>
          <h3 className="font-black text-slate-800 text-sm tracking-widest uppercase">Report Parameters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
          <div className="space-y-1.5">
            <Label className="f-label text-slate-600 flex items-center gap-1.5">
              <Filter className="h-3 w-3" /> CATEGORY *
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="Weighment Report">Weighment Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">REPORT TYPE *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="Date Wise">Date Wise</SelectItem>
                <SelectItem value="Customer Wise">Customer Wise</SelectItem>
                <SelectItem value="Plant Wise">Plant Wise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="f-label text-slate-600 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> FROM DATE
            </Label>
            <Input type="date" className="f-input bg-white border-slate-200 text-slate-700 font-semibold shadow-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="f-label text-slate-600 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> TO DATE
            </Label>
            <Input type="date" className="f-input bg-white border-slate-200 text-slate-700 font-semibold shadow-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">ITEM *</Label>
            <Select defaultValue="all">
              <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="m10">M10</SelectItem>
                <SelectItem value="m20">M20</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="f-label text-slate-600">PLANT *</Label>
            <Select defaultValue="all">
              <SelectTrigger className="f-input bg-white border-slate-200 text-slate-700 font-semibold shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-700">
                <SelectItem value="all">All Plants</SelectItem>
                <SelectItem value="p1">FORTUNE CONCRETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 mt-10 border-t border-slate-100 pt-6">
          <Button onClick={handleGenerate} className="btn-primary px-12 h-11 gap-2 shadow-lg shadow-cyan-500/20">
            <FileText className="h-4 w-4" /> GENERATE REPORT
          </Button>
          <Button onClick={handleClear} variant="outline" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 px-12 h-11 gap-2 transition-all font-black text-[10px] tracking-widest shadow-sm">
            <RotateCcw className="h-4 w-4" /> CLEAR
          </Button>
        </div>
      </div>

      {/* Report Preview Placeholder */}
      <div className="glass-card h-[400px] flex flex-col items-center justify-center text-center p-12 group transition-all hover:bg-white border-dashed border-slate-200 border-2 shadow-inner">
        <div className="bg-slate-50 p-6 rounded-full mb-6 group-hover:scale-110 group-hover:bg-cyan-50 transition-all duration-500 shadow-sm">
          <BarChart3 className="h-12 w-12 text-slate-200 group-hover:text-cyan-500 transition-colors" />
        </div>
        <h3 className="text-slate-400 font-black uppercase tracking-widest text-sm mb-2">Report Preview Area</h3>
        <p className="text-slate-300 text-xs max-w-xs leading-relaxed font-medium">
          Configure your report parameters above and click "Generate Report" to visualize your weighment data trends here.
        </p>
      </div>
    </div>
  );
}
