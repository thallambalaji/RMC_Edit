import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  ChevronRight,
  FileText,
  FlaskConical,
  TestTube,
  Layers,
  Settings,
  Filter,
} from "lucide-react";
import { createContext, useContext, useState, useEffect } from "react";

let qcFiltersState = true;
const qcSubscribers = new Set<(val: boolean) => void>();

export const toggleQcFiltersGlobal = () => {
  qcFiltersState = !qcFiltersState;
  qcSubscribers.forEach(sub => sub(qcFiltersState));
};

export const QcFiltersContext = createContext<{
  showFilters: boolean;
  toggleFilters: () => void;
}>({
  showFilters: true,
  toggleFilters: () => {},
});

export const useQcFilters = () => {
  const [showFilters, setShowFilters] = useState(qcFiltersState);
  useEffect(() => {
    qcSubscribers.add(setShowFilters);
    return () => {
      qcSubscribers.delete(setShowFilters);
    };
  }, []);
  return {
    showFilters,
    toggleFilters: toggleQcFiltersGlobal
  };
};

interface QcLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  breadcrumbs: { label: string; href?: string }[];
  title: string;
}

export function QcLayout({ children, activePath, breadcrumbs, title }: QcLayoutProps) {
  const [location] = useLocation();
  const currentPath = activePath || location;
  const { showFilters, toggleFilters } = useQcFilters();

  const getLinkClass = (path: string) => {
    return `text-xs font-medium py-2 px-3 rounded-md transition-all cursor-pointer block border ${
      currentPath === path
        ? "bg-[#1e40af] text-white border-[#1e40af] shadow font-bold"
        : "text-gray-600 hover:text-[#1e40af] hover:bg-white border-transparent hover:border-gray-200 shadow-sm hover:shadow"
    }`;
  };

  return (
    <QcFiltersContext.Provider value={{ showFilters, toggleFilters }}>
      <div className="flex min-h-[calc(100vh-120px)] gap-4 bg-white">
        {/* Sidebar */}
        <div className="w-64 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-bold text-gray-800 text-sm">QC Navigation</h3>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <Accordion
              type="multiple"
              className="w-full space-y-2"
            >
              {/* 1. Mix Design Dropdown */}
              <AccordionItem
                value="mix-design"
                className="border-none border rounded-lg bg-white shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#1e40af]" /> Mix Design
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/qc/mix-design/new">
                      <div className={getLinkClass("/qc/mix-design/new")}>
                        Add Mix Design
                      </div>
                    </Link>
                    <Link href="/qc/mix-design/list">
                      <div className={getLinkClass("/qc/mix-design/list")}>
                        Mix Design List
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Recipe Dropdown */}
              <AccordionItem
                value="recipe"
                className="border-none border rounded-lg bg-white shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-cyan-600" /> Recipe
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/qc/recipe/new">
                      <div className={getLinkClass("/qc/recipe/new")}>
                        Add Recipe
                      </div>
                    </Link>
                    <Link href="/qc/recipe/list">
                      <div className={getLinkClass("/qc/recipe/list")}>
                        Recipe List
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 3. Cube Test Dropdown */}
              <AccordionItem
                value="cube-test"
                className="border-none border rounded-lg bg-white shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                  <div className="flex items-center gap-2">
                    <TestTube className="h-4 w-4 text-purple-500" /> Cube Test
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/qc/cube-test/new">
                      <div className={getLinkClass("/qc/cube-test/new")}>
                        Add Cube Test
                      </div>
                    </Link>
                    <Link href="/qc/cube-test/list">
                      <div className={getLinkClass("/qc/cube-test/list")}>
                        Cube Test List
                      </div>
                    </Link>
                    <Link href="/qc/cube-test/report">
                      <div className={getLinkClass("/qc/cube-test/report")}>
                        Cube Test Report
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Batch List Dropdown */}
              <AccordionItem
                value="batch-list"
                className="border-none border rounded-lg bg-white shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-orange-500" /> Batch List
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/qc/batch/list">
                      <div className={getLinkClass("/qc/batch/list")}>
                        Batching List
                      </div>
                    </Link>
                    <Link href="/qc/batch/report">
                      <div className={getLinkClass("/qc/batch/report")}>
                        Batching Report
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 5. QC Setting Dropdown */}
              <AccordionItem
                value="qc-settings"
                className="border-none border rounded-lg bg-white shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-gray-50 px-3 py-2.5 text-sm font-semibold transition-colors">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-emerald-600" /> QC Setting
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-gray-50/50 pb-2 border-t">
                  <div className="flex flex-col space-y-1 mt-2 px-2">
                    <Link href="/qc/settings">
                      <div className={getLinkClass("/qc/settings")}>
                        QC Setting
                      </div>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col space-y-3 min-w-0">
          {/* Standardized Header Bar matching Customer & PO Reference Design */}
          <div className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border shadow-sm shrink-0 no-print">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">
                {title}
              </h2>
              <div className="h-4 w-px bg-gray-300" />
              <nav className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-wider">
                <Link href="/dashboard" className="hover:text-[#1e40af] transition-colors">Home</Link>
                <ChevronRight className="h-2.5 w-2.5 text-gray-400" />
                <Link href="/qc" className="hover:text-[#1e40af] transition-colors">QC</Link>
                {breadcrumbs.map((bc, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <ChevronRight className="h-2.5 w-2.5 text-gray-400" />
                      {isLast ? (
                        <span className="text-[#1e40af]">{bc.label}</span>
                      ) : (
                        bc.href ? (
                          <Link href={bc.href} className="hover:text-[#1e40af] transition-colors">
                            {bc.label}
                          </Link>
                        ) : (
                          <span>{bc.label}</span>
                        )
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link href="/qc/mix-design/new">
                <Button size="sm" className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer rounded">
                  <Plus className="h-3.5 w-3.5" /> Add Mix Design
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={toggleFilters}
                className={`font-black text-[9px] px-3 h-6 uppercase tracking-wider shadow-none border flex items-center gap-1.5 cursor-pointer rounded ${
                  showFilters ? "bg-slate-100 border-slate-400 text-slate-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Filter className="h-3 w-3" /> Filters
              </Button>
            </div>
          </div>

          {/* Children Page Content */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </QcFiltersContext.Provider>
  );
}
