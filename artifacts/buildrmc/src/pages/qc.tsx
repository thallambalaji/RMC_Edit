import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QcLayout, useQcFilters } from "@/components/qc-layout";
import { 
  ChevronRight, 
  Search, 
  RotateCcw, 
  Plus, 
  Copy, 
  FileText, 
  FileCode, 
  Edit, 
  Trash2, 
  Layers,
  CheckCircle2,
  TestTube,
  FlaskConical,
  Settings,
  Activity,
  TrendingUp
} from "lucide-react";

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

// No initial dummy data - all data is fetched from the database only

export default function QC() {
  const [items, setItems] = useState<MixDesignItem[]>([]);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/mix-designs");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch mix designs", error);
      setItems([]);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const stats = useMemo(() => {
    const totalMixes = items.length;
    const activeGrades = new Set(items.map(i => i.grade)).size;

    // Calculate dynamic average water/cement ratio (Water / sum(Cem1, Cem2, Cem3))
    let totalWCRatio = 0;
    let validWCCount = 0;

    items.forEach(item => {
      const waterQty = parseFloat(item.water);
      const cementQty = (parseFloat(item.cem1) || 0) + (parseFloat(item.cem2) || 0) + (parseFloat(item.cem3) || 0);

      if (!isNaN(waterQty) && cementQty > 0) {
        totalWCRatio += waterQty / cementQty;
        validWCCount++;
      }
    });

    const avgWCRatio = validWCCount > 0 ? (totalWCRatio / validWCCount).toFixed(2) : "0.00";

    // Calculate Top Grade (grade with the most mix designs)
    const gradeCounts: Record<string, number> = {};
    items.forEach(item => {
      if (item.grade) {
        gradeCounts[item.grade] = (gradeCounts[item.grade] || 0) + 1;
      }
    });

    let topGrade = "N/A";
    let maxCount = 0;
    Object.entries(gradeCounts).forEach(([grade, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topGrade = grade;
      }
    });

    return { totalMixes, activeGrades, avgWCRatio, topGrade };
  }, [items]);

  const cards = [
    {
      title: "Mix Designs",
      description: "Manage standard and custom concrete mixes, specifying aggregate grades, cement types, and design water ratios.",
      icon: <FileText className="h-5 w-5 text-[#1e40af]" />,
      iconBg: "bg-blue-50",
      links: [
        { label: "View Mix Designs", href: "/qc/mix-design/list", variant: "primary" },
        { label: "Add Mix Design", href: "/qc/mix-design/new", variant: "secondary" }
      ]
    },
    {
      title: "Recipes",
      description: "Configure plant production recipes, raw material proportion mappings, and batching code presets.",
      icon: <FlaskConical className="h-5 w-5 text-emerald-600" />,
      iconBg: "bg-emerald-50",
      links: [
        { label: "View Recipes", href: "/qc/recipe/list", variant: "primary" },
        { label: "Add Recipe", href: "/qc/recipe/new", variant: "secondary" }
      ]
    },
    {
      title: "Cube Strength Tests",
      description: "Record cube compression test results (7-day, 28-day), load capacities, and quality assurance logs.",
      icon: <TestTube className="h-5 w-5 text-rose-500" />,
      iconBg: "bg-rose-50",
      links: [
        { label: "View Cube Tests", href: "/qc/cube-test/list", variant: "primary" },
        { label: "Add Cube Test", href: "/qc/cube-test/new", variant: "secondary" }
      ]
    },
    {
      title: "Batch Reports & Logs",
      description: "Access technical batching details, real-time docket logs, targets vs. actual loads, and error logs.",
      icon: <Layers className="h-5 w-5 text-amber-500" />,
      iconBg: "bg-amber-50",
      links: [
        { label: "View Batch Logs", href: "/qc/batch/list", variant: "primary" },
        { label: "Batch Report", href: "/qc/batch/report", variant: "secondary" }
      ]
    },
    {
      title: "QC Settings",
      description: "Configure system parameters, admixtures, moisture tolerance thresholds, and target strength margins.",
      icon: <Settings className="h-5 w-5 text-slate-600" />,
      iconBg: "bg-slate-100",
      links: [
        { label: "Configure Settings", href: "/qc/settings", variant: "primary" }
      ]
    }
  ];

  return (
    <QcLayout
      breadcrumbs={[]}
      title="QC DASHBOARD"
      activePath="/qc"
    >
      <div className="space-y-4 flex-grow flex flex-col min-h-0">
        {/* Mini Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden shrink-0">
          <div className="bg-white border rounded-lg p-3 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-blue-50 rounded-full"><Layers className="h-4 w-4 text-blue-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Mix Designs</p>
              <p className="text-sm font-extrabold text-slate-800">{stats.totalMixes}</p>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-3 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-emerald-50 rounded-full"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Grades</p>
              <p className="text-sm font-extrabold text-slate-800">{stats.activeGrades}</p>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-3 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-amber-50 rounded-full"><Activity className="h-4 w-4 text-amber-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Avg W/C Ratio</p>
              <p className="text-sm font-extrabold text-slate-800">{stats.avgWCRatio}</p>
            </div>
          </div>
          <div className="bg-[#1e40af] rounded-lg p-3 flex items-center gap-3 shadow-sm text-white">
            <div className="p-2 bg-white/20 rounded-full"><TrendingUp className="h-4 w-4 text-white" /></div>
            <div>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Top Grade</p>
              <p className="text-sm font-extrabold">{stats.topGrade}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Hub Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <Card key={i} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${c.iconBg}`}>
                  {c.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-xs tracking-tight uppercase">
                  {c.title}
                </h3>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed mt-2.5 flex-grow">
                {c.description}
              </p>
              <div className="border-t border-slate-100 mt-4 pt-3 flex items-center gap-2">
                {c.links.map((lnk, li) => (
                  <Link key={li} href={lnk.href} className="flex-1">
                    <Button
                      variant={lnk.variant === "primary" ? "default" : "outline"}
                      className={`w-full text-[10px] font-bold uppercase tracking-wider h-8 ${
                        lnk.variant === "primary"
                          ? "bg-[#1e40af] hover:bg-[#1d4ed8] text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {lnk.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </QcLayout>
  );
}
