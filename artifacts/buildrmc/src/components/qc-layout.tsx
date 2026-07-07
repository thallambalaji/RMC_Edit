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
    return `text-[11px] font-bold py-2 px-3 rounded-lg transition-all cursor-pointer block border ${
      currentPath === path
        ? "bg-[#fff7ed] text-[#ea580c] border-orange-100/50 shadow-sm font-extrabold"
        : "text-slate-600 hover:text-[#ea580c] hover:bg-orange-50/40 border-transparent hover:border-orange-100/50"
    }`;
  };

  const getDefaultAccordions = (): string[] => {
    if (currentPath.startsWith("/qc/mix-design")) return ["mix-design"];
    if (currentPath.startsWith("/qc/recipe")) return ["recipe"];
    if (currentPath.startsWith("/qc/cube-test")) return ["cube-test"];
    if (currentPath.startsWith("/qc/batch")) return ["batch-list"];
    if (currentPath.startsWith("/qc/settings")) return ["qc-settings"];
    return [];
  };

  return (
    <QcFiltersContext.Provider value={{ showFilters, toggleFilters }}>
      <div className="flex min-h-[calc(100vh-120px)] gap-4 bg-transparent">
        {/* Sidebar */}
        <div className="w-60 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 no-print">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">QC Navigation</h3>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <Accordion
              type="multiple"
              defaultValue={getDefaultAccordions()}
              className="w-full space-y-2"
            >
              {/* 1. Mix Design Dropdown */}
              <AccordionItem
                value="mix-design"
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#ea580c]" /> Mix Design
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
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
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-[#ea580c]" /> Recipe
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
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
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <TestTube className="h-4 w-4 text-[#ea580c]" /> Cube Test
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
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
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#ea580c]" /> Batch List
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
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
                className="border-none rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline hover:bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-700 transition-colors uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-[#ea580c]" /> QC Setting
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/20 pb-2 border-t border-slate-50">
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
        <div className="flex-1 flex flex-col space-y-3.5 min-w-0 pr-1">
          {/* Standardized Header Bar matching Customer & PO Reference Design */}
          <div className="flex items-center justify-between bg-white p-2.5 px-4 rounded-2xl border border-slate-100 shadow-sm shrink-0 no-print">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-tight">
                {title}
              </h2>
              <div className="h-4 w-px bg-slate-200" />
              <nav className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                <Link href="/dashboard" className="hover:text-[#ea580c] transition-colors">Home</Link>
                <ChevronRight className="h-2.5 w-2.5" />
                <Link href="/qc" className="hover:text-[#ea580c] transition-colors">QC</Link>
                {breadcrumbs.map((bc, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <ChevronRight className="h-2.5 w-2.5" />
                      {isLast ? (
                        <span className="text-[#ea580c]">{bc.label}</span>
                      ) : (
                        bc.href ? (
                          <Link href={bc.href} className="hover:text-[#ea580c] transition-colors">
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
                <Button size="sm" className="bg-[#ea580c] hover:bg-[#d97706] text-white font-extrabold text-[9px] px-3.5 h-6.5 uppercase tracking-wider shadow-none border-0 flex items-center gap-1.5 cursor-pointer rounded-lg transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add Mix Design
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={toggleFilters}
                className={`font-extrabold text-[9px] px-3.5 h-6.5 uppercase tracking-wider shadow-none border rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                  showFilters ? "bg-orange-50 border-orange-200 text-[#ea580c]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
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
